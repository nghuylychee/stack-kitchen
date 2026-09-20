---
name: feedback-extend-built-ui-spec-separately
description: When a mechanic doc changes a BUILT ui/<screen>.md, write a new companion ui doc, don't edit the BUILT file — list zone-by-zone impact for approval instead.
metadata:
  type: feedback
---

When a new mechanic (e.g. `design/07-menu-orders.md`) changes what an
already-`BUILT` `design/ui/<screen>.md` shows, do not edit that BUILT file
directly. Write a new file (e.g. `design/ui/menu-orders.md`, `Status: DRAFT`)
that specs the new/changed elements fully, and add a section
"Ảnh hưởng tới ui/<screen>.md" listing, zone id by zone id, exactly what
changes (removed, added, resized, repurposed) — so the human can approve the
whole set of edits to the BUILT file before anyone touches it or `/build`s it.

**Why:** matches the repo's own rule for mechanic docs (`.claude/rules/design-docs.md`
— a cut/changed mechanic keeps its file, status changes, doc isn't silently
rewritten) applied to ui specs: a BUILT ui doc is something the human already
reviewed and trusts; silently editing it removes their chance to see the diff
as a set before code changes. This was the explicit instruction for the
07-menu-orders companion doc (2026-09-19) and reads as a durable pattern for
this repo, not a one-off.

**How to apply:** any time a mechanic doc says "this changes how the table/
home/lobby screen looks or behaves" and the target ui doc's `Status` is
`BUILT`, reach for a new companion file + impact section first. Only fold
the change directly into the BUILT file once the human has approved it (at
which point it's a normal ui-spec edit/tuning pass, and the companion file's
content gets merged in and can be retired).
