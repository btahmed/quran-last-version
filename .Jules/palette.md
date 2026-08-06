## 2024-05-18 - [Accessibility: Modal Close Buttons]
**Learning:** Dynamically injected modal close buttons without text often lack accessible labels, rendering them opaque to screen readers.
**Action:** Ensure that all dynamically generated button templates with icon-only content include `aria-label` and `title` attributes.
