# Design — Refonte CSS QuranReviewLocal
Date : 2026-02-21

## Contexte

### Situation actuelle
4 fichiers CSS pour 4239 lignes totales :
- `style.css` (1882 lignes) — base originale
- `style-modern.css` (865 lignes) — **jamais chargé dans index.html**
- `style-pro.css` (1168 lignes) — refonte Pro, conflits avec style.css
- `style-pro-fixes.css` (324 lignes) — patch des problèmes de style-pro

### Problèmes identifiés
- Conflits réels sur `.btn`, `.page`, `.page.active`, `.main`, `.task-card`
- `style-modern.css` = 865 lignes mortes
- `style-pro-fixes.css` = signe que style-pro.css est cassé
- Dark mode inconsistant entre les fichiers
- GSAP présent mais mal intégré avec le CSS

---

## Décisions de design

| Décision | Choix | Raison |
|----------|-------|--------|
| Architecture | 1 seul fichier `style.css` | Zéro conflit, maintenance simple |
| Style global | Glassmorphism + Neumorphisme hybride | Premium sans sur-ingénierie |
| Palette | Modernisée (vert émeraude + or raffiné) | Plus vive, reste islamique |
| Dark mode | Complet via `[data-theme="dark"]` | Déjà en place dans index.html |
| Animations | CSS pures + GSAP pour scroll | Meilleur des deux mondes |
| Responsive | Mobile-first, 4 breakpoints | Standard moderne |

---

## Palette de couleurs

```css
/* Light Mode */
--color-primary:     #1a7a4a;   /* vert émeraude */
--color-primary-light: #2a9a5f;
--color-primary-dark:  #125235;
--color-gold:        #c9922a;   /* or raffiné */
--color-gold-light:  #e0ac47;
--bg:                #f7f3ee;   /* crème chaud */
--bg-surface:        #ffffff;
--text:              #1a1a1a;
--text-secondary:    #5a5a5a;
--border:            rgba(26, 122, 74, 0.15);
--glass-bg:          rgba(255, 255, 255, 0.12);
--glass-border:      rgba(255, 255, 255, 0.2);
--neu-light:         #ffffff;
--neu-dark:          #d1cbc3;

/* Dark Mode — [data-theme="dark"] */
--color-primary:     #2a9a5f;
--color-gold:        #e0ac47;
--bg:                #0f1a13;   /* vert très sombre */
--bg-surface:        #1a2d1f;
--text:              #e8e0d4;
--text-secondary:    #9a9a8a;
--border:            rgba(42, 154, 95, 0.2);
--glass-bg:          rgba(0, 0, 0, 0.25);
--glass-border:      rgba(255, 255, 255, 0.08);
--neu-light:         #1f3326;
--neu-dark:          #0a1209;
```

---

## Architecture du fichier style.css (~1100 lignes)

```
1.  TOKENS & VARIABLES CSS     (~80 lignes)
2.  RESET & BASE               (~40 lignes)
3.  TYPOGRAPHIE ARABE          (~30 lignes)  — Amiri + Noto Naskh Arabic
4.  LAYOUT                     (~120 lignes) — header, nav, main, pages
5.  GLASSMORPHISM              (~150 lignes) — glass-card, glass-header, glass-modal
6.  NEUMORPHISME               (~100 lignes) — neu-btn, neu-input, neu-badge
7.  PAGES MÉTIER               (~400 lignes)
    ├── Home, Memorization, Ward
    ├── Progress, Competition, Hifz
    └── Teacher, MyTasks, Auth Modal
8.  ANIMATIONS CSS             (~80 lignes)  — fadeInUp, shimmer, pulse, slideIn
9.  DARK MODE                  (~50 lignes)  — variables overrides uniquement
10. RESPONSIVE                 (~150 lignes) — mobile-first, 4 breakpoints
```

---

## Composants principaux

### Glassmorphism (cartes, header, modals)
```
Fond :   rgba(255,255,255, 0.12)
Blur :   backdrop-filter: blur(24px)
Bordure: 1px solid rgba(255,255,255, 0.2)
Ombre :  0 8px 32px rgba(0,0,0, 0.12)
```
Appliqué sur : `.glass-card`, `.glass-header`, `.glass-modal`

### Neumorphisme (boutons, inputs)
```
Fond = même couleur que --bg
Ombre claire : haut-gauche (--neu-light)
Ombre sombre : bas-droite (--neu-dark)
État pressed : ombres inset
```
Appliqué sur : `.neu-btn`, `.neu-input`, `.neu-toggle`

### Hiérarchie des composants

| Composant | Style | Usage |
|-----------|-------|-------|
| `.glass-card` | Glassmorphism | Sections, stats, infos |
| `.neu-btn-primary` | Neumorphisme + gradient vert | Actions principales |
| `.neu-btn-secondary` | Neumorphisme flat | Actions secondaires |
| `.neu-input` | Neumorphisme inset | Formulaires |
| `.badge` | Glass teinté | Statuts, rôles |
| `.progress-bar` | Gradient animé | Progression |

---

## Animations

### CSS pures (éléments statiques)
- `fadeInUp` — entrée des cards
- `shimmer` — skeleton loading
- `pulse` — indicateurs actifs
- `slideIn` — modals et panels

### GSAP (scroll + transitions de pages)
- ScrollTrigger pour entrée des sections au scroll
- Stagger sur les grilles de cards
- Transitions entre pages (data-page)
- GSAP chargé depuis CDN (index.html)

---

## Responsive (mobile-first)

| Breakpoint | Largeur | Changements |
|------------|---------|-------------|
| Base | < 480px | 1 colonne, nav burger slide-in glass |
| `sm` | 480px+ | 2 colonnes stats |
| `md` | 768px+ | nav horizontale, sidebar visible |
| `lg` | 1024px+ | layout complet desktop |

- Texte arabe : `font-size: clamp(1rem, 4vw, 1.5rem)`
- Cards : `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`

---

## Résultat attendu

```
Avant : 4 fichiers, 4239 lignes, conflits multiples
Après : 1 fichier, ~1100 lignes, zéro conflit
Gain  : -74% de CSS
```

---

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `style.css` | **Réécriture complète** |
| `style-pro.css` | **Supprimé** |
| `style-pro-fixes.css` | **Supprimé** |
| `style-modern.css` | **Supprimé** (jamais chargé) |
| `index.html` | Retirer les `<link>` vers les CSS supprimés |
