## 2024-05-16 - [ARIA Attributes for Dynamically Generated Icon-Only Buttons]
**Learning:** Icon-only buttons that are dynamically generated via JavaScript template literals (like delete buttons or modal close buttons) often lack ARIA labels because they evade static HTML accessibility checkers.
**Action:** Always manually check dynamically generated UI components (like modals or injected list items) for icon-only buttons and add `aria-label` and `title` attributes localized in the app's primary language (e.g., Arabic).
