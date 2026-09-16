---
name: feedback-ui-animation-numbers-guess
description: When a ui-spec asks for concrete animation durations/easing, invent reasonable numbers and mark them GUESS rather than leaving them vague
metadata:
  type: feedback
---

When a `/ui-spec` task explicitly asks to "specify durations/easing numbers
(mark as GUESS)", write down real numbers (e.g. "300ms cubic-bezier(.22,1,.36,1)")
rather than hand-waving ("a short animation"). This studio's convention
(established in mechanic docs, `.claude/rules/design-docs.md` Numbers section)
is every invented number gets tagged GUESS so `game-dev` can implement it
literally and a later playtest can retune it — that convention extends
naturally to UI timing even though `ui/*.md` files don't have a mandatory
Numbers table the way mechanic docs do.

**Why:** a vague spec forces `game-dev` to invent the number anyway, silently,
with no GUESS tag and no traceability for `/tuning` later. An explicit GUESS
number is cheap to write and easy to correct once played.

**How to apply:** for any ui-spec with juicy/animated interactions (card
flights, hover lifts, score pops, snap-backs), give each one an explicit
ms/deg/px value and label it GUESS inline, and reuse numbers already fixed in
mechanic docs (e.g. `COOK_MS`, `AI_STEP_MS`) instead of re-inventing new ones
for the same concept.
