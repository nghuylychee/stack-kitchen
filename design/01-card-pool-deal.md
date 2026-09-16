# 01 — Card Pool & Deal

**Status:** BUILT (2026-09-16 (3))
**Attaches to:** bắt đầu ván + nguồn thẻ cho bước Draw của `00-core.md`

## Overview

Mọi thẻ trong ván nằm trong 1 bộ bài chung. Đầu ván xáo đều, chia mỗi người 11
thẻ, phần còn lại úp làm pool để bốc. Thẻ đánh ra mà không ai tố thì nằm ở
đống bỏ (discard) vĩnh viễn — không xáo lại.

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

1. Bộ bài = 27 loại nguyên liệu (danh sách ở `04-food-score-end.md`) × `COPIES_PER_TYPE` bản.
2. Đầu ván: xáo ngẫu nhiên (Fisher–Yates) toàn bộ bộ bài.
3. Chọn ngẫu nhiên người đi đầu. Thứ tự lượt theo chiều kim đồng hồ quanh bàn.
4. Chia lần lượt từng thẻ cho từng người đến khi mỗi người có `HAND_START` thẻ.
5. Phần còn lại là **pool** (úp, không ai xem được). Số thẻ còn lại hiển thị công khai.
6. Thẻ đánh ra không bị tố → vào **discard** (ngửa, ai cũng thấy). Không bao giờ quay lại pool.
7. Tay không có giới hạn cứng; kích thước tay tự điều tiết vì mỗi lượt +1 (draw) −1 (play) − thẻ reveal.
8. Tay mỗi người (kể cả bot) chỉ hiện ở ghế của mình, không có nút lật công khai; hành động của bot được
   minh hoạ qua log và chuỗi stack → Cook → thẻ món ngay tại ghế bot (`05-ai-player.md`). (sửa 2026-09-16
   (2), bỏ nút debug Show AI hands)

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `COPIES_PER_TYPE` | 4 | 3–6 | GUESS | như mạt chược; 108 thẻ |
| `HAND_START` | 11 | 7–13 | GUESS | người dùng đổi 13 → 11 (sửa 2026-09-16 (3)) |
| Số người | 2–4 | — | GUESS | người dùng chốt 2–4 |
| Pool sau chia (4 người) | 64 | — | GUESS (suy ra) | ~16 lượt bốc/người |
| Pool sau chia (2 người) | 86 | — | GUESS (suy ra) | ván 2 người dài hơn nhiều — theo dõi |

## Edge cases

- Tay đầu ván đã ráp sẵn món: được reveal ở bước Check của lượt đầu tiên của mình (`02-`).
- Pool rỗng đúng lúc 1 người cần bốc: ván kết thúc (`04-`).
- 2 người: pool rất dày, ván có thể dài — nếu playtest thấy lê thê, giảm `COPIES_PER_TYPE` cho 2 người.

## Depends on

- `04-food-score-end.md` — danh sách 27 loại thẻ.

## Done when

- Chọn 2/3/4 người → mỗi người đúng 11 thẻ, pool hiện đúng 108 − 11×N.
- Thẻ đánh ra không ai tố nằm ở đống discard, pool không tăng lại.
