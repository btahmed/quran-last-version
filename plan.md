1. **Goal:** Add missing `aria-label` attributes to icon-only or predominantly icon-based buttons in `frontend/src/pages/SettingsPage.js`, `frontend/src/pages/AdminPage.js`, and `frontend/src/pages/HomePage.js`. This is a micro-UX improvement that improves screen-reader accessibility, adhering to Palette's philosophy.
2. **SettingsPage.js**:
   - Add `aria-label="تصدير البيانات"` to the Export Data button.
   - Add `aria-label="استيراد البيانات"` to the Import Data button.
   - Add `aria-label="مسح جميع البيانات"` to the Reset Data button.
3. **HomePage.js**:
   - Add `aria-label="الورد اليومي"` to the Ward button.
   - Add `aria-label="الحفظ والمراجعة"` to the Hifz button.
   - Add `aria-label="المهام"` to the Tasks button.
   - Add `aria-label="الإعدادات"` to the Settings button.
   - And similarly for other quick-btn elements.
4. **AdminPage.js**:
   - Add `aria-label="إغلاق"` to the "✕" close buttons on modals.
5. **Pre-commit**:
   - Run pre-commit instructions.
