---
name: project-menu-orders-art-pass
description: Art extension for the Menu/Order mechanic (07-menu-orders.md, DRAFT as of 2026-09-19) — what got added to art.md and the reasoning behind the new token
metadata:
  type: project
---

2026-09-19: extended `design/art.md` with a new "Menu & Order" section (marked
`Status: DRAFT`, distinct from the rest of the file which stays `BUILT`) for
`design/07-menu-orders.md` (also DRAFT — a Menu of N public dishes + each
player's secret 3-dish Order, added after playtest 2026-09-19 asked to cut
recipe-memorization load). Verified the timing gate myself by reading
`playtest.md`'s 2026-09-19 entry before writing (see
[[feedback-timing-gate-override]] for why that verification step matters) —
the human explicitly asked for GD/Art/UI docs before a ticket, so this DRAFT
art pass is in scope even though the mechanic doc itself is still DRAFT, not
AGREED.

**Key design decisions, in case they get questioned later:**

- **Menu tile is deliberately lighter-weight than a food card** (1.5px course
  border + small chip vs. food card's 3px + gold point chip) — preserves the
  existing "only scoring things get the full heavy frame" hierarchy from the
  Slay-the-Spire reference in Direction. Menu tile's point number uses
  `--text`, not `--gold` — a Menu listing is reference info, not an
  actionable-now signal, so giving it gold would violate the single-meaning
  rule (see [[project-007-art-direction]]).
- **Ingredient icons dropped from the always-on Menu tile, moved to a
  hover/tap tooltip** — at the compact "sits on the table all game" size,
  4 ingredient thumbnails per dish would violate the file's own silhouette
  rule (readable shapes at small size). Reuses existing `Art/Card/*` photos
  as small crops in the tooltip rather than inventing abstract icons.
- **New token `--order-need: #6a5cc4`** (dusty violet) — a small static
  corner-badge icon (not a border/glow) on the *viewing player's own* hand
  cards, meaning "this ingredient serves my secret Order." Deliberately NOT
  a border treatment, specifically so it can layer with the existing
  `useful`/`new`/`sel`/`invalid` border states without visual collision —
  the badge-vs-outline split is the reusable trick here if a future
  mechanic needs another simultaneous-with-existing-states signal. Hue
  chosen to be far from every existing token (course colors, gold, invalid,
  new-ring, stool colors) — full reasoning and hue list is in `art.md` itself.
- **"Order done" state reuses the existing dim/desaturate language**
  (`brightness(.7) saturate(.6)`, already used for locked-while-cooking)
  instead of inventing a new color — avoided a temptation to use red (reads
  as error, wrong meaning) or gold (reads as "still actionable," also wrong
  — the action already happened). Only the *moment* a whole Order completes
  (the `ORDER_BONUS` trigger) gets a one-time `--gold` ring + reused Shine
  sweep, because that instant genuinely is "you just scored."
- **No new raster art needed at all** — Menu tiles reuse `Art/Food/*` (all
  20 dishes already have art regardless of which subset a game's Menu
  draws), ingredient tooltips reuse `Art/Card/*`, and the Order ticket's
  torn-paper look is pure CSS `clip-path`. Only two small hand-drawn inline
  SVGs were added (an order-spike decorative prop, and the order-need tag
  badge) — both written directly in `art.md`, no generation prompt needed.

**2026-09-19 (2) — revised after `design/ui/menu-orders.md` was finished and
the human reviewed both docs together.** Section header flipped to
`Status: AGREED`. Key corrections, in case they get second-guessed later:

- **Order-done state flipped from dim+strikethrough to pale-gold border+glow**
  (`rgba(242,193,78,.5)` = 50% alpha of `--gold`, 1.5px, + a one-time 400ms
  pulse) — human's call, not mine. Deliberately kept weaker than two other
  `--gold` uses so the hierarchy still reads: 50%-alpha static (1 dish done)
  < 100%-opaque pulsing elsewhere (useful/claimable) < 100%-opaque 3px one-shot
  (whole Order complete, moved from the old "ticket" to the `#my-order` block
  since the ticket object no longer exists).
- **Dropped the tilted-paper-ticket/torn-edge/skewer-prop concept entirely** —
  `ui/menu-orders.md` put Order inside `.order-row`s living in `#my-panel`
  (same block as Name/Score/Hand-count/Foods), not a free-floating object on
  the table. A rotated card metaphor doesn't fit a narrow vertical list and
  was already flagged as risky in the old open-question #5. Decided to drop
  the cream-paper tint too (not just the tilt/torn-edge/spike) — the other
  three row-groups in `#my-panel` are all dark `--panel`, and a lone paper-
  colored block would read as a layout bug, not as "this is mine." The
  "mine" signal now comes from position (only in the viewer's own panel) and
  the "YOUR ORDER" label, not material.
- **Found and fixed a real mismatch, not just a wording sync:** my original
  draft speced a standalone "Menu board" of ~52×80px card-tiles before
  `ui/menu-orders.md` existed. The UI doc actually built a horizontal
  `#menu-rail` of 44×44 `.menu-item`s instead — smaller than I'd assumed, so
  the course badge can't fit a legible A/M/D letter (<8px). Resolved by
  dropping the letter on `.menu-item` specifically (color-dot only) and
  documented it as a real exception to "course color always paired with a
  letter" — flagged as an open question rather than silently accepted, since
  it's a genuine rule exception, not a formatting fix.
- **`ORDER_SIZE` is now 3/4/5 rows for 4/3/2 players** (not a fixed 3), no
  A/M/D coverage requirement — `#my-order`'s visual language must hold up to
  5 rows, not just 3.
- **`--order-need` badge confirmed compatible with `.order-chip`** — they
  answer different questions (hand card says "useful for my Order" vs. Order
  row says "which ingredient of this recipe am I missing") so they coexist
  without a hue check being needed against UI-owned colors (UI doesn't own
  any color per the coordination split, so that old open question was moot
  once actually checked).
- Fixed `public/art/Card` count from 26 to 27 (the correct count was already
  right at the top of the file — only this later section had the typo).
