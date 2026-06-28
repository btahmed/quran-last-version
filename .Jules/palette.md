## 2025-01-08 - Adding ARIA labels to dynamically generated modals
**Learning:** Dynamically generated HTML elements in template literals (like Modals or Toasts) often evade static accessibility checkers. This leads to icon-only buttons (like "✕") missing critical `aria-label` and `title` attributes, making them inaccessible to screen readers.
**Action:** Whenever adding or reviewing template literal UI components, manually verify that any icon-only controls have localized (Arabic) `aria-label` and `title` attributes.
