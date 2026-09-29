## 2026-09-29 - Restore Native Enter Key Submission
**Learning:** In forms like `AuthModal.js`, binding `onclick` to a `<button type="button">` prevents users from naturally pressing "Enter" to submit. This breaks a fundamental keyboard accessibility and usability pattern.
**Action:** Always prefer `<form onsubmit="...">` combined with `<button type="submit">` over inline button clicks for forms.
