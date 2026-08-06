## 2024-05-16 - Spinner on Async Task Creation and ARIA Label in HifzPage
**Learning:** Adding `.btn-loading` on submit actions to show loading states and avoid multi-submissions provides helpful immediate feedback for async actions, and dynamically created components need `aria-label` just as static ones do to satisfy basic accessibility.
**Action:** Always add loading classes to buttons performing async actions and verify `aria-label`s on icon-only interactive elements in JS files.
