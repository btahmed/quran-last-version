## 2024-08-20 - Adding ARIA labels to emoji action buttons in lists

**Learning:** In tables or lists presenting user data (like the Memorization page), there are frequently icon-driven action buttons (✓, 🎵, 🎧). While they had `title` tooltips, they were missing `aria-label`s. Emojis can be read inconsistently or verbosely by screen readers if not specifically labelled, rendering the UI actions confusing.
**Action:** When working on dynamic content lists generated via JavaScript template literals, verify that all icon/emoji buttons have a descriptive, Arabic `aria-label` matching their visual or `title` intent.
