## 2024-05-18 - Missing loading spinners on async buttons
**Learning:** Async operations like task creation or user edits have disabled states but do not always use the available `btn-loading` CSS class for visual feedback, leading to inconsistent UI patterns and potentially confusing users during loading delays.
**Action:** Add the `.btn-loading` class to async button submits, such as in `TeacherDevoirsSection.js`, when performing heavy operations like assigning tasks to all students.
