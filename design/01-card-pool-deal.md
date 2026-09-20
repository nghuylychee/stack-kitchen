# 01 — Card Pool & Deal

**Status:** BUILT (2026-09-19, backlog #9 — pool theo Menu, `07-menu-orders.md`)
**Attaches to:** bắt đầu ván + nguồn thẻ cho bước Draw của `00-core.md`

## Overview

Mọi thẻ trong ván nằm trong 1 bộ bài chung. Đầu ván xáo đều, chia mỗi người `HAND_SIZE`
(7) thẻ (`08-hand-refill.md`), phần còn lại úp làm pool để bốc. Thẻ đánh ra mà không ai tố thì nằm ở
đống bỏ (discard) vĩnh viễn — không xáo lại. Từ `07-menu-orders.md`: bộ bài
giờ chỉ gồm nguyên liệu phục vụ **Menu** của ván đó, không phải toàn bộ 27
loại — xem Rule 1.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: vì mỗi loại chỉ có 4 bản, người chơi đếm thẻ đã lộ (món ngửa + đống
  bỏ) để biết món nào còn khả thi.
- Degenerate: ôm khư khư thẻ nghẽn (Pork) không đánh ra để chặn người khác.
  Chấp nhận — đó là 1 dạng đọc bài; tay có giới hạn thực tế vì mỗi lượt phải
  đánh 1 thẻ.

**Aesthetics**

| | |
|---|---|
| **Primary** | challenge |
| **Secondary** | none |
| **Serves the core by** | tạo khan hiếm có thể đếm được, biến "giữ hay đánh" thành quyết định có thông tin |

## Rules

1. **[THAY BỞI `07-menu-orders.md` Rule 2]** ~~Bộ bài = 27 loại nguyên liệu ×
   `COPIES_PER_TYPE` bản~~ → bộ bài chỉ gồm các loại nguyên liệu **có mặt
   trong công thức của Menu** sinh ra đầu ván (`07-` Rule 1–2), mỗi loại
   `COPIES_PER_TYPE_MENU` bản. Số loại trong bộ bài đổi theo Menu mỗi ván,
   không còn cố định 27.
2. Đầu ván: xáo ngẫu nhiên (Fisher–Yates) toàn bộ bộ bài.
3. Chọn ngẫu nhiên người đi đầu. Thứ tự lượt theo chiều kim đồng hồ quanh bàn.
4. Chia lần lượt từng thẻ cho từng người đến khi mỗi người có `HAND_SIZE` thẻ (`08-hand-refill.md` Rule 1).
5. Phần còn lại là **pool** (úp, không ai xem được). Số thẻ còn lại hiển thị công khai.
6. Thẻ đánh ra không bị tố → vào **discard** (ngửa, ai cũng thấy). Không bao giờ quay lại pool.
7. Tay không có giới hạn cứng; cuối lượt bốc bù về `HAND_SIZE` (`08-hand-refill.md`).
8. Tay mỗi người (kể cả bot) chỉ hiện ở ghế của mình, không có nút lật công khai; hành động của bot được
   minh hoạ qua log và chuỗi stack → Cook → thẻ món ngay tại ghế bot (`05-ai-player.md`). (sửa 2026-09-16
   (2), bỏ nút debug Show AI hands)

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `COPIES_PER_TYPE` | 4 | 3–6 | GUESS | **[không còn dùng để dựng pool — thay bởi `COPIES_PER_TYPE_MENU`, `07-menu-orders.md`]** giữ lại làm tư liệu cũ (108 thẻ, như mạt chược) |
| `HAND_START` | — | — | — | **ngừng dùng** — thay bởi `HAND_SIZE` (7) ở `08-hand-refill.md` |
| Số người | 2–4 | — | GUESS | người dùng chốt 2–4 |
| Pool sau chia | không còn cố định | — | GUESS | phụ thuộc Menu sinh mỗi ván (`07-` Rule 2 + Numbers `COPIES_PER_TYPE_MENU`); 2 dòng số cũ (64/86 dựa trên 27 loại × 4) không còn đúng |

## Edge cases

- Tay đầu ván đã ráp sẵn món: được reveal ở bước Check của lượt đầu tiên của mình (`02-`).
- Pool rỗng đúng lúc 1 người cần bốc: ván kết thúc (`04-`).
- 2 người: pool có thể vẫn dày tuỳ Menu — nếu playtest thấy lê thê, giảm
  `COPIES_PER_TYPE_MENU` cho 2 người (`07-` "Theo dõi khi build").

## Depends on

- `04-food-score-end.md` — danh sách 27 loại thẻ, 20 món gốc.
- `07-menu-orders.md` — Menu quyết định tập loại nguyên liệu thực tế trong bộ bài (Rule 1–2).

## Done when

- Chọn 2/3/4 người → mỗi người đúng `HAND_SIZE` thẻ, pool hiện đúng (tổng
  thẻ bộ bài theo Menu, `07-` Rule 2) − `HAND_SIZE`×N.
- Thẻ đánh ra không ai tố nằm ở đống discard, pool không tăng lại.
