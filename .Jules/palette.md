## 2024-09-02 - Restore native form submission
**Learning:** Setting buttons to `type="button"` and using `onclick` in forms breaks the native ability to submit the form using the 'Enter' key. This degrades UX and accessibility, especially for forms like login or registration where users expect to hit 'Enter' after typing their password.
**Action:** Always prefer `type="submit"` for the primary action button inside a form, and attach the submission handler to the form's `onsubmit` event rather than the button's `onclick` event.
