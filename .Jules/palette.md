## 2024-05-19 - ARIA Labels on Icon-Only Buttons
**Learning:** This app relies heavily on emoji-based buttons for interactions (like 🗑️, ⚙️, ✕, ✏️, and grade stars) which are largely inaccessible to screen readers without ARIA labels or standard titles. Some dynamic HTML rendering makes it harder for static analysis tools to catch them.
**Action:** Always add descriptive `aria-label` and `title` attributes to icon-only buttons (like delete or settings icons). Ensure they are translated to Arabic since this is an Arabic app.
