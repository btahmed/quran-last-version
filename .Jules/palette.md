## 2025-02-18 - Added ARIA labels to dynamically generated RevisionPage buttons
**Learning:** Many icon-only buttons within dynamic JavaScript template literals (like `.mj-modal-close`, `.mj-wiz-back`) were missing `aria-label`s because static HTML accessibility linters don't catch them. Added localized ARIA labels and titles to improve screen reader experience and discoverability.
**Action:** When auditing vanilla JS components, explicitly check `innerHTML` template strings for interactive elements (like `<button>`) to ensure accessibility attributes are included.
