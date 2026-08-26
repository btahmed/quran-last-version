---
name: Browser verification in this workspace
description: Cross-origin browser smoke checks can run with the preinstalled Chromium binary when npm test dependencies are unavailable.
---

The workspace may have Chromium available through `REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE` even when installing the declared Playwright package is blocked by the package firewall because of an unrelated dependency.

**Why:** Preview-domain verification still needs a real browser for console and CORS behavior, and the static frontend does not require npm dependencies to run.

**How to apply:** Prefer the existing workflow plus the preinstalled browser/CDP path for one-off preview checks; avoid changing project dependencies solely to perform verification.