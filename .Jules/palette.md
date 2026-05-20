## 2024-05-19 - Dynamically Generated Icon-Only Buttons
**Learning:** Icon-only buttons that are dynamically generated via JavaScript template literals (like modals or data tables) often slip past static HTML accessibility checkers. In this project, `✕` (close) and `🗑️` (delete) buttons in `AdminPage.js` lacked `aria-label` and `title` attributes.
**Action:** Always manually check JavaScript string templates for icon-only buttons (`<button>emoji</button>`) and append appropriate native `aria-label` and `title` attributes (localized in Arabic for this project).
