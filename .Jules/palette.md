## 2024-10-24 - Restore native form submission for better keyboard accessibility

**Learning:** In vanilla JavaScript apps, using `<button type="button" onclick="...">` inside a form breaks the native behavior of submitting the form when the user presses the "Enter" key. This is a common accessibility and UX issue.
**Action:** Always prefer modifying `<button type="button" onclick="...">` elements inside `<form>` to `<button type="submit">` and using `onsubmit` on the form element to restore native "Enter" key submission functionality. This is a simple but impactful UX improvement that ensures keyboard users can seamlessly submit forms.
