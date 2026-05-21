## 2024-05-18 - Missing ARIA labels on dynamic admin icons
**Learning:** In dynamically generated template literals for admin modales and class listings, icon-only buttons like the delete trashcan (🗑️) and close cross (✕) lack native aria-label and title attributes. Since they are dynamically created via JavaScript, they may easily slip past static accessibility audits.
**Action:** Always add proper `aria-label` and `title` translated in Arabic when building buttons via template strings, especially for common actions like 'Delete' and 'Close'.
