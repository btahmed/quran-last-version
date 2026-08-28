#!/usr/bin/env bash
set -euo pipefail

# The application is a static frontend and needs no dependency installation
# after a merge. Keep this check fast and independent of the npm firewall.
test -f frontend/index.html
test -f frontend/src/main.js