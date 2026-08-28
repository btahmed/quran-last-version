# Configuration Supabase — QuranReview

## Source de vérité

La configuration reproductible est dans :

- `supabase/migrations/20260828_secure_foundation.sql`
- `supabase/SECURITY_MATRIX.md`
- `supabase/functions/send-push/index.ts`

Ne pas exécuter d'anciens snippets SQL avec `USING (true)` ou un Storage
public. La migration active RLS sur toutes les tables métier, crée le bucket
audio privé et installe les fonctions transactionnelles de validation.

## Appliquer le schéma

Après sauvegarde de la base, appliquer les migrations dans l'ordre avec le CLI
Supabase ou le SQL Editor :

```bash
supabase db push
```

La migration est idempotente pour les tables, colonnes, indexes, policies,
fonctions et bucket. Les contraintes ajoutées `NOT VALID` protègent les
écritures nouvelles tout en laissant une fenêtre de nettoyage des données
historiques avant validation complète.

## Rôles et autorisations

Les rôles effectifs sont lus dans `public.profiles` à partir de l'identité
`auth.uid()`. Un rôle reçu dans `user_metadata`, un paramètre d'URL ou
`localStorage` n'est jamais une preuve d'autorisation.

- Un étudiant lit et crée uniquement ses propres données.
- Un enseignant gère uniquement les classes et élèves qui lui sont rattachés.
- Un administrateur dispose des opérations d'administration prévues par les
  policies.
- Les profils ne sont pas publics ; le leaderboard est une vue de projection
  limitée au classement.
- `points_log` n'est pas insérable depuis le navigateur.

## Storage audio

Le bucket `audio-submissions` est privé, limité à 10 MiB et aux types
`audio/webm`, `audio/mp3`, `audio/wav`, `audio/m4a`. Les chemins sont écrits
avec le préfixe UUID de l'élève (`<student-uuid>/<task-id>/<file>.webm`).

Les URLs audio sont signées à la demande. Un étudiant ne peut gérer que ses
propres chemins ; un enseignant ne peut lire que les fichiers des élèves de ses
classes.

## Notifications push

Configurer dans les secrets de l'Edge Function, jamais dans Git ou
`localStorage` :

| Nom | Valeur |
| --- | --- |
| `VAPID_PUBLIC_KEY` | La clé publique de `frontend/src/services/push-notifications.js` |
| `VAPID_PRIVATE_KEY` | La clé privée correspondante, uniquement côté serveur |
| `VAPID_SUBJECT` | Une adresse `mailto:` valide |
| `SUPABASE_URL` | Variable fournie à l'Edge Function |
| `SUPABASE_ANON_KEY` | Variable fournie à l'Edge Function |
| `SUPABASE_SERVICE_ROLE_KEY` | Variable serveur fournie par Supabase |

La clé publique actuellement embarquée est :

```text
BE34JexsKmLk4q2vo2DLbwfQzLr9J5AA-GEQc5QGiVt92S3zcJuAOVyZeb9l0zBUybwq5l5plFd5j68RxnLj-co
```

Déployer ensuite :

```bash
supabase functions deploy send-push
```

La fonction vérifie le JWT de l'appelant, son profil, son rôle et sa relation
avec le destinataire avant de lire la subscription via la clé de service.
Une subscription expirée est renvoyée en erreur 410 et ne doit pas être
réutilisée.

La création d'un enseignant depuis l'interface admin passe par
`supabase/functions/create-user/index.ts`. Cette fonction vérifie le rôle admin,
crée le compte avec la clé de service et ne renvoie jamais le mot de passe.
Déployer les deux fonctions :

```bash
supabase functions deploy send-push
supabase functions deploy create-user
```

## Validations et points

Les actions sensibles passent par :

- `approve_submission(submission_id, points, feedback)`
- `reject_submission(submission_id, feedback)`
- `record_hifz_submission(task_id, score, surah_name, from_ayah, to_ayah, completed_ayahs)`

Ces fonctions vérifient l'identité et les droits côté base. L'approbation
verrouille la soumission, refuse une seconde validation et ajoute les points
dans la même transaction. `record_hifz_submission` plafonne le score au nombre
de points du devoir et possède une clé unique par devoir hifz et élève.

## Contrôle avant production

Suivre `supabase/SECURITY_MATRIX.md` avec trois comptes de test distincts
(étudiant, enseignant, administrateur). Vérifier les succès et refus attendus,
notamment :

1. Un étudiant ne lit ni ne modifie les données d'un autre étudiant.
2. Un enseignant ne voit ni ne modifie un élève hors de ses classes.
3. Une écriture directe dans `points_log` est refusée.
4. Deux validations concurrentes ne produisent qu'une seule ligne de points.
5. Un appel push sans JWT ou vers un destinataire non autorisé est refusé.
6. Une lecture Storage anonyme et un chemin d'un autre périmètre sont refusés.

Ne pas déployer en production avant d'avoir appliqué les migrations et validé
la configuration réelle des secrets dans le projet Supabase cible.