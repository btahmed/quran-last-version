// frontend/src/core/validators.js
// Fonctions de validation pures — aucune dépendance externe.
// Retournent toujours { valid: boolean, error?: string }

const ok = () => ({ valid: true });
const err = msg => ({ valid: false, error: msg });

export const Validators = {
    surahId(n) {
        const v = Number(n);
        if (!Number.isInteger(v) || v < 1 || v > 114)
            return err('رقم السورة يجب أن يكون بين 1 و 114');
        return ok();
    },

    ayahNumber(n) {
        const v = Number(n);
        if (!Number.isInteger(v) || v < 1 || v > 286)
            return err('رقم الآية يجب أن يكون بين 1 و 286');
        return ok();
    },

    username(s) {
        if (typeof s !== 'string' || s.trim().length < 2)
            return err('اسم المستخدم يجب أن يحتوي على حرفين على الأقل');
        if (s.trim().length > 80) return err('اسم المستخدم طويل جداً');
        return ok();
    },

    email(s) {
        if (typeof s !== 'string') return err('بريد إلكتروني غير صالح');
        // RFC 5322 simplifié — suffisant pour une validation frontend
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())) return err('بريد إلكتروني غير صالح');
        return ok();
    },

    role(s) {
        if (!['student', 'teacher', 'admin'].includes(s)) return err('الدور غير معروف');
        return ok();
    },

    points(n) {
        const v = Number(n);
        if (!Number.isInteger(v) || v < -1000 || v > 1000)
            return err('القيمة يجب أن تكون بين -1000 و 1000');
        return ok();
    },

    text(s, { minLen = 0, maxLen = 500 } = {}) {
        if (typeof s !== 'string') return err('نص غير صالح');
        const t = s.trim();
        if (t.length < minLen) return err(`النص قصير جداً (${minLen} أحرف على الأقل)`);
        if (t.length > maxLen) return err(`النص طويل جداً (${maxLen} حرف كحد أقصى)`);
        return ok();
    },
};
