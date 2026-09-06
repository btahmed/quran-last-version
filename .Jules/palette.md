## 2024-05-18 - Native Form Submission for Keyboard Accessibility
**Learning:** In vanilla JS setups, relying on `<button type="button" onclick="...">` inside forms breaks the native ability to submit the form using the `Enter` key. This significantly degrades keyboard accessibility, especially for core interactions like login and registration.
**Action:** Always prefer `<button type="submit">` and `<form onsubmit="...">` for form submissions to ensure native keyboard accessibility is preserved.
