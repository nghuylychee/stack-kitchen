# 16 — Customers & Idle Income (khách vào quán, thu nhập lúc vắng mặt)

**Status:** BUILT (2026-09-20, backlog #31; khách vào từ cạnh trên #33, vòng nấu chạy mượt #34;
nhân viên nấu thay bếp #37; nhịp hiện card món + tiền bay #40; icon trạng thái #41;
bảy loại khách có ảnh thật, card 2×2 #43)
**Attaches to:** màn quán (`12-restaurant-meta.md`) — khách chạy trên chính lưới của
`13-restaurant-grid.md`, gọi món từ menu quán (`17-restaurant-menu.md`), trả gold/XP vào save
theo đúng đường của `14-gold-xp-level.md`.

## Overview

Quán có người vào. Khách đi **từ phía trên màn** xuống, **nhảy từng ô** qua mặt bằng tới một cái bàn trống, gọi
một món trong menu quán, bếp nấu, món ra thì khách ăn rồi trả tiền và nhảy ra cửa. Người chơi
không phải bấm gì — đây là nguồn thu thứ hai, chạy trong lúc ngắm quán, và vẫn cộng dồn (có trần)
cho khoảng thời gian không mở màn quán. Bàn quyết định **bao nhiêu khách cùng lúc**, bếp là **chỗ nấu**, nhân viên
(`18-staff.md`) là **tay làm** — thiếu bất kỳ cạnh nào thì khách chờ lâu rồi bỏ đi.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: đợt 1 quán đứng im, giờ nó **tự sống**. Mở game ra có cái để nhìn, và mỗi món đồ mua
  trong shop thấy ngay hệ quả (thêm bàn = thêm khách, thêm bếp = khách bớt chờ).
- Intended: khép vòng lặp — đánh ván ra gold → mua bàn/bếp → khách trả gold nhanh hơn → mua tiếp.
  Ván bài vẫn là nguồn thu chính (`14-` một ván ≈ 120 gold ≈ vài phút quán đông).
- Degenerate: **mở tab cả đêm để cày**. Chặn ba lớp: tốc độ thu nhỏ hơn hẳn thưởng ván, thu lúc
  vắng mặt có **trần** (Rule 9) và nhân hệ số < 1, và gold chỉ mua được đồ không đụng ván bài
  (`12-` Rule 6) — cày cả đêm chỉ đổi lấy cái quán đẹp hơn.
- Degenerate: **mua 10 bàn, 1 bếp** cho đông khách. Tự phạt: một bếp + một nhân viên phục vụ lần
  lượt, khách thứ n chờ quá `CUS_PATIENCE_MS` là bỏ đi tay không (Rule 7, `18-`) — thu nhập không
  tăng mà quán trông thảm.
- Degenerate: xếp bàn dồn một góc cho khách đi ít bước. Vô nghĩa — khách nhảy thẳng, không né vật
  cản (Rule 4), nên bố cục không đổi tốc độ. Bố cục vẫn thuần **expression** (`13-`).
- Online / bots: không có dynamic nào. Khách không tồn tại ngoài màn quán.

**Aesthetics**

| | |
|---|---|
| **Primary** | fantasy |
| **Secondary** | sensation |
| **Serves the core by** | biến cái quán tĩnh của `12-` thành nơi *đang chạy* — thứ người chơi nấu trong ván bài giờ có người ăn. Nhịp nhảy + đồng xu bay là phần **sensation** mà bàn chơi không có chỗ chứa |

## Rules

1. **Sức chứa.** Số chỗ ngồi = số item `table_basic` trong save. Số bếp = số item `kitchen_basic`
   + `kitchen_extra`. Không có bàn (hoặc menu quán rỗng) → không có khách nào vào, kèm một dòng
   nhắc trên màn.
2. **Khách chỉ sống khi màn quán đang hiện.** Vào ván, vào lobby, đóng tab → vòng đời dừng, khách
   biến mất; khoảng thời gian đó tính theo Rule 9 (thu lúc vắng mặt), **không** mô phỏng lại.
3. **Sinh khách — từ phía trên.** Cứ `CUS_SPAWN_MS` một lần, nếu còn chỗ ngồi trống thì một khách
   xuất hiện ở **ô cửa**: giữa cạnh **trên** lưới, và lùi hẳn lên **trên mép lưới** (`y` âm) để
   bước đầu tiên là bước *đi vào quán* chứ không phải hiện ra giữa sàn (sửa 2026-09-20 (3), trước
   đó cửa ở cạnh dưới). Camera không bao giờ nhìn được lên trên mép lưới (`13-` Rule 16) nên chỗ
   khách chờ trước khi vào là vùng khuất — không ai thấy khách "mọc ra". Khách rời quán thì nhảy
   ngược lên đúng ô đó rồi biến mất. Loại khách rút ngẫu nhiên theo trọng số ở bảng Numbers.
   **Dàn khách là dữ liệu, không phải code** (sửa 2026-09-20 (6)): cả bảy loại nằm ở `CUS_TYPES`
   trong `src/core/config.ts`, mỗi dòng là `id · name · tip · weight · art`. Thêm một loại =
   thả ảnh vào `public/art/NPC/` + thêm một dòng, không sửa luật. `name` là in-game text nên
   tiếng Anh; ảnh xem `design/art.md` "Restaurant meta" §5b.
4. **Di chuyển = nhảy từng ô** (`design/art.md` "Restaurant meta" §5 — ref Stacklands). Mỗi bước
   `HOP_MS`: nhích đúng **một ô** về phía đích, ưu tiên trục còn lệch nhiều hơn (bằng nhau thì trục
   x trước), card nhấc lên `HOP_LIFT` và nghiêng `HOP_TILT` rồi đáp xuống. Khách **không né vật
   cản** và **không chiếm ô** của lưới: đồ đạc vẫn đặt/kéo được bình thường bên dưới (`13-` Rule 6
   chỉ xét item với item).
5. **Chỗ ngồi** của một bàn là ô ngay bên phải footprint bàn, cùng hàng giữa; lọt ra ngoài lưới thì
   lấy ô bên trái; vẫn không được thì ngồi đè lên chính ô bàn. Mỗi bàn nhận **một** khách.
6. **Gọi món.** Ngồi xuống xong, sau `CUS_ORDER_MS` khách gọi **một món ngẫu nhiên trong menu quán**
   (`17-`). Món đã gọi không đổi nữa. Lúc này **chưa có card món nào trên màn** (sửa 2026-09-20 (4)):
   card món chỉ xuất hiện khi nó thật sự tồn tại — tức là khi bếp bắt đầu nấu (`18-` Rule 7).
7. **Nấu — do nhân viên làm** (sửa 2026-09-20 (3), `18-staff.md`). Món **không** tự nấu nữa: một
   **nhân viên** phải tới bàn nhận order, mang về một **bếp rảnh** rồi đứng nấu ở đó. Thời gian nấu
   vẫn là `COOK_PER_CARD_MS × số nguyên liệu của công thức` (`core/data.ts` `RECIPES`) — món nhiều
   điểm thì lâu hơn và trả nhiều hơn, đó là đánh đổi của `17-`. Vòng tiến trình phải chạy **mượt
   theo từng khung hình**, không giật theo nhịp `TICK_MS` (sửa 2026-09-20 (3)): nó là **một**
   animation đặt một lần lúc bắt đầu nấu, dài đúng bằng thời gian nấu, do trình duyệt nội suy —
   vòng đời vẫn chạy theo timer, chỉ có phần vẽ là tách ra. Từ (4) vòng này nằm quanh bong bóng
   **trên đầu nhân viên**, ở đúng chỗ cái bếp (`18-` Rule 7). Đồng hồ `CUS_PATIENCE_MS` tính từ lúc
   gọi món và **dừng lại khi có nhân viên nhận order** (`18-` Rule 9); trong lúc nó chạy, trên đầu
   khách có **đồng hồ cát kèm vòng đếm ngược vơi dần màu cảnh báo** — người chơi phải nhìn thấy
   được quán mình đang để khách chờ (thêm 2026-09-20 (5)). Hết kiên nhẫn trước khi ai nhận → khách
   bỏ đi tay không, card rung, không gold, không XP.
8. **Ăn và trả tiền.** Nhân viên bưng món tới bàn → **card món chuyển sang trên đầu khách**, vòng
   tiến trình chạy lại lần nữa, lần này dài đúng `CUS_EAT_MS` — đó là hình ảnh của *đang ăn*
   (sửa 2026-09-20 (4)). Ăn xong khách trả:
   - `gold = round((CUS_GOLD_BASE + CUS_GOLD_PER_PT × điểm món) × tip của loại khách)`
   - `xp = CUS_XP_BASE + CUS_XP_PER_PT × điểm món`
   Gold/XP cộng qua đúng `applyReward` của `14-` (lên level dùng chung một đường cong), ghi save
   ngay, và `+N` **bay từ chỗ khách về viên gold trên card chef** rồi mới nảy số (sửa 2026-09-20 (4))
   — nối thẳng *ai trả* với *tiền vào đâu*. Sau đó khách nhảy về ô cửa rồi biến mất, bàn trống lại.
9. **Thu nhập lúc vắng mặt** (dùng `lastSeen` của `12-` Rule 9): lúc màn quán hiện ra, tính
   `away = now − lastSeen`, chặn trần `IDLE_CAP_H` giờ, rồi
   `gold = floor(away_capped / IDLE_CYCLE_MS) × min(số chỗ ngồi, số bếp, số nhân viên) × giá trung
    bình một khách × IDLE_RATE` (nút thắt giống hệt lúc có mặt — `18-` Rule 12),
   `xp` tính cùng cách. "Giá trung bình một khách" lấy theo điểm trung bình của các món **đang có
   trong menu quán**, tip coi như 1.0. Không bàn, không bếp, không nhân viên hoặc menu rỗng → 0.
10. **Chống cộng trùng:** `lastSeen` được ghi lại ngay khi đã cộng thu nhập vắng mặt, và vòng đời
    khách cũng chạm save mỗi `IDLE_TOUCH_MS` — nên thời gian đang ngồi xem quán không bao giờ bị
    tính thành thời gian vắng mặt.
11. **Báo cáo:** thu nhập vắng mặt ≥ 1 gold thì hiện **một** dòng "While you were away +N" trên màn
    quán (in-game text tiếng Anh), không modal, không chặn thao tác. < 1 gold thì im lặng.
12. **Không đụng ván bài** (`12-` Rule 6 nhắc lại): khách, bàn, bếp không đổi luật, không đổi thẻ,
    không vào `View`/`HostEvent`/`Intent`, không gửi gì qua mạng, **không** bump `PREFIX`.
13. Khách **không lưu vào save** — mỗi lần mở màn quán là một mẻ khách mới. Chỉ gold/XP/level và
    `lastSeen` được lưu.
14. **Khách là card vuông 2×2 ô** (thêm 2026-09-20 (6); trước đó 1×2 như decor). Người **to hơn đồ
    đạc** là thứ tự đọc đúng của cái quán, và khung vuông chứa vừa một hình người đứng cả thân —
    ở 1×2 thì bảy loại khách nhìn như nhau hết, mà *nhận ra ai đang ngồi bàn mình* chính là chỗ
    `tip` thành một thứ người chơi đọc được chứ không phải một con số ngầm. Chỗ ngồi (Rule 5) và
    chỗ đứng cạnh bàn của nhân viên (`18-` Rule 3) vì thế cũng cách nhau **2 ô**, và cả hai chỗ
    chỉ hợp lệ khi lưới còn đủ **2 cột** cho cả card. Khách vẫn **không chiếm ô** của lưới
    (Rule 4), nên card to hơn không hề làm hẹp mặt bằng.

## Numbers

Toàn bộ **GUESS** — chưa ai chơi thử. Số nằm trong `src/core/config.ts` để người duyệt tự vặn.

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `HOP_MS` | 260 | 150–500 | GUESS | đủ chậm để thấy từng bước, đủ nhanh để đi ngang lưới 22 ô không chán |
| `HOP_LIFT` | 0.35 | 0.1–0.6 | GUESS | độ nhấc theo tỉ lệ cạnh ô — có trọng lượng, không "bay" |
| `HOP_TILT` | 7 | 0–15 | GUESS | độ nghiêng (deg) giữa bước nhảy |
| `CUS_SPAWN_MS` | 5000 | 2000–20000 | GUESS | quán 1 bàn: một khách mỗi ~5s + thời gian phục vụ |
| `CUS_ORDER_MS` | 900 | 300–3000 | GUESS | một nhịp để đọc bong bóng món |
| `COOK_PER_CARD_MS` | 2500 | 800–6000 | GUESS | món 2 thẻ 5s, món 4 thẻ 10s — đủ để thấy bếp là nút thắt |
| `CUS_EAT_MS` | 2600 | 800–6000 | GUESS | |
| `CUS_PATIENCE_MS` | 22000 | 8000–60000 | GUESS | đủ cho 1 món 4 thẻ (10s) + chờ 1 lượt bếp; quá mức đó là quán thiếu bếp thật |
| `CUS_GOLD_BASE` | 2 | 0–20 | GUESS | khách món rẻ vẫn bõ |
| `CUS_GOLD_PER_PT` | 1 | 1–8 | GUESS | món 2 điểm = 4 gold, món 7 điểm = 9 gold. Quán 1 bàn ≈ 18 gold/phút ngồi xem, vẫn thua một ván (~120 gold/vài phút) — ván bài phải là nguồn chính (`14-`) |
| `CUS_XP_BASE` | 1 | 0–5 | GUESS | XP từ khách cố tình nhỏ — level chủ yếu đến từ ván bài |
| `CUS_XP_PER_PT` | 1 | 0–3 | GUESS | |
| loại khách (`CUS_TYPES`) | bảy loại, xem bảng ngay dưới | tip 0.5–2.5 · weight 1–10 | GUESS | **sửa 2026-09-20 (6)**: từ ba loại (Local/Student/Tourist) lên bảy, theo ảnh thật ở `art.md` §5b. Tổng weight = 20, tip trung bình 1.055 ≈ đúng bằng 1.03 của bộ ba cũ — dàn rộng ra nhưng **thu nhập không đổi**, nên các số còn lại trong bảng này không phải tính lại |
| `CUS_W` × `CUS_H` | 2×2 | — | GUESS | **sửa 2026-09-20 (6)** (từ 1×2): Rule 3b |
Dàn khách (Rule 3, `art.md` §5b) — `weight` càng lớn càng hay gặp:

| Loại | `tip` | `weight` | Vì sao |
|---|---|---|---|
| Student | 0.7 | 5 | khách nền: đông nhất, trả ít nhất |
| Street Vendor | 1.0 | 4 | mốc chuẩn — đúng 1.0, mọi loại khác đọc so với người này |
| Delivery Rider | 0.9 | 4 | ghé nhanh, trả đủ, không hào phóng |
| Tourist | 1.6 | 2 | hiếm và đáng chờ (giữ nguyên từ bộ ba cũ) |
| Police Officer | 1.2 | 2 | khách quen của quán vỉa hè |
| Businessman | 2.0 | 2 | trần trên — thấy vest là thấy một ván tiền |
| Gangster | 0.4 | 1 | trần dưới và hiếm nhất: **ngồi hết một bàn, chiếm một lượt nấu, gần như không trả gì**. Đây là con xúc xắc của dàn — phải có một loại khách khiến người chơi tiếc cái bàn, nếu không thì mọi khách đều là gold và không loại nào đáng nhìn mặt |

| `IDLE_CYCLE_MS` | 300000 | 60000–900000 | GUESS | **một lượt khách lúc vắng chủ** — cố tình thưa hơn hẳn lúc ngồi xem (~13s/khách): vắng mặt là chế độ nhỏ giọt, không phải chế độ cày |
| `IDLE_RATE` | 0.5 | 0–1 | GUESS | và mỗi lượt đó chỉ ăn **nửa** tiền — hai núm riêng: `IDLE_CYCLE_MS` là *bao lâu một khách*, `IDLE_RATE` là *giữ được bao nhiêu* |
| `IDLE_CAP_H` | 8 | 1–24 | GUESS | trần thu vắng mặt; một đêm ngủ là kịch trần. Quán khởi điểm (1 bàn, 2 món 2 điểm) kịch trần ≈ 190 gold ≈ 1.5 ván — đủ để mở game thấy vui, không đủ để thay việc chơi |
| `IDLE_TOUCH_MS` | 10000 | 2000–60000 | GUESS | nhịp chạm `lastSeen` lúc đang xem quán (Rule 10) |
| `TICK_MS` | 120 | 60–500 | GUESS | nhịp chạy vòng đời; dùng timer chứ không `requestAnimationFrame` vì rAF đứng khi tab ẩn |

## Edge cases

- **Menu quán rỗng** (`17-`): không sinh khách, hiện một dòng nhắc "Pick a dish for your menu" —
  không phải lỗi.
- **Không có bàn nào** (người chơi chưa mua, hoặc save lạ): không sinh khách, không lỗi.
- **Bán/xoá bàn:** đợt này chưa có (`15-` Rule 6), nên không có tình huống bàn biến mất khi khách
  đang ngồi.
- **Kéo cái bàn đi trong lúc khách đang ngồi:** khách đi theo bàn — ô ngồi tính lại mỗi tick từ vị
  trí bàn hiện tại, không cần huỷ khách.
- **Món bị bỏ khỏi menu quán trong lúc khách đang chờ:** khách vẫn được phục vụ món đã gọi.
- **Lưới co lại khi resize:** vị trí khách tính theo **ô**, nhân với `cell` hiện tại — resize không
  làm khách lệch khỏi bàn (`13-` Rule 13).
- **Tab bị ẩn / throttle:** timer chậm lại chứ không dừng; mọi mốc thời gian so bằng `Date.now()`
  nên chỉ thô đi, không sai.
- **`lastSeen` ở tương lai** (đổi giờ hệ thống, sửa tay localStorage): `away` âm → coi như 0.
- **Save bị chặn** (`12-` Edge cases): khách vẫn chạy và vẫn trả gold trong phiên; mất khi đóng tab,
  đúng như cảnh báo đã hiện.
- **Lên level nhờ tiền khách trong lúc shop đang mở:** shop đổi trạng thái ngay (`15-` Edge cases).

## Depends on

- `12-restaurant-meta.md` — save, `lastSeen`, ranh giới với ván bài.
- `13-restaurant-grid.md` Rule 13 — đổi ô ↔ pixel để khách nhảy đúng ô.
- `14-gold-xp-level.md` Rule 7 — cùng một `applyReward`, cùng một đường cong level.
- `15-shop-unlocks.md` — bàn và bếp mua ở đây; đây là chỗ hai món đó **có tác dụng thật** (`15-` Rule 7).
- `17-restaurant-menu.md` — danh sách món khách gọi.
- `18-staff.md` — nhân viên nhận order, giữ bếp và nấu; sửa Rule 7 và Rule 9 của doc này.
- `design/art.md` "Restaurant meta" §1 (`--cus`), §3 (`public/art/NPC/`), §5 (nhịp nhảy),
  §5b (dàn bảy loại khách + ảnh).

## Done when

- Mở màn quán với 1 bàn + 1 bếp + menu có món: khách hiện ở cửa, **nhảy từng ô** tới bàn, gọi món,
  món nấu xong, khách ăn, gold/XP tăng đúng công thức, khách nhảy ra cửa và biến mất.
- Mua thêm bàn → hai khách cùng lúc; mua thêm bếp **và** có đủ nhân viên → hai món nấu song song
  (`18-`).
- 1 bàn + 1 bếp nhưng menu toàn món 4 thẻ: nhìn thấy khách chờ; ép chờ quá `CUS_PATIENCE_MS` →
  khách bỏ đi, không cộng gold.
- Kéo bàn sang chỗ khác lúc khách đang ngồi → khách bám theo bàn, không kẹt.
- Vào ván rồi quay ra (hoặc sửa `lastSeen` lùi 1 giờ rồi F5) → hiện đúng một dòng "While you were
  away +N", gold tăng đúng, và **không** cộng lần hai khi F5 tiếp.
- Sửa `lastSeen` lùi 3 ngày → thu nhập bị chặn ở trần 8 giờ.
- Menu rỗng hoặc không có bàn → không có khách, có dòng nhắc, không lỗi console.
- `grep`: `core/`, `ai/`, `net/` vẫn không import `meta/`; không có message mới trong `net/room.ts`.
