# 07 — Menu & Orders (menu ván + Order riêng từng người)

**Status:** BUILT (2026-09-19, backlog #9–#11)
**Attaches to:** thay đổi nguồn thẻ của `01-card-pool-deal.md` và điều kiện thắng/kết
thúc của `00-core.md` + `04-food-score-end.md`. Bốc/reveal/đánh/tố (`02-`, `03-`)
không đổi luật, chỉ đổi **tập công thức khả dụng** trong ván.

> Từ playtest 2026-09-19: *"tôi thấy có vấn đề trong 1 game có quá nhiều công
> thức mà người chơi phải nhớ dẫn đến việc chúng ta rất khó scale sau này...
> tối đa trong mỗi game sẽ chỉ nên có tầm N món trong pool. List các món sẽ
> được gen khi bắt đầu game và thông báo với tất cả người chơi... Mục tiêu
> chơi sẽ kiểu hoàn thành hết tất cả list các món được chỉ định... tạo thêm
> dynamic đoán món đối thủ tính làm để mà ngăn chặn."*

## Overview

Đầu ván, bàn công bố công khai một **Menu** — N món rút từ 20 món gốc. Bộ bài
(pool) chỉ chứa nguyên liệu phục vụ các món trong Menu đó, không phải toàn bộ
27 loại như trước. Mỗi người chơi còn được giao riêng 1 **Order** — vài món
trong Menu mà chỉ mình họ biết. Bạn thắng bằng cách nấu xong hết Order của
mình trước người khác — nhưng bạn vẫn được phép nấu bất kỳ món nào khác trong
Menu để ăn điểm, hoặc để vét nguyên liệu hiếm mà bạn đoán người khác đang cần,
chặn đường họ.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: đoán Order đối thủ qua thẻ họ giữ/đánh ra và món họ đã reveal —
  nấu 1 món "lạ" so với hướng trước đó là tín hiệu mạnh (đang chặn ai, hoặc
  chỉ ăn điểm phụ). Đây chính là "dynamic đoán món đối thủ" mà playtest yêu cầu.
- Intended: chặn chủ động — nấu trước 1 món ngoài Order của mình để vét hết
  bản nguyên liệu hiếm còn lại của 1 loại, khiến Order người khác trở nên khó
  hoặc không thể hoàn thành.
- Intended: vì Order của 2 người có thể trùng món (Rule 6), xuất hiện tình
  huống "ai chốt trước" ở cấp độ cả ván, cộng hưởng với việc tố từng thẻ (`03-`).
- Degenerate: pool giờ chỉ chứa nguyên liệu phục vụ Menu (không có thẻ rác) →
  đọc thẻ đánh ra dễ đoán ý đồ hơn hẳn bản 27 loại cũ. **Chấp nhận cho MVP,
  theo dõi**; giảm nhẹ nhờ Rule 8 (nấu ngoài Order hợp lệ nên hành động không
  còn chỉ 1 cách hiểu) và Rule 6 (Order trùng nhau nên không rõ đang chặn ai).
- Degenerate: Order của 1 người bị chặn chết hoàn toàn giữa ván (mọi bản của 1
  loại cần thiết đã bị người khác tiêu hết) → người đó hết mục tiêu thắng
  chính, chỉ còn chơi vì điểm. **Chấp nhận** — đây là chặn thành công, không
  phải lỗi; khớp với `00-core.md` Win/lose vốn đã cho thắng bằng tổng điểm dù
  không về đích đầu.
- Degenerate: ôm bài chờ đủ Order rồi mới đánh — không đổi so với `01-` Rule 20
  (ôm thẻ nghẽn), vẫn accept vì mỗi lượt bắt buộc đánh 1 thẻ.

**Aesthetics**

| | |
|---|---|
| **Primary** | challenge |
| **Secondary** | discovery |
| **Serves the core by** | thêm 1 tầng mục tiêu ẩn (Order) lên trên "giữ hay chốt" gốc — đọc bài đối thủ giờ có ý nghĩa thắng-thua trực tiếp (đoán và chặn), không chỉ để né tố |

## Rules

### Menu — sinh đầu ván, công khai

1. Trước khi chia bài: chọn ngẫu nhiên `MENU_SIZE` món trong 20 món gốc
   (`04-food-score-end.md`), **không ràng buộc theo loại** (Appetizer/Main/
   Dessert). Danh sách này (tên món + công thức + điểm) là **Menu** — hiện
   công khai cho mọi ghế (kể cả bot) ngay từ đầu ván, trước lượt đi đầu tiên.

   > **Quyết định:** bỏ ràng buộc tối thiểu mỗi loại (`MENU_MIN_PER_COURSE` ở
   > bản DRAFT trước). Lý do: điều kiện thắng cũ ("đủ 3 loại") đã bị Order
   > thay thế hoàn toàn (Rule 10); Order cũng chọn thuần ngẫu nhiên, không cần
   > phủ đủ 3 loại (Rule 5). Không còn luật nào đọc "loại" của món để quyết
   > định thắng/thua hay tính điểm (`04-` Rule 1 tính điểm theo số thẻ, không
   > theo loại) — ép tỉ lệ A/M/D vào Menu chỉ còn phục vụ thẩm mỹ, không phục
   > vụ luật, nên bỏ để sinh Menu đơn giản hơn. Cột "Loại" trong bảng 20 món
   > (`04-`) vẫn giữ làm nhãn hiển thị, không còn là ràng buộc sinh Menu/Order.
2. Pool thay nguồn: thay vì 27 loại × `COPIES_PER_TYPE` (`01-` Rule 1), pool
   chỉ gồm các loại nguyên liệu **có xuất hiện trong công thức của Menu**, mỗi
   loại `COPIES_PER_TYPE_MENU` bản. Số loại nguyên liệu trong pool đổi theo
   Menu sinh ra mỗi ván — không còn cố định.
3. Không có nguyên liệu "filler"/rác — mọi thẻ trong pool phục vụ ít nhất 1
   món trong Menu.
4. Chia bài (`01-` Rule 2–4), bốc/reveal (`02-`), đánh/tố (`03-`) giữ nguyên
   luật; chỉ công thức khả dụng để ráp/tố thu hẹp từ 20 món xuống Menu.

### Order — giao riêng từng người, bí mật

5. Sau khi sinh Menu, mỗi người chơi (kể cả bot) được gán 1 **Order**:
   `ORDER_SIZE` món **khác nhau trong Order của chính họ** (số lượng theo số
   người chơi — xem Numbers), chọn ngẫu nhiên từ Menu, **không ràng buộc theo
   loại** — cùng lý do ở Rule 1.
6. Order của từng người được chọn **độc lập** — trùng món giữa 2+ người là
   hợp lệ và có chủ đích (tạo tranh giành trực tiếp cùng 1 công thức).
7. `MENU_SIZE ≥ ORDER_SIZE` luôn đúng ở mọi số người (6≥3, 8≥4, 10≥5) nhờ
   Rule 1 và bảng Numbers (Menu đủ món để gán Order).
8. Người chơi **được phép** nấu (Cook + reveal, `02-` Rule 4/12) bất kỳ món
   nào trong Menu, kể cả món **không** nằm trong Order của mình. Món ngoài
   Order vẫn cộng điểm theo `POINTS_BY_SIZE` (`04-`) như bình thường nhưng
   **không** tính vào tiến độ hoàn thành Order. Đây là cơ chế "chặn": dùng
   nguyên liệu hiếm để nấu trước 1 món mình đoán đối thủ đang cần.

### Hoàn thành Order & kết thúc ván — thay thế `04-` Rule 2–3

9. 1 món `D` trong Order được coi là "đã xong" khi người chơi đó đã **reveal**
   `D` ít nhất 1 lần trong ván — qua tự reveal (`02-` Rule 4) hoặc thắng tố
   (`03-` Rule 5). Reveal thêm lần nữa vẫn cộng điểm nhưng không đổi trạng thái.
10. **Kết thúc A' (thay `04-` Rule 2–3):** ngay sau 1 lần reveal, nếu người đó
    đã "xong" toàn bộ `ORDER_SIZE` món trong Order → +`ORDER_BONUS`, ván dừng
    ngay lập tức. Chỉ đúng 1 người nhận thưởng.
11. **Kết thúc B (không đổi, `04-` Rule 4):** tới lượt Draw mà pool rỗng và
    chưa ai xong Order → ván dừng, không ai nhận `ORDER_BONUS`.
12. Xếp hạng cuối ván: theo tổng điểm (mọi món đã reveal, kể cả món ngoài
    Order, + `ORDER_BONUS` nếu có) — `04-` Rule 5 không đổi. Người xong Order
    trước chưa chắc thắng nếu tổng điểm thấp hơn người khác.
13. Màn kết thúc (`04-` Rule 6) hiện thêm: **Order đầy đủ của từng người**,
    đánh dấu món nào đã xong / chưa xong.

### Hidden info — ai thấy gì

14. **Menu**: công khai với mọi người chơi ngay từ đầu ván, ở cả 2 chế độ.
15. **Order của chính mình**: chỉ người đó thấy. **Order của người khác**: tên
    món ẩn tới khi ván kết thúc (Rule 13). Riêng **số món đã xong / tổng** của
    mọi ghế là công khai suốt ván, hiện dạng chấm — `09-order-progress-signal.md`
    (sửa 2026-09-19).
16. **Play vs Bots**: mỗi bot được gán Order riêng theo Rule 5–6; bot chỉ dùng
    Order của chính nó khi quyết định, không nhìn Order người khác/người thật
    — cùng nguyên tắc "không nhìn trộm" của `05-ai-player.md` Overview.
17. **Online room**: `View` gửi cho mỗi ghế chỉ chứa Order của **ghế đó**;
    Order của ghế khác không nằm trong payload mạng cho tới sự kiện kết thúc
    ván (Rule 13) — lúc đó host gửi Order đầy đủ mọi ghế kèm màn kết thúc.
    Cùng nguyên tắc redaction của `06-online-room.md` Rules 26–27.

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `MENU_SIZE` (2 người) | 6 | 4–8 | GUESS | đủ đa dạng, không quá tải trí nhớ cho ván 2 người |
| `MENU_SIZE` (3 người) | 8 | 6–10 | GUESS | thêm 1 người thì cần thêm dư địa để Order khác biệt/trùng có ý nghĩa |
| `MENU_SIZE` (4 người) | 10 | 8–12 | GUESS | tối đa nhớ được, vẫn dưới nửa 20 món gốc |
| `ORDER_SIZE` (2 người) | 3 | 2–4 | GUESS | ~nửa Menu (3/6); trong trần 3–5 dòng mà UI đang thiết kế cho Order |
| `ORDER_SIZE` (3 người) | 4 | 3–5 | GUESS | ~nửa Menu (4/8); vẫn trong trần 3–5 dòng Order |
| `ORDER_SIZE` (4 người) | 5 | 4–6 | GUESS | ~nửa Menu (5/10); chạm đúng trần 5 dòng Order mà UI thiết kế |
| `COPIES_PER_TYPE_MENU` | 6 | 4–8 | GUESS | pool giờ ít loại thẻ hơn (theo Menu, không phải 27) → tăng bản mỗi loại để giữ độ dài ván tương đương bản cũ (xem "Theo dõi khi build") |
| `ORDER_BONUS` | 10 | 5–20 | GUESS | giữ đúng độ lớn `FIRST_FULL_BONUS` cũ mà người dùng đã duyệt ("lượng điểm lớn", không tự thắng) |
| `HAND_START` | 11 (không đổi, `01-`) | 7–13 | GUESS | giữ nguyên; xem "Theo dõi khi build" |

## Edge cases

- Menu lệch hẳn về 1 loại (ví dụ toàn Main) hoặc thiếu hẳn 1 loại (ví dụ
  không có Dessert nào) do random thuần — **chấp nhận**, vì loại giờ chỉ là
  nhãn hiển thị, không ảnh hưởng luật thắng/điểm (Rule 1).
- Order của 1 người có món mà toàn bộ `COPIES_PER_TYPE_MENU` bản của 1 loại
  cần thiết đã bị người khác dùng hết → Order người đó bất khả thi. **Quyết
  định: giữ im lặng** — không báo "Order bất khả thi" lên UI, người chơi tự
  nhận ra qua đếm bài công khai (đống bỏ + món đã ngửa). Người chơi tiếp tục
  chơi để ăn điểm ở Menu (Rule 8), không phải để hoàn thành Order nữa. Không
  có luật "reset" Order ở MVP này.
- 2 người cùng có 1 món trong Order (Rule 6), cả 2 cùng cố ráp → ai reveal/tố
  trước lấy được cơ hội, người sau vẫn ráp lại được nếu còn đủ bản (mỗi công
  thức chỉ tiêu 1 bản/loại, không hết ngay cả 4–6 bản).
- Order và Menu không đổi giữa ván (kể cả sau "Play again" ở `06-` Rule 24 —
  ván mới sinh Menu/Order mới, không giữ lại ván trước).

## Áp dụng vào doc khác (2026-09-19)

Các thay đổi dưới đây đã được áp dụng trực tiếp vào từng file (không chỉ liệt
kê chờ duyệt nữa) — đọc file tương ứng để có luật đầy đủ; đây chỉ là tóm tắt
tra cứu nhanh. Mỗi doc `BUILT` bị sửa rơi về `AGREED` (code chưa khớp doc).

- **`01-card-pool-deal.md`** (BUILT → AGREED) — Rule 1 (27 loại × `COPIES_PER_TYPE`)
  thay bởi Rule 2 của doc này (pool theo Menu × `COPIES_PER_TYPE_MENU`). Bảng
  Numbers "Pool sau chia" đánh dấu không còn tính trước được 1 số cố định.
- **`04-food-score-end.md`** (BUILT → AGREED) — Rule 2–3 (đủ 3 loại →
  `+FIRST_FULL_BONUS`, dừng ván) thay bởi Rule 10 của doc này (Kết thúc A').
  `FIRST_FULL_BONUS` ngừng dùng (giữ trong bảng, đánh dấu không dùng, số
  không tái sử dụng cho hằng số khác). Rule 6 (màn kết thúc) bổ sung Order
  đầy đủ từng người (Rule 13).
- **`00-core.md`** (DRAFT → AGREED) — Core loop và Win/lose viết lại theo
  Menu/Order thay vì "đủ 3 loại"; Controls không đổi.
- **`05-ai-player.md`** (BUILT → AGREED) — Rule 2 (Reveal) và Rule 3 (Claim)
  đổi ưu tiên chính sang **món nằm trong Order của chính bot** (thay vì
  `needCourse`); Rule 4 đổi `COURSE_WEIGHT` → `ORDER_WEIGHT`. Bot được gán
  Order riêng đầu ván (Rule 5–6, 16 doc này). Thêm **đọc đối thủ** (suy luận
  Order đối thủ từ tố/nấu/đánh thẻ/pass công khai) để tránh nuôi bài và chặn
  rẻ khi đáng — rules mới trong `05-` (mục "Đọc đối thủ").
- **`06-online-room.md`** (BUILT → AGREED) — thêm Rule 26–27: `View` mỗi ghế
  chỉ chứa Order của ghế đó trong ván; payload màn kết thúc ván gửi kèm Order
  đầy đủ mọi ghế.
- **`src/core/data.ts`** — cần thêm `MENU_SIZE`/`ORDER_SIZE` (theo số người),
  `COPIES_PER_TYPE_MENU`, `ORDER_BONUS`, `ORDER_WEIGHT` (thay `COURSE_WEIGHT`)
  và các trọng số đọc đối thủ (`COOK_W`, `SHARE_W`, `PASS_W`, `DISCARD_W`,
  `FEED_WEIGHT`, `DENY_DANGER_MIN`, `DENY_UNSEEN_MAX`) khi `/build` — không
  thêm ở đây (doc trước, code sau).

## Depends on

- `00-core.md`, `01-`, `02-`, `03-`, `04-` — toàn bộ luật bài giữ nguyên, chỉ
  đổi nguồn công thức/thẻ và điều kiện thắng.
- `05-ai-player.md` — bot cần Order riêng + ưu tiên theo Order + đọc đối thủ.
- `06-online-room.md` — redaction Order theo ghế, payload kết thúc ván.

## Done when

- Đầu ván, Menu `MENU_SIZE` món hiện công khai cho mọi ghế (kể cả bot) trước
  lượt đi đầu tiên.
- Pool chỉ chứa nguyên liệu phục vụ Menu; đếm đúng theo `COPIES_PER_TYPE_MENU`.
- Mỗi người có Order riêng chỉ hiện ở ghế của mình; ghế khác không thấy được
  (kiểm bằng 2 tab online).
- Nấu 1 món ngoài Order vẫn cộng điểm, không đánh dấu "đã xong" trong Order của mình.
- Người đầu tiên xong hết Order dừng ván ngay + `ORDER_BONUS`; màn kết thúc
  hiện Order đầy đủ mọi người kèm đánh dấu xong/chưa.
- Pool cạn mà chưa ai xong Order → ván dừng theo Kết thúc B, không ai có `ORDER_BONUS`.

## Theo dõi khi build (không chặn AGREED)

- `COPIES_PER_TYPE_MENU = 6` và `HAND_START = 11` giữ nguyên làm điểm khởi
  đầu — số loại nguyên liệu thực tế trong pool phụ thuộc Menu sinh ra mỗi ván
  (các món chia sẻ nguyên liệu nhiều hay ít), nên không tính trước chính xác
  được. `game-dev` in ra số loại/kích thước pool thực tế mỗi ván; `/tuning`
  chỉnh `COPIES_PER_TYPE_MENU` sau khi chơi thử — không đổi `HAND_START` trước.
