## 2024-04-28 - Missing ARIA Labels on Emoji Icon Buttons
**Learning:** Found multiple instances where emoji characters (like ✕ and 🗑️) were used as icons inside buttons without any `aria-label` or visible text. Screen readers may announce these emojis incorrectly or unpredictably, reducing accessibility.
**Action:** Always verify that native HTML buttons relying solely on emojis or icons have appropriate `aria-label` and `title` attributes localized in Arabic (e.g., `aria-label="إغلاق" title="إغلاق"`). Ensure this pattern is consistently applied to all new and existing icon-only controls.
