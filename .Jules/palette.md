## 2024-05-14 - Icon-only buttons accessibility
**Learning:** Native `<button>` elements dynamically generated in JS template literals with only emoji content (e.g. ✕, 🗑️) are commonly used across the admin/teacher dashboards but frequently lack accessibility labels.
**Action:** Always append `aria-label` and `title` translated into Arabic when modifying or creating these dynamically injected icon-only buttons to ensure they remain accessible to screen readers and mouse hover users.
