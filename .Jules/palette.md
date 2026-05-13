## 2024-05-18 - Missing ARIA Labels on Dynamically Generated Icon-only Buttons
**Learning:** Icon-only buttons that are dynamically generated via JavaScript string templates often evade static HTML accessibility checkers.
**Action:** When creating HTML strings with icon-only buttons (like emojis or SVGs) in JS files, always ensure `aria-label` and `title` attributes are included to make them accessible to screen readers and mouse users.
