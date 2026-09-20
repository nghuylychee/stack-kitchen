# 11 — Match Finale (highlight → confetti → CONGRATULATIONS → bảng tổng kết)

**Status:** BUILT (2026-09-20, backlog #23)
**Attaches to:** `04-food-score-end.md` Rule 6 (màn kết thúc) — chèn 1 chuỗi ăn mừng
thuần client **trước** khi `#endModal` mở, không đổi nội dung `#endModal` đã có.

> Quyết định trong phiên chat (2026-09-20, không phải playtest note): người dùng muốn
> rework hiệu ứng lúc ván kết thúc — highlight người hoàn thành hết Order, bắn confetti,
> popup "CONGRATULATIONS!!!" giữa màn hình, rồi mới hiện bảng tổng kết.

## Overview

Hiện tại `end` event nhảy thẳng vào `#endModal` (bảng xếp hạng) không có khoảnh khắc
ăn mừng nào — thắng thua nhìn giống hệt nhau, không có payoff. Mechanic này thêm 1
chuỗi trình diễn ngắn, **chỉ khi có người xong Order** (Kết thúc A'): spotlight ghế của
người đó + "diễn lại" Order họ vừa hoàn thành (từng món sáng lên tuần tự), rồi confetti
+ chữ "CONGRATULATIONS!" giữa màn hình, rồi mới mở `#endModal` như cũ.

**Cố ý không gọi đây là "thắng"** — người xong Order trước chưa chắc thắng điểm
(`07-menu-orders.md` Rule 12). Chuỗi này ăn mừng *hoàn thành Order*, bảng tổng kết
ngay sau đó mới quyết định ai thắng thật (điểm cao nhất, 🏆).

## MDA

**Mechanics**

- Chuỗi 3 bước: **Spotlight** → **Confetti + CONGRATULATIONS** → `#endModal` (không đổi).
- Chỉ chạy khi `end.reason === 'order'` (có `finisher`). Kết thúc B (`pool`) bỏ qua toàn
  bộ chuỗi, vào thẳng `#endModal` như hiện tại — không có gì để ăn mừng.
- Thuần trình diễn ở client, không cần `Intent`/`HostEvent` mới, không đổi `PREFIX`
  (xem Rules 7–8) — dựa hoàn toàn vào dữ liệu `end` event đã có (`finisher`, `view`).

**Dynamics**

- Intended: tạo 1 khoảnh khắc "à, xong rồi" rõ ràng thay vì bảng điểm hiện đột ngột —
  đặc biệt quan trọng khi chơi với bạn bè qua online room, lúc cả bàn cùng thấy ai vừa
  về đích.
- Intended: giữ đúng dynamic đã chốt ở `07-`/`04-` — "xong Order trước ≠ thắng điểm".
  Chữ trên popup ăn mừng *hành động* ("completed their Order"), không ăn mừng *kết quả*
  ("wins") — tránh mâu thuẫn với 🏆 có thể rơi vào người khác ngay dòng bảng điểm kế tiếp.
- Degenerate: chuỗi dài/không tắt được → gây khó chịu ở ván test nhanh liên tiếp (đặc
  biệt bot-only để debug). Chặn bằng Rule 6 (tap để bỏ qua, cục bộ từng máy — cùng mẫu
  đã dùng cho `#menuIntroModal`).
- Online: mỗi client tự chạy chuỗi khi nhận `end` event của mình — không đồng bộ giữa
  các máy (giống cách `#menuIntroModal` hiện tại không đồng bộ). Người xong trước tap bỏ
  qua sớm hơn người khác không phá luật gì, vì không có Intent nào sau `end`.
- Solo vs bots: giống hệt — bot làm finisher thì vẫn spotlight đúng ghế bot đó, Order
  của bot đã công khai lúc này (`07-` Rule 13/15), không lộ gì mới.

**Aesthetics**

| | |
|---|---|
| **Primary** | sensation |
| **Secondary** | expression |
| **Serves the core by** | đóng 1 nhịp thắng-thua rõ ràng bằng chuyển động + âm... (không có audio ở bản này) hình ảnh, thay vì để bảng điểm tự nói hết — không cạnh tranh với aesthetic "challenge" chính vì chuỗi chỉ chạy sau khi ván đã thực sự kết thúc, không ảnh hưởng lượt chơi nào |

## Rules

1. **Trigger:** client nhận `HostEvent` `{ t: 'end', reason: 'order', finisher, view }` →
   chạy chuỗi Finale trước khi mở `#endModal`. Nhận `{ reason: 'pool' }` → bỏ qua chuỗi,
   mở `#endModal` ngay (không đổi hành vi hiện tại).
2. **Bước A — Spotlight (`FINALE_SPOTLIGHT_MS`):** phủ dim toàn `#table-surface` (đậm
   hơn dim 65% của `#endModal` — tối thiểu 80%, số chính xác để artist chốt), trừ 1
   vùng sáng quanh ghế của `finisher` (pod `.seat` đối thủ, hoặc dock `#my-panel`/
   `#my-order` nếu `finisher` là chính người xem). Trong lúc dim, từng hàng Order của
   `finisher` sáng lên tuần tự theo đúng thứ tự đã hiện ở `#my-order`/cột Order của
   `#endModal` (thứ tự sinh Order, không phải thứ tự thực tế họ nấu — không có dữ liệu
   thời điểm hoàn thành từng món để "diễn lại" đúng lịch sử, xem Edge cases), cách nhau
   `FINALE_ROW_STAGGER_MS`, hàng cuối sáng xong thì chuyển Bước B ngay.
3. **Bước B — Confetti + CONGRATULATIONS (`FINALE_CONFETTI_MS`):** confetti bay khắp
   viewport (không giới hạn trong `#table-surface`); đồng thời chữ lớn —
   "CONGRATULATIONS!" + tên `finisher` + "completed their order" — pop-in, giữ
   `FINALE_TEXT_HOLD_MS`, fade `FINALE_TEXT_FADE_MS`. Không nói "wins"/"thắng".
   Chữ **không** căn giữa viewport cứng: nó căn giữa **dải trống rộng hơn** (trên hoặc
   dưới khối spotlight + danh sách Order), để không bao giờ đè lên chúng — ghế trên thì
   chữ xuống nửa dưới, dock của mình ở dưới thì chữ lên nửa trên. Dải trống < 160px cả
   2 phía (không xảy ra ở 1280×800 lẫn 1024×700) thì quay về căn giữa viewport.
4. Hết Bước B → mở `#endModal` như hiện tại (`04-` Rule 6, `ui/table.md`/`ui/menu-orders.md`
   "Màn kết thúc") — không đổi nội dung modal đó.
5. `finisher` là chính người xem (ghế mình) → vẫn chạy đủ 2 bước, chỉ khác vùng spotlight
   (Rule 2) là dock của mình thay vì pod đối thủ.
6. **Bỏ qua:** tap/click bất kỳ đâu trong lúc Bước A hoặc B đang chạy → dừng ngay, mở
   `#endModal` luôn. Cục bộ từng máy, giống `#menuIntroModal` — không có Intent, không
   ảnh hưởng máy khác.
7. **Online:** chuỗi này không qua host — mỗi client tự chạy khi `end` event tới tay
   mình. Không cần host `wait()` (không có bước nào sau `end` cần né animation này —
   match đã kết thúc, không còn `Intent` hợp lệ nào để gửi).
8. **Không đổi protocol:** không thêm field vào `HostEvent`/`Intent`, không bump
   `PREFIX` (`net/room.ts`) — toàn bộ dữ liệu cần (`finisher`, Order, tên món) đã có sẵn
   trong `end.view`/`end.finisher` hiện tại.

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `FINALE_SPOTLIGHT_MS` | 900 | 600–1200 | GUESS | đủ để mắt chuyển từ bàn chơi sang ghế finisher trước khi rows bắt đầu sáng |
| `FINALE_ROW_STAGGER_MS` | 220 | 150–300 | GUESS | cùng cỡ nhịp so le đã dùng ở `10-match-intro.md` (Order intro), giữ ngôn ngữ nhất quán |
| `FINALE_CONFETTI_MS` | 1600 | 1200–2200 | GUESS | 1 burst thấy rõ, không kéo dài tới mức chặn ván tiếp theo |
| `FINALE_TEXT_HOLD_MS` | 1300 | 1000–1800 | GUESS | đủ đọc "CONGRATULATIONS! <Name> completed their Order" 1 lần |
| `FINALE_TEXT_FADE_MS` | 250 | 200–400 | GUESS | khớp nhịp fade đã dùng cho toast trong game |

Tổng thời lượng không-tap ước tính: `900 + ORDER_SIZE×220 + max(1600, 1300+250)` ≈
2.7–3.5s tuỳ `ORDER_SIZE` (3–5) — luôn có thể tap bỏ qua (Rule 6).

## Edge cases

- **Kết thúc B (pool cạn, `finisher = null`):** không chạy Finale — vào thẳng
  `#endModal` với tiêu đề "Game over — pool empty" như hiện tại (`04-` Rule 4).
- **"Diễn lại" không phải lịch sử thật:** hệ thống không lưu thời điểm hoàn thành từng
  món trong Order (chỉ có `orderDone()` tính tại-thời-điểm-hỏi, `rules.ts`). Bước A vì
  vậy sáng theo thứ tự sinh Order cố định, không phải thứ tự người chơi thực sự nấu —
  ghi rõ đây là lựa chọn thiết kế (đơn giản, không thêm state mới), không phải bug nếu
  thứ tự sáng không khớp trí nhớ người chơi.
- **`ORDER_SIZE` lớn (5, ván 4 người):** Bước A dài hơn tương ứng (5×220=1100ms thêm) —
  vẫn trong ngưỡng chấp nhận được, và luôn tap-bỏ-qua được (Rule 6).
- **Tap bỏ qua ngay lập tức (giữa Spotlight, trước khi hàng nào sáng):** hợp lệ — nhảy
  thẳng `#endModal`, không cần sáng đủ hết hàng trước khi cho phép bỏ qua.
- **Resize cửa sổ giữa chuỗi:** theo đúng nguyên tắc đã áp dụng toàn game (`ui/table.md`
  "Edge cases") — animation đang chạy giữ nguyên toạ độ đích đã tính lúc bắt đầu, layout
  tự chỉnh ở lần render kế tiếp.
- **`Play again` bấm ngay sau khi `#endModal` mở, trong khi confetti cũ còn đang fade:**
  tái dùng `gameToken` đã có — chuỗi Finale cũ bị bỏ dở không cần dọn riêng, giống cách
  `Restart` giữa animation bất kỳ đã xử lý.
- **Bot là `finisher`:** không có gì khác — Order của bot đã công khai lúc `end` (`07-`
  Rule 13/15), spotlight + tên bot hiển thị bình thường như người thật.

## Depends on

- `04-food-score-end.md` Rule 6 — nơi chuỗi này chèn vào trước khi `#endModal` mở;
  không đổi nội dung modal đó.
- `07-menu-orders.md` Rule 10, 12, 13, 15 — nguồn `finisher`/Kết thúc A', quyết định
  "xong Order trước ≠ thắng điểm" mà câu chữ popup (Rule 3) phải tôn trọng.
- `src/core/types.ts` `HostEvent` `{ t: 'end' }` — nguồn dữ liệu duy nhất, không đổi shape.
- `design/ui/table.md`/`design/ui/menu-orders.md` "Màn kết thúc" — `#endModal` giữ nguyên,
  chi tiết layout/màu chuỗi Finale (đúng vị trí spotlight, màu confetti theo `art.md`,
  kiểu chữ CONGRATULATIONS) để `/ui-spec` hoặc `/art-spec` chốt thêm nếu cần trước khi build.
- `10-match-intro.md` — mẫu nhịp so le/pop-in đầu ván, tái dùng ngôn ngữ animation cho
  đối xứng đầu-cuối ván.

## Done when

- Chơi vs Bots tới khi 1 người (hoặc bot) xong hết Order → Spotlight đúng ghế người đó,
  từng hàng Order sáng tuần tự đúng thứ tự, rồi confetti + "CONGRATULATIONS! <Name>
  completed their Order" giữa màn hình, rồi `#endModal` mở với nội dung không đổi.
- Chạy ván tới pool cạn (không ai xong Order) → không thấy Spotlight/confetti/popup nào,
  `#endModal` "pool empty" mở thẳng như hiện tại.
- Tap/click bất kỳ lúc nào trong Spotlight hoặc Confetti → nhảy thẳng `#endModal` ngay,
  không lỗi console, không phần tử confetti/spotlight mồ côi còn sót lại trên bàn.
- `finisher` là chính người xem lẫn trường hợp là ghế đối thủ/bot — cả 2 chạy đúng, chỉ
  khác vị trí spotlight.
- Online 2 tab: cả 2 tab cùng nhận `end` event, mỗi tab tự chạy chuỗi độc lập (tab tap bỏ
  qua sớm không ảnh hưởng tab kia); cả 2 tab đều tới đúng `#endModal` cuối cùng.
- `Play again` ngay sau khi Finale/`#endModal` vừa xong → ván mới sạch, không còn confetti
  hay overlay cũ sót lại.
