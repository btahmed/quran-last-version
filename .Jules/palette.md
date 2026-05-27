## 2024-03-24 - Accessibility on dynamically generated components
**Learning:** Icon-only buttons added via JS template literals are prone to missing ARIA labels since they are easy to overlook in string templates and might evade static analyzers.
**Action:** Pay special attention to JS files that return large HTML strings and proactively add `aria-label` and `title` to icon-only controls.
