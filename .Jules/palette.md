## 2024-05-24 - Missing accessibility attributes in dynamically generated UI

**Learning:** When generating UI components via JavaScript template literals (like modals and table rows), icon-only buttons (`✕`, `🗑️`) frequently miss native `aria-label` and `title` attributes, making them inaccessible to screen readers and difficult to understand without hover tooltips. These escape standard static HTML a11y checkers.
**Action:** When working on dynamic UI generation, explicitly verify that all native `<button>` elements containing only icons or emojis have descriptive `aria-label` and `title` attributes localized in Arabic.
