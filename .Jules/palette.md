## 2026-09-14 - Form Submission via Enter Key

**Learning:** Using `onclick` on form buttons prevents the native 'Enter' key submission behavior in forms. It's more accessible to use `onsubmit` on the form itself with `<button type="submit">`, restoring the expected native keyboard interactions.
**Action:** Update forms to use `onsubmit` on the `<form>` element and change buttons to `type="submit"` instead of `type="button"`.
