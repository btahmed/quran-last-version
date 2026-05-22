## 2024-05-18 - Missing ARIA labels on icon-only buttons
**Learning:** Found multiple instances of icon-only buttons (like delete buttons with 🗑️ and close buttons with ✕) without any accessible names (aria-label or title) in `AdminPage.js` and `TeacherPage.js`. This makes the application inaccessible to screen-reader users.
**Action:** Always verify dynamically generated HTML and add `aria-label` and `title` to all icon-only buttons. The project specifically requested to localized the labels in Arabic.
