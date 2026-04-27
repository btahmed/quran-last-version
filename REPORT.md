# Supabase Audit Report

## 1. User Identity Lookups via localStorage
All services (`supabase-tasks.js`, `supabase-submissions.js`, `supabase-admin.js`, `supabase-leaderboard.js`) consistently use `localStorage.getItem('quranreview_user')` to map the `username` to the Supabase `profiles` table to find the UUID.
**Could it fail if localStorage is stale?** Yes. If the localStorage cache holds outdated information or if the profile is somehow missing/updated directly in the database, this mapping might fail to find the user. Documented as a known limitation of the legacy transition layer.

## 2. `getMySubmissions()` select fields
The function uses `select('*, tasks(*)')`.
**Does this return enough data?** Yes. This returns all task columns, including title, type, points, and due_date. The student page does not need the teacher's name, so this is sufficient.

## 3. `getPendingSubmissions()` join alias
The function uses `select('*, tasks(*), profiles!student_id(*)')`.
**Is the join alias correct?** Yes. The foreign key column in the `submissions` table is named `student_id`, so `profiles!student_id(*)` is the correct Supabase syntax for this relationship.

## 4. `createSubmission()` fields
The function inserts `task_id`, `student_id`, `audio_url`, and `status`.
**Are all fields matching the actual Supabase table schema?** Yes. The table schema includes `id, task_id, student_id, audio_url, status, awarded_points, admin_feedback, submitted_at, validated_at`. The insert correctly targets the required fields.

## 5. `approveSubmission()` points_log insert
The function inserts into `points_log` with fields: `student_id`, `delta`, `reason`, `submission_id`.
**Is the points_log insert correct?** Yes. These exactly match the columns defined in the `points_log` schema.

## 6. Error handling for `.single()`
Functions across the services were using `.single()` for read queries (e.g., retrieving a profile by username). If no matching row is found, Supabase's `.single()` throws an error (PGRST116), causing unhandled exceptions.
**Fixes applied:** We replaced `.single()` with `.maybeSingle()` for read queries that might legitimately return 0 rows. This safely returns `null` instead of throwing an error.

* **frontend/src/services/supabase-tasks.js**
  * Line 16: Profile lookup by username -> `.maybeSingle()`
  * Line 70: Profile lookup by username -> `.maybeSingle()`
* **frontend/src/services/supabase-submissions.js**
  * Line 27: Profile lookup by username -> `.maybeSingle()`
  * Line 66: Profile lookup by username -> `.maybeSingle()`
  * Line 117: Profile lookup by username -> `.maybeSingle()`
  * Line 139: Submission lookup by ID -> `.maybeSingle()`
* **frontend/src/services/supabase-admin.js**
  * Line 114: Profile lookup by username -> `.maybeSingle()`
  * Line 189: Profile lookup by username -> `.maybeSingle()`
  * Line 237: Profile lookup by username -> `.maybeSingle()`
* **frontend/src/services/supabase-leaderboard.js**
  * Line 24: Profile lookup by username -> `.maybeSingle()`
* **frontend/src/services/supabase-auth.js**
  * Line 46: Profile lookup by ID -> `.maybeSingle()`

*(Note: Instances of `.insert().select().single()` and `.update().select().single()` were kept intact as they act on a newly created or updated row which is guaranteed to exist unless there's an actual database failure.)*
