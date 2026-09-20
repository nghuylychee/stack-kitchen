# 14 — Gold, XP & Level (thưởng sau ván, đường cong level)

**Status:** BUILT (2026-09-20, backlog #26)
**Attaches to:** `end` event của một ván (`04-food-score-end.md`, `07-menu-orders.md` Rule 10–12) →
ghi vào state quán (`12-restaurant-meta.md` Rule 2).

## Overview

Đánh xong một ván — bot hay online đều vậy — người chơi nhận **gold** và **XP** dựa trên điểm của
mình trong ván đó, có thêm thưởng nếu thắng và nếu là người xong Order trước. Gold để mua đồ trong
shop, XP để lên level, level để mở khoá đồ đắt hơn. Đợt 1 đây là **nguồn thu duy nhất**; khách trong
quán sẽ là nguồn thứ hai ở đợt 2 (`16-customers-idle.md`, chưa viết).

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: khép vòng lặp — chơi vì ván bài vui, nhưng mỗi ván còn để lại một thứ mang về quán.
  Thua vẫn có gold (thưởng nền + điểm), nên ván xui không thành công cốc.
- Intended: thưởng bám vào **điểm**, tức là bám vào đúng thứ ván bài đã bảo người chơi theo đuổi
  (`04-` Rule 1) — không đẻ ra mục tiêu thứ hai cãi nhau với mục tiêu gốc.
- Degenerate: **kéo dài ván để farm**. Chặn bằng Rule 3 — thưởng không tính theo số lượt, số thẻ hay
  thời gian, nên ván 60 lượt không hơn ván 20 lượt nếu điểm như nhau.
- Degenerate: **cày bot vì dễ hơn người thật**. Đợt 1 cố ý **không** phân biệt hai chế độ (Rule 2) cho
  đơn giản; nếu playtest thấy cày bot là đường tối ưu nhàm chán thì hạ hệ số chế độ bot ở vòng
  `/tuning`, không phải sửa ở đây trước khi có dữ liệu.
- Degenerate: thoát ván sắp thua để khỏi mất gì. Vô nghĩa — không có hình phạt nào khi thua, thoát
  chỉ mất phần thưởng (Rule 5).
- Online: mỗi người tự cộng cho mình, không ai thấy gold người khác, không có gì để tranh.

**Aesthetics**

| | |
|---|---|
| **Primary** | submission |
| **Secondary** | fantasy |
| **Serves the core by** | biến một ván lẻ thành một bước trong cái gì đó dài hơn, mà **không** đụng vào cân bằng ván (`12-` Rule 6) — người mới và người cày 100 ván ngồi xuống vẫn ngang cơ |

## Rules

1. **Nguồn thu đợt 1:** kết thúc ván. Khách để đợt 2 (`16-`).
2. **Tính ở client**, ngay khi nhận `HostEvent` `{ t: 'end' }` — **cả hai chế độ dùng chung một công
   thức**, không rẽ nhánh theo bot/online. Dữ liệu lấy từ `end.view` đã có sẵn: điểm ghế mình, mình
   có phải người xong Order trước (`end.finisher`) không, điểm mình có phải cao nhất bàn không.
   Không thêm field vào `HostEvent`, không hỏi host.
3. **Công thức** (làm tròn xuống, rồi chặn trần):
   - `gold = GOLD_BASE + GOLD_PER_POINT × điểm + (thắng ? GOLD_WIN : 0) + (xong Order trước ? GOLD_FINISH : 0)`, tối đa `GOLD_MATCH_MAX`.
   - `xp = XP_BASE + XP_PER_POINT × điểm + (thắng ? XP_WIN : 0)`, tối đa `XP_MATCH_MAX`.
4. **"Thắng"** = điểm cao nhất bàn, kể cả khi đồng hạng nhất (`04-` Rule 5 cho phép hoà) — hoà thì
   mọi người đồng hạng nhất đều được `GOLD_WIN`/`XP_WIN`.
5. **Không thưởng** khi không có `end`: bấm `Home` giữa ván, đóng tab, host đóng phòng, mất kết nối
   và không kịp vào lại. Không có cơ chế đền bù.
6. **Mỗi `end` cộng đúng một lần** — mở lại bảng tổng kết, bấm `View table` rồi quay ra, hay chuỗi
   Finale (`11-`) bị tap bỏ qua đều không cộng thêm lần nữa.
7. **Level:** cần `xpToLevel(n) = XP_L0 + XP_STEP × (n − 1)` XP để đi từ level `n` lên `n+1`. XP dư
   tràn sang level kế tiếp; một ván có thể lên nhiều level. Lên level → toast + shop mở thêm đồ (`15-`).
8. Level **không có trần** ở đợt 1. Hết đồ trong shop thì level chỉ còn là con số — chấp nhận cho tới
   khi có thêm nội dung.
9. **Nhắc lại `12-` Rule 6:** gold, XP, level không đổi luật, số thẻ, Menu, Order, bot hay bất cứ thứ
   gì trong `Match`. Thưởng chỉ ghi vào save.
10. **Online:** thưởng cộng cục bộ từng máy từ `end` của chính máy đó; không gửi gì qua mạng, không
    bump `PREFIX`. Rớt mạng rồi vào lại kịp trước khi ván kết thúc vẫn nhận thưởng bình thường.
11. Số liệu ở bảng Numbers nằm trong `src/core/config.ts` để người duyệt tự vặn, cùng chỗ với các số
    hiện có.

## Numbers

Toàn bộ **GUESS** — chưa ai chơi thử vòng lặp này.

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `GOLD_BASE` | 20 | 0–50 | GUESS | ván thua sạch vẫn có gì mang về |
| `GOLD_PER_POINT` | 2 | 1–5 | GUESS | điểm là thước đo chính, nên chiếm phần lớn thưởng |
| `GOLD_WIN` | 30 | 0–60 | GUESS | thắng đáng kể nhưng không áp đảo phần điểm |
| `GOLD_FINISH` | 20 | 0–40 | GUESS | thưởng riêng cho người xong Order trước — tôn trọng `07-` Rule 12 (về đích ≠ thắng) bằng cách trả riêng hai khoản |
| `GOLD_MATCH_MAX` | 200 | 100–400 | GUESS | trần chống ván dị thường; ~1.7 lần ván thắng điển hình |
| `XP_BASE` | 10 | 0–30 | GUESS | |
| `XP_PER_POINT` | 1 | 1–3 | GUESS | |
| `XP_WIN` | 15 | 0–30 | GUESS | |
| `XP_MATCH_MAX` | 100 | 50–200 | GUESS | |
| `XP_L0` | 100 | 50–300 | GUESS | level 1→2 tốn ~2 ván, đủ để thấy tiến triển ngay buổi đầu |
| `XP_STEP` | 60 | 0–150 | GUESS | mỗi level sau dài thêm 60 XP — tuyến tính, dễ đọc, dễ chỉnh |

Ván điển hình (25 điểm, thắng, xong Order trước): `20 + 50 + 30 + 20 = 120` gold · `10 + 25 + 15 = 50` XP.

## Edge cases

- **Ván 2 người và ván 4 người cho điểm khác nhau** → thưởng chênh tự nhiên. Không bù, không hệ số —
  nếu playtest thấy lệch hẳn thì đó là việc của một vòng `/tuning`.
- **Kết thúc B (pool cạn, không ai xong Order):** không ai được `GOLD_FINISH`; phần còn lại tính bình thường.
- **Điểm 0** (không nấu được món nào): vẫn nhận `GOLD_BASE` + `XP_BASE`.
- **Lên level ngay lúc đang mở shop:** shop cập nhật trạng thái khoá ngay trong khung hình đó (`15-` Edge cases).
- **Save bị chặn** (`12-` Edge cases): thưởng vẫn cộng trong phiên, mất khi đóng tab — đúng như cảnh báo đã hiện.
- **Người chơi sửa gold trong localStorage:** chấp nhận (`12-` Edge cases).

## Depends on

- `12-restaurant-meta.md` — nơi gold/xp/level được lưu, và Rule 6 (ranh giới).
- `04-food-score-end.md`, `07-menu-orders.md` Rule 10–12 — nguồn "điểm", "thắng", "xong Order trước".
- `11-match-finale.md` — chuỗi kết thúc chạy trước bảng tổng kết; thưởng cộng độc lập với việc tap bỏ qua.
- `15-shop-unlocks.md` — nơi tiêu gold và nơi level có tác dụng.

## Done when

- Chơi hết một ván vs bots → về quán thấy gold và XP tăng đúng công thức (kiểm bằng điểm cuối ván).
- Thắng và thua đều có thưởng, thắng nhiều hơn đúng `GOLD_WIN`/`XP_WIN`.
- Người xong Order trước nhưng thua điểm → nhận `GOLD_FINISH` mà không nhận `GOLD_WIN`.
- Đủ XP → lên level, XP dư tràn đúng, toast hiện.
- Bấm `Home` giữa ván → không có gold/XP nào cộng.
- Online 2 tab: mỗi tab cộng thưởng của riêng mình, số liệu hai bên độc lập, không tab nào thấy gold tab kia.
- Mở lại bảng tổng kết / tap bỏ qua Finale → gold không cộng lần hai.
