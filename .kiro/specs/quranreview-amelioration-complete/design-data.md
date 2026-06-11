# Data Models & APIs — QuranReview

**Parent Document:** [design.md](./design.md)

---

## 1. Database Schema Extensions

### New Tables

#### push_subscriptions
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
```

#### audit_log
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
```

#### feature_flags
```sql
CREATE TABLE feature_flags (
  name VARCHAR(100) PRIMARY KEY,
  enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Indexes to Add

```sql
-- Performance optimization indexes
CREATE INDEX idx_tasks_user_id_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_submissions_student_id_status ON submissions(student_id, status);
CREATE INDEX idx_points_log_student_id_created_at ON points_log(student_id, created_at DESC);
```

---

## 2. Row Level Security (RLS) Policies

### Students: Own data only
```sql
CREATE POLICY "students_own_data" ON tasks
  FOR SELECT USING (auth.uid() = user_id);
```

### Teachers: Assigned students' data
```sql
CREATE POLICY "teachers_assigned_students" ON tasks
  FOR SELECT USING (
    auth.uid() IN (
      SELECT teacher_id FROM classes c
      JOIN class_members cm ON c.id = cm.class_id
      WHERE cm.student_id = tasks.user_id
    )
  );
```

### Admins: Full access
```sql
CREATE POLICY "admins_all_access" ON tasks
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

---

## 3. Edge Functions

### send-push
- **Purpose:** Send Web Push notifications
- **Rate Limiting:** 100 req/min/user
- **Input:** `{user_id, title, body, url}`
- **Output:** `{success: boolean}`

### batch-grade-submissions (New)
- **Purpose:** Grade multiple submissions atomically
- **Input:** `{submission_ids[], awarded_points, feedback, teacher_id}`
- **Output:** `{processed: number, errors: []}`

### export-user-data (New)
- **Purpose:** Export user data (GDPR)
- **Input:** `{user_id, format: 'json'|'csv'}`
- **Output:** File download

---

## 4. Service APIs

### TasksService
```typescript
interface TasksService {
  getAll(filters?: {status?, type?}): Promise<Task[]>;
  getById(id: string): Promise<Task>;
  create(payload: CreateTaskPayload): Promise<Task>;
  update(id: string, payload: Partial<Task>): Promise<Task>;
  delete(id: string): Promise<void>;
  submitTask(taskId: string, audioBlob: Blob): Promise<Submission>;
}
```

### AnalyticsService
```typescript
interface AnalyticsService {
  getPointsEvolution(userId: string, days: number): Promise<ChartData>;
  getMemorizationStats(userId: string): Promise<MemorizationStats>;
  getDailyStreak(userId: string): Promise<number>;
  getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
}
```

---

**Next Module:** [design-security-performance.md](./design-security-performance.md)

