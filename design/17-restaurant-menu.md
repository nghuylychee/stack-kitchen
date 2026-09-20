# 17 — Restaurant Menu (người chơi chọn món cho quán)

**Status:** BUILT (2026-09-20, backlog #30)
**Attaches to:** màn quán (`12-restaurant-meta.md`) — thêm `menu` và `dishes` vào save, cung cấp
danh sách món cho khách gọi (`16-customers-idle.md` Rule 6).

## Overview

Quán bán gì là do người chơi quyết. Một bảng menu nhỏ: bên trong là những món **đã từng nấu trong
ván bài**, chọn tối đa `MENU_SLOTS` món để treo lên. Khách chỉ gọi những món đang treo. Món nhiều
điểm trả nhiều gold hơn nhưng nấu lâu hơn (`16-` Rule 7–8), nên chọn menu là một quyết định thật:
quán ăn nhanh nhiều lượt, hay quán món nặng ít lượt.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: **expression** — hai người cùng level vẫn có hai cái quán bán khác nhau, giống như hai
  cách xếp đồ ở `13-`, nhưng lần này lựa chọn có hệ quả về thu nhập.
- Intended: **discovery** nối thẳng vào ván bài — nấu được món mới trong ván thì quán mở thêm món
  mới. Đây là sợi dây duy nhất đi từ ván bài sang meta mà **không** đụng vào luật ván (`12-` Rule 6):
  ván bài không biết gì, client tự đọc kết quả cuối ván.
- Degenerate: **chỉ treo món rẻ nhất, nhiều lượt nhất** để tối đa gold/giờ. Không cấm — đó là một
  chiến lược hợp lệ và dễ đọc; đối trọng là món nặng trả gold/lượt cao hơn hẳn và quán có giới hạn
  bàn, nên khi đã mua đủ bàn/bếp thì món nặng mới là đường tối ưu. Số liệu cân sau khi có playtest.
- Degenerate: quên chọn menu rồi tưởng game hỏng vì không có khách. Chặn bằng Rule 3 (quán mới sinh
  ra đã có sẵn 2 món) và bằng dòng nhắc của `16-` Edge cases.
- Online / bots: không liên quan — menu quán **không** phải Menu của ván bài (`07-menu-orders.md`),
  hai thứ trùng tên nhưng không dính nhau. Đối thủ không thấy menu quán.

**Aesthetics**

| | |
|---|---|
| **Primary** | expression |
| **Secondary** | discovery |
| **Serves the core by** | cho người chơi một lý do **trong quán** để đi nấu món lạ trong ván bài, mà không thưởng/phạt gì bên trong ván — đúng ranh giới cosmetic của `12-` Rule 6 |

## Rules

1. **Hai danh sách trong save** (`12-` Rule 2 mở rộng, `SAVE_VERSION` lên 2):
   `dishes: string[]` (tên món đã mở khoá) và `menu: string[]` (tên món đang treo, thứ tự là thứ tự
   người chơi chọn). Tên món dùng đúng `Recipe.dish` của `core/data.ts` — một nguồn duy nhất.
2. **Mở khoá bằng cách nấu trong ván.** Khi nhận `end` (đúng chỗ `14-` Rule 2 đang cộng thưởng),
   client đọc `end.view.players[you].foods` và thêm mọi `dish` chưa có vào `dishes`. Không thêm
   field vào `HostEvent`, không hỏi host, không gửi gì qua mạng. Thoát giữa ván → không mở khoá gì
   (cùng luật với thưởng, `14-` Rule 5).
3. **Quán khởi điểm** có sẵn `START_DISHES` (hai món 2 nguyên liệu) trong cả `dishes` lẫn `menu` —
   quán mới mở đã bán được hàng ngay, không có trạng thái rỗng chết.
4. **Treo món:** tối đa `MENU_SLOTS` món cùng lúc. Menu đầy thì phải bỏ một món xuống trước khi
   treo món khác (không tự đẩy món cũ ra). Bỏ hết cũng được — hệ quả là không có khách (`16-`).
5. **Chỉ món đã mở khoá mới treo được.** Món chưa mở vẫn **hiện** trong bảng nhưng mờ và ghi
   "Cook it in a match" — cùng tinh thần "món khoá luôn hiện" của shop (`15-` Rule 3).
6. **Mở bảng menu** bằng card `MENU` ở dải điều hướng; là overlay trên màn quán như shop
   (`15-` Rule 1), đóng lại thấy ngay quán. Chọn/bỏ chọn có hiệu lực **ngay**, lưu ngay
   (`12-` Rule 4), không có nút Save/Apply.
7. **Khách đang phục vụ không bị ảnh hưởng** khi menu đổi giữa chừng (`16-` Edge cases).
8. **Không có giá món, không đặt giá.** Gold một khách trả tính từ điểm món (`16-` Rule 8) —
   đợt này người chơi không chỉnh giá, tránh đẻ thêm một hệ kinh tế thứ hai trước khi có playtest.
9. **Nâng schema:** save `v: 1` được **migrate** chứ không xoá — giữ nguyên gold/level/đồ đạc, chỉ
   thêm `dishes`/`menu` bằng `START_DISHES` rồi ghi lại với `v: 2`. (Save `v` lớn hơn vẫn theo
   `12-` Edge cases: chạy quán mới, không ghi đè.)
10. **Món biến mất khỏi `RECIPES`** (bản deploy sau đổi nội dung): bỏ qua lúc nạp, không crash;
    `menu` ngắn lại một món.

## Numbers

Toàn bộ **GUESS**. Nằm trong `src/core/config.ts`.

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `MENU_SLOTS` | 3 | 1–8 | GUESS | đủ để thấy mình đang chọn, chưa nhiều tới mức treo hết cho xong |
| `START_DISHES` | `Phở Bò`, `Xôi Gấc` | — | GUESS | hai món **2 nguyên liệu** → nấu nhanh nhất (`16-` Rule 7), một Main một Dessert cho quán mới đỡ đơn điệu |

`MENU_SLOTS` cố định ở đợt này. Nếu playtest thấy muốn "mở rộng thực đơn" thì buộc nó vào số bếp
hoặc vào level ở một vòng `/tuning` — không làm trước khi biết có ai quan tâm.

## Edge cases

- **Nấu món đã có trong `dishes`:** không trùng lặp, không toast lần hai.
- **Mở khoá món thứ nhất khi menu chưa đầy:** **không** tự treo lên — người chơi tự quyết (Rule 4).
  Chỉ báo bằng một toast "New dish unlocked: <tên>".
- **Menu đang treo 3 món rồi bấm món thứ 4:** không đổi gì, hiện lý do ngắn ngay trong bảng.
- **Save v1 của người chơi cũ** (đã có gold, đồ đạc): migrate theo Rule 9 — không ai mất tiến trình.
- **`dishes` chứa tên rác** do sửa tay localStorage: lọc theo `RECIPES` lúc nạp, bỏ tên không khớp.
- **Save bị chặn** (`12-` Edge cases): chọn menu vẫn chạy trong phiên, mất khi đóng tab.
- **Online:** đối thủ không thấy `menu`/`dishes`; không message mới, không bump `PREFIX`.

## Depends on

- `12-restaurant-meta.md` — save (bản này nâng `SAVE_VERSION` lên 2), ranh giới với ván bài.
- `14-gold-xp-level.md` Rule 2 — chỗ `end` đã được đọc sẵn; mở khoá món đi nhờ đúng chỗ đó.
- `16-customers-idle.md` Rule 6, 8 — ai đọc `menu` và món đổi thành bao nhiêu gold.
- `04-food-score-end.md`, `07-menu-orders.md` — `Recipe.dish`, điểm món, và Menu **của ván bài**
  (khác hẳn menu quán — đừng lẫn).
- `design/ui/restaurant.md` — bảng menu, card món (dùng lại mặt `.card.food` của bàn chơi).

## Done when

- Quán mới: bảng menu mở ra thấy đúng 2 món đã treo, 18 món còn lại mờ kèm "Cook it in a match".
- Nấu một món mới trong ván vs bots → về quán, món đó hết mờ, có toast mở khoá.
- Treo/bỏ treo một món → lưu ngay, F5 vẫn đúng; khách sau đó chỉ gọi món đang treo.
- Menu đủ `MENU_SLOTS` món → bấm món thứ tư không ăn, có lý do hiện ra.
- Bỏ hết món → không có khách nào vào, màn quán hiện dòng nhắc (`16-`).
- Save `v1` cũ (còn gold và đồ đạc) → mở bản mới: gold/đồ giữ nguyên, có 2 món khởi điểm, `v` thành 2.
- Online 2 tab: không tab nào thấy menu quán của tab kia.
