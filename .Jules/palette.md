## 2024-05-24 - Restoring Native Form Submission in AuthModal

**Learning:** This application sometimes relies on `<button type="button" onclick="...">` inside `<form>` elements instead of native form submission events. This breaks standard keyboard accessibility, such as using the "Enter" key to submit a form.
**Action:** When updating form UX or accessibility in the codebase (such as in `AuthModal.js`), prefer modifying `<button type="button" onclick="...">` inside `<form>` to `<button type="submit">` and using `onsubmit` on the form element to restore native "Enter" key submission functionality.
