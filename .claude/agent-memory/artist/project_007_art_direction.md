---
name: project-007-art-direction
description: Stack Kitchen (ex-slot 007) art direction decided 2026-09-16 — theme, palette tokens, and the single-meaning-gold rule
metadata:
  type: project
---

Stack Kitchen's first art pass (now `design/art.md` in this repo, written in the incubator as slot 007)
was written 2026-09-16, right after the first human playtest logged "KEEP
GOING" and asked explicitly for Artist + UI Designer to rework visuals.

**Theme:** Vietnamese sidewalk iced-tea stall (quán trà đá vỉa hè) — aluminum
folding table, red/blue plastic stools (decorative only, not data-bearing),
enamelware tray for the Bếp (cook board), warm hanging-bulb night lighting.
Card presentation references Slay the Spire (chunky frame, corner value chip)
and Balatro (bouncy gold score-pop, pulsing glow = "you can act here").

**Key discipline — `--gold` (`#f2c14e`) has exactly one meaning game-wide:**
"you can act here for points" (useful cards in hand, claimable center card,
Cook-ready button, score-pop text, winner ring on end screen). Nothing else
may use it — this directly fixed an existing collision in the original prototype (`design/reference-prototype.html`)
where `.course.M.have`/`.food.M` (`#f0b35a`) sat almost on top of gold, and
`tr.can`/`.log .reveal` (`#7fd69a`) sat on top of the new Course A green.

**Course colors (colorblind-safe, always paired with A/M/D letter):**
Appetizer `--course-a #4caf6b` (green), Main `--course-m #c9552c`
(red-orange — moved off the old gold-adjacent `#f0b35a`), Dessert
`--course-d #b0559e` (magenta).

**Why this matters going forward:** any future mechanic doc or UI spec that
adds a new "this matters, act on it" signal should reuse `--gold`, not invent
a new highlight color — that's the whole point of the rule. See
`design/art.md` for the full token table (tokens are implemented at the top of `src/ui/table.css`), card face
specs (ingredient vs. food card vs. card back), and the "Fix bắt buộc khi
build" section listing exact hex collisions `game-dev` needs to correct.
