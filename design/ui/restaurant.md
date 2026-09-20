# UI — Restaurant (màn chính, thay `#home`)

**Status:** BUILT (2026-09-20) — khung + HUD + 3 card điều hướng + save (#24), đồng bộ mặt card +
lưới phủ màn (#28, #29), kéo thả đồ (#25), HUD gold/XP + thưởng sau ván (#26), `#shopModal` (#27).
Đợt 2 (mục "Đợt 2" cuối trang) đã build: card `MENU` + `#menuModal` (#30), lớp khách `#rest-cus`
+ hai dòng nhắc dưới HUD (#31).
**Đối tượng:** `12-restaurant-meta.md` (state) · `13-restaurant-grid.md` (lưới) ·
`14-gold-xp-level.md` (HUD số liệu) · `15-shop-unlocks.md` (overlay shop) ·
`16-customers-idle.md` (khách) · `17-restaurant-menu.md` (bảng menu).
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

### Card khách (`.cus`)

- Vẫn là **`.card` thật** như mọi card khác (Tuning pass (1)): mặt kem, dải tên trên đỉnh, ô ảnh
  lõm. Khác duy nhất: viền `--cus` (`art.md` "Restaurant meta" §1), footprint **1×2** như decor.
- Chưa có ảnh → placeholder chữ cái đầu của loại khách (`art.md` §2), ảnh thật sẽ nằm ở
  `public/art/Customer/<PascalCase>.jpg`.
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
