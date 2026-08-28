# Matrice de vérification Supabase

Cette matrice décrit les résultats attendus après application des migrations du
répertoire `supabase/migrations`. Elle ne contient aucun identifiant, jeton ou
secret.

| Action | Étudiant | Enseignant | Administrateur | Refus attendu |
| --- | --- | --- | --- | --- |
| Lire son profil | Oui | Oui | Oui | Anon et autre étudiant |
| Lire le profil d’un élève | Non | Oui, élève d’une de ses classes | Oui | Enseignant hors classe |
| Lire ses tâches | Oui | Oui | Oui | Autre étudiant |
| Créer une tâche pour un élève | Non | Oui, élève d’une classe autorisée | Oui | Élève hors classe |
| Créer un compte enseignant | Non | Non | Oui, via l’Edge Function admin | Appel navigateur direct ou rôle usurpé |
| Modifier/supprimer une tâche | Non | Oui, tâche autorisée | Oui | Tâche d’un autre enseignant |
| Créer une soumission audio | Oui, pour sa tâche | Non | Non | Autre élève ou tâche non assignée |
| Lire une soumission | Ses soumissions | Élèves/classes autorisés | Oui | Élève d’une autre classe |
| Valider/refuser une soumission | Non | Oui, soumission assignée par lui | Oui | Double validation ou soumission hors périmètre |
| Insérer/modifier `points_log` | Non | Non directement | Non directement | Toute écriture navigateur |
| Créditer une validation | Via RPC hifz plafonnée au devoir | Via RPC de validation | Via RPC de validation | Points négatifs, hors plafond, double crédit |
| Lire les notifications | Les siennes | Les siennes | Les siennes | Notifications d’un autre utilisateur |
| Gérer son abonnement push | Son abonnement | Son abonnement | Son abonnement | Abonnement d’un autre utilisateur |
| Envoyer un push | À son professeur de devoir | À ses élèves autorisés | Destinataire autorisé | Destinataire arbitraire |
| Lire les fichiers audio | Ses fichiers | Fichiers des élèves autorisés | Oui | Anon et utilisateur hors périmètre |

## Procédure reproductible

1. Créer une sauvegarde et appliquer les migrations dans l’ordre avec `supabase
   db push` (ou via le SQL Editor).
2. Configurer uniquement dans les secrets Supabase de l’Edge Function :
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, ainsi que les
   variables Supabase injectées par la plateforme.
3. Déployer `send-push` avec `supabase functions deploy send-push`.
4. Créer trois comptes de test (étudiant, enseignant, administrateur), les
   inscrire dans des classes distinctes et exécuter les lignes de vérification
   ci-dessous avec leurs sessions respectives.
5. Vérifier que les refus retournent une erreur RLS/RPC et que deux appels
   simultanés à une validation ne créent qu’une ligne `points_log`.

## Vérifications SQL non sensibles

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles', 'classes', 'class_members', 'tasks', 'submissions',
    'points_log', 'notifications', 'push_subscriptions'
  )
order by tablename;

select indexname
from pg_indexes
where schemaname = 'public'
  and indexname in ('uq_points_log_submission', 'uq_hifz_submission_per_task');

select id, public, file_size_limit
from storage.buckets
where id = 'audio-submissions';
```

Les tests d’accès doivent être lancés avec des JWT de comptes de test dans un
environnement de préproduction. Les clés, JWT et résultats contenant des
adresses ne doivent pas être ajoutés au dépôt ni aux logs CI.