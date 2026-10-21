## 2026-09-21 - Native Form Submission

**Learning:** For HTML forms built dynamically as template literals in this Vanilla JS app, using `<button type="button" onclick="...">` prevents the native 'Enter' key submission, hurting keyboard accessibility.
**Action:** When updating or building forms, always prefer using native `<form onsubmit="...">` with a `<button type="submit">` to ensure screen readers and keyboard users can submit the form naturally.
