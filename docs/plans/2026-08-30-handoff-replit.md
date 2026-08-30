# Passation pour Replit — refonte design QuranReview (suite du lot 5/8)

Repo : `btahmed/quran-last-version`, branche `main`, frontend Vite (`frontend/`).
Déploiement : GitHub Action → Vercel, automatique sur push (`main`, secret `VERCEL_TOKEN` déjà configuré).

## Contraintes non négociables (déjà respectées jusqu'ici, à continuer)

- **Ne jamais toucher** : `frontend/src/core/router.js`, `frontend/src/services/auth.js`,
  la façade `window.QuranReview` dans `frontend/src/main.js` (sauf ajout **additif** d'une méthode
  déjà exportée par une page), `frontend/public/sw.js`, `frontend/public/manifest.json`,
  l'ordre des `<link>` CSS dans `frontend/index.html` (`style-pro.css` doit rester **après** `ds/`).
- **Aucune classe CSS renommée ni supprimée.** On ajoute, jamais on ne remplace à l'aveugle —
  toujours diff les sélecteurs avant de remplacer un fichier CSS entier.
- **Aucune donnée inventée.** Si une donnée réelle manque, le bloc/la section se masque
  (`hidden`, `display:none`, ou retour `''`) — jamais de chiffre ou de texte placeholder.
- **`escapeHtml()` sur toute donnée API insérée dans du HTML.** Si un texte est aussi injecté
  dans un attribut `onclick="...('...')"`, utiliser aussi `escapeJs()` (échappe `'`, `"`, `\`,
  retours ligne) AVANT `escapeHtml()` — sinon un nom contenant une apostrophe casse le JS.
- **`dir="rtl"`, `lang="ar"`, ARIA, cibles tactiles ≥44px, dark mode système** partout.
- Tester à 375px / 768px / 1440px, clair et sombre, avant de pousser.
- Un commit par lot logique, message explicite, push direct sur `main` (pas de PR dans ce repo).

## Piège déjà rencontré 2 fois — à vérifier systématiquement

`state.memorizationData` (dans `frontend/src/core/state.js`) est une donnée **morte** : elle n'est
jamais peuplée par le vrai parcours élève (seule une page legacy `MemorizationPage.js`, non liée à
la navigation réelle, l'alimente). **Ne jamais construire une nouvelle feature dessus.**

La vraie donnée de mémorisation vit dans **localStorage**, clé `murajaa_student_${uid}` (élève) ou
`murajaa_teacher` (prof/admin), écrite/lue par `frontend/src/pages/RevisionPage.js`. Forme :

```js
{
  configured: true,          // false/absent = pas encore configuré → traiter comme vide
  bunkerRanges: [{ label: 'الفاتحة', from: 1, to: 1 }, ...],  // plages de PAGES (1–604), pas de sourates
  cycleReviewed: [12, 13, 45, ...],  // numéros de PAGE révisées ce cycle
  activeDates: ['2026-08-28', '2026-08-29', ...],  // jours réellement actifs (pour un streak réel)
}
```

`RevisionPage.js` exporte aussi `JUZ_DATA` (30 juz avec `{num, label, from, to}` en pages, vérifié
contre tanzil.net) — à réutiliser plutôt que ré-inventer un découpage par sourate.

## Où sont les vraies pages (vs pages mortes/legacy)

Vérifié via `grep` dans `NavManager.js` — routes réellement accessibles par un bouton :
`home`, `hifz`, `soumettre`, `revision`, `profil` (élève) ; `home`, `devoirs`, `soumissions`,
`eleves`, `profil` (prof) ; `admin`, `admin-users`, `admin-classes`, `admin-stats`, `profil` (admin).

- `frontend/src/pages/WardPage.js` et `frontend/src/pages/ProgressPage.js` sont dans le routeur
  (`router.js`) mais **pas dans la nav** (`NavManager.js`) — potentiellement injoignables en
  navigation directe... **sauf** que `ProfilPage.js` importe et rend `ProgressPage.render()`/`init()`
  comme onglet par défaut de "حسابي" → **ProgressPage EST réellement vue par les utilisateurs**,
  juste pas via sa propre route. **Vérifier au cas par cas avant de brancher quoi que ce soit dans
  une page : `grep -rn "NomDeLaPage" frontend/src/pages/*.js` pour voir si une autre page l'importe.**
- `frontend/src/pages/CompetitionPage.js` **est réellement accessible** : bouton "🏆 المسابقة"
  dans `HomePage.js` (`onclick="QuranReview.navigateTo('competition')"`).
- Le vrai lecteur audio de "المراجعة" (تلاوة/écoute) utilise `frontend/src/components/AudioPlayer.js`
  (`AudioManager`) et les fonctions `toggleWardPlay`/`previousWardAyah`/`nextWardAyah` — définies
  dans **`WardPage.js`** mais exposées dans la façade (`main.js` lignes ~167-169, ~220-221) donc
  potentiellement appelées depuis ailleurs. **À vérifier avant de toucher `WardPage.js`** : est-ce
  que `RevisionPage.js` (page réelle de "المراجعة") appelle ces fonctions de lecture audio, ou
  a-t-il son propre système ? Faire `grep -n "toggleWardPlay\|AudioManager" frontend/src/pages/RevisionPage.js`
  en premier.

## État exact des 4+1 composants du lot 5

Tous dans `frontend/src/components/`, autonomes (injectent leur propre CSS comme `WeekCalendar.js`),
guide complet dans `frontend/src/components/INTEGRATION.md`.

| Composant              | État                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MemoryOrbit.js/.css`  | Copié, **volontairement pas branché**. `RevisionPage.js` a déjà sa propre orbite (`renderMemoryOrbit()`/`renderJuzMap()`, méthodes de la classe `MurajaaTracker`, lignes ~2095-2162) avec de vraies données. Remplacer par le composant demanderait de restructurer le cycle de rendu de cette classe (basé sur des template strings retournés par `renderTablesTab()`, pas sur un `mountX(id, ...)`) pour un gain visuel marginal. **Ne pas le faire sans une bonne raison** — l'existant fonctionne et est réel.                                                                                                                                                                                                                                                           |
| `HifzFocus.js/.css`    | Copié, **pas branché**. Nécessite un compteur de série (`combo`/`streak` de bonnes réponses consécutives) à ajouter dans le moteur d'exercice hifz existant (`frontend/src/services/hifz.js` ou la logique interne de `HifzPage.js`) — changement de logique métier, pas un simple habillage. Voir `INTEGRATION.md` section 5.2 pour l'API exacte (`enableHifzFocus`/`disableHifzFocus`/`renderComboBar`/`renderWordChoices`/`renderFeedback`). Le point d'attention : `renderWordChoices(choices, 'hifzPickWord')` ne doit être utilisé avec le 2e argument QUE si tu ajoutes `hifzPickWord: HifzPage.hifzPickWord,` à la façade dans `main.js` — sinon appeler `renderWordChoices(choices)` sans 2e argument et brancher les clics toi-même en JS (voir `INTEGRATION.md`). |
| `StudentRadar.js/.css` | ✅ Branché (`TeacherElevesSection.js`) — fait.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ClassHealth.js/.css`  | ✅ Branché (`AdminClassesSection.js`) — fait.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `PageBlocks.js/.css`   | Branché **partiellement** : `renderMushafMap` fait dans `ProgressPage.js` (avec un paramètre `states` ajouté en plus de l'API d'origine, pour passer un calcul par page plutôt que par sourate — voir le code, c'est commenté). `renderWardStudio` et `renderCompetitionBoard` **pas encore branchés**, voir ci-dessous. `renderPageHero` pas utilisé (les pages ont déjà leurs propres en-têtes).                                                                                                                                                                                                                                                                                                                                                                           |

## Ce qu'il reste à faire, dans l'ordre de valeur

### 1. `renderCompetitionBoard` → `frontend/src/pages/CompetitionPage.js` (le plus sûr, page 100% réelle)

```js
import { mountBlock, renderCompetitionBoard } from '../components/PageBlocks.js';
```

Ajouter `<div id="competition-host"></div>` dans `render()`, puis dans `init()` (après chargement
des vraies données de classement/points — regarder ce que `CompetitionPage.js` charge déjà,
probablement via `services/competition.js` ou `supabase-leaderboard.js`) :

```js
mountBlock('competition-host', renderCompetitionBoard({
    rank: { medal: '🥇', label: '...', points: realPoints, progress: realPct }, // seulement si dispo
    challenges: [...],  // UNIQUEMENT les défis que le moteur gère réellement — vérifier
                         // quels startChallenge('xxx') sont vraiment implémentés avant de lister
    leaders: realLeaderboardArray,  // [{name, points, badge}] depuis Supabase, pas inventé
}));
```

`startChallenge` est déjà dans la façade — vérifier quels types (`speed`/`find`/`precision`, etc.)
sont réellement gérés côté `CompetitionPage.js`/service avant de les lister, sinon ne pas les
afficher (règle : pas de bouton vers une fonctionnalité qui n'existe pas).

### 2. `renderWardStudio` → à localiser d'abord

Faire le `grep` mentionné plus haut pour savoir si le vrai lecteur de tilawa vit dans
`RevisionPage.js` ou `WardPage.js`. Une fois localisé :

```js
import { mountBlock, renderWardStudio } from '../components/PageBlocks.js';
mountBlock(
    'ward-studio-host',
    renderWardStudio({
        ayahText: currentAyahText, // vraie donnée déjà chargée par la page
        index: currentIndex,
        total: totalAyahs,
        playing: isPlaying, // état réel du AudioManager
        onPlay: 'QuranReview.toggleWardPlay()',
        onPrev: 'QuranReview.previousWardAyah()',
        onNext: 'QuranReview.nextWardAyah()',
    })
);
```

Ces 3 méthodes existent déjà dans la façade, rien à ajouter à `main.js`.

### 3. `MemoryOrbit`/`HifzFocus` — décision produit avant tout code

Ne pas les brancher sans trancher d'abord : est-ce que remplacer l'orbite existante de
`RevisionPage.js` par le composant apporte un vrai gain (probablement non, cf. tableau ci-dessus) ?
Est-ce que le combo/streak de `HifzFocus` doit être persisté (Supabase) ou juste en mémoire de
session ? Poser la question à l'utilisateur si ambigu plutôt que deviner.

## Style de travail attendu (déduit de cette session)

1. Toujours lire le fichier réel avant de le modifier, ne jamais halluciner sa structure.
2. Avant de remplacer un fichier CSS entier livré par un outil externe : diff les sélecteurs
   (script Python, `re.finditer(r'([^{}]+)\{', content)`) contre l'existant. S'il n'ajoute rien
   de nouveau par rapport à ce qui est déjà en prod, ne pas l'appliquer (ça arrive souvent quand
   l'outil externe régénère depuis une base qui ne connaît pas les évolutions déjà faites).
3. `npx eslint <fichiers>` puis `npm run build` (dans `frontend/`) avant chaque commit.
4. Commit avec message détaillé expliquant le "pourquoi", pas juste le "quoi" — l'historique de
   cette session en donne le ton (voir `git log --oneline` sur ce repo, les 15 derniers commits).
5. Après push, vérifier le déploiement : `gh run list --workflow=deploy-frontend.yml --limit 1`
   jusqu'à `completed success`, puis vérifier en prod avec `curl` que le bundle contient bien le
   changement (`curl -s https://quranreview-frontend.vercel.app/ | grep -oE 'pages-[A-Za-z0-9_-]+\.js'`
   puis `curl` ce bundle et `grep` une chaîne distinctive du nouveau code).

## Tâche restée en dehors du scope design, non urgente

Migration SQL `supabase/migrations/20260830170000_public_student_count.sql` jamais exécutée sur
Supabase (compteur "+224 طالب نشيط" de la landing page) — à lancer dans Supabase → SQL Editor.
