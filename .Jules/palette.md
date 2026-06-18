## 2024-05-24 - Initialized\n**Learning:** Started journal\n**Action:** Track UX changes

## 2025-02-12 - Missing ARIA Labels in Dynamic Template Literals
**Learning:** Icon-only buttons generated via JavaScript template literals (e.g., modals, dynamically rendered rows) frequently bypass static HTML accessibility linters, leaving screen-reader users without context.
**Action:** Always scrutinize dynamically constructed DOM strings for `aria-label` and `title` attributes on elements using native emoji or icon fonts.
