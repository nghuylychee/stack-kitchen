# Stack Kitchen — Core

**Status:** BUILT (2026-09-19, backlog #9–#11 — Menu & Order)
**Last updated:** 2026-09-19 (Core loop + Win/lose viết lại theo Menu/Order, `07-menu-orders.md`; trước đó 2026-09-16 (5) vùng nấu nhỏ giữa bàn, 1 stack; bỏ chạm chọn + nút Play, chỉ kéo vào ô đánh phát sáng)
**Viewport:** responsive — lấp đầy cửa sổ trình duyệt (mang theo từ 006)
**Nguồn:** migrate từ `006-stack-kitchen` — chỉ giữ 27 thẻ nguyên liệu + 20 món
ăn Việt Nam và ảnh của chúng. Bỏ hết shop, khách hàng, nấu theo thời gian,
level, bàn tự do. Bamboo Mold không được mang sang (không món nào cần).

## Pitch

Card game 2–4 người kiểu mạt chược: mỗi lượt bốc 1 thẻ nguyên liệu, quyết định
ráp món ngay hay giữ bài đánh lớn, rồi đánh 1 thẻ ra — và đối thủ có thể "tố"
ăn chính thẻ đó để ra món trước bạn. Mỗi ván có 1 **Menu** công khai (vài món
rút từ 20 món gốc) và 1 **Order** bí mật riêng từng người rút từ Menu đó —
thắng bằng cách hoàn thành Order của mình trước người khác, hoặc ghi nhiều
điểm hơn dù không về đích đầu → `07-menu-orders.md`.

## Core loop

| Scale | The loop |
|---|---|
| **30 seconds** | bốc 1 thẻ → xem tay có ráp được món nào → reveal hoặc giữ → đánh 1 thẻ ra → canh xem ai tố |
| **Một ván (~5–10 phút)** | hoàn thành hết Order riêng của mình (vài món bí mật rút từ Menu công khai của ván) trước người khác, hoặc ghi nhiều điểm hơn dù không về đích đầu → `07-menu-orders.md` |
| **Ngày mai** | thử lại hướng build khác (săn món 4 thẻ điểm cao vs. chốt nhanh món 2 thẻ), đọc bài + đoán Order đối thủ tốt hơn |

## MDA — core loop

**Mechanics**

- Bộ bài chung (pool): 27 loại nguyên liệu × 4 bản = 108 thẻ, xáo ngẫu nhiên → `01-card-pool-deal.md`.
- Mỗi người được chia `HAND_SIZE` (7) thẻ. Lượt đi theo chiều kim đồng hồ.
- Lượt của 1 người gồm 3 bước theo thứ tự:
  1. **Draw** — bốc 1 thẻ từ pool lên tay → `02-draw-reveal.md`.
  2. **Check** — có thể reveal 0..N món đang ráp đủ trong tay; thẻ đó rời tay,
     món nằm ngửa trước mặt, cộng điểm → `02-draw-reveal.md`. Thu món xong tự bốc bù lên
     `HAND_SIZE`+1 → `08-hand-refill.md`.
  3. **Play** — đánh 1 thẻ ra giữa bàn. Người khác có thể tố thẻ đó nếu ráp ra
     món; món điểm cao hơn thắng quyền tố → `03-play-claim.md`.
- 20 món chia 3 loại (Appetizer/Main/Dessert, giờ chỉ là nhãn hiển thị), điểm
  theo số thẻ của món → `04-food-score-end.md`.
- Đầu ván sinh **Menu** công khai (`MENU_SIZE` món rút từ 20 món gốc) rồi giao
  riêng **Order** bí mật cho từng người (`ORDER_SIZE` món rút từ Menu) →
  `07-menu-orders.md`. Bộ bài (pool) chỉ chứa nguyên liệu phục vụ Menu ván đó.
- Hết ván khi 1 người xong toàn bộ Order của họ (+`ORDER_BONUS`) hoặc pool
  cạn. Điểm cao nhất thắng → `04-food-score-end.md`, `07-menu-orders.md`.
- Chơi 1 người thật vs. 1–3 AI → `05-ai-player.md`; hoặc phòng online 2–4 người, ghế trống do AI ngồi → `06-online-room.md`.

**Dynamics**

- Muốn thấy: căng thẳng "giữ hay reveal" — Rice Noodle + Beef đã là Pho Bo
  (2 điểm) nhưng thêm Chili + Lemongrass thành Bun Bo Hue (7 điểm). Giữ thì có
  thể bị người khác đua về 3 loại trước.
- Muốn thấy: đọc bàn — nhìn món đã ngửa và thẻ đã đánh để đoán ai đang cần gì,
  tránh đánh ra thẻ nuôi đối thủ; giờ còn là đoán **Order** bí mật của đối
  thủ, không chỉ loại còn thiếu → `07-menu-orders.md`.
- Muốn thấy: tranh thẻ Pork (có trong 9/20 món) — tài nguyên nghẽn tự nhiên.
- **Không muốn:** reveal ngay mọi món 2 thẻ rẻ để đua xong Order, không bao
  giờ giữ bài. Chặn bởi: điểm món tăng mạnh theo số thẻ (2 → 4 → 7) nên chốt
  rẻ dễ về đích đầu nhưng thua điểm; thưởng `ORDER_BONUS` chỉ bù được 1 phần.
- **Không muốn:** không ai tố bao giờ vì hiếm khi ráp được. Theo dõi qua log
  hành động, không có bộ đếm số lần tố trên HUD. (sửa 2026-09-16 (2))

**Aesthetics**

- Primary: **challenge** — đấu trí đọc bài, chọn đúng lúc chốt.
- Secondary: **fellowship** — cảm giác ngồi 1 bàn với người khác (MVP dùng AI thay).
- Nhìn thấy được khi: người test dừng lại trước khi reveal để cân nhắc giữ
  bài, hoặc chửi thề khi AI tố mất thẻ họ vừa đánh.

## Player

Người thích card game/mạt chược nhẹ, chơi ở bàn máy tính hoặc trên sofa, 1 ván
5–10 phút. MVP: 1 người test vs. AI trong trình duyệt.

## Win / lose

- Ván kết thúc ngay khi 1 người xong toàn bộ **Order** riêng của họ (vài món
  bí mật rút từ Menu công khai của ván, +`ORDER_BONUS`), hoặc khi đến lượt
  bốc mà pool rỗng (không ai được thưởng) → `07-menu-orders.md`.
- Người có tổng điểm cao nhất thắng — kể cả khi không phải người xong Order
  đầu. Hoà điểm thì đồng hạng.

## Controls (responsive, chuột hoặc cảm ứng — sửa 2026-09-16 (3), stack trên mặt bàn)

| Input | Kết quả |
|---|---|
| Tap chồng bài pool (lượt của mình) | bốc 1 thẻ lên tay |
| Kéo 1 thẻ trong tay vào vùng nấu nhỏ giữa bàn | mở stack / nhập vào stack đang có — 1 stack duy nhất (`02-` Rule 9–10, 14) |
| Kéo thẻ trên bàn thả về quạt bài, hoặc tap nó | thẻ về lại tay (`02-` Rule 13) |
| Tap **Cook <món> +N** trên stack khớp công thức | chạy progress → thẻ món tại đúng vị trí đó (`02-` Rule 11–12) |
| Kéo/tap thẻ món vào ô info của mình (góc trái dưới) | reveal chính thức, cộng điểm (`02-` Rule 12) |
| Kéo 1 thẻ trong tay (hoặc thẻ trên cùng của stack) vào ô đánh phát sáng giữa bàn | đánh thẻ ra (`03-` Rule 1) — không còn chạm chọn + nút Play |
| Kéo thẻ vừa đánh vào vùng nấu rồi Cook / tap **Pass** | tố hoặc bỏ qua (`03-` Rule 11) |
| Tap **Recipes** / **Restart** | bảng công thức / ván mới |

Layout ghế 2-3-4 người, bố cục tay bài và animation: `design/ui/table.md`. Visual: `design/art.md`.

## Riskiest assumption

> "Quyết định giữ bài để ráp món to vs. reveal sớm để đua 3 loại — kèm việc bị
> tố mất thẻ — có tạo ra lựa chọn thật mỗi lượt, hay lượt nào cũng hiển nhiên
> (reveal được là reveal, đánh thẻ vô dụng nhất)?"

## Not doing

- ~~Không shop, gold, level, khách hàng~~ — đổi 2026-09-20: **ngoài ván bài** có một lớp meta,
  quán ăn của người chơi (shop, gold, level, khách), thay cho main menu → `12-restaurant-meta.md`.
  Lớp này **không đụng luật ván**: không đổi thẻ, không đổi bot, không ai trong phòng online thấy
  nó (`12-` Rule 6). Trong ván vẫn không có shop/gold/bàn craft tự do/pack của 006.
- ~~Không multiplayer online~~ — đổi 2026-09-16: có phòng online PvP, xem `06-online-room.md`. Vẫn không có nhiều người thật chung 1 máy.
- Không thẻ tool/kỹ thuật, không thẻ đặc biệt/joker.
- Không ăn "chi/pung" kiểu mạt chược thật — chỉ tố khi ráp ra **món hoàn chỉnh**.
- Không AI "thông minh" thật sự — chỉ đủ tốt để test luật.
