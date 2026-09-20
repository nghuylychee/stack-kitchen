# UI — Restaurant (màn chính, thay `#home`)

**Status:** BUILT (2026-09-20) — Tuning pass (6): card chef xuống góc trái dưới + gold về card
`SHOP` + nút toggle dải card (#42). Khung + HUD + 3 card điều hướng + save (#24), đồng bộ mặt card +
lưới phủ màn (#28, #29), kéo thả đồ (#25), HUD gold/XP + thưởng sau ván (#26), `#shopModal` (#27).
Đợt 2 (mục "Đợt 2" cuối trang) đã build: card `MENU` + `#menuModal` (#30), lớp khách `#rest-cus`
+ hai dòng nhắc dưới HUD (#31). Tuning pass (5): ba icon trạng thái + vòng kiên nhẫn (#41).
Tuning pass (4): nhịp hiện card món + tiền bay + bỏ khoá món (#40).
Tuning pass (2): camera (#32), cửa cạnh trên (#33), vòng nấu mượt
(#34), HUD Hay Day (#35 — sau đó bị bác). Tuning pass (3): HUD dựng bằng card (#36), card nhân
viên (#37), sửa vòng tiến trình bị méo (#38).
**Đối tượng:** `12-restaurant-meta.md` (state) · `13-restaurant-grid.md` (lưới) ·
`14-gold-xp-level.md` (HUD số liệu) · `15-shop-unlocks.md` (overlay shop) ·
`16-customers-idle.md` (khách) · `17-restaurant-menu.md` (bảng menu) · `18-staff.md` (nhân viên).
`design/ui/table.md` không đổi, trừ một dòng: nút `Home` ở HUD bàn chơi quay về màn này.

## Khung màn

```text
┌──────────────────────────────────────────────────────────────┐
│ #rest-hud            (góc trái trên)                         │
│  tên (sửa được) · Level N + thanh XP · ♦ gold                │
│                                                              │
│                #rest-grid   (lưới 12×8, căn giữa)            │
│                                                              │
│                                                              │
│         #rest-nav  [ PLAY VS BOTS ] [ ONLINE ] [ SHOP ]      │
└──────────────────────────────────────────────────────────────┘
```

Một màn duy nhất, không cuộn dọc ở 1280×800 và 1024×700. Overlay shop nổi trên chính màn này.

## Tuning pass (1) — 2026-09-20, sau khi người duyệt xem bản #24

Hai điều người duyệt yêu cầu sửa, áp thẳng vào các mục dưới:

1. **Lưới phải chiếm trọn màn hình**, không còn là một ô vuông nhỏ giữa màn. `#rest-stage` phủ
   kín viewport; `cell` tính theo **toàn bộ** viewport chứ không phải phần còn lại sau khi trừ HUD.
   `#rest-hud` và `#rest-nav` chuyển thành **panel nổi bán trong suốt** đè lên lưới (như HUD game),
   không còn ăn chỗ của lưới nữa — thay cho luật cũ "HUD không bao giờ đè lưới".
2. **Card trong quán phải cùng một bộ mặt với card trong ván bài.** `.ritem` không còn là hộp tối
   tự vẽ: nó dùng **đúng class `.card` + `.hdr` + `.ph` của `ui/table.md`** (mặt kem `--ing-bg`,
   viền 2px `--ing-border`, dải tên nằm **trên đỉnh**, ô ảnh lõm bên dưới, cùng công thức bo góc và
   đổ bóng), chỉ khác ở viền loại (`--fac`/`--dec`, `art.md` "Restaurant meta" §1). `.nav-card`
   cũng mang cùng mặt card đó. Hệ quả: footprint đổi sang **dáng dọc** để card không bị bóp méo —
   xem `13-restaurant-grid.md` Numbers.
3. **Sửa tiếp cùng ngày (2):** lưới phủ kín màn nhưng chỉ 12×8 ô nên ô phải to ~100px, card quán
   phình gấp đôi thẻ bài — "zoom in quá" trên màn ngang. Sửa bằng lưới **dày hơn chứ không phải ô to
   hơn**: `GRID_COLS`/`GRID_ROWS` 12×8 → 22×14, thêm trần `CELL_MAX_PX` chặn ô lớn trên màn rộng.
   Lưới vẫn phủ kín màn, card về cỡ xấp xỉ thẻ trên tay.

## Zone sizes

| Zone | Vị trí | Kích thước | Ghi chú |
|---|---|---|---|
| `#restaurant` | screen | `100vw × 100vh` | thay `#home`; `#lobby`, `#app` giữ nguyên |
| `#rest-hud` | trên-trái, `16px` lề | rộng `clamp(220px, 22vw, 300px)`, cao theo nội dung | panel **nổi** trên lưới, nền bán trong suốt (Tuning pass (1)) |
| `#rest-grid` | giữa, phủ kín màn | `GRID_COLS × cell` × `GRID_ROWS × cell`, căn giữa viewport | `cell` theo `13-` Rule 3 tính trên **toàn viewport**, sàn 44px và trần 64px |
| `#rest-nav` | dưới, nổi | cao `clamp(150px, 21vh, 196px)` | 3 card ngang căn giữa (mỗi card rộng `clamp(96px,10vw,124px)`, cao 1.4×), nền chuyển màu mờ dần, đè lên lưới |
| `#shopModal` | overlay | box `max-width 720px`, `max-height 80vh` | tái dùng `.modal` sẵn có |

## Elements

| Element | Nội dung | States |
|---|---|---|
| `#rest-name` | tên người chơi | idle → tap/click = thành `<input>` tại chỗ; blur/Enter = lưu. Rỗng → placeholder "Tap to name your chef" |
| `#rest-level` | `Level N` + thanh XP `xp / xpToLevel(N)` | thanh chạy mượt khi XP tăng; lên level = thanh đầy → reset + `punch` (tái dùng keyframe có sẵn) |
| `#rest-gold` | biểu tượng + số gold | tăng: `punch` + `+N` bay lên (tái dùng `.pop` của bàn chơi, cùng `--gold`) |
| `#rest-save-warn` | 1 dòng nhỏ dưới HUD | chỉ hiện khi localStorage bị chặn (`12-` Edge cases): "Progress can't be saved in this browser" |
| `.rest-item` | card của món đồ trong lưới | idle · hover-lift (chuột) · dragging (ghost theo con trỏ) · drop-ok (viền `--gold`) · drop-bad (viền `--invalid` + rung) — cùng ngôn ngữ `.card` ở bàn chơi |
| `.nav-card` | 3 card điều hướng | idle (wobble rất nhẹ) · hover-lift · pressed. Kích thước ≈ 1.4× thẻ bài, tối thiểu 44px mọi chiều |
| `#shopModal .shop-card` | card món đồ trong shop + nhãn footprint ("2×3", số lấy từ `13-` Numbers) góc card, `--text-dim` — người duyệt đã chốt 2026-09-20 | mua được · thiếu gold (giá `--invalid`) · khoá level ("Level N") · hết chỗ (mờ + "No room left") — `15-` Rule 3 |

## Ba card điều hướng

| Card | Nhãn (in-game) | Hành vi |
|---|---|---|
| 1 | `PLAY VS BOTS` | mở popover nhỏ chọn 2/3/4 người (đúng 3 nút `seg` của Home cũ) → vào ván ngay |
| 2 | `ONLINE ROOM` | mở popover: `Create room` + ô nhập `CODE` + `Join` (đúng nội dung Home cũ) |
| 3 | `SHOP` | mở `#shopModal` |

Popover neo ngay trên card, đóng khi tap ra ngoài — không chuyển màn, để quán luôn là chỗ đứng.

## Interactions

- **Kéo thả đồ trong lưới:** `13-` Rule 4–8. Pointer Events, ghost ở `#drag-layer` dùng lại của bàn chơi.
- **Sửa tên:** tap `#rest-name` → input tại chỗ, tối đa 12 ký tự (bằng `#nick` cũ), Enter/blur = lưu.
- **Vào ván:** chọn chế độ ở popover → `#restaurant` ẩn, `#app`/`#lobby` hiện như hiện tại.
- **Về từ ván:** nút `Home` ở HUD bàn chơi → quay lại `#restaurant`; nếu ván vừa kết thúc có thưởng
  thì gold/XP đã cộng (`14-`), HUD chạy animation tăng **một lần** ngay khi màn quán hiện ra.
- **Mua đồ:** `15-` Rule 4. Card bay từ vị trí trong shop về đúng ô trong lưới (tái dùng đường bay
  + easing của `intro-fly` ở `ui/table.md`), shop vẫn mở để mua tiếp.

## Edge cases

| Tình huống | Xử lý |
|---|---|
| Vào game lần đầu, tên rỗng | vẫn chơi được ngay; ván dùng tên mặc định (`12-` Rule 7), HUD chỉ nhắc bằng placeholder |
| Resize giữa lúc kéo đồ | ô đích tính lại theo layout mới mỗi `pointermove` (`13-` Rule 8) — không huỷ thao tác |
| Màn quá hẹp cho lưới ở `CELL_MIN_PX` | `#rest-stage` cuộn, HUD và `#rest-nav` đứng yên (chúng nổi, không cuộn theo) |
| Đồ nằm dưới HUD / dải card | chấp nhận được: HUD và nav bán trong suốt nên vẫn thấy lờ mờ, và người chơi kéo được đồ ra chỗ khác (#25). Không cấm đặt đồ ở đó |
| Mở link `?room=CODE` | không dừng ở màn quán, vào thẳng lobby (`12-` Rule 10) |
| Gold tăng khi đang mở shop | số trên HUD và trạng thái các card cập nhật ngay trong khung hình đó |
| Thiếu ảnh của một món đồ | placeholder theo `design/art.md` mục "Restaurant meta" — không vỡ lưới |

## Empty / error states

- **Quán khởi điểm:** 1 bàn + 1 bếp giữa lưới, phần còn lại là ô trống có lưới mờ — cố ý để thấy
  ngay "còn nhiều chỗ để lấp", không có chữ placeholder nào.
- **Không lưu được:** `#rest-save-warn` (một dòng, `--text-dim`), không modal, không chặn gì.

## Done when

- Mở game → thấy quán, HUD đúng số liệu trong save, 3 card điều hướng bấm ra đúng chỗ.
- Cả 3 đường vào ván cũ đều còn: 2/3/4 người vs bots · Create room · Join bằng mã.
- Sửa tên trên HUD → vào ván thấy đúng tên ở ghế mình.
- Kéo một món đồ sang ô khác rồi F5 → vẫn ở chỗ mới.
- Đánh xong một ván rồi về quán → gold/XP chạy animation đúng một lần, số khớp `14-`.
- 1280×800 và 1024×700: lưới phủ kín màn (không còn khung nhỏ giữa màn), HUD và dải card nổi trên
  lưới, mọi thứ bấm được ≥ 44px, không cuộn dọc cả màn.
- Đặt card quán cạnh ảnh chụp bàn chơi: cùng mặt kem, cùng viền, cùng dải tên trên đỉnh — chỉ khác màu viền loại.
- Không còn `#home` trong DOM; `?room=CODE` vẫn vào thẳng lobby.

## Đợt 2 — khách và bảng menu (2026-09-20, doc `16-` + `17-`)

Không đụng gì tới bố cục đã chốt ở trên; chỉ thêm **một card điều hướng**, **một overlay** và
**một lớp vẽ** nằm giữa lưới và HUD.

### Thêm vào khung màn

| Zone | Vị trí | Kích thước | Ghi chú |
|---|---|---|---|
| `#rest-nav` | như cũ | như cũ | giờ có **4** card: `PLAY VS BOTS` · `ONLINE ROOM` · `SHOP` · `MENU` |
| `#rest-cus` | trong `#rest-grid`, phủ kín lưới | theo lưới | `pointer-events:none`, `z-index` trên `.ritem`: khách **không** chắn thao tác kéo đồ (`16-` Rule 4) |
| `#menuModal` | overlay | box `max-width 720px`, `max-height 80vh` | cùng khuôn `.modal` với `#shopModal` |
| `#rest-away` | dưới HUD | một dòng | "While you were away +N" (`16-` Rule 11), tự ẩn sau ~6s |
| `#rest-reset` | góc **phải dưới**, `right/bottom 14px` | 44×44 tròn | nút reset (cheat) — xem mục dưới (thêm 2026-09-20 (7)) |

### Nút reset (cheat) — `#rest-reset` (thêm 2026-09-20 (7), backlog #44)

Nút **cheat cho người test**, không phải một mechanic: xoá sạch save và dựng lại quán khởi điểm
(`12-` `startSave()`) để chơi lại từ đầu mà không phải mở DevTools xoá `localStorage` bằng tay.
Vì là cheat nên nó **không** được viết thành `NN-*.md` — không có Dynamics, không có Aesthetics,
không có số nào để tune. Nó sống ở đây, cùng chỗ với mọi thứ khác người chơi chạm vào.

- **Vị trí:** góc **phải dưới**, `right:14px; bottom:14px`, `z-index:4` (nổi trên dải gradient của
  `#rest-nav`). Cố ý **đối xứng với `#rest-toggle`** ở góc trái dưới và dùng lại đúng hình khối đó
  — tròn 44×44, nền `--panel`, viền `--panel-border`, icon nét SVG. Không đẻ khuôn mới.
- **Mờ lúc nghỉ** (`opacity:.55`, hover mới rõ): nó không phải thứ người chơi cần thấy trong lúc
  chơi, nhưng cũng không được giấu tới mức phải đi tìm.
- **Hai nhịp chạm, không `confirm()`:**
  1. Nhịp 1 "nạp đạn" — nút đổi sang `--invalid` (đỏ), nảy một cái, `aria-label`/`title` đổi thành
     "Tap again to wipe the restaurant", kèm toast `Tap again to wipe your restaurant`.
  2. Nhịp 2 trong vòng `ARM_MS` = **6s** → xoá thật, toast `Restaurant reset`. Quá 6s thì tự nguội
     về trạng thái thường — không bao giờ kẹt ở đỏ.

  Không dùng `confirm()` của trình duyệt vì nó **chặn cả vòng đời khách đang chạy** (`16-` Rule 2
  chạy trên timer) và nhìn không thuộc về game.
- **Xoá những gì:** `save` về `startSave()` (level, gold, XP, tên, đồ đạc, menu, số nhân viên),
  mẻ khách + kíp nhân viên đang chạy, thưởng/mở khoá còn treo, và camera (căn lại vào quán mới).
  Shop/Menu/popover đang mở thì đóng. **Không** đụng ván bài hay phòng online (`12-` Rule 6) —
  nút chỉ có mặt trên màn quán, mà màn quán chỉ hiện khi không có ván nào đang chạy.

### Card khách (`.cus`)

- Vẫn là **`.card` thật** như mọi card khác (Tuning pass (1)): mặt kem, dải tên trên đỉnh, ô ảnh
  lõm. Khác duy nhất: viền `--cus` (`art.md` "Restaurant meta" §1), footprint **2×2** —
  **card vuông, to hơn decor** (sửa 2026-09-20 (6), trước đó 1×2; lý do ở `16-` Rule 14). Card
  nhân viên (`.cus.staff`) dùng đúng kích thước đó, chỉ đổi viền sang `--staff`.
- Ảnh nằm ở `public/art/NPC/<Tên>.<đuôi>`, tên file khai ở `CUS_TYPES` / `STAFF_ART`
  (`art.md` §3). Ô ảnh là **`object-fit:contain` trên nền trắng** — ảnh NPC là hình cắt nền, `cover`
  sẽ xén mất đầu và chân. Ảnh chưa tải được → giữ placeholder chữ cái đầu (`art.md` §2), không bao
  giờ hiện icon ảnh hỏng.
- Dải tên là in-game text tiếng Anh và bị cắt bằng `ellipsis` nếu dài — tên loại khách dài nhất
  hiện tại ("Delivery Rider") vừa đủ ở 2 ô, thêm loại mới thì phải kiểm lại ở zoom nhỏ nhất.
- **Card đồ đạc không bị dựng lại khi lưới render lại** (sửa 2026-09-20 (7), backlog #44). Bản
  trước `renderGrid()` xoá sạch `#rest-grid` rồi dựng lại tất cả, nên mỗi lần thả **một** món đồ
  là **mọi** card mất `<img>` rồi gắn lại qua sự kiện `load` — `load` luôn async kể cả khi ảnh đã
  nằm trong cache, nên luôn có ít nhất một khung hình cả lưới trơ ra placeholder chữ cái: người
  chơi thấy đúng một cú **nháy toàn màn**. Giờ lưới render theo kiểu **đối chiếu theo `data-id`**
  (cùng cách `renderActors()` vẫn làm với khách): card cũ giữ nguyên node, chỉ cập nhật
  `left/top/--w/--h`; chỉ card mới mới dựng, chỉ card biến mất mới xoá. Quy tắc chung: **mọi lớp
  vẽ trên màn quán đều đối chiếu, không lớp nào được `innerHTML = ''`.**
- **Nhảy từng ô** (`16-` Rule 4): mỗi bước là một keyframe `translate` + nhấc `HOP_LIFT × cell` +
  nghiêng `HOP_TILT` ở giữa bước, không trượt mượt, không xoay vòng. Vị trí luôn tính từ **ô**
  nhân `cell` hiện tại nên resize không làm lệch.
- **Bong bóng món** (`.cus-bub`): nằm **ngoài** mặt card của khách (`.card` có `overflow:hidden`
  nên bong bóng là con của `.cus`, anh em với `.cusface` — sai chỗ này là bong bóng biến mất sạch,
  đã dính một lần khi build #31). Card món **nhỏ** dùng lại mặt `.card.food` của bàn chơi (ảnh
  `public/art/Food/`, chip khoá màu theo course) neo trên đầu khách. Trạng thái:
  *đang gọi* (bong bóng mờ + dấu "…") → *đang nấu* (vòng tiến trình chạy quanh bong bóng) →
  *đã phục vụ* (bong bóng sáng, card món rõ) → biến mất khi khách rời đi.
- **Hết kiên nhẫn** (`16-` Rule 7): card rung (dùng lại `.card.invalid`), bong bóng chuyển
  `--invalid` rồi khách nhảy ra cửa. Không có popup, không chặn gì.
- **Trả tiền:** `+N` vàng bay lên từ đầu khách — đúng `.pop` + `punch` mà thưởng sau ván đang dùng,
  để hai nguồn thu nói **cùng một thứ tiếng** (`14-`, `16-` Rule 8).

### Bảng menu (`#menuModal`, `17-`)

```text
┌─ Your menu ─────────────────── 2/3 ─┐
│ [card] [card] [card trống]          │   món đang treo, tap = bỏ xuống
│ ─────────────────────────────────── │
│ [card][card][card][card][card]…     │   tất cả món, tap = treo lên
│  (món chưa mở khoá: mờ + "Cook it   │
│   in a match")                      │
└─────────────────────── [ Close ] ───┘
```

- Card món dùng **nguyên** `.card.food` của bàn chơi (ảnh món + chip course + chip điểm) — không vẽ
  khuôn mới, đúng luật "một bộ mặt card" của Tuning pass (1).
- Trạng thái card: *đang treo* (viền `--gold`, tap để bỏ) · *treo được* (bình thường) · *menu đầy*
  (mờ nhẹ, tap hiện lý do ngay trong bảng) · *chưa mở khoá* (mờ + dòng "Cook it in a match").
- Đổi là có hiệu lực ngay, không nút Apply (`17-` Rule 6). Số `2/3` trên tiêu đề luôn khớp số card
  đang treo.
- Mọi ô bấm ≥ 44px; bảng cuộn dọc khi 20 món không vừa `max-height`.

### Thêm vào Done when

- Card `MENU` mở đúng bảng menu; 4 card điều hướng vẫn nằm trong màn ở 1280×800 và 1024×700.
- Khách nhảy từng ô thấy rõ từng bước, không trượt; bong bóng món đi qua đủ 3 trạng thái.
- Khách **không** chặn được thao tác kéo đồ: kéo cái bàn ngay dưới chân một khách vẫn nhấc lên được.
- Dòng "While you were away" hiện đúng một lần rồi tự ẩn, không che HUD.

## Tuning pass (2) — 2026-09-20, sau khi người duyệt chơi thử đợt 2

Bốn việc người duyệt yêu cầu. (1) và (2) đổi cách nhìn vào quán, (3) là lỗi mượt, (4) là làm lại HUD.

### 1. Camera: zoom + pan (backlog #32)

- `#rest-stage` **không cuộn bằng scrollbar nữa** (`overflow:hidden`); `#rest-grid` được đặt bằng
  `transform: translate(-panX, -panY) scale(zoom)` với `transform-origin: 0 0`. Một `transform` duy
  nhất cho cả lưới = trình duyệt chỉ compose lại một lớp, không layout lại card nào.
- Luật camera, giới hạn và thao tác: `13-restaurant-grid.md` Rule 14–17. UI chỉ thêm:
  - Con trỏ: `grab` trên chỗ trống, `grabbing` khi đang pan, `grab`/`grabbing` trên món đồ như cũ.
  - **Không** có nút +/− trên màn ở bản này: con lăn và hai ngón là đủ, thêm nút là thêm zone phải
    nuôi. Nếu playtest thấy thiếu thì mở ticket riêng.
- Lưới rộng hơn màn nên **nền lưới không còn là "cả mặt bằng"** — mép lưới không bao giờ lọt vào
  khung nhìn (`13-` Rule 16), người chơi luôn thấy ô lưới trải đều tới cả bốn cạnh màn.

### 2. Khách đi từ trên xuống (backlog #33)

Cửa chuyển lên **giữa cạnh trên**, khách chờ ở phía trên mép lưới (`16-` Rule 3). Kết hợp với chốt
pan ở `13-` Rule 16, vùng đó không bao giờ lộ. Không có zone mới, không đổi `#rest-cus`.

### 3. Vòng tiến trình nấu phải mượt (backlog #34)

Bản #31 cập nhật `--p` của `conic-gradient` mỗi `TICK_MS` (120ms) → mắt thấy giật ~8 fps. Đổi sang
**một vòng SVG** (`<rect>` bo góc + `stroke-dasharray`; hình chữ nhật vì bong bóng là hình chữ nhật — xem Tuning pass (3) mục 3) với **một** animation WAAPI đặt lúc bắt đầu nấu,
dài đúng thời gian nấu, `easing: linear` — trình duyệt nội suy theo khung hình, vòng đời vẫn chạy
theo timer. Không còn code nào ghi style tiến trình mỗi tick.

### 4. HUD kiểu Hay Day (backlog #35) — **SUPERSEDED bởi Tuning pass (3) mục 1**

> Người duyệt xem bản dựng rồi bác: "UI làm dạng Hayday ko hợp". Giữ mục này lại làm hồ sơ của
> một hướng đã thử và bỏ; HUD đang chạy là bản card ở Tuning pass (3). Phần **lý do XP xanh lá** ở
> cuối mục vẫn còn hiệu lực.

Người duyệt: HUD hiện tại "lạc quẻ so với phần còn lại của game", ref **Hay Day**. Chi tiết hình
khối, màu và token ở `design/art.md` mục "HUD quán — ref Hay Day". Phần thuộc về màn hình:

```text
   ╭──────────────────────────────╮
 ((7))  Chef Huy                  │     ((7)) = đĩa level tròn, đè lên mép trái tấm biển
   │    ▰▰▰▰▰▰▱▱▱▱  73/160        │     thanh XP xanh lá, bo tròn hai đầu
   ╰──────────────────────────────╯
   ╭──────────────╮
 (¤)   1,234      │                     đồng xu đè lên mép trái, số vàng viền đậm
   ╰──────────────╯
```

| Element | Đổi thành |
|---|---|
| `#rest-hud` | tấm biển kem (`--hud-plate`) viền gỗ dày (`--hud-rim`), bo góc lớn, đổ bóng — **không** còn hộp xám trong suốt |
| `#rest-level` | đĩa tròn viền vàng đè lên mép trái tấm biển, số level to ở giữa |
| `#rest-name` | chữ đậm trên tấm biển; tap vào là sửa tại chỗ như cũ, vùng chạm vẫn ≥ 44px |
| `#rest-xp` | thanh bo tròn: rãnh lõm tối + ruột **xanh lá** (`--xp`) + vệt bóng sáng ở nửa trên |
| `#rest-gold` | capsule riêng dưới tấm biển, đồng xu tròn có vành và bóng đè lên mép trái |
| `#rest-away` / `#rest-hint` / `#rest-warn` | giữ nguyên vai trò, đặt dưới capsule gold, chữ nhỏ |

**Lý do XP đổi sang xanh lá:** `--gold` trong repo này có đúng một nghĩa — tiền và "chỗ này bấm
được" (`art.md`). Thanh XP vàng nằm ngay cạnh số gold vàng làm hai thứ khác nhau trông như một.

### Thêm vào Done when

- Cuộn chuột trên quán → phóng to/thu nhỏ quanh con trỏ; kéo chỗ trống → màn đi theo tay; kéo món
  đồ → món đồ đi theo tay, màn đứng yên.
- Thu hết cỡ rồi kéo lên hết cỡ: **không** thấy mép trên của lưới, không thấy khách nào đứng chờ.
- Khách xuất hiện từ phía trên màn, nhảy xuống bàn; ăn xong nhảy ngược lên trên và biến mất.
- Vòng tiến trình nấu chạy liền mạch, không giật từng nấc.
- HUD: đặt cạnh ảnh chụp bàn chơi thấy cùng một ngôn ngữ (viền dày, bo góc lớn, chữ đậm), không
  còn là hộp xám phẳng.


## Tuning pass (3) — 2026-09-20, sau khi người duyệt xem bản Tuning pass (2)

Ba việc. (1) HUD làm lại lần hai, lần này theo **concept card** của chính game. (2) card nhân viên
(`18-staff.md`). (3) sửa lỗi vòng tiến trình bị méo.

### 1. HUD là một card (backlog #36) — thay cho Tuning pass (2) mục 4

Người duyệt, sau khi xem bản Hay Day: *"Phần UI làm dạng Hayday ko hợp. Tôi nghĩ chúng ta có thể
dùng concept card để làm UI cho user name, gold và exp luôn … để toàn bộ concept game chúng ta xoay
quanh card như thế cho đồng bộ."*

Chốt: **HUD không phải là một tấm biển nữa — nó là card của người chơi.** Dùng đúng `.card` của
`ui/table.md` với đúng bộ phận có sẵn, không phát minh hình khối mới:

```text
 ┌───────────────────┐
 │  Chef Huy         │   ← .hdr: dải tên trên đỉnh card, chính là ô nhập tên
 │ ⑦┌──────────────┐ │   ← .cchip: chip tròn góc trái trên = LEVEL (đúng chỗ chip món ăn)
 │  │   ảnh bếp    │ │   ← .ph: chân dung; chưa có ảnh thì chữ cái đầu của tên (art.md §2)
 │  │              │ │
 │  │▰▰▰▰▱▱ 73/160 │ │   ← thanh XP nằm trong .ph, sát đáy — không thêm hộp mới
 │  └───────────┤¤12│ │   ← .pchip: viên vàng góc phải dưới = GOLD (đúng chỗ chip điểm)
 └───────────────────┘
```

| Element | Đổi thành |
|---|---|
| `#rest-hud` | một `.card.chef-card` (cùng mặt kem `--ing-bg`, cùng viền, cùng bo góc, cùng đổ bóng với mọi card khác), viền màu `--chef` |
| `#rest-name` | `<input>` **nằm trong `.hdr`** — dải tên trên đỉnh card, đúng chỗ tên món/nguyên liệu. `.hdr` của card này cao ≥ 44px để giữ luật tap target, chữ căn trái |
| `#rest-level` | `.cchip` — chip tròn góc trái trên, **đúng bộ phận** đang dùng cho khoá món (A/M/D). Nền `--chef` |
| chân dung | `.ph` như mọi card: ảnh `public/art/Chef/Chef.jpg`; chưa có ảnh thì chữ cái đầu của tên (`art.md` "Restaurant meta" §2) |
| `#rest-xp` | thanh mảnh **ghim đáy `.ph`**, nền tối trong suốt + ruột `--xp` xanh lá, số `73/160` chữ nhỏ bên phải cùng dòng |
| `#rest-gold` | `.pchip` — viên vàng góc phải dưới, **đúng bộ phận** đang dùng cho điểm món. To hơn pchip của bàn chơi một nấc cho dễ đọc |
| `#rest-away` / `#rest-hint` / `#rest-warn` | giữ nguyên vai trò, xếp dọc **bên dưới** card, chữ nhỏ |

Ràng buộc kéo theo:

- Card chef **rộng bằng card điều hướng** ở đáy màn (`--w: clamp(...)` cùng công thức) để hai chỗ
  đọc ra là cùng một bộ bài.
- `#rest-hud` vẫn `pointer-events:none`, chỉ ô nhập tên và vùng card nhận chạm — đồ đạc nằm dưới
  HUD vẫn kéo được (`13-` Edge cases).
- Token `--hud-plate` / `--hud-rim` / `--hud-rim-lt` / `--hud-ink` của bản Hay Day **bỏ**; card
  dùng thẳng token của bài (`--ing-bg`, `--ing-border`, `--text`). `--xp` / `--xp-lt` giữ.
- `+N` gold bay lúc khách trả tiền vẫn bay về phía HUD như cũ, và `.rh-gold.punch` đổi thành
  `.pchip` nảy.

### 2. Card nhân viên (backlog #37, doc `18-staff.md`)

Nhân viên dùng **đúng cấu trúc `.cus`** của khách — `.card.cusface` + `.bub` là hai anh em trong
một wrapper (bong bóng phải nằm **ngoài** `.card` vì `.card` có `overflow:hidden`; xem "Đợt 2").
Khác ba chỗ:

| | Khách | Nhân viên |
|---|---|---|
| class wrapper | `.cus` | `.cus.staff` |
| viền card | `--cus` (hồng đào) | `--staff` (xanh lá cây, `art.md`) |
| bong bóng | món *đã gọi* — `waiting` (nhấp nháy) → `taken` (đứng yên) → `done` (viền vàng) | món *đang bưng* — `cooking` (có vòng tiến trình) → `done` |

- Dải tên trên card nhân viên ghi `Waiter` (in-game text tiếng Anh).
- Vòng tiến trình nấu **chuyển sang bong bóng của nhân viên** (`18-` Rule 7). Bong bóng của khách
  trong lúc đó là `taken`: vẫn thấy khách gọi gì, nhưng không nhấp nháy nữa — nhấp nháy để dành cho
  "chưa ai nhận order", đó là thứ người chơi cần thấy.
- Không có zone mới: nhân viên vẽ trong chính `#rest-cus`, sau khách trong cây DOM.

### 3. Vòng tiến trình bị méo (backlog #38)

Người duyệt: *"phần viền nó không viền đúng card món ăn nữa rồi, giống như bị xoay ngang ra vậy."*

Hai lỗi cộng lại ở bản #34:

1. `.ring` còn sót `transform: rotate(-90deg)` từ thời `conic-gradient` (xoay để vòng tròn bắt đầu
   từ đỉnh). Vòng tròn xoay 90° thì không ai thấy; **hình chữ nhật cao 1.4 lần chiều rộng** xoay
   90° thì nằm ngang chềnh ềnh ra ngoài bong bóng — đúng cái người duyệt mô tả.
2. `viewBox="0 0 100 100"` + `preserveAspectRatio="none"` kéo một khung **vuông** cho vừa bong bóng
   **chữ nhật** → bốn góc bo bị méo thành elip và tốc độ chạy của vòng ở cạnh ngang khác cạnh dọc.

Chốt: **không xoay**, và `viewBox` phải đúng tỉ lệ thật của bong bóng (dựng theo `--w`/`--h` đang
tính sẵn cho card món), `rx` bằng bán kính bo của bong bóng. Vòng bắt đầu ở cạnh trên và chạy theo
chiều kim đồng hồ. Còn lại giữ nguyên bản #34: một `<rect>`, `vector-effect="non-scaling-stroke"`,
một animation WAAPI duy nhất dài đúng thời gian nấu.

### Thêm vào Done when

- HUD đặt cạnh dải card điều hướng ở đáy màn: **cùng một loại card** — cùng mặt kem, cùng dải tên
  trên đỉnh, cùng bo góc. Không còn tấm biển kem viền gỗ nào trên màn.
- Tap vào tên trên HUD vẫn sửa được tên, vùng chạm ≥ 44px; kéo một món đồ nằm ngay dưới HUD vẫn
  kéo được.
- Level hiện ở chip tròn góc trái trên card, gold ở viên vàng góc phải dưới, XP là thanh trong ảnh.
- Mở quán: thấy **một** card nhân viên viền xanh chạy từ bếp ra bàn khi có khách gọi món, bong bóng
  món đi theo nó, vòng tiến trình chạy quanh bong bóng **của nhân viên** lúc nó đứng cạnh bếp.
- Vòng tiến trình ôm sát bong bóng, bốn góc bo đều, **không** nằm ngang, không tràn ra ngoài.


## Tuning pass (4) — 2026-09-20, ba việc nhỏ về hình

### 1. Card món chỉ xuất hiện khi nó tồn tại (backlog #40)

Người duyệt: *"Customer tới thì không thấy cái món, waiter chạy lại nhận order cũng ko thấy món,
chỉ khi bắt đầu nấu mới xuất hiện. Rồi lúc giao đồ ăn thì trên đầu khách mới xuất hiện card món ăn
rồi cũng chạy progress (thể hiện customer đang ăn)."*

Thay bảng trạng thái bong bóng ở Tuning pass (3) mục 2 bằng bảng này:

| Lúc | Trên đầu khách | Trên đầu nhân viên |
|---|---|---|
| khách vào, ngồi, gọi món (`in`/`order`/`wait`) | — | — |
| nhân viên chạy tới nhận order (`toCus`/`pick`/`toKit`) | — | — |
| **đang nấu** (`cook`) | — | card món + **vòng tiến trình** = thời gian nấu |
| bưng ra bàn (`toServe`/`serve`) | — | card món, không vòng |
| **đang ăn** (`eat`) | card món + **vòng tiến trình** = `CUS_EAT_MS` | — |

Nguyên tắc rút ra: **card món là vật thể, không phải nhãn ý nghĩ.** Nó chỉ ở trên màn khi trong
truyện có một đĩa thức ăn thật — từ lúc bếp bắt đầu nấu tới lúc khách ăn xong. Cùng một bong bóng
đi từ tay nhân viên sang bàn khách, vòng chạy hai lần cho hai việc khác nhau (nấu, ăn).

Mất theo: trạng thái `waiting` nhấp nháy báo "chưa ai nhận order" (Tuning pass (3) mục 2) và
trạng thái `taken`. Chấp nhận — đổi lấy màn sạch hơn; nếu playtest thấy khó biết khách nào đang bị
bỏ quên thì mở ticket riêng cho một dấu hiệu **không phải** card món.

### 2. Tiền bay về card chef (backlog #40)

`+N` lúc khách trả tiền không còn bay lên tại chỗ nữa: nó **bay từ chỗ khách về viên gold trên card
chef** (cong lên giữa đường, nhỏ dần), tới nơi thì viên gold nảy. Nối thẳng *ai trả* với *tiền vào
đâu* — đây cũng là lý do HUD nằm ở góc trái trên chứ không trôi nổi. `GOLD_FLY_MS` 720ms.

Thưởng sau ván (`playRewardFx`) giữ nguyên kiểu cũ: `+N` bật lên ngay cạnh viên gold, vì nó không
xuất phát từ chỗ nào trên sàn cả.

### 3. Bỏ khoá món khỏi card Food trong quán (backlog #40)

Người duyệt: *"Bỏ phần loại đồ ăn của các Food đi."* Card món trong quán (bong bóng + bảng menu)
bỏ **chip tròn A/M/D** và **viền màu theo khoá** — quán không dùng khoá món vào việc gì, nó là luật
của ván bài (`07-menu-orders.md`). Card món trong quán giờ là `.card` thường: tên + ảnh + viên điểm.

**Bàn chơi không đổi** — ở đó khoá món là cơ chế thật, `.card.food.cc-*` giữ nguyên.

### Thêm vào Done when

- Khách vào, ngồi, gọi món: trên màn **không** có card món nào. Nhân viên chạy tới nhận order cũng
  tay không.
- Nhân viên tới bếp: card món hiện ra trên đầu nó kèm vòng chạy; bưng ra bàn thì card đi theo.
- Trả món xong: card món nằm trên đầu **khách** và vòng chạy lại lần nữa suốt bữa ăn.
- Khách trả tiền: `+N` bay về viên gold trên card chef rồi viên gold nảy.
- Card món trong quán và trong bảng menu không còn chip A/M/D, không còn viền màu theo khoá.


## Tuning pass (5) — 2026-09-20, ba trạng thái phải đọc được từ xa

Người duyệt: *"có sẵn cơ chế đợi lâu quá thì sẽ bỏ đi nên khi khách đợi làm luôn phần progress thể
hiện độ kiên nhẫn. Rồi khi đã có nhân viên tới order thì cần thể hiện trên đầu customer đó thể hiện
đang đợi, nhân viên đã nhận order đang chạy lại bếp để làm thì cũng dùng 1 icon gì đó."*

Tuning pass (4) dọn sạch card món ở những lúc chưa có món — đúng, nhưng dọn hơi quá: ba giai đoạn
dài nhất của một lượt phục vụ thành ra **không có tín hiệu nào**. Mục này trả tín hiệu về, bằng
**icon** chứ không bằng card món (card món vẫn chỉ hiện khi có đĩa thức ăn thật — TP(4)).

### Bảng trạng thái đầy đủ (thay bảng ở TP(4) mục 1)

| Lúc | Trên đầu khách | Trên đầu nhân viên |
|---|---|---|
| khách vào, ngồi (`in`/`order`) | — | — |
| **chờ người nhận order** (`wait`) | ⏳ đồng hồ cát + **vòng ĐẾM NGƯỢC đúng `CUS_PATIENCE_MS`** | — |
| nhân viên chạy tới bàn (`toCus`/`pick`) | như trên | — |
| **order đã nhận, chờ món** (`cook`) | 🍴 dao dĩa, không vòng | 🎫 phiếu order (lúc `toKit`) |
| **đang nấu** (`cook`) | 🍴 dao dĩa | card món + **vòng vẽ dần** = thời gian nấu |
| bưng ra bàn (`toServe`/`serve`) | 🍴 dao dĩa | card món, không vòng |
| **đang ăn** (`eat`) | card món + **vòng vẽ dần** = `CUS_EAT_MS` | — |

### Hai loại vòng, đọc ngược nhau

- **Vẽ dần, màu `--gold`** = *có thứ đang được làm cho tôi* — nấu, ăn. Đầy là chuyện tốt.
- **Vơi dần, màu `--invalid`** = *đồng hồ đang chạy hết* — kiên nhẫn. Hết là khách bỏ đi
  (`16-` Rule 7). Viền bong bóng cũng đỏ.

Hai chiều ngược nhau quan trọng hơn hai màu: nhìn lướt qua thấy vòng đang **vơi** là biết có
chuyện, không cần đọc màu.

### Icon

Ba icon dựng bằng **nét SVG inline**, không thêm file ảnh nào — cùng nếp với HUD ở TP(3). Ruột bong
bóng là một ô vuông cạnh `0.52 × cell`, mặt kem `--ing-bg` như mặt card, nét `--dark`. Chi tiết
hình ở `design/art.md` "Icon trạng thái".

Viền bong bóng: đỏ `--invalid` cho kiên nhẫn, xanh `--staff` cho phiếu order (cùng màu viền card
nhân viên — "cái này thuộc về nhân viên"), mặc định cho dao dĩa.

### Thêm vào Done when

- Khách ngồi xuống gọi món xong: hiện đồng hồ cát, vòng đỏ **đầy rồi vơi dần**; vơi hết đúng lúc
  khách rung và bỏ đi.
- Nhân viên nhận order xong: đồng hồ cát trên đầu khách đổi thành dao dĩa (vòng biến mất), và nhân
  viên chạy về bếp với phiếu order viền xanh trên đầu.
- Tới bếp: phiếu order đổi thành card món kèm vòng vàng vẽ dần.

---

## Tuning pass (6) — 2026-09-20, HUD xuống góc trái dưới + gold về card Shop

Người duyệt: *"Sửa phần UI info player ở home lại — thanh bar trên top để progress XP kèm level,
phần body để hình minh hoạ như hiện tại, phần footer để tên. Dời phần gold vào card shop. Di
chuyển info player xuống trái dưới, làm thêm 1 button toggle nằm ngay sát đó để show/hide 4 card."*

Ba việc, cùng một ý: **màn quán phải mở ra được**. Sau TP(3) mọi thứ đã là card, nhưng bốn góc màn
đều bị chiếm — HUD trên-trái, dải card dưới — nên cái quán (thứ duy nhất người chơi xây) lại là
thứ bị che nhiều nhất. Pass này dồn toàn bộ UI xuống **một góc**, và cho phép tắt hẳn dải card.

Mục này **thay** dòng `#rest-hud` trong *Zone sizes* (trên-trái) và phần chia bộ phận ở TP(3) mục 1.

### 1. Card chef đọc theo ba tầng (backlog #42)

```text
 ┌───────────────────┐
 │ ⑦ ▰▰▰▰▰▱▱ 73/160  │  ← .hdr: thanh XP + level — một khái niệm, một tầng
 │  ┌──────────────┐ │
 │  │  chân dung   │ │  ← .ph: giữ nguyên
 │  │              │ │
 │  └──────────────┘ │
 │  Chef Huy         │  ← .ftr: ô nhập tên, băng tối đáy card
 └───────────────────┘
```

| Bộ phận | TP(3) | TP(6) |
|---|---|---|
| `.hdr` (đỉnh) | ô nhập tên | **thanh XP**, `xp/need` chữ nhỏ nằm **trong** thanh, `.cchip` level đè mép trái |
| `.cchip` | level, góc trái trên | giữ nguyên chỗ — giờ nó nằm **trên chính thanh XP** mà nó đo |
| `.ph` (thân) | chân dung + thanh XP ghim đáy | **chỉ còn chân dung** — thanh XP đã lên đỉnh, `.hud-xp` (dải tối trong ảnh) bỏ |
| `.ftr` (đáy) | — | **ô nhập tên** |
| `.pchip` | gold | bỏ khỏi card chef (xem mục 2) |

- `.ftr` **không phải bộ phận mới của ngôn ngữ card**: card món `.fcard` ở bàn chơi đã có sẵn băng
  tên đáy (`.fcard .n`). Card chef chỉ dùng lại đúng cách đọc đó, cùng nền tối như `.hdr`.
- Ràng buộc tap target không đổi: `.ftr` cao ≥ 44px vì nó là ô nhập.
- Level vẫn nền `--xp` cùng màu ruột thanh XP (`art.md`): giờ đặt cạnh nhau thì lý do đó **nhìn
  thấy được** chứ không còn là chú thích trong doc.

### 2. Gold về card Shop

Gold rời card chef sang `.pchip` của card `SHOP` — **đúng bộ phận** viên điểm, không thêm hình khối.

Lý do không phải là chỗ trống: gold chỉ có một việc là **tiêu**, nên nó phải nằm trên cái cửa dẫn
tới chỗ tiêu. Nhìn dải card ở đáy là biết ngay mình mua được gì, không phải liếc chéo hai góc màn.

- `+N` lúc khách trả tiền và lúc nhận thưởng sau ván vẫn bay **về viên gold** — chỉ đổi đích.
- **Khi dải card đang tắt** (mục 3) viên gold không có trên màn: `+N` bay về **nút toggle**, và nút
  đó nảy (`punch`) thay cho viên gold. Tiền không bao giờ bay vào hư không.

### 3. Nút toggle dải card

| | |
|---|---|
| Vị trí | ngay **bên phải** card chef, cùng đáy, góc trái dưới màn |
| Kích thước | 44×44 (sàn tap target), tròn, nền `--panel` + viền `--panel-border` |
| Nhãn | mũi tên chevron, quay 180° giữa hai trạng thái; `aria-label` đổi `Hide cards` / `Show cards` |
| Tắt | `#rest-nav` trượt xuống + mờ đi, `pointer-events:none`, popover đang mở đóng theo |
| `#rest-msg` | khi dải card tắt thì tụt xuống sát đáy (không còn lửng giữa màn) |

Trạng thái này **không vào save**: mặc định là *hiện*, F5 thì hiện lại. Nó là một cái nháy mắt để
ngắm quán, không phải một tuỳ chọn — và không đáng một lần bump schema.

### Vị trí mới

| Zone | Vị trí | Ghi chú |
|---|---|---|
| `#rest-hud` | **dưới-trái**, lề 14px | card chef + nút toggle xếp ngang, đáy thẳng hàng |
| `.rh-away` / `.rh-hint` / `.rh-warn` | **trên** card chef, xếp dọc | trước đây nằm dưới; góc dưới thì phải mọc ngược lên |
| `#rest-nav` | giữa-dưới (không đổi) | ở 1024px dải 4 card rộng ~450px căn giữa, mép trái ~286px — không đụng cụm HUD (hết ở ~180px) |

`#rest-hud` vẫn `pointer-events:none`; chỉ ô nhập tên và nút toggle nhận chạm, nên đồ đạc nằm dưới
HUD vẫn kéo được (`13-` Edge cases). `z-index` của HUD lên **trên** `#rest-nav` để card chef không
bị dải chuyển màu của nav phủ lên.

### Thêm vào Done when

- Card chef nằm góc **trái dưới**: đỉnh là thanh XP kèm số + chip level, thân là chân dung, đáy là
  ô nhập tên (bấm sửa được, ≥ 44px).
- Card chef **không còn** viên gold; card `SHOP` ở dải dưới có viên gold đúng số trong save.
- Khách ăn xong → `+N` bay về viên gold trên card Shop rồi viên đó nảy.
- Bấm nút toggle → 4 card trượt xuống mất, chỉ còn quán + cụm HUD góc trái dưới; bấm lại → hiện.
- Toggle lúc popover `Play vs Bots` đang mở → popover đóng theo, không treo lơ lửng.
- Tắt dải card rồi để khách trả tiền → `+N` bay về nút toggle, nút nảy, gold vẫn cộng đúng.
- 1280×800 và 1024×700: cụm HUD góc trái dưới không đè lên 4 card điều hướng.
