# INTEGRATION.md — brancher les 4 composants du lot 5

Chaque composant est **autonome** : il injecte son propre CSS, ne fait aucune requête réseau,
n'importe rien d'autre que lui-même. Aucune modification de `index.html`, `main.js`, `router.js`,
`auth.js`, `sw.js` ni `manifest.json`.

Le pattern d'injection CSS est celui déjà utilisé par `WeekCalendar.js` — rien de nouveau.

Règle commune : **si les données manquent, le composant renvoie `''` ou un message vide** et la
page garde son affichage actuel. Jamais de bloc vide, jamais de chiffre inventé.

---

## 5.1 — `MemoryOrbit` → page المراجعة

**Fichier à modifier** : `src/pages/RevisionPage.js`

### 1. En haut du fichier, avec les autres imports

```js
import { mountMemoryOrbit } from '../components/MemoryOrbit.js';
```

### 2. Dans le `render()` de la page, au-dessus de la liste actuelle

```html
<div id="memory-orbit-host"></div>
```

### 3. Dans le `init()` de la page, après que les données de mémorisation soient disponibles

```js
const mounted = mountMemoryOrbit('memory-orbit-host', state.memorizationData || [], {
    onStart: wird => {
        // wird = { items: [{item, strength, tier, label}], estimatedMinutes }
        // Brancher ici la MÊME fonction que le bouton « ابدأ » actuel de la page.
        startRevisionSession(wird.items.map(x => x.item));
    },
    onSelect: surahName => {
        // Optionnel : ouvrir directement cette sourate.
        console.log('sourate choisie', surahName);
    },
});
// mounted === false → moins de 3 sourates : l'orbite n'est pas affichée,
// la liste existante reste seule. Rien à faire.
```

### API exportée (testable sans DOM)

| Fonction                                 | Rôle                                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `computeMemoryStrength(item, today?)`    | force 0–100 : base selon `status` (`mastered` 95 / `weak` 60 / autre 40) puis −4 par jour depuis `lastReviewed` |
| `strengthTier(strength)`                 | `>85` → `mastered`, `60–85` → `soon`, `<60` → `urgent`                                                          |
| `classifyItems(items, today?)`           | `{all, urgent, soon, mastered}`, triés du plus faible au plus fort                                              |
| `buildDailyWird(items, today?, size=3)`  | `{items, estimatedMinutes}` — les N plus faibles, durée **estimée** (~3 min/sourate)                            |
| `renderMemoryOrbit(items, opts?)`        | HTML, ou `''` si `< 3` sourates                                                                                 |
| `mountMemoryOrbit(id, items, handlers?)` | monte + branche les clics, renvoie `false` si non monté                                                         |

Champs lus sur chaque item : `status`, `lastReviewed`, et le nom via
`surahName || surah_name || name`.

---

## 5.2 — `HifzFocus` → page الحفظ

**Fichier à modifier** : `src/pages/HifzPage.js`

```js
import {
    enableHifzFocus,
    disableHifzFocus,
    renderComboBar,
    renderWordChoices,
    renderFeedback,
    shuffle,
} from '../components/HifzFocus.js';
```

- **Au démarrage d'une session** : `enableHifzFocus();`
- **À la sortie / fin** : `disableHifzFocus();` _(à mettre aussi dans `stopHifzSession`)_
- **Au-dessus de l'affichage de l'ayah** :
    ```js
    container.insertAdjacentHTML(
        'afterbegin',
        renderComboBar({
            surah: currentSurahName,
            ayah: currentAyahNumber,
            streak: consecutiveCorrect, // compteur à tenir dans hifzEngine
            progress: Math.round((done / total) * 100),
        })
    );
    ```
- **Sous l'ayah, les 3 propositions** :
    ```js
    const choices = shuffle([correctWord, decoy1, decoy2]);
    zone.innerHTML = renderWordChoices(choices, 'hifzPickWord');
    ```
    `'hifzPickWord'` doit être exposé dans la façade de `main.js` **uniquement si tu ajoutes cette
    interaction** :
    ```js
    hifzPickWord: HifzPage.hifzPickWord,
    ```
    Si tu préfères ne rien ajouter à `main.js`, appelle `renderWordChoices(choices)` sans second
    argument et branche les clics en JS :
    ```js
    zone.querySelectorAll('.hifz-choice').forEach(b =>
        b.addEventListener('click', () => checkWord(b.textContent.trim()))
    );
    ```
- **Après vérification** : `feedbackEl.innerHTML = renderFeedback({ ok: true, points: 10 });`

Les mots cachés (`.ayah-line .word.hidden`) sont **déjà** restylés par `style-pro.css` — ce
composant n'ajoute que le fond sombre, le combo et les propositions.

---

## 5.3 — Studio d'enregistrement → déjà branché ✅

`index.html` contient déjà `<div class="wave-meter" id="recording-wave">` (9 `<span>`) et
`class="record-btn"` sur le bouton. Le CSS vit dans `style-pro.css` (section 24).

**Il reste seulement** à afficher/masquer l'onde dans `src/components/AudioRecordModal.js` :

```js
// au démarrage de l'enregistrement
document.getElementById('recording-wave')?.classList.remove('hidden');
// à l'arrêt
document.getElementById('recording-wave')?.classList.add('hidden');
```

L'onde est purement CSS — aucune analyse audio requise. Pour une onde **réelle** plus tard :
`AnalyserNode` + `requestAnimationFrame`, en écrivant les hauteurs dans les 9 `<span>`.

---

## 5.4 — `StudentRadar` → section الطلاب du professeur

**Fichier à modifier** : `src/pages/teacher/TeacherElevesSection.js`

```js
import { mountStudentRadar } from '../../components/StudentRadar.js';
```

Dans le rendu de la section :

```html
<div id="student-radar-host"></div>
```

Après le chargement des élèves et des soumissions (les deux sont déjà récupérés dans cette
section ou dans `HomePage.initDashboard('teacher')`) :

```js
mountStudentRadar('student-radar-host', students, submissions, {
    // onRemind: 'remindStudent',   // ← seulement si cette méthode existe dans la façade.
    //                                 Sans elle, le bouton « 📩 ذكّره » n'est pas affiché.
});
```

### API exportée

| Fonction                                              | Rôle                                                                                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `diagnoseStudent(student, submissions, today?)`       | `{level, daysSince, week[7], count}` — `critical` si jamais soumis ou ≥5 jours, `warn` si ≥3 jours ou ≤2 jours actifs sur 7 |
| `rankStudents(students, submissions, today?)`         | trié : critiques d'abord, puis les plus anciens                                                                             |
| `renderStudentRadar(students, submissions, opts?)`    | HTML complet avec compteurs                                                                                                 |
| `mountStudentRadar(id, students, submissions, opts?)` | monte dans le conteneur                                                                                                     |

Champs lus : `student.id`, `first_name || username || name`, et sur les soumissions
`student_id` (ou `profiles.id`) + `submitted_at`.

---

## 5.5 — `ClassHealth` → section الفصول de l'admin

**Fichier à modifier** : `src/pages/admin/AdminClassesSection.js`

```js
import { mountClassHealth } from '../../components/ClassHealth.js';
```

```html
<div id="class-health-host"></div>
```

```js
mountClassHealth('class-health-host', classes, {
    // onAssignTeacher: 'assignTeacherToClass',  // ← seulement si la méthode existe
});
```

### Diagnostic (fonction pure `diagnoseClass`)

| Condition                                    | Niveau                                                        |
| -------------------------------------------- | ------------------------------------------------------------- |
| pas de `teacher_name / teacher / teacher_id` | 🔴 `critical` (+ nb de tilawat en attente si `pending_count`) |
| `attendance_rate < 70`                       | 🟡 `warn`                                                     |
| `graded_rate < 60`                           | 🟡 `warn`                                                     |
| sinon                                        | 🟢 `ok`                                                       |

Champs lus (tous optionnels, avec repli) : `name || class_name`, `teacher_name || teacher`,
`student_count || students`, `attendance_rate`, `graded_rate`, `pending_count`.
Les barres ne s'affichent que si la métrique existe — pas de barre à 0 % trompeuse.

**Utilisateurs (approbations ✓/✕)** : à faire dans `AdminUsersSection.js` en réutilisant les
méthodes admin déjà présentes. Ne rien créer côté Supabase sans en parler d'abord.

---

## 5.6 — `PageBlocks` → les 4 structures des maquettes

**Fichier** : `src/components/PageBlocks.js` (+ `PageBlocks.css`)

Quatre blocs, un import commun. Chacun renvoie `''` si les données manquent.

```js
import {
    renderPageHero,
    renderMushafMap,
    renderWardStudio,
    renderCompetitionBoard,
    mountBlock,
} from '../components/PageBlocks.js';
```

### a) Bandeau d'en-tête sombre — utilisable sur **n'importe quelle** page

```html
<div id="page-hero-host"></div>
```

```js
mountBlock(
    'page-hero-host',
    renderPageHero({
        eyebrow: '✨ خطوتك التالية',
        title: 'راجع سورة الملك قبل أن تضعف',
        meta: 'آخر مراجعة: قبل 4 أيام · ذاكرة 62%',
        progress: 62,
        action: { label: '🔁 ابدأ المراجعة', onclick: "QuranReview.navigateTo('revision')" },
        // ou des compteurs au lieu d'un bouton :
        // stats: [{value:'18', label:'سورة'}, {value:'92%', label:'المراجعة'}],
    })
);
```

### b) Carte du Mushaf (30 juz') → `ProgressPage.js`

```js
mountBlock(
    'mushaf-host',
    renderMushafMap(state.memorizationData || [], {
        surahs: totalSurahs,
        ayahs: totalAyahs,
        streak: streakDays,
        badges: [
            { emoji: '🏆', label: 'جزء عمّ كامل' },
            { emoji: '🔥', label: '10 أيام متتالية' },
            { emoji: '💎', label: '5 أجزاء', locked: true },
        ],
    })
);
```

Le juz' est déduit du **numéro de sourate** (`surahNumber || surah_number || surahId || surah_id`)
via `juzOfSurah()`. Si aucun item n'a de numéro exploitable, la carte n'est pas affichée
(plutôt qu'une grille entièrement vide).

### c) Studio de tilawa → `WardPage.js`

```js
mountBlock(
    'ward-studio-host',
    renderWardStudio({
        ayahBefore: previousWords, // optionnel, affiché en gris
        ayahText: currentAyahText,
        index: currentIndex,
        total: totalAyahs,
        playing: isPlaying,
        timer: '01:24', // optionnel
        onPlay: 'QuranReview.toggleWardPlay()',
        onPrev: 'QuranReview.previousWardAyah()',
        onNext: 'QuranReview.nextWardAyah()',
    })
);
```

Les trois méthodes existent **déjà** dans la façade — rien à ajouter à `main.js`.
L'onde est CSS ; `playing: false` la met au repos.

### d) Tableau des défis → `CompetitionPage.js`

```js
mountBlock(
    'competition-host',
    renderCompetitionBoard({
        rank: { medal: '🥇', label: 'ذهبي', points: 1250, nextAt: 750, progress: 65 },
        challenges: [
            {
                emoji: '⚡',
                title: 'السباق',
                desc: '5 آيات في 5 دقائق',
                onclick: "QuranReview.startChallenge('speed')",
            },
            {
                emoji: '🔍',
                title: 'صيد الآية',
                desc: 'حدد السورة من الآية',
                onclick: "QuranReview.startChallenge('find')",
            },
            {
                emoji: '🎯',
                title: 'سيد الدقة',
                desc: 'اكتب الآية بدقة',
                onclick: "QuranReview.startChallenge('precision')",
            },
        ],
        leaders: leaderboardFromSupabase, // [{name, points, badge}]
    })
);
```

`startChallenge` est déjà dans la façade. Passe uniquement les défis que ton moteur
gère réellement.

---

## Mise en page PC (facultative, CSS déjà livré)

À partir de 1280px, une page peut passer en deux colonnes sans une ligne de JS :

```html
<div class="k-two-col">
    <div><!-- principal : bandeau, stats, listes --></div>
    <div class="k-rail"><!-- semaine, Mushaf, radar — devient collant --></div>
</div>
```

Sans cette classe, la page reste en une colonne centrée. Les stats passent
automatiquement en 4 colonnes ≥1024px, et `k-stack` en 2 colonnes (sauf les listes
en lignes, laissées en pleine largeur).

---

## Recette de test commune

1. **Élève avec ≥3 sourates** → orbite visible, puces réparties sur 3 anneaux, cœur cliquable.
2. **Élève avec 0–2 sourates** → aucune orbite, la page reste comme avant.
3. **Session hifz** → fond sombre à l'entrée, redevient clair à la sortie (vérifier
   `stopHifzSession`).
4. **Enregistrement** → l'onde apparaît pendant, disparaît après.
5. **Prof** → élèves triés, l'absent le plus ancien en premier ; sans `onRemind`, aucun bouton mort.
6. **Admin** → une classe sans professeur remonte en premier en 🔴.
7. **Carte du Mushaf** → si aucune sourate n'a de numéro, la carte est absente (pas de grille vide).
8. **Studio de tilawa** → onde animée en lecture, au repos à l'arrêt ; les 3 boutons pilotent bien
   le lecteur existant.
9. **Défis** → seuls les défis réellement gérés par le moteur sont listés ; classement vide → bloc absent.
10. Tout tester en **375px, 768px et 1440px**, en **clair et sombre**, et vérifier qu'aucun contrôle
    ne descend sous **44px**. → orbite visible, puces réparties sur 3 anneaux, cœur cliquable.
11. **Élève avec 0–2 sourates** → aucune orbite, la page reste comme avant.
12. **Session hifz** → fond sombre à l'entrée, redevient clair à la sortie (vérifier
    `stopHifzSession`).
13. **Enregistrement** → l'onde apparaît pendant, disparaît après.
14. **Prof** → élèves triés, l'absent le plus ancien en premier ; sans `onRemind`, aucun bouton mort.
15. **Admin** → une classe sans professeur remonte en premier en 🔴.
16. Tout tester en **375px et 1280px**, en **clair et sombre**, et vérifier qu'aucun contrôle ne
    descend sous **44px**.
