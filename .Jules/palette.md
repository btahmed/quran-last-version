## 2024-05-18 - Form Submission Accessibility

**Learning:** Using explicit `onclick` handlers on standard `<button type="button">` inside forms breaks native keyboard submission (like pressing Enter). This prevents seamless, accessible keyboard-only usage.
**Action:** Always prefer modifying `<button type="button" onclick="...">` elements inside `<form>` tags to `<button type="submit">` and attach an `onsubmit="..."` handler to the `<form>` element to restore the native Enter key submission UX.
