## 2024-05-15 - Missing Native Form Submissions
**Learning:** Vanilla JS forms in this app sometimes use `<button type="button" onclick="...">` rather than standard form submission (`<form onsubmit="...">` + `<button type="submit">`). This prevents users from submitting forms using the "Enter" key, reducing accessibility and breaking a core interaction pattern.
**Action:** When improving form UX, convert action buttons to `type="submit"` and handle the event on the form element itself via `onsubmit`.
