# Product Design Spec Pack: QuranReview

**Confidence Level**: High  
**Assumptions Count**: 4 requiring validation  
**Status**: DRAFT

## Needed to Confirm (max 5 files)
1. `ancien django/MYSITEE/MYSITEE/mysite/api_views.py` — Confirm exact API response shapes and error handling patterns (Note: `ancien django` is the actual directory name in the repository, meaning "old/former Django" in French)
2. `script.js` (lines 3000–4870) — Validate competition scoring algorithm and hifz difficulty engine details
3. `ancien django/MYSITEE/MYSITEE/tasks/models.py` — Confirm Team model relationships and task assignment logic
4. `ancien django/MYSITEE/MYSITEE/submissions/models.py` — Confirm file validation rules and status transitions
5. `style.css` (full) — Confirm responsive breakpoints and dark mode variable coverage

---

## 1. Product Spec

### 1.1 Vision & Positioning
🟢 CONFIRMED (from `README.md`, `index.html`, `manifest.json`)
- **North Star**: Enable every Muslim to effectively memorize, review, and master the Quran through a professional, gamified, teacher-supported digital platform.
- **Value Prop**: Combines individual self-paced memorization tools (spaced repetition, audio playback, word-masking exercises) with a structured teacher-student classroom model — bridging the gap between solo study and institutional Quran education.
- **Positioning**: For Muslim learners and Quran teachers who need a structured, engaging way to track and improve Quran memorization, QuranReview is a progressive web application that provides gamified hifz exercises, audio-synced review, and teacher-managed task workflows. Unlike generic flashcard apps or basic Quran readers, we combine spaced repetition, 5-level difficulty hifz mode, competitive challenges, and real teacher grading in a single RTL-native PWA.

### 1.2 Personas & Jobs-to-be-Done
- **Primary — Individual Learner (Student)**
  - Demographics: Muslim, 12–45 years old, Arabic-literate, uses mobile primarily
  - JTBD: "When I want to memorize new surahs or maintain existing memorization, I want structured daily review with audio support and progress tracking, so I can build consistent hifz habits and avoid forgetting what I've memorized."
- **Secondary — Quran Teacher (Ustadh/Ustadha)**
  - Demographics: Islamic school instructor or community teacher, manages 5–50 students
  - JTBD: "When I assign memorization and recitation tasks to my students, I want to receive audio submissions, grade them, and track each student's progress, so I can provide personalized feedback and maintain class accountability."
- **Tertiary — Admin**
  - Demographics: School administrator or platform manager
  - JTBD: "When I manage users and oversee the platform, I want to create teacher accounts, view all users, and manage system-wide tasks, so I can keep the platform organized and role-appropriate."

### 1.3 Scope Matrix
| Version | In Scope | Explicitly Out (Non-Goals) | Success Metrics |
|---------|----------|---------------------------|-----------------|
| **V1 (Current)** | Memorization tracking with spaced repetition, Ward (daily recitation) audio player, Hifz mode (5 difficulty levels), Competition (3 game modes), Teacher-student task/submission workflow, JWT auth, PWA offline support, Dark/Light theme | Multi-language UI (Arabic-only), Social features (comments, sharing), Video content, Payment/subscription, Offline task submission sync, Push notification delivery | Active daily users, Surahs memorized per user per week, Task completion rate, Audio submission approval rate |
| **V2 (Future)** | Multi-language UI (English, French, Urdu), Push notification delivery, Offline submission sync via background sync, Additional reciters, Student-to-student peer review, Advanced analytics dashboard, Community leaderboard | Native mobile app (React Native), AI-powered recitation grading, Video lessons | 30-day retention > 40%, Teacher adoption rate, Cross-device usage |

### 1.4 Success Metrics
- **North Star**: Review sessions completed per user per week
- **L1 (Health)**:
  - Adoption: New user registrations per week
  - Retention: 7-day and 30-day return rate
  - Engagement: Average session duration, pages visited per session
- **L2 (Feature)**:
  - Memorization: Ayahs added to memorization list per user per week
  - Ward: Ward playback sessions completed per day
  - Hifz: Average difficulty level reached (1–5)
  - Competition: Games played per user per week
  - Tasks: Teacher task creation rate, submission turnaround time
- **Guardrails**:
  - Page load time (TTI) must remain < 3s on 3G
  - Audio playback start latency < 2s
  - API response time < 500ms (p95)
  - No increase in JS bundle size beyond 15% without justification

### 1.5 Product Risks & Decisions
| Risk | P | I | Mitigation | Decision Needed |
|------|---|---|------------|-----------------|
| CDN audio unavailability (islamic.network) | M | H | Implement local audio fallback cache via service worker; already partially supported (`/audio/*.mp3`) | "Approve offline-first audio download for top 30 surahs?" |
| Large single-file JS architecture (`script.js` ~4,870 lines) limits maintainability | H | M | Plan modular refactor into feature-based files with bundler | "Approve adding build tool (Vite/esbuild) to project?" |
| localStorage data loss on browser clear | M | H | Implement server-side data sync for authenticated users | "Prioritize backend memorization sync API?" |
| Teacher adoption friction (manual task creation) | M | M | Add task templates and bulk assignment | "Include bulk task features in V1 or defer to V2?" |

---

## 2. UX/Functional Spec

### 2.1 Information Architecture
🟢 CONFIRMED (from `index.html` navigation, `script.js` page rendering)

**Current Sitemap**:
```
Home (الرئيسية)
├── Daily Motivation + Stats Summary
Memorization (الحفظ اليومي)
├── Add Surah/Ayah Range
├── Memorization Table (review status, spaced repetition dates)
├── Ward Player (الورد)
Ward (الورد)
├── Surah/Range Selection
├── Audio Playback (ayah-by-ayah with image sync)
├── Reciter & Quality Settings
Progress (التقدم)
├── 7-Day Review Chart
├── Overall Stats
Competition (التحديات) 🏆
├── Speed Run (5 ayahs in 5 min)
├── Ayah Hunt (identify surah, 4-choice)
├── Precision Master (type words, 5 levels)
├── Leaderboard
Hifz Mode (وضع الحفظ) 🎭
├── Surah/Range Selection
├── 5 Difficulty Levels (20%–100% word masking)
├── Hint System (3/session)
Settings (الإعدادات)
├── User Name, Daily Goal
├── Theme Toggle, Notifications
├── Audio Quality (bitrate)
My Tasks (مهامي) 📝 [Student-only]
├── Assigned Tasks List
├── Audio Recording & Submission
Teacher Dashboard (لوحة الأستاذ) 📋 [Teacher-only]
├── Create Task
├── Pending Submissions
├── Student List & Progress
Auth
├── Login Modal
├── Registration Modal
Admin [Superuser-only]
├── User Management (CRUD, promote to teacher)
├── Task Management
```

**Navigation Model**: 🟢 CONFIRMED
- Top navigation bar with horizontal links (RTL layout)
- Role-based visibility: Student sees "My Tasks", Teacher sees "Teacher Dashboard"
- Auth state toggles login button vs. user info + logout
- Single-page application with hash-based or data-attribute routing (`data-page`)
- Max 1 level deep (flat page structure with inline modals)

### 2.2 User Flows

**Flow: Daily Memorization Review**
1. User opens app → Home page with daily motivation quote and stats
2. User navigates to "Memorization" page
3. System loads memorization data from localStorage → displays table of tracked surahs
4. If items due for review → highlighted with "due" badge
5. User clicks "Review" on an item → Ward player opens with surah/ayah range
6. Audio plays ayah-by-ayah with synchronized Quran page images
7. User completes playback → marks item as reviewed
8. System updates review count, calculates next review date (spaced repetition)
9. Progress chart updates on "Progress" page
- Edge cases: No items tracked (empty state with CTA), audio CDN failure (fallback to local cache), browser storage full (warning notification)
- System triggers: Auto-save to localStorage every 30 seconds, spaced repetition scheduling

**Flow: Hifz Practice Session**
1. User navigates to "Hifz Mode" page
2. User selects surah and ayah range
3. User selects difficulty level (1–5)
4. System renders ayah text with masked words (percentage based on level)
5. User clicks on masked words to attempt recall
6. Correct → word revealed, points awarded
7. Incorrect → hint available (3 per session, -5 points penalty)
8. Session completes → score displayed, history saved
9. If score threshold met → next level unlocked
- Edge cases: User exits mid-session (progress saved), all hints used (continue without hints), difficulty too high (suggest lower level)

**Flow: Teacher Task Assignment & Grading**
1. Teacher logs in (JWT auth) → redirected to Teacher Dashboard
2. Teacher clicks "Create Task" → form: title, description, type (recitation/memorization), points, due date
3. Teacher assigns task to specific students or all students
4. Students see task in "My Tasks" page
5. Student records audio (WebRTC) → submits via API → uploaded to Cloudinary
6. Teacher sees pending submission → plays audio → clicks Approve or Reject with feedback
7. If approved → points awarded to student, reflected in leaderboard
8. If rejected → student can resubmit
- Edge cases: Task past due date (still submittable but flagged), audio upload failure (retry with error message), teacher offline (queue locally)
- System triggers: JWT token refresh, Cloudinary upload, points ledger update

**Flow: Competition Game (Ayah Hunt)**
1. User navigates to "Competition" page
2. User selects "Ayah Hunt" game mode
3. System randomly selects an ayah and generates 4 surah choices (1 correct, 3 distractors)
4. User selects answer within time limit
5. Correct → points based on speed; Incorrect → no points, correct answer shown
6. After 10 rounds → final score displayed
7. Rank calculated (Bronze → Diamond based on cumulative score)
8. Leaderboard updated (API call if authenticated)
- Edge cases: Timer expires (auto-skip, no points), network error on leaderboard update (retry silently), tie-breaking (timestamp-based)

### 2.3 Screen Specifications (ASCII Wireframes)

**Screen: Home (الرئيسية)**
```
+--------------------------------------------------+
|  🕌 مراجعة القرآن          [Nav Links] [🌙] [Auth]|
|  تطبيق احترافي لحفظ ومراجعة القرآن الكريم        |
+--------------------------------------------------+
|                                                    |
|  +----------------------------------------------+ |
|  | 📖 Daily Motivation Quote                     | |
|  | "إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ..."     | |
|  +----------------------------------------------+ |
|                                                    |
|  +----------+  +----------+  +----------+          |
|  | Surahs   |  | Reviews  |  | Streak   |          |
|  | Memorized|  | Today    |  | Days     |          |
|  |   12     |  |    5     |  |    7     |          |
|  +----------+  +----------+  +----------+          |
|                                                    |
|  [Start Today's Review]                            |
+--------------------------------------------------+
```

**Screen: Memorization (الحفظ اليومي)**
```
+--------------------------------------------------+
|  📖 الحفظ اليومي                                  |
+--------------------------------------------------+
|  [+ Add Surah/Ayah Range]                          |
|                                                    |
|  Surah     | From | To  | Status    | Next Review  |
|  --------- | ---- | --- | --------- | ------------ |
|  البقرة    | 1    | 10  | ✅ Strong | Feb 25       |
|  آل عمران  | 1    | 20  | ⚠️ Weak  | TODAY        |
|  الكهف     | 1    | 5   | 🆕 New   | —            |
|                                                    |
|  [Empty: "لم تضف أي سور بعد" + CTA "ابدأ الآن"]  |
+--------------------------------------------------+
```

**Screen: Ward Player (الورد)**
```
+--------------------------------------------------+
|  🎵 الورد - مراجعة يومية                          |
+--------------------------------------------------+
|  Surah: [Dropdown: البقرة ▼]                       |
|  From Ayah: [1]  To Ayah: [10]                     |
|  Reciter: [العفاسي ▼]  Quality: [128kbps ▼]       |
|                                                    |
|  +----------------------------------------------+ |
|  |  [Quran Page Image - Ayah Highlighted]        | |
|  |  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ     | |
|  +----------------------------------------------+ |
|  |  ◀ Prev |  ▶ Play / ⏸ Pause  | Next ▶       | |
|  |  Ayah 3 of 10                                 | |
|  +----------------------------------------------+ |
+--------------------------------------------------+
```

**Screen: Hifz Mode (وضع الحفظ)**
```
+--------------------------------------------------+
|  🎭 وضع الحفظ                                     |
+--------------------------------------------------+
|  Surah: [البقرة ▼]  Ayahs: [1] to [5]             |
|  Level: [⭐⭐⭐☆☆ Level 3 - 60% masked]            |
|                                                    |
|  +----------------------------------------------+ |
|  |  بِسْمِ [____] الرَّحْمَٰنِ [____]           | |
|  |  [____] الَّذِينَ [____] بِالْغَيْبِ          | |
|  +----------------------------------------------+ |
|                                                    |
|  Score: 85 pts  |  Hints: 2/3 remaining            |
|  [💡 Use Hint (-5 pts)]                            |
+--------------------------------------------------+
```

**Screen: Competition (التحديات)**
```
+--------------------------------------------------+
|  🏆 التحديات                                      |
+--------------------------------------------------+
|  +------------+  +------------+  +------------+   |
|  | ⚡ Speed   |  | 🔍 Ayah   |  | 🎯 Precision|  |
|  |   Run      |  |   Hunt     |  |   Master    |  |
|  | 5 ayahs    |  | Identify   |  | Type each   |  |
|  | in 5 min   |  | the surah  |  | word right  |  |
|  |  [Play]    |  |  [Play]    |  |  [Play]     |  |
|  +------------+  +------------+  +------------+   |
|                                                    |
|  🏅 Your Rank: Gold (1,250 pts)                    |
|  Leaderboard:                                      |
|  1. Ahmad — 2,400 pts (Diamond)                    |
|  2. Fatima — 1,800 pts (Platinum)                  |
|  3. You — 1,250 pts (Gold)                         |
+--------------------------------------------------+
```

**Screen: Teacher Dashboard (لوحة الأستاذ)**
```
+--------------------------------------------------+
|  📋 لوحة الأستاذ                                  |
+--------------------------------------------------+
|  [+ Create New Task]                               |
|                                                    |
|  Pending Submissions (3):                          |
|  +----------------------------------------------+ |
|  | Student: أحمد  | Task: سورة البقرة ١-١٠       | |
|  | [▶ Play Audio]  [✅ Approve] [❌ Reject]       | |
|  +----------------------------------------------+ |
|  | Student: فاطمة | Task: سورة الكهف ١-٥          | |
|  | [▶ Play Audio]  [✅ Approve] [❌ Reject]       | |
|  +----------------------------------------------+ |
|                                                    |
|  My Students (12):                                 |
|  | Name    | Points | Tasks Done | Last Active    | |
|  | أحمد    | 450    | 8/10       | Today          | |
|  | فاطمة   | 380    | 7/10       | Yesterday      | |
+--------------------------------------------------+
```

### States Matrix

| Screen | State | Visual | Copy | Interaction | Data State |
|--------|-------|--------|------|-------------|------------|
| **Memorization** | Empty | Gray book icon | "لم تضف أي سور بعد" | CTA "ابدأ الآن" | `[]` |
| **Memorization** | Loading | Skeleton table rows | "جاري التحميل..." | Disabled | `Promise<void>` |
| **Memorization** | Loaded | Table with status badges | Surah names + dates | Full interaction | `MemorizationItem[]` |
| **Ward Player** | Loading Audio | Spinner on play button | "جاري تحميل الصوت..." | Play disabled | `Promise<AudioBuffer>` |
| **Ward Player** | Playing | Animated play indicator | Ayah X of Y | Pause/Next/Prev active | `AudioPlaying` |
| **Ward Player** | Error | Red banner | "تعذر تحميل الصوت" | Retry button | `Error` |
| **Hifz** | In Progress | Masked words grid | Score + hints counter | Click words to guess | `HifzSession` |
| **Hifz** | Complete | Green success banner | Final score + level | "Next Level" or "Retry" | `HifzResult` |
| **Competition** | No Games | Empty podium icon | "ابدأ أول تحدٍّ لك" | Game mode cards active | `null` |
| **Competition** | In Game | Timer + question display | Question text + choices | Select answer | `ActiveChallenge` |
| **Competition** | Results | Score breakdown | Points earned + rank | "Play Again" or "Home" | `GameResult` |
| **Teacher** | No Submissions | Checkmark icon | "لا توجد تسليمات معلقة" | Create task CTA | `[]` |
| **Teacher** | Pending | Submission cards | Student + task info | Play/Approve/Reject | `Submission[]` |
| **Auth** | Logged Out | Login button visible | "تسجيل الدخول" | Click to open modal | `null` |
| **Auth** | Logged In | Username + logout button | User's name | Logout available | `User` |
| **Auth** | Error | Red text in modal | "بيانات خاطئة" | Retry login | `Error` |

### 2.4 Content & Copy
🟢 CONFIRMED (from `index.html`, `script.js` string literals)
- **Voice/Tone**: Respectful, encouraging, Islamic-appropriate. Arabic-first with professional terminology.
- **Key Strings**:
  - CTA: "ابدأ الآن" (Start Now), "أضف سورة" (Add Surah), "شغّل الورد" (Play Ward)
  - Empty: "لم تضف أي سور بعد" (No surahs added yet)
  - Errors: "تعذر تحميل الصوت" (Audio failed to load), "حدث خطأ" (An error occurred)
  - Success: "تم الحفظ بنجاح" (Saved successfully), "تمت الموافقة" (Approved)
  - Auth: "تسجيل الدخول" (Login), "إنشاء حساب" (Create Account), "خروج" (Logout)

### 2.5 Accessibility (a11y)
⚠️ INFERRED (from `index.html` structure and `style.css`)
- **Keyboard**: Tab order follows RTL reading direction; modals should trap focus; Escape closes modals and audio player overlays
- **Screen Readers**: ARIA labels needed on icon-only buttons (theme toggle, play/pause); `aria-live="polite"` regions for score updates, audio status changes, and submission status
- **Visual**: Islamic green (#2d5016) on white background meets WCAG AA contrast; focus indicators via `outline` on interactive elements; status badges use color + icon (not color alone)
- **Motion**: Audio visualizations and card hover effects should respect `prefers-reduced-motion`

### 2.6 Internationalization (i18n) & RTL
🟢 CONFIRMED (from `index.html` `lang="ar" dir="rtl"`, `manifest.json` `"lang": "ar", "dir": "rtl"`)
- **Current**: Arabic-only UI with RTL layout throughout
- **Text Expansion**: Not currently applicable (single language); V2 should reserve 150% expansion space for translations
- **RTL**: ✅ Already native RTL — `dir="rtl"` on `<html>`, CSS uses logical properties where applicable; navigation flows right-to-left; audio player controls mirror appropriately
- **Formatting**: Dates displayed in Islamic/Hijri format where applicable; numbers use Arabic-Indic numerals in some contexts; consideration needed for locale-aware date formatting in V2
- **Quran Text**: Uses proper Arabic Unicode with tashkeel (diacritical marks); font stack (`Amiri`, `Noto Naskh Arabic`) ensures correct rendering across platforms

---

## 3. Technical Design Doc

### 3.1 Architecture Analysis
🟢 CONFIRMED (from repository file structure, `script.js`, Django backend)

**Current (As-Is)**:
- **Pattern**: Monolithic single-page application (frontend) + Django REST API (backend)
- **Frontend**: Single `script.js` file (~4,870 lines) containing all application logic, state management, UI rendering, audio handling, and game engines; no build tooling, no module system
- **Backend**: Django 5.2 with DRF, organized into 3 apps (`tasks`, `submissions`, `points`); JWT authentication via SimpleJWT
- **Stack**:
  - Frontend: Vanilla JavaScript, CSS3, HTML5, Service Worker (PWA)
  - Backend: Django 5.2.11, DRF 3.16.1, PostgreSQL (production), SQLite (dev), Cloudinary (media storage)
  - Hosting: GitHub Pages (frontend), Render.com (backend)
- **Pain points**:
  - `script.js` is a monolithic file — high coupling, difficult to test, hard to onboard new contributors
  - No frontend build tooling — no tree-shaking, code splitting, or minification
  - localStorage as primary data store — data loss risk, no cross-device sync
  - No frontend test coverage beyond `audio-config.test.js`
  - API error handling is inconsistent across views
  - `ancien django/` directory naming suggests legacy/transitional architecture

**Target (To-Be)**: 🔴 ASSUMPTION (requires team alignment)
- **Pattern**: Feature-based modular frontend with ES modules + maintained Django REST backend
- **Rationale**: Modularizing `script.js` into feature files (memorization, ward, hifz, competition, auth, etc.) improves maintainability without requiring a framework migration
- **Migration**: Strangler fig approach — extract one feature module at a time starting with the most independent (audio-config, already separate); introduce a lightweight bundler (esbuild or Vite) to enable ES module imports

### 3.2 Data Architecture

**Schema — Frontend (localStorage)**: 🟢 CONFIRMED (from `script.js`)
```typescript
// Pseudocode — conceptual data shapes, not actual TypeScript implementation
// Current storage keys and shapes

interface MemorizationItem {
  id: string;              // UUID
  surahId: number;         // 1–114
  fromAyah: number;
  toAyah: number;
  status: 'new' | 'learning' | 'strong' | 'weak';
  dateAdded: string;       // ISO8601
  lastReviewed: string;    // ISO8601
  nextReview: string;      // ISO8601 (spaced repetition)
  reviewCount: number;
}

interface CompetitionStats {
  totalPoints: number;
  gamesPlayed: number;
  rank: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  history: GameResult[];
}

interface HifzSession {
  surahId: number;
  fromAyah: number;
  toAyah: number;
  level: 1 | 2 | 3 | 4 | 5;  // 20%–100% masking
  score: number;
  hintsUsed: number;
  completed: boolean;
}

interface AppSettings {
  userName: string;
  dailyGoal: number;
  theme: 'light' | 'dark';
  notifications: boolean;
  ayahDelay: number;        // ms between ayahs in Ward player
  autoPlayNext: boolean;
  currentReciter: string;
  currentBitrate: number;
}
```

**Schema — Backend (Django Models)**: 🟢 CONFIRMED (from `tasks/models.py`, `submissions/models.py`, `points/models.py`)
```typescript
// Pseudocode — conceptual data shapes, not actual TypeScript implementation
// Django model shapes

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'teacher';
  description: string;
  is_superuser: boolean;
}

interface Task {
  id: number;
  title: string;
  description: string;
  task_type: 'recitation' | 'memorization' | 'other';
  points: number;
  due_date: string;          // ISO8601
  status: 'active' | 'completed';
  created_by: number;        // User FK
  assigned_users: number[];  // User M2M
  assigned_teams: number[];  // Team M2M
}

interface Submission {
  id: number;
  task: number;              // Task FK
  student: number;           // User FK
  audio_file: string;        // Cloudinary URL
  status: 'submitted' | 'approved' | 'rejected';
  admin_feedback: string;
  points_awarded: boolean;
  created_at: string;        // ISO8601
}

interface PointsLog {
  id: number;
  student: number;           // User FK
  delta: number;             // Can be positive or negative
  reason: string;
  created_at: string;        // ISO8601
}
```

**Storage Strategy**: Hybrid — localStorage for offline-first features (memorization, settings, hifz, competition); PostgreSQL for multi-user features (tasks, submissions, points, leaderboard)

**Migration Plan**: No immediate schema migration needed; future V2 consideration: sync localStorage memorization data to backend for cross-device access

**Backup/DR**: Backend data backed up via Render.com PostgreSQL managed backups; frontend localStorage has no backup mechanism (risk area)

### 3.3 API Contracts
🟢 CONFIRMED (from `ancien django/MYSITEE/MYSITEE/mysite/api_urls.py`, `api_views.py`)

**Authentication**:
```
POST /api/token/
Body: { username: string, password: string }
Responses:
  200 OK → { access: JWT, refresh: JWT }
  401 Unauthorized → { detail: "No active account found with the given credentials" }

POST /api/token/refresh/
Body: { refresh: JWT }
Responses:
  200 OK → { access: JWT }
  401 Unauthorized → { detail: "Token is invalid or expired" }

POST /api/register/
Body: { username: string, email: string, password: string, first_name: string }
Responses:
  201 Created → { id, username, email, role }
  400 Bad Request → { errors: { field: [messages] } }
```

**User**:
```
GET /api/me/
Authorization: Bearer <access_token>
Responses:
  200 OK → { id, username, email, first_name, last_name, role, is_superuser }
  401 Unauthorized → { detail: "Authentication credentials were not provided." }

GET /api/points/
Authorization: Bearer <access_token>
Responses:
  200 OK → { total_points: number, logs: PointsLog[] }
```

**Tasks**:
```
GET /api/tasks/
Authorization: Bearer <access_token>
Responses:
  200 OK → Task[]

POST /api/tasks/create/
Authorization: Bearer <access_token> (teacher/admin only)
Body: { title, description, task_type, points, due_date, assigned_users: number[] }
Responses:
  201 Created → Task
  403 Forbidden → { detail: "Not authorized" }
```

**Submissions**:
```
POST /api/submissions/
Authorization: Bearer <access_token>
Body: FormData { task: number, audio_file: File }
Responses:
  201 Created → Submission
  400 Bad Request → { errors }

GET /api/my-submissions/
Authorization: Bearer <access_token>
Responses:
  200 OK → Submission[]

GET /api/pending-submissions/
Authorization: Bearer <access_token> (teacher only)
Responses:
  200 OK → Submission[]

POST /api/submissions/{id}/approve/
Authorization: Bearer <access_token> (teacher only)
Body: { feedback?: string }
Responses:
  200 OK → { status: "approved", points_awarded: true }

POST /api/submissions/{id}/reject/
Authorization: Bearer <access_token> (teacher only)
Body: { feedback: string }
Responses:
  200 OK → { status: "rejected" }
```

**Teacher**:
```
GET /api/my-students/
Authorization: Bearer <access_token> (teacher only)
Responses:
  200 OK → User[]

GET /api/students/{id}/progress/
Authorization: Bearer <access_token> (teacher only)
Responses:
  200 OK → { points, submissions_count, approved_count, ... }
```

**Admin**:
```
GET /api/admin/users/
Authorization: Bearer <access_token> (superuser only)
Responses:
  200 OK → User[]

POST /api/admin/create-teacher/
Authorization: Bearer <access_token> (superuser only)
Body: { username, email, password }
Responses:
  201 Created → User (role: teacher)

PUT /api/admin/users/{id}/
DELETE /api/admin/users/{id}/
Authorization: Bearer <access_token> (superuser only)
```

**State Management**:
- Server: Direct `fetch()` calls with JWT headers; no caching library (React Query/SWR); manual token refresh on 401
- Client: Global `QuranReview` object with localStorage persistence; no state management library; auto-save every 30s via `setInterval`

### 3.4 Performance Strategy
⚠️ INFERRED (from current architecture)

**Current Budgets** (estimated, unminified sizes — gzipped sizes would be ~3–5x smaller):
- Bundle: `script.js` ~4,870 lines unminified (~150KB raw, ~30–50KB gzipped), `style.css` ~1,400 lines (~40KB raw, ~8–12KB gzipped), `audio-config.js` ~300 lines (~10KB raw, ~3KB gzipped)
- TTI: Dependent on font loading (Google Fonts) and CDN availability
- Lighthouse: Not currently measured

**Current Optimizations**:
- Service Worker caching: App shell (network-first) + audio files (cache-first)
- Google Fonts preconnect (`rel="preconnect"`)
- PWA manifest for installable app (avoids browser chrome overhead)
- Precomputed cumulative ayah counts for O(1) lookup (`audio-config.js` line 188–193)

**Recommended Optimizations** (V2):
- Code splitting: Extract `script.js` into route-level modules (memorization, ward, hifz, competition, auth)
- Lazy loading: Defer competition and hifz game engines until user navigates to those pages
- Minification: Add build step to minify JS/CSS (currently served unminified)
- Image optimization: Quran page images from CDN could benefit from lazy loading with `loading="lazy"`
- Database: Add database indexes on `Submission.student`, `Submission.status`, `Task.due_date` for common query patterns

### 3.5 Infrastructure & Config Changes
🟢 CONFIRMED (from `.github/workflows/django-ci.yml`, `render.yaml`, `CNAME`)

**Current Infrastructure**:
- CI/CD: GitHub Actions workflow (`django-ci.yml`) runs on push/PR to `main` targeting `ancien django/**` — runs Django system checks and `submissions` app tests
- Frontend hosting: GitHub Pages with custom domain `quranreview.live` (via CNAME file)
- Backend hosting: Render.com with PostgreSQL, Gunicorn, WhiteNoise static serving
- Media storage: Cloudinary for audio submissions
- No frontend CI/CD pipeline exists

**Recommended Changes** (architectural descriptions only):
- Add GitHub Actions workflow for frontend: run `npm test` on push/PR affecting `*.js`, `*.html`, `*.css`
- Add frontend linting step (ESLint for JavaScript quality)
- Consider adding a staging environment on Render for backend changes before production deployment
- Add health check monitoring for `api.quranreview.live`

### 3.6 Security & Privacy
🟢 CONFIRMED (from `settings.py`, `api_views.py`, `script.js`)

- **Authentication**: JWT via `djangorestframework-simplejwt`; access token stored in localStorage (`quranreview_api_token`); refresh token flow implemented in frontend
- **Authorization**: Role-based (student/teacher/superuser); enforced via DRF permissions in API views; frontend hides UI elements based on `user.role` but server-side enforcement is the trust boundary
- **Privacy**: User data (username, email) stored in PostgreSQL; audio submissions stored in Cloudinary; localStorage data stays on device; no analytics tracking visible in codebase
- **Input Validation**: Django model-level validation (file size max 10MB, allowed audio formats); DRF serializer validation; frontend does basic form validation before API calls
- **Secrets Management**: Environment variables for `SECRET_KEY`, `DATABASE_URL`, `CLOUDINARY_*`; CI uses hardcoded test secret key (acceptable for CI-only); `.gitignore` excludes `.env`
- **CORS**: Configured in Django settings; DEBUG mode allows all origins (development only); production should restrict to `quranreview.live`
- **Security Headers**: Django SecurityMiddleware enabled; `SECURE_SSL_REDIRECT` configurable via env var

⚠️ INFERRED concerns:
- JWT stored in localStorage is vulnerable to XSS; consider HttpOnly cookie approach in V2
- No rate limiting visible on API endpoints (risk for brute-force on `/api/token/`)
- No CSRF protection on API endpoints (acceptable for JWT-only API but worth noting)
- Audio file uploads should be scanned for malicious content (not currently implemented)

### 3.7 Testing Strategy
🟢 CONFIRMED (from `tests/audio-config.test.js`, `.github/workflows/django-ci.yml`)

**Current Coverage**:
- Frontend: 1 test file (`tests/audio-config.test.js`) with 12 tests covering `surahAyahToGlobal()` and `getSurahAyahRange()` functions using Node.js `assert` module
- Backend: Django test runner for `submissions` app (run in CI)
- E2E: None
- Integration: None

**Current Distribution**: Minimal — Unit tests only for audio-config utility and Django submissions

**Recommended Strategy** (V2):
- Distribution: Unit 70% | Integration 20% | E2E 10%
- Tools: Node.js `assert` (current) or migrate to Jest/Vitest for frontend; Django TestCase for backend; Playwright for E2E
- Priority test targets:
  - Spaced repetition scheduling algorithm
  - Competition scoring and rank calculation
  - Hifz word masking and difficulty engine
  - API authentication flow (token/refresh)
  - Audio playback state machine
- Data: Factory patterns for Django models; fixture data for Quran ayah mappings (already exists in `ayahCounts` array)
- Mocks: Mock `fetch()` for API calls in frontend tests; mock Cloudinary uploads in Django tests

---

## 4. Execution Plan

### 4.1 Work Breakdown

**Epic 1: Frontend Testing Foundation**
- Story 1.1: As a developer, I want a frontend CI pipeline so that JavaScript changes are automatically tested | Tasks: Create GitHub Actions workflow for `npm test` on JS file changes | Est: 2 SP
- Story 1.2: As a developer, I want unit tests for spaced repetition logic so that review scheduling is reliable | Tasks: Extract scheduling functions, write test cases for interval calculation | Est: 3 SP
- Story 1.3: As a developer, I want unit tests for competition scoring so that rankings are accurate | Tasks: Extract scoring logic, test rank thresholds and edge cases | Est: 3 SP

**Epic 2: Code Modularization**
- Story 2.1: As a developer, I want `script.js` split into feature modules so that code is maintainable | Tasks: Introduce ES module structure, extract Logger, AudioManager, StateManager | Est: 8 SP
- Story 2.2: As a developer, I want a build tool configured so that modules are bundled for production | Tasks: Add Vite or esbuild, configure entry point and output | Est: 5 SP

**Epic 3: Data Reliability**
- Story 3.1: As a user, I want my memorization data synced to the server so that I don't lose progress | Tasks: Design sync API endpoints, implement bidirectional sync with conflict resolution | Est: 13 SP
- Story 3.2: As a user, I want export/import of my data so that I can backup my progress | Tasks: Add JSON export button in settings, import with validation | Est: 5 SP

**Epic 4: UX Polish**
- Story 4.1: As a user, I want accessible keyboard navigation so that I can use the app without a mouse | Tasks: Add focus management, ARIA labels, keyboard shortcuts for audio player | Est: 5 SP
- Story 4.2: As a user, I want proper error states so that I know when something goes wrong | Tasks: Add error boundaries, retry mechanisms, user-friendly error messages | Est: 3 SP

**Epic 5: Performance**
- Story 5.1: As a user, I want fast page loads so that the app feels responsive | Tasks: Minify JS/CSS, lazy load non-critical features, optimize font loading | Est: 5 SP

### 4.2 Prioritization Matrix
| Epic | RICE Score | MoSCoW | Effort | Phase | Files Affected |
|------|------------|--------|--------|-------|----------------|
| Epic 1: Frontend Testing | R:8 I:9 C:95% E:2 = 34.2 | Must | 8 SP | Sprint 1 | `.github/workflows/`, `tests/`, `script.js` |
| Epic 3: Data Reliability | R:7 I:10 C:70% E:5 = 9.8 | Must | 18 SP | Sprint 2–3 | `api_urls.py`, `api_views.py`, `script.js`, new `sync/` app |
| Epic 4: UX Polish | R:8 I:7 C:90% E:2 = 25.2 | Should | 8 SP | Sprint 2 | `index.html`, `style.css`, `script.js` |
| Epic 2: Code Modularization | R:5 I:8 C:80% E:5 = 6.4 | Should | 13 SP | Sprint 3–4 | `script.js` → `src/`, `package.json`, build config |
| Epic 5: Performance | R:6 I:6 C:85% E:2 = 15.3 | Could | 5 SP | Sprint 4 | `index.html`, build config, `sw.js` |

### 4.3 Release Roadmap
**Sprint 0 (Current)**: Spec pack creation, architecture documentation, team alignment
**Sprint 1 (2 weeks)**: Frontend CI pipeline, core unit tests for audio-config and spaced repetition
**Sprint 2 (2 weeks)**: A11y improvements (keyboard nav, ARIA), error state handling, data export/import
**Sprint 3 (2 weeks)**: Server-side memorization sync API, begin `script.js` modularization
**Sprint 4 (2 weeks)**: Complete modularization, performance optimization, build tooling
**Release**: Feature-flag gated per epic; full release after Sprint 4 QA pass

### 4.4 Definition of Done
- [ ] Unit tests > 80% coverage for modified/new code
- [ ] A11y: Keyboard navigation works for all interactive elements; screen reader announcement for dynamic content
- [ ] i18n: All user-facing strings in Arabic; RTL layout verified on all new screens
- [ ] Performance budget met: No single JS file > 100KB minified+gzipped; TTI < 3s on 3G
- [ ] Security: Input validation on all API endpoints; no secrets in source code; JWT token handling follows best practices
- [ ] QA checklist executed (see below)

**QA Checklist**:
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge (latest 2 versions)
- [ ] Mobile: iOS Safari, Android Chrome (RTL layout verified)
- [ ] Error states: Offline mode, 500 errors from API, audio CDN timeout, invalid form input
- [ ] A11y: axe-core passes on all pages, logical tab order (RTL), focus visible on all interactive elements
- [ ] Audio: Playback works across browsers, correct ayah mapping, reciter switching, quality switching
- [ ] Auth: Login, register, token refresh, logout, role-based page visibility
- [ ] Data: localStorage persistence across sessions, graceful handling of storage quota exceeded

---

## 5. Alignment Questions

1. **Scope Validation**: "The spec proposes deferring multi-language UI and push notifications to V2. Confirm acceptable, or is English language support required for V1?"
   - *Recommended*: Defer to V2 — current user base is Arabic-speaking; adding i18n infrastructure now would slow V1 delivery.

2. **Technical Constraints**: "Can we introduce a build tool (Vite/esbuild) to the frontend, or must we maintain the zero-build vanilla JS approach?"
   - *Recommended*: Introduce Vite — it preserves the developer experience for simple setups while enabling ES modules, minification, and code splitting. The current ~4,870-line monolithic `script.js` is a maintainability risk.

3. **Migration Strategy**: "Server-side memorization sync requires a new Django app and API endpoints. Approach A) Add alongside existing apps with new endpoints, or B) Refactor existing `tasks` app to include memorization?"
   - *Recommended*: Approach A — new `memorization` Django app to keep concerns separated; existing `tasks` app handles teacher-assigned work.

4. **UX Trade-off**: "Adding proper error states and loading skeletons increases code complexity but improves reliability perception. Prioritize speed (current approach) or clarity (skeleton + error states)?"
   - *Recommended*: Clarity — users lose trust when audio fails silently or data doesn't save; skeleton states provide visual feedback that builds confidence.

5. **Privacy Stance**: "Should we add analytics tracking (session duration, feature usage) to measure success metrics, or maintain the current privacy-first approach (no tracking)?"
   - *Recommended*: Privacy-first for V1 — the app handles religious practice data; add opt-in, privacy-respecting analytics (e.g., Plausible) in V2 only if needed for growth decisions.

6. **Risk Appetite**: "If Epic 1 (Testing Foundation) runs over the 2-week estimate, should we cut scope from later epics or extend the timeline?"
   - *Recommended*: Cut scope from Epic 5 (Performance) — testing foundation is non-negotiable for reliability; performance optimizations can be deferred since the app is already functional.

---

## 6. Risk Register

| # | Risk | Probability | Impact | Mitigation | Status |
|---|------|-------------|--------|------------|--------|
| 1 | **localStorage data loss** — Users lose all memorization progress if browser data is cleared | High | High | Implement server-side sync (Epic 3); add data export feature as interim solution (Story 3.2) | 🔴 Active risk — no mitigation in place |
| 2 | **Monolithic script.js** — Single 4,870-line file makes it difficult to add features, fix bugs, or onboard contributors without introducing regressions | High | Medium | Modularization plan (Epic 2); frontend CI (Epic 1) provides safety net for refactoring | ⚠️ Partially mitigated by existing test coverage on audio-config |
| 3 | **CDN dependency** — Audio streaming relies entirely on `cdn.islamic.network`; service disruption would break Ward and Hifz features | Medium | High | Service worker already caches audio (cache-first strategy in `sw.js`); consider pre-downloading commonly used surahs; local audio fallback path exists (`/audio/*.mp3`) | ⚠️ Partially mitigated by SW caching |
