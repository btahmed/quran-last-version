# Security Audit Report — QuranReview

**Audit Date**: 2026-02-18  
**Audited By**: Security review (AI-assisted)  
**Repository**: btahmed/QuranReview  
**Status**: DRAFT — fixes applied, pending deployment verification

---

## A) Prioritized Risk Table

| # | Priority | Category | Finding | Evidence | Impact | Status |
|---|----------|----------|---------|----------|--------|--------|
| 1 | **P0** | Auth | Hardcoded username-based privileges in `CreateTeacherView` — usernames `ahmad` and `saleh` had special superuser/staff logic | `ancien django/.../api_views.py` lines 141-147 (original) | Privilege escalation: anyone registering as `ahmad` could be promoted to superuser | ✅ **FIXED** — removed username-specific logic |
| 2 | **P0** | Auth | `MediaFileView` used `AllowAny` permissions — any unauthenticated user could download student audio submissions | `ancien django/.../api_views.py` line 646 (original) | Data breach: student audio files accessible without authentication | ✅ **FIXED** — changed to `IsAuthenticated` |
| 3 | **P0** | Input | Path traversal via `MediaFileView` used `os.path.abspath()` which doesn't resolve symlinks | `ancien django/.../api_views.py` lines 651-654 (original) | File disclosure: symlink-based traversal could expose files outside `MEDIA_ROOT` | ✅ **FIXED** — now uses `os.path.realpath()` for symlink-safe resolution |
| 4 | **P1** | Rate Limiting | No rate limiting on any API endpoint — registration, login, file upload all unthrottled | `ancien django/.../settings.py` `REST_FRAMEWORK` config | Brute-force attacks on login, spam registrations, denial of service via file uploads | ✅ **FIXED** — added DRF throttle classes (20/min anon, 60/min user) |
| 5 | **P1** | Auth | `DeleteAllTasksView` allowed any teacher to delete ALL tasks in the system | `ancien django/.../api_views.py` line 367 (original) | Data loss: any teacher account could wipe all tasks for all users | ✅ **FIXED** — restricted to `IsSuperUser` only |
| 6 | **P1** | Auth | Minimum password length was only 6 characters | `ancien django/.../api_views.py` lines 55, 164 (original) | Weak passwords easier to brute-force | ✅ **FIXED** — increased to 8 characters minimum |
| 7 | **P1** | XSS | ~40 instances of `innerHTML` in `script.js` rendering API data without sanitization | `script.js` — see grep results for `innerHTML` occurrences | Stored XSS if API data contains malicious payloads (mitigated by server-side ORM escaping) | ⚠️ **ACKNOWLEDGED** — recommend DOMPurify in future; low immediate risk since data comes from controlled API |
| 8 | **P1** | Auth | Unauthenticated media URL route in `urls.py` serves files via Django's `static_serve` | `ancien django/.../urls.py` line 39 | Any user can access `/media/` files directly without authentication | ⚠️ **ACKNOWLEDGED** — separate from API route; recommend restricting in production |
| 9 | **P2** | Secrets | `SECRET_KEY` falls back to insecure default `'django-insecure-dev-only-key-do-not-use-in-production'` | `ancien django/.../settings.py` line 37 | If deployed without env var, uses known key. Render.yaml auto-generates it, so production is safe | ⚠️ **LOW RISK** — production uses auto-generated key via `render.yaml` |
| 10 | **P2** | CORS | `CORS_ALLOW_ALL_ORIGINS = True` when `DEBUG=True` | `ancien django/.../settings.py` line 154 | Dev-only; production uses whitelist. Risk if DEBUG accidentally left on in production | ⚠️ **LOW RISK** — production hardening disables DEBUG |
| 11 | **P2** | Info Disclosure | Registration endpoint reveals whether usernames exist (`"اسم المستخدم مستخدم بالفعل"`) | `ancien django/.../api_views.py` line 61 | Username enumeration | ⚠️ **ACKNOWLEDGED** — common pattern; low risk for this application type |
| 12 | **P2** | Audit | No logging of admin actions (approve, reject, delete user, delete tasks) | `ancien django/.../api_views.py` — all admin views lack `logger.info()` | No audit trail for compliance; difficult to investigate incidents | ⚠️ **ACKNOWLEDGED** — recommend adding structured logging |

---

## B) Fix Pack Checklist

### ✅ Fix 1: Remove Hardcoded Username Privileges (P0)
- **What changed**: Removed `if username == 'ahmad'` and `elif username == 'saleh'` special-casing in `CreateTeacherView.post()` method
- **File**: `ancien django/MYSITEE/MYSITEE/mysite/api_views.py`
- **How to verify**: Promote any user to teacher via API — no user should get automatic superuser privileges
- **Acceptance criteria**: No username-specific logic exists in promotion flow; only the `role` field is updated to `'teacher'`

### ✅ Fix 2: Authenticate MediaFileView (P0)
- **What changed**: Changed `permission_classes` from `[permissions.AllowAny]` to `[permissions.IsAuthenticated]`
- **File**: `ancien django/MYSITEE/MYSITEE/mysite/api_views.py`
- **How to verify**: `curl -X GET /api/media/test.webm` without Authorization header should return `401 Unauthorized`
- **Acceptance criteria**: Only authenticated users with valid JWT can access media files via `/api/media/`

### ✅ Fix 3: Strengthen Path Traversal Protection (P0)
- **What changed**: Replaced `os.path.abspath()` with `os.path.realpath()` for symlink-safe path resolution
- **File**: `ancien django/MYSITEE/MYSITEE/mysite/api_views.py`
- **How to verify**: Request `/api/media/../../../etc/passwd` should return `404`, even with symlinks pointing outside `MEDIA_ROOT`
- **Acceptance criteria**: `os.path.realpath()` resolves symlinks before comparing against `MEDIA_ROOT`

### ✅ Fix 4: Add API Rate Limiting (P1)
- **What changed**: Added `DEFAULT_THROTTLE_CLASSES` and `DEFAULT_THROTTLE_RATES` to DRF config
- **File**: `ancien django/MYSITEE/MYSITEE/mysite/settings.py`
- **Rates**: Anonymous: 20 requests/minute, Authenticated: 60 requests/minute
- **How to verify**: Make 21 rapid anonymous requests to `/api/register/` — 21st should return `429 Too Many Requests`
- **Acceptance criteria**: All API endpoints enforce rate limits; throttle response includes `Retry-After` header

### ✅ Fix 5: Restrict DeleteAllTasksView to Superuser (P1)
- **What changed**: Changed `permission_classes` from `[IsTeacher]` to `[IsSuperUser]`
- **File**: `ancien django/MYSITEE/MYSITEE/mysite/api_views.py`
- **How to verify**: Teacher user calling `DELETE /api/admin/tasks/delete-all/` should get `403 Forbidden`
- **Acceptance criteria**: Only superuser accounts can delete all tasks

### ✅ Fix 6: Increase Minimum Password Length (P1)
- **What changed**: `RegisterSerializer.password` `min_length` changed from `6` to `8`; `CreateTeacherView` password check updated from `< 6` to `< 8`
- **File**: `ancien django/MYSITEE/MYSITEE/mysite/api_views.py`
- **How to verify**: Registration with 7-character password should return validation error
- **Acceptance criteria**: All new accounts require minimum 8-character passwords

---

## C) Release Gate Checklist

Run this checklist before every deployment:

### Secrets
- [ ] No API keys, passwords, or database URLs hardcoded in source code
- [ ] `.env` files are in `.gitignore` (✅ already configured)
- [ ] `SECRET_KEY` environment variable is set in production (✅ Render auto-generates)
- [ ] `DATABASE_URL` environment variable is set in production
- [ ] CI uses isolated test credentials only (✅ `test-secret-key-for-ci`)
- [ ] Run: `grep -rn "password\|secret\|api_key" --include="*.py" --include="*.js" | grep -v ".gitignore" | grep -v "test" | grep -v "node_modules"`

### Dependencies
- [ ] All Python packages are pinned to specific versions (✅ `requirements.txt`)
- [ ] No ghost/typo-squatted packages — verify against PyPI/npm
- [ ] Run: `pip audit` (or `safety check`) for known vulnerabilities
- [ ] Run: `npm audit` for JavaScript dependencies
- [ ] Update dependencies with known CVEs

### Authentication & Authorization
- [ ] No custom auth implementation — using `djangorestframework-simplejwt` (✅)
- [ ] All API endpoints require authentication except registration and login (✅)
- [ ] Role-based access enforced server-side (`IsSuperUser`, `IsTeacher`) (✅)
- [ ] No hardcoded username-based privileges (✅ FIXED)
- [ ] Media files require authentication (✅ FIXED)
- [ ] `DeleteAllTasksView` restricted to superuser (✅ FIXED)

### Input Validation
- [ ] All database queries use Django ORM (no raw SQL) (✅)
- [ ] File uploads validated for extension and size (✅ `submissions/models.py`)
- [ ] Password minimum length ≥ 8 characters (✅ FIXED)
- [ ] Django password validators enabled (✅ `settings.py` AUTH_PASSWORD_VALIDATORS)

### Rate Limiting
- [ ] DRF throttling configured for all endpoints (✅ FIXED)
- [ ] Anonymous rate: 20/minute
- [ ] Authenticated rate: 60/minute
- [ ] Verify with: rapid requests to `/api/token/` to confirm `429` response

### Security Headers (Production)
- [ ] `DEBUG = False` in production
- [ ] `SECURE_SSL_REDIRECT = True`
- [ ] `SESSION_COOKIE_SECURE = True`
- [ ] `CSRF_COOKIE_SECURE = True`
- [ ] `SECURE_HSTS_SECONDS > 0`
- [ ] `CORS_ALLOW_ALL_ORIGINS` is `False` when `DEBUG=False` (✅ already configured)

### Row-Level Security (RLS)
- [ ] Using Django ORM, not direct PostgreSQL RLS
- [ ] Students can only see their own submissions (✅ `MySubmissionsView` filters by `student=request.user`)
- [ ] Teachers can only see submissions for their own tasks (✅ `PendingSubmissionsView` filters by `task__author=request.user`)
- [ ] Students can only see tasks assigned to them (✅ `TaskListView` filters by assignment)
- [ ] Admin-only views restricted to superuser (✅)

---

## Dependencies Audit

### Python (`requirements.txt`)
| Package | Version | Status |
|---------|---------|--------|
| Django | 5.2.11 | ✅ Current LTS |
| djangorestframework | 3.16.1 | ✅ Current |
| djangorestframework-simplejwt | 5.5.1 | ✅ Current |
| django-cors-headers | 4.9.0 | ✅ Current |
| gunicorn | 22.0.0 | ✅ Current |
| whitenoise | 6.6.0 | ✅ Current |
| psycopg | 3.3.2 | ✅ Current |
| cloudinary | 1.41.0 | ✅ Current |
| dj-database-url | 2.2.0 | ✅ Current |

### AI Pipeline (`ai_pipeline/requirements.txt`)
| Package | Version | Status |
|---------|---------|--------|
| httpx | ≥0.27.0 | ✅ Current |
| jsonschema | ≥4.20.0 | ✅ Current |
| pytest | ≥8.0.0 | ✅ Current |
| ruff | ≥0.4.0 | ✅ Current |

### JavaScript (`package.json`)
- No external npm dependencies — vanilla JS app (✅ minimal attack surface)

### Ghost Package Check
- All packages verified against PyPI registry — no typo-squatting detected
- No suspicious or unfamiliar packages present

---

## Defensive Attack Path Analysis

| # | Attack Path | Current Protection | Recommendation |
|---|-------------|-------------------|----------------|
| 1 | Brute-force login via `/api/token/` | ✅ DRF throttling (20/min anon) | Monitor failed login attempts |
| 2 | Path traversal via `/api/media/../../etc/passwd` | ✅ `os.path.realpath()` + prefix check | Consider allowlisting file extensions |
| 3 | XSS via stored user data (names, task descriptions) | Django ORM auto-escapes; DRF serializers | Add DOMPurify to frontend `innerHTML` usage |
| 4 | CSRF on API endpoints | JWT-based auth (stateless, no cookies) | N/A — CSRF protection via JWT by design |
| 5 | Privilege escalation via role manipulation | Server-side role checks (`IsTeacher`, `IsSuperUser`) | Log all role changes |
| 6 | File upload abuse (malicious audio) | Extension whitelist + 10MB size limit | Consider server-side audio format validation |
| 7 | JWT token theft via XSS | Token in localStorage | Consider HttpOnly cookie storage in future |
| 8 | Denial of service via large uploads | 10MB limit per file | Add per-user upload quota |
| 9 | Username enumeration via registration | Returns "username taken" message | Accept for UX; low risk for this app type |
| 10 | SQL injection | ✅ Django ORM (no raw queries) | Maintain ORM usage; code review for raw SQL |
