## 2024-03-24 - Arabic ARIA labels for icon-only buttons
**Learning:** For a localized PWA application like QuranReview, accessibility elements like ARIA labels (`aria-label`) and tooltips (`title`) must be fully localized to the target language (Arabic) for screen readers to properly announce actions to users relying on assistive technologies. Emojis alone are poorly interpreted by standard Arabic screen readers.
**Action:** Always append Arabic `aria-label` and `title` attributes when adding or modifying icon-only buttons (e.g. ✕ for `إغلاق`, 🗑️ for `حذف الفصل`).
