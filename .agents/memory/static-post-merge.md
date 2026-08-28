---
name: Static app post-merge setup
description: Post-merge setup constraints for this static frontend in the Replit package environment.
---

The frontend is directly served as static files, so post-merge setup should stay independent of npm dependency downloads and only validate the files required to serve the app.

**Why:** The package firewall can reject old development-tool archives even though the runtime application does not need them, causing an otherwise successful merge to fail.

**How to apply:** Keep the post-merge hook fast, non-interactive, and limited to static-app checks unless a future workflow genuinely adds a build step.