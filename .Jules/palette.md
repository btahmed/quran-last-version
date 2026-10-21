## 2026-10-02 - Native Form Submission
**Learning:** In vanilla JS apps like this one, it's easy to accidentally break native form accessibility (like the 'Enter' key to submit) by using `<button type="button" onclick="...">` instead of `<form onsubmit="...">` with a `<button type="submit">`.
**Action:** Always prefer semantic HTML forms with `onsubmit` for login/registration modals to preserve native keyboard behaviors.
