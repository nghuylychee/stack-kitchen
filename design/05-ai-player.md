# 05 — AI Player (bot test)

**Status:** BUILT (2026-09-19, backlog #11 — Order priority + đọc đối thủ)
**Attaches to:** thay thế người chơi thật ở các ghế còn lại, để 1 người test được luật của `00-core.md`

## Overview

MVP chỉ có 1 người thật. Các ghế còn lại là bot chơi đúng luật như người, nhìn
thấy đúng những gì người thật thấy (tay mình, Order của chính mình, món đã
ngửa, đống bỏ, số thẻ pool, ai tố/pass) — không nhìn trộm tay người khác,
Order người khác, hay thứ tự pool. Bot không cần giỏi, chỉ cần **chơi có lý**
để người test cảm nhận được áp lực bị tố, bị đua xong Order trước, và bị đọc
bài/chặn (`07-menu-orders.md`).

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: người test đoán được "bot này đang gom món X trong Order" và thấy
  bot đôi khi giữ bài chờ món to — tức bot tạo ra đúng loại quyết định mà game
  muốn test.
- Intended: bot tránh đánh ra thẻ mà đối thủ có vẻ đang cần (Rule 9–10 → Rule
  4), và đôi khi tố 1 món nhỏ hoặc nấu lệch Order chỉ để chặn (Rule 11–12) —
  người test thấy bot "đọc" được mình, đúng dynamic "đoán và chặn" mà `07-`
  yêu cầu.
- Degenerate: bot quá đoán trước được (luôn reveal ngay) → người test khai thác
  bot thay vì test luật. Chặn bằng luật giữ bài (Rule 2) + nhiễu nhỏ khi đánh thẻ (Rule 5).
- Degenerate: **bot quá paranoid, không dám đánh gì.** Khi Menu nhỏ, gần như
  mọi loại đều có `danger(t) > 0` với ai đó, `FEED_WEIGHT` đẩy mọi `value(c)`
  lên cao. **Không kẹt**: Play vẫn bắt buộc mỗi lượt (`01-`/`03-` Rule 1),
  Rule 5 luôn chọn thẻ `value` thấp nhất trong số hiện có dù toàn bộ đều
  dương — chỉ đổi *thẻ nào* bị đánh, không đổi việc phải đánh. Theo dõi qua
  log nếu `FEED_WEIGHT` làm bot đánh quá "an toàn" một cách vô lý.
- Degenerate: **bot đọc người thật quá đúng → mất vui.** `interest`/`danger`
  chỉ tích luỹ dần từ sự kiện công khai đã thật sự xảy ra (đầu ván gần như
  toàn 0 — không có gì để "đoán" ngay lập tức, đúng nhịp suy luận của người
  chứ không phải đọc bài siêu nhiên); `NOISE` (Rule 5) vẫn áp dụng sau khi
  cộng `FEED_WEIGHT`; ngưỡng `DENY_DANGER_MIN`/`DENY_UNSEEN_MAX` (Rule 11–12)
  chỉ kích hoạt khi bằng chứng đã đủ dày — không đổi hành vi chỉ từ 1 sự kiện
  đơn lẻ.

**Aesthetics**

| | |
|---|---|
| **Primary** | challenge |
| **Secondary** | fellowship (giả lập đối thủ ngồi cùng bàn) |
| **Serves the core by** | cung cấp đối thủ để test "giữ hay chốt", tố, và giờ cả "đoán Order + chặn" (`07-`) mà không cần tụ 4 người thật — đọc đối thủ (Rule 8–12) làm bot cảm giác như 1 địch thủ biết suy luận, không chỉ biết luật |

## Rules

Định nghĩa: `unseen(t)` = `COPIES_PER_TYPE_MENU` − số thẻ loại `t` bot nhìn
thấy được (trên tay bot + discard + mọi món đã ngửa của mọi người) — theo
`07-menu-orders.md` Rule 2 (bộ bài giờ theo Menu, không còn cố định
`COPIES_PER_TYPE`). `missing(R)` = các loại trong công thức `R` mà tay bot
chưa có. `Order(bot)` = danh sách món riêng của bot (`07-` Rule 5).
`inOrder(R)` = đúng khi `R ∈ Order(bot)` và **chưa xong** (`07-` Rule 9).

1. **Draw:** luôn bốc (bắt buộc).
2. **Reveal (bước Check):** lặp — trong các món ráp được, ưu tiên theo thứ tự:
   **(a)** món có `inOrder(R)` đúng trước — nhiều món như vậy ráp được cùng
   lúc thì chọn điểm cao nhất trong nhóm; **(b)** hết món Order chưa xong ráp
   được thì mới xét món ngoài Order, chọn điểm cao nhất trong nhóm đó. Reveal
   món đã chọn **trừ khi** giữ bài: giữ khi tồn tại món `G` **cùng nhóm ưu
   tiên** (a hoặc b) với điểm cao hơn, công thức `G` chứa trọn công thức món
   đó, `missing(G)` đúng 1 loại `t` và `unseen(t) ≥ HOLD_MIN_UNSEEN`.
   Ngoại lệ: nếu reveal món đó làm bot **xong toàn bộ Order** (`07-` Rule 9)
   → **luôn reveal**, bất kể đang giữ bài — ưu tiên cao nhất, không luật nào
   ở dưới ghi đè được (kể cả Rule 12).
   Hết món để reveal (hoặc đang giữ mọi món còn lại) → sang Play.
3. **Claim:** khi được hỏi tố, trong các món tố được, áp đúng thứ tự ưu tiên
   và quyết giữ-hay-reveal của Rule 2 (nhóm (a) Order chưa xong trước, rồi
   nhóm (b)): nếu Rule 2 sẽ reveal món đó → tố món đó; nếu Rule 2 sẽ giữ →
   Pass, **trừ khi** Rule 11 (chặn chủ động) đổi Pass này thành Cook.
4. **Play — chấm điểm từng thẻ `c` trên tay:**
   `value(c) = max` trên mọi công thức `R` có loại của `c` và mọi loại trong `missing(R)` có `unseen ≥ 1`, của
   `(số loại của R đã có trên tay / số loại của R) × điểm(R) × (inOrder(R) ? ORDER_WEIGHT : 1)`.
   Không công thức nào hợp lệ → `value = 0`. Thẻ trùng loại (bản thứ 2+ trên tay) nhân `DUPLICATE_FACTOR`.
   Cộng thêm `FEED_WEIGHT × danger(loại của c)` (Rule 10) vào `value(c)` sau
   bước trên — thẻ nuôi đối thủ nhiều khó bị chọn để đánh ra hơn (Rule 5
   không đổi, vẫn đánh `value` thấp nhất).
5. Đánh thẻ có `value` thấp nhất, cộng nhiễu ngẫu nhiên `±NOISE` vào mỗi `value` trước khi so. Hoà → ngẫu nhiên.
6. **Nhịp:** mỗi hành động bot (draw, reveal, play, tố) cách nhau `AI_STEP_MS` cố định để người test theo
   kịp. Không còn nút chỉnh tốc độ Slow/Fast. (sửa 2026-09-16 (2))
7. **Log:** mọi quyết định của bot (draw, reveal/giữ, play, tố/pass) ghi vào log hành động kèm lý do ngắn
   (ví dụ `Bot 2 holds Pho Bo → waiting Lemongrass (3 unseen)`). Không còn nút lật tay bot ("Show AI
   hands") — log là cách duy nhất để người test kiểm tra quyết định của bot. (sửa 2026-09-16 (2)) Quyết
   định do Rule 11–12 (đọc đối thủ) kích hoạt (đổi Pass → Cook để chặn, hoặc reveal sớm để vét hiếm) cũng
   ghi log kèm lý do (ví dụ `Bot 2 claims Xoi Gac to deny — danger(Sticky Rice)=4`).

### Đọc đối thủ (opponent reading) — thêm cho `07-menu-orders.md`

Input duy nhất cho phần này: **lịch sử sự kiện công khai**, đúng giới hạn ở
Overview — Menu, tay của chính bot, đống bỏ theo từng ghế, món đã ngửa của
mọi người (kèm ai reveal), ai tố/pass ở mỗi cửa sổ tố, số thẻ trên tay mỗi
ghế. **Không bao giờ**: tay người khác, Order người khác, thứ tự pool — kể cả
khi các giá trị đó nằm sẵn trong bộ nhớ của host. Bot đọc thẳng state nội bộ
(ví dụ `match.orders[seat]`) thay vì suy luận từ lịch sử sự kiện công khai là
lỗi lộ thông tin, ngang hàng lỗi redact sai ở `06-online-room.md`.

8. Với mỗi đối thủ `o` (khác bot đang quyết) và mỗi món `D` trong Menu, tính
   điểm nghi vấn `interest(o, D) ≥ 0`, cộng dồn cả ván từ 4 nguồn sự kiện công
   khai liên quan tới `o`, mỗi sự kiện chỉ tính cho món `D` nào **dùng loại
   nguyên liệu** của sự kiện đó, chặn dưới ở 0 sau mỗi lần cộng:
   - `o` đã tự reveal hoặc thắng tố món `D` ít nhất 1 lần → `+COOK_W`.
   - `o` thắng tố 1 món khác `D'` dùng chung ≥ 1 loại với `D` → `+SHARE_W`
     mỗi loại dùng chung.
   - `o` đủ điều kiện tố nhưng Pass ở 1 cửa sổ tố mà thẻ vừa đánh thuộc 1 loại
     nằm trong `D` → `+PASS_W` (đủ điều kiện tố nghĩa là `o` đang thiếu đúng
     1 loại của **1 món nào đó** — không chắc là `D`, nên trọng số nhỏ hơn `COOK_W`).
   - `o` tự đánh (Play) ra 1 thẻ thuộc loại nằm trong `D` → `−DISCARD_W`
     (không muốn giữ loại đó lúc đó là bằng chứng yếu họ không cần `D` ngay).
9. **Danger mỗi loại nguyên liệu:** `danger(t)` = tổng `interest(o, D)` trên
   mọi đối thủ `o` và mọi món `D` trong Menu có dùng loại `t`, miễn `D` chưa
   bị chặn chết (còn ≥ 1 loại cần thiết của `D` có `unseen ≥ 1`).
10. `danger(t)` dùng ở Rule 4 (chấm điểm thẻ để đánh) — xem công thức ở đó.
11. **Chặn chủ động qua tố khi rẻ — sửa hành vi Rule 3:** khi tố, nếu theo
    Rule 2/3 gốc bot sẽ Pass (món tố được không đáng giữ bài chờ món to hơn),
    bot **đổi thành Cook (tố)** khi cả 2 đúng:
    - `danger(t) ≥ DENY_DANGER_MIN`, với `t` là loại thẻ vừa đánh, **và**
    - món tố được thuộc nhóm điểm thấp nhất (`POINTS_BY_SIZE[2]`, `04-`)
      **hoặc** `inOrder` đúng cho món đó với bot (không tốn cơ hội giữ bài
      lớn của chính mình).
    Nói cách khác: chỉ tố-để-chặn khi gần như miễn phí với chính bot.
12. **Vét thẻ hiếm ngoài Order — sửa hành vi Rule 2:** ở bước Check, nếu tồn
    tại món `D` ráp được với `inOrder(D)` sai (ngoài Order của bot), và tồn
    tại ≥ 1 loại `t` trong công thức `D` với `danger(t) ≥ DENY_DANGER_MIN` và
    `unseen(t) ≤ DENY_UNSEEN_MAX`, bot reveal `D` ngay dù Rule 2 gốc lẽ ra giữ
    bài — ưu tiên vét nốt bản hiếm hơn chờ món to của chính mình. Ngoại lệ
    "xong toàn bộ Order → luôn reveal" ở Rule 2 vẫn đứng trên luật này.

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `HOLD_MIN_UNSEEN` | 2 | 1–4 | GUESS | còn ≥ 2 bản chưa lộ mới đáng chờ |
| `ORDER_WEIGHT` | 2 | 1–3 | GUESS | thay `COURSE_WEIGHT` (số cũ, không đổi) — ưu tiên món trong Order chưa xong thay vì loại còn thiếu |
| `DUPLICATE_FACTOR` | 0.4 | 0–1 | GUESS | công thức chỉ cần 1 bản mỗi loại |
| `NOISE` | 0.3 | 0–1 | GUESS | tránh bot quá đoán trước |
| `AI_STEP_MS` | 900 ms | — (giá trị cố định) | GUESS | người test chơi ở mức mặc định 900ms (trước là Slow); bỏ nút Fast (sửa 2026-09-16 (2)) |
| `COOK_W` | 3 | 2–5 | GUESS | bằng chứng chắc nhất — đối thủ đã thật sự reveal/thắng tố món đó |
| `SHARE_W` | 1 | 0.5–2 | GUESS | bằng chứng gián tiếp qua loại dùng chung, yếu hơn `COOK_W` |
| `PASS_W` | 2 | 1–3 | GUESS | Pass khi đủ điều kiện xác nhận có món gần xong, nhưng không rõ đúng món nào trong Menu |
| `DISCARD_W` | 1 | 0.5–2 | GUESS | bằng chứng yếu là KHÔNG cần loại đó lúc đánh ra — trừ nhẹ, không phủ nhận hoàn toàn |
| `FEED_WEIGHT` | 0.5 | 0.2–1 | GUESS | giữ vai trò gợi ý mềm khi chọn thẻ đánh, không lấn át điểm công thức của chính bot |
| `DENY_DANGER_MIN` | 3 | 2–5 | GUESS | ngưỡng để chặn chủ động (Rule 11–12) — ~1 sự kiện `COOK_W`, tránh chặn dựa trên nghi ngờ mong manh |
| `DENY_UNSEEN_MAX` | 2 | 1–3 | GUESS | "còn ít bản" đáng vét nốt — dùng chung ngưỡng với `HOLD_MIN_UNSEEN` |

## Edge cases

- Bot giữ bài chờ `t` nhưng `t` bị lộ hết ở lượt sau → `unseen` = 0 → lượt sau Rule 2 cho reveal món nhỏ.
- Bot tay rỗng sau reveal → không Play (`02-` Rule 8).
- Người thật và bot cùng tố → quyết của bot không phụ thuộc người thật đã chọn gì (bot không thấy).
- Menu quá nhỏ khiến mọi loại còn lại đều có `danger(t) > 0` với ai đó → bot
  vẫn phải đánh 1 thẻ mỗi lượt (Play bắt buộc), chỉ chọn thẻ `value` thấp nhất
  trong số hiện có — không có luật "được phép không đánh" (xem Dynamics).
- Bot mới vào ván (chưa có sự kiện công khai nào của đối thủ) → mọi
  `interest(o, D)` = 0, `danger(t)` = 0 với mọi `t` — Rule 4/11/12 không đổi
  hành vi gì so với bản trước `07-` cho tới khi có bằng chứng thật.

## Depends on

- `01-`, `02-`, `03-`, `04-` — bot chỉ gọi đúng những hành động người thật có.
- `07-menu-orders.md` — Order riêng của bot (Rule 5–6), điều kiện "đã xong" (Rule 9), Menu (Rule 1).

## Done when

- Chọn 2/3/4 người → 1 người thật + 1/2/3 bot, ván tự chạy tới lượt người thật thì dừng chờ.
- Mỗi bot có Order riêng; bot ưu tiên reveal/tố món trong Order của chính nó
  trước, log ghi rõ khi đó (ví dụ `Bot 2 reveals Pho Bo — in Order`).
- Bot né đánh thẻ nguy hiểm cho đối thủ khi có lựa chọn khác, và thỉnh thoảng
  tố/nấu ngoài Order để chặn — quan sát được qua log kèm lý do (Play vs Bots
  hoặc 2 tab online).
- Log hành động hiện đủ mọi quyết định của bot (draw, reveal/giữ, play, tố/pass) kèm lý do — không cần
  lật tay bot để đối chiếu. (sửa 2026-09-16 (2))
- Một ván toàn bộ chạy tới màn kết thúc không kẹt.
