# 04 — Food, Score & End

**Status:** BUILT (prototype 2026-09-16)
**Attaches to:** điểm và điều kiện kết thúc ván của `00-core.md`

## Overview

20 món Việt Nam (lấy từ 006) được chia thành 3 loại: Appetizer, Main, Dessert.
Món càng nhiều nguyên liệu càng nhiều điểm. Người đầu tiên có món thuộc cả 3
loại kết thúc ván và nhận thưởng lớn — nhưng người thắng là người **tổng điểm
cao nhất**.

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
2. Người chơi "có" 1 loại khi đã reveal ít nhất 1 món thuộc loại đó.
3. **Kết thúc A:** ngay sau 1 lần reveal (tự reveal hoặc tố), nếu người đó có
   đủ 3 loại → người đó +`FIRST_FULL_BONUS`, ván dừng lập tức. Chỉ có đúng 1 người nhận thưởng.
4. **Kết thúc B:** tới lượt Draw mà pool rỗng → ván dừng, không ai nhận thưởng.
5. Xếp hạng theo tổng điểm (món + thưởng). Hoà điểm → đồng hạng.
6. Màn kết thúc hiện: bảng điểm từng người, món đã reveal, ai về đích, lý do kết thúc.

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `POINTS_BY_SIZE[2]` | 2 | 1–3 | GUESS | món rẻ |
| `POINTS_BY_SIZE[3]` | 4 | 3–5 | GUESS | |
| `POINTS_BY_SIZE[4]` | 7 | 5–10 | GUESS | đủ lớn để đáng giữ bài |
| `FIRST_FULL_BONUS` | 10 | 5–20 | GUESS | "lượng điểm lớn" theo người dùng, không tự thắng |

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

- Reveal món thứ 3 cùng loại đã có → chỉ cộng điểm, không kết thúc.
- Người về đích nhưng điểm thấp hơn → vẫn thua; màn kết thúc ghi rõ cả 2.
- Pool rỗng khi không ai có đủ 3 loại → Kết thúc B, xếp hạng bình thường.

## Depends on

- `02-draw-reveal.md`, `03-play-claim.md` — nơi reveal xảy ra.

## Done when

- Điểm mỗi người hiện liên tục, đúng bảng.
- Bảng Recipes trong game hiện đủ 20 món theo loại + điểm.
- Người đầu tiên có đủ 3 loại → ván dừng ngay, +10, màn kết thúc xếp hạng đúng.
- Chạy ván tới hết pool → màn kết thúc với lý do "pool empty".
