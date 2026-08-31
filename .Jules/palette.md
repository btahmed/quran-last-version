## 2024-05-18 - Native Form Submission vs Button onClick

**Learning:** In Vanilla JS frontend structures (specifically noticed in AuthModal.js), hooking submission logic to a `<button type="button" onclick="...">` rather than the `<form onsubmit="...">` breaks the native browser behavior of submitting the form when the user presses the "Enter" key while focused on an input field. This severely degrades accessibility and general UX for keyboard users.
**Action:** Always prefer `<form onsubmit="...">` combined with `<button type="submit">` for form submissions to preserve native keyboard accessibility.
