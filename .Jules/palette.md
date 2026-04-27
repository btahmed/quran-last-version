## 2026-04-27 - Added ARIA labels to icon-only buttons
**Learning:** Found that several icon-only buttons (using emojis like ✕ and 🗑️) in AdminPage.js lacked accessible names and tooltip explanations. This is a common pattern to check for when dealing with minimalist UI elements.
**Action:** Always append localized Arabic `aria-label` and `title` attributes when adding or modifying native HTML `<button>` elements containing only emojis.
