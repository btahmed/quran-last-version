## 2026-11-10 - RTL Icon Directionality Accessibility
**Learning:** In RTL contexts, standard chevron icons (›, ‹) have reversed semantics ('›' for previous, '‹' for next). Dynamically generated JS templates often miss ARIA labels for these native icon buttons, which evades static HTML a11y checkers.
**Action:** Always verify chevron icon directionality and ensure native `aria-label` and `title` attributes are applied to JS-generated icon buttons in RTL/bilingual environments.
