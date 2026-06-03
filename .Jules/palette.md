## 2024-05-18 - Missing ARIA labels on icon-only buttons
**Learning:** Found multiple instances of icon-only buttons (using emojis like 🗑️, ✕) missing `aria-label` attributes, which creates an accessibility issue for screen readers.
**Action:** Always add `aria-label` attributes to button elements that do not have text content to ensure screen readers can understand the button's purpose.
