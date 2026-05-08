## 2026-05-08 - Accessibility: Add ARIA labels to icon-only buttons
**Learning:** Found several icon-only buttons using just emojis (✕ and 🗑️) without accessible names, which creates a poor experience for screen reader users and lacks hover tooltip context for visual users.
**Action:** When working on UI components or reviewing existing code, always ensure icon-only buttons have localized `aria-label` and `title` attributes (e.g., in Arabic for this app) to improve accessibility and general usability.
