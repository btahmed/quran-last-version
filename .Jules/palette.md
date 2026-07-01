## 2024-07-01 - Missing ARIA Labels on Dynamically Generated Modals
**Learning:** Icon-only buttons dynamically generated via string template literals (like close ✕ and delete 🗑 buttons in admin modals) frequently lack `aria-label` and `title` attributes, making them inaccessible to screen readers as static HTML checkers miss them.
**Action:** Always verify dynamically generated HTML string literals for native `aria-label` and `title` attributes (preferably in Arabic for this repo) whenever encountering icon-only interactive elements.
