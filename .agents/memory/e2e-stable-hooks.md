---
name: Stable E2E hooks
description: Dynamic navigation controls should expose selectors independent of localized labels.
---

Dynamic controls used by end-to-end tests should expose stable semantic hooks such as a data action and a dedicated class, rather than relying only on localized text or inline handlers.

**Why:** Navigation markup can change during UI refactors or localization updates while the user-facing behavior remains unchanged, causing broad E2E failures with little diagnostic value.

**How to apply:** When creating or replacing a navigation action, preserve its stable hook and update E2E selectors only when the intended action itself changes.