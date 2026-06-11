# QuranReview — Plan d'amélioration globale

> **Pour Claude :** REQUIRED SUB-SKILL: Use superpowers:executing-plans pour implémenter ce plan tâche par tâche.

**Objectif :** Moderniser QuranReview sur 3 axes : Design System cohérent, Nouvelles fonctionnalités (notifications push + planning), Performance (découpage des gros fichiers JS).

**Architecture :** Vanilla JS ES Modules sur Vercel, Supabase comme backend (Auth + PostgreSQL + Storage). Zéro framework front — toutes les améliorations restent en JS natif + CSS custom.

**Stack :** Vanilla JS, ES Modules, CSS custom, Supabase JS SDK, Web Push API, Vercel (déploiement auto sur push `main`).

---

## AXE 1 — Design System & UI Modernisation

### Task 1 : Consolider le CSS en un Design System cohérent

**Problème actuel :** 3 fichiers CSS (`style.css` 38KB, `style-pro.css` 25KB, `style-pro-fixes.css` 4KB) + styles inline partout dans les composants JS. Tokens incohérents entre fichiers.

**Fichiers :**
- Modifier : `frontend/style.css` (garder comme entrée principale)
- Supprimer : `frontend/style-pro-fixes.css` (fusionner dans style.css)
- Modifier : `frontend/index.html` (retirer le lien vers style-pro-fixes.css)

**Étape 1 — Auditer les tokens existants**

```bash
grep -n "var(--" frontend/style.css | head -40
grep -n "var(--" frontend/style-pro.css | head -40
```
But attendu : voir quels tokens sont définis dans chaque fichier, identifier les doublons.

**Étape 2 — Fusionner style-pro-fixes.css dans style.css**

Copier le contenu de `frontend/style-pro-fixes.css` à la fin de `frontend/style.css`, section `/* === FIXES & OVERRIDES === */`.

**Étape 3 — Retirer le lien dans index.html**

Dans `frontend/index.html`, supprimer :
```html
<link rel="stylesheet" href="style-pro-fixes.css">
```

**Étape 4 — Ajouter les tokens manquants dans :root**

Dans `frontend/style.css`, section `:root`, ajouter :
```css
/* Spacing scale unifié */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;

/* Couleurs sémantiques */
--color-success: #16a34a;
--color-warning: #d97706;
--color-danger:  #dc2626;
--color-info:    #2563eb;

/* Transitions standard */
--transition-fast:   150ms ease;
--transition-normal: 250ms ease;
--transition-slow:   400ms ease;
```

**Étape 5 — Commit**
```bash
git add frontend/style.css frontend/index.html
git rm frontend/style-pro-fixes.css
git commit -m "style: fusionner style-pro-fixes.css + consolider design tokens"
```

---

### Task 2 : Redesign Landing Page — Hero moderne + sections

**Problème actuel :** Landing sobre mais sans impact visuel. Pas d'image/illustration, stats figées dans le HTML, CTA final trop simple.

**Fichiers :**
- Modifier : `frontend/src/pages/HomePage.js` (fonction `renderLanding()`, lignes 44–118)
- Modifier : `frontend/src/pages/HomePage.css`

**Étape 1 — Remplacer le hero**

Dans `HomePage.js`, remplacer la section `<!-- HERO -->` par :
```html
<section class="landing-hero">
    <div class="hero-bg-pattern"></div>
    <div class="hero-content">
        <div class="hero-badge">✨ منصة حفظ القرآن الكريم</div>
        <h1 class="hero-title">راجع القرآن<br><span class="hero-title-accent">بثقة واطمئنان</span></h1>
        <p class="hero-subtitle">منصة متكاملة تجمع المعلم والطالب — حفظ، مراجعة، إرسال تلاوة، ومتابعة التقدم يومياً</p>
        <div class="hero-actions">
            <button class="btn btn-glow btn-lg" onclick="QuranReview.showAuthModal()">ابدأ الآن — مجاناً</button>
            <button class="btn btn-ghost btn-lg" onclick="QuranReview.showRegisterForm()">إنشاء حساب</button>
        </div>
        <p class="hero-social-proof">انضم إلى <strong>+224</strong> طالب يراجعون يومياً</p>
    </div>
</section>
```

**Étape 2 — Ajouter les styles hero dans HomePage.css**

```css
.hero-badge {
    display: inline-block;
    background: rgba(45, 80, 22, 0.12);
    color: var(--accent-green);
    border: 1px solid rgba(45, 80, 22, 0.25);
    border-radius: 999px;
    padding: 0.35rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: var(--space-4);
}

.hero-title-accent {
    color: var(--accent-green);
}

.hero-social-proof {
    margin-top: var(--space-4);
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.btn-ghost {
    background: transparent;
    border: 2px solid var(--accent-green);
    color: var(--accent-green);
}
.btn-ghost:hover {
    background: var(--accent-green);
    color: white;
}
```

**Étape 3 — Rendre les stats live (depuis Supabase)**

Dans `initLanding()` de `HomePage.js`, ajouter après `observer` :
```js
async function fetchLiveStats() {
    try {
        const { count: students } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student');
        document.querySelectorAll('.stat-number').forEach(el => {
            if (el.dataset.stat === 'students') el.textContent = '+' + students;
        });
    } catch { /* silently ignore */ }
}
fetchLiveStats();
```

**Étape 4 — Tester en local**
```bash
cd frontend && python -m http.server 3456
# Ouvrir http://localhost:3456 — vérifier hero, badge, stats
```

**Étape 5 — Commit**
```bash
git add frontend/src/pages/HomePage.js frontend/src/pages/HomePage.css
git commit -m "feat: redesign landing page — hero badge, CTA ghost btn, stats live"
```

---

### Task 3 : Dashboard étudiant — streak visuel + progress bar hifz

**Problème actuel :** Dashboard étudiant affiche des tirets `—` pour les stats. Pas de visuel de progression, pas de streak animé.

**Fichiers :**
- Modifier : `frontend/src/pages/HomePage.js` (fonction `renderStudentDashboard()`, lignes 163–221)
- Modifier : `frontend/src/pages/HomePage.css`

**Étape 1 — Enrichir le HTML du dashboard étudiant**

Remplacer le bloc `<!-- STATS -->` dans `renderStudentDashboard()` :
```html
<!-- STATS visuelles -->
<section class="dashboard-section">
    <div class="stats-grid-v2">
        <div class="stat-card-v2 stat-streak">
            <span class="stat-card-icon">🔥</span>
            <span id="streak-days" class="stat-value-big">0</span>
            <span class="stat-label">يوم متتالي</span>
        </div>
        <div class="stat-card-v2 stat-hifz">
            <span class="stat-card-icon">📖</span>
            <div>
                <span id="hifz-progress" class="stat-value-big">0%</span>
                <div class="progress-bar-wrap">
                    <div class="progress-bar-fill" id="hifz-bar" style="width:0%"></div>
                </div>
            </div>
            <span class="stat-label">تقدم الحفظ</span>
        </div>
        <div class="stat-card-v2 stat-score">
            <span class="stat-card-icon">⭐</span>
            <span id="revision-score" class="stat-value-big">0</span>
            <span class="stat-label">نقاط المراجعة</span>
        </div>
    </div>
</section>
```

**Étape 2 — Ajouter les styles dans HomePage.css**

```css
.stats-grid-v2 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-3);
}

.stat-card-v2 {
    background: var(--card-bg, white);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    text-align: center;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
    transition: transform var(--transition-fast);
}
.stat-card-v2:hover { transform: translateY(-2px); }

.stat-card-icon { font-size: 1.5rem; display: block; margin-bottom: var(--space-2); }
.stat-value-big { font-size: 1.75rem; font-weight: 700; display: block; }
.stat-label     { font-size: 0.75rem; color: var(--text-secondary); margin-top: var(--space-1); }

.progress-bar-wrap {
    height: 6px;
    background: var(--border-color);
    border-radius: 999px;
    margin-top: var(--space-2);
    overflow: hidden;
}
.progress-bar-fill {
    height: 100%;
    background: var(--accent-green);
    border-radius: 999px;
    transition: width 0.8s ease;
}
```

**Étape 3 — Animer la barre de progression dans initDashboard**

Dans `initDashboard('student')`, après avoir chargé les données :
```js
const pct = Math.round((hifzDone / hifzTotal) * 100) || 0;
document.getElementById('hifz-progress').textContent = pct + '%';
requestAnimationFrame(() => {
    document.getElementById('hifz-bar').style.width = pct + '%';
});
```

**Étape 4 — Tester**
```bash
# Ouvrir http://localhost:3456 avec un compte étudiant
# Vérifier que les 3 cartes s'affichent, que la barre s'anime
```

**Étape 5 — Commit**
```bash
git add frontend/src/pages/HomePage.js frontend/src/pages/HomePage.css
git commit -m "feat: dashboard étudiant — stats visuelles v2 + progress bar hifz animée"
```

---

### Task 4 : Badges de notification dans la bottom bar

**Problème actuel :** La nav bottom bar n'a aucun indicateur visuel — l'étudiant ne sait pas combien de tâches en attente il a.

**Fichiers :**
- Modifier : `frontend/src/core/NavManager.js`
- Modifier : `frontend/src/core/NavManager.css`

**Étape 1 — Ajouter le support badge dans buildBottomBar**

Dans `NavManager.js`, dans la fonction qui crée les items de la bottom bar, ajouter :
```js
// Après création du bouton bottom bar item
const badgeEl = document.createElement('span');
badgeEl.className = 'nav-badge';
badgeEl.id = `nav-badge-${tab.key}`;
badgeEl.style.display = 'none';
btn.appendChild(badgeEl);
```

**Étape 2 — Exposer une fonction updateBadge**

À la fin de `NavManager.js`, exporter :
```js
export function updateNavBadge(key, count) {
    const el = document.getElementById(`nav-badge-${key}`);
    if (!el) return;
    if (count > 0) {
        el.textContent = count > 99 ? '99+' : count;
        el.style.display = 'flex';
    } else {
        el.style.display = 'none';
    }
}
```

**Étape 3 — Styles badge dans NavManager.css**

```css
.nav-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #dc2626;
    color: white;
    font-size: 0.65rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
}
```

**Étape 4 — Appeler updateNavBadge après chargement des tâches**

Dans `frontend/src/pages/MyTasksPage.js` (ou là où les tâches en attente sont chargées) :
```js
import { updateNavBadge } from '../core/NavManager.js';
// Après fetch des tâches :
const pending = tasks.filter(t => t.status === 'pending').length;
updateNavBadge('soumettre', pending);
```

**Étape 5 — Tester**
```bash
# Connecté en étudiant avec des tâches en attente
# → vérifier le badge rouge sur le bouton "إرسال"
```

**Étape 6 — Commit**
```bash
git add frontend/src/core/NavManager.js frontend/src/core/NavManager.css frontend/src/pages/MyTasksPage.js
git commit -m "feat: badges de notification dans la bottom bar nav"
```

---

## AXE 2 — Nouvelles fonctionnalités

### Task 5 : Notifications Push (Web Push API)

**Objectif :** Envoyer une notification push quand un enseignant corrige une soumission ou assigne un nouveau devoir.

**Fichiers :**
- Créer : `frontend/src/services/push-notifications.js`
- Modifier : `frontend/sw.js` (ajouter handler `push`)
- Modifier : `frontend/src/pages/SettingsPage.js` (toggle activer/désactiver)
- Créer : `supabase/functions/send-push/index.ts` (Edge Function Supabase)

**Étape 1 — Générer les clés VAPID**

```bash
npx web-push generate-vapid-keys
```
Noter les clés `publicKey` et `privateKey`. Les enregistrer dans Supabase Dashboard → Edge Function Secrets :
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` = `mailto:ahmadsaleh2005moody117@gmail.com`

**Étape 2 — Créer le service push côté client**

Créer `frontend/src/services/push-notifications.js` :
```js
const VAPID_PUBLIC_KEY = 'VOTRE_CLE_PUBLIQUE_VAPID';

export async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;

    const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    return sub;
}

export async function savePushSubscription(supabaseClient, userId, subscription) {
    const { error } = await supabaseClient
        .from('push_subscriptions')
        .upsert({ user_id: userId, subscription: subscription.toJSON() });
    if (error) throw error;
}

export async function unsubscribeFromPush(supabaseClient, userId) {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await supabaseClient.from('push_subscriptions').delete().eq('user_id', userId);
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}
```

**Étape 3 — Ajouter la table Supabase push_subscriptions**

Dans Supabase SQL Editor :
```sql
create table push_subscriptions (
    user_id  uuid primary key references profiles(id) on delete cascade,
    subscription jsonb not null,
    created_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
create policy "own" on push_subscriptions
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

**Étape 4 — Handler push dans sw.js**

Dans `frontend/sw.js`, ajouter :
```js
self.addEventListener('push', event => {
    const data = event.data?.json() ?? { title: 'مراجعة القرآن', body: '' };
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icon-192.png',
            badge: '/icon-72.png',
            dir: 'rtl',
            lang: 'ar',
            data: { url: data.url ?? '/' },
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

**Étape 5 — Créer l'Edge Function Supabase**

Créer `supabase/functions/send-push/index.ts` :
```ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import webpush from 'npm:web-push@3.6.7';

serve(async (req) => {
    const { user_id, title, body, url } = await req.json();

    webpush.setVapidDetails(
        Deno.env.get('VAPID_SUBJECT')!,
        Deno.env.get('VAPID_PUBLIC_KEY')!,
        Deno.env.get('VAPID_PRIVATE_KEY')!,
    );

    // Récupérer la subscription depuis Supabase
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data } = await sb.from('push_subscriptions').select('subscription').eq('user_id', user_id).single();
    if (!data) return new Response('no subscription', { status: 404 });

    await webpush.sendNotification(data.subscription, JSON.stringify({ title, body, url }));
    return new Response('sent', { status: 200 });
});
```

**Étape 6 — Déclencher la notification après correction d'une soumission**

Dans `supabase-submissions.js`, dans la fonction de correction (grade/award points), appeler l'Edge Function :
```js
await supabaseClient.functions.invoke('send-push', {
    body: {
        user_id: submission.student_id,
        title: 'تم تصحيح تلاوتك ✅',
        body: `حصلت على ${awardedPoints} نقطة`,
        url: '/soumettre',
    },
});
```

**Étape 7 — Toggle dans SettingsPage**

Dans `SettingsPage.js`, ajouter un bouton :
```html
<div class="setting-row">
    <span>إشعارات التصحيح</span>
    <button id="push-toggle" class="btn btn-sm btn-outline">تفعيل</button>
</div>
```
Et dans l'init :
```js
document.getElementById('push-toggle').addEventListener('click', async () => {
    const { subscribeToPush, savePushSubscription } = await import('../services/push-notifications.js');
    const sub = await subscribeToPush();
    if (sub) {
        await savePushSubscription(supabaseClient, state.user.id, sub);
        showNotification('تم تفعيل الإشعارات', 'success');
    }
});
```

**Étape 8 — Déployer l'Edge Function**
```bash
supabase functions deploy send-push
```

**Étape 9 — Tester**
- Activer les notifs depuis les paramètres d'un compte étudiant
- Corriger une soumission depuis un compte enseignant
- Vérifier que la notification push arrive

**Étape 10 — Commit**
```bash
git add frontend/src/services/push-notifications.js frontend/sw.js frontend/src/pages/SettingsPage.js supabase/functions/send-push/index.ts
git commit -m "feat: notifications push Web Push API (correction soumission)"
```

---

### Task 6 : Planning de révision hebdomadaire

**Objectif :** Afficher un calendrier 7 jours sur le dashboard étudiant montrant les devoirs passés/à faire, et un indicateur de streak visuel.

**Fichiers :**
- Créer : `frontend/src/components/WeekCalendar.js`
- Créer : `frontend/src/components/WeekCalendar.css`
- Modifier : `frontend/src/pages/HomePage.js` (section dashboard étudiant)

**Étape 1 — Créer le composant WeekCalendar**

Créer `frontend/src/components/WeekCalendar.js` :
```js
// WeekCalendar — composant calendrier hebdomadaire RTL
// Affiche 7 jours : passé (✅/❌), aujourd'hui (surligné), futur (⏳)

const DAY_LABELS = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

export function renderWeekCalendar(tasks = []) {
    const today = new Date();
    const days = [];

    for (let i = -3; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        const dayTasks = tasks.filter(t => t.due_date?.startsWith(iso));
        const done = dayTasks.every(t => t.status === 'graded' || t.status === 'approved');
        const hasTasks = dayTasks.length > 0;

        days.push({
            label: DAY_LABELS[d.getDay()],
            date: d.getDate(),
            iso,
            isToday: i === 0,
            isFuture: i > 0,
            status: !hasTasks ? 'empty' : (done ? 'done' : (i < 0 ? 'missed' : 'pending')),
        });
    }

    return `
    <div class="week-calendar" dir="rtl">
        ${days.map(d => `
            <div class="week-day ${d.isToday ? 'week-day--today' : ''} week-day--${d.status}">
                <span class="week-day-label">${d.label}</span>
                <span class="week-day-num">${d.date}</span>
                <span class="week-day-dot">
                    ${d.status === 'done'    ? '✅' :
                      d.status === 'missed'  ? '❌' :
                      d.status === 'pending' ? '⏳' : '·'}
                </span>
            </div>
        `).join('')}
    </div>`;
}
```

**Étape 2 — Styles WeekCalendar**

Créer `frontend/src/components/WeekCalendar.css` :
```css
.week-calendar {
    display: flex;
    gap: var(--space-2);
    justify-content: center;
    padding: var(--space-4) 0;
    overflow-x: auto;
}

.week-day {
    flex: 1;
    min-width: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2);
    border-radius: var(--radius-md);
    background: var(--surface, #f8f9fa);
    border: 2px solid transparent;
    transition: all var(--transition-fast);
}

.week-day--today {
    border-color: var(--accent-green);
    background: rgba(45, 80, 22, 0.08);
    font-weight: 700;
}

.week-day--done    { background: rgba(22, 163, 74, 0.08); }
.week-day--missed  { background: rgba(220, 38, 38, 0.08); }
.week-day--pending { background: rgba(217, 119, 6, 0.08); }

.week-day-label { font-size: 0.7rem; color: var(--text-secondary); }
.week-day-num   { font-size: 1rem;   font-weight: 600; }
.week-day-dot   { font-size: 0.8rem; }
```

**Étape 3 — Intégrer dans renderStudentDashboard**

Dans `HomePage.js`, dans `renderStudentDashboard()`, après le bloc stats, ajouter :
```html
<section class="dashboard-section">
    <h3 class="section-title">📅 أسبوعك</h3>
    <div id="week-calendar-container">
        <!-- chargé par initDashboard -->
    </div>
</section>
```

Et dans `initDashboard('student')` :
```js
import { renderWeekCalendar } from '../components/WeekCalendar.js';
// Après avoir chargé tasks :
document.getElementById('week-calendar-container').innerHTML = renderWeekCalendar(tasks);
```

**Étape 4 — Injecter le CSS dynamiquement dans WeekCalendar.js**

Ajouter en tête de `WeekCalendar.js` :
```js
if (!document.querySelector('link[href*="WeekCalendar.css"]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = '/src/components/WeekCalendar.css';
    document.head.appendChild(l);
}
```

**Étape 5 — Tester**
```bash
# Ouvrir http://localhost:3456 en étudiant
# Vérifier que le calendrier 7 jours apparaît sur le dashboard
# Vérifier que les couleurs ✅/❌/⏳ correspondent aux tâches
```

**Étape 6 — Commit**
```bash
git add frontend/src/components/WeekCalendar.js frontend/src/components/WeekCalendar.css frontend/src/pages/HomePage.js
git commit -m "feat: planning hebdomadaire — composant WeekCalendar sur dashboard étudiant"
```

---

### Task 7 : Analytics avancés — Graphe de progression (ProfilPage)

**Objectif :** Ajouter un graphe de l'évolution des points sur les 30 derniers jours dans ProfilPage.

**Fichiers :**
- Modifier : `frontend/src/pages/ProfilPage.js`
- Modifier : `frontend/src/pages/ProgressPage.css`
- Modifier : `frontend/index.html` (ajouter Chart.js CDN)

**Étape 1 — Ajouter Chart.js via CDN**

Dans `frontend/index.html`, dans `<head>` :
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

**Étape 2 — Ajouter le canvas dans ProfilPage**

Dans `ProfilPage.js`, dans le render, ajouter une section :
```html
<section class="dashboard-section">
    <h3 class="section-title">📊 تطور النقاط — 30 يوماً</h3>
    <div class="chart-container">
        <canvas id="points-chart" height="200"></canvas>
    </div>
</section>
```

**Étape 3 — Charger les données depuis points_log**

Dans l'init de ProfilPage :
```js
async function loadPointsChart() {
    const { data: logs } = await supabaseClient
        .from('points_log')
        .select('delta, created_at')
        .eq('student_id', state.user.id)
        .gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString())
        .order('created_at');

    // Agréger par jour
    const byDay = {};
    (logs || []).forEach(log => {
        const day = log.created_at.split('T')[0];
        byDay[day] = (byDay[day] || 0) + log.delta;
    });

    const labels = Object.keys(byDay).map(d => d.slice(5)); // MM-DD
    const data   = Object.values(byDay);
    const cumul  = data.reduce((acc, v) => { acc.push((acc.at(-1) || 0) + v); return acc; }, []);

    new Chart(document.getElementById('points-chart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'النقاط التراكمية',
                data: cumul,
                borderColor: '#2d5016',
                backgroundColor: 'rgba(45,80,22,0.1)',
                fill: true,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true },
                x: { ticks: { maxTicksLimit: 7 } },
            }
        }
    });
}
loadPointsChart();
```

**Étape 4 — Style chart-container**

Dans `ProgressPage.css` :
```css
.chart-container {
    background: var(--surface, white);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-color);
}
```

**Étape 5 — Tester**
```bash
# http://localhost:3456 → connexion étudiant → onglet Profil
# Vérifier que le graphe Chart.js s'affiche avec des vraies données
```

**Étape 6 — Commit**
```bash
git add frontend/index.html frontend/src/pages/ProfilPage.js frontend/src/pages/ProgressPage.css
git commit -m "feat: graphe d'évolution des points 30j (Chart.js) dans ProfilPage"
```

---

## AXE 3 — Performance & Qualité du code

### Task 8 : Découper AdminPage.js (50KB → modules)

**Problème :** `AdminPage.js` est un monolithe de 50KB. À chaque navigation admin, tout le fichier est parsé.

**Fichiers :**
- Créer : `frontend/src/pages/admin/AdminUsersSection.js`
- Créer : `frontend/src/pages/admin/AdminClassesSection.js`
- Créer : `frontend/src/pages/admin/AdminStatsSection.js`
- Modifier : `frontend/src/pages/AdminPage.js` (façade + lazy import)

**Étape 1 — Identifier les sections dans AdminPage.js**

```bash
grep -n "^// ==\|^export function\|^function " frontend/src/pages/AdminPage.js | head -40
```
But attendu : voir les grandes sections (gestion users, classes, stats).

**Étape 2 — Créer AdminUsersSection.js**

Extraire de `AdminPage.js` toutes les fonctions liées aux utilisateurs (render, init, CRUD) dans `frontend/src/pages/admin/AdminUsersSection.js` avec export nommé.

**Étape 3 — Créer AdminClassesSection.js et AdminStatsSection.js**

Même principe pour les sections classes et statistiques.

**Étape 4 — Faire de AdminPage.js une façade avec lazy imports**

```js
// AdminPage.js — façade, lazy loading par section
export async function render(section = 'users') {
    const sections = {
        users:   () => import('./admin/AdminUsersSection.js').then(m => m.render()),
        classes: () => import('./admin/AdminClassesSection.js').then(m => m.render()),
        stats:   () => import('./admin/AdminStatsSection.js').then(m => m.render()),
    };
    return (await sections[section]?.()) ?? '';
}

export async function init(section = 'users') {
    const sections = {
        users:   () => import('./admin/AdminUsersSection.js').then(m => m.init()),
        classes: () => import('./admin/AdminClassesSection.js').then(m => m.init()),
        stats:   () => import('./admin/AdminStatsSection.js').then(m => m.init()),
    };
    await sections[section]?.();
}
```

**Étape 5 — Vérifier que la navigation admin fonctionne toujours**
```bash
# Connecté en admin, naviguer entre users / classes / stats
# Vérifier dans l'onglet Network que les sous-modules se chargent à la demande
```

**Étape 6 — Commit**
```bash
git add frontend/src/pages/AdminPage.js frontend/src/pages/admin/
git commit -m "perf: découper AdminPage.js en sous-modules lazy-loadés (50KB → 3×~15KB)"
```

---

### Task 9 : Découper TeacherPage.js (47KB → modules)

Même approche que Task 8.

**Fichiers :**
- Créer : `frontend/src/pages/teacher/TeacherDevoirsSection.js`
- Créer : `frontend/src/pages/teacher/TeacherSoumissionsSection.js`
- Créer : `frontend/src/pages/teacher/TeacherElevesSection.js`
- Modifier : `frontend/src/pages/TeacherPage.js` (façade lazy)

**Étapes :** identiques à Task 8, adapter pour les sections devoirs / soumissions / élèves.

**Commit :**
```bash
git commit -m "perf: découper TeacherPage.js en sous-modules lazy-loadés (47KB → 3×~15KB)"
```

---

### Task 10 : Éliminer les styles inline → classes CSS

**Problème :** Partout dans les pages JS, on voit `style="margin-bottom: var(--space-4); display: flex; gap: 8px;"`. Impossible à surcharger en dark mode ou responsive.

**Étape 1 — Auditer les inline styles**

```bash
grep -rn 'style="' frontend/src/pages/ | wc -l
```
But attendu : voir le nombre total de styles inline.

**Étape 2 — Créer les classes utilitaires dans style.css**

```css
/* Utilitaires */
.mb-4   { margin-bottom: var(--space-4); }
.mb-6   { margin-bottom: var(--space-6); }
.mt-4   { margin-top: var(--space-4); }
.flex   { display: flex; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.gap-2  { gap: var(--space-2); }
.gap-4  { gap: var(--space-4); }
.text-center { text-align: center; }
.w-full { width: 100%; }
```

**Étape 3 — Remplacer les inline styles les plus fréquents**

Priorité : `HomePage.js`, `HifzPage.js`, `WardPage.js` (les 3 plus consultées).
Remplacer `style="margin-bottom: var(--space-4)"` → `class="mb-4"`, etc.

**Étape 4 — Vérifier visuellement**
```bash
# Comparer avant/après dans le navigateur — aucune régression visuelle
```

**Étape 5 — Commit**
```bash
git add frontend/style.css frontend/src/pages/HomePage.js frontend/src/pages/HifzPage.js frontend/src/pages/WardPage.js
git commit -m "style: remplacer styles inline → classes utilitaires CSS"
```

---

## Ordre d'exécution recommandé

```
AXE 1 (Design) :  Task 1 → Task 2 → Task 3 → Task 4
AXE 2 (Features): Task 5 → Task 6 → Task 7
AXE 3 (Perf):     Task 8 → Task 9 → Task 10
```

**Commencer par AXE 1 Task 1** (consolider le CSS) car toutes les tâches suivantes en dépendent.

---

*Plan sauvegardé le 2026-06-01 — QuranReview amélioration globale*
