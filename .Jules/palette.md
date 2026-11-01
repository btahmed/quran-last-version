## 2024-11-01 - Dynamic Icon Buttons in Vanilla JS
**Learning:** Icon-only buttons rendered dynamically via template literals in this vanilla JS app are frequently missed by static accessibility linters. When adding these components, `aria-label` and `title` attributes must be explicitly manually verified, especially considering the bilingual `fr` state.
**Action:** Always manually `grep` for `<button` inside JavaScript files to catch icon-only buttons that are missing semantic labels.
