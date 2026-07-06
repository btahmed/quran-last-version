## 2024-05-23 - Add btn-loading state to async operations
**Learning:** The application provides a native `btn-loading` utility class for buttons that automatically hides text and shows a spinner. It is an elegant way to handle async feedback without managing complex innerHTML states.
**Action:** Always wrap async API calls triggered by buttons (like form submissions) in `try/finally` blocks and toggle the `btn-loading` class to prevent duplicate submissions and provide visual feedback.
