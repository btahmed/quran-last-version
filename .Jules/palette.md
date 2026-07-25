
## 2024-05-24 - Async Button Micro-UX Pattern
**Learning:** In this vanilla JS application, native HTML buttons executing critical asynchronous backend operations (like grading submissions or creating tasks) frequently lack visual state indicators. Since buttons often use emojis for icon-only or primary actions, users receive no visual feedback that their click was registered, potentially causing double submissions.
**Action:** The `.btn-loading` CSS class combined with toggling `.disabled` inside `try...finally` blocks is a clean, reusable micro-UX pattern to provide immediate loading feedback and prevent multiple clicks across the app.
