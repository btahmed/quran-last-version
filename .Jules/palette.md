## 2024-05-24 - Accessibility of Dynamically Generated Buttons
**Learning:** Dynamically generated UI components (like modals built via template literals inside JS files) often bypass static HTML accessibility checkers. Icon-only buttons within these templates are particularly prone to missing `aria-label` and `title` attributes.
**Action:** When adding or reviewing dynamically rendered template strings in vanilla JS applications, explicitly check for icon-only `<button>` elements and ensure they have properly localized `aria-label` and `title` attributes (e.g., in Arabic for this app).
