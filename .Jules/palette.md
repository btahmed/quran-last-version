## 2024-09-10 - Restoring Enter key submission on Vanilla JS Forms
**Learning:** In a vanilla JS environment where event handlers are sometimes applied directly to buttons (`onclick="handleEvent()"` on a `<button type="button">`), native form submission (hitting "Enter" inside inputs) breaks. This hurts keyboard accessibility severely.
**Action:** Always prefer setting `onsubmit="handleEvent(event)"` on the `<form>` element itself and use a `<button type="submit">` for the primary action. This preserves native browser behavior for forms while allowing for custom async handling.
