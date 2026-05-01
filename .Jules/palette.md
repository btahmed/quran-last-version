## 2024-05-18 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Found multiple instances where icon-only buttons (like `✕` for close and `🗑️` for delete) were added dynamically to the DOM without `aria-label` or `title` attributes. This pattern seems common in dynamically generated HTML string templates within this app.
**Action:** When adding or modifying UI components that rely heavily on emojis for visual representation, explicitly check for and add localized (Arabic) `aria-label` and `title` attributes to ensure screen-reader accessibility and hover tooltips for all users.
