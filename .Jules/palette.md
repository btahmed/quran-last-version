## 2024-05-18 - Dynamically Generated Icon-Only Buttons Evade Static A11y Checks
**Learning:** Many modals and components in this vanilla JS app are generated via JavaScript template literals (e.g. `frontend/src/pages/admin/AdminClassesSection.js`). Icon-only buttons (like ✕ or 🗑) injected this way often evade static HTML accessibility linters, resulting in missing `aria-label` and `title` attributes.
**Action:** Always manually check JavaScript template literals for icon-only buttons when making UI changes, and ensure they have localized `aria-label` and `title` attributes.
