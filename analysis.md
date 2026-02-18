We are performing a cross-artifact consistency analysis for the Go project artifacts: spec.md, plan.md, tasks.md, and the constitution.
 The constitution is provided and non-negotiable.

 Steps:
 1. We have the artifacts loaded (provided in context).
 2. We'll build semantic models:
    - Requirements inventory from spec.md (FR1-FR6, NFR1-NFR4, and user stories US1-US5)
    - User stories: 5 stories (US1-US5)
    - Task coverage mapping: tasks.md has tasks T001-T037, each tagged with user stories (e.g., T011 [US1])
    - Constitution: 9 principles

 3. Detection passes:
    A. Duplication: Check for duplicate requirements or tasks.
    B. Ambiguity: Vague terms, placeholders.
    C. Underspecification: Missing details in requirements, tasks referencing undefined components.
    D. Constitution alignment: Check violations of MUST principles.
    E. Coverage gaps: Requirements without tasks, tasks without requirements.
    F. Inconsistency: Terminology, data entities, task ordering conflicts.

 4. Severity assignment: Use the heuristic (CRITICAL, HIGH, MEDIUM, LOW).

 5. Produce report with tables and metrics.

 Let's break it down:

 I. Requirements Inventory (from spec.md):
    Functional:
      FR1: Game board rendering
      FR2: Stone placement
      FR3: Capture detection
      FR4: Matchmaking system
      FR5: Game state persistence
      FR6: Game conclusion

    Non-functional:
      NFR1: Board responsiveness (200ms)
      NFR2: Game load time (1s)
      NFR3: WCAG 2.1 AA compliance
      NFR4: Offline play

    User Stories (as numbered US1-US5)

 II. Task Coverage Mapping (from tasks.md):
    Tasks are mapped to user stories (e.g., T011 [US1] for game creation). 
    We note that:
      - US1: T011, T012, T013, T014, T015
      - US2: T016, T017, T018, T019, T020
      - US3: T021, T022, T023, T024
      - US4: T025, T026, T027, T028
      - US5: T029, T030, T031, T032

    Also, there are tasks in the Polish phase (T033-T037) that are not explicitly mapped to a user story.

    We must map tasks to requirements (FRs and NFRs) as well. Since tasks are mapped to user stories, and user stories are high-level, we need to see if the FRs/NFRs are covered.

    How?
      - FR1 (board rendering): Covered by T017 (board rendering component) and T028 (capture animation) might be part of it? Also T017 is under US2 (stone placement) but board rendering is needed for stone placement.
      - FR2 (stone placement): Covered by T016 (validation), T018 (endpoint), T019 (handlers)
      - FR3 (capture detection): Covered by T026 (capture service) and T028 (animation) for display?
      - FR4 (matchmaking): Covered by T011 (Game model), T012 (endpoint), T013 (UI), T014 (lobby)
      - FR5 (game state persistence): Covered by T009 (IndexedDB), T031 (archival) for history? Also T035 (offline sync) for persistence during offline.
      - FR6 (game conclusion): Covered by T033 (scoring rules) and possibly T026 (capture) is part of it? But note T033 is in Polish phase.

    Non-functional:
      NFR1 (responsiveness): Not explicitly covered by a task? We have T024 (latency monitoring) which is for spectator, but not for the board responsiveness. Also, T018 (move submission) must be fast, but no task for performance testing of move.
      NFR2 (load time): Not explicitly covered? T008 (service worker) and T009 (IndexedDB) help with offline, but no task for measuring load time.
      NFR3 (WCAG): Covered by T034 (compliance checks in CI)
      NFR4 (offline): Covered by T008 (service worker), T009 (IndexedDB), T035 (sync handler)

    Also, note that the constitution has principles that are not all covered by NFRs? We have:

    Constitution principles:
      1. Code Quality: Covered by T004 (ESLint), T005 (PEP8), T034 (WCAG checks in CI? Not exactly, but WCAG is accessibility) -> Actually, T034 is for accessibility, not code quality. Code quality tasks: T004, T005, and T020 (tests), T015 (Playwright), etc. But no explicit task for technical debt (constitution says "Technical debt MUST be addressed in the same sprint") - no task for that.

      2. Security: Not covered? The plan.md noted security as ⚠️ because authN/authZ not specified. In tasks, we don't see any security tasks (e.g., authentication, dependency scanning). This is a critical gap.

      3. Performance: We have NFR1 and NFR2, but tasks for performance? T024 is for spectator latency, but not for the board responsiveness (NFR1) or load time (NFR2). Also, constitution requires API endpoints <=500ms and UI load within 3s on 3G. We don't have tasks for performance testing.

      4. Accessibility: Covered by T034 (WCAG compliance checks).

      5. RTL Support: The constitution requires it. In the spec, it's not mentioned? The plan.md has a research task (T004 in research) but no implementation task? We don't see an RTL task in tasks.md.

      6. Offline-First PWA: Covered by T008, T009, T035.

      7. Separation of Concerns: We have tasks for frontend and backend separation? Not explicitly, but the structure implies it (frontend/backend tasks). However, the constitution requires frontend not to contain business logic. We have T016 (validation in backend) which is good, but no task to check frontend for business logic? This might be covered by code reviews, but no explicit task.

      8. Error Handling: The constitution requires user-facing errors with actionable steps. We have T036 (error recovery UX patterns) which covers this.

      9. Testability: Covered by T015, T020, T024? And T034? We have E2E and unit tests tasks. But constitution requires 80% unit test coverage and Playwright E2E tests. We have T015 (Playwright for game creation) and T020 (unit tests for move validation). But we don't have a task for 80% coverage of core logic? T020 is for move validation only. Also, no task for test data isolation.

 III. Detection:

    A. Duplication:
        - None obvious in requirements or tasks.

    B. Ambiguity:
        - In plan.md: There are "NEEDS CLARIFICATION" for library selection and implementation patterns (but research.md provided answers, so resolved?).
        - In spec.md: The acceptance criteria AC3 says "Score calculation works for all standard board sizes" but the data model in plan.md (data-model.md) has board_size as an integer (9,13,19). This is clear.

    C. Underspecification:
        - Security: The spec does not mention authentication/authorization. The plan.md notes this as a warning. This is a gap.
        - RTL Support: Not mentioned in spec.md? The constitution requires it. The plan.md has research but no implementation task? So under-specified in spec and missing task.

    D. Constitution Alignment:
        - Security: Violation of constitution MUST (security principle) because no authN/authZ specified and no tasks for security. CRITICAL.
        - RTL Support: Violation because constitution requires it, but not in spec and no task. CRITICAL.
        - Performance: Constitution requires UI load within 3s on 3G and API <=500ms. We have NFR1 (200ms for stone feedback) and NFR2 (1s load time) which are good, but no tasks for performance testing? So we might not be able to verify. Also, the constitution requires memory leak checks - not addressed. MEDIUM/HIGH?
        - Code Quality: Technical debt must be addressed in same sprint - no task for that. MEDIUM.
        - Separation of Concerns: No explicit task to ensure frontend has no business logic? We have validation in backend (T016) but no check for frontend. MEDIUM.
        - Testability: We have tasks for tests, but:
            - T033 (scoring) doesn't have a test task? We have T020 for move validation, but scoring is separate? Also, no task for 80% unit test coverage of core logic (only move validation is tested). Also, no task for test data isolation. MEDIUM.

    E. Coverage Gaps:
        - Requirements without tasks:
            - FR6 (game conclusion): Partially covered by T033 (scoring) but not by a task in the main phases? T033 is in Polish phase. Also, we don't have a task for detecting when both players pass (part of FR6). So FR6 is partially covered? But note T033 is there.
            - NFR1 (board responsiveness): No task for performance testing of stone placement feedback? We have T024 for spectator latency, but not for the board. So uncovered.
            - NFR2 (game load time): No task for measuring or optimizing load time.
            - Also, the constitution principles are requirements too? So:
                - Security: No tasks -> gap.
                - RTL: No tasks -> gap.
                - Performance (constitution): No tasks for API performance under load (only has T024 for spectator) and no task for UI load on 3G -> gap.
                - Code Quality: No task for technical debt handling -> gap.
                - Separation of Concerns: No task to enforce -> gap? (but might be design)
                - Testability: Missing tasks for 80% coverage and test data isolation -> gap.

        - Tasks without requirements:
            - T036: Error recovery UX -> This maps to constitution principle 8 (error handling) but not to a specific requirement in spec? The spec doesn't mention error handling. So the task is for the constitution? Then we should note that the requirement comes from the constitution.

    F. Inconsistency:
        - Terminology: 
            - In spec.md: "game session", in plan.md: "game room" (same concept?) -> Inconsistency? Not critical.
        - Data entities:
            - spec.md data model: Game, GameState, Player.
            - plan.md data model: Game, Player, GameState (with version). Consistent.
        - Task ordering: 
            - The tasks are grouped by phase and user story. The dependency graph shows US1->US2, US1->US3, etc. This seems consistent with the plan.
        - Conflicting requirements: None found.

 IV. Severity Assignment:

    We'll assign severity per finding:

    CRITICAL:
      - Security: No authentication/authorization in spec and no tasks -> violates constitution MUST. (ID: D1)
      - RTL Support: Not in spec and no tasks -> violates constitution MUST. (ID: D2)

    HIGH:
      - Performance (constitution): No tasks for API performance (<=500ms) and UI load on 3G (3s) -> violates constitution MUST. (ID: D3)
      - Testability: No task for 80% unit test coverage of core logic -> violates constitution MUST. (ID: D4)
      - Coverage: FR6 (game conclusion) is not fully covered? We have T033 for scoring, but what about detecting consecutive passes? The task T033 is for scoring, but the detection of game end (two passes) is part of FR6. We don't see a task for that. (ID: E1)
      - Coverage: NFR1 (board responsiveness) has no task -> gap. (ID: E2)

    MEDIUM:
      - Code Quality: No task for addressing technical debt in same sprint -> violates constitution MUST. (ID: D5)
      - Separation of Concerns: No explicit task to prevent business logic in frontend -> risk. (ID: D6)
      - Testability: No task for test data isolation -> violates constitution MUST. (ID: D7)
      - Coverage: NFR2 (game load time) has no task -> gap. (ID: E3)
      - Coverage: Security tasks missing -> gap (already covered in D1, but also as gap) -> we can note in coverage table.

    LOW:
      - Terminology: "game session" vs "game room" -> minor inconsistency. (ID: F1)

 V. Coverage Summary Table:

    We'll list the requirements and whether they have tasks.

    Requirements from spec:
      FR1: Yes (T017, T028? but T028 is for capture animation, which is part of FR3? FR1 is board rendering -> T017 is board rendering, so yes)
      FR2: Yes (T016, T018, T019)
      FR3: Yes (T026, T028)
      FR4: Yes (T011, T012, T013, T014)
      FR5: Yes (T009, T031, T035) -> T009 (IndexedDB) and T035 (sync) for persistence, T031 (archival) for history? But FR5 is about saving after each move and resumption -> T009 and T035 cover that? T031 is for history, which is separate.
      FR6: Partial (T033 for scoring, but missing task for detecting consecutive passes? The research says gogame library handles rules, so T016 might cover the pass? But note FR6 includes detecting when both pass and scoring. We have T033 for scoring, but the detection of passes might be in the validation? Then it's covered by T016? We'll say partial until clarified.)

      NFR1: No
      NFR2: No
      NFR3: Yes (T034)
      NFR4: Yes (T008, T009, T035)

    Also, constitutional requirements (implicit) that are not in spec but must be covered:
      Security: No
      RTL: No
      Performance (constitution): No
      Code Quality (technical debt): No
      Separation of Concerns: No explicit task
      Error Handling: Yes (T036)
      Testability: Partial (we have tests but not 80% coverage task or test data isolation)

 VI. Report:

    We'll create a findings table and coverage table.

    Findings table (limited to 50, so we prioritize):

    | ID | Category | Severity | Location(s) | Summary | Recommendation |
    |----|----------|----------|-------------|---------|----------------|
    | D1 | Constitution Alignment | CRITICAL | spec.md, tasks.md | Security principle violated: No authentication/authorization in spec and no tasks for security. | Add security requirements to spec and tasks for authN/authZ, dependency scanning. |
    | D2 | Constitution Alignment | CRITICAL | spec.md, tasks.md | RTL Support principle violated: Not specified in spec and no implementation task. | Add RTL requirement to spec and task for RTL implementation. |
    | D3 | Constitution Alignment | HIGH | tasks.md | Performance principle: No tasks for API response time (<=500ms) and UI load on 3G (3s). | Add performance testing tasks for API and UI load. |
    | D4 | Constitution Alignment | HIGH | tasks.md | Testability principle: No task for 80% unit test coverage of core logic. | Add task to measure and enforce 80% unit test coverage. |
    | E1 | Coverage Gaps | HIGH | spec.md (FR6) | Game conclusion (FR6) missing task for detecting consecutive passes. | Add task to implement pass detection and game end condition. |
    | E2 | Coverage Gaps | HIGH | spec.md (NFR1) | Board responsiveness (NFR1) has no task for performance testing. | Add task to measure and ensure stone placement feedback within 200ms. |
    | D5 | Constitution Alignment | MEDIUM | tasks.md | Code Quality: No task for addressing technical debt in same sprint. | Add a task to track technical debt and address within sprint. |
    | D6 | Constitution Alignment | MEDIUM | tasks.md | Separation of Concerns: No task to prevent business logic in frontend. | Add task to audit frontend for business logic and refactor. |
    | D7 | Constitution Alignment | MEDIUM | tasks.md | Testability: No task for test data isolation. | Add task to ensure test data isolation in E2E tests. |
    | E3 | Coverage Gaps | MEDIUM | spec.md (NFR2) | Game load time (NFR2) has no task. | Add task to optimize and measure game load time. |
    | F1 | Inconsistency | LOW | spec.md, plan.md | Terminology: "game session" (spec) vs "game room" (plan). | Standardize terminology to "game session" or "game room" consistently. |

    Coverage Summary Table:

    | Requirement Key | Has Task? | Task IDs | Notes |
    |-----------------|-----------|----------|-------|
    | FR1 | Yes | T017 | Board rendering |
    | FR2 | Yes | T016, T018, T019 | Stone placement |
    | FR3 | Yes | T026, T028 | Capture detection |
    | FR4 | Yes | T011, T012, T013, T014 | Matchmaking |
    | FR5 | Yes | T009, T035 | Game state persistence (T009: IndexedDB, T035: sync) |
    | FR6 | Partial | T033 | Scoring implemented, but pass detection? |
    | NFR1 | No | - | Board responsiveness |
    | NFR2 | No | - | Game load time |
    | NFR3 | Yes | T034 | WCAG compliance |
    | NFR4 | Yes | T008, T009, T035 | Offline play |
    | Security (constitution) | No | - | Missing |
    | RTL (constitution) | No | - | Missing |
    | Performance (constitution) | No | - | Missing tasks for API and UI performance |
    | Code Quality (technical debt) | No | - | Missing task |
    | Separation of Concerns | Partial | Implied by structure | No explicit task |
    | Error Handling | Yes | T036 | Error recovery UX |
    | Testability | Partial | T015, T020, T024 | Missing 80% coverage task