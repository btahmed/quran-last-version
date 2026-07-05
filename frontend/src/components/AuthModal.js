// frontend/src/components/AuthModal.js
// Composant regroupant 2 modaux : user-edit-modal, auth-modal
// Note : audio-record-modal est désormais statique dans index.html
import { hideAuthModal } from '../services/auth.js';

export function render() {
    return `
    <!-- User Edit Modal (Admin) -->
    <div class="modal-overlay-pro hidden" id="user-edit-modal">
        <div class="modal-content-pro" style="max-width: 420px;">
            <div style="text-align: center; margin-bottom: var(--space-6);">
                <div style="font-size: 3rem; margin-bottom: var(--space-2);">✏️</div>
                <h2 style="font-size: 1.5rem; font-weight: 700;">تعديل المستخدم</h2>
            </div>

            <div id="user-edit-error" class="hidden" style="background: rgba(239, 68, 68, 0.1); color: var(--color-danger); padding: var(--space-3); border-radius: var(--radius-lg); margin-bottom: var(--space-4); text-align: center;"></div>
            <div id="user-edit-success" class="hidden" style="background: rgba(34, 197, 94, 0.1); color: var(--color-success); padding: var(--space-3); border-radius: var(--radius-lg); margin-bottom: var(--space-4); text-align: center;">تم الحفظ بنجاح</div>

            <form id="user-edit-form" onsubmit="QuranReview.handleUpdateUser(event)">
                <input type="hidden" id="edit-user-id">

                <div class="form-floating" style="margin-bottom: var(--space-4);">
                    <input type="text" id="edit-username" placeholder=" " disabled>
                    <label for="edit-username">اسم المستخدم</label>
                </div>

                <div class="form-floating" style="margin-bottom: var(--space-4);">
                    <input type="text" id="edit-first-name" placeholder=" ">
                    <label for="edit-first-name">الاسم الأول</label>
                </div>

                <div class="form-floating" style="margin-bottom: var(--space-4);">
                    <input type="text" id="edit-last-name" placeholder=" ">
                    <label for="edit-last-name">اسم العائلة</label>
                </div>

                <div class="form-floating" style="margin-bottom: var(--space-4);">
                    <select id="edit-role">
                        <option value="student">طالب</option>
                        <option value="teacher">معلم</option>
                        <option value="admin">مدير</option>
                    </select>
                    <label for="edit-role">الدور</label>
                </div>

                <div style="margin-bottom: var(--space-6);">
                    <label class="toggle-switch">
                        <input type="checkbox" id="edit-is-superuser">
                        <span class="toggle-slider"></span>
                        <span style="margin-right: var(--space-3);">مدير نظام (Superuser)</span>
                    </label>
                </div>

                <div class="flex-pro" style="gap: var(--space-3);">
                    <button type="button" class="btn btn-outline-glow" style="flex: 1;" onclick="QuranReview.closeUserEditModal()">إلغاء</button>
                    <button type="submit" class="btn btn-glow" style="flex: 1;">حفظ التغييرات</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Auth Modal -->
    <div class="modal-overlay-pro hidden" id="auth-modal">
        <div class="modal-content-pro" style="max-width: 420px;">
            <!-- Login Form -->
            <div id="auth-login-form" class="active">
                <div style="text-align: center; margin-bottom: var(--space-6);">
                    <div style="font-size: 3rem; margin-bottom: var(--space-2);">🕌</div>
                    <h2 style="font-size: 1.5rem; font-weight: 700;">تسجيل الدخول</h2>
                    <p style="color: var(--color-text-secondary);">أهلاً بك مجدداً في مراجعة القرآن</p>
                </div>

                <form id="login-form">
                    <div id="login-error" class="hidden" style="background: rgba(239, 68, 68, 0.1); color: var(--color-danger); padding: var(--space-3); border-radius: var(--radius-lg); margin-bottom: var(--space-4); text-align: center;"></div>

                    <div class="form-floating" style="margin-bottom: var(--space-4);">
                        <input type="text" id="login-username" placeholder=" " autocomplete="username" required>
                        <label for="login-username">اسم المستخدم</label>
                    </div>

                    <div class="form-floating" style="margin-bottom: var(--space-6);">
                        <input type="password" id="login-password" placeholder=" " autocomplete="current-password" required>
                        <label for="login-password">كلمة المرور</label>
                    </div>

                    <button type="button" class="btn btn-glow btn-full" id="login-submit-btn" onclick="QuranReview.handleLogin(event)">
                        <span>🔐</span>
                        دخول
                    </button>
                </form>

                <p style="text-align: center; margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--color-border);">
                    <span style="color: var(--color-text-secondary);">ليس لديك حساب؟ </span>
                    <a href="#" onclick="QuranReview.showRegisterForm(event)" style="color: var(--color-primary); font-weight: 600;">سجل الآن</a>
                </p>
            </div>

            <!-- Register Form -->
            <div id="auth-register-form" class="hidden">
                <div style="text-align: center; margin-bottom: var(--space-6);">
                    <div style="font-size: 3rem; margin-bottom: var(--space-2);">🕌</div>
                    <h2 style="font-size: 1.5rem; font-weight: 700;">إنشاء حساب</h2>
                    <p style="color: var(--color-text-secondary);">ابدأ رحلتك في حفظ القرآن</p>
                </div>

                <form id="register-form">
                    <div id="reg-error" class="hidden" style="background: rgba(239, 68, 68, 0.1); color: var(--color-danger); padding: var(--space-3); border-radius: var(--radius-lg); margin-bottom: var(--space-4); text-align: center;"></div>

                    <div class="form-floating" style="margin-bottom: var(--space-4);">
                        <input type="text" id="reg-username" placeholder=" " autocomplete="username" required>
                        <label for="reg-username">اسم المستخدم</label>
                    </div>

                    <div class="form-floating" style="margin-bottom: var(--space-4);">
                        <input type="text" id="reg-first-name" placeholder=" ">
                        <label for="reg-first-name">الاسم الأول</label>
                    </div>

                    <div class="form-floating" style="margin-bottom: var(--space-4);">
                        <input type="text" id="reg-last-name" placeholder=" ">
                        <label for="reg-last-name">اسم العائلة</label>
                    </div>

                    <div class="form-floating" style="margin-bottom: var(--space-6);">
                        <input type="password" id="reg-password" placeholder=" " autocomplete="new-password" required>
                        <label for="reg-password">كلمة المرور</label>
                    </div>

                    <button type="button" class="btn btn-gradient btn-full" id="reg-submit-btn" onclick="QuranReview.handleRegister(event)">
                        <span>✨</span>
                        إنشاء الحساب
                    </button>
                </form>

                <p style="text-align: center; margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--color-border);">
                    <span style="color: var(--color-text-secondary);">لديك حساب بالفعل؟ </span>
                    <a href="#" onclick="QuranReview.showLoginForm(event)" style="color: var(--color-primary); font-weight: 600;">تسجيل الدخول</a>
                </p>
            </div>
        </div>
    </div>
    `;
}

export function init() {
    // Fermeture du modal auth sur clic overlay (fond)
    document.getElementById('auth-modal')?.addEventListener('click', e => {
        if (e.target.id === 'auth-modal') hideAuthModal();
    });
}
