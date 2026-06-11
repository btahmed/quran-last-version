# Security & Performance — QuranReview

**Parent Document:** [design.md](./design.md)

---

## 1. Security Architecture

### 1.1 Defense in Depth

```
┌───────────────────────────────────────┐
│  Browser Security (CSP, HTTPS)        │
├───────────────────────────────────────┤
│  Client Validation (Input sanit.)    │
├───────────────────────────────────────┤
│  Supabase Auth (JWT tokens)          │
├───────────────────────────────────────┤
│  Row Level Security (RLS)            │
├───────────────────────────────────────┤
│  Database Constraints (CHECK, etc.)  │
└───────────────────────────────────────┘
```

### 1.2 Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://api.alquran.cloud;
  connect-src 'self' https://*.supabase.co https://api.alquran.cloud;
  media-src 'self' https://cdn.islamic.network blob:;
  worker-src 'self';
">
```

### 1.3 Input Validation Layer

```javascript
// validators.js
export const Validators = {
  username: (value) => {
    if (typeof value !== 'string') return { valid: false, error: 'Must be string' };
    if (value.length < 3 || value.length > 50) return { valid: false, error: 'Length 3-50' };
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return { valid: false, error: 'Invalid chars' };
    return { valid: true };
  },
  
  points: (value) => {
    if (typeof value !== 'number') return { valid: false, error: 'Must be number' };
    if (value < 0 || value > 100) return { valid: false, error: 'Range 0-100' };
    return { valid: true };
  },
  
  surahId: (value) => {
    if (typeof value !== 'number') return { valid: false, error: 'Must be number' };
    if (value < 1 || value > 114) return { valid: false, error: 'Range 1-114' };
    return { valid: true };
  }
};
```

### 1.4 HTML Sanitization

```javascript
// Sanitize user-generated content
export function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html; // Escapes HTML entities
  return div.innerHTML;
}

// Usage
const feedback = sanitizeHTML(userInput);
```

### 1.5 Rate Limiting (Edge Functions)

```typescript
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(userId);
  
  if (!record || now > record.resetAt) {
    rateLimiter.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}
```

---

## 2. Performance Optimization

### 2.1 Core Web Vitals Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **LCP** | < 2.5s | Lazy load images, preload critical CSS, code splitting |
| **FID** | < 100ms | Debounce inputs (300ms), minimize main thread work |
| **CLS** | < 0.1 | Reserve space for images, avoid dynamic injections |

### 2.2 Code Splitting Strategy

```javascript
// vite.config.js (for future bundling)
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-chart': ['chart.js'],
          'admin': ['./src/pages/AdminPage.js', './src/pages/admin/*.js'],
          'teacher': ['./src/pages/TeacherPage.js', './src/pages/teacher/*.js']
        }
      }
    }
  }
};
```

**Bundle Targets:**
- `main.js`: ~30KB (core + router + state)
- `vendor-supabase.js`: ~50KB
- `vendor-chart.js`: ~40KB
- `page-*.js`: ~40-50KB each (lazy-loaded)

**Total Initial Load:** ~80KB (main + vendor-supabase)

### 2.3 Service Worker Cache Strategy

```javascript
// sw.js
const CACHE_STRATEGIES = {
  static: 'cache-first',      // CSS, JS, fonts
  api: 'stale-while-revalidate', // API responses (5min TTL)
  audio: 'cache-on-demand'     // Audio files
};

async function staleWhileRevalidate(request, maxAge) {
  const cache = await caches.open('quranreview-v2');
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    cache.put(request, response.clone());
    return response;
  });
  
  if (cached) {
    const age = Date.now() - new Date(cached.headers.get('date')).getTime();
    if (age < maxAge) return cached; // Return stale, revalidate in background
  }
  
  return fetchPromise;
}
```

### 2.4 API Response Caching

```javascript
// core/apiCache.js
class APICache {
  #cache = new Map();
  
  get(key) {
    const entry = this.#cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.#cache.delete(key);
      return null;
    }
    return entry.value;
  }
  
  set(key, value, ttl = 5 * 60 * 1000) {
    this.#cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }
}

export const apiCache = new APICache();
```

### 2.5 Image Optimization

```html
<!-- Lazy loading -->
<img src="avatar.jpg" loading="lazy" alt="User avatar">

<!-- Responsive images -->
<img 
  srcset="image-320.webp 320w,
          image-640.webp 640w,
          image-1024.webp 1024w"
  sizes="(max-width: 640px) 320px,
         (max-width: 1024px) 640px,
         1024px"
  src="image-640.webp"
  loading="lazy"
  alt="Description">
```

### 2.6 Resource Prioritization

```html
<!-- Preload critical resources -->
<link rel="preload" href="/style.css" as="style">
<link rel="preload" href="/src/main.js" as="script">
<link rel="preload" href="/fonts/Amiri-Regular.woff2" as="font" type="font/woff2" crossorigin>

<!-- Preconnect to external origins -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://api.alquran.cloud">
```

### 2.7 Debouncing and Throttling

```javascript
// Debounce search input
export function debounce(func, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

// Usage
const searchInput = document.querySelector('#search');
searchInput.addEventListener('input', debounce((e) => {
  performSearch(e.target.value);
}, 300));
```

---

## 3. Monitoring and Observability

### 3.1 Error Tracking (Sentry)

```javascript
// Initialize Sentry
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers.Authorization;
    }
    return event;
  }
});

// Capture error
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: 'task_submission' },
    user: { id: currentUserId }
  });
}
```

### 3.2 Performance Monitoring

```javascript
// Measure Core Web Vitals
import { onCLS, onFID, onLCP } from 'web-vitals';

onCLS(console.log);
onFID(console.log);
onLCP(console.log);

// Custom performance marks
performance.mark('page-load-start');
// ... load page
performance.mark('page-load-end');
performance.measure('page-load', 'page-load-start', 'page-load-end');

const measure = performance.getEntriesByName('page-load')[0];
console.log(`Page loaded in ${measure.duration}ms`);
```

---

## 4. Secrets Management

### Environment Variables

```bash
# .env.local (never commit)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VAPID_PUBLIC_KEY=BH...
VAPID_PRIVATE_KEY=XY... # Server-side only
```

```javascript
// config.js
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  },
  vapid: {
    publicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
    // Private key NEVER exposed to client
  }
};
```

---

**Next Module:** [design-testing.md](./design-testing.md)

