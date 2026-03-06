Based on the provided source code and project context, I'll establish the project constitution. Here's the analysis and constitution update:

### Sync Impact Report
<!-- 
Version: 1.0.0 → 1.1.0 (minor bump: added new principles)
Modified Principles: 
  - Added Offline-First PWA principle
  - Added Observability principle
  - Added RTL Language Support principle
Added Sections: Governance amendment procedure
Templates Updated:
  ✅ constitution.md
  ⚠️ plan-template.md (requires update for new principles)
  ⚠️ spec-template.md (requires RTL/offline requirements)
  ⚠️ tasks-template.md (needs observability tasks)
Follow-up TODOs: 
  - Confirm ratification date with team
  - Update CI/CD pipeline docs
-->

## Quran Review Pro Edition Constitution
**Version:** 1.1.0  
**Ratified:** 2024-02-19 (TODO: confirm with team)  
**Last Amended:** 2025-03-15  

### Core Principles

1. **Code Quality**  
   All JavaScript MUST follow strict modular patterns with JSDoc annotations. CSS MUST use semantic variables and avoid !important overrides. Third-party libraries MUST be minimized (GSAP permitted for animations).  

2. **Security**  
   All API requests MUST use HTTPS with CORS protection. Service workers MUST implement cache integrity checks. User data MUST be encrypted at rest using Web Crypto API.

3. **Performance**  
   First Contentful Paint < 1.5s on 3G networks. Audio streaming MUST use adaptive bitrate. CSS MUST avoid layout thrashing during navigation animations.

4. **Accessibility**  
   WCAG 2.1 AA compliance REQUIRED. All interactive elements MUST have ARIA labels. Dark/light mode MUST respect OS preferences. Font scaling MUST preserve layout integrity.

5. **Observability**  
   Centralized logging MUST track user interactions, API calls, and state changes. Production errors MUST include stack traces. Console utilities MUST be tree-shaken in production builds.

6. **Offline-First PWA**  
   Core functionality MUST work offline. Service worker MUST cache critical assets. Storage quotas MUST be monitored with LRU eviction policy.

7. **RTL Language Support**  
   All layouts MUST support right-to-left rendering. Font metrics MUST be optimized for Arabic script. Text alignment MUST mirror correctly in RTL mode.

8. **Testability**  
   End-to-end tests MUST cover all user journeys. Audio playback MUST have mock implementations. CI pipeline MUST run Playwright tests before deployment.

### Governance
Amendments require:  
1. Documentation of proposed change in GitHub issue  
2. Approval from 2 core maintainers  
3. Version bump per semver rules:  
   - MAJOR: Principle removal/breaking change  
   - MINOR: New principle/feature  
   - PATCH: Clarifications/non-breaking edits  
4. Quarterly compliance reviews against production metrics  

---

### Summary
- **Version bump:** 1.0.0 → 1.1.0 (added 3 new principles)  
- **Files needing manual updates:**  
  - `.specify/templates/plan-template.md`  
  - `.specify/templates/spec-template.md`  
  - `.specify/templates/tasks-template.md`  
- **Commit message:**  
  `docs: amend constitution v1.1.0 (add PWA/observability/RTL principles)`  

Key additions reflect the Logger utility implementation, RTL HTML structure, and service worker architecture observed in the source code. The principles enforce constraints visible in the CSS variables, API logging, and manifest configuration.