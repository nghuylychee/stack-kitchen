---
name: project-menu-orders-pivot
description: Menu/Order pivot (07-menu-orders.md) is decided and applied to 00/01/04/05/06 as of 2026-09-19 — read before touching Menu/Order, Order-priority bot rules, or opponent-reading rules
metadata:
  type: project
---

On 2026-09-19 the user playtested the graduated MVP (20 recipes, 27 ingredient
types) and found too many recipes to remember to scale the game further. Quote
from `playtest.md` 2026-09-19: "tối đa trong mỗi game sẽ chỉ nên có tầm N món
trong pool... Mục tiêu chơi sẽ kiểu hoàn thành hết tất cả list các món được
chỉ định... tạo thêm dynamic đoán món đối thủ tính làm để mà ngăn chặn."

This produced `design/07-menu-orders.md`, now **Status: AGREED** — the user
answered all open questions the same day and the decisions were applied
directly to docs (no further approval round pending on this pivot):

- **Menu** — `MENU_SIZE` scales with player count: 6/8/10 for 2/3/4 players
  (GUESS). Pool is rebuilt from only the ingredient types those dishes need
  (replaced `01-` Rule 1's fixed 27-type pool). No per-course minimum anymore
  (`MENU_MIN_PER_COURSE` dropped — nothing mechanical reads dish "course"
  anymore once Order replaced the 3-course win condition). No filler/noise
  ingredients.
- **Order** — `ORDER_SIZE` scales with player count too: 3/4/5 for 2/3/4
  players (GUESS, ~half the Menu each time — 3/6, 4/8, 5/10 — chosen to stay
  inside the 3–5 order-row cap the UI is designed for). Pure random draw from
  Menu, no course requirement. Orders MAY overlap between players by design
  (that's the intended blocking dynamic). Win condition = "finish your own
  Order first" (+`ORDER_BONUS`, same value as the old `FIRST_FULL_BONUS`,
  10), replacing `04-`'s old "collect all 3 courses" end condition entirely.
  Cooking a Menu dish NOT on your own Order is explicitly allowed — scores
  points, doesn't count toward Order, is the mechanism for denying/blocking
  opponents. An Order that becomes mathematically impossible mid-game (last
  copies of a needed ingredient type gone) is **silent** — no UI warning, by
  design, to avoid leaking information.
- **Bot opponent-reading** — required from v1, not deferred. Lives in
  `05-ai-player.md` Rule 8–12 (not a new file — this is the AI-player
  mechanic). Model: per opponent, per Menu dish, accumulate an `interest`
  score from public evidence only (claim-wins/self-reveals = `+COOK_W`,
  shared-ingredient claims = `+SHARE_W`, eligible-but-passed = `+PASS_W`,
  opponent's own discards = `-DISCARD_W`); sum into a per-ingredient
  `danger(t)`; feed that into the bot's discard-value formula
  (`FEED_WEIGHT`) and into two new deny behaviors — claim-to-deny when cheap
  (Rule 11) and cook-off-Order-to-drain-scarce-ingredient (Rule 12). Hard
  constraint restated explicitly in the doc: bot inputs are the public event
  history only (Menu, discards, claims, passes, revealed dishes, hand
  counts) — never other hands, other Orders, or pool order, even though the
  host process has that data in memory. Reading it directly is specced as
  equivalent to a `06-` redaction bug.

**Docs touched and their new Status** (all dropped `BUILT`→`AGREED` or
`DRAFT`→`AGREED` since code hasn't caught up to the doc yet):
`00-core.md` (core loop/win-lose rewritten for Menu/Order), `01-card-pool-deal.md`
(Rule 1 replaced by Menu-sourced pool), `04-food-score-end.md` (Rule 2–3
replaced by Order-based end condition, `FIRST_FULL_BONUS` retired in place —
row kept in the Numbers table marked unused, not deleted, so the number isn't
silently reused), `05-ai-player.md` (Order-priority in reveal/claim, `ORDER_WEIGHT`
replaces `COURSE_WEIGHT`, new opponent-reading rules), `06-online-room.md`
(new Rule 26–27: `View` includes only the seat's own Order in-game, all seats'
Orders revealed at end-of-game payload).

**How to apply:** this pivot is done at the design-doc layer. No backlog
ticket has been filed yet for the underlying code changes — see
[[feedback_doc_first_multi_role]] for why (the user wants Art + UI docs lined
up too before tickets go up). Do not re-open the settled numbers/behaviors
above without a new playtest note or explicit user request — they were
already decided, not left as open recommendations.
