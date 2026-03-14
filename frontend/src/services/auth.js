// frontend/src/services/auth.js
import { Logger } from '../core/logger.js';
import { config, IS_DEMO_MODE } from '../core/config.js';
import { state } from '../core/state.js';
import { showNotification } from '../core/ui.js';

export function initAuth() {
    const token = localStorage.getItem(config.apiTokenKey);
    const userData = localStorage.getItem('quranreview_user');

    if (token && userData) {
        try {
            state.user = JSON.parse(userData);
            updateAuthUI(true);
            fetchMe();
        } catch {
            logout();
        }
    } else {
        updateAuthUI(false);
    }
}

export function updateAuthUI(loggedIn) {
    const loginBtn = document.getElementById('auth-login-btn');
    const userInfo = document.getElementById('auth-user-info');
    const usernameEl = document.getElementById('auth-username');
    const teacherLinks = document.querySelectorAll('.nav-teacher-only');
    const studentLinks = document.querySelectorAll('.nav-student-only');

    if (loggedIn && state.user) {
        loginBtn?.classList.add('hidden');
        userInfo?.classList.remove('hidden');
        if (usernameEl) {
            const roleLabel = state.user.role === 'admin' || state.user.is_superuser ? '⚙️' : state.user.role === 'teacher' ? '👨‍🏫' : '🎓';
            usernameEl.textContent = `${roleLabel} ${state.user.first_name || state.user.username}`;
        }
        // Show/hide role-specific nav links
        const isAdmin = state.user.role === 'admin' || state.user.is_superuser;
        const isTeacher = state.user.role === 'teacher';
        teacherLinks.forEach(el => el.style.display = isTeacher ? 'inline-block' : 'none');
        studentLinks.forEach(el => el.style.display = (!isTeacher && !isAdmin) ? 'inline-block' : 'none');
        document.querySelectorAll('.nav-admin-only').forEach(el => el.style.display = isAdmin ? 'inline-block' : 'none');
    } else {
        loginBtn?.classList.remove('hidden');
        userInfo?.classList.add('hidden');
        teacherLinks.forEach(el => el.style.display = 'none');
        studentLinks.forEach(el => el.style.display = 'none');
    }
}

export function showAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal?.classList.add('active');
    modal?.classList.remove('hidden');
    document.getElementById('login-error')?.classList.add('hidden');
}

export function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal?.classList.remove('active');
    modal?.classList.add('hidden');
}

export function showRegisterForm(event) {
    if (event) event.preventDefault();
    document.getElementById('auth-login-form')?.classList.add('hidden');
    document.getElementById('auth-register-form')?.classList.remove('hidden');
    document.getElementById('auth-register-form')?.classList.add('active');
    document.getElementById('reg-error')?.classList.add('hidden');
}

export function showLoginForm(event) {
    if (event) event.preventDefault();
    document.getElementById('auth-register-form')?.classList.add('hidden');
    document.getElementById('auth-register-form')?.classList.remove('active');
    document.getElementById('auth-login-form')?.classList.remove('hidden');
    document.getElementById('auth-login-form')?.classList.add('active');
    document.getElementById('login-error')?.classList.add('hidden');
}

export async function performLogin(username, password) {
    Logger.log('AUTH', `Attempting login for user: ${username}`);

    // Mode DÉMO - Simulation locale sans serveur
    if (IS_DEMO_MODE) {
        Logger.log('AUTH', '🎮 Mode DÉMO: Simulation de connexion...');

        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 800));

        // Accepter n'importe quel identifiant (pour la démo)
        const demoUser = {
            id: 1,
            username: username,
            first_name: 'مستخدم',
            last_name: 'تجريبي',
            email: 'demo@quranreview.live',
            role: 'student',
            is_superuser: false
        };

        // Stocker comme si c'était une vraie connexion
        state.user = demoUser;
        localStorage.setItem('quranreview_user', JSON.stringify(demoUser));
        localStorage.setItem(config.apiTokenKey, 'demo_token_' + Date.now());
        localStorage.setItem('quranreview_refresh_token', 'demo_refresh_' + Date.now());

        hideAuthModal();
        updateAuthUI(true);

        // Charger des tâches de démo
        loadDemoTasks();

        // Redirection
        window.QuranReview.navigateTo('home');
        showNotification('✅ Mode démo: Connexion simulée avec succès!', 'success');

        Logger.log('AUTH', 'Mode DÉMO: Connexion réussie');
        return;
    }

    // Mode normal avec API
    // Note: apiBaseUrl peut être '' (chaîne vide) pour les URLs relatives nginx — vérifier null/undefined uniquement
    if (config.apiBaseUrl === null || config.apiBaseUrl === undefined) {
        throw new Error('لم يتم تكوين خادم API');
    }

    try {
        const response = await fetch(`${config.apiBaseUrl}/api/auth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        Logger.log('AUTH', `Login Response Status: ${response.status}`);

        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('استجابة غير صالحة من الخادم');
        }

        if (!response.ok) {
            Logger.warn('AUTH', 'Login failed', data);
            const errorMsg = data.detail || data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة';
            throw new Error(errorMsg);
        }

        if (!data.access || !data.refresh) {
            throw new Error('استجابة غير كاملة من الخادم');
        }

        Logger.log('AUTH', 'Login successful, tokens received');
        localStorage.setItem(config.apiTokenKey, data.access);
        localStorage.setItem('quranreview_refresh_token', data.refresh);
        hideAuthModal();

        try {
            await fetchMe();
        } catch (e) {
            console.warn('Could not fetch user info, but login succeeded');
        }

        window.QuranReview.loadTasksFromApi();

        if (state.user) {
            Logger.log('AUTH', `Redirecting user role: ${state.user.role}`);
            if (state.user.role === 'admin' || state.user.is_superuser) {
                window.QuranReview.navigateTo('admin');
            } else if (state.user.role === 'teacher') {
                window.QuranReview.navigateTo('teacher');
            } else {
                window.QuranReview.navigateTo('mytasks');
            }
        } else {
            window.QuranReview.navigateTo('home');
        }

        showNotification('تم تسجيل الدخول بنجاح', 'success');
    } catch (error) {
        Logger.error('AUTH', 'Login process error', error);
        throw error;
    }
}

// Charger des tâches de démo
export function loadDemoTasks() {
    const demoTasks = [
        { id: 1, title: 'حفظ سورة الفاتحة', description: 'من الآية 1 إلى 7', status: 'pending', points: 10, due_date: '2024-12-25' },
        { id: 2, title: 'مراجعة سورة البقرة', description: 'من الآية 1 إلى 50', status: 'completed', points: 20, due_date: '2024-12-20' },
        { id: 3, title: 'تعلم التجويد - المدود', description: 'دراسة أحكام المد', status: 'submitted', points: 15, due_date: '2024-12-22' }
    ];
    state.tasks = demoTasks;
    localStorage.setItem(config.tasksKey, JSON.stringify(demoTasks));
    // Pas besoin de renderTasks ici - les tâches seront affichées quand on navigue
}

export async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const firstName = document.getElementById('reg-first-name').value.trim();
    const lastName = document.getElementById('reg-last-name').value.trim();
    const errorEl = document.getElementById('reg-error');
    const submitBtn = document.getElementById('reg-submit-btn');

    // Validation
    if (!username || !password) {
        if (errorEl) {
            errorEl.textContent = 'الرجاء إدخال اسم المستخدم وكلمة المرور';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    errorEl?.classList.add('hidden');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳</span> جاري التسجيل...';
    }

    // Mode DÉMO
    if (IS_DEMO_MODE) {
        Logger.log('AUTH', '🎮 Mode DÉMO: Simulation d\'inscription...');
        await new Promise(resolve => setTimeout(resolve, 800));

        // Simuler un utilisateur enregistré puis connecté
        await performLogin(username, password);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>✨</span> إنشاء الحساب';
        }
        return;
    }

    // Mode normal avec API
    try {
        const response = await fetch(`${config.apiBaseUrl}/api/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                first_name: firstName,
                last_name: lastName
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            let msg = data.detail || 'خطأ في التسجيل';
            if (typeof data === 'object') {
                if (data.username) msg = `اسم المستخدم: ${data.username[0]}`;
                else if (data.password) msg = `كلمة المرور: ${data.password[0]}`;
            }
            throw new Error(msg);
        }

        await performLogin(username, password);

    } catch (error) {
        console.error('Register error:', error);
        if (errorEl) {
            if (error.message === 'Failed to fetch') {
                errorEl.textContent = 'تعذر الاتصال بالخادم. تأكد من تشغيل الخادم المحلي.';
            } else {
                errorEl.textContent = error.message;
            }
            errorEl.classList.remove('hidden');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>✨</span> إنشاء الحساب';
        }
    }
}

export async function handleLogin(event) {
    event.preventDefault();
    event.stopPropagation();

    const username = document.getElementById('login-username')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit-btn');

    console.log('[LOGIN] Attempting login for:', username);

    if (!username || !password) {
        if (errorEl) {
            errorEl.textContent = 'الرجاء إدخال اسم المستخدم وكلمة المرور';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    errorEl?.classList.add('hidden');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-loading');
        submitBtn.innerHTML = '<span>⏳</span> جاري الدخول...';
    }

    try {
        await performLogin(username, password);
    } catch (error) {
        console.error('[LOGIN] Error:', error);
        if (errorEl) {
            errorEl.textContent = error.message || 'فشل تسجيل الدخول. تحقق من بياناتك.';
            errorEl.classList.remove('hidden');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-loading');
            submitBtn.innerHTML = '<span>🔐</span> دخول';
        }
    }
}

export async function fetchMe() {
    const token = localStorage.getItem(config.apiTokenKey);
    if (!token) return;

    try {
        const response = await fetch(`${config.apiBaseUrl}/api/auth/me/`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) return fetchMe();
            logout();
            return;
        }

        if (!response.ok) throw new Error('Failed to fetch user');

        state.user = await response.json();
        localStorage.setItem('quranreview_user', JSON.stringify(state.user));
        updateAuthUI(true);
    } catch (error) {
        console.warn('⚠️ Failed to fetch user info', error);
    }
}

export async function refreshToken() {
    const refresh = localStorage.getItem('quranreview_refresh_token');
    if (!refresh) return false;

    try {
        const response = await fetch(`${config.apiBaseUrl}/api/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
        });

        if (!response.ok) return false;

        const data = await response.json();
        localStorage.setItem(config.apiTokenKey, data.access);
        return true;
    } catch {
        return false;
    }
}

export function logout() {
    localStorage.removeItem(config.apiTokenKey);
    localStorage.removeItem('quranreview_refresh_token');
    localStorage.removeItem('quranreview_user');
    state.user = null;
    updateAuthUI(false);
    window.QuranReview.navigateTo('home');
    showNotification('تم تسجيل الخروج بنجاح', 'info');
}
