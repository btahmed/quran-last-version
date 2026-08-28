---
name: Vercel frontend and API project split
description: Explains why one Vercel check can fail while the frontend deployment and existing production API remain healthy.
---

Only the frontend Vercel project should build from this repository. A legacy Vercel API project also watches it, even though the Django backend source is not present here.

**Why:** A synchronized frontend push produced a successful frontend deployment and a failed API deployment. The existing production API endpoint still responded normally, showing that the failed check came from the wrong repository-to-project association rather than an API outage.

**How to apply:** Treat frontend deployment status independently from the API check. If the API check fires from this repository, move that Vercel project to the actual backend repository or disconnect its Git integration here.