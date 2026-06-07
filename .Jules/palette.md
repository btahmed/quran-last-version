## 2024-05-18 - Tooltips vs aria-labels in custom elements
**Learning:** We need both native tooltips (`title`) and `aria-label` for screen reader accessibility in cases of custom button designs with emojis as icons.
**Action:** Always provide `aria-label` and `title` in custom UI icon buttons, and make sure the title describes the state clearly if dynamic.
