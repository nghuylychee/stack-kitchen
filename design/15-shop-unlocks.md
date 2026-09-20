# 15 — Shop & Unlocks (tiêu gold, mở khoá theo level)

**Status:** BUILT (2026-09-20, backlog #27)
**Attaches to:** card `SHOP` ở màn quán (`design/ui/restaurant.md`) → ghi vào `items` của save
(`12-restaurant-meta.md` Rule 2), đặt đồ qua `13-restaurant-grid.md` Rule 10.

## Overview

Shop là nơi gold có chỗ tiêu. Một danh sách card: mỗi card là một món đồ cho quán — bàn để đón thêm
khách, bếp phụ, đồ trang trí. Món nào đủ gold và đủ level thì mua được ngay; món chưa tới level thì
vẫn hiện nhưng khoá, ghi rõ cần level mấy — để người chơi nhìn thấy thứ mình đang tiến tới.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: **discovery** — nhìn vào shop là biết còn gì phía trước. Món khoá **luôn hiện**, không
  giấu, vì đó chính là lý do chơi thêm ván nữa.
- Intended: hai loại chi tiêu cạnh nhau — đồ rẻ có tác dụng (bàn) và đồ chỉ để đẹp (trang trí). Người
  chơi tự chọn tiêu cho chức năng hay cho cái quán trông ra hồn.
- Degenerate: mua sạch shop trong một buổi rồi hết việc. Đợt 1 chấp nhận (chỉ có 3 món, cố ý nhỏ để
  playtest cảm giác trước khi đổ nội dung vào); `GOLD_*` và giá là chỗ chỉnh nhịp sau playtest.
- Degenerate: tích gold vô hạn không mua gì. Không chặn — không có phí duy trì, không có lạm phát;
  gold nằm đó không hại ai.
- Online / bots: không liên quan — đồ mua **không** đụng ván (`12-` Rule 6).

**Aesthetics**

| | |
|---|---|
| **Primary** | discovery |
| **Secondary** | expression |
| **Serves the core by** | cho gold một đích đến rõ ràng, và cho lưới (`13-`) thứ để xếp — nếu không có shop thì cả hai doc kia chỉ là màn hình chờ |

## Rules

1. Shop mở bằng card `SHOP` ở dải điều hướng; là **overlay trên màn quán**, không phải màn riêng —
   đóng lại là thấy ngay quán vừa đổi.
2. **Catalogue là danh sách tĩnh trong code** (`src/meta/shop.ts`), mỗi món:
   `{ id, name, kind: 'facility' | 'decor', w, h, price, minLevel, blurb }`. `name`/`blurb` là
   in-game text nên viết tiếng Anh.
3. **Trạng thái mỗi card** (đúng một trạng thái tại một thời điểm, theo thứ tự ưu tiên):
   1. **Khoá level** — `save.level < minLevel` → hiện "Level N" thay giá, không mua được.
   2. **Hết chỗ** — lưới không còn ô trống cho footprint đó (`13-` Rule 10) → nút tắt, ghi lý do.
   3. **Thiếu gold** — `save.gold < price` → giá hiện màu `--invalid`, không mua được.
   4. **Mua được**.
4. **Mua:** trừ gold ngay → thêm vào `items` tại ô trống **gần tâm màn hình nhất** (`13-` Rule 10,
   sửa 2026-09-20 (3) — lưới rộng rồi nên món mua phải rơi vào chỗ người chơi đang nhìn) → lưu ngay
   (`12-` Rule 4) → card bay từ shop về đúng ô đó (`ui/restaurant.md`).
5. **Mua được nhiều bản** của cùng một món (3 cái bàn là hợp lệ). Đợt 1 không có món giới hạn 1 lần.
6. **Không bán lại, không hoàn tiền, không xoá đồ** ở đợt 1 — quyết định phạm vi, không phải thiếu sót.
   Hệ quả đã biết: mua nhầm thì phải sống chung với nó cho tới khi có ticket bán lại.
7. **Đồ mua không ảnh hưởng ván bài** (`12-` Rule 6). Đợt 1 bàn và bếp **chưa có tác dụng cơ học nào**
   vì chưa có khách — chúng chỉ chiếm chỗ và trông ra cái quán. Tác dụng thật (chỗ ngồi, số món nấu
   song song) tới ở `16-customers-idle.md`, đợt 2. `blurb` được phép nói trước công dụng đó.
8. Giá và `minLevel` nằm trong `src/core/config.ts` để người duyệt tự vặn.

## Catalogue đợt 1

| id | name (in-game) | kind | price | minLevel | blurb |
|---|---|---|---|---|---|
| `table_basic` | Street Table | facility | 150 | 1 | "Seats one more customer." |
| `plant_pot` | Potted Plant | decor | 80 | 1 | "Green corner. Purely for looks." |
| `kitchen_extra` | Second Burner | facility | 400 | 3 | "Cook one more dish at a time." |

Footprint **không** ghi lại ở đây — nguồn duy nhất là `13-restaurant-grid.md` Numbers
(facility 2×3, decor 1×2, sửa 2026-09-20). Bản trước của bảng này chép lại 2×2/1×1 và đã lạc hậu
sau ticket #28; sửa khi build #27.

Ba món cố ý phủ đủ ba trạng thái ở Rule 3: một món mua được sớm, một món phải tích gold, một món
khoá theo level — để playtest nhìn thấy cả ba mà không cần nội dung lớn.

## Numbers

Toàn bộ **GUESS**.

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| giá `plant_pot` | 80 | 40–150 | GUESS | mua được sau ~1 ván (ván điển hình ~120 gold, `14-`) |
| giá `table_basic` | 150 | 100–300 | GUESS | ~1–2 ván: món đầu tiên đáng chờ |
| giá `kitchen_extra` | 400 | 250–800 | GUESS | ~4 ván, đi kèm khoá level 3 |
| `minLevel` `kitchen_extra` | 3 | 2–5 | GUESS | level 3 ≈ 5–6 ván theo đường cong `14-` |

## Edge cases

- **Gold vừa đúng giá:** mua được (so sánh `>=`).
- **Bấm mua hai lần thật nhanh:** chỉ trừ một lần — khoá nút ngay khi bắt đầu xử lý, mở lại sau khi
  save xong.
- **Lên level trong lúc shop đang mở** (không xảy ra ở đợt 1 vì XP chỉ đến từ ván, nhưng sẽ xảy ra
  khi có khách): card khoá tự đổi trạng thái ở lần render kế tiếp, không cần đóng mở lại shop.
- **Lưới đầy:** món vẫn hiện, nút tắt kèm lý do "No room left" — không ẩn món đi.
- **Save bị chặn** (`12-` Edge cases): mua vẫn chạy trong phiên, mất khi đóng tab — đã cảnh báo trên HUD.
- **Catalogue đổi giữa hai lần chơi** (bản deploy mới đổi giá/bỏ món): `items` lưu theo `id`; `id`
  không còn trong catalogue → giữ nguyên đồ đã đặt, không xoá, chỉ không mua thêm được nữa.

## Depends on

- `12-restaurant-meta.md` — `items`, lưu trữ, ranh giới với ván.
- `13-restaurant-grid.md` Rule 10 — "ô trống đầu tiên" và điều kiện hết chỗ.
- `14-gold-xp-level.md` — nguồn gold và ý nghĩa của level.
- `design/ui/restaurant.md` — card shop, overlay, animation bay về lưới.
- `design/art.md` mục "Restaurant meta" — mặt card của facility/decor.

## Done when

- Mở shop từ màn quán → thấy đúng 3 món, đóng lại về quán không mất trạng thái.
- Đủ gold → mua `plant_pot`: gold trừ đúng, card xuất hiện ở ô trống gần giữa màn, F5 vẫn còn.
- Thiếu gold → giá đỏ, bấm không ăn, gold không đổi.
- Level 1 → `kitchen_extra` hiện "Level 3", bấm không ăn; lên level 3 rồi mở lại → mua được.
- Lấp kín lưới → mọi món hiện "No room left", không mua được, không lỗi.
- Mua 3 cái `table_basic` liên tiếp → cả 3 nằm ở 3 ô khác nhau, không chồng nhau.
