# 08 — Hand Size & Refill (tay N thẻ + bốc bù sau khi nấu)

**Status:** BUILT (2026-09-19, backlog #12, #15 — Refill ngay sau mỗi lần thu món, xem "Sửa 2026-09-19 (3)")
**Attaches to:** chia bài (`01-card-pool-deal.md` Rule 4) và bước Check của `00-core.md` — thêm 1 bước
**Refill** chạy ngay sau mỗi lần reveal (thu món). Draw/Play/tố (`02-`, `03-`) không đổi luật.

> Từ playtest 2026-09-19 (2): *"giảm số card trên hand xuống còn N card (N có thể config) và làm thêm cơ
> chế sau khi cook xong 1 món nào đó làm số card trên hand bị giảm xuống thì user sẽ được draw sao cho đủ
> lại N card"*

> **Sửa 2026-09-19 (3)** — từ playtest: *"Flow là cook xong mà mất N thẻ thì phải được auto draw từ pool
> ra luôn thay vì phải play xong mới được draw"*. Bản gốc chạy Refill **sau Play** để chặn chuỗi
> nấu→bốc→nấu trong 1 lượt. Người dùng chọn (2026-09-19): **bốc bù ngay sau mỗi lần thu món**, chấp nhận
> chuỗi đó (xem Dynamics). Mức bốc bù là `HAND_SIZE + 1` — bằng đúng số thẻ ngay sau Draw — để sau khi
> đánh 1 thẻ tay còn đúng `HAND_SIZE`, như người không nấu. (Bản nháp trước bốc bù lên `HAND_SIZE` làm ai
> đã nấu 1 lần bị kẹt ở `HAND_SIZE − 1` mãi — đã bỏ.)

## Overview

Mỗi người bắt đầu ván với N thẻ (ít hơn 11 như trước). Nấu món làm tay mỏng đi — nhưng ngay khi bạn thu
món, tay tự bốc bù từ pool, dùng được ngay: nấu tiếp nếu ráp được, hoặc chọn thẻ để đánh. Đánh xong bạn
luôn còn đúng N thẻ, dù có nấu hay không. Nên nấu không còn là "tự làm nghèo tay mình", và nấu nhiều đồng
nghĩa với lướt pool nhanh hơn để tìm nguyên liệu cho Order.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: bỏ cái giá ngầm của việc nấu (tay teo dần → ít lựa chọn → chậm lại). Người chơi nấu khi đủ
  món, không ngại "hết bài". Quyết định "giữ hay chốt" (`02-`) vẫn còn vì điểm 2 → 4 → 7 (`04-`) không
  đổi — bốc bù chỉ trả lại **số lượng** thẻ, không trả lại **thẻ đúng loại**.
- Intended: tay nhỏ hơn → ít món ráp sẵn trong tay hơn, mỗi lá bốc/tố quan trọng hơn, đánh bài phải chọn kỹ
  hơn (không còn thừa thẻ rác để đánh an toàn).
- Intended: nấu nhiều = bốc bù nhiều = thấy nhiều thẻ pool hơn → người nấu nhanh có lợi thế tìm thẻ Order.
- Intended (mới, 2026-09-19 (3)): chuỗi "nấu → bốc bù → thẻ mới ráp được món nữa → nấu tiếp" trong cùng
  1 lượt là khoảnh khắc may mắn đáng có (sensation).
- Degenerate: chuỗi đó kéo dài, 1 người ăn sâu vào pool trong 1 lượt. **Chấp nhận** (quyết định người
  dùng). Giới hạn tự nhiên: mỗi vòng phải có đủ nguyên liệu 1 món trong Menu; chuỗi dừng khi hết món ráp
  được hoặc pool cạn. Theo dõi qua log (`refills +k` liên tiếp trong 1 lượt); chỉnh bằng `/tuning` nếu
  người test thấy lượt ai đó dài bất thường.
- Degenerate: cố tình nấu món 2 thẻ rẻ liên tục chỉ để lướt pool (đổi 2 thẻ lấy 2 thẻ mới). Chấp nhận —
  vẫn ghi điểm thấp (`04-`), và đó cũng chính là đua Order bằng món rẻ đã được `07-` cân nhắc.
- Theo dõi: pool cạn nhanh hơn vì mỗi lần nấu k thẻ rút thêm ~k thẻ khỏi pool → Kết thúc B (`04-`) có thể
  đến sớm hơn. `game-dev` in độ dài ván khi build; chỉnh bằng `/tuning`.
- Solo vs bots và online giống nhau: bốc bù tự động, không có quyết định nào cho người chơi hay bot.

**Aesthetics**

| | |
|---|---|
| **Primary** | challenge |
| **Secondary** | sensation |
| **Serves the core by** | giữ tay gọn để mỗi thẻ là 1 quyết định thật (challenge), và cái "phập" bốc bù sau khi nấu là phần thưởng nhịp nhanh (sensation) — không thay mục tiêu Order của `07-` |

## Rules

1. **Chia bài:** mỗi người được chia `HAND_SIZE` thẻ (thay `HAND_START` ở `01-` Rule 4). Cách chia không đổi.
2. **Refill — ngay sau mỗi lần thu món:** mỗi khi 1 món được reveal (`02-` Rule 4 — tự nấu, hoặc
   thắng tố `03-` Rule 5), nếu người đó **vẫn còn phải Play** trong lượt này và tay có ít hơn
   `HAND_SIZE + 1` thẻ → bốc từ đỉnh pool, lần lượt từng thẻ, đến khi đủ `HAND_SIZE + 1`. Thẻ bốc bù dùng
   được ngay (nấu tiếp, hoặc chọn để đánh). Nấu thêm món → Refill lại theo đúng luật này.
3. Mức `HAND_SIZE + 1` vì người đó còn đánh 1 thẻ: đánh xong tay còn `HAND_SIZE`, giống hệt người không nấu
   (Draw lên `HAND_SIZE + 1` rồi đánh 1). Giữa các lượt mọi người luôn có đúng `HAND_SIZE` thẻ (trừ khi pool
   cạn). Người **bị** tố mất thẻ vừa đánh không Refill — thẻ đó đã rời tay lúc Play, tay họ đã ở `HAND_SIZE`.
4. Nhờ Refill, tay rỗng sau reveal chỉ còn xảy ra khi **pool cũng cạn** — khi đó bỏ qua Play như cũ
   (`02-` Rule 8, `03-` Rule 9).
5. Tay đang có từ `HAND_SIZE + 1` thẻ trở lên → không bốc, không bỏ bớt. Không có giới hạn cứng trên tay
   (`01-` Rule 7 giữ nguyên ý).
6. Thẻ đang nằm trên stack trong vùng nấu (chưa Cook) **tính là thẻ trong tay** khi đếm (`02-` Rule 14).
7. **Pool không đủ:** bốc đến khi pool rỗng thì dừng, không lỗi. Refill **không** kích hoạt Kết thúc B —
   ván chỉ dừng khi tới bước Draw mà pool rỗng (`04-` Kết thúc B, không đổi).
8. Ván đã kết thúc (món vừa thu làm xong Order — `07-` Kết thúc A') → không Refill.
9. Refill không phải `Intent` — host tự chạy, không ai được từ chối hay chọn.

**Online / hiển thị (hidden info):**

10. Thẻ bốc bù là thẻ ẩn như thẻ Draw: chỉ ghế đó nhận loại thẻ; các ghế khác chỉ thấy số thẻ tay +k và
    pool −k. Host gửi mỗi thẻ bốc bù như 1 event bốc riêng cho đúng ghế (redaction theo `06-`).
11. Animation dùng lại đúng animation Draw (`ui/table.md`), mỗi thẻ cách nhau `REFILL_STAGGER_MS`; host
    `wait()` bằng đúng hằng số đó (pacing = animation). Log: `<Name> refills +k.`
12. Bot: không đổi luật quyết định (`05-`); bốc bù đến tự động như người thật.

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `HAND_SIZE` | 7 | 5–11 | GUESS | người dùng yêu cầu giảm từ 11 xuống N; 7 đủ giữ ~2 công thức 3–4 thẻ đang ráp dở. Sẽ ra file config riêng (ticket config) |
| `REFILL_STAGGER_MS` | 150 ms | 80–300 | GUESS | nhanh hơn Draw thường vì là bước tự động, tránh cuối lượt lê thê khi bốc 3–4 thẻ |
| `HAND_START` | — | — | — | **ngừng dùng**, thay bởi `HAND_SIZE` (không tái sử dụng tên) |

## Edge cases

- Lượt thường nấu món 4 thẻ (`HAND_SIZE` = 7): Draw → 8, nấu −4 → 4, Refill +4 → 8, Play −1 → 7.
- Không nấu gì: Draw → 8, không Refill, Play −1 → 7. Giống hệt lượt có nấu.
- Nấu 2 món liên tiếp: nấu −3 → 5, Refill +3 → 8, thẻ mới ráp được món 2 thẻ → nấu −2 → 6, Refill +2 → 8,
  Play → 7.
- Thắng tố (không Draw): tay 7 + thẻ tố → 8, nấu món −3 → 5, Refill +3 → 8, Play → 7.
- Pool còn 2 mà Refill cần bốc 4 → bốc 2, dừng, vẫn Play bình thường; lượt người kế tiếp tới Draw mà pool
  rỗng → Kết thúc B.
- Rớt mạng giữa lúc bốc bù (online): host vẫn bốc đủ cho ghế đó (bot đánh thay theo `06-`); vào lại ghế
  nhận `View` có tay đầy đủ.
- `HAND_SIZE` nhỏ hơn số thẻ của món lớn nhất trong Menu (vd `HAND_SIZE` = 3, món 4 thẻ): vẫn ráp được
  nhờ Draw + tố làm tay tạm vượt `HAND_SIZE`. Không chặn, nhưng Range tối thiểu 5 để tránh.

## Depends on

- `01-card-pool-deal.md` — số thẻ chia (Rule 4), tay không giới hạn cứng (Rule 7).
- `02-draw-reveal.md` Rule 8/14, `03-play-claim.md` Rule 1–9 — khi nào Play xong, ai Play.
- `04-food-score-end.md` Kết thúc B, `07-menu-orders.md` Kết thúc A' — không đổi, Refill tránh chạm.
- `06-online-room.md` — redaction event bốc.

## Done when

- Play vs Bots: đầu ván mỗi người đúng `HAND_SIZE` thẻ, pool đúng (tổng bộ bài − `HAND_SIZE`×số người).
- Nấu 1 món 3 thẻ → thu món xong là tay tự bốc bù ngay (trước khi đánh), log `You refill +k.`; thẻ mới kéo
  đi nấu hoặc đánh được ngay; đánh xong tay còn đúng `HAND_SIZE`.
- Không nấu gì → không bốc bù, đánh xong vẫn đúng `HAND_SIZE`.
- Thẻ bốc bù ráp được món → nấu tiếp trong cùng lượt → bốc bù lần nữa.
- Bot nấu → ghế bot số thẻ về `HAND_SIZE`, không lộ loại thẻ.
- Online 2 tab: tab khách chỉ thấy số thẻ tay của host +k, không thấy loại; pool đếm khớp ở 2 tab.
- Pool gần cạn: bốc bù dừng ở 0, ván kết thúc ở bước Draw kế tiếp theo Kết thúc B.
