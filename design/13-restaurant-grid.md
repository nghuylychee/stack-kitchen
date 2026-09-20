# 13 — Restaurant Grid (lưới đặt đồ, kéo thả tự do)

**Status:** AGREED (2026-09-20 — Tuning pass (3): camera zoom/pan + lưới rộng, backlog #32)
*(trước đó BUILT #25, Numbers sửa ở #29)*
**Attaches to:** khu giữa màn quán (`12-restaurant-meta.md` Rule 2 — `items[].x/y`).

## Overview

Mặt bằng quán là một lưới ô vuông **rộng hơn màn hình nhiều lần** — người chơi kéo màn để đi
quanh quán và cuộn chuột (hoặc chụm hai ngón) để phóng to / thu nhỏ, đúng kiểu một game xây dựng.
Mỗi món đồ (bàn, bếp, chậu cây) là một tấm card chiếm vài ô và
người chơi **kéo thả tự do** để xếp lại quán theo ý mình. Không có luật kề cạnh và không phải chừa
lối đi: chỗ nào trống là đặt được — khách **nhảy theo ô** để tới bàn chứ không cần đường thông
(`16-customers-idle.md`, đợt 2). Kéo vào chỗ đã có đồ thì nó bật về chỗ cũ — đúng phản hồi "sai thì bật
lại + rung" đã dùng cho thẻ bài.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: **expression** — hai người cùng mua một bộ đồ vẫn ra hai cái quán khác nhau. Đây là lý
  do duy nhất khiến người chơi mở màn quán ra ngắm mà không cần hệ thống nào thưởng cho việc đó.
- Degenerate: dồn hết đồ vào một góc cho gọn, phần còn lại bỏ trống. **Không chặn** — không có luật
  kề cạnh nào để phạt, và cũng không nên có ở đợt 1. Theo dõi ở playtest: nếu ai cũng dồn góc thì
  lưới đang quá to, thu `GRID_COLS`/`GRID_ROWS` lại chứ không thêm luật.
- Degenerate: kéo nhầm liên tục vì ô quá nhỏ trên màn hẹp. Chặn bằng `CELL_MIN_PX` (Rule 3) — ô
  không bao giờ nhỏ hơn sàn tap target của repo.
- Online / bots: không liên quan, lưới chỉ tồn tại ở màn quán.

**Aesthetics**

| | |
|---|---|
| **Primary** | expression |
| **Secondary** | none |
| **Serves the core by** | cho người chơi một chỗ tự quyết mà không có ai đúng ai sai — đối trọng nhẹ với **challenge** căng thẳng của ván bài, và là thứ khiến gold đáng tiêu |

## Rules

1. Lưới `GRID_COLS` × `GRID_ROWS` ô vuông, gốc toạ độ ở ô trên-trái là `(0,0)`; `x` tăng sang phải,
   `y` tăng xuống dưới. Toạ độ lưu trong save là **ô**, không phải pixel (`12-` Rule 2).
2. Mỗi loại đồ có **footprint** `(w,h)` cố định theo bảng Numbers. `items[].x/y` là ô trên-trái của nó.
3. **Kích thước ô trên màn** = `CELL_PX × zoom` (sửa 2026-09-20 (3)). `CELL_PX` là cạnh ô ở zoom 1;
   lưới **không** co giãn theo viewport nữa — viewport chỉ quyết định **nhìn thấy bao nhiêu**, đó
   là việc của camera (Rule 14–16).
4. **Kéo bằng Pointer Events** (`pointerdown`/`move`/`up`) — dùng lại đúng lớp kéo thả của
   `ui/table.ts`, không viết cơ chế kéo mới.
5. Trong lúc kéo: các ô đích sáng lên — hợp lệ thì viền `--gold` (tái dùng "valid-drop hint" của
   `art.md`), không hợp lệ thì viền `--invalid`.
6. **Hợp lệ** khi mọi ô trong footprint đều: nằm trong lưới, và không bị món đồ **khác** chiếm
   (chính món đang kéo không tính là vật cản).
7. Thả hợp lệ → snap đúng ô, ghi save ngay (`12-` Rule 4). Thả không hợp lệ hoặc ra ngoài lưới →
   bật về ô cũ + rung + viền đỏ, save không đổi.
8. **Hit-test tính theo ô, sống theo từng `pointermove`** — nên resize cửa sổ giữa lúc đang kéo
   không làm lệch: ô đích luôn tính từ layout của khung hình hiện tại.
9. Đợt 1: **không xoay, không bán lại, không xoá đồ.** Đây là quyết định phạm vi, không phải thiếu sót.
10. Đồ mới mua đặt vào **ô trống gần tâm màn hình nhất** — quét vòng tròn loang dần ra từ ô ở giữa
    khung nhìn hiện tại (sửa 2026-09-20 (3): lưới rộng rồi nên "ô trống đầu tiên từ góc trái trên"
    sẽ ném món vừa mua ra ngoài màn, người chơi tưởng mất tiền). Camera **không** tự chạy theo.
    Không còn chỗ cho footprint đó → shop chặn mua kèm lý do (`15-` Rule 3).
11. **Save có toạ độ sai** (ngoài lưới, chồng nhau, thiếu `x`/`y`): lúc nạp, dồn món lỗi về ô trống
    gần **tâm lưới** nhất theo Rule 10 (lúc nạp thì chưa có camera). Không bao giờ làm mất đồ đã mua; hết chỗ thật thì giữ món đó ở kho ẩn và
    ghi 1 dòng console (đợt 1 không xảy ra vì lưới rộng hơn số đồ mua được).
12. Lưới không có trạng thái online nào — `12-` Rule 6/8 đã chặn mọi đường rò rỉ.
13. **Ô là đơn vị di chuyển.** Khách nhảy từ ô sang ô (kiểu Stacklands), nên lưới phải luôn đổi
    được toạ độ ô ↔ pixel cho code khác dùng, ở **mọi** mức zoom và mọi vị trí camera.

### Camera (mới 2026-09-20 (3) — Tuning pass (3))

14. **Camera có hai trạng thái:** `zoom` (hệ số phóng) và `pan` (góc trên-trái của khung nhìn, tính
    bằng pixel thế giới). Cả hai **không lưu vào save** — mở game lại thì camera căn lại vào giữa
    đống đồ đang có, vì đó luôn là chỗ người chơi muốn nhìn.
15. **Thao tác:**
    - Kéo trên **chỗ trống** của lưới = di chuyển camera. Kéo trên một **món đồ** = kéo món đồ
      (Rule 4) — ai bắt trước thì người đó giữ, không có chuyện vừa kéo đồ vừa trôi màn.
    - Cuộn chuột = zoom quanh **con trỏ** (điểm dưới con trỏ đứng yên).
    - Chụm hai ngón = zoom quanh **trung điểm hai ngón**, và trượt hai ngón cũng pan luôn.
    - Ngưỡng nhấc 6px như mọi thao tác kéo khác: chạm-rồi-nhả không làm camera nhích.
16. **Giới hạn — người chơi không bao giờ nhìn ra ngoài lưới.** Hai chốt:
    - `zoom` nằm trong `[zoomMin, ZOOM_MAX]`, với
      `zoomMin = max(rộng màn / rộng lưới, cao màn / cao lưới, CELL_MIN_PX / CELL_PX)` — thu hết cỡ
      thì lưới vẫn **phủ kín màn**, và ô vẫn không nhỏ hơn sàn tap target.
    - `pan` bị kẹp trong `[0, rộng lưới × zoom − rộng màn] × [0, cao lưới × zoom − cao màn]`.
    Hệ quả cố ý (yêu cầu 2026-09-20): **không kéo lên quá mép trên của lưới được**, nên vùng trống
    phía trên — nơi khách xuất hiện trước khi bước vào quán (`16-` Rule 3) — không bao giờ lộ ra.
17. **Cửa sổ resize:** `zoomMin` và cặp kẹp `pan` tính lại ngay; nếu zoom hiện tại thấp hơn
    `zoomMin` mới thì nâng lên đúng `zoomMin`, không để hở mép lưới một khung hình nào.

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `GRID_COLS` | 40 | 22–120 | GUESS | **sửa 2026-09-20 (3)** (từ 22): mặt bằng phải rộng hơn màn để có chỗ mà đi quanh. 40×56 = 2240px ≈ 1.75 màn ngang ở 1280 |
| `GRID_ROWS` | 28 | 14–80 | GUESS | **sửa 2026-09-20 (3)** (từ 14) — cùng lý do |
| `CELL_PX` | 56 | 40–80 | GUESS | **mới 2026-09-20 (3)**: cạnh ô ở zoom 1 — card facility 2×3 = 112×168, xấp xỉ thẻ bài trên tay |
| `CELL_MIN_PX` | 44 | 44+ | GUESS | nghĩa mới (3): **sàn cho ô sau khi nhân zoom**, tức chặn zoom-out. Vẫn đúng sàn tap target của `game-code.md` |
| `ZOOM_MAX` | 1.8 | 1–4 | GUESS | phóng hết cỡ ô 101px — đủ để ngắm một góc quán mà không thành màn hình vỡ |
| `ZOOM_WHEEL_STEP` | 0.0015 | 0.0005–0.005 | GUESS | hệ số nhân cho mỗi đơn vị `deltaY` của con lăn |
| footprint facility (`table_basic`, `kitchen_basic`…) | 2×3 | — | GUESS | **sửa 2026-09-20** (từ 2×2): dáng dọc 2:3 đúng tỉ lệ `.card` của bàn chơi, để card quán không bị bóp thành hình vuông — xem `ui/restaurant.md` Tuning pass (1) |
| footprint `decor` (chậu cây…) | 1×2 | — | GUESS | **sửa 2026-09-20** (từ 1×1): cùng lý do, card nhỏ vẫn phải là card dọc |

Lưới 40×28 chứa tối đa 20×9 = 180 món facility. "Vô hạn" theo nghĩa người chơi cảm nhận: mở rộng
quán = sửa **một con số** trong `config.ts`, không phải sửa code. Cố tình **không** làm lưới vô hạn
thật vì `firstFreeCell` và bước sửa toạ độ lúc nạp (Rule 10–11) cần một biên để quét.

## Edge cases

- **Quán khởi điểm:** bàn và bếp đặt sẵn cạnh nhau giữa lưới, không chồng nhau (toạ độ cố định trong
  `12-` Rule 3, không random).
- **Kéo món đồ chồng lên chính nó** (nhích 1 ô): hợp lệ — Rule 6 đã loại chính nó khỏi vật cản.
- **Thả ngay tại chỗ cũ / tap mà không kéo:** không đổi gì, không ghi save, không rung.
- **Kéo đồ ra sát mép màn:** không tự cuộn camera ở bản này — thả ở mép rồi pan tiếp rồi kéo tiếp.
  Ghi rõ là giới hạn đã biết; nếu playtest thấy vướng thì mở ticket "edge-scroll khi kéo".
- **Kéo đồ trong lúc đang zoom** (con lăn giữa chừng): ô đích tính lại từ zoom mới ngay khung hình
  đó (Rule 8 áp cho cả zoom lẫn pan, không chỉ resize).
- **Nhả chuột ngoài cửa sổ trình duyệt:** coi như thả không hợp lệ → bật về (tái dùng
  `pointercancel`/`lostpointercapture` đã xử lý ở `ui/table.ts`).
- **Lưới đầy:** không phải lỗi; shop là nơi báo (`15-`).
- **Đồ nằm dưới HUD / dải card điều hướng:** hai panel đó `pointer-events:none` (chỉ ô tên và 3 card
  nhận chạm), nên món đồ bên dưới vẫn nhấc và kéo ra được bình thường — nếu không thì đồ rơi vào
  góc trái trên có thể bị khoá cứng ở đó.

## Depends on

- `12-restaurant-meta.md` Rule 2, 4 — nguồn và đích của toạ độ.
- `15-shop-unlocks.md` Rule 3–4 — ai gọi "tìm ô trống đầu tiên".
- `design/ui/restaurant.md` — kích thước khu lưới, phản hồi hình ảnh lúc kéo.
- `design/ui/table.md` + `src/ui/table.ts` — lớp Pointer Events và ngôn ngữ "bật về + rung" dùng lại.

## Done when

- Kéo cái bàn sang ô khác → snap đúng ô, F5 vẫn ở chỗ mới.
- Kéo bàn chồng lên bếp → bật về chỗ cũ + rung + viền đỏ, save không đổi.
- Kéo ra ngoài mép lưới → bật về.
- Ở 1280×800 và 1024×700: ô ≥ 44px ở mọi mức zoom, không đè zone nào.
- Mua món mới từ shop → xuất hiện ở ô trống **gần giữa màn**, thấy ngay, kéo đi được ngay.
- Sửa tay toạ độ trong localStorage thành `x: 99` rồi F5 → món đó về ô trống gần tâm lưới, không mất.
- Cuộn chuột phóng to/thu nhỏ quanh con trỏ; kéo chỗ trống thì màn đi theo tay; kéo trúng món đồ
  thì món đồ đi theo tay chứ màn đứng yên.
- Thu hết cỡ: lưới vẫn phủ kín màn, **không** thấy mép lưới hay vùng đen nào ở bất kỳ hướng nào —
  đặc biệt là phía trên.
- Resize cửa sổ lúc đang thu hết cỡ → vẫn không hở mép.
