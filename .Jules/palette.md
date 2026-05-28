## 2024-05-30 - Added ARIA labels to dynamically generated icon-only buttons
**Learning:** Dynamically injected icon buttons (like `✕` or `🗑️`) via JS template literals often slip through static HTML a11y checks. These need explicit `aria-label` and `title` attributes in Arabic to ensure they are accessible to screen readers, especially in dashboards handling sensitive data (users/classes).
**Action:** When creating HTML strings in JS for admin/teacher dashboards, systematically append localized ARIA labels and titles to all symbol-based buttons.
