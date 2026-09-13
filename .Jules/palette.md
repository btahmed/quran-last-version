## 2024-05-18 - Native Form Submission for Accessibility
**Learning:** In vanilla JavaScript apps, using `<button type="button" onclick="...">` inside a form breaks the native "Enter" key submission behavior, which negatively impacts keyboard accessibility and user experience. Restoring `<button type="submit">` and `<form onsubmit="...">` fixes this.
**Action:** Always prefer native `<form onsubmit="...">` with a `<button type="submit">` for form actions instead of attaching `onclick` handlers to buttons to ensure built-in browser keyboard behaviors are preserved.
