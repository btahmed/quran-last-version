## 2024-05-18 - Restore native form submission

**Learning:** When creating forms in vanilla JavaScript projects, converting `<button type="button" onclick="handler()">` to `<button type="submit">` and handling the submission on the form element `<form onsubmit="handler(event)">` is critical for accessibility. It restores the native ability to submit the form using the `Enter` key, which is expected behavior for keyboard users and screen readers.
**Action:** Always prefer `onsubmit` on the `<form>` element over `onclick` on a standard button within forms, especially for authentication or data-entry modals.
