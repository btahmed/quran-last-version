# Testing Strategy & Correctness Properties — QuranReview

**Parent Document:** [design.md](./design.md)

---

## 1. Testing Strategy Overview

### 1.1 Test Pyramid

```
        /\
       /  \       E2E Tests (Playwright)         ~10% coverage
      /____\      Critical user flows
     /      \     
    /        \    Integration Tests (Vitest)     ~20% coverage
   /__________\   Supabase client, UI components
  /            \  
 /              \ Unit Tests (Vitest)             ~70% coverage
/________________\ Services, utils, core modules, PBT
```

### 1.2 Testing Approach by Layer

| Layer | Test Type | Coverage Target | Tools |
|-------|-----------|-----------------|-------|
| **Core** (state, router, cache) | Unit + PBT | 90% | Vitest + fast-check |
| **Services** (auth, tasks, hifz) | Unit + Integration | 85% | Vitest |
| **Components** (UI) | Integration + Snapshot | 70% | Vitest + Playwright |
| **Pages** | E2E | Key flows only | Playwright |

### 1.3 Property-Based Testing Applicability

**✅ PBT IS appropriate for:**
- **State management** (get/set round-trip, observer notification)
- **Data transformations** (export/import, serialization)
- **Validation logic** (input validators, sanitization)
- **Business logic** (points calculation, streak computation)
- **Cache behavior** (TTL, eviction strategies)
- **Retry logic** (exponential backoff, max attempts)

**❌ PBT is NOT appropriate for:**
- **UI rendering** (use snapshot tests)
- **External service integration** (Supabase, Push API) - use mocked integration tests
- **Performance metrics** (Lighthouse scores) - use benchmarks
- **Infrastructure** (database schema, RLS policies) - use schema tests
- **Configuration validation** - use example-based tests

### 1.4 Testing Library

- **Unit/Integration:** Vitest
- **Property-Based:** `@fast-check/vitest`
- **E2E:** Playwright
- **Accessibility:** axe-core + pa11y

---

## 2. Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: StateManager Get/Set Round-Trip

*For any* valid key-value pair, setting a value in StateManager and immediately getting it should return the exact same value.

**Validates:** Requirements 1.2 (state management), 1.5 (dependency injection)

**Test Implementation:**
```javascript
import { fc, test } from '@fast-check/vitest';
import { StateManager } from '../src/core/state.js';

test('StateManager preserves set values on get', () => {
  fc.assert(
    fc.property(
      fc.string(), // key
      fc.anything(), // value
      (key, value) => {
        const sm = new StateManager();
        sm.set(key, value);
        expect(sm.get(key)).toEqual(value);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 2: StateManager Observer Notification

*For any* state key, when the value changes, all subscribed observers should be notified exactly once with the new value.

**Validates:** Requirements 1.2 (reactive state management)

**Test Implementation:**
```javascript
test('StateManager notifies subscribers on change', () => {
  fc.assert(
    fc.property(
      fc.string(), // key
      fc.integer(), // initial value
      fc.integer(), // new value
      (key, val1, val2) => {
        fc.pre(val1 !== val2); // Ensure values differ
        
        const sm = new StateManager();
        let notificationCount = 0;
        let receivedValue = null;
        
        sm.subscribe(key, (newVal) => {
          notificationCount++;
          receivedValue = newVal;
        });
        
        sm.set(key, val1);
        expect(notificationCount).toBe(1);
        expect(receivedValue).toBe(val1);
        
        // Setting same value should NOT notify
        sm.set(key, val1);
        expect(notificationCount).toBe(1);
        
        // Setting different value should notify
        sm.set(key, val2);
        expect(notificationCount).toBe(2);
        expect(receivedValue).toBe(val2);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 3: API Cache TTL Behavior

*For any* cached value with TTL, retrieving it before expiration should return the cached value, and retrieving it after expiration should return null.

**Validates:** Requirements 4.9 (API caching)

**Test Implementation:**
```javascript
import { apiCache } from '../src/core/apiCache.js';

test('API cache respects TTL', () => {
  fc.assert(
    fc.property(
      fc.string(), // cache key
      fc.anything(), // cached value
      fc.integer({ min: 100, max: 1000 }), // TTL in ms
      async (key, value, ttl) => {
        apiCache.clear();
        apiCache.set(key, value, ttl);
        
        // Immediately: should return cached value
        expect(apiCache.get(key)).toEqual(value);
        
        // Wait half TTL: should still be cached
        await new Promise(resolve => setTimeout(resolve, ttl / 2));
        expect(apiCache.get(key)).toEqual(value);
        
        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, ttl / 2 + 100));
        expect(apiCache.get(key)).toBeNull();
      }
    ),
    { numRuns: 50 } // Fewer runs due to async timing
  );
});
```

### Property 4: Data Export/Import Round-Trip

*For any* user data object, exporting it to JSON and then importing it back should produce an equivalent object.

**Validates:** Requirements 6.10, 6.11 (data export/import)

**Test Implementation:**
```javascript
import { AnalyticsService } from '../src/services/analytics.js';

test('Export/Import preserves user data', () => {
  fc.assert(
    fc.property(
      fc.record({
        profile: fc.record({
          id: fc.uuid(),
          username: fc.string({ minLength: 3, maxLength: 20 }),
          total_points: fc.integer({ min: 0, max: 10000 })
        }),
        tasks: fc.array(fc.record({
          id: fc.uuid(),
          title: fc.string(),
          points: fc.integer({ min: 0, max: 100 })
        })),
        submissions: fc.array(fc.record({
          id: fc.uuid(),
          awarded_points: fc.integer({ min: 0, max: 100 })
        }))
      }),
      async (userData) => {
        // Export
        const exported = await AnalyticsService.exportData(userData, 'json');
        
        // Import
        const imported = await AnalyticsService.importData(exported);
        
        // Verify equivalence
        expect(imported).toEqual(userData);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 5: Points Calculation Correctness

*For any* sequence of point additions, the total points should equal the sum of all individual point values.

**Validates:** Requirements 6.14 (analytics), 9.13 (data integrity)

**Test Implementation:**
```javascript
test('Points calculation is cumulative', () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 1, maxLength: 50 }),
      (pointsSequence) => {
        const expectedTotal = pointsSequence.reduce((sum, pts) => sum + pts, 0);
        
        // Simulate adding points
        let calculatedTotal = 0;
        pointsSequence.forEach(pts => {
          calculatedTotal = CompetitionService.addPoints(calculatedTotal, pts);
        });
        
        expect(calculatedTotal).toBe(expectedTotal);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 6: Streak Calculation from Activity Sequence

*For any* sequence of activity dates, the daily streak should equal the number of consecutive days with activity from today backwards.

**Validates:** Requirements 6.7, 6.8 (streak calculation)

**Test Implementation:**
```javascript
test('Daily streak calculation from activity sequence', () => {
  fc.assert(
    fc.property(
      fc.array(fc.date({ min: new Date('2024-01-01'), max: new Date() })),
      (activityDates) => {
        // Sort dates descending (most recent first)
        const sorted = activityDates
          .map(d => d.toISOString().split('T')[0])
          .filter((v, i, a) => a.indexOf(v) === i) // unique dates
          .sort().reverse();
        
        const streak = AnalyticsService.calculateStreak(sorted);
        
        // Verify streak is consecutive from today
        const today = new Date().toISOString().split('T')[0];
        if (sorted.length === 0 || sorted[0] !== today) {
          expect(streak).toBe(0);
        } else {
          // Count consecutive days
          let expectedStreak = 1;
          for (let i = 1; i < sorted.length; i++) {
            const prevDate = new Date(sorted[i - 1]);
            const currDate = new Date(sorted[i]);
            const dayDiff = (prevDate - currDate) / (1000 * 60 * 60 * 24);
            
            if (dayDiff === 1) {
              expectedStreak++;
            } else {
              break;
            }
          }
          
          expect(streak).toBe(expectedStreak);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 7: Input Validation Rejects Invalid Inputs

*For any* input string containing only whitespace, validation should reject it and return an error.

**Validates:** Requirements 7.1 (input validation)

**Test Implementation:**
```javascript
import { Validators } from '../src/services/utils/validators.js';

test('Username validation rejects invalid inputs', () => {
  fc.assert(
    fc.property(
      fc.oneof(
        fc.string({ minLength: 0, maxLength: 2 }), // Too short
        fc.string({ minLength: 51 }), // Too long
        fc.string().map(s => s + '!@#$%'), // Invalid chars
        fc.string().map(s => '   '), // Whitespace only
      ),
      (invalidUsername) => {
        const result = Validators.username(invalidUsername);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }
    ),
    { numRuns: 100 }
  );
});

test('Username validation accepts valid inputs', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 3, maxLength: 50 })
        .filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
      (validUsername) => {
        const result = Validators.username(validUsername);
        expect(result.valid).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 8: HTML Sanitization Removes Malicious Content

*For any* string containing HTML script tags, sanitization should remove all executable code.

**Validates:** Requirements 7.2 (content sanitization), 7.4 (XSS prevention)

**Test Implementation:**
```javascript
import { sanitizeHTML } from '../src/services/utils/validators.js';

test('Sanitization removes script tags', () => {
  fc.assert(
    fc.property(
      fc.string(),
      fc.oneof(
        fc.constant('<script>alert("xss")</script>'),
        fc.constant('<img src=x onerror="alert(1)">'),
        fc.constant('<a href="javascript:alert(1)">click</a>'),
      ),
      (content, malicious) => {
        const input = content + malicious;
        const sanitized = sanitizeHTML(input);
        
        // Should not contain executable code
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('javascript:');
        
        // Should preserve safe content
        expect(sanitized).toContain(content.replace(/[<>]/g, ''));
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 9: Rate Limiting Enforces Thresholds

*For any* sequence of requests from the same user, rate limiting should block requests after the threshold is exceeded.

**Validates:** Requirements 7.7 (rate limiting)

**Test Implementation:**
```javascript
test('Rate limiter blocks after threshold', () => {
  fc.assert(
    fc.property(
      fc.uuid(), // userId
      fc.integer({ min: 50, max: 150 }), // numRequests
      (userId, numRequests) => {
        const RATE_LIMIT = 100;
        const rateLimiter = new RateLimiter(RATE_LIMIT, 60000);
        
        let allowedCount = 0;
        let blockedCount = 0;
        
        for (let i = 0; i < numRequests; i++) {
          if (rateLimiter.checkLimit(userId)) {
            allowedCount++;
          } else {
            blockedCount++;
          }
        }
        
        if (numRequests <= RATE_LIMIT) {
          expect(allowedCount).toBe(numRequests);
          expect(blockedCount).toBe(0);
        } else {
          expect(allowedCount).toBe(RATE_LIMIT);
          expect(blockedCount).toBe(numRequests - RATE_LIMIT);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Property 10: Retry Logic Respects Max Attempts

*For any* failing operation, the retry mechanism should attempt at most 3 times before giving up.

**Validates:** Requirements 7.8 (retry logic)

**Test Implementation:**
```javascript
test('Retry logic respects max attempts', () => {
  fc.assert(
    fc.property(
      fc.constant(new Error('Network failure')),
      async (error) => {
        let attemptCount = 0;
        const MAX_RETRIES = 3;
        
        const failingOperation = async () => {
          attemptCount++;
          throw error;
        };
        
        try {
          await retryWithBackoff(failingOperation, MAX_RETRIES);
        } catch (e) {
          // Expected to fail after max retries
        }
        
        expect(attemptCount).toBe(MAX_RETRIES);
      }
    ),
    { numRuns: 50 }
  );
});
```

### Property 11: Offline Queue Executes When Online

*For any* queued operation, when connection is restored, the operation should execute exactly once.

**Validates:** Requirements 6.16, 6.17 (offline mode)

**Test Implementation:**
```javascript
test('Offline queue processes operations when online', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          type: fc.constantFrom('TasksService', 'SubmissionsService'),
          method: fc.constantFrom('create', 'update', 'delete'),
          args: fc.array(fc.anything())
        }),
        { minLength: 1, maxLength: 10 }
      ),
      async (operations) => {
        const queue = new OfflineSyncQueue();
        const executedOps = [];
        
        // Mock execution
        queue._executeOperation = async (op) => {
          executedOps.push(op);
        };
        
        // Enqueue all operations (simulating offline)
        for (const op of operations) {
          await queue.enqueue(op);
        }
        
        // Process queue (simulating online)
        await queue.processQueue();
        
        // Verify all operations executed exactly once
        expect(executedOps.length).toBe(operations.length);
        operations.forEach((op, i) => {
          expect(executedOps[i]).toEqual(op);
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

---

## 3. Test Organization

```
tests/
├── unit/
│   ├── core/
│   │   ├── state-manager.test.js       # Properties 1, 2
│   │   ├── router.test.js
│   │   ├── api-cache.test.js           # Property 3
│   │   └── ui.test.js
│   ├── services/
│   │   ├── auth.test.js
│   │   ├── tasks.test.js
│   │   ├── competition.test.js         # Property 5
│   │   ├── analytics.test.js           # Properties 4, 6
│   │   └── offline-sync.test.js        # Properties 10, 11
│   └── utils/
│       ├── validators.test.js          # Properties 7, 8, 9
│       └── formatters.test.js
├── integration/
│   ├── supabase-client.test.js
│   ├── supabase-auth.test.js
│   ├── push-notifications.test.js
│   └── database-schema.test.js
└── e2e/
    ├── login.spec.js
    ├── task-submission.spec.js
    ├── grading-flow.spec.js
    └── accessibility.spec.js
```

---

## 4. Example Tests

### 4.1 Unit Test Example

```javascript
// tests/unit/services/auth.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../../src/services/auth.js';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should login with valid credentials', async () => {
    const result = await AuthService.login('test_user', 'password123');
    
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('session');
    expect(result.user.username).toBe('test_user');
  });
  
  it('should reject invalid credentials', async () => {
    await expect(
      AuthService.login('invalid', 'wrong')
    ).rejects.toThrow('Invalid credentials');
  });
  
  it('should logout and clear session', async () => {
    await AuthService.login('test_user', 'password123');
    await AuthService.logout();
    
    const session = await AuthService.getSession();
    expect(session).toBeNull();
  });
});
```

### 4.2 Integration Test Example

```javascript
// tests/integration/supabase-client.test.js
import { describe, it, expect } from 'vitest';
import { supabase } from '../../../src/services/supabase-client.js';

describe('Supabase Client Integration', () => {
  it('should fetch user profile', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'test_student')
      .single();
    
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('username');
    expect(data.username).toBe('test_student');
  });
  
  it('should respect RLS policies', async () => {
    // Try to access another user's data
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', 'other-user-id');
    
    // Should be blocked by RLS
    expect(data).toEqual([]);
  });
});
```

### 4.3 E2E Test Example

```javascript
// tests/e2e/task-submission.spec.js
import { test, expect } from '@playwright/test';

test('student can submit audio for task', async ({ page }) => {
  // 1. Login
  await page.goto('http://localhost:3456');
  await page.click('[data-testid="login-btn"]');
  await page.fill('#login-username', 'test_student');
  await page.fill('#login-password', 'test123');
  await page.click('#login-submit-btn');
  
  // 2. Navigate to submissions
  await expect(page).toHaveURL(/.*home/);
  await page.click('[data-page="soumettre"]');
  
  // 3. Record audio
  await page.click('[data-testid="record-audio-btn"]');
  await page.waitForTimeout(2000); // Record 2 seconds
  await page.click('[data-testid="stop-recording-btn"]');
  
  // 4. Submit
  await page.click('[data-testid="submit-recording-btn"]');
  
  // 5. Verify success
  await expect(page.locator('.toast')).toContainText('Soumission réussie');
  await expect(page.locator('[data-testid="submission-status"]')).toContainText('submitted');
});
```

---

## 5. CI/CD Testing Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Check code coverage
        run: npm run test:coverage
        # Fail if coverage < 80%
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

---

## 6. Coverage Requirements

| Module | Target Coverage | Rationale |
|--------|-----------------|-----------|
| **core/** | 90% | Critical infrastructure |
| **services/** | 85% | Business logic |
| **components/** | 70% | UI components (harder to test) |
| **pages/** | 60% | E2E tests cover flows |
| **Overall** | 80% | Project requirement |

---

**Document Complete.** All design modules created:
1. ✅ [design.md](./design.md) - Master overview
2. ✅ [design-architecture.md](./design-architecture.md) - System architecture
3. ✅ [design-components.md](./design-components.md) - Component specifications
4. ✅ [design-data.md](./design-data.md) - Data models & APIs
5. ✅ [design-security-performance.md](./design-security-performance.md) - Security & performance
6. ✅ [design-testing.md](./design-testing.md) - Testing strategy & properties

