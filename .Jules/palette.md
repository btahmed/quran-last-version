## 2024-06-25 - ARIA Labels for Dynamic Modals
**Learning:** Many modals in this app (like in `AdminPage.js` or `TeacherPage.js`) are dynamically generated via JavaScript template literals. These often contain icon-only buttons (like `✕` or `🗑️`) that get overlooked by static HTML accessibility checkers.
**Action:** When working on this app, proactively search for JavaScript files containing `<button>` tags within template literals, especially those with emoji content, and ensure they have `aria-label` and `title` attributes (localized in Arabic).
