# 05 — AI Player (bot test)

**Status:** BUILT (2026-09-16 (2))
**Attaches to:** thay thế người chơi thật ở các ghế còn lại, để 1 người test được luật của `00-core.md`

## Overview

MVP chỉ có 1 người thật. Các ghế còn lại là bot chơi đúng luật như người, nhìn
thấy đúng những gì người thật thấy (tay mình, món đã ngửa, đống bỏ, số thẻ pool)
— không nhìn trộm tay người khác hay pool. Bot không cần giỏi, chỉ cần **chơi
có lý** để người test cảm nhận được áp lực bị tố và bị đua về đích.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: người test đoán được "bot này đang gom Main" và thấy bot đôi khi
  giữ bài chờ món to — tức bot tạo ra đúng loại quyết định mà game muốn test.
- Degenerate: bot quá đoán trước được (luôn reveal ngay) → người test khai thác
  bot thay vì test luật. Chặn bằng luật giữ bài (Rule 2) + nhiễu nhỏ khi đánh thẻ (Rule 5).

**Aesthetics**

| | |
|---|---|
| **Primary** | challenge |
| **Secondary** | fellowship (giả lập đối thủ ngồi cùng bàn) |
| **Serves the core by** | cung cấp đối thủ để test "giữ hay chốt" và tố mà không cần tụ 4 người thật |

## Rules

Định nghĩa: `unseen(t)` = `COPIES_PER_TYPE` − số thẻ loại `t` bot nhìn thấy được
(trên tay bot + discard + mọi món đã ngửa của mọi người). `missing(R)` = các loại
trong công thức `R` mà tay bot chưa có. `needCourse(R)` = bot chưa có loại của `R`.

1. **Draw:** luôn bốc (bắt buộc).
2. **Reveal (bước Check):** lặp — trong các món ráp được, chọn món điểm cao nhất
   (hoà → ưu tiên `needCourse`). Reveal món đó **trừ khi** giữ bài:
   giữ khi tồn tại món `G` điểm cao hơn, công thức `G` chứa trọn công thức món đó,
   `missing(G)` đúng 1 loại `t` và `unseen(t) ≥ HOLD_MIN_UNSEEN`.
   Ngoại lệ: nếu reveal món đó làm bot đủ 3 loại → **luôn reveal**.
   Hết món để reveal (hoặc đang giữ mọi món còn lại) → sang Play.
3. **Claim:** khi được hỏi tố, dùng đúng quyết định của Rule 2 với món điểm cao
   nhất tố được: nếu Rule 2 sẽ reveal → tố món đó; nếu Rule 2 sẽ giữ → Pass.
4. **Play — chấm điểm từng thẻ `c` trên tay:**
   `value(c) = max` trên mọi công thức `R` có loại của `c` và mọi loại trong `missing(R)` có `unseen ≥ 1`, của
   `(số loại của R đã có trên tay / số loại của R) × điểm(R) × (needCourse(R) ? COURSE_WEIGHT : 1)`.
   Không công thức nào hợp lệ → `value = 0`. Thẻ trùng loại (bản thứ 2+ trên tay) nhân `DUPLICATE_FACTOR`.
5. Đánh thẻ có `value` thấp nhất, cộng nhiễu ngẫu nhiên `±NOISE` vào mỗi `value` trước khi so. Hoà → ngẫu nhiên.
6. **Nhịp:** mỗi hành động bot (draw, reveal, play, tố) cách nhau `AI_STEP_MS` cố định để người test theo
   kịp. Không còn nút chỉnh tốc độ Slow/Fast. (sửa 2026-09-16 (2))
7. **Log:** mọi quyết định của bot (draw, reveal/giữ, play, tố/pass) ghi vào log hành động kèm lý do ngắn
   (ví dụ `Bot 2 holds Pho Bo → waiting Lemongrass (3 unseen)`). Không còn nút lật tay bot ("Show AI
   hands") — log là cách duy nhất để người test kiểm tra quyết định của bot. (sửa 2026-09-16 (2))

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `HOLD_MIN_UNSEEN` | 2 | 1–4 | GUESS | còn ≥ 2 bản chưa lộ mới đáng chờ |
| `COURSE_WEIGHT` | 2 | 1–3 | GUESS | ưu tiên loại còn thiếu |
| `DUPLICATE_FACTOR` | 0.4 | 0–1 | GUESS | công thức chỉ cần 1 bản mỗi loại |
| `NOISE` | 0.3 | 0–1 | GUESS | tránh bot quá đoán trước |
| `AI_STEP_MS` | 900 ms | — (giá trị cố định) | GUESS | người test chơi ở mức mặc định 900ms (trước là Slow); bỏ nút Fast (sửa 2026-09-16 (2)) |

## Edge cases

- Bot giữ bài chờ `t` nhưng `t` bị lộ hết ở lượt sau → `unseen` = 0 → lượt sau Rule 2 cho reveal món nhỏ.
- Bot tay rỗng sau reveal → không Play (`02-` Rule 8).
- Người thật và bot cùng tố → quyết của bot không phụ thuộc người thật đã chọn gì (bot không thấy).

## Depends on

- `01-`, `02-`, `03-`, `04-` — bot chỉ gọi đúng những hành động người thật có.

## Done when

- Chọn 2/3/4 người → 1 người thật + 1/2/3 bot, ván tự chạy tới lượt người thật thì dừng chờ.
- Bot reveal, giữ bài, tố và đánh thẻ, mỗi quyết định hiện trong log có lý do.
- Log hành động hiện đủ mọi quyết định của bot (draw, reveal/giữ, play, tố/pass) kèm lý do — không cần
  lật tay bot để đối chiếu. (sửa 2026-09-16 (2))
- Một ván toàn bộ chạy tới màn kết thúc không kẹt.
