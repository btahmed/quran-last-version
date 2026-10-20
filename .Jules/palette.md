## 2024-05-24 - Restoring native form submission with "Enter" key
**Learning:** In vanilla JS frontends, using `<button type="button" onclick="...">` inside a form breaks native "Enter" key submission, which degrades the keyboard accessibility of the form.
**Action:** Always use `<form onsubmit="...">` with `<button type="submit">` to preserve accessibility and keyboard-friendly interactions.
