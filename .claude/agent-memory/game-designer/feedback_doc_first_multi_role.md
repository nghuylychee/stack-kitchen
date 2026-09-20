---
name: feedback-doc-first-multi-role
description: For a mechanic pivot touching gameplay + visuals + UI, the user wants each role's doc drafted and shown for approval before any backlog ticket is filed
metadata:
  type: feedback
---

When a playtest note triggers a gameplay pivot that also touches how things
look/feel (not just rules), the user explicitly asks each affected role
(game-designer, artist, ui-designer) to write their doc first, then approve
all of them together before tickets go up.

Quote (playtest.md 2026-09-19, re: the Menu/Order pivot): "Tôi nghĩ với những
thay đổi này cần cả GD, Art, UI làm doc trước để tôi duyệt sau đó lên ticket
đó."

**Why:** the user reviews design intent in one pass across roles rather than
reacting to tickets piecemeal — avoids building code/tickets against a design
that visual or UX review might still change.

**How to apply:** on a cross-cutting pivot (new mechanic that changes what the
player sees/touches, not just internal rules), write the design doc but do
NOT add a backlog ticket yet, even though the `/mechanic` skill's default
final step is "add a ticket." Say explicitly that ticket-filing is being held
for the user's combined approval across roles. Only proceed to
`backlog.md` once the user says to. This overrides the skill's default only
when the user's request frames it as a multi-role doc-approval pass (as in
[[project_menu_orders_pivot]]) — for an ordinary single-role `/mechanic` ask,
file the ticket as usual.
