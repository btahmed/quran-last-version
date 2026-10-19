
## 2023-10-23 - Accessibility of dynamically generated icon buttons
**Learning:** In a vanilla JS application utilizing template literals to render components (like `mj-revision-page`), dynamically generated icon-only buttons (`<button>✕</button>`) often evade static HTML accessibility checkers but are critical for screen reader users to understand the context of the action.
**Action:** When adding or modifying JavaScript string templates that generate UI elements, explicitly check for `<button>` tags lacking text content and append appropriate `aria-label` and `title` attributes with localized strings.
