# Architecture Details — QuranReview

**Parent Document:** [design.md](./design.md)

---

## 1. Complete Data Flow Diagrams

### 1.1 User Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as AuthModal
    participant AS as AuthService
    participant SC as SupabaseClient
    participant SB as Supabase Auth
    participant DB as PostgreSQL
    participant SM as StateManager
    participant R as Router
    
    U->>UI: Enter username/password
    UI->>AS: login(username, password)
    AS->>AS: Convert username to email format
    Note over AS: username@quranreview.local
    AS->>SC: signInWithPassword(email, password)
    SC->>SB: POST /auth/v1/token
    SB->>DB: Validate credentials
    DB-->>SB: User found
    SB-->>SC: {access_token, refresh_token, user}
    SC-->>AS: {data: {user, session}, error: null}
    AS->>SC: fetchProfile(user.id)
    SC->>DB: SELECT * FROM profiles WHERE id = user.id
    DB-->>SC: Profile data
    SC-->>AS: Profile object
    AS->>SM: set('currentUser', profile)
    AS->>SM: set('session', session)
    SM->>SM: persist() to localStorage
    SM-->>UI: notify('currentUser') observers
    UI->>R: navigateTo(redirectPage)
    R->>U: Render dashboard
```

### 1.2 Task Submission Flow (Student)

```mermaid
sequenceDiagram
    participant S as Student
    participant UI as SoumissionPage
    participant ARM as AudioRecordModal
    participant MR as MediaRecorder API
    participant TS as TasksService
    participant SB as Supabase Storage
    participant DB as PostgreSQL
    participant Edge as Edge Function
    participant WP as Web Push Service
    participant T as Teacher Device
    
    S->>UI: Navigate to Soumettre page
    UI->>DB: Fetch available tasks
    DB-->>UI: Task list
    S->>UI: Select task, click "Enregistrer"
    UI->>ARM: open()
    ARM->>MR: getUserMedia({audio: true})
    MR-->>ARM: MediaStream
    ARM->>MR: start()
    S->>ARM: Speak (record audio)
    Note over S,ARM: Recording duration: 30s - 5min
    S->>ARM: Click "Arrêter"
    ARM->>MR: stop()
    MR-->>ARM: Blob (audio/webm)
    S->>ARM: Click "Soumettre"
    ARM->>TS: submitTask(taskId, audioBlob, metadata)
    TS->>SB: Upload audio file
    Note over TS,SB: Path: submissions/{userId}/{taskId}_{timestamp}.webm
    SB-->>TS: {url, path}
    TS->>DB: INSERT INTO submissions (task_id, student_id, audio_url, status)
    TS->>DB: UPDATE tasks SET status = 'submitted'
    DB-->>TS: Success
    TS->>Edge: invoke('send-push', {teacher_id, title, body, url})
    Edge->>DB: SELECT subscription FROM push_subscriptions WHERE user_id = teacher_id
    DB-->>Edge: Subscription object
    Edge->>WP: web-push.sendNotification(subscription, payload)
    WP->>T: Push notification
    T->>T: Show notification: "Nouvelle soumission de {student}"
    TS-->>UI: Success
    UI->>S: Toast "Soumission réussie!"
```

### 1.3 Grading Flow (Teacher)

```mermaid
sequenceDiagram
    participant T as Teacher
    participant UI as TeacherSoumissionsSection
    participant AP as AudioPlayer
    participant GS as GradingService
    participant DB as PostgreSQL
    participant Edge as Edge Function
    participant S as Student Device
    
    T->>UI: View pending submissions
    UI->>DB: SELECT * FROM submissions WHERE status='submitted' AND teacher_id=...
    DB-->>UI: Submissions list
    T->>UI: Click on submission
    UI->>AP: play(audioUrl)
    AP->>AP: Load and play audio
    T->>AP: Listen to audio
    T->>UI: Enter grade (0-100) and feedback
    T->>UI: Click "Valider"
    UI->>GS: gradeSubmission(submissionId, {grade, feedback})
    GS->>DB: UPDATE submissions SET status='graded', awarded_points=grade, feedback=...
    GS->>DB: INSERT INTO points_log (student_id, points, source)
    GS->>DB: UPDATE profiles SET total_points = total_points + grade
    GS->>DB: UPDATE daily_streak (if applicable)
    DB-->>GS: Success
    GS->>Edge: invoke('send-push', {student_id, title: 'Note reçue', body: feedback})
    Edge->>S: Push notification
    S->>S: Show notification with grade
    GS-->>UI: Success
    UI->>T: Toast "Note enregistrée"
    UI->>UI: Refresh submissions list
```

### 1.4 Offline Sync Flow

```mermaid
sequenceDiagram
    participant U as User
    participant App as Application
    participant Nav as Navigator.onLine
    participant Queue as OfflineSyncQueue
    participant IDB as IndexedDB
    participant SB as Supabase
    
    Note over U,App: User performs action
    U->>App: Action (e.g., gradeSubmission)
    App->>Nav: Check online status
    
    alt User is online
        App->>SB: Execute operation directly
        SB-->>App: Success/Failure
        App->>U: Show result
    else User is offline
        App->>Queue: enqueue(operation)
        Queue->>IDB: persist({id, operation, retries: 0, timestamp})
        IDB-->>Queue: Saved
        Queue-->>App: Queued
        App->>U: Toast "Mis en file d'attente (hors ligne)"
    end
    
    Note over App,Nav: Connection restored
    Nav->>App: 'online' event
    App->>Queue: processQueue()
    Queue->>IDB: loadPendingOperations()
    IDB-->>Queue: [operation1, operation2, ...]
    
    loop For each operation
        Queue->>SB: execute(operation)
        alt Success
            SB-->>Queue: Success
            Queue->>IDB: deleteOperation(id)
        else Failure
            SB-->>Queue: Error
            Queue->>IDB: UPDATE operation SET retries = retries + 1
            alt retries < 3
                Queue->>Queue: wait(2^retries * 1000ms)
                Note over Queue: Exponential backoff
            else retries >= 3
                Queue->>IDB: deleteOperation(id)
                Queue->>App: logError(operation)
            end
        end
    end
    
    Queue-->>App: Sync complete
    App->>U: Toast "Synchronisation terminée"
```

---

## 2. Pattern Implementations

### 2.1 State Manager (Observer Pattern)

```javascript
/**
 * StateManager: Centralized reactive state management
 * Pattern: Observer (Pub/Sub)
 * Location: frontend/src/core/state.js
 */

class StateManager {
  // Private fields
  #state = new Map();
  #subscribers = new Map();
  #persistTimer = null;
  #persistKeys = new Set(['currentUser', 'session', 'theme', 'language', 'settings']);
  
  constructor() {
    this.load();
  }
  
  /**
   * Get state value by key
   * @param {string} key - State key
   * @returns {any} State value or null
   */
  get(key) {
    return this.#state.get(key) ?? null;
  }
  
  /**
   * Set state value and notify subscribers
   * @param {string} key - State key
   * @param {any} value - New value
   */
  set(key, value) {
    const oldValue = this.#state.get(key);
    
    // Check if value actually changed
    if (this.#deepEqual(oldValue, value)) {
      return; // No change, don't notify
    }
    
    this.#state.set(key, value);
    this.#notify(key, value, oldValue);
    
    // Persist if key is marked for persistence
    if (this.#persistKeys.has(key)) {
      this.#schedulePersist();
    }
  }
  
  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {Function} callback - Callback(newValue, oldValue)
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.#subscribers.has(key)) {
      this.#subscribers.set(key, new Set());
    }
    
    this.#subscribers.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.#subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.#subscribers.delete(key);
        }
      }
    };
  }
  
  /**
   * Notify all subscribers of a key
   * @private
   */
  #notify(key, newValue, oldValue) {
    const callbacks = this.#subscribers.get(key);
    if (!callbacks) return;
    
    callbacks.forEach(callback => {
      try {
        callback(newValue, oldValue);
      } catch (error) {
        console.error(`[StateManager] Subscriber error for key "${key}":`, error);
      }
    });
  }
  
  /**
   * Schedule persistence to localStorage (debounced)
   * @private
   */
  #schedulePersist() {
    clearTimeout(this.#persistTimer);
    this.#persistTimer = setTimeout(() => {
      this.persist();
    }, 300); // 300ms debounce
  }
  
  /**
   * Persist state to localStorage
   */
  persist() {
    try {
      const persistData = {};
      this.#persistKeys.forEach(key => {
        const value = this.#state.get(key);
        if (value !== undefined) {
          persistData[key] = value;
        }
      });
      
      localStorage.setItem('quranreview_state', JSON.stringify(persistData));
    } catch (error) {
      console.error('[StateManager] Failed to persist state:', error);
    }
  }
  
  /**
   * Load state from localStorage
   */
  load() {
    try {
      const saved = localStorage.getItem('quranreview_state');
      if (saved) {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([key, value]) => {
          this.#state.set(key, value);
        });
      }
    } catch (error) {
      console.error('[StateManager] Failed to load state:', error);
    }
  }
  
  /**
   * Deep equality check
   * @private
   */
  #deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => this.#deepEqual(a[key], b[key]));
  }
  
  /**
   * Clear all state (for logout)
   */
  clear() {
    this.#state.clear();
    localStorage.removeItem('quranreview_state');
    this.#notify('*', null, null); // Notify all subscribers
  }
}

// Export singleton instance
export const stateManager = new StateManager();
```

### 2.2 Router (Lazy Loading)

```javascript
/**
 * Router: SPA navigation with lazy loading
 * Pattern: Lazy Initialization + Cache
 * Location: frontend/src/core/router.js
 */

class Router {
  #routes = new Map();
  #moduleCache = new Map();
  #currentRoute = null;
  #listeners = new Set();
  
  constructor() {
    // Listen to browser navigation
    window.addEventListener('popstate', () => this.#handlePopState());
    
    // Intercept link clicks
    document.addEventListener('click', (e) => this.#handleClick(e));
  }
  
  /**
   * Register a route with lazy loader
   * @param {string} path - Route path (e.g., '/home', '/teacher')
   * @param {Function} loader - Async function that returns module
   */
  register(path, loader) {
    this.#routes.set(path, {
      path,
      loader,
      guards: []
    });
  }
  
  /**
   * Add route guard (e.g., auth check)
   * @param {string} path - Route path
   * @param {Function} guard - Guard function returning boolean or Promise<boolean>
   */
  addGuard(path, guard) {
    const route = this.#routes.get(path);
    if (route) {
      route.guards.push(guard);
    }
  }
  
  /**
   * Navigate to a page
   * @param {string} path - Route path
   * @param {Object} params - Query parameters
   */
  async navigateTo(path, params = {}) {
    const route = this.#routes.get(path);
    
    if (!route) {
      console.error(`[Router] Route not found: ${path}`);
      return;
    }
    
    // Run guards
    for (const guard of route.guards) {
      const allowed = await guard();
      if (!allowed) {
        console.warn(`[Router] Navigation to ${path} blocked by guard`);
        return;
      }
    }
    
    // Update browser history
    const url = this.#buildUrl(path, params);
    window.history.pushState({ path, params }, '', url);
    
    // Load and render module
    await this.#loadAndRender(route, params);
  }
  
  /**
   * Load module (with caching)
   * @private
   */
  async #loadAndRender(route, params) {
    try {
      // Check cache first
      let module = this.#moduleCache.get(route.path);
      
      if (!module) {
        // Lazy load module
        console.log(`[Router] Loading module for ${route.path}`);
        module = await route.loader();
        this.#moduleCache.set(route.path, module);
      }
      
      // Render module
      if (module.render) {
        await module.render(params);
      }
      
      // Update current route
      this.#currentRoute = { path: route.path, params };
      
      // Notify listeners
      this.#notifyListeners();
      
    } catch (error) {
      console.error(`[Router] Failed to load route ${route.path}:`, error);
      // TODO: Show error page
    }
  }
  
  /**
   * Build URL with query parameters
   * @private
   */
  #buildUrl(path, params) {
    const query = new URLSearchParams(params).toString();
    return query ? `${path}?${query}` : path;
  }
  
  /**
   * Handle browser back/forward
   * @private
   */
  #handlePopState() {
    const state = window.history.state;
    if (state && state.path) {
      const route = this.#routes.get(state.path);
      if (route) {
        this.#loadAndRender(route, state.params || {});
      }
    }
  }
  
  /**
   * Intercept link clicks for SPA navigation
   * @private
   */
  #handleClick(event) {
    const link = event.target.closest('a[data-page]');
    if (!link) return;
    
    event.preventDefault();
    const page = link.dataset.page;
    const params = JSON.parse(link.dataset.params || '{}');
    this.navigateTo(page, params);
  }
  
  /**
   * Get current route
   * @returns {Object} {path, params}
   */
  getCurrentRoute() {
    return this.#currentRoute;
  }
  
  /**
   * Subscribe to route changes
   * @param {Function} callback - Callback(route)
   * @returns {Function} Unsubscribe function
   */
  onRouteChange(callback) {
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }
  
  /**
   * Notify route change listeners
   * @private
   */
  #notifyListeners() {
    this.#listeners.forEach(callback => {
      try {
        callback(this.#currentRoute);
      } catch (error) {
        console.error('[Router] Listener error:', error);
      }
    });
  }
}

// Export singleton instance
export const router = new Router();

// Register routes with lazy loaders
router.register('/home', () => import('../pages/HomePage.js'));
router.register('/teacher', () => import('../pages/TeacherPage.js'));
router.register('/admin', () => import('../pages/AdminPage.js'));
router.register('/hifz', () => import('../pages/HifzPage.js'));
router.register('/ward', () => import('../pages/WardPage.js'));
// ... other routes

// Add auth guard to protected routes
const authGuard = () => {
  const user = stateManager.get('currentUser');
  if (!user) {
    router.navigateTo('/login');
    return false;
  }
  return true;
};

router.addGuard('/home', authGuard);
router.addGuard('/teacher', authGuard);
router.addGuard('/admin', authGuard);
```

### 2.3 Offline Sync Queue (Strategy Pattern)

```javascript
/**
 * OfflineSyncQueue: Queue operations when offline, sync when online
 * Pattern: Strategy + Queue
 * Location: frontend/src/services/offline-sync.js
 */

class OfflineSyncQueue {
  #queue = [];
  #isProcessing = false;
  #db = null; // IndexedDB instance
  
  constructor() {
    this.#initIndexedDB();
    this.#setupOnlineListener();
  }
  
  /**
   * Initialize IndexedDB for persistent queue
   * @private
   */
  async #initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('QuranReviewQueue', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.#db = request.result;
        this.#loadQueue();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('operations')) {
          db.createObjectStore('operations', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }
  
  /**
   * Load pending operations from IndexedDB
   * @private
   */
  async #loadQueue() {
    const transaction = this.#db.transaction(['operations'], 'readonly');
    const store = transaction.objectStore('operations');
    const request = store.getAll();
    
    request.onsuccess = () => {
      this.#queue = request.result || [];
      console.log(`[OfflineSync] Loaded ${this.#queue.length} pending operations`);
    };
  }
  
  /**
   * Setup listener for online event
   * @private
   */
  #setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('[OfflineSync] Connection restored, processing queue');
      this.processQueue();
    });
  }
  
  /**
   * Enqueue an operation
   * @param {Object} operation - {type, method, args}
   */
  async enqueue(operation) {
    const item = {
      operation,
      timestamp: Date.now(),
      retries: 0,
    };
    
    // Add to in-memory queue
    this.#queue.push(item);
    
    // Persist to IndexedDB
    const transaction = this.#db.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');
    store.add(item);
    
    console.log('[OfflineSync] Operation queued:', operation.type);
  }
  
  /**
   * Process the queue
   */
  async processQueue() {
    if (this.#isProcessing) {
      console.log('[OfflineSync] Already processing');
      return;
    }
    
    if (!navigator.onLine) {
      console.log('[OfflineSync] Still offline, skipping');
      return;
    }
    
    this.#isProcessing = true;
    
    while (this.#queue.length > 0) {
      const item = this.#queue[0];
      
      try {
        await this.#executeOperation(item.operation);
        
        // Success: remove from queue
        this.#queue.shift();
        await this.#removeFromIndexedDB(item.id);
        
        console.log('[OfflineSync] Operation synced:', item.operation.type);
        
      } catch (error) {
        console.error('[OfflineSync] Operation failed:', error);
        
        item.retries++;
        
        if (item.retries >= 3) {
          // Max retries reached, give up
          console.error('[OfflineSync] Max retries reached, discarding:', item.operation);
          this.#queue.shift();
          await this.#removeFromIndexedDB(item.id);
        } else {
          // Exponential backoff
          const delay = Math.pow(2, item.retries) * 1000;
          console.log(`[OfflineSync] Retrying in ${delay}ms`);
          await this.#sleep(delay);
        }
      }
    }
    
    this.#isProcessing = false;
    console.log('[OfflineSync] Queue processing complete');
  }
  
  /**
   * Execute an operation
   * @private
   */
  async #executeOperation(operation) {
    const { type, method, args } = operation;
    
    // Dynamically import the service
    const serviceName = type; // e.g., 'TasksService'
    const service = await import(`./services/${serviceName}.js`);
    
    // Call the method
    if (service[method]) {
      return await service[method](...args);
    } else {
      throw new Error(`Method ${method} not found in ${serviceName}`);
    }
  }
  
  /**
   * Remove operation from IndexedDB
   * @private
   */
  async #removeFromIndexedDB(id) {
    const transaction = this.#db.transaction(['operations'], 'readwrite');
    const store = transaction.objectStore('operations');
    store.delete(id);
  }
  
  /**
   * Sleep utility
   * @private
   */
  #sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get queue size
   */
  getQueueSize() {
    return this.#queue.length;
  }
}

// Export singleton instance
export const offlineSyncQueue = new OfflineSyncQueue();
```

---

## 3. Module Dependency Graph

```mermaid
graph TD
    main[main.js] --> router[core/router.js]
    main --> state[core/state.js]
    main --> ui[core/ui.js]
    main --> auth[services/auth.js]
    
    router --> pages[pages/*]
    
    pages --> components[components/*]
    pages --> services[services/*]
    
    components --> ui
    
    services --> supabaseClient[services/supabase-client.js]
    services --> state
    services --> logger[core/logger.js]
    services --> cache[core/apiCache.js]
    
    auth --> supabaseAuth[services/supabase-auth.js]
    supabaseAuth --> supabaseClient
    
    style main fill:#ffcdd2
    style router fill:#f8bbd0
    style state fill:#e1bee7
    style services fill:#c5cae9
    style supabaseClient fill:#b2dfdb
```

**Dependency Rules:**
1. **No circular dependencies**: Enforced by module organization
2. **Top-down only**: Lower layers cannot import from higher layers
3. **Service isolation**: Services only depend on core modules and Supabase client
4. **Page autonomy**: Pages can import any layer below them

---

## 4. Lazy Loading Algorithm

### Pseudocode

```
ALGORITHM LazyLoadModule(path)
INPUT: path (string) - Route path
OUTPUT: module (object) - Loaded module

BEGIN
  // Check module cache
  IF moduleCache.has(path) THEN
    RETURN moduleCache.get(path)
  END IF
  
  // Find route configuration
  route ← routes.get(path)
  IF route is NULL THEN
    THROW Error("Route not found")
  END IF
  
  // Execute loader (dynamic import)
  TRY
    startTime ← performance.now()
    module ← AWAIT route.loader()
    endTime ← performance.now()
    loadTime ← endTime - startTime
    
    // Log performance
    logger.info(`Module ${path} loaded in ${loadTime}ms`)
    
    // Cache module
    moduleCache.set(path, module)
    
    RETURN module
    
  CATCH error
    logger.error(`Failed to load module ${path}:`, error)
    // Show error page
    RETURN errorModule
  END TRY
END
```

### Performance Characteristics

- **First Load:** ~100-300ms (network + parse)
- **Cached Load:** <1ms (memory lookup)
- **Bundle Size Reduction:** ~60% (vs. loading all pages upfront)

**Example:**
- Without lazy loading: 200KB initial bundle
- With lazy loading: 80KB initial + 120KB on-demand

---

**Next Module:** [design-components.md](./design-components.md)

