# Design — Refonte Navigation & UX Mobile
**Date :** 2026-03-15
**Statut :** Approuvé ✅
**Scope :** Navigation par rôle, landing visiteur, dashboard auth, bottom bar mobile, responsive global

---

## Contexte & Problème

L'application utilise une seule `<nav>` avec `display:none` par rôle — fragile, non mobile, tous les liens chargés même s'ils ne sont pas visibles. Il n'y a aucune distinction entre un visiteur et un utilisateur connecté. Le site n'est pas pensé pour mobile (grilles fixes, pas de touch targets, pas de nav mobile).

---

## Décisions validées

| # | Question | Réponse |
|---|---|---|
| 1 | Visiteur ≠ connecté ? | ✅ Oui — deux expériences distinctes |
| 2 | Dashboard auth : contenu ? | ✅ Stats + tâches du jour + progression + raccourcis |
| 3 | Problème mobile ? | ✅ Tout — pas pensé pour mobile (option E) |
| 4 | Approche | ✅ A — refonte complète mobile-first |
| 5 | Nav mobile | ✅ A — Bottom tab bar (comme app native) |
| 6 | Nav par rôle | ✅ Différente pour visiteur / étudiant / prof / admin |
| 7 | Mapping pages | ✅ C — tout renommer + fusionner |

---

## Section 1 : Architecture de navigation

### NavManager.js (nouveau module core)

```
auth.js → detectRole() → NavManager.buildNav(role)
                                ↓
                    ┌───────────────────────┐
                    │     NavManager.js     │
                    │                       │
                    │  buildNav(role)       │
                    │   ├── 'visitor'       │ → logo + bouton login uniquement
                    │   ├── 'student'       │ → 5 onglets étudiant
                    │   ├── 'teacher'       │ → 5 onglets enseignant
                    │   └── 'admin'         │ → 5 onglets admin
                    └───────────────────────┘
                                ↓
                    Injecte dans :
                    - <nav class="top-nav">   (desktop > 768px)
                    - <nav class="bottom-bar"> (mobile ≤ 768px)
```

### Onglets par rôle

**Étudiant :**
| Onglet | Icône | Route | Description |
|--------|-------|-------|-------------|
| Accueil | 🏠 | `home` | Progression + devoirs du jour |
| Hifz | 📖 | `hifz` | Mémorisation nouvelles sourates |
| Révision | 🔁 | `revision` | Muraja'a (répétition espacée) |
| Soumission | 🎧 | `soumettre` | Envoyer récitation au prof |
| Profil | 👤 | `profil` | Stats personnelles + paramètres |

**Enseignant :**
| Onglet | Icône | Route | Description |
|--------|-------|-------|-------------|
| Accueil | 🏠 | `home` | Vue classe du jour |
| Devoirs | 📋 | `devoirs` | Créer et gérer les devoirs |
| Soumissions | 🎧 | `soumissions` | Écouter et noter les élèves |
| Élèves | 👥 | `eleves` | Liste + progression par élève |
| Profil | 👤 | `profil` | Paramètres du compte |

**Admin :**
| Onglet | Icône | Route | Description |
|--------|-------|-------|-------------|
| Dashboard | 🏠 | `home` | Vue globale (dashboard admin) |
| Utilisateurs | 👥 | `admin-users` | Gérer élèves / profs |
| Classes | 🏫 | `admin-classes` | Groupes de mosquée |
| Statistiques | 📊 | `admin-stats` | Progression globale |
| Profil | 👤 | `profil` | Paramètres du compte admin |

**Visiteur :** Pas de bottom bar — logo + bouton login en top nav uniquement.

### Renommage et fusion des pages

| Ancienne page | Route actuelle | Nouvelle page | Nouvelle route | Action |
|---|---|---|---|---|
| `MemorizationPage` + `HifzPage` | `memorization` / `hifz` | `HifzPage` | `hifz` | Fusion |
| `WardPage` | `ward` | `RevisionPage` | `revision` | Renommage |
| `MyTasksPage` | `mytasks` | `SoumissionPage` | `soumettre` | Renommage |
| `SettingsPage` + `ProgressPage` | `settings` / `progress` | `ProfilPage` | `profil` | Fusion |
| `TeacherPage` | `teacher` | `TeacherPage` (sub-views) | `teacher` | Sub-views |
| `AdminPage` | `admin` | `AdminPage` | `admin` | Conservé |
| `CompetitionPage` | `competition` | `CompetitionPage` | `competition` | Depuis home |

### Redirections à ajouter dans router.js

```js
const ROUTE_ALIASES = {
    memorization: 'hifz',
    ward: 'revision',
    mytasks: 'soumettre',
    settings: 'profil',
    progress: 'profil',
};
```

---

## Section 2 : Landing page visiteur

### Structure (de haut en bas)

```
┌─────────────────────────────────────┐
│  HERO (100vh)                       │
│  Gradient vert sombre → noir        │
│  Logo + مراجعة القرآن              │
│  Sous-titre accroche (FR/AR)        │
│  [تسجيل الدخول]  [إنشاء حساب]     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  FEATURES (3 cards)                 │
│  📖 Hifz  🔁 Révision  🎧 Soumission│
│  Description courte de chaque      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  STATS LIVE                         │
│  224 élèves · X sourates · X profs  │
│  Compteur animé au scroll           │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  CTA FINAL                          │
│  "انضم إلى مسجدك"                   │
│  [إنشاء حساب]                       │
└─────────────────────────────────────┘
```

### Logique dans HomePage.js

```js
export function render() {
    if (!state.user) return renderLanding();
    return renderDashboard(state.user.role);
}

export function init() {
    if (!state.user) return initLanding();
    return initDashboard(state.user.role);
}
```

---

## Section 3 : Dashboard authentifié

### Dashboard Étudiant

```
مرحباً يا [Prénom] 👋
[date du jour en arabe]

[📖 Hifz: Juz 3] [🔁 Révision: 7/10] [🔥 Streak: 12j]

DEVOIRS DU JOUR
├── 📝 Al-Baqarah 1-5     [Soumettre →]
└── 🔁 An-Nas → Ad-Duha   [Réviser →]

ACCÈS RAPIDE
[📖 Hifz]  [🔁 Révision]  [🏆 Compétition]
```

**Données :** `GET /api/tasks/?status=pending` + stats depuis `state`

### Dashboard Enseignant

```
مرحباً أستاذ [Prénom]

[👥 22 Élèves] [📝 8 Devoirs] [⏳ 5 En attente]

SOUMISSIONS RÉCENTES
├── Ahmed — Al-Mulk  ✅ Validé
├── Yusuf — An-Nas   ⏳ À écouter  [→]
└── Omar  — Al-Fajr  ⏳ À écouter  [→]

ACCÈS RAPIDE
[+ Nouveau devoir]  [📋 Toutes les soumissions]
```

**Données :** `GET /api/submissions/?status=pending` + stats élèves/devoirs

### Dashboard Admin

```
لوحة الإدارة

[👥 224 users] [👨‍🏫 21 profs] [👨‍🎓 202 élèves] [📝 X tâches]

ACTIVITÉ RÉCENTE
(dernières soumissions + inscriptions)

ACCÈS RAPIDE
[👥 Utilisateurs]  [📊 Statistiques]
```

**Données :** `GET /api/admin/overview/` (endpoint existant ✅)

---

## Section 4 : Mobile — Bottom Bar + Responsive global

### Bottom Bar

```
position: fixed; bottom: 0; width: 100%; height: 64px;
padding-bottom: env(safe-area-inset-bottom);  /* iPhone notch */
display: none;  /* desktop */

@media (max-width: 768px) { display: flex; }
```

Structure HTML (injectée par NavManager) :
```html
<nav class="bottom-bar">
  <a class="bottom-tab active" data-page="home">
    <span class="tab-icon">🏠</span>
    <span class="tab-label">الرئيسية</span>
  </a>
  <!-- ... autres onglets selon le rôle -->
</nav>
```

### Corrections responsive globales

| Zone | Fix |
|---|---|
| Typographie hero | `font-size: clamp(1.5rem, 4vw, 3rem)` |
| Grilles stats | `repeat(auto-fit, minmax(140px, 1fr))` |
| Grilles features | `repeat(auto-fit, minmax(280px, 1fr))` |
| Padding cards | `clamp(0.75rem, 2vw, 1.5rem)` |
| Touch targets | `min-height: 44px` sur tous les boutons |
| Contenu avec bottom bar | `padding-bottom: 80px` (mobile) |
| Modals audio | `max-height: 90vh`, border-radius top only |

### Fichiers CSS touchés

```
frontend/style-pro.css              → variables responsive + corrections globales
frontend/src/pages/HomePage.css     → landing + dashboard responsive
frontend/src/core/NavManager.css    → bottom bar (nouveau)
```

---

## Fichiers à créer / modifier

### Nouveaux fichiers
- `frontend/src/core/NavManager.js` — logique nav par rôle
- `frontend/src/core/NavManager.css` — styles bottom bar
- `frontend/src/pages/RevisionPage.js` + `.css` — ex-WardPage
- `frontend/src/pages/SoumissionPage.js` + `.css` — ex-MyTasksPage
- `frontend/src/pages/ProfilPage.js` + `.css` — fusion Settings + Progress

### Fichiers modifiés
- `frontend/src/core/router.js` — nouvelles routes + aliases + NavManager
- `frontend/src/pages/HomePage.js` — render visitor/auth + dashboards
- `frontend/src/pages/HomePage.css` — landing + dashboard styles
- `frontend/src/pages/HifzPage.js` — fusion MemorizationPage + HifzPage
- `frontend/src/pages/TeacherPage.js` — sub-views Devoirs/Soumissions/Élèves
- `frontend/src/main.js` — import NavManager + nouvelles pages
- `frontend/index.html` — markup bottom bar + suppression nav inline
- `frontend/style-pro.css` — corrections responsive globales

---

## Hors scope (idées futures)

- Spaced Repetition Algorithm (Anki-like)
- Système de badges / gamification
- Mode Halaqa (classe en direct)
- Objectifs hebdomadaires automatiques
