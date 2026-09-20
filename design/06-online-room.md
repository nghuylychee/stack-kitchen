# 06 — Online Room (PvP qua mạng)

**Status:** BUILT (2026-09-19, backlog #9 — Rule 26–27 redaction Order; các câu hỏi mở khác vẫn chờ người duyệt)
**Attaches to:** thêm 1 chế độ chơi bên cạnh MVP hiện tại (`00-core.md` +
`05-ai-player.md`), gắn ở màn hình mở đầu (trước khi vào `ui/table.md`). Luật
bài — bốc, reveal, đánh, tố, điểm, kết thúc ván — **không đổi gì**, chỉ thêm
lớp mạng phía trên.

## Overview

Màn Home có 2 lựa chọn: **Play vs Bots** (đúng gameplay hiện tại, chạy hoàn
toàn local) và **Online room** (2–4 người thật qua P2P bằng PeerJS, người tạo
phòng là **host** — chạy toàn bộ luật + bot, xử lý mọi quyết định; người còn
lại là **client**, chỉ gửi ý định (draw/reveal/play/claim...) và nhận về 1
"view" đã được ẩn thông tin — không bao giờ thấy tay người khác hay thứ tự
thẻ trong pool.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: cảm giác ngồi bàn thật — thấy tên thật, chờ người khác quyết định
  tố cùng lúc mình, tám chuyện ngoài game trong lúc chờ (fellowship). Áp lực
  tố tăng lên vì đối thủ là người, không phải bot đoán được.
- Intended: `CLAIM_WINDOW_MS` tạo nhịp căng — ai cũng phải quyết nhanh, không
  ai được "nghĩ mãi" làm bàn đứng hình.
- Degenerate: **câu giờ cả bàn** — 1 người cố tình không bấm gì để trì hoãn.
  Chặn bằng `TURN_LIMIT_MS` (Draw/Play) và `CLAIM_WINDOW_MS` (claim): hết giờ,
  bot tự làm hộ bước đó.
- Degenerate: **luôn Pass/auto-pass để giấu bài** — vì Pass không lộ gì, người
  chơi có thể luôn im lặng chờ hết giờ để đối thủ không đọc được mình đang cần
  gì. Chưa chặn triệt để (giống rủi ro "không ai tố" đã ghi ở `03-`); vì auto-
  pass và Pass chủ động nhìn giống nhau từ phía người khác, đây là hệ quả
  chấp nhận được của thiết kế tố hiện tại, không phải lỗi riêng của online.
- Degenerate: **host có lợi thế / có thể gian lận** — vì host chạy state đầy
  đủ (mọi tay bài, thứ tự pool) ngay trên máy của họ, host có thể tự xem được
  tay người khác nếu mở devtools. **Chấp nhận** — chơi giữa bạn bè quen biết,
  không có cơ chế chống gian lận nào cho MVP này.
- Degenerate: **rời phòng để tránh thua** — người sắp thua rút mạng/đóng tab.
  Chặn 1 phần: ghế đó bị bot chơi tiếp, điểm của họ vẫn được tính tới cuối ván
  (không xoá kết quả), nên rời không giúp tránh thua trên bảng điểm cuối.

**Aesthetics**

| | |
|---|---|
| **Primary** | fellowship |
| **Secondary** | challenge |
| **Serves the core by** | giữ đúng luật đấu trí của `00-core.md`/`03-`, chỉ đổi đối thủ AI thành người thật — tăng đúng phần "ngồi 1 bàn với người khác" mà bản local phải giả lập bằng bot |

## Rules

### Room & join

1. Mã phòng: 5 ký tự trong bảng `A–Z, 2–9`, bỏ ký tự dễ nhầm `0/O/1/I`. Link
   chia sẻ dạng `?room=<CODE>`.
2. Vào phòng (tạo hoặc join) yêu cầu nhập nickname 1–12 ký tự; nickname được
   nhớ local (localStorage) cho lần sau.

### Lobby

3. Host thấy danh sách ghế (2/3/4, host chọn số ghế) — mỗi ghế hiện tên người
   đã vào hoặc placeholder "Bot".
4. Join khi **mọi ghế đã có người thật** → từ chối, hiện "Room full".
5. Join khi ván **đã bắt đầu** → từ chối, **trừ khi** đó là rejoin bằng token
   đã biết của 1 ghế đang chơi (xem "Disconnect & rejoin").
6. Host bấm **Start**: ghế còn trống tại thời điểm đó được lấp bằng bot
   (`05-ai-player.md`), ván bắt đầu.

### Seat order

7. Host luôn là ghế 0; người join sau xếp theo đúng thứ tự vào phòng. Người
   bắt đầu ván được chọn ngẫu nhiên — giữ đúng luật random đã có ở `01-`/`04-`,
   không ưu tiên ghế 0.
8. Mỗi client tự render **mình luôn ở ghế `bottom`** (xoay view) — layout ghế
   dùng nguyên bảng vị trí theo chiều kim đồng hồ của `ui/table.md`, chỉ đổi
   ghế nào được coi là gốc `bottom` theo từng client.

### Claim window online

9. Sau khi 1 thẻ được đánh, **mọi người thật đủ điều kiện tố nhận prompt cùng
   lúc** (không hỏi tuần tự như hiển thị 1-người-thật của bản local). Bot
   quyết ngay và giữ kín lựa chọn (đúng luật `03-` Rule 3).
10. Cửa sổ tố đóng khi: **mọi** người thật đủ điều kiện đã Cook hoặc Pass, HOẶC
    hết `CLAIM_WINDOW_MS` (auto Pass cho ai chưa trả lời).
11. Bấm Cook **chốt (lock)** lựa chọn tố của người đó ngay lúc bấm — không đổi
    ý sau đó trong cùng cửa sổ tố này.
12. Xử lý ưu tiên/kết quả sau khi cửa sổ đóng: **không đổi**, dùng đúng Rule 4
    của `03-` (điểm món cao hơn thắng; hoà → gần nhất theo chiều kim đồng hồ
    tính từ người đánh).
13. Chế độ **Play vs Bots (offline)** giữ nguyên: không giới hạn thời gian tố,
    như `03-` Numbers hiện tại.

### Turn limit online

14. 2 mốc thời gian riêng, chỉ áp dụng online: `TURN_LIMIT_MS` cho bước Draw
    (từ lúc tới lượt tới lúc bốc) và `TURN_LIMIT_MS` cho bước Play (từ lúc bốc
    xong/Check tới lúc đánh thẻ) — cùng giá trị mặc định, 2 đồng hồ riêng.
15. Hết giờ Draw → hệ thống tự bốc hộ (như 1 bot làm bước đó).
16. Hết giờ Play → hệ thống tự đánh hộ **thẻ giá trị thấp nhất** theo đúng công
    thức chấm điểm thẻ của `05-` Rule 4.
17. Món **đã Cook nhưng chưa thu (collect)** khi hết giờ Play → tự thu hộ
    (cộng điểm) trước khi tự đánh thẻ ở Rule 16.
18. Chế độ offline: không có `TURN_LIMIT_MS`, giữ nguyên hành vi hiện tại (chờ
    người chơi vô thời hạn).

### Disconnect & rejoin

19. Client mất kết nối → ghế đó chuyển trạng thái **offline**; từ quyết định
    kế tiếp của ghế đó (draw/play/claim), bot chơi thay — dùng đúng luật của
    `05-ai-player.md`.
20. Nếu người đó đang **giữa lúc nấu (Cook)** khi mất kết nối → mẻ nấu đó vẫn
    hoàn tất và **tự thu (collect)** hộ, không huỷ.
21. Người chơi quay lại: nhập cùng mã phòng, client cũ đã lưu **token** cho
    ghế đó (trên cùng trình duyệt) → tự khôi phục quyền điều khiển ghế **từ
    quyết định kế tiếp** trở đi (không rollback quyết định bot đã làm hộ khi họ
    vắng mặt), host gửi **snapshot đầy đủ** của view đã redact cho client đó.
22. Token không hết hạn khi phòng còn sống (`RECONNECT` không có thời hạn).

### End of game & host

23. Ván kết thúc (xong Order hoặc pool cạn, `07-menu-orders.md` Rule 10–11) →
    mọi client thấy màn kết thúc giống nhau.
24. Chỉ host thấy nút **"Play again"** — bấm vào bắt đầu ván mới **cùng phòng,
    cùng ghế**; ghế nào đang là người thật đã rời (offline) thì ván mới coi
    ghế đó là bot cho tới khi họ rejoin. Client khác thấy "Waiting for host".
25. Host rời phòng (mất kết nối hoặc đóng tab) → mọi client thấy **"Host left
    — room closed"** kèm nút về Home. Đây là hạn chế đã biết và chấp nhận của
    kiến trúc P2P không có server trung gian — không có cơ chế bầu host mới.

### Order (thêm từ `07-menu-orders.md`)

26. `View` gửi cho mỗi ghế chỉ chứa Order của **ghế đó**; Order của ghế khác
    không nằm trong payload mạng trong suốt ván — cùng nguyên tắc redact tay
    bài/pool ở Rules trên, áp dụng thêm cho Order (`07-` Rule 17).
27. Payload màn kết thúc ván (Rule 23) gửi kèm Order đầy đủ **mọi ghế**, đánh
    dấu món đã xong/chưa xong (`07-` Rule 13) — trả lời câu hỏi mở #1 cũ cho
    riêng Order: bí mật trong ván, công khai lúc kết thúc, giống món đã reveal.

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| Độ dài mã phòng | 5 ký tự | — | GUESS | đủ ngắn để đọc miệng, đủ dài để tránh trùng trong nhóm nhỏ bạn bè |
| Bảng ký tự mã phòng | `A-Z2-9` trừ `0/O/1/I` | — | GUESS | tránh nhầm khi đọc/gõ tay |
| Độ dài nickname | 1–12 ký tự | 1–20 | GUESS | đủ ngắn để hiện gọn trên pod ghế |
| `CLAIM_WINDOW_MS` | 8000 ms | 5000–15000 | GUESS | đủ để đọc bài + quyết, không đủ để câu giờ cả bàn |
| `TURN_LIMIT_MS` (Draw) | 30000 ms | 15000–60000 | GUESS | Draw không cần nghĩ nhiều, chủ yếu chặn bỏ đi giữa lượt |
| `TURN_LIMIT_MS` (Play) | 30000 ms | 15000–60000 | GUESS | đủ thời gian cân nhắc reveal/giữ trước khi buộc đánh |

## Edge cases

- Người vừa mất kết nối lại đúng lúc đang là người duy nhất đủ điều kiện tố →
  cửa sổ tố vẫn đóng đúng hạn `CLAIM_WINDOW_MS` (không chờ họ), coi như họ đã
  auto Pass — ghế của họ đã chuyển sang bot theo Rule 19 nên thực chất bot
  quyết thay ngay trong cửa sổ đó nếu bot đủ điều kiện.
- 2 client cùng bấm Cook trong cùng cửa sổ tố, cả 2 hợp lệ → xử lý ưu tiên như
  offline (Rule 12); độ trễ mạng không đổi kết quả, vì thứ tự xét là điểm món
  rồi vị trí ghế, không phải ai bấm trước.
- Rejoin ngay giữa lúc bot đang thực hiện hộ 1 quyết định (ví dụ đang chạy
  progress Cook hộ) → quyền điều khiển chỉ trả lại từ quyết định **kế tiếp**
  (Rule 21), quyết định đang chạy vẫn do bot hoàn tất.
- Host bấm Start khi phòng chỉ có 1 người (chính host) → hợp lệ, các ghế còn
  lại toàn bộ là bot — tương đương chơi vs. Bots nhưng qua giao diện Online.

## Depends on

- `00-core.md`, `02-draw-reveal.md`, `03-play-claim.md`, `04-food-score-end.md`
  — toàn bộ luật bài, không đổi.
- `05-ai-player.md` — bot chơi hộ ghế offline/hết giờ, dùng đúng luật chấm
  điểm thẻ (Rule 4) khi tự đánh hộ.
- `07-menu-orders.md` — Order redact theo ghế trong ván, công khai lúc kết
  thúc (Rule 26–27 doc này).
- `ui/table.md` — layout ghế theo chiều kim đồng hồ, chỉ đổi gốc `bottom` theo
  từng client.

## Done when

- 2 trình duyệt khác nhau vào cùng 1 mã phòng, host bấm Start, chơi hết 1 ván
  đúng luật (bốc/reveal/đánh/tố/điểm/kết thúc) qua PeerJS.
- Khi 1 thẻ được đánh và ≥2 người thật cùng đủ điều kiện tố, cả 2 nhận prompt
  tố **cùng lúc**, không ai thấy lựa chọn của người kia trước khi tự quyết.
- Rút mạng 1 client giữa ván → bot chơi thay ghế đó ngay từ quyết định kế
  tiếp, ván không kẹt.
- Rejoin bằng đúng mã phòng ở cùng trình duyệt → nhận lại quyền điều khiển
  ghế cũ, thấy đúng trạng thái bàn hiện tại (không thấy tay người khác).
- Sau khi ván kết thúc, host bấm "Play again" → ván mới bắt đầu đúng cùng
  phòng, cùng ghế; client khác chỉ thấy "Waiting for host" cho tới lúc đó.
- Join vào phòng đã đủ người thật ở mọi ghế → bị từ chối với thông báo "Room
  full", không vào được với vai trò khán giả.
- Order riêng chỉ hiện đúng ghế của mình lúc đang chơi (kiểm bằng 2 tab); mọi
  ghế thấy đủ Order của nhau ở màn kết thúc (`07-`).

## Câu hỏi mở

1. **Redact chính xác cái gì?** Đề bài nói client không được thấy tay người
   khác và thứ tự pool — vậy discard pile và món đã reveal (vốn công khai ở
   bản local) có giữ công khai online không? Giả định trong doc này: **có**,
   giống local — chỉ tay bài + thứ tự pool là bí mật. Cần người dùng xác nhận.
2. **Bước Check (giữ hay reveal) không có mốc thời gian riêng** — đề bài chỉ
   cho `TURN_LIMIT_MS` ở Draw và Play. Doc này giả định Check nằm **trong**
   ngân sách thời gian của bước Play (từ lúc bốc xong tới lúc đánh thẻ). Nếu
   ý là Check cần đồng hồ riêng thứ 3, cần nói rõ.
3. **Độ trễ mạng có tính vào `CLAIM_WINDOW_MS` của người chơi không?** Nếu host
   đo giờ theo lúc **host nhận** được gói Cook (không phải lúc client bấm),
   người mạng chậm bị mất thời gian quyết thật. Doc này chưa có luật bù trễ —
   nêu ra để game-dev quyết cách đo giờ, không tự sửa luật.
4. **Host "gian lận được" có cần ghi vào `00-core.md` (Not doing) không?** Đây
   là rủi ro thật (host thấy được state đầy đủ trên máy họ), không chỉ là chi
   tiết kỹ thuật — có thể nên nêu công khai trong core doc để không ai ngỡ
   ngàng, thay vì chỉ nằm ở đây.
5. **Rejoin gắn với trình duyệt (token local), không gắn với người** — nếu
   người chơi đổi máy/trình duyệt/xoá localStorage, họ không rejoin được, dù
   biết đúng mã phòng. Chấp nhận được cho MVP bạn-bè-chơi-chung, nhưng đáng
   nói rõ đây là giới hạn có chủ đích, không phải thiếu sót.
