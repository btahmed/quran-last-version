## 2024-10-07 - Use Native Forms for Keyboard Submission
**Learning:** Relying on `<button type="button" onclick="handle()">` for form submission breaks the native ability to submit by pressing "Enter" on keyboard inputs, creating an accessibility and convenience barrier.
**Action:** Always wrap form inputs in a `<form onsubmit="handle(event)">` and use a `<button type="submit">` element to preserve default browser keyboard behavior while using preventDefault() in the handler.
