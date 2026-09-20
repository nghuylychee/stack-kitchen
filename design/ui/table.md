# UI — Table (màn chơi duy nhất)

**Status:** BUILT (2026-09-19, backlog #22 — Tuning pass (9): nút `COOK` hiện ngay giữa, gập quạt đúng lúc, thả theo tâm thẻ)
**Purpose:** đây là toàn bộ trải nghiệm chơi — bốc thẻ, quyết định giữ hay ráp
món, đánh thẻ, và canh tố đối thủ — tất cả diễn ra trên 1 màn hình bàn trà đá
duy nhất, không rời màn nào khác trong suốt 1 ván.
**Reached from:** app load (tự deal ngay) · **Leads to:** không màn nào khác —
overlay Menu / End-of-game / Log drawer đều nổi trên chính màn này.

## Tuning pass 2026-09-19 (9) — nút Cook hiện ngay giữa, gập quạt đúng lúc, thả theo tâm thẻ

Theo yêu cầu người dùng 2026-09-19: *"lúc ghép đủ nguyên liệu lại button cook
hiện ra bị delay và bị lệch phải 1 xíu xong mới căn đúng giữa"*, *"Lúc cook
xong thì có đôi khi anim đóng quạt lại không chạy liền mà delay tầm 0.5-1
giây"*, *"lúc card nó đang nghiêng ngả chưa nằm thẳng thì thả ra sẽ không
detect đúng"*.

- **Nút `COOK`:** hiện ngay khi thẻ cuối được thả vào stack, đúng giữa mép dưới
  stack từ khung đầu tiên, pop-in (scale 0.6→1.1→1) chạy **một lần**. Nút giữ
  nguyên qua các lần vẽ lại, chỉ cập nhật vị trí.
- **Gập quạt đúng lúc:** quạt bắt đầu gập ngay khi thanh progress chạy hết
  `COOK_MS`, cả khi nấu thường lẫn khi **tố thắng** (trước đây tố thắng phải
  chờ host báo `reveal`, trễ ~`T.fanClose` + 300 + `T.collect`). Mỗi stack chỉ
  gập 1 lần dù có 2 nguồn yêu cầu.
- **Điểm thả = tâm thẻ đang vẽ:** thẻ kéo được vẽ lệch −20/−40px so với con
  trỏ, người chơi ngắm bằng thẻ chứ không bằng con trỏ. Khi buông: xét **tâm
  thẻ** trước, rồi mới đến con trỏ, rồi mới lần ngược đường kéo `FLING_MS`
  (luật vẩy thẻ bên dưới giữ nguyên). Viền sáng/`play-hot` khi đang kéo dùng
  đúng điểm này, nên vùng nào đang sáng thì buông ra sẽ vào vùng đó.

## Tuning pass 2026-09-19 (8) — nút Cook chỉ ghi "COOK", đóng quạt gom về thẻ giữa

Theo yêu cầu người dùng 2026-09-19: *"Button cook lúc ghép các món lại chỉ dùng
1 chữ COOK thôi thay vì để tên và điểm"* và *"Anim lúc nấu ăn xong phải gom vô
card ở giữa thay vì card ở đầu, hiện tại có xu hướng bị giật giật sang bên
trái… muốn thấy rõ hơn hiệu ứng giống đóng quạt lại"*. Phần này **thay** nhãn
nút `Cook <Dish> +N` ở mọi chỗ trong doc, và thay animation đóng quạt của
Tuning pass (4).

- **Nút Cook:** nhãn chỉ còn `COOK` (không tên món, không điểm). Vị trí, cỡ
  (≥44×44), điều kiện hiện giữ nguyên. Tên món + điểm vẫn có ở `title` (hover)
  và hiện ra khi thẻ món pop-in.
- **Đóng quạt:** hết `COOK_MS`, **từng thẻ** nguyên liệu trượt ngang về vị trí
  của thẻ giữa quạt, đồng thời xoay về 0° và hạ về cùng độ cao — như gập quạt
  giấy lại. Nhóm stack không di chuyển (trước đây scale cả nhóm làm mất toạ độ
  → giật sang trái). Cuối pha gập, chồng thẻ đã gập co nhẹ (squash) rồi khói +
  thẻ món pop-in đúng ở tâm đó (tâm thẻ món = tâm thẻ giữa quạt).
- `T.fanClose` 260 → **450ms** (GUESS) để thấy rõ động tác gập. Host dùng cùng
  hằng số này để chờ bot nấu, nên pacing tự khớp.

## Tuning pass 2026-09-19 (7) — info panel + món đã nấu ra 2 góc bàn, bỏ Restart/Menu/Log

Theo playtest 2026-09-19 (3): *"Các món người chơi chính đã nấu được bỏ ra khỏi box info đi vì không đủ
chỗ rồi, thay vào đó đặt ở bên góc trái dưới của bàn play"*, *"Dời box info của player chính ra bên góc
phải dưới"*, *"Bỏ button restart, menu, log"*. Giải quyết đúng vấn đề đã ghi ở ticket #10: `#my-foods`
gần như không còn chỗ khi `ORDER_SIZE` cao (3-4 người).

- **`#my-panel` tách làm 2 khối độc lập**, không còn chung 1 cột trong dock của `.seat[bottom]`:
  - `#my-panel` (thu gọn) — chỉ còn head1 (tên+điểm) + head2 (số thẻ úp) + `#my-order`. Dời sang **góc
    phải dưới**: cột phải của dock, bám đáy. Chiều cao co theo đúng nội dung (không còn phải chứa
    `#my-foods`), không cuộn.
  - `#my-foods` (tách khỏi `#my-panel`, thành hộp riêng) — danh sách món đã nấu. Đặt **trên mặt bàn, góc
    trái dưới của tấm bàn** (`#alu-table`), không phải góc màn hình — sửa 2026-09-19 theo ảnh chụp người
    dùng khoanh vùng: *"ý tôi đặt món ăn trên bàn khu vực này nè"*. Hộp nằm trong mép bàn, phía trên quạt
    tay, không đè quạt/vùng nấu/ghế. Vẫn là nơi *duy nhất* nhận thẻ món đã nấu xong (kéo hoặc tap từ
    `.hand-fan`), cuộn dọc nếu tràn như cũ — chỉ đổi vị trí, không đổi hành vi.
  - Dock còn 2 cột `.hand-fan` | `#my-panel` (`#my-foods` đã lên mặt bàn). `.hand-fan` giữ nguyên ở giữa, tâm quạt vẫn tính theo `#alu-table`/`#hand-fan` (Tuning pass (4)),
    không phụ thuộc `#my-panel`/`#my-foods` nằm đâu — không cần sửa logic căn giữa.
- **Bỏ 3 nút ở `#hud`:** `Restart`, `Menu` (mở `#recipeModal` xem chi tiết công thức — **không phải**
  `#menu-rail`, dải Menu công khai vẫn hiện nguyên suốt ván), `[Log ▸]`. Không còn cách nào mở lại
  `#recipeModal`/`#log-drawer` trong lúc chơi → bỏ luôn 2 overlay này khỏi DOM. `#hud` còn tên game,
  `#cTurn`, chip phòng/đồng hồ (online) và nút `Home`.
  - Hệ quả chấp nhận: lý do quyết định của bot (`why` trong log, vd "feeds rivals", "claims to deny") mất
    hết chỗ hiển thị cho người chơi — host vẫn gửi log message như cũ (không đổi `05-`/`match.ts`), chỉ
    không còn UI nào đọc. Nếu sau này cần lại, thêm lại `[Log ▸]`, không cần đổi luật.
  - Restart giữa ván: về `Home` rồi chơi lại (hoặc tải lại trang). Sau khi ván kết thúc, `Play again` ở `#endModal`
    (không phải nút `Restart` ở `#hud`) không đổi, vẫn khởi động lại ván mới.

## Tuning pass 2026-09-19 (6) — gộp Menu & Orders

Áp dụng theo `design/ui/menu-orders.md` (AGREED 2026-09-19, xem mục "Quyết
định của người duyệt" ở đó cho lý do từng số). Đây là bản tóm tắt zone-by-zone
đã gộp vào file này — chi tiết đầy đủ (Elements/Interactions/Online
states/Numbers của riêng Menu & Order) **vẫn sống ở `menu-orders.md`**, không
lặp lại ở đây.

- **`#menu-rail` (MỚI)** — hàng ngang 100vw×64px, chen giữa `#hud` và
  `#table-surface`, hiện danh sách Menu công khai của ván (N món, N =
  `MENU_SIZE` 6/8/10 theo 2/3/4 người). `#table-surface` co lại còn
  `100vh − 56px − 64px`; mọi anchor % của ghế/`#center-play` không đổi số
  (chỉ đổi vùng pixel áp lên).
- **`Menu` (đổi nhãn từ `Recipes`, giữ id `#btnRecipes`)** — mở `#recipeModal`
  nay chỉ liệt kê đúng N món Menu của ván, không còn cả 20 món. **[BỎ ở Tuning
  pass (7)]** cùng nút này và `#recipeModal` — xem mục đó.
- **`#my-h2` (huy hiệu A/M/D) bị bỏ** khỏi `#my-panel` và khỏi `.seat-head`
  mọi ghế đối thủ — thay bằng `#my-order` (MỚI, trong `#my-panel`): N hàng
  `.order-row` theo `ORDER_SIZE` (3/4/5 theo 2/3/4 người), không cuộn, chỉ
  hiện Order của chính ghế đang xem. Dock `.seat[bottom]` giữ nguyên
  `clamp(210px,30vh,240px)` — `#my-foods` có thể cuộn sớm hơn khi
  `ORDER_SIZE` cao.
- **`.hand-fan` có thêm 1 state cộng thêm:** badge `order-need` tím tĩnh góc
  trên-trái, chỉ trên thẻ trong tay của chính người chơi, khi loại đó phục vụ
  ≥1 hàng Order chưa xong.
- **`#endModal`/`#endBox`, cột "Courses"** → cột **"Order"**: N thẻ món thu
  nhỏ 32×32 kèm tick xong/chưa, cho mọi người chơi (Order hết bí mật lúc
  này); thêm nhãn "Finished order first" cho người xong Order đầu tiên; tiêu
  đề lý do kết thúc đổi theo Kết thúc A'/B của `07-menu-orders.md`.
- **Deal đầu ván** đổi thứ tự: `#menuIntroModal` (mới, giới thiệu N món Menu)
  → pop-in `#menu-rail` + `#my-order` → deal chạy như cũ (không đổi cách
  chạy, chỉ đổi thời điểm bắt đầu).

## Tuning pass 2026-09-16 (5) — vùng nấu nhỏ 1 stack, bỏ nút Play → ô đánh phát sáng

Theo yêu cầu người dùng 2026-09-16 (5): "Vùng kéo thẻ vô để cook nhỏ thôi không bao hết chiều dài bàn…
vì chỉ cho phép cook 1 món 1 lúc… nằm ở giữa so với chiều ngang của bàn" và "flow nhấn vào card rồi hiện
button play card đó ko cần thiết, thay vào đó nên highlight vùng trên bàn chơi… drag thẻ vào đó". Thay
phần mâu thuẫn trong Tuning pass (4) và (3).

- **`#prep` = vùng nấu nhỏ:** rộng cố định `250px` (vừa quạt 4 thẻ 196px + lề), căn giữa ngang bàn,
  chiều dọc giữ như cũ (ngay dưới `#center-play`, trên quạt tay). Chỉ nhận thả trong vùng này (+16px
  lề bắt); thả chỗ khác trên bàn → thẻ bật về.
- **1 stack duy nhất**, nằm giữa vùng. Thả thẻ vào bất kỳ đâu trong vùng khi đã có stack → nhập vào stack
  đó (sai công thức → bật về + rung + toast). Bỏ cơ chế slot trái/phải của Tuning pass (4).
- **Hiển thị vùng nấu:** không viền khi rảnh. Khi đang kéo 1 thẻ nguyên liệu → viền gạch vàng đậm
  `3px rgba(184,132,30,.75)` + nền vàng 10%; khi con trỏ nằm trong vùng → viền liền, nền 24%. Lần đầu
  chưa có stack, tooltip giữa vùng: "Stack here to cook".
- **Bỏ chạm chọn thẻ + nút `Play <thẻ>`.** Đánh thẻ chỉ bằng kéo vào `#center-play`.
- **Ô đánh (`#last-slot`) phát sáng suốt bước Play** (khi chưa có thẻ vừa đánh): viền gạch `3px #c8922a`,
  nền vàng 8%, nhịp sáng 1.3s; nhãn đổi "Last played" → **"Drag here to play"**. Con trỏ kéo thẻ vào
  `#center-play` → ô đổi viền liền + glow mạnh. Chạm 1 thẻ trên tay (không kéo) → ô đánh nháy 1 vòng
  sáng 0.45s để chỉ chỗ.

## Tuning pass 2026-09-16 (4) — quạt tay căn giữa bàn, stack trên bàn xoè ngang, đổi tên Stack Kitchen

Theo playtest 2026-09-16 (3): "Hand dời xích qua bên trái xíu cho nằm giữa bàn",
"lúc đánh ra xong lúc nào cũng phải căn hand ở giữa bàn", đổi tên game thành
**Stack Kitchen**, và stack để nấu trên bàn đổi từ chồng dọc sang **quạt cong
nằm ngang**, kèm animation "đóng quạt lại rồi biến ra thành food card" lúc
nấu xong. Phần này **thay** phần liên quan trong Tuning pass (3) ở mọi chỗ
mâu thuẫn.

- **Tên hiển thị:** "Kitchen Mahjong" → **"Stack Kitchen"** ở tiêu đề tab,
  HUD, `README.md`, hub `index.html`. Slug thư mục `007-kitchen-mahjong` và
  các file thiết kế giữ nguyên (ID slot cố định, không đổi tên thư mục).
- **Quạt tay căn theo tâm bàn, không căn theo hộp chứa của chính nó:** cột
  `#my-panel` chiếm phần trái của dock, nên căn giữa quạt bài theo bề rộng
  container của chính nó (như tuning pass (3)) làm quạt lệch phải mắt nhìn.
  Sửa: đọc `left+width/2` của `#alu-table` và `#hand-fan`, tính tâm bàn
  trong hệ toạ độ của `#hand-fan`, lấy đó làm tâm quạt: `x0 = clamp(tableCenter
  − total/2, 0, fanWidth − total)`. Tính lại ở **mọi lần render** (bốc, đánh,
  reveal, resize) nên quạt tự căn giữa bàn ngay sau khi đánh ra 1 thẻ, không
  cần xử lý riêng.
- **Stack trên bàn (`#prep`) đổi từ chồng dọc sang quạt cong nằm ngang:** mỗi
  stack là 1 quạt mini kiểu quạt tay (thẻ 76×106px, so le ngang `40px`/thẻ,
  nghiêng `±6°`/thẻ từ tâm, hơi vồng xuống ở 2 đầu — cùng ngôn ngữ hình với
  quạt tay chính, không còn kiểu chồng dọc lộ dải đầu 16px của Tuning pass (3)).
- **Vị trí nhiều stack cùng lúc — "slot" quanh tâm bàn:** mỗi stack mới mở
  (kéo thẻ vào ô trống) được gán 1 slot cố định theo thứ tự tạo, ánh xạ
  slot→độ lệch ngang: slot 0 → tâm bàn (`0`), slot 1 → `+230px`, slot 2 →
  `−230px`, slot 3 → `+460px`, … Vị trí slot **không đổi** khi số thẻ trong
  chính stack đó hay stack khác thay đổi — chỉ thay đổi thứ tự tạo mới ảnh
  hưởng slot nào được gán. Trường hợp phổ biến nhất (đúng 1 stack) luôn nằm
  đúng giữa bàn theo cả 2 chiều.
- **Animation "đóng quạt lại rồi biến thành food card"** khi bấm Cook: hết
  `COOK_MS`, quạt nguyên liệu co lại theo chiều ngang về tâm của chính nó
  (scaleX 1→0.1) trong `FAN_CLOSE_MS`, rồi khói bay lên và thẻ món hiện ra
  tại đúng chỗ đó với hiệu ứng pop-in + shine đã có. Trong lúc đóng quạt,
  stack vẫn ở trạng thái khoá (không kéo/thả được).

## Tuning pass 2026-09-16 (3) — quạt bài khít hơn, stack trên mặt bàn

Theo yêu cầu người dùng 2026-09-16 (3) ("thu gọn khoảng cách các card", chia 11
thẻ, "cook bằng cách stack trên bàn chơi thay vì stack lên card trên hand").
Phần này **thay** mục "Stack trên tay" bên dưới ở mọi chỗ mâu thuẫn.

- **Quạt bài chỉ còn thẻ lẻ** (không còn stack trong tay). Spacing:
  `spacing = clamp(44px, (fanWidth − 96) / max(cards − 1, 1), 70px)` — trần
  130px → 70px, thẻ 96px chồng lên nhau ~26px (GUESS).
- **`#prep` — vùng xếp trên mặt bàn:** vùng trống của bàn nhôm giữa
  `#center-play` và dock, không viền, không chữ. Rộng `min(52vw, 700px)`,
  căn giữa; top = ngay dưới nhãn `Pool N`; bottom = 150px trên đáy màn
  (trên đầu quạt bài). Chỉ khi đang kéo thẻ qua chỗ trống mới hiện viền gạch
  vàng mờ.
- `#center-play` dời lên `top:40%` (trước 48%), ghế `top` 2 người lên 14%, ghế
  3 người 15%, bàn nhôm kéo dài xuống sát dock để phủ `#prep`. Nút `Pass`
  nằm đè mép dưới thẻ vừa đánh (không còn chỗ bên dưới).
- **Thẻ trên bàn** 76×106px — ĐÃ THAY bởi Tuning pass (4): không còn chồng dọc
  lệch 16px / neo trái; xem "quạt cong nằm ngang" + slot quanh tâm bàn ở
  Tuning pass (4) phía trên.
- **Nút Cook** đè lên mép dưới stack đang khớp, rộng tối đa 220px (hoặc
  `min(150px, spacing×0.95)` + so le 6px nếu stack kề cũng có Cook).

| Điểm buông | Kết quả |
|---|---|
| Thẻ trong tay → chỗ trống trên bàn | mở stack mới 1 thẻ |
| Thẻ (tay / bàn / thẻ tố) → 1 stack trên bàn | nhập stack nếu hợp lệ (`02-` Rule 10), sai → bật lại + rung + toast |
| Thẻ trên bàn → quạt bài, hoặc tap thẻ trên bàn | về lại tay (xếp theo thứ tự loại) |
| Thẻ trong tay → thẻ khác trong tay / quạt bài | không làm gì, snap về |
| Thẻ trong tay hoặc thẻ trên-cùng của stack → `#center-play` | Play |
| Thẻ tố trong stack → quạt/giữa bàn | thẻ tố về giữa bàn (`03-` Rule 15) |

- Tooltip 1 lần: "Drag cards onto the table to stack them", hiện giữa `#prep`
  khi bàn chưa có stack nào.
- Dock `pointer-events:none` (chỉ `#my-panel`, thẻ và nút nhận chạm) để vùng
  trong suốt phía trên quạt không chặn thao tác với `#prep`.

## Tuning pass 2026-09-16 (2) — đơn giản hoá HUD + bỏ Bếp

Theo `playtest.md` 2026-09-16 (2): bỏ HUD thừa (Speed, Show AI hands, đếm
Pool/Claims/Discard — giữ lại đếm Turn và nhãn Pool dưới chồng bài giữa bàn,
theo đúng lựa chọn của người test), bỏ đếm trùng lặp ở pod đối thủ, bỏ nhãn
"Clockwise:…", và **bỏ hẳn ô thả Bếp** (`#my-bep`/`.seat-bep`) — reveal giờ
làm bằng cách **xếp chồng thẻ ngay trên chính tay bài**, tái dùng nguyên cơ
chế lệch-dọc-lộ-tên đã có ở Bếp cũ (và ở `006`), chỉ chuyển nó vào trong từng
ô quạt bài thay vì 1 khay riêng. Cột trái dưới (`#my-panel`, thay `#my-head`)
mở rộng ra để gánh thêm hàng món đã nấu, vì cột Bếp không còn chiếm chỗ nữa.
Các thay đổi này khớp với luật mới game-designer đang viết lại vào `02-`/`03-`
(reveal/claim) và `05-` (nhịp AI) — doc này chỉ tả phần nhìn-thấy-được, số
liệu mốc thời gian (`COOK_MS`, nhịp AI...) vẫn thuộc các doc đó.

## Overview

Mặt bàn (`#table-surface`) có ghế đặt quanh rìa theo đúng vị trí ngồi, tái
dùng thao tác kéo-thả-xếp-chồng của `006` (offset dọc lộ tên, nút Cook không
tự chạy, snap-back khi sai) — áp cho cả **reveal** (`02-` Rule 9-14) lẫn
**claim** (`03-` Rule 11-14), nhưng giờ **ngay trên tay bài** thay vì 1 khay
Bếp riêng. Trình bày thẻ tham khảo Slay the Spire/Balatro: tay bài xoè hình
quạt, hover nhấc thẻ, kéo có nghiêng theo vận tốc, thẻ bay theo đường cong,
điểm bay tới counter.

Viewport: responsive, chính desktop landscape **~1280×800**, phải chạy được ở
**~1024×700** (theo `00-core.md`).

## Vị trí ghế theo chiều kim đồng hồ (bắt buộc, xem Ghi chú bên dưới)

Người thật luôn ở `bottom`. Đi từ `bottom` theo chiều kim đồng hồ (như kim
đồng hồ thật: 6h → 7,8,9h → 12h → 1,2,3h → 6h) nghĩa là **rẽ trái trước**, tức
`bottom → left → top → right → bottom`. Với 2 và 3 ghế, chọn tập con của thứ
tự đó sao cho vẫn đi đúng 1 chiều không đổi hướng giữa chừng:

| Số người | Ghế (theo đúng thứ tự lượt, clockwise) | Vì sao |
|---|---|---|
| 2 | `bottom` (người) → `top` | chỉ 2 điểm trên vòng tròn, hướng nào cũng "clockwise" — chọn `top` vì đối xứng, quen mắt nhất cho 1-vs-1 |
| 3 | `bottom` (người) → `top-left` (~10h) → `top-right` (~2h) → `bottom` | 6h→10h→2h→6h là 1 vòng tăng dần liên tục qua 7,8,9,10,11,12,1,2,3,4,5,6 — đúng clockwise; đồng thời 2 ghế đối thủ cùng nằm phía "đối diện" người chơi, không ghế nào ở sát cạnh sườn (đỡ chiếm ngang) |
| 4 | `bottom` (người) → `left` → `top` → `right` → `bottom` | 4 điểm chính đúng 6h→9h→12h→3h→6h |

`#cOrder` **đã bỏ** (sửa (2), xem bên dưới) — ghế trên bàn cùng viền sáng
`active` là dấu hiệu duy nhất cho thứ tự lượt, không cần nhắc lại bằng chữ.

## Layout — 4 người (1280×800)

```
┌ #hud, 56px ───────────────────────────────────────────────────────────────┐
│ Stack Kitchen  Players[▼2 3 4]  Turn 14                                  │
├ #menu-rail — MỚI, 100vw×64px (xem menu-orders.md) ──────────────────────────┤
├ #table-surface (lấp phần còn lại, 100vw×(100vh−56−64)) ─────────────────────┤
│                        .seat[data-seat=top]  (anchor 50%,14%)             │
│                    ┌──────────────────────────┐                          │
│                    │ Bot 2  🂠×12   18 pts      │                          │
│                    │ ▤▤▤▤▤▤▤▤▤▤▤▤ (hand-backs) │                          │
│                    │ [ seat-stack, ẩn khi rảnh ]│                          │
│                    │ 🍜🥟  (seat-foods, scroll) │                          │
│                    └──────────────────────────┘                          │
│ .seat[left]                                          .seat[right]        │
│ (anchor 12%,50%)                                      (anchor 88%,50%)   │
│ ┌─────────────┐        #center-play (50%,48%)         ┌─────────────┐   │
│ │ Bot 1        │    ┌────────┬─────────┬────────┐      │ Bot 3        │   │
│ │ 🂠×13  9 pts  │    │ #pool  │#last-   │#discard│      │ 🂠×11 24 pts  │   │
│ │ ▤▤▤▤▤▤▤▤▤▤▤▤ │    │ -pile  │ played  │ -pile  │      │ ▤▤▤▤▤▤▤▤▤▤▤  │   │
│ │[stack ẩn]    │    │ 🂠 62   │ (glow   │ (fan,  │      │[stack ẩn]    │   │
│ │ 🍜           │    │ Pool 62│  khi tố)│ mờ dần)│      │ 🍧🥟🍜        │   │
│ └─────────────┘    └────────┴─────────┴────────┘      └─────────────┘   │
│                                                                            │
│              .seat[data-seat=bottom] — người thật, full width, ~230px    │
│  ┌─#my-foods (mặt bàn)─┐   ┌────────.hand-fan (giữa)────────┐  ┌─#my-panel, góc phải─┐ │
│  │ 🍜Pho Bo+2           │   │        [Cook Pho Bo +2]        │  │ You         27 pts   │ │
│  │ 🥟Nem Ran+4          │   │            ┌──┐  ← stack, lệch │  │ 🂠×13 (hand count)   │ │
│  │ (cuộn dọc nếu tràn)  │   │            │▤▤│    dọc lộ tên   │  │ ── #my-order, N hàng │ │
│  │                      │   │            └──┘                │  │    (menu-orders.md) ─│ │
│  └──────────────────────┘   │  🂠 🂠 🂠 [stack] 🂠 🂠 🂠 🂠      │  └──────────────────────┘ │
│                              └─────────────────────────────────┘                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
`#my-foods` nằm trên mặt bàn ở góc trái dưới của `#alu-table` (hình trên vẽ giản lược); `#my-panel` là cột
phải của dock. Tâm quạt tính độc lập (Tuning pass (4)).

`.seat-head` (pod đối thủ) không còn hàng huy hiệu A/M/D — đã bỏ theo
`menu-orders.md` (Rule "Order không cần phủ đủ A/M/D"); `#my-panel` cũng bỏ
hàng A/M/D, thay bằng `#my-order`. Chi tiết N hàng/kích thước hàng theo
`ORDER_SIZE`, nội dung `#menu-rail`, và badge `order-need` trên thẻ tay xem
`design/ui/menu-orders.md`.

`#log-drawer` không nằm trong `#table-surface` — nó là 1 panel `position:
fixed; top:56px; right:0; bottom:0; width:320px`, mặc định trượt ra ngoài
(`translateX(100%)`), bấm `[Log ▸]` ở hud trượt vào trong 220ms ease-out, đè
lên (không đẩy) `#table-surface`.

## Layout — 3 người (bớt `left`/`right`, thêm `top-left`/`top-right`)

```
├ #table-surface ─────────────────────────────────────────────────────────┤
│      .seat[top-left]                    .seat[top-right]                │
│      (anchor 30%,16%)                   (anchor 70%,16%)                │
│   ┌─────────────┐                        ┌─────────────┐                │
│   │ Bot 1  ...   │                        │ Bot 2  ...   │                │
│   └─────────────┘                        └─────────────┘                │
│                                                                          │
│                     #center-play (50%,48%) — như trên,                  │
│                     cluster rộng hơn 1 chút vì không bị                 │
│                     ghế left/right ép ngang                             │
│                                                                          │
│                  .seat[bottom] — người thật, y hệt bản 4 người          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Layout — 2 người (chỉ `top`)

```
├ #table-surface ─────────────────────────────────────────────────────────┤
│                        .seat[top] (anchor 50%,18%, pod lớn hơn 1 chút     │
│                        vì không chia sẻ hàng ngang với ghế nào khác)     │
│                     ┌────────────────────────────┐                      │
│                     │ Bot 1  🂠×13  0 pts          │                      │
│                     └────────────────────────────┘                      │
│                          #center-play (50%,45%)                          │
│                  .seat[bottom] — người thật, y hệt bản 4 người          │
└──────────────────────────────────────────────────────────────────────────┘
```

Ghế đối thủ dùng chung 1 component `.seat`, chỉ đổi `data-seat` + kích thước
theo bảng Zone sizes — không phải 3 component riêng. Ở 1024×700, `#my-panel`
co về mép dưới của khoảng `clamp(190px,18vw,220px)` (còn ~194px), `.hand-fan`
vẫn giữ sàn spacing 44px (xem Interactions) — không cắt bớt nội dung nào,
chỉ hàng `#my-foods` cuộn dọc sớm hơn nếu nhiều món.

## Zone sizes (clamp theo cửa sổ, GUESS trừ khi ghi khác)

| Zone | Kích thước | Ghi chú |
|---|---|---|
| `#hud` | 100vw × 56px | 1 dòng duy nhất (sửa (2): bỏ dòng đếm Pool/Claims/Discard cũ, giữ Turn) |
| `#menu-rail` (mới, Tuning pass (6)) | 100vw × 64px | hàng riêng, ngay dưới `#hud`, trên `#table-surface` — nội dung/interactions xem `design/ui/menu-orders.md` |
| `#table-surface` | 100vw × (100vh − 56px − 64px) | nền bàn trà đá, artist style; trừ thêm chiều cao `#menu-rail` (Tuning pass (6)) |
| `.seat` (đối thủ, pod) | `clamp(220px,20vw,260px)` × `clamp(170px,18vh,190px)` | căn giữa tại anchor bằng `translate(-50%,-50%)`; kích thước không đổi, chỉ nội dung bớt 1 dòng (Elements) — (6) bớt thêm hàng huy hiệu A/M/D |
| `.seat[data-seat=bottom]` | 100% × `clamp(210px,30vh,240px)` | dock đáy; (7) 2 cột: `.hand-fan` · `#my-panel` (phải) |
| `#my-panel` (7: dời góc phải dưới) | `clamp(190px,18vw,220px)` × auto (co theo nội dung) | cột phải của dock, bám đáy; head1+head2+`#my-order`, không cuộn (không còn chứa `#my-foods`) |
| `#my-foods` (7: tách khỏi `#my-panel`, thành hộp riêng) | `clamp(140px,14vw,220px)` × auto (tối thiểu 76px, tối đa 28vh), cuộn dọc nếu tràn | trên mặt bàn, góc trái dưới của `#alu-table`, **không khung/nền** — thẻ món nằm thẳng trên mặt bàn, chỉ hiện viền vàng khi đang kéo thẻ món tới (`hot`); cách mép trái bàn 20px, đáy hộp ngay trên đầu quạt tay; ở 1024px hẹp lại để không lấn vùng nấu và ghế trái; nội dung/hành vi không đổi (xem "Bố cục #my-panel + #my-foods") |
| `.hand-fan` | phần còn lại giữa 2 zone góc (flex:1), `overflow:visible` | container xem công thức spacing ở Interactions; `overflow:visible` để stack cao tràn lên trên mép dock mà không bị cắt (xem Edge cases) |
| `#center-play` | `clamp(320px,32vw,380px)` × `clamp(140px,18vh,170px)` | tại (50%, 45–48% tuỳ số người); (sửa (2)) bỏ `#cOrder` |

## Bố cục `#my-panel` + `#my-foods` (2 zone riêng, Tuning pass (7))

```
┌─#my-panel (góc phải dưới)┐    ┌─#my-foods (bàn, góc trái)─┐
│ ● You         27 pts    │    │ 🍜 Pho Bo +2               │  mỗi dòng: ảnh 64×64 +
│ 🂠 ×13 (hand count)      │    │ 🥟 Nem Ran +4              │  tên + điểm, cuộn dọc
│ ── #my-order, N hàng ──│    │ …                          │  nếu tràn
│ ✓ Pho Bo   +2  [🍚][🥩] │    └────────────────────────────┘
│ ○ Bun Bo Hue +7 [🥩][🌶️]│
│ …                        │
└──────────────────────────┘
```

`#my-panel`: head1 (stool-dot + tên + điểm) + head2 (số thẻ úp) + `#my-order`
(N = `ORDER_SIZE`, xem `design/ui/menu-orders.md` cho kích thước hàng/chip).
Không còn chứa món đã nấu (7) — chiều cao co theo đúng nội dung, không cuộn.

`#my-foods` (7, tách thành zone riêng ở góc đối diện) là nơi *duy nhất* nhận
thẻ món đã nấu xong của người thật (kéo hoặc tap từ `.hand-fan` thẳng vào
đây) — hành vi thu món không đổi so với bản trước (6), chỉ đổi vị trí zone.

## Kích thước thẻ theo ngữ cảnh

| Ngữ cảnh | Kích thước | Ghi chú |
|---|---|---|
| `.hand-fan` (thẻ rời + thẻ trong stack, người thật) | 96×134px | thẻ chính; chỉ thẻ rời hoặc thẻ trên-cùng của 1 stack (thẻ ghép sau cùng) mới hover-lift + kéo tự do; thẻ nằm giữa stack chỉ lộ dải đầu 22px nhưng vẫn bắt `pointerdown` đúng tại dải đó — kế thừa nguyên cơ chế `#my-bep` cũ (xem "Stack trên tay") |
| `.seat-hand-backs` (tay đối thủ) | 40×56px | úp mặt, xếp chồng hơi lệch (~6px); (sửa (2)) không còn badge `×N` riêng — xem Elements |
| `.seat-stack` (stack nguyên liệu lộ của bot, đổi tên từ `.seat-bep`) | 48×67px | xếp lệch dọc 12px; (sửa (2)) bỏ khung tray trang trí, chỉ còn thẻ (artist quyết nền mới nếu cần) |
| `#pool-pile` / `#last-played` / top `#discard-pile` | 92×128px | tiêu điểm giữa bàn |
| các thẻ còn lại trong `#discard-pile` | 60×84px | xếp lệch, mờ dần theo độ cũ (art) |
| `#my-foods` (thẻ món người thật, trong `#my-panel`) | 64×64px | ảnh món `Art/Food/*` + số điểm đè góc |
| `.seat-foods` (thẻ món bot) | 40×40px | rút gọn; hover/tap phóng to tooltip |

## Elements

| Element | Vị trí | Kích thước | Tap target | States |
|---|---|---|---|---|
| `#numPlayers` | `#hud`, cụm trái | auto×44 | ≥44×44 | — |
| `#cTurn` ("Turn N") | `#hud`, cụm trái, cạnh Players | auto×24, không tương tác | — | text only |
| `#pool-pile` | `#center-play`, cột trái | 92×128 | toàn bộ thẻ trên cùng ≥44×44 | idle · glow-pulse (lượt mình, phase DRAW) · disabled (không phải lượt) |
| Nhãn `Pool N` | dưới `#pool-pile` | auto×16, không tương tác | — | luôn hiện — giữ theo lựa chọn của người test |
| `#last-played` | `#center-play`, cột giữa | 92×128 | ≥44×44 khi có thẻ | trống · hiện (500ms sau Play) · glow-loop (đang chờ tố) |
| Nút `Pass` | cạnh `#last-played`, bên phải | auto×44 | ≥44×44 | hiện khi mình đủ điều kiện tố · ẩn khi đã Pass/đã commit |
| `#discard-pile` | `#center-play`, cột phải | 92×128 (top) | không tương tác | tích luỹ, mờ dần theo tuổi |
| `.seat-head` | đầu mỗi `.seat` | 100%×~40px (2 dòng) | không tương tác | active (viền sáng, lượt của ghế đó) · idle — (sửa (2)) bỏ dòng "Foods N"; (6) bỏ luôn hàng huy hiệu A/M/D (`coursesHTML`, đã sai với luật Order) — chỉ còn tên/stool/điểm/số thẻ úp |
| `.seat-hand-backs` | dưới `.seat-head` | ~100%×56–60px | không tương tác (úp mặt) | luôn úp mặt trong lúc chơi, chỉ lật mặt ở `GAME_END` (xem "Bỏ Show AI hands") — (sửa (2)) bỏ badge `×N` riêng, số thẻ hiện đúng 1 lần trong `.seat-head` |
| `.seat-stack` | giữa pod, nổi phía trên khi có thẻ | co giãn theo N thẻ | mỗi thẻ ≥44×44 (xem edge case bot) | rỗng (ẩn hẳn) · đang xếp · khớp (hiện nút Cook) · đang nấu (khoá, progress) |
| Nút `Cook <Dish> +N` | ngay trên đỉnh của stack đang khớp (người thật: trong `.hand-fan`; bot: trên `.seat-stack`) | auto×44, rộng tối đa `min(150px, spacing*0.95)`, ellipsis + `title` đầy đủ | ≥44×44 | hiện/ẩn theo Rule 10 (`02-`) — xem "Chống đè nút Cook" |
| `.hand-fan` | đáy `.seat[bottom]`, cạnh `#my-panel` | phần còn lại của dock (flex:1), `overflow:visible` | mỗi *nhóm* (thẻ rời hoặc stack) ≥44px bề rộng lộ ra | idle-wobble · hover-lift (chỉ thẻ rời/thẻ-trên-cùng) · selected · dragging · useful-highlight · (6, MỚI, cộng thêm) badge `order-need` tĩnh góc trên-trái trên thẻ phục vụ Order chưa xong — xem `menu-orders.md` |
| Nút nổi `Play <Card>` | ngay trên thẻ đang `selected` | auto×44 | ≥44×44 | hiện khi có thẻ chọn, di theo vị trí thẻ |
| `#my-panel` | góc phải dưới — cột phải của dock (7) | `clamp(190px,18vw,220px)` × auto | — | xem "Bố cục #my-panel + #my-foods" |
| `#my-foods` | trên mặt bàn, góc trái dưới của `#alu-table` (7, tách khỏi `#my-panel`) | `clamp(190px,18vw,220px)` × auto, cuộn dọc nếu tràn | mỗi food card ≥44×44 | rỗng (trống, không chữ — xem Empty states) · có N món · `hot` (đang là drop-target khi kéo thẻ món tới) |

**Đã bỏ khỏi HUD/UI (sửa (2)):** nút Speed, nút Show AI hands, đếm `#cPool`/
`#cClaims`/`#cDiscard` ở `#hud`, `#cOrder` ("Clockwise: …"), dòng "Foods N"
trong `.seat-head`, badge `×N` trong `.seat-hand-backs`, chữ "Cooked foods
land here", và toàn bộ `#my-bep`/`#my-bep-zone`/`.seat-bep` (thay bằng
`.seat-stack` + stacking trực tiếp trong `.hand-fan`, xem dưới).

## Stack trên tay (thay Bếp) — ĐÃ THAY bởi Tuning pass (3): stack giờ nằm trên mặt bàn

Reveal (người thật) không còn dùng khay riêng — thao tác diễn ra ngay trong
`.hand-fan`. Cơ chế xếp/khoá/nấu do `02-`/`03-` quyết định; phần dưới đây chỉ
tả cách UI nhận diện điểm thả và hiển thị, khớp với luật đó.

**Nhóm (group) trong `.hand-fan`:** mỗi thẻ rời hoặc mỗi stack là 1 "nhóm",
chiếm đúng 1 ô quạt. Số ô quạt = số **nhóm**, không phải số thẻ — gộp thẻ vào
stack luôn làm số ô giảm, nới rộng khoảng cách còn lại.

**Công thức spacing (sửa (2), thay số thẻ bằng số nhóm):**
`spacing = clamp(44px, (fanWidth − 96) / max(groups.length − 1, 1), 130px)` —
giữ nguyên sàn 44px như bản cũ, chỉ đổi biến đếm.

**Vị trí thẻ trong 1 nhóm-stack:** tái dùng nguyên cơ chế lệch-dọc của
`#my-bep` cũ — thẻ vào trước nằm cao nhất, chỉ lộ dải đầu 22px (dải này vẫn
là 1 điểm `pointerdown` hợp lệ để rút riêng thẻ đó ra, xem "Rời stack" dưới);
thẻ vào **sau cùng** nằm thấp nhất, hiện trọn vẹn, là thẻ duy nhất vừa
hover-lift vừa được phép kéo tới `#center-play`.

**3 luật xác định điểm thả khi buông 1 thẻ đang kéo (`pointerup`):**

| Điểm buông | Điều kiện | Kết quả |
|---|---|---|
| Trong hitbox 1 nhóm khác (96px × chiều cao stack đó) trong `.hand-fan` | hợp lệ = hợp union loại nguyên liệu (nhóm đó + thẻ đang kéo) là tập con của ≥1 công thức, không trùng loại | **Ghép/nhập stack** — settle 180ms + squash, nếu khớp đúng 1 công thức thì nút Cook hiện ra (xem Interactions) |
| Trong hitbox 1 nhóm khác, nhưng union không phải tập con nào / trùng loại | — | **Invalid** — bật lại đúng ô cũ, rung ±8px ×3 + viền đỏ 150ms |
| Trong `.hand-fan` nhưng không trúng hitbox nhóm nào (khoảng trống giữa các ô) | luôn hợp lệ | **Rời stack / vẫn là thẻ rời** — nếu thẻ đang kéo vốn nằm trong 1 stack, nó tách ra thành nhóm riêng (phần còn lại của stack không đổi); nếu vốn đã là thẻ rời, coi như huỷ kéo, snap về đúng ô của nó |
| Trong `#center-play` | chỉ chấp nhận nếu thẻ đang kéo là thẻ rời **hoặc** thẻ-trên-cùng (thẻ vào sau cùng) của 1 stack | **Đánh thẻ (Play)** — xem dòng Play ở Interactions; nếu thẻ đang kéo là thẻ **giữa** 1 stack, buông trên `#center-play` không được coi là Play — xử lý y hệt "Rời stack" ở trên (không có trạng thái lỗi cho case này, luôn thành công) |

**Chống đè nút Cook:** khi ≥2 nhóm liền kề cùng khớp công thức và đều hiện nút
Cook ở spacing sàn 44px, mỗi nút giới hạn rộng tối đa `min(150px,
spacing*0.95)`, tên món dài bị ellipsis + `title` đầy đủ khi hover — hiếm khi
xảy ra thật sự chồng nhau vì cần ≥2 stack đủ công thức cùng lúc trên tay
13–14 thẻ; nếu vẫn chạm nhau, nút mới hiện gần nhất (z-index cao hơn) so le
lên 4px (GUESS, chấp nhận được cho MVP).

**Thu món:** thẻ món (sau khi Cook xong) vẫn nằm nguyên tại ô quạt của nó
dưới dạng 1 "food-in-fan" — kéo hoặc tap thẻ đó vào `#my-foods` (`#my-panel`)
để chính thức thu, cộng điểm; sau khi thu, ô quạt đó biến mất, các nhóm còn
lại re-flow theo spacing mới.

**Nhiều stack cùng lúc, 1 stack nấu tại 1 thời điểm:** không giới hạn số
nhóm-stack đang chờ trên tay; `Cook` khoá đúng nhóm đó (progress chạy tại chỗ
trong ô quạt của nó), các nhóm khác vẫn kéo/ghép/tách bình thường. Stack tồn
tại xuyên lượt — không bị buộc phải Cook hay tan rã khi hết lượt.

**Claim dùng chung cơ chế này:** kéo `#last-played` (đang glow) thả vào 1 thẻ
rời/stack trong `.hand-fan` của mình — áp dụng đúng 3 luật thả ở trên (thẻ
tố cũng phải là tập con hợp lệ mới ghép được). Thua ưu tiên: **các thẻ vốn đã
có sẵn trong tay giữ nguyên tại chỗ trong stack đó, không bay đi đâu cả**
(chúng chưa từng rời tay); chỉ riêng thẻ tố (vốn kéo từ `#last-played` vào)
bay sang ghế thắng, kèm toast. Thắng ưu tiên: coi như "Thu món" ở trên,
tự động.

**Bot (không có khay):** bốc → thẻ tự xếp vào `.seat-stack` (nhỏ, lệch dọc
12px, không khung tray) → khớp công thức thì tự bấm Cook → progress chạy tại
`.seat-stack` → thành thẻ món, bay thẳng vào `.seat-foods` kèm +N bay tới
điểm — không có bước "thu" riêng cho bot (tự động, vì không cần thao tác kéo
thả của người chơi).

**Bỏ "Show AI hands":** không còn nút bật/tắt lật mặt tay bot khi đang chơi —
`.seat-hand-backs` luôn úp mặt trong suốt ván; chỉ lật mặt 1 lần ở `GAME_END`
(giữ nguyên hành vi cũ dùng cho bảng xếp hạng cuối ván, không cần nút riêng).

**Bỏ "Speed":** không còn nút chọn nhịp AI trong UI — nhịp chạy 1 tốc độ cố
định; con số cụ thể do `05-` quyết (không lặp lại ở đây).

## Interactions

| Cử chỉ | Phản hồi | Feedback | Timing |
|---|---|---|---|
| Tap `#pool-pile` (lượt mình, phase Draw) | bốc 1 thẻ | pile glow-pulse trước khi bấm được; thẻ bay pool→`.hand-fan` theo đường cong, hạ cánh xoè vào đúng ô mới, viền "new" 1.5s | bay 300ms `cubic-bezier(.22,1,.36,1)`, viền new giữ 1500ms (GUESS) |
| Hover (pointerenter) 1 thẻ rời hoặc thẻ-trên-cùng trong `.hand-fan` | nhấc + phóng to | `translateY(-20px) scale(1.08)`, z-index cao nhất tạm thời | 120ms ease-out, bắt đầu chuyển động <100ms (GUESS) |
| `pointerdown` + kéo 1 thẻ (rời, trên-cùng, hoặc dải đầu 1 thẻ giữa stack) | thẻ theo con trỏ, nghiêng theo vận tốc ngang | góc nghiêng = `clamp(vx*0.05, -12°, 12°)`, làm mượt theo khung hình; offset thẻ lệch trên-trái con trỏ ~(-20,-40px) để không che vùng thả | tức thời mỗi frame (GUESS công thức) |
| Buông thẻ trong hitbox 1 nhóm khác, hợp lệ | ghép/nhập stack, lệch dọc 22px | settle nhẹ (squash 1→1.06→1); nếu khớp đúng 1 công thức, nút `Cook <Dish> +N` trượt/mờ dần hiện ra trên đỉnh stack | bay 180ms ease-out + squash 100ms (GUESS) |
| Buông thẻ trong hitbox 1 nhóm khác, sai (union không phải tập con nào / trùng loại) | bật lại đúng ô cũ | rung ngang ±8px ×3 + viền đỏ chớp 150ms trên cả thẻ và viền nhóm đích | 200ms tổng (GUESS) |
| Buông thẻ vào khoảng trống trong `.hand-fan` (không trúng nhóm nào) | rời stack cũ (nếu có) → thành nhóm rời riêng; fan re-flow | các ô còn lại trượt nhẹ tới vị trí mới | 180ms ease-out (GUESS) |
| Tap `Cook <Dish> +N` | khoá stack tại chỗ, chạy progress | progress bar chạy đủ `COOK_MS` (số do `02-` quyết); hết giờ, thẻ nguyên liệu crossfade/scale-out, 1 thẻ món xuất hiện tại đúng ô đó | theo `02-`, không lặp số ở đây |
| Kéo/tap thẻ món (food-in-fan) vào `#my-foods` | thu chính thức, cộng điểm | "+N" bay theo đường cong từ ô quạt tới số điểm ở `#my-panel`; counter "punch" (`scale 1→1.25→1`) đúng lúc +N chạm tới; thẻ món settle vào `#my-foods`, ô quạt cũ biến mất, fan re-flow | bay 500ms, counter punch 200ms (GUESS) |
| Tap (không kéo) 1 thẻ rời hoặc thẻ-trên-cùng | chọn thẻ, ghim nhấc | thẻ giữ trạng thái `selected`; nút nổi `Play <Card>` hiện cạnh nó; các thẻ giúp ráp món khác trong tay được viền `useful` | tức thời (<100ms) |
| Kéo thẻ rời/thẻ-trên-cùng (hoặc bấm nút `Play <Card>`) vào `#center-play` | đánh thẻ ra | thẻ bay hand→center theo đường cong; trở thành `#last-played`, glow-pulse 1 nhịp báo "vừa đánh" | bay 300ms; độ trễ trước khi mở cửa sổ tố = `PLAY_REVEAL_MS` (theo `03-`) |
| (Sau khi 1 người khác đánh) mình đủ điều kiện tố | `#last-played` glow-loop + nút `Pass` hiện | glow lặp chu kỳ 1.2s cho tới khi mình quyết | — |
| Kéo `#last-played` (đang glow) thả vào 1 nhóm trong `.hand-fan` | áp dụng đúng 3 luật thả ở "Stack trên tay" | như dòng "buông hợp lệ/sai" ở trên | như trên |
| Tap `Cook` khi đang tố, **thua ưu tiên** | các thẻ có sẵn trong tay giữ nguyên tại stack (không bay đi); riêng thẻ tố bay sang ghế thắng | toast top-center: `"Bot 2 took it — Bun Bo Hue 7 > 4"`; `#last-played` (thẻ tố) bay tới ghế thắng | toast giữ 2.5s + fade 300ms (GUESS) |
| Tap `Cook` khi đang tố, **thắng ưu tiên** | thu thẻ món như luồng "thu chính thức" ở trên, tiếp tục lượt (không Draw) | như dòng "thu chính thức" ở trên | — |
| Tap `Pass` | không tố | `#last-played` hết glow cho riêng mình (vẫn glow nếu còn người khác chưa quyết) | tức thời |
| (6, SỬA bởi `10-match-intro.md`) trước Deal | `#menuIntroModal` (Menu, từng món lần lượt) → `#orderIntroModal` (Order của mình, từng món lần lượt + câu luật thắng) → `#menu-rail` + `#my-order` hiện thẳng, không pop-in | timing: `10-match-intro.md` Numbers | theo `10-` |
| Deal đầu ván | chia `HAND_START` vòng cho mọi ghế theo thứ tự lượt — chạy **sau** khi Menu/Order đã pop-in xong (6) | mỗi thẻ bay pool→ghế đích, so le nhau; tap bất kỳ đâu để skip nhanh (rút stagger) | mỗi thẻ 180ms, stagger 30ms — GUESS |
| Idle (không thao tác) mọi thẻ đã settle | lắc nhẹ | `translateY` dao động ±2px, chu kỳ 2.6s ease-in-out, lệch pha ngẫu nhiên theo vị trí thẻ | 2600ms/chu kỳ (GUESS), tự tắt khi thẻ đang hover/kéo/bay |
| Lượt của bot (mọi bước) | chạy đúng chuỗi hình ảnh trên nhưng tự động, ở scale của `.seat` bot | không có modal chặn; log ghi lý do | nhịp cố định (theo `05-`); các animation bay/nấu giữ nguyên số ở trên, không co giãn theo speed (không còn nút Speed) |

## Z-order (thấp → cao)

`#table-surface` nền/stool trang trí < ghế đứng yên (head, hand-backs, foods,
`.seat-stack` rảnh) < `#pool-pile`/`#discard-pile` đứng yên < các nhóm/stack
đứng yên trong `.hand-fan` < nút `Cook <Dish> +N` nổi trên stack của nó < thẻ
đang bay (deal/draw/play/claim/cook-result) < thẻ đang được người thật kéo <
điểm "+N" bay + toast < modal (End-of-game / `#menuIntroModal` đầu ván).

## Luồng lượt của người thật (state-by-state)

| State | Vào khi | Màn hình | Input hợp lệ | Ra khi |
|---|---|---|---|---|
| `IDLE_WAIT` | không phải lượt mình | dock mờ viền, mọi info vẫn hiện, stack cũ vẫn hiện nguyên trạng | không có (chỉ xem) | tới lượt → `DRAW` |
| `DRAW` | tới lượt, chưa bốc | `#pool-pile` glow-pulse | tap `#pool-pile` | bốc xong → `CHECK_STACK` |
| `CHECK_STACK` | vừa bốc hoặc vừa thắng claim (Rule 6, không Draw) | `.hand-fan` nhận kéo-thả nội bộ (ghép/tách nhóm) lẫn kéo ra `#center-play` | kéo thẻ chồng lên nhóm khác (ghép, lặp lại tuỳ ý), kéo ra khoảng trống (tách), kéo thẻ rời/thẻ-trên-cùng vào `#center-play` hoặc chọn+`Play` | chọn Play → `PLAY`; nếu tay rỗng sau reveal → tự động bỏ qua Play (`02-` Rule 8) |
| `COOKING` (con của `CHECK_STACK`, theo từng stack) | tap `Cook` trên 1 stack | stack đó khoá, progress chạy tại ô của nó; các stack khác vẫn tương tác được | không thao tác được với stack đang khoá đó | hết `COOK_MS` → thẻ món xuất hiện tại ô đó, quay lại `CHECK_STACK` (chờ thu) |
| `PLAY` | đã chọn 1 thẻ, xác nhận đánh | thẻ bay ra `#center-play` | không thao tác thêm, chờ resolve | resolve xong → `RESULT` |
| `CLAIM_WINDOW` (khi người khác đánh, mình đủ điều kiện) | có thẻ mới ở `#last-played`, mình ráp được | glow + `Pass` hiện | kéo vào 1 nhóm trong `.hand-fan` để tố, hoặc tap `Pass` | Cook xong (thắng/thua) hoặc Pass → `RESULT` |
| `RESULT` | claim/discard vừa xử lý xong | cập nhật ghế liên quan | — | không ai tố → lượt sang người kế (`IDLE_WAIT`/`DRAW`); mình thắng tố → `CHECK_STACK` (không Draw); mình thua/đứng ngoài → `IDLE_WAIT` |
| `GAME_END` | đủ Order (`07-` Rule 10) hoặc pool cạn (`07-` Rule 11 — thay điều kiện "đủ 3 loại" cũ của `04-`) | overlay kết thúc, `.seat-hand-backs` lật mặt 1 lần | `Play again` / `View table` | Restart |

## Trình diễn lượt của bot

Bot không kéo-thả, nhưng hiện **đúng chuỗi hình ảnh trên ở scale nhỏ hơn**
(`02-` Rule 14): bốc (pool→`.seat-hand-backs`, số thẻ +1) → xếp vào
`.seat-stack` (thẻ tự bay từ hand-backs vào, lệch dọc 12px, không khung tray)
→ `Cook` tự bấm khi AI quyết reveal → progress chạy `COOK_MS` ở scale
`.seat-stack` → thẻ món bay vào `.seat-foods` kèm +N bay tới điểm của ghế đó
→ đánh thẻ (bay vào `#last-played`) → nếu mình đủ điều kiện tố thì mở
`CLAIM_WINDOW`, ngược lại bot khác tự quyết trong hậu trường (không cần hiện
UI riêng cho quyết định của bot khác — chỉ log). `.seat-hand-backs` luôn úp
mặt trong lúc chơi (không còn nút "Show AI hands"), chỉ lật mặt ở `GAME_END`.

## Interruptions / edge cases

| Tình huống | Xử lý |
|---|---|
| Resize cửa sổ giữa lúc có thẻ đang bay | animation đang chạy bay tới đúng toạ độ đích đã tính lúc bắt đầu (không đuổi theo layout mới giữa chừng); lần render kế tiếp mới định vị lại theo anchor % mới — cùng nguyên tắc đã áp dụng cho khách đi bộ ở `006` |
| Tay 14 thẻ, chưa ghép nhóm nào (ngay sau khi vừa bốc, trước khi Play) | `spacing = clamp(44px, (fanWidth − 96) / (groups.length−1), 130px)`; ở 1280px và 1024px, 14 nhóm (trường hợp xấu nhất — chưa ai ghép gì) vẫn đạt spacing > 44px nên không cần cuộn |
| 1 nhóm là stack cao tối đa (4 nguyên liệu, ~200px) | `.hand-fan` có `overflow:visible`, stack được phép tràn lên phía trên mép dock, đè lên vùng bàn trống — không ghế nào neo ở khoảng không ngay phía trên dock (left/right neo 50% chiều dọc) nên không bị che |
| Nhiều món trong `#my-foods` / `.seat-foods` | `#my-foods` cuộn **dọc** trong `#my-panel` nếu tràn; `.seat-foods` (bot) vẫn cuộn ngang như cũ — gradient mờ mép báo còn nội dung |
| Restart giữa animation bất kỳ | tái dùng `gameToken` đã có trong code: mọi tween đang chạy bị bỏ dở (phần tử bị xoá/re-render), không cần animation "dọn dẹp" riêng |
| Thả thẻ sai vị trí (ngoài mọi vùng nhận, ví dụ thả ngoài `#table-surface`) | coi như invalid drop: snap-back nguyên vị trí cũ, cùng feedback rung+viền đỏ như buông sai vào 1 nhóm |
| Nhấc thẻ ngay sau khi bấm bốc hoặc thu món, trước khi host báo tới bước đánh (~300ms, lâu hơn khi đang bốc bù) — sửa 2026-09-19 (#17) | vẫn nhấc được thẻ trong tay; thả vào vùng nấu chạy như thường; thả vào ô đánh → thẻ tạm ẩn, tự đánh ngay khi bước đánh tới (tối đa 3s, quá hạn thì thẻ hiện lại trong tay). Trước đây cú kéo này bị bỏ qua không báo gì — nguồn của playtest 2026-09-19 (3) *"lâu lâu khi tôi kéo card vô chỗ cook hoặc chỗ play lại không ăn"* |
| Vẩy thẻ qua vùng đích rồi nhả ở chỗ trống phía sau (sửa 2026-09-19, người dùng: *"nếu tôi đang drag quá khu đó kiểu vẩy chuột ấy thì sẽ detect là thả không được"*) | điểm nhả trúng một vùng có tác dụng → dùng vùng đó như cũ. Nhả ở chỗ trống (hoặc, với thẻ lấy từ tay, trên quạt bài / thẻ khác trong tay — vốn không làm gì) → xét vị trí thẻ đang vẽ (lệch −20/−40px so với con trỏ), rồi lần ngược đường kéo trong `FLING_MS` = 150ms (GUESS) cuối, lấy vùng gần nhất thẻ vừa đi qua. Không tìm được → bật về như cũ. Thẻ trên bàn kéo về quạt vẫn về tay |
| `pointerup` ngoài cửa sổ trình duyệt giữa lúc đang kéo | dùng Pointer Events capture; nếu mất capture (`pointercancel`) xử lý y hệt invalid drop |
| Tab bị blur / chuyển app (desktop) | tạm dừng lịch nhịp AI và animation `idle-wobble` (tiết kiệm CPU, tránh người chơi quay lại thấy nhiều lượt bot đã tự trôi qua không kịp xem); resume khi `visibilitychange` báo visible lại |
| Xoay màn hình / cuộc gọi / pin yếu | không áp dụng — slot desktop/PC, không phải mobile |
| Điều hướng back của trình duyệt | không áp dụng — 1 trang duy nhất, không có route |

## Empty / error states

- **First launch:** trang load xong tự chạy deal animation ngay (không có màn
  "Start" riêng) — tap bất kỳ đâu để bỏ qua nhanh phần còn lại của deal.
- **Lần đầu chưa từng ghép stack:** không có màn hướng dẫn riêng — 1 tooltip
  nhỏ, mờ, 1 lần duy nhất, cạnh `.hand-fan` khi vào `CHECK_STACK` lần đầu:
  "Drag a card onto another to stack it", tự ẩn sau 4s hoặc ngay khi người
  chơi ghép thành công lần đầu; chỉ tồn tại trong phiên chơi, không lưu setting.
- **Tay rỗng sau reveal** (`02-` Rule 8): `.hand-fan` hiện dòng chữ nhỏ căn
  giữa "No cards to play — waiting…" ~1s rồi tự động chuyển lượt, không cần
  người chơi bấm gì.
- **`#my-foods` rỗng:** để trống hẳn, không còn chữ placeholder (sửa (2) —
  bỏ "Cooked foods land here" theo yêu cầu người test).
- **Pool cạn** (`04-` Rule 4): `#pool-pile` hiện trống (art: chỗ trống trên
  bàn) kèm toast ngắn "Pool empty" trước khi overlay `GAME_END` mở.
- **Mất kết nối:** không áp dụng — chơi hoàn toàn local trong 1 tab trình
  duyệt, không phụ thuộc mạng.

## Màn kết thúc (`GAME_END`)

Giữ nguyên dạng overlay modal đã có (`#endModal`), phủ dim 65% toàn viewport,
box căn giữa — không cần thiết kế màn mới. Nội dung: tiêu đề "Game over —
<lý do>", bảng xếp hạng (hàng đầu có 🏆 nếu điểm cao nhất) với cột Player /
Score / Bonus / **Order** (6, đổi từ "Courses") / Foods — cột Foods hiện **thẻ
ảnh món thu nhỏ 32×32** kèm tên, không phải text thuần. Cột **Order** (6, MỚI)
thay hẳn cột "Courses" (3 huy hiệu A/M/D) cũ: N thẻ món Order thu nhỏ 32×32 +
tick ✓/✕mờ, cộng nhãn "Finished order first" cho người kích hoạt Kết thúc A' —
chi tiết đầy đủ ở `design/ui/menu-orders.md` mục "Màn kết thúc". 2 nút:
`Play again` (primary, khởi động lại ngay) và `View table` (đóng overlay, xem
lại bàn ở trạng thái kết thúc).

## Done when

- HUD chỉ còn tên game, Turn, chip phòng/đồng hồ (online) và `Home` (7: bỏ Restart, `Menu`, `[Log ▸]`) — không còn
  Speed, Show AI hands, đếm Pool/Claims/Discard ở `#hud`.
- Nhãn `Pool N` vẫn hiện dưới `#pool-pile` ở giữa bàn.
- Mỗi pod đối thủ hiện đúng 1 lần: tên, stool color, điểm, số thẻ úp — không
  còn "Foods N", badge `×N` trùng lặp, hay huy hiệu A/M/D (6); `#cOrder` đã
  gỡ khỏi `#center-play`.
- `#menu-rail` hiện đúng N món Menu suốt ván (N theo số người); `#my-order`
  hiện đúng `ORDER_SIZE` hàng của riêng ghế đang xem — chi tiết Done when đầy
  đủ của Menu/Order ở `design/ui/menu-orders.md`.
- Đổi 2/3/4 người → đúng số ghế, đúng vị trí anchor theo bảng, không ghế nào
  đè lên ghế khác hay lên `#center-play` ở cả 1280×800 và 1024×700.
- Thứ tự lượt hiển thị đúng chiều kim đồng hồ hình học ở cả 3 cấu hình, chỉ
  bằng viền sáng `active` (không còn chữ Clockwise).
- Không còn `#my-bep`/`#my-bep-zone`/`.seat-bep` trong DOM; `#my-panel` (góc phải dưới, 7) hiện
  tên, điểm, số thẻ úp, `#my-order`; `#my-foods` (góc trái dưới, 7 — zone riêng, không còn trong
  `#my-panel`) hiện danh sách món đã thu, cuộn dọc nếu tràn.
- Kéo 1 thẻ chồng lên thẻ/stack khác trong `.hand-fan` → ghép nhóm đúng offset
  dọc 22px lộ tên, khớp công thức hiện nút `Cook <Dish> +N` ngay trên đỉnh
  stack (không tự chạy); sai → bật lại + rung + viền đỏ.
- Kéo 1 thẻ ra khoảng trống trong `.hand-fan` → tách khỏi stack cũ, thành
  nhóm rời, fan re-flow theo số nhóm mới, spacing luôn ≥44px ở cả 2 bề rộng
  thử nghiệm.
- Tap Cook → progress đúng `COOK_MS` tại đúng ô stack đó → ra thẻ món tại ô
  đó; kéo/tap thẻ món vào `#my-foods` → +N bay tới điểm, counter punch, ô
  quạt cũ biến mất.
- ≥2 stack tồn tại đồng thời, cook độc lập từng cái — thao tác 1 stack không
  chặn thao tác các stack khác; nút Cook của 2 stack liền kề không chồng lấp
  nhau đến mức không bấm được.
- `#last-played` phát sáng đúng lúc mình đủ điều kiện tố kèm nút `Pass`; kéo
  vào 1 nhóm trong `.hand-fan` + Cook để tố; thua ưu tiên → các thẻ có sẵn
  trong tay giữ nguyên tại chỗ (không bay), chỉ thẻ tố bay đi + toast đúng
  nội dung.
- Bot hiện đúng chuỗi hình ảnh tương tự qua `.seat-stack` (scale nhỏ hơn),
  không mở modal nào chặn người chơi, không có nút Speed nào điều khiển nhịp.
- Resize giữa lúc có animation không vỡ layout hay văng lỗi console; animation
  đang chạy vẫn hoàn tất, layout tự chỉnh ở lần render kế tiếp.
- 1 stack cao tối đa (4 thẻ) tràn lên trên mép dock không bị cắt, không đè
  ghế nào.
- `Play again` ở `#endModal` giữa animation bất kỳ → bàn sạch, không còn phần tử mồ côi.
- Không còn `Restart`/`Menu`/`[Log ▸]` trong `#hud`; không còn `#recipeModal`/`#log-drawer` trong DOM (7).
- Màn kết thúc hiện đúng bảng xếp hạng kèm thẻ món dạng ảnh nhỏ, 2 nút hoạt
  động đúng, `.seat-hand-backs` lật mặt đúng lúc `GAME_END`.
