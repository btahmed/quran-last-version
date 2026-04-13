# Configuration Supabase — QuranReview

## 1. Storage Bucket

### Créer le bucket `audio-submissions`

Dans Supabase Dashboard → Storage → New bucket :

```
Name: audio-submissions
Public: Non (privé)
File size limit: 10MB
Allowed MIME types: audio/webm, audio/mp3, audio/wav, audio/m4a
```

### Policies Storage

**Option 1 : Policies permissives (recommandé pour dev/test)**

Exécuter dans SQL Editor :

```sql
-- Policy 1: Permettre upload pour tous (pas de vérification auth)
CREATE POLICY "audio_upload" 
ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'audio-submissions');

-- Policy 2: Permettre lecture pour tous
CREATE POLICY "audio_read" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'audio-submissions');

-- Policy 3: Permettre suppression pour tous (optionnel)
CREATE POLICY "audio_delete" 
ON storage.objects
FOR DELETE 
USING (bucket_id = 'audio-submissions');
```

**Option 2 : Policies avec auth Supabase (pour prod)**

Si vous utilisez Supabase Auth (pas localStorage) :

```sql
-- Upload: utilisateurs authentifiés uniquement
CREATE POLICY "audio_upload_auth" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'audio-submissions' 
  AND auth.role() = 'authenticated'
);

-- Lecture: utilisateurs authentifiés uniquement
CREATE POLICY "audio_read_auth" 
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'audio-submissions' 
  AND auth.role() = 'authenticated'
);
```

**Note** : L'app utilise actuellement localStorage (legacy Django), donc utilisez l'Option 1.

## 2. Tables et colonnes manquantes

### Ajouter colonnes dans `submissions`

```sql
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;
```

## 3. Row Level Security (RLS)

### Policy sur `profiles` (lecture publique)

```sql
-- Permettre SELECT sur profiles pour tous
CREATE POLICY "profiles_select" 
ON public.profiles 
FOR SELECT 
USING (true);
```

### Policy sur `tasks` (lecture/écriture)

```sql
-- Lecture: tous peuvent voir leurs propres tâches
CREATE POLICY "tasks_select_own" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('teacher', 'admin')
));

-- Insertion: teachers et admins peuvent créer des tâches
CREATE POLICY "tasks_insert" 
ON public.tasks 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('teacher', 'admin')
));

-- Mise à jour: teachers et admins peuvent modifier
CREATE POLICY "tasks_update" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('teacher', 'admin')
));

-- Suppression: teachers et admins peuvent supprimer
CREATE POLICY "tasks_delete" 
ON public.tasks 
FOR DELETE 
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('teacher', 'admin')
));
```

### Policy sur `submissions`

```sql
-- Lecture: étudiants voient leurs soumissions, teachers/admins voient tout
CREATE POLICY "submissions_select" 
ON public.submissions 
FOR SELECT 
USING (
  auth.uid() = student_id OR 
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin'))
);

-- Insertion: étudiants peuvent soumettre
CREATE POLICY "submissions_insert" 
ON public.submissions 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Mise à jour: teachers/admins peuvent valider
CREATE POLICY "submissions_update" 
ON public.submissions 
FOR UPDATE 
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('teacher', 'admin')
));
```

### Policy sur `points_log`

```sql
-- Lecture: étudiants voient leurs points, teachers/admins voient tout
CREATE POLICY "points_select" 
ON public.points_log 
FOR SELECT 
USING (
  auth.uid() = student_id OR 
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin'))
);

-- Insertion: teachers/admins peuvent ajouter des points
CREATE POLICY "points_insert" 
ON public.points_log 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('teacher', 'admin')
));
```

### Policy sur `classes` et `class_members`

```sql
-- Classes: lecture publique
CREATE POLICY "classes_select" 
ON public.classes 
FOR SELECT 
USING (true);

-- Classes: teachers/admins peuvent créer/modifier
CREATE POLICY "classes_insert" 
ON public.classes 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('teacher', 'admin')
));

-- Class members: lecture publique
CREATE POLICY "class_members_select" 
ON public.class_members 
FOR SELECT 
USING (true);

-- Class members: teachers/admins peuvent gérer
CREATE POLICY "class_members_insert" 
ON public.class_members 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('teacher', 'admin')
));

CREATE POLICY "class_members_delete" 
ON public.class_members 
FOR DELETE 
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('teacher', 'admin')
));
```

## 4. Vue `leaderboard`

```sql
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  p.id,
  p.username,
  COALESCE(SUM(pl.delta), 0) AS total_points
FROM profiles p
LEFT JOIN points_log pl ON p.id = pl.student_id
WHERE p.role = 'student'
GROUP BY p.id, p.username
ORDER BY total_points DESC;
```

## 5. Vérification

### Tester l'upload audio

1. Se connecter en tant qu'étudiant
2. Ouvrir une tâche
3. Cliquer sur 🎤
4. Enregistrer un audio
5. Soumettre

### Tester l'approbation

1. Se connecter en tant que teacher
2. Aller dans "Soumissions"
3. Approuver une soumission avec note emoji (1-5)
4. Vérifier que les points sont ajoutés dans `points_log`

### Tester le leaderboard

1. Aller dans "Classement"
2. Vérifier que les points s'affichent correctement

## 6. Troubleshooting

### Erreur "Bucket not found"
- Vérifier que le bucket `audio-submissions` existe dans Storage
- Vérifier les policies `audio_upload` et `audio_read`

### Erreur "Row level security policy violation"
- Vérifier que les policies RLS sont créées sur les tables
- Vérifier que `auth.uid()` correspond bien à l'utilisateur connecté

### Erreur "Profile not found"
- Vérifier que l'utilisateur a un profil dans la table `profiles`
- Vérifier que le `username` dans localStorage correspond à celui en base

### Upload audio échoue silencieusement
- Ouvrir la console navigateur (F12)
- Vérifier les erreurs Supabase
- Vérifier que le blob audio est valide (taille < 10MB)
- Vérifier le contentType du blob

---

**Note importante** : L'application utilise `localStorage` pour stocker le username (legacy Django JWT), puis résout l'UUID Supabase via une requête sur `profiles`. Cette approche permet la transition progressive vers Supabase Auth.
