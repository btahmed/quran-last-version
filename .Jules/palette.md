## 2024-06-21 - [Dynamically Generated Icon-Only Buttons Missing ARIA Labels]
**Learning:** Dynamically generated icon-only buttons (like "✕" or "🗑") inside JavaScript template literals often evade static HTML accessibility checkers and easily end up missing `aria-label` and `title` attributes.
**Action:** When working with vanilla JS components rendering HTML via strings, explicitly verify that all icon-only interactive elements contain localized `aria-label` and `title` attributes.
