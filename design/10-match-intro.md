# 10 — Match Intro (Menu + Order reveal tuần tự)

**Status:** BUILT (2026-09-19, backlog #18, #19, #20 — Rule 3 thu Menu lên `#menu-rail`, Rule 5 thu Order xuống góc phải dưới)
**Attaches to:** đầu ván, ngay sau khi Match sinh Menu (`07-menu-orders.md` Rule 1) và
Order (`07-` Rule 5), trước khi chia bài (`01-card-pool-deal.md` Rule 2–4) và trước lượt
Draw đầu tiên (`00-core.md`). Thay thế đoạn "Menu intro overlay" hiện có ở
`ui/menu-orders.md` (mục Interactions, dòng "Ván bắt đầu..." / "`#menuIntroModal` đóng...").

> Yêu cầu trực tiếp trong phiên chat (2026-09-19, không phải playtest note): rework lại
> phần đầu ván — hiện bảng tất cả món trong Menu, món hiện ra lần lượt kèm animation thay
> vì hiện hết 1 lần; sau đó hiện bảng Order riêng của người chơi đó, kèm thông tin hoàn
> thành Order để kết thúc ván ngay + nhận điểm thưởng lớn, các món trong Order cũng hiện
> ra lần lượt kèm animation.

## Overview

Mỗi ván bắt đầu bằng 2 màn giới thiệu ngắn, chạy nối tiếp nhau trước khi vào bàn chơi.
Đầu tiên, bàn "khui" lần lượt từng món trong Menu công khai của ván này — món xuất hiện
từng cái một, không hiện hết cùng lúc. Ngay sau đó, riêng bạn được xem lần lượt từng món
trong Order bí mật của mình, kèm 1 dòng nhắc rõ: nấu xong hết danh sách này thắng ván ngay
lập tức và được thưởng điểm lớn. Xong cả 2 màn, bài được chia và ván thật sự bắt đầu.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: nói rõ mục tiêu thắng ngay từ giây đầu — người chơi mới không cần đọc doc hay
  hỏi để biết "xong Order = thắng ngay + điểm lớn"; giảm rào cản học luật.
- Intended: "khui" Menu từng món trước, rồi mới lộ Order riêng ngay sau đó, tạo 2 nhịp hồi
  hộp nối tiếp (biết cả bàn có gì → biết mình phải làm gì) thay vì đọc 1 bảng tĩnh.
- Degenerate: người chơi đã thuộc luật (chơi lại nhiều ván) phải ngồi qua lại animation mỗi
  ván → làm chậm, gây khó chịu khi vào ván nhanh. Chặn bởi: tap để skip hết phần còn lại của
  từng bước, giữ đúng hành vi skip cục bộ đã có ở bản cũ (`ui/menu-orders.md` "Skip Menu
  intro cục bộ"); tổng thời lượng không-skip cũng đặt ở mức ngắn (xem Numbers).
- Theo dõi: nếu playtest thấy 2 bước liên tiếp làm ván bắt đầu chậm rõ rệt dù đã skip được,
  cân nhắc gộp lại hoặc rút ngắn bằng `/tuning`.
- Solo vs bots: overlay chỉ hiện cho ghế người thật; host vẫn `wait()` đúng tổng thời lượng
  animation trước khi mở khoá Draw đầu tiên dù chỉ 1 ghế là người (pacing đồng nhất, không
  rẽ nhánh theo mode — đúng nguyên tắc `game-code.md` "một `Match` cho cả 2 mode").
- Online: mỗi client tự dựng cả 2 bước từ `View` của đúng ghế mình; bước Order khác nội
  dung giữa các ghế (Rule 6) nhưng không đồng bộ qua mạng việc ai đã xem/skip xong — giống
  hệt cơ chế skip cục bộ đã có.

**Aesthetics**

| | |
|---|---|
| **Primary** | discovery |
| **Secondary** | sensation |
| **Serves the core by** | chuẩn bị tâm thế trước khi vào core loop (challenge) mà không cạnh tranh với nó — đây là màn mở đầu 1 lần/ván, không lặp lại trong lượt chơi; khoảnh khắc biết Order riêng của mình lần đầu (discovery) được nhấn bằng nhịp animation từng món (sensation) |

## Rules

1. **Trình tự đầu ván:** sau khi Menu (`07-` Rule 1) và Order (`07-` Rule 5) được sinh,
   chạy tuần tự **Bước A** rồi **Bước B** dưới đây, trước khi chia bài (`01-` Rule 2–4) và
   trước lượt Draw đầu tiên. Không có bước nào chạy song song.
2. **Bước A — Menu reveal (công khai, giống nhau mọi ghế):** hiện 1 overlay liệt kê
   `MENU_SIZE` món của Menu ván này. Món hiện ra **lần lượt từng cái một**, cách nhau
   `MENU_ITEM_REVEAL_MS`, kèm animation pop-in — không hiện hết cùng lúc như bản cũ. Người
   chơi có thể tap bất kỳ đâu trong overlay để **skip cục bộ**: hiện ngay lập tức toàn bộ
   món còn lại của Bước A (không huỷ luôn cả Bước B).
3. Sau khi món cuối cùng của Menu hiện xong (do chạy hết hoặc do skip) → giữ nguyên toàn bộ
   Menu hiển thị đủ thêm `MENU_HOLD_MS` để đọc lướt, rồi **thu Menu lên dải `#menu-rail` ở
   trên cùng** (sửa 2026-09-19, yêu cầu trong chat: *"bảng tổng hợp các món trong pool lúc
   tắt thì diễn các món bay lên... ở trên top"*): khung overlay mờ dần, từng ảnh món bay +
   thu nhỏ về đúng ô của nó trong `#menu-rail`, mỗi món `MENU_LAND_MS`, so le
   `MENU_LAND_STAGGER_MS`; ảnh chạm tới thì ô đó hiện. Xong hết → Bước B.
4. **Bước B — Order reveal (riêng từng ghế, bí mật):** hiện 1 overlay khác (không phải cùng
   overlay Bước A), liệt kê `ORDER_SIZE` món trong Order của **chính ghế đang xem** — rút từ
   Menu vừa hiện ở Bước A. Đi kèm 1 dòng text cố định, in-game text tiếng Anh, diễn giải lại
   `07-` Rule 8 + Rule 10 thành câu người chơi hiểu ngay không cần đọc số luật, ví dụ: *"Cook
   every dish on this list to end the match instantly and score a big bonus. You can still
   cook anything else on the Menu for points."* Món trong Order cũng hiện ra **lần lượt từng
   cái một**, cách nhau `ORDER_ITEM_REVEAL_MS`, animation pop-in riêng biệt với Bước A (khác
   ít nhất 1 thuộc tính thị giác — màu/tông overlay hoặc icon — để không nhầm 2 bước, chi
   tiết animation do `game-dev`/`artist` chọn). Tap bất kỳ đâu để skip cục bộ y hệt Bước A.
5. Sau khi món cuối Order hiện xong (chạy hết hoặc skip) → giữ đủ trên màn thêm
   `ORDER_HOLD_MS`, rồi **thu Order xuống bảng góc phải dưới** (sửa 2026-09-19, yêu cầu trong
   chat: *"list order của người chơi sau khi tắt thì diễn animation thu xuống thành bảng bên
   phải dưới"*): khung overlay mờ dần, từng ảnh món bay + thu nhỏ từ vị trí trong overlay về
   đúng dòng tương ứng của `#my-order` (`#my-panel`, góc phải dưới), mỗi món mất
   `ORDER_LAND_MS`, món sau xuất phát trễ hơn món trước `ORDER_LAND_STAGGER_MS`; ảnh chạm tới
   thì dòng đó hiện ra kèm 1 nhịp sáng. Xong hết → chia bài (`01-`) và Draw đầu tiên.
6. Menu và Order tiếp tục hiển thị **thường trực** trong suốt ván ở đúng vị trí đã có
   (`ui/menu-orders.md` `#menu-rail`, `#my-order`). Mỗi zone chỉ có đúng 1 animation thu vào
   (Rule 3 cho `#menu-rail`, Rule 5 cho `#my-order`) — không pop-in thêm lần nào nữa.
7. Bước A chạy đúng 1 lần/ván, nội dung giống nhau ở mọi ghế. Bước B chạy đúng 1 lần/ván
   nhưng nội dung khác nhau theo từng ghế (Order riêng) — mỗi client tự dựng Bước B từ
   `View` của ghế mình.
8. **Host pacing:** `Match.start()` `wait()` đúng tổng thời lượng chạy-hết-không-skip của cả
   Bước A và Bước B (theo đúng các hằng số ở Numbers) trước khi mở khoá Intent Draw đầu
   tiên — bất kể ghế đó có tap skip cục bộ hay không, vì skip chỉ là hành vi UI, không phải
   `Intent` gửi lên host (đúng nguyên tắc "host pacing = client animation", `game-code.md`).
9. **Rejoin giữa ván (online, `06-online-room.md`):** không phát lại Bước A/B — ghế vào lại
   nhận `View` đầy đủ ở trạng thái hiện tại của ván, vào thẳng bàn chơi (giữ đúng hành vi đã
   có ở `ui/menu-orders.md` "Rejoin giữa ván").
10. **Play again** (`06-` Rule 24): Menu/Order mới được sinh → chạy lại đủ Bước A + B từ
    đầu, giống hệt ván đầu.

**Online / hiển thị (hidden info):**

11. Bước A: dữ liệu Menu công khai (`07-` Rule 14) — mọi ghế nhận đúng cùng danh sách,
    không có khác biệt theo ghế.
12. Bước B: chỉ `View` của đúng ghế đó chứa Order của ghế đó ở bước này; không có payload
    nào mang Order ghế khác (giữ nguyên `07-` Rule 17 / `06-` redaction — không đổi gì thêm
    so với luật đã có, chỉ đổi thời điểm và cách hiển thị).
13. Bot: không có overlay (không phải UI cho bot); host vẫn chạy đủ `wait()` Rule 8 dù ghế
    người chơi là ghế duy nhất cần xem — không rẽ nhánh theo số ghế người thật.

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `MENU_ITEM_REVEAL_MS` | 220 ms | 120–400 | GUESS | đủ thấy từng món pop-in rõ ràng; `MENU_SIZE` tối đa 10 (4 người, `07-`) vẫn xong dưới ~2s |
| `MENU_HOLD_MS` | 900 ms | 500–1500 | GUESS | thời gian đọc lướt cả bảng sau khi món cuối hiện xong, trước khi chuyển Bước B |
| `ORDER_ITEM_REVEAL_MS` | 280 ms | 150–450 | GUESS | Order là mục tiêu thắng riêng, chậm hơn Menu 1 chút để nhấn; `ORDER_SIZE` tối đa 5 vẫn xong dưới ~1.4s |
| `ORDER_HOLD_MS` | 1400 ms | 800–2000 | GUESS | dài hơn `MENU_HOLD_MS` vì có thêm câu giải thích luật thắng cần đọc |
| `MENU_LAND_MS` | 500 ms | 300–800 | GUESS | quãng bay lên rail ngắn hơn quãng xuống góc phải dưới nên nhanh hơn `ORDER_LAND_MS` 1 chút |
| `MENU_LAND_STAGGER_MS` | 40 ms | 0–100 | GUESS | Menu tới 10 món — so le nhỏ hơn Order để 10 món chỉ thêm ~0,36s |
| `ORDER_LAND_MS` | 550 ms | 350–800 | GUESS | đủ để mắt theo được ảnh bay về góc phải dưới, không kéo dài phần mở đầu |
| `ORDER_LAND_STAGGER_MS` | 70 ms | 0–150 | GUESS | so le nhẹ để thấy từng món "rơi" vào dòng của nó; 5 món thêm ~0,3s |

**Thay thế hằng số cũ ở `ui/menu-orders.md`:** `MENU_REVEAL_MS` (2600ms, đóng khối tĩnh 1
lần) và `MENU_ITEM_POP_MS` (120ms, pop-in `#menu-rail` sau khi modal đóng) không còn mô tả
đúng flow — animation từng món giờ nằm trong chính Bước A/B, không lặp lại khi vào
`#menu-rail`/`#my-order` (Rule 6). Cần gỡ 2 hằng số cũ khi cập nhật doc UI (xem Depends on).

## Edge cases

- `MENU_SIZE` hoặc `ORDER_SIZE` nhỏ nhất (2 người: 6 và 3) → Bước A/B chạy rất ngắn
  (~1.3s và ~0.8s không tính hold), vẫn đủ animation, không bị "giật" vì quá ít món.
- Tap skip ngay lập tức khi Bước A vừa bắt đầu (món đầu tiên chưa kịp hiện) → hiện đủ toàn
  bộ Menu ngay, coi như đã "chạy hết" cho mục đích Rule 3 (vẫn giữ đủ `MENU_HOLD_MS`).
- Rớt mạng đúng lúc đang ở Bước A/B (online): không có `Intent` nào gắn với 2 bước này, nên
  không có state để mất — ghế đó vào lại theo Rule 9 (bỏ qua overlay, vào thẳng bàn).
- Resize / tab blur trong lúc Bước A/B đang chạy: áp dụng đúng hành vi đã có ở
  `ui/menu-orders.md` "Interruptions" cho `#menuIntroModal` (modal căn giữa lại theo
  viewport mới; tab blur tạm dừng đếm giờ, resume khi visible lại) — không cần luật mới,
  chỉ áp dụng cho cả 2 overlay thay vì 1.
- Order trùng món với Menu vị trí đầu/cuối (không phải edge case thật — Order luôn là tập
  con của Menu theo `07-` Rule 5, nên mọi món trong Bước B chắc chắn đã xuất hiện ở Bước A).

## Depends on

- `07-menu-orders.md` Rule 1, 5, 8, 10, 14, 17 — nguồn Menu/Order, luật thắng được diễn
  giải lại thành câu ở Rule 4, redaction Order theo ghế.
- `01-card-pool-deal.md` Rule 2–4 — chia bài chạy ngay sau khi overlay đóng (Rule 5).
- `06-online-room.md` — rejoin giữa ván (Rule 9), Play again (Rule 10), pacing host chung
  nguyên tắc `wait()`.
- `ui/menu-orders.md` — **cần cập nhật** mục Interactions ("Ván bắt đầu...", "`#menuIntroModal`
  đóng..."), Numbers (`MENU_REVEAL_MS`, `MENU_ITEM_POP_MS` — xem Numbers ở trên), và có thể
  cần khai báo overlay Bước B như 1 element mới (hiện `#my-order` chỉ pop-in tại chỗ trong
  `#my-panel`, chưa có overlay riêng dạng modal). Đã đánh dấu các dòng cũ là "THAY bởi 10-" ở
  `ui/menu-orders.md` và `ui/table.md` (2026-09-19, #18); overlay Bước B = `#orderIntroModal`.

## Done when

- Play vs Bots: vào ván mới, thấy Menu hiện lần lượt từng món (không hiện hết 1 lần), giữ
  đủ `MENU_HOLD_MS`, từng món bay + thu nhỏ lên đúng ô của `#menu-rail`, rồi tự chuyển sang màn Order của mình hiện lần lượt từng món kèm câu
  giải thích luật thắng, giữ đủ `ORDER_HOLD_MS`, rồi từng món bay + thu nhỏ về đúng dòng của
  `#my-order` ở góc phải dưới, rồi vào bàn chơi với bài đã chia.
  Log/console không có lỗi.
- Tap skip ở Bước A → hiện đủ Menu ngay, vẫn chuyển đúng sang Bước B (không bị nhảy cóc
  luôn vào bàn chơi).
- Tap skip ở Bước B → hiện đủ Order ngay, vẫn vào bàn chơi đúng nhịp.
- Online 2 tab: cả 2 tab thấy đúng cùng nội dung Menu ở Bước A, cùng lúc; ở Bước B mỗi tab
  chỉ thấy Order của chính ghế mình, không tab nào thấy Order tab kia — kiểm bằng đọc DOM
  hoặc `View` network log.
- Rejoin giữa ván (online) → không phát lại Bước A/B, vào thẳng bàn chơi ở trạng thái hiện
  tại.
- Play again → chạy lại đủ Bước A + B với Menu/Order mới sinh.
