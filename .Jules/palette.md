## 2026-10-18 - Adding ARIA labels to dynamically generated string-template buttons
**Learning:** Icon-only buttons rendered via JavaScript string templates often lack ARIA attributes and evade standard static linters.
**Action:** When adding micro-UX features, proactively inspect string templates (especially those rendering `>`, `<`, `x`, `-`, etc.) for missing `aria-label` and `title` attributes to ensure screen reader accessibility.
