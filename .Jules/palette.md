## 2026-05-04 - [Emoji Icon-only Buttons Missing Accessibility Attributes]
**Learning:** This app frequently uses emoji characters (like 🗑️, ✕) inside raw HTML `<button>` tags for icon-only controls. Many of these lack `aria-label` and `title` attributes, making them inaccessible to screen readers and confusing without tooltips.
**Action:** When working with inline HTML templates for UI components, proactively audit and add Arabic-localized `aria-label` and `title` attributes to all icon-only interactive elements.
