# 04 — Food, Score & End

**Status:** BUILT (2026-09-19, backlog #9–#10 — kết thúc theo Order + màn kết thúc, `07-menu-orders.md`)
**Attaches to:** điểm và điều kiện kết thúc ván của `00-core.md`

## Overview

20 món Việt Nam (lấy từ 006) được chia thành 3 loại: Appetizer, Main, Dessert
— cột "Loại" giờ chỉ là nhãn hiển thị (`07-menu-orders.md` Rule 1), không còn
ràng buộc luật. Món càng nhiều nguyên liệu càng nhiều điểm. ~~Người đầu tiên
có món thuộc cả 3 loại kết thúc ván và nhận thưởng lớn~~ — thay bởi
`07-menu-orders.md`: người đầu tiên xong hết **Order** riêng của mình (vài
món bí mật rút từ Menu công khai của ván) kết thúc ván và nhận `ORDER_BONUS`
— nhưng người thắng vẫn là người **tổng điểm cao nhất**.

## MDA

**Mechanics** — xem Rules + bảng.

**Dynamics**

- Intended: 2 chiến lược kéo nhau — "chạy đích" (3 món rẻ nhanh + thưởng) vs.
  "ăn điểm" (ít món nhưng 4 thẻ). Người chạy đích quyết định lúc nào ván dừng.
- Intended: Dessert chỉ có 4 công thức → người chơi phải để mắt tới thẻ tráng miệng sớm.
- Degenerate: chỉ săn món 2 thẻ. Chặn bằng điểm 2 → 4 → 7 (4 món 2 thẻ + thưởng = 18 ≈ 3 món 4 thẻ = 21).

**Aesthetics**

| | |
|---|---|
| **Primary** | challenge |
| **Secondary** | none |
| **Serves the core by** | đặt giá cho "giữ hay chốt" — không có bảng điểm này, reveal sớm luôn đúng |

## Rules

1. Điểm món = `POINTS_BY_SIZE[số thẻ trong công thức]`.
2. **[KHÔNG CÒN GATE THẮNG/THUA — xem `07-` Rule 9]** ~~Người chơi "có" 1 loại
   khi đã reveal ít nhất 1 món thuộc loại đó~~ → khái niệm "đã xong" giờ tính
   theo **món trong Order**, không theo loại (`07-menu-orders.md` Rule 9).
3. **[THAY BỞI `07-menu-orders.md` Rule 10 — Kết thúc A']** ~~Kết thúc A: ngay
   sau 1 lần reveal, nếu người đó có đủ 3 loại → +`FIRST_FULL_BONUS`, ván dừng
   lập tức~~ → dừng ván ngay khi 1 người xong toàn bộ **Order** của họ,
   +`ORDER_BONUS`. `FIRST_FULL_BONUS` ngừng dùng (xem Numbers).
4. **Kết thúc B (không đổi, xem `07-` Rule 11):** tới lượt Draw mà pool rỗng →
   ván dừng, không ai nhận thưởng.
5. Xếp hạng theo tổng điểm (món + thưởng — thưởng nay là `ORDER_BONUS`,
   `07-`). Hoà điểm → đồng hạng.
6. Màn kết thúc hiện: bảng điểm từng người, món đã reveal, ai về đích, lý do
   kết thúc, **+ Order đầy đủ của từng người kèm đánh dấu xong/chưa xong**
   (`07-menu-orders.md` Rule 13).

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `POINTS_BY_SIZE[2]` | 2 | 1–3 | GUESS | món rẻ |
| `POINTS_BY_SIZE[3]` | 4 | 3–5 | GUESS | |
| `POINTS_BY_SIZE[4]` | 7 | 5–10 | GUESS | đủ lớn để đáng giữ bài |
| `FIRST_FULL_BONUS` | 10 | 5–20 | GUESS | **[không còn dùng — thay bởi `ORDER_BONUS`, `07-menu-orders.md` Numbers, cùng giá trị 10]** giữ dòng lại, số không tái sử dụng cho hằng số khác |

## Bảng món (loại = GUESS, người dùng chưa chốt)

| Món | Loại | Công thức | Thẻ | Điểm |
|---|---|---|---|---|
| Goi Cuon | Appetizer | Rice Paper, Shrimp, Herb, Vermicelli | 4 | 7 |
| Nem Ran | Appetizer | Rice Paper, Pork, Mushroom | 3 | 4 |
| Cha Gio | Appetizer | Rice Paper, Pork, Herb | 3 | 4 |
| Banh Cuon | Appetizer | Rice Flour, Pork, Mushroom | 3 | 4 |
| Banh Xeo | Appetizer | Rice Flour, Coconut Milk, Shrimp, Pork | 4 | 7 |
| Banh Mi | Appetizer | Bread, Pork, Herb | 3 | 4 |
| Pho Bo | Main | Rice Noodle, Beef | 2 | 2 |
| Bun Bo Hue | Main | Rice Noodle, Beef, Chili, Lemongrass | 4 | 7 |
| Bun Cha | Main | Vermicelli, Pork Belly, Fish Sauce, Herb | 4 | 7 |
| Com Tam | Main | Broken Rice, Pork, Fish Sauce | 3 | 4 |
| Cao Lau | Main | Rice Noodle, Pork, Herb | 3 | 4 |
| Mi Quang | Main | Rice Noodle, Shrimp, Pork, Herb | 4 | 7 |
| Hu Tieu Nam Vang | Main | Rice Noodle, Pork, Shrimp | 3 | 4 |
| Banh Canh Cua | Main | Rice Flour, Crab, Pork | 3 | 4 |
| Com Ga Hoi An | Main | Rice, Chicken, Herb | 3 | 4 |
| Chao Ga | Main | Rice, Chicken, Water | 3 | 4 |
| Che Ba Mau | Dessert | Bean, Coconut Milk, Sugar | 3 | 4 |
| Ca Phe Sua Da | Dessert | Coffee Bean, Milk, Ice | 3 | 4 |
| Xoi Gac | Dessert | Sticky Rice, Gac Fruit | 2 | 2 |
| Banh Chung | Dessert | Sticky Rice, Pork, Bean | 3 | 4 |

Công thức giữ nguyên bảng `RECIPES` trong `006` prototype (bản 2026-09-13, Banh
Chung đã bỏ Bamboo Mold). 6 Appetizer / 10 Main / 4 Dessert.

**27 loại thẻ:** Rice, Broken Rice, Sticky Rice, Rice Noodle, Vermicelli, Bread,
Rice Flour, Rice Paper, Beef, Pork, Pork Belly, Chicken, Shrimp, Crab, Herb,
Mushroom, Bean, Coconut Milk, Coffee Bean, Milk, Ice, Lemongrass, Chili, Fish
Sauce, Sugar, Water, Gac Fruit. Ảnh: `Art/Card/`, `Art/Food/`.

## Edge cases

- Reveal lại 1 món đã xong (kể cả món ngoài Order) → chỉ cộng điểm, không đổi
  trạng thái "đã xong" (`07-` Rule 9).
- Người xong Order trước nhưng điểm thấp hơn → vẫn thua; màn kết thúc ghi rõ cả 2.
- Pool rỗng khi chưa ai xong Order → Kết thúc B, xếp hạng bình thường.

## Depends on

- `02-draw-reveal.md`, `03-play-claim.md` — nơi reveal xảy ra.
- `07-menu-orders.md` — Menu/Order quyết định tập công thức khả dụng và điều
  kiện kết thúc ván (thay Rule 2–3 ở trên).

## Done when

- Điểm mỗi người hiện liên tục, đúng bảng.
- Bảng Recipes trong game hiện đủ 20 món theo loại + điểm (loại chỉ còn là nhãn hiển thị).
- Người đầu tiên xong toàn bộ Order → ván dừng ngay, +`ORDER_BONUS`, màn kết
  thúc xếp hạng đúng kèm Order từng người.
- Chạy ván tới hết pool → màn kết thúc với lý do "pool empty".
