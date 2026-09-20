# 18 — Staff (nhân viên chạy bàn)

**Status:** BUILT (2026-09-20, backlog #37; nhịp hiện card món #40; icon trạng thái #41; thuê nhân viên #39)
**Attaches to:** vòng đời khách (`16-customers-idle.md`) — chen vào **giữa** lúc khách gọi món và
lúc món ra. Chạy trên lưới của `13-restaurant-grid.md`, dùng chính card bếp của `15-shop-unlocks.md`.

## Overview

Trước mục này, món khách gọi tự nấu xong sau một khoảng thời gian — cái bếp mua trong shop chỉ là
một con số đếm vô hình. Giờ quán có **nhân viên**: một card đi lại đúng kiểu khách, nhận order tận
bàn, **chạy về bếp** đứng nấu ở đó, rồi bưng món ra cho khách. Người chơi bắt đầu với **một** nhân
viên. Nấu được mấy món cùng lúc giờ là `min(số nhân viên, số bếp)`, và quãng đường nhân viên phải
chạy là chi phí thật của việc xếp bếp xa bàn.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: **cái bếp có mặt trên sàn vì một lý do**. Trước đây bếp là item trang trí có tác dụng
  ẩn; giờ nó là chỗ nhân viên đứng — nhìn quán là thấy ai đang làm gì, ở đâu.
- Intended: bố cục quán lần đầu có **hệ quả cơ học**. `13-` nói bố cục thuần expression (khách nhảy
  thẳng, không né); vẫn đúng với khách, nhưng nhân viên đi đi về về giữa bàn và bếp nên **bếp xa
  bàn = phục vụ chậm hơn**. Đây là lần đầu người chơi có lý do để nghĩ về chỗ đặt đồ, và nó vẫn là
  lựa chọn (đẹp ↔ nhanh), không phải một lời giải duy nhất.
- Intended: siết lại vòng mua sắm của `16-`. Bàn = bao nhiêu khách cùng lúc, bếp = bao nhiêu chỗ
  nấu, **nhân viên = bao nhiêu tay làm**. Mua lệch bất kỳ cạnh nào cũng phí tiền, và giờ có ba
  cạnh chứ không phải hai.
- Degenerate: **mua 5 bếp với 1 nhân viên** cho chắc. Tự phạt ngay và nhìn thấy được: bốn cái bếp
  đứng không, một nhân viên chạy vòng — tốc độ phục vụ không nhúc nhích.
- Degenerate: **dồn bếp sát bàn thành một cục** cho nhân viên đi 1 ô. Đây là tối ưu **hợp lệ** và
  cố ý để mở — nó là phần thưởng cho người chịu nghĩ, và trần của nó thấp (nhanh hơn ~2–3 giây một
  lượt). Cái chặn nó thành lời giải duy nhất là `15-` vẫn tính tiền từng món đồ, và quán đẹp vẫn
  là lý do chính để mua.
- Degenerate: đứng kéo cái bếp đi khi nhân viên đang nấu để "huỷ" lượt nấu. Không ăn thua — nhân
  viên bám theo ô bếp mới y như khách bám theo bàn (`16-` Edge cases), lượt nấu không reset.
- Online / bots: không có dynamic nào. Nhân viên không tồn tại ngoài màn quán (`12-` Rule 6).

**Aesthetics**

| | |
|---|---|
| **Primary** | fantasy |
| **Secondary** | narrative |
| **Serves the core by** | `16-` làm quán *có người*; mục này làm quán *có người làm việc*. Một lượt phục vụ giờ là một chuỗi hành động đọc được từ xa — nhận, chạy, nấu, bưng ra — nên cái quán kể được câu chuyện của nó mà không cần một dòng chữ nào |

## Rules

1. **Số nhân viên** = `save.staff` (`12-` Rule 2). Quán mới bắt đầu với `STAFF_START` = **1**, trần
   `STAFF_MAX`. Bản thân từng nhân viên (đang ở đâu, đang làm gì) **không lưu** — y như khách
   (`16-` Rule 13); chỉ con số được lưu, mở màn quán là cả kíp đứng lại ở chỗ của mình.
2. **Nhân viên là một card** 2×2 ô (sửa 2026-09-20 (6), trước đó 1×2 — `16-` Rule 14), cùng lớp
   vẽ, **cùng kích thước** và **cùng nhịp nhảy** với khách (`16-` Rule 4), chỉ khác màu viền
   (`--staff`, `design/art.md`) và chạy nhanh hơn một chút: một bước `STAFF_HOP_MS` thay vì
   `HOP_MS`. Ảnh lấy từ `STAFF_ART` (`public/art/NPC/`, `art.md` §3 + §5b) — cùng một đường như
   khách, nên đổi mặt nhân viên là đổi một tên file. Không né vật cản, không chiếm ô — đồ đạc vẫn
   kéo thả bình thường bên dưới.
3. **Chỗ đứng của nhân viên (station)** là ô **bên trái** footprint một cái bếp, cùng hàng giữa;
   lọt ra ngoài lưới thì lấy ô bên phải; vẫn không được thì đứng đè lên chính ô bếp. (Đối xứng với
   chỗ ngồi của khách ở `16-` Rule 5, cố ý lệch về phía đối diện để bếp–nhân viên–bàn đọc thành
   một hàng.) Lúc rảnh, nhân viên đứng ở station của cái bếp **gần nhất theo chỉ số**
   (`bếp[i mod số bếp]` với `i` là thứ tự nhân viên).
4. **Vòng đời một nhân viên:** `idle` → `toCus` (chạy tới bàn) → `pick` (nhận order,
   `STAFF_PICK_MS`) → `toKit` (chạy về bếp) → `cook` (đứng nấu tại bếp) → `toServe` (bưng ra bàn) →
   `serve` (`STAFF_PICK_MS`) → `back` (về station) → `idle`.
5. **Nhận order.** Nhân viên `idle` chọn khách **đang chờ lâu nhất** trong số khách phase `wait`
   chưa ai nhận, đánh dấu khách đó là của mình. Đích đến là ô **cạnh chỗ ngồi** của khách (bên
   phải, lọt lưới thì bên trái). Tới nơi, sau `STAFF_PICK_MS`: khách chuyển sang phase `cook`,
   bong bóng món **xuất hiện thêm trên đầu nhân viên** (khách vẫn giữ bong bóng của mình — một bên
   là *tôi đã gọi gì*, một bên là *tôi đang bưng gì*).
6. **Giữ bếp.** Rời bàn, nhân viên đi tìm một cái bếp **chưa ai giữ**. Có thì giữ chỗ và chạy tới
   station của nó; **không có thì đứng yên tại chỗ và thử lại mỗi nhịp** — nhân viên cầm order chờ
   bếp là hình ảnh trực tiếp của "thiếu bếp". Một bếp chỉ một nhân viên giữ tại một thời điểm.
7. **Nấu tại bếp.** Đứng đúng station rồi mới bắt đầu tính giờ; thời gian nấu vẫn là
   `COOK_PER_CARD_MS × số nguyên liệu của công thức` (`16-` Rule 7). **Vòng tiến trình chạy quanh
   bong bóng trên đầu nhân viên**, không phải trên đầu khách, và vẫn là **một** animation đặt một
   lần (`16-` Rule 7, `ui/restaurant.md` Tuning pass (2) mục 3). Nấu xong: nhả bếp ngay, bong bóng
   đổi sang trạng thái "xong", chạy ra bàn.
8. **Trả món.** Tới cạnh khách, sau `STAFF_PICK_MS`: card món **chuyển từ nhân viên sang trên đầu
   khách** và chạy vòng tiến trình lần hai dài `CUS_EAT_MS` (`16-` Rule 8) — khách sang `eat` rồi
   trả tiền, không đổi công thức. Nhân viên tay không về station.
9. **Kiên nhẫn của khách chỉ đếm khi chưa ai nhận order** (sửa `16-` Rule 7). Đồng hồ
   `CUS_PATIENCE_MS` chạy từ lúc gọi món và **dừng** ngay khi một nhân viên nhận order (khách sang
   phase `cook`). Lý do: khách bỏ đi phải là lỗi *quán không đủ tay làm*, chứ không phải lỗi món
   nhiều nguyên liệu nấu lâu — món lâu đã tự phạt bằng thông lượng rồi.
10. **Khách biến mất giữa chừng** (bỏ đi vì hết kiên nhẫn trước khi được nhận order, hoặc bàn hỏng):
    nhân viên đang phục vụ khách đó **bỏ dở ngay** — nhả bếp, bong bóng biến mất, về station. Món
    đang nấu mất trắng, không gold, không XP.
11. **Không có bếp nào** (save lạ — shop chưa cho bán đồ): nhân viên nhận order rồi đứng cầm, không
    ai được phục vụ, kèm một dòng nhắc trên màn. Không lỗi, không crash.
12. **Thu nhập lúc vắng mặt** (`16-` Rule 9) tính thêm nhân viên: số lượt khách mỗi chu kỳ là
    `min(số bàn, số bếp, số nhân viên)` thay vì chỉ số bàn. Vắng mặt và có mặt phải cùng một nút
    thắt, nếu không thì đóng tab lại lời hơn ngồi xem.
13. **Không đụng ván bài** (`12-` Rule 6): nhân viên không vào `View`/`HostEvent`/`Intent`, không
    gửi gì qua mạng, **không** bump `PREFIX`.

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `STAFF_START` | 1 | 1–6 | GUESS | bắt đầu với đúng một người: nút thắt phải nhìn thấy được ngay ván đầu |
| `STAFF_HOP_MS` | 190 | 120–400 | GUESS | nhanh hơn khách (260) chừng 1.4× — đủ để đọc ra "người này đang chạy", chưa tới mức trượt |
| `STAFF_PICK_MS` | 420 | 200–1200 | GUESS | một nhịp đứng lại ở bàn/bếp; ngắn hơn `CUS_ORDER_MS` vì nó xảy ra 2 lần mỗi lượt |
| `STAFF_START` | 1 | 0–4 | GUESS | quán mới có đúng một người: nút thắt phải nhìn thấy được ngay ván đầu |
| `STAFF_PRICE` | 250 · 700 · 1500 | 100–3000 | GUESS | người thứ 2 rẻ hơn bếp phụ (400) nên thứ tự mua tự nhiên là bàn → người → bếp; từ người thứ 3 giá nhân ~2.2× mỗi lần để việc mở rộng luôn phải đánh đổi |
| `STAFF_MIN_LEVEL` | 2 · 5 · 8 | 1–15 | GUESS | mỗi người mới là một mốc dài hơn mốc trước; level 2 đến sau ~2 ván nên người thứ hai là phần thưởng sớm, thấy được |
| `STAFF_MAX` | 4 | — | GUESS | = `STAFF_START + STAFF_PRICE.length`, không khai riêng để hai bảng không bao giờ lệch nhau |

Quán khởi điểm (1 bàn, 1 bếp cạnh nhau, món 2 nguyên liệu): nhận order ~2 ô + nấu 5s + bưng ra ~2 ô
≈ **6.5s** một lượt, so với 5s trước mục này — chậm hơn ~30%, đổi lại có cái để nhìn. Tất cả
**GUESS**, chưa ai chơi thử.

## Edge cases

- **Nhiều nhân viên hơn bếp:** người thừa đứng ở station của bếp `i mod n` (Rule 3) và chờ tới lượt
  giữ bếp — hai người đứng chồng ô là chấp nhận được, không phải lỗi.
- **Nhiều bếp hơn nhân viên:** bếp thừa đứng không. Đúng như thiết kế (Dynamics).
- **Kéo cái bếp đi lúc nhân viên đang nấu:** station tính lại mỗi nhịp từ vị trí bếp hiện tại, nhân
  viên nhảy theo, đồng hồ nấu **không** reset.
- **Kéo cái bàn đi lúc nhân viên đang bưng món tới:** đích tính lại mỗi nhịp, nhân viên đổi hướng.
- **Menu bị dọn sạch lúc nhân viên đang nấu:** món đã gọi vẫn được phục vụ (`16-` Edge cases).
- **Rời màn quán giữa chừng:** nhân viên biến mất cùng khách (`16-` Rule 2); mở lại là mẻ mới.
- **Tab bị throttle:** mọi mốc so bằng `Date.now()` — nhịp thô đi chứ không sai.
- **`save.staff = 0`** (sửa tay localStorage, hoặc vặn `STAFF_START` về 0): không ai phục vụ, khách
  gọi món rồi bỏ đi hết. Không crash, và dòng nhắc trên màn nói đúng lý do.
- **Thuê lúc cả kíp đang bận:** người mới xuất hiện ở station và rảnh ngay, không cướp đơn của ai —
  đơn đã có người nhận thì giữ nguyên chủ (Rule 5).
- **Thuê lúc chưa có bếp nào:** vẫn thuê được, người mới nhận order rồi đứng cầm (Rule 11). Không
  chặn — người chơi được phép mua sai thứ tự, và hệ quả nhìn thấy ngay.
- **Kịch trần rồi mở shop:** card vẫn hiện, ghi *All hired*, bấm không ăn — không giấu card đi
  (`15-` Rule 3).

14. **Thuê thêm nhân viên.** Một card trong shop (`15-` Rule 9), cạnh bàn và bếp — cùng một chỗ
    tiêu gold, không phát minh màn hình mới.
    - Giá **tăng dần theo từng người**: người thứ 2 giá `STAFF_PRICE[0]`, thứ 3 `STAFF_PRICE[1]`…
      Level tối thiểu cũng tăng dần (`STAFF_MIN_LEVEL`). Hết bảng giá = kịch trần `STAFF_MAX`,
      card chuyển sang trạng thái *đã thuê hết* (`15-` Rule 3 thêm một trạng thái).
    - Mua: trừ gold → `save.staff + 1` → ghi save ngay. Người mới **hiện ra ngay lập tức** ở
      station của bếp `i mod n` (Rule 3), rảnh, nhận đơn ở nhịp kế tiếp.
    - Nhân viên **không chiếm ô lưới** nên card thuê **không bao giờ** ở trạng thái "hết chỗ" —
      đây là món đồ đầu tiên trong shop không cần chỗ trống.
    - Không sa thải, không hoàn tiền (`15-` Rule 6 áp dụng nguyên).
15. **Save schema v3.** `save.staff` là field mới → `SAVE_VERSION` lên **3**. Save cũ (v1/v2) giữ
    nguyên gold/level/đồ/món và được gán `staff = STAFF_START`; số lạ (sửa tay localStorage) bị kẹp
    về `[0, STAFF_MAX]`. **Không bao giờ xoá tiến trình người chơi** (`12-` Rule 5).

## Depends on

- `16-customers-idle.md` — vòng đời khách; mục này sửa Rule 7 (bếp không tự nấu nữa) và Rule 9.
- `13-restaurant-grid.md` — toạ độ ô ↔ pixel, camera.
- `15-shop-unlocks.md` — bếp mua ở đây; đây là chỗ nó có tác dụng nhìn thấy được.
- `design/art.md` "Staff" — token `--staff`, `public/art/Staff/`.
- `design/ui/restaurant.md` Tuning pass (3) — card nhân viên và chỗ đặt bong bóng.

## Done when

- Quán khởi điểm (1 bàn, 1 bếp, menu 2 món): khách vào ngồi, **nhân viên chạy tới bàn**, khách và
  nhân viên cùng hiện bong bóng món, nhân viên **chạy về bếp**, vòng tiến trình chạy quanh bong
  bóng **trên đầu nhân viên** ở đúng chỗ cái bếp, xong thì chạy ra bàn, khách ăn và trả tiền đúng
  như `16-` Rule 8.
- Mua thêm bàn (2 bàn, 1 bếp, 1 nhân viên): hai khách ngồi cùng lúc nhưng **vẫn phục vụ lần lượt** —
  nhìn thấy một người chạy qua chạy lại.
- Mua thêm bếp mà vẫn 1 nhân viên: thông lượng **không** tăng, bếp thứ hai đứng không.
- Mở shop, thuê người thứ hai: gold trừ đúng giá, **người mới hiện ra ngay** cạnh bếp, và với hai
  bếp thì hai món nấu song song ở hai cái bếp khác nhau.
- Chưa đủ level → card thuê ghi `Level N` và bấm không được; đủ level nhưng thiếu gold → hiện giá,
  vẫn bấm không được; thuê hết `STAFF_MAX` → card ghi *All hired*.
- Mở lại game: số nhân viên vẫn đúng như lúc thuê (save v3). Save cũ v1/v2 mở lên giữ nguyên
  gold/level/đồ và có đúng `STAFF_START` người.
- Kéo cái bếp sang góc khác lúc đang nấu → nhân viên bám theo, đồng hồ nấu không reset.
- Ép một khách chờ quá `CUS_PATIENCE_MS` **trước khi** được nhận order → khách rung rồi bỏ đi. Còn
  khách đã được nhận order thì **không** bao giờ bỏ đi giữa chừng dù món nấu lâu.
- `grep`: `core/`, `ai/`, `net/` vẫn không import `meta/`; không có message mới trong `net/room.ts`.
