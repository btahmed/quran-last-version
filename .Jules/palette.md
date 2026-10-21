## 2024-05-18 - Native Form Submission for Keyboard Accessibility
**Learning:** Using `onclick` handlers on buttons inside forms breaks the native ability to submit forms by pressing the "Enter" key, significantly harming keyboard accessibility.
**Action:** Always prefer `<button type="submit">` and handling the submission on the `<form>` element itself via the `onsubmit` event to preserve native browser functionality and improve accessibility.
