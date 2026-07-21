## 2026-07-13 - Dynamic Template Literals Accessibility
**Learning:** Dynamically generated HTML components via JavaScript template literals often evade static HTML accessibility checkers.
**Action:** When creating interactive elements (like icon-only buttons) using string interpolation, be extra vigilant to manually include native `aria-label` attributes for screen readers.
