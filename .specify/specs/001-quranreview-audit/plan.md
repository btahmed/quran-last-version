Based on the existing codebase analysis and constitution principles, I'll create an implementation plan for the Quran Review application's architecture:

```markdown
# Implementation Plan: Quran Review Architecture

## Technical Context
**Feature**: Core application architecture  
**Description**: PWA for Quran memorization with logging, offline support, and RTL UI  
**Existing Components**:
- Frontend: Vanilla JS (script.js), HTML5 (index.html), CSS (style.css)
- Infrastructure: Service Worker (sw.js), PWA manifest (manifest.json)
- Tooling: GitHub Actions CI (.github/workflows), Playwright tests (tests/)
- Backend: Django REST API (implied by Logger.api calls)

**Key Dependencies**:
- GSAP animation library
- Amiri/Noto Naskh Arabic fonts
- Fetch API for network requests
- Web Storage API (implied by Logger.store)

**Integration Points**:
- Quran metadata API (quran-metadata.json)
- Audio playback API (implied by Logger.audio)
- Django authentication (implied by Logger.auth)

**Unknowns**:
1. Backend API endpoint structure (NEEDS CLARIFICATION)
2. Database schema for user progress (NEEDS CLARIFICATION)
3. Audio source implementation details (NEEDS CLARIFICATION)

## Constitution Check
### Principle 1: Code Quality
- ✅ JSDoc used in Logger
- ❌ Missing ESLint/Prettier config
- ❌ CSS lacks BEM conventions
- *Action: Add linting configs*

### Principle 2: Security
- ✅ HTTPS enforced in Logger.api
- ❌ No CSP headers in index.html
- ❌ No visible input sanitization
- *Action: Implement CSP and sanitization*

### Principle 3: Performance
- ✅ Service Worker caching
- ❌ No lazy loading implemented
- ❌ Bundle size unverified
- *Action: Audit bundle size*

### Principle 4: Accessibility
- ✅ Semantic HTML elements
- ❌ No ARIA attributes in index.html
- ❌ Color contrast unverified
- *Action: Add ARIA and contrast checks*

### Principle 5: RTL Support
- ✅ `dir="rtl"` in HTML
- ✅ Arabic font stack
- ✅ CSS logical properties
- *Status: Compliant*

### Principle 6: Offline-First PWA
- ✅ Service Worker (sw.js)
- ✅ Manifest (manifest.json)
- ❌ No IndexedDB usage
- *Action: Implement IndexedDB*

### Principle 7: Clean Architecture
- ❌ UI/logic mixed in script.js
- ❌ No state management system
- ❌ Tight service coupling
- *Action: Refactor modules*

### Principle 8: Testability
- ✅ Playwright config exists
- ❌ Low test coverage
- ❌ Missing CI pipeline
- *Action: Add GitHub Actions*

## Gate Evaluation
### Gate 1: Technical Context Complete
- ❌ Missing backend/database details
- ❌ Audio implementation unclear
- **Result**: ERROR - Blocked on clarifications

### Gate 2: Constitution Adherence
- ❌ 5/8 principles violated
- ❌ Critical security gaps
- **Result**: ERROR - Requires remediation

## Phase 0: Research Tasks
1. **Backend API Structure**  
   - Investigate Django API endpoints  
   - Document authentication flow  
   - Example: `GET /api/surah/1/ayahs`

2. **Database Schema**  
   - Analyze user progress storage requirements  
   - Map entities: User, Session, MemorizationRecord  
   - Evaluate SQLite vs PostgreSQL tradeoffs

3. **Audio Implementation**  
   - Research Quran audio APIs  
   - Evaluate Web Audio API integration  
   - Document playback requirements

4. **State Management**  
   - Research publish/subscribe patterns  
   - Evaluate Redux vs custom solutions  
   - Document state transition requirements

*Output: research.md with architecture decisions*

## Phase 1: Design Components
### Data Model (data-model.md)
```markdown
### Entities
**User**  
- id: string  
- progress: ProgressRecord[]  

**ProgressRecord**  
- surah: number  
- ayah: number  
- status: 'memorized' | 'reviewing'  
- lastReviewed: Date  

### Relationships
User 1--* ProgressRecord
```

### API Contracts (contracts/api.yaml)
```yaml
paths:
  /api/progress:
    get:
      summary: Get user progress
      responses:
        200:
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ProgressRecord'
```

### Quickstart Guide (quickstart.md)
```markdown
## Setup
1. `npm install` - Install dependencies
2. `playwright install` - Setup testing

## Development
- Frontend: `live-server`
- Tests: `playwright test`

## Architecture
- Core: `src/` (refactored modules)
- Services: `services/` (API, storage)
- State: `state/` (pub/sub manager)
```

## Phase 2: Implementation Tasks
1. Refactor monolithic script.js into:
   - `src/logger.js`
   - `src/api.js`
   - `src/state.js`
   - `src/audio.js`

2. Implement IndexedDB wrapper:
   - `services/storage.js`

3. Add CSP headers to index.html:
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
   ```

4. Create GitHub Actions pipeline:
   - Playwright tests on PR
   - Bundle size check
   - Lighthouse audit

*Agent context updated with IndexedDB/CSP*

## Branch Information
- **Branch**: `arch-refactor`
- **Plan Path**: `.specify/plans/arch-refactor.md`
- **Artifacts**: 
  - research.md
  - data-model.md
  - contracts/api.yaml
  - quickstart.md
```

This plan addresses architectural gaps while aligning with constitutional principles. The next step is to resolve research items before proceeding with implementation.