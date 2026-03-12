// frontend/src/components/AuthModal.js
// Composant regroupant les 3 modaux : audio-record-modal, user-edit-modal, auth-modal
import { hideAuthModal } from '../services/auth.js';

export function render() {
    return `
    <!-- Modal Enregistrement Audio (Étudiant) -->
    <div class="modal-overlay-pro hidden" id="audio-record-modal">
        <div class="modal-content-pro" style="max-width: 460px;">
            <div style="text-align: center; margin-bottom: var(--space-6);">
                <div style="font-size: 3rem; margin-bottom: var(--space-2);">🎤</div>
                <h2 style="font-size: 1.5rem; font-weight: 700;">تسجيل المهمة</h2>
                <p id="recording-task-name" style="color: var(--color-text-secondary); margin-top: var(--space-2); font-size: 0.95rem;"></p>
            </div>

            <!-- Timer et statut -->
            <div style="text-align: center; margin-bottom: var(--space-6);">
                <div id="recording-timer" style="font-size: 2.5rem; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--color-primary);">00:00</div>
                <p id="recording-status" style="color: var(--color-text-secondary); margin-top: var(--space-2);">اضغط للتسجيل</p>
            </div>

            <!-- Bouton enregistrement -->
            <div style="text-align: center; margin-bottom: var(--space-6);">
                <button id="recording-btn"
                    onclick="QuranReview.toggleRecording()"
                    style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--color-primary); background: var(--glass-bg); font-size: 2rem; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center;">
                    🎙️
                </button>
            </div>

            <!-- Prévisualisation audio -->
            <audio id="recording-preview" controls class="hidden" style="width: 100%; margin-bottom: var(--space-4);"></audio>

            <!-- Actions -->
            <div style="display: flex; gap: var(--space-3);">
                <button class="btn btn-outline-glow" style="flex: 1;" onclick="QuranReview.stopRecording(true)">إلغاء</button>
                <button id="recording-submit-btn" class="btn btn-glow hidden" style="flex: 1;" onclick="QuranReview.submitRecording()">✅ إرسال التسجيل</button>
            </div>
        </div>
    </div>

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
    document.getElementById('auth-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'auth-modal') hideAuthModal();
    });
}
