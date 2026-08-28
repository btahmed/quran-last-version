---
name: Murajaa Juz boundaries
description: Product rule for selecting Quran Juz and Hizb ranges in the Murajaa wizard
---

Juz and Hizb selections in the Murajaa setup wizard represent exact page ranges, not whole sourates. A sourate can cross a Juz boundary, so selecting the overlapping sourate would incorrectly mark the neighboring Juz.

**Why:** The first Juz includes pages 1–21 while Al-Baqara continues into the second Juz; modeling the choice only as sourate numbers made both Juz appear selected.

**How to apply:** Keep exact Juz/Hizb ranges separate from whole-sourate selections, and calculate checkbox states from page coverage.