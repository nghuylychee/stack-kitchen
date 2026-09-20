# 03 — Play & Claim (tố)

**Status:** BUILT (2026-09-19, backlog #9 — Edge case kết thúc theo Order, `07-`)
**Attaches to:** bước 3 (Play) trong lượt của `00-core.md`

## Overview

Cuối lượt bạn đánh 1 thẻ ra giữa bàn. Người khác có thể **tố** để ăn thẻ đó nếu
thẻ đó + tay của họ ráp ra ngay 1 món. Nhiều người cùng tố thì ai ráp ra món
điểm cao hơn được ăn. Người ăn được reveal món đó, đánh 1 thẻ, và lượt chơi
nhảy sang người ngồi sau họ.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: đánh thẻ phòng thủ — tránh đánh ra loại mà đối thủ đã ngửa món
  gần giống / đang cần. Thẻ "an toàn" là thẻ đã thấy nhiều trong đống bỏ.
- Intended: tố làm **nhảy lượt** — người ngồi giữa bị mất lượt bốc, nên tố
  vừa ghi điểm vừa tăng tốc.
- Degenerate: giữ thẻ trên tay mãi không đánh để chẳng ai tố được. Không thể —
  Play là bắt buộc khi tay còn thẻ.
- Degenerate: chỉ ngồi chờ tố thay vì tự bốc. Chưa chặn; theo dõi bộ đếm tố.

**Aesthetics**

| | |
|---|---|
| **Primary** | challenge |
| **Secondary** | fellowship |
| **Serves the core by** | biến thẻ bỏ đi của mình thành rủi ro, và thẻ bỏ của người khác thành cơ hội — tạo tương tác giữa người chơi |

## Rules

1. **Play:** người chơi đang có lượt kéo 1 thẻ vào chồng bài giữa bàn để đánh — **thẻ trong tay** hoặc
   **thẻ trên cùng của 1 stack trên bàn** (thẻ đó rời stack, stack còn lại vẫn nằm trên bàn). Bắt buộc nếu
   tay còn ≥ 1 thẻ. Chỉ có thao tác kéo — không còn chạm chọn thẻ + nút Play; suốt bước Play, ô thẻ vừa
   đánh giữa bàn phát sáng làm vùng thả. (sửa 2026-09-16 (5))
2. **Cửa sổ tố:** với mỗi người chơi khác `P`, tính các món `P` ráp được từ
   (tay của `P` + thẻ vừa đánh) **mà có dùng thẻ vừa đánh**. Món không cần thẻ đó thì không tính.
3. Mỗi `P` có ít nhất 1 món như vậy được hỏi: chọn 1 món để tố, hoặc Pass.
   AI quyết theo `05-`; người thật chọn qua popup. Game dừng cho tới khi mọi `P` đủ điều kiện đã trả lời.
4. **Ưu tiên:** trong những người tố, người chọn món **điểm cao nhất** thắng.
   Hoà điểm → người ngồi **gần nhất theo chiều kim đồng hồ** tính từ người đánh.
5. Người thắng tố `W`: nhận thẻ vào tay, reveal ngay món đã chọn (luật reveal của
   `02-` Rule 4, gồm cộng điểm), rồi kiểm tra kết thúc ván (`04-`).
6. Sau đó `W` **được** reveal thêm món khác nếu tay đủ (như bước Check), rồi Play
   1 thẻ theo Rule 1 — thẻ đó lại mở cửa sổ tố mới. `W` **không** Draw.
7. Lượt kế tiếp là của người ngồi ngay sau `W` theo chiều kim đồng hồ (người ngồi giữa bị bỏ qua).
8. Không ai tố → thẻ vào discard (`01-` Rule 6); lượt chuyển sang người kế tiếp của người đánh.
9. Tay `W` rỗng sau reveal → `W` không Play; lượt sang người sau `W`.
10. Thẻ đang nằm ở discard không thể tố — chỉ thẻ **vừa đánh** mới tố được.

### Thao tác tố của người thật (sửa 2026-09-16 (3), tố bằng stack trên mặt bàn)

11. Khi được quyền tố, thẻ vừa đánh nằm giữa bàn phát sáng, kèm nút **Pass**. Người chơi kéo thẻ đó **thả
    vào vùng nấu** (mở stack, hoặc nhập vào stack đang có — `02-` Rule 9/14), rồi kéo thêm thẻ từ tay vào → theo luật
    hợp lệ của `02-` Rule 10. Khớp đúng 1 công thức → hiện Cook như `02-` Rule 11. Bấm Pass → không tố.
12. Quyết định tố của người thật được **chốt lúc bấm Cook**; ưu tiên (Rule 4) xét tại thời điểm đó với lựa
    chọn của bot (bot đã quyết trước, người thật không thấy).
13. Người thật thua ưu tiên → **huỷ nấu**: thẻ tố bay về ghế người thắng; các thẻ của người thật vẫn nằm
    nguyên trong stack đó trên bàn (mở khoá, không mất), hiện thông báo ngắn (ví dụ `Bot 2 took it — Bun
    Bo Hue 7 > 4`).
14. Người thật thắng → nấu xong, thu thẻ món như `02-` Rule 12, rồi tiếp Rule 6.
15. Thẻ tố **chưa bấm Cook** mà người chơi kéo nó ra khỏi stack, hoặc bấm Pass sau khi đã lỡ thả vào stack
    → thẻ trả về giữa bàn (không tố), stack trở lại đúng trạng thái trước khi thả thẻ tố vào.

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| Thời gian chờ quyết định tố | không giới hạn | — | GUESS | MVP 1 người thật, không cần ép thời gian |
| Độ trễ hiển thị thẻ vừa đánh trước khi xử lý tố | 500 ms | 0–1500 | GUESS | để người test kịp nhìn thấy |

## Edge cases

- Người thật vừa đủ điều kiện tố vừa là người có món điểm thấp hơn AI → vẫn được hỏi; nếu tố mà thua ưu tiên thì không mất gì, thẻ về người thắng.
- Tố xong mà xong Order (`07-menu-orders.md` Kết thúc A') → ván kết thúc ngay, `W` không Play.
- Chuỗi tố liên tiếp (W đánh ra, người khác tố tiếp) là hợp lệ, không giới hạn.

## Depends on

- `02-draw-reveal.md` — luật reveal.
- `04-food-score-end.md` — điểm món để xét ưu tiên, kết thúc ván.
- `05-ai-player.md` — AI quyết tố hay Pass.

## Done when

- Chọn 1 thẻ trên tay + Play → thẻ ra giữa bàn.
- AI đánh ra thẻ người thật tố được → thẻ phát sáng + nút Pass; kéo thả thẻ đó lên mặt bàn / 1 stack trên
  bàn, ghép đủ công thức rồi Cook để tố. (sửa 2026-09-16 (3))
- 2 người cùng tố → người có món điểm cao hơn ăn (log ghi rõ ai tố món gì, ai thắng).
- Sau khi tố, lượt nhảy đúng sang người ngồi sau người thắng.
