# 09 — Order Progress Signal (chấm tiến độ Order ở ghế đối thủ)

**Status:** BUILT (2026-09-19, backlog #14)
**Attaches to:** `.seat-head` của mỗi ghế đối thủ (`ui/table.md`), `View.players` (`types.ts`),
món trong Order của `07-menu-orders.md`.

> Quyết định trong phiên chat (2026-09-19, không phải playtest note): người dùng muốn ghế đối
> thủ hiện được đã xong bao nhiêu món Order trên tổng số, để đổi chiến thuật — nhưng **không**
> bằng số (`"2/5"`), vì số trần trụi phá luôn dynamic "đoán Order đối thủ" mà `07-` đã thiết kế
> (Dynamics: *"đoán Order đối thủ qua thẻ họ giữ/đánh ra và món họ đã reveal"*). Chốt: dùng
> **chấm/icon** (●●○○○) — cùng thông tin số lượng, nhưng đọc chậm hơn số và không có nhãn
> "Order" ghi rõ ra, để việc đọc vẫn cần nhìn bàn thay vì chỉ liếc 1 con số.

## Overview

Mỗi ghế đối thủ giờ có thêm 1 hàng chấm nhỏ cạnh tên: chấm sáng = 1 món Order của người đó đã
nấu xong, chấm mờ = chưa. Số chấm luôn đúng bằng `ORDER_SIZE` của ván (mọi ghế bằng nhau). Không
ai biết món nào trong 5 chấm đó là món gì — chỉ biết **còn bao nhiêu**. Đây là tín hiệu công
khai đầu tiên về Order của người khác; trước giờ Order người khác hoàn toàn kín tới hết ván.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: người sắp thua theo điểm nhưng thấy đối thủ dẫn đầu chỉ còn 1 chấm trống — đổi hướng
  sang tố/chặn nguyên liệu thay vì đua điểm. Đây là tín hiệu cấp ván (macro), khác với đoán *món
  nào* (micro, vẫn phải nhìn thẻ + reveal như `07-` Dynamics cũ).
- Intended: cộng dồn với cách đoán cũ — thấy 1 người còn 1 chấm trống + vừa đánh ra Pork liên
  tục → khoanh vùng được món còn thiếu nhanh hơn, nhưng vẫn phải tự suy luận, không có bảng liệt kê.
- Degenerate: chỉ nhìn chấm, bỏ qua đọc bài — chấm không nói món nào, nên riêng chấm không đủ để
  chặn đúng chỗ; muốn chặn chính xác vẫn cần cách đọc cũ (`07-`). Chấp nhận — chấm chỉ trả lời
  "ai đang gần thắng", không thay thế "thắng bằng cách nào".
- Theo dõi: nếu chơi thử thấy chấm đủ để đoán ra Order (vd chỉ 3 chấm, gần cuối ván khi phần lớn
  Menu đã bị dò), cân nhắc `/tuning` ẩn chấm tới khi đủ N lượt, hoặc làm mờ chấm cuối. Chưa làm ở
  bản này — bản này chỉ thêm tín hiệu số lượng.
- Solo vs bots: bot không đọc chấm của mình lẫn của người khác — bot không nhận `View`
  (`05-ai-player.md` Overview, `botSelf`/`botTable`), chỉ nhận hand+Order của chính nó và bảng
  công khai qua `pub`. Chấm là UI thuần, không đổi quyết định AI ở bản này.

**Aesthetics**

| | |
|---|---|
| **Primary** | discovery |
| **Secondary** | challenge |
| **Serves the core by** | thêm 1 lớp thông tin công khai mới để đọc bàn (discovery — đúng aesthetic Secondary mà `07-` đã đặt cho cả cơ chế Order), đồng thời giữ áp lực đọc-thẻ-để-đoán-món (challenge) vì chấm không lộ tên món |

## Rules

1. Mỗi người chơi có `orderDone` = số món trong Order của họ đã reveal ít nhất 1 lần
   (`rules.ts` `orderDone()`, đã dùng ở `07-` Rule 9) và `orderSize` = `ORDER_SIZE[n]`
   (`config.ts`, theo số người trong ván — giống nhau cho mọi ghế 1 ván).
2. **Công khai:** `orderDone` và `orderSize` của **mọi ghế** — kể cả ghế mình — được gửi trong
   `View.players[i]` liên tục suốt ván, không chỉ lúc kết thúc. Khác với `order` (tên món), vẫn
   chỉ gửi cho đúng ghế đó tới hết ván (`07-` Rule 17 không đổi; Rule 15 đã sửa câu chữ để ghi ngoại lệ này).
3. `orderDone` cập nhật ngay khi 1 món Order được reveal — dù qua Check (`02-`) hay qua tố thắng
   (`03-`) — cùng thời điểm log "Order N/M done" đã ghi (`match.ts` `revealFood`, không đổi thời
   điểm, chỉ thêm việc đưa số này vào `View` công khai).
4. Món nấu **ngoài** Order không đổi `orderDone` (giữ đúng `07-` Rule 8).
5. Hiển thị: `.seat-head` mỗi ghế đối thủ thêm 1 hàng chấm dưới tên — `orderSize` chấm, `orderDone`
   chấm đầu tiên tô sáng (không gắn với món cụ thể nào, chỉ đếm), còn lại mờ. Không có số, không
   có nhãn "Order" viết chữ cạnh chấm.
6. Ghế mình (`#my-panel`) không cần thêm chấm — `#my-order` (`ui/menu-orders.md`) đã hiện chi
   tiết từng món, đủ thông tin hơn chấm.
7. Chấm cập nhật realtime theo `View` mới nhất mỗi ghế nhận được — không cần animation riêng;
   dùng chung nhịp `render()` đã có (như điểm, số thẻ úp ở `.seat-head`).
8. Xong Order (Kết thúc A', `07-` Rule 10) → chấm người đó đầy hết (`orderDone === orderSize`)
   đúng lúc màn kết thúc hiện — không có state riêng cho "vừa xong", dùng chung state chấm sáng.

**Online / hiển thị (hidden info):**

9. `orderDone`/`orderSize` không phải thông tin ẩn (Rule 2) — 2 tab online thấy đúng số chấm
   sáng của nhau như nhau, khác `foods` (đã công khai từ trước) chỉ ở chỗ đây là số đếm trên tổng
   số cố định của Order, không phải danh sách.
10. Rớt mạng / vào lại ghế (`06-`): `syncSeat` gửi `View` đầy đủ có `orderDone`/`orderSize` mọi
    ghế như bình thường — không cần state đặc biệt, đây là dữ liệu phái sinh, không lưu riêng.

## Numbers

Không thêm số config mới — `orderSize` đọc từ `ORDER_SIZE` đã có (`config.ts`, nguồn `07-`). Không có
Numbers riêng cho doc này.

## Edge cases

- Vừa vào ván (`orderDone` = 0 mọi ghế): tất cả chấm mờ hết, không phải lỗi.
- 2 người có `ORDER_SIZE` khác nhau về mặt lý thuyết không xảy ra — `07-` Rule 5 dùng chung 1
  `ORDER_SIZE[n]` cho mọi ghế 1 ván, nên số chấm luôn bằng nhau giữa các ghế.
- Ghế bot: `orderDone` tính y hệt ghế người (dựa trên `p.order`/`p.foods` phía host), không có
  ngoại lệ — chấm ghế bot vẫn đúng và vẫn hữu ích để đọc.
- Người xem màn kết thúc (`ended = true`): chấm vẫn hiện đúng số cuối cùng; cột "Order" ở
  `#endModal` (`ui/table.md` Tuning pass (6)) đã hiện chi tiết tên món — chấm ở `.seat-head`
  không xung đột, chỉ là 2 chỗ hiện thông tin khác độ chi tiết.

## Depends on

- `07-menu-orders.md` Rule 5–10 — nguồn `order`, `orderDone`, định nghĩa "xong Order"; Rule 15 sửa để trỏ sang doc này.
- `src/core/rules.ts` `orderDone()` — dùng lại nguyên, không viết hàm đếm mới.
- `design/ui/table.md` `.seat-head` — nơi thêm hàng chấm.
- `06-online-room.md` Rule 26–27 — xác nhận `orderDone`/`orderSize` không nằm trong diện redact
  theo ghế (khác `order` tên món, vẫn redact).

## Done when

- Play vs Bots 4 người: đầu ván mọi ghế đối thủ hiện đúng `ORDER_SIZE` chấm, toàn mờ.
- Nấu xong 1 món trong Order của 1 ghế (người hoặc bot) → đúng lượt đó, chấm ghế đó +1 sáng; nấu
  món ngoài Order → chấm không đổi.
- Xong hết Order (`orderDone === orderSize`) → toàn bộ chấm ghế đó sáng, đúng lúc log "finishes
  their order" + màn kết thúc hiện.
- Online 2 tab: cả 2 tab thấy đúng số chấm sáng của nhau, khớp nhau, khớp cả sau khi 1 tab rớt
  mạng rồi vào lại.
- Đọc code: `View.players[i]` không có tên món (`order`) của ghế khác trước khi kết thúc — chỉ
  có `orderDone`/`orderSize` dạng số.
