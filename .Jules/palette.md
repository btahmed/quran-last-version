## 2024-05-24 - Restore Native Enter Key on Forms
**Learning:** When forms are built manually in vanilla JS with `<button type="button" onclick="...">`, users lose the ability to press Enter to submit. This is a common pattern in the app.
**Action:** Use `<form onsubmit="Handler(event)">` and `<button type="submit">` to restore native Enter key submission while still capturing the event via JS.
