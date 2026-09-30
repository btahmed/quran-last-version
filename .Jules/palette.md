## 2026-09-30 - Native Form Submissions over Button OnClicks

**Learning:** In vanilla JS SPAs with dynamic templating (like `AuthModal.js`), using native `<form onsubmit="...">` with a `<button type="submit">` instead of a standalone `<button type="button" onclick="...">` preserves native browser behaviors such as submitting the form by pressing the 'Enter' key. This fundamentally improves keyboard accessibility without requiring custom event listeners.
**Action:** When adding or updating forms across the app, always wire the main action to the form's `onsubmit` event and use a `type="submit"` button to ensure a native, accessible experience.
