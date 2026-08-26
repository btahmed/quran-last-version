#!/usr/bin/env bash
set -euo pipefail

# The application is a static frontend, but keep the locked development
# tooling available after task merges for direct lint/test verification.
if [[ -f package-lock.json ]]; then
    npm ci --ignore-scripts --no-audit --no-fund
fi