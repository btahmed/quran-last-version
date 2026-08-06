## YYYY-MM-DD - Async UI Feedback

**Learning:** In a vanilla JS architecture, using a generic `btn-loading` CSS class combined with `try...finally` blocks is a clean, dependency-free pattern for managing async form submissions while ensuring the UI always recovers its interactive state, even if the API call fails or is mocked.
**Action:** Always wrap async submit handlers in `try...finally` and apply/remove the `btn-loading` class to the primary submit button to provide consistent feedback and prevent double submissions.
