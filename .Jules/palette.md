## 2023-10-27 - Form Submission Accessibility

**Learning:** The login and register forms previously used a `<button type="button" onclick="...">` approach, which prevented users from easily submitting the form by pressing the "Enter" key after filling in the fields.
**Action:** To ensure better keyboard accessibility and a more intuitive user experience, I modified the `<button>` elements to `type="submit"` and added the `onsubmit="..."` event handler to the `<form>` elements directly.
