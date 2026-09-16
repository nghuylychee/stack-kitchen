---
name: project-stack-kitchen-table-ui
description: Stack Kitchen (ex-slot 007) table UI — seat/clockwise convention, zone ids, art/dev split, online rotation
metadata:
  type: project
---

Stack Kitchen (graduated from incubator slot `007-kitchen-mahjong`) is a 2-4 player mahjong-like card game
(migrated content from `006-stack-kitchen`: 27 ingredient cards, 20 Vietnamese
dishes). Single game screen only — spec lives at
`design/ui/table.md` (written as DRAFT 2026-09-16, revised through tuning passes (2)–(5)).

**Why:** the viewing player is always seated at `bottom`; opponents sit at `top` (2p),
`top-left`/`top-right` (3p), or `left`/`top`/`right` (4p) — chosen so the seat
order walking `bottom → left → top → right → bottom` (or the 3p subset) is
visually clockwise on screen, matching turn order. Reuses 006's stacking UX
(cards offset vertically in a "Bếp" cook board, name header exposed, Cook
button appears but never auto-fires, snap-back on invalid drop) for both the
reveal flow (`02-draw-reveal.md` Rules 9-14) and the claim/tố flow
(`03-play-claim.md` Rules 11-14, which replaces the old `#claimModal` popup
with a drag-into-Bếp interaction).

**How to apply:** when touching this slot's UI again, read `design/00-core.md`
+ `02-draw-reveal.md` + `03-play-claim.md` + `04-food-score-end.md` +
`05-ai-player.md` first — the mechanic rules changed 2026-09-16 (stack & cook
replaced the old instant-reveal-button flow) and the ui spec is written
against the *new* rules. Later passes moved the Bếp to a single 250px cook zone
(`#prep`) in the table centre and removed tap-select + Play button.
Artist owns `design/art.md` (palette, card face art, "trà đá vỉa hè" stool/
table theme) in parallel — do not touch visual styling, only zones/ids/
layout/gesture/timing. Zone ids to keep stable across ui/artist/dev:
`#table-surface`, `.seat[data-seat=bottom|left|top|right|top-left|top-right]`,
`.seat-hand-backs`, `.seat-foods`, `.seat-stack`, `#pool-pile`, `#center-play`,
`#last-slot`, `#discard-slot`, `#prep`, `#dock`, `#my-panel`, `#hand-fan`, `#hud`,
`#cTimer`, `#log-drawer` (ids as actually built in `index.html` / `src/ui/table.ts`).

**Online (added 2026-09-16, `06-online-room.md`):** every client renders itself at
`bottom` and rotates the others by seat index, so seat positions are relative to the
viewer, not fixed per player. A human seat played by a bot shows a small `bot` tag
in its name plate. There are now Home and Lobby screens (`#home`, `#lobby`) with no
ui spec yet.

See also [[feedback_ui_animation_numbers_guess]].
