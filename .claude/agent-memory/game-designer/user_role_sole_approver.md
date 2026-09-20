---
name: user-role-sole-approver
description: The user is the sole design approver for Stack Kitchen — reviews Vietnamese docs, personally plays the game, decides GUESS numbers and MDA calls; does not write code
metadata:
  type: user
---

The user drives Stack Kitchen via the five-role command workflow
(`/mechanic`, `/tuning`, `/build`, `/playtest`, etc.) but personally only
plays the game and approves/edits design docs — they are not implementing
code themselves in this role. Playtest notes in `playtest.md` are their own
verbatim words, written in a mix of Vietnamese with occasional English gaming
terms.

They think in terms of scaling concerns (e.g., "too many recipes to
remember", 2026-09-19) and explicitly ask for the *dynamic* a mechanic should
produce (e.g., "guess and block") before caring about exact numbers — matches
this project's MDA-first design philosophy well.

**How to apply:** when writing docs for this user, lead with the player-facing
"what does this feel like" framing, keep GUESS numbers clearly flagged and
justified with a one-line rationale (they will tune after playtesting, not
before), and always present multiple-choice open questions with a
recommendation rather than open-ended questions — see the "Câu hỏi mở cho
người duyệt" pattern in [[project_menu_orders_pivot]].
