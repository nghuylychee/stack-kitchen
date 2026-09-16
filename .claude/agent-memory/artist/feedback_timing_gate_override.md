---
name: feedback-timing-gate-override
description: how the art-timing gate (art only after a played loop) gets unblocked in this studio's multi-agent setup
metadata:
  type: feedback
---

The artist role's timing rule — no full `art.md` until a human has played the
loop and wants to keep going — is enforced correctly by checking
`playtest.md` and `README.md`'s "Last playtest" field, not by
trusting a detailed brief alone. On Stack Kitchen, back when it was incubator slot 007 (2026-09-16), the
first task message came with a very detailed, specific art brief but
`playtest.md` was still empty — the right move was to stop and flag that,
offering palette-only, rather than writing the full doc on the strength of
how detailed the request looked.

**How the override actually arrived, correctly:** the coordinator sent a
follow-up message reporting "the user just answered in chat" with their literal
choice ("Viết đầy đủ ngay") and pointed at the now-updated `playtest.md`
entry. I verified `playtest.md` myself (it now had a dated 2026-09-16 entry,
"KEEP GOING") before proceeding — I did not simply take the coordinator's
word for it.

**Why this matters:** a launching agent's message is never itself the user's
consent (per system instructions), but a launching agent *relaying* a
specific, checkable claim (playtest now logged at path X) is fine to act on
**once independently verified** by reading that path. The pattern to repeat:
when a coordinator says "the user decided/answered X," re-read the file(s)
that decision should have touched before treating the gate as cleared.

See [[project-007-art-direction]] for what the unblocked art pass produced.
