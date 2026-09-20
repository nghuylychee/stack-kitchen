# UI — Menu & Orders (phần mở rộng của Table)

**Status:** BUILT (2026-09-19, backlog #10, #16; intro đầu ván thay bởi `10-match-intro.md`, #18 — `#my-panel`/`#my-foods` dời theo `ui/table.md` Tuning pass (7), xem mục 3, 7)
**Purpose:** người chơi thấy ngay Menu công khai của ván (N món khả dụng) và
Order bí mật của chính mình (`ORDER_SIZE` món phải hoàn thành — 3/4/5 tuỳ
2/3/4 người chơi, GUESS theo `07-`), biết lúc nào cần nấu gì để xong Order,
mà không hề thấy Order của người khác.
**Reached from:** tự động khi ván bắt đầu, ngay trên `ui/table.md` (không phải
màn riêng) · **Leads to:** không đổi màn — vẫn là `#app`/Table.

Mục "Ảnh hưởng tới ui/table.md" ở cuối doc này **đã được áp dụng thẳng vào**
`design/ui/table.md` ngày 2026-09-19 (file đó chuyển `BUILT` → `AGREED`, thêm
1 Tuning pass mới) — mục đó vẫn giữ ở đây làm hồ sơ tra cứu zone-by-zone, đọc
`table.md` để thấy bản đã gộp.

Luật nguồn: `design/07-menu-orders.md` (Rules 1–17). Doc UI này chỉ tả phần
nhìn-thấy-được; không lặp lại số liệu luật (`MENU_SIZE`, `ORDER_SIZE`,
`ORDER_BONUS`...) — xem bảng Numbers của `07-` cho các số đó.

## Quyết định của người duyệt (2026-09-19)

1. **`ORDER_SIZE` scale theo số người** (3/4/5 cho 2/3/4 người, GUESS theo
   `07-`) — `#my-order` không còn cố định 3 hàng; xem bảng chiều cao hàng
   theo N ở "Layout — 1024×700".
2. **`MENU_SIZE` scale theo số người** (6/8/10 cho 2/3/4 người, GUESS theo
   `07-`) — không đổi cách trình bày `#menu-rail`, vốn đã tính sẵn cho trần
   10 món.
3. **Order không bắt buộc phủ đủ A/M/D, có thể trùng loại món giữa các
   Order** — vì vậy `.order-row` không mang chip/badge loại món để "đánh dấu
   tiến độ"; màu course (nếu dùng ở đâu đó) chỉ còn là nhận diện món, giống
   mọi nơi khác trong game, không phải chỉ báo mục tiêu.
4. **DONE state của `.order-row` giữ đúng bản gốc của doc này** — viền vàng
   nhạt + glow 1 nhịp lúc vừa xong — **không** dùng ngôn ngữ dim + gạch ngang
   mà `art.md` mục 2 từng đề xuất cho ticket nghiêng; artist đã được báo dùng
   chung quyết định này.
5. **Vị trí Order = các hàng trong `#my-panel`** (đúng bản gốc của doc này,
   không phải ticket giấy nghiêng của `art.md` mục 2) — **kèm thêm** badge
   `order-need` tím tĩnh (`art.md` mục 3) trên chính thẻ nguyên liệu trong
   `.hand-fan`. 2 tín hiệu cùng tồn tại, không thay nhau: chip trong
   `.order-row` đọc "món này còn thiếu nguyên liệu gì", badge trên tay đọc
   "thẻ này trong tay tôi giúp được món nào".
6. **`#menuIntroModal` giữ nguyên**, không cắt.
7. **[SỬA bởi `ui/table.md` Tuning pass (7)]** ~~`#my-panel` ở 1024×700: dock
   height (`clamp(210px,30vh,240px)`)... không đổi~~ — hết áp dụng, vì
   `#my-panel` không còn chung 1 khối với `#my-foods` (xem mục 3). `#my-order` vẫn **không
   cuộn** (co chiều cao hàng theo N) như quyết định gốc; độ chật với
   `#my-foods` không còn là mối lo vì 2 zone đã tách nhau — hàng `.order-row`
   có thể nới rộng hơn bảng Numbers cũ vì không còn phải chừa chỗ cho
   `#my-foods` trong cùng 1 khối. `game-dev` có thể giữ nguyên số cũ (vẫn
   đúng, chỉ không còn bị ép chặt) hoặc nới ra khi build — không chặn AGREED.
8. **Chip nguyên liệu chỉ có/không (boolean)** — không đếm số lượng, vì 1
   công thức không bao giờ cần 2 bản cùng loại nguyên liệu (`#prep` chỉ nhận
   1 bản/loại theo `02-`).
9. **Log không đổi** — bot đọc thông tin công khai để quyết Order không cần
   zone/format Log riêng; nếu sau này muốn AI "giải thích" lý do liên quan
   Order, dùng đúng dòng log tự do đã có ở `ui/table.md`, không thêm gì ở
   đây.

## Layout — 1280×800 (4 người, tương tự bản 4 người của `ui/table.md`)

```
┌ #hud, 56px (không đổi vị trí/kích thước) ──────────────────────────────────┐
│ Stack Kitchen   Turn 14                                        Home       │
├ #menu-rail — MỚI, 100vw×64px ──────────────────────────────────────────────┤
│  🍜Pho Bo+2  🥟Nem Ran+4  🍧Che+3  🍲Bun Bo Hue+7  🍚Com Tam+5  …          │
│  (hover/tap 1 món → popover công thức, gold = đang có trong tay)          │
├ #table-surface, 100vw×(100vh−56−64) ───────────────────────────────────────┤
│                    .seat[top] — không đổi so với ui/table.md,              │
│                    trừ: bỏ hàng 3 huy hiệu A/M/D (xem Ảnh hưởng)           │
│  .seat[left] …                #center-play …            .seat[right] …   │
│                    .seat[bottom] — người thật                             │
│  [ĐÃ THAY bởi ui/table.md Tuning pass (7) 2026-09-19: #my-panel dời góc   │
│   phải dưới, #my-foods tách ra góc trái dưới — không còn 2 cột chung 1    │
│   dock như hình vẽ gốc ở đây. Nội dung #my-order dưới đây không đổi, chỉ  │
│   đổi zone chứa nó. Xem table.md cho hình vẽ đúng hiện tại.]              │
│  ┌─#my-panel (góc phải dưới)──────────────────────┐                       │
│  │ ● You                        27 pts            │                       │
│  │ 🂠 ×13                                          │                       │
│  │ ── Your Order — #my-order (MỚI), N=ORDER_SIZE ─│                       │
│  │ ✓ Pho Bo        +2   [🍚][🥩]                   │                       │
│  │ ○ Bun Bo Hue     +7   [🥩][🌶️ mờ][🌿]           │                       │
│  │ ○ Che Ba Mau     +3   [🫘 mờ][🥥]                │                       │
│  │ ○ Xoi Gac        +2   [🍚 mờ][🍯]                │                       │
│  │ ○ Banh Mi        +4   [🍞][🥩 mờ][🥬 mờ]         │                       │
│  └──────────────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

(4 người → `ORDER_SIZE=5`, minh hoạ đủ 5 hàng — hàng co ngắn hơn bản 3 hàng cũ
của 2 người, xem bảng chiều cao ở "Layout — 1024×700".)

`✓` = đã xong (reveal ≥1 lần, `07-` Rule 9); `○` = chưa xong. Mỗi ô vuông nhỏ
sau tên món là 1 chip nguyên liệu của công thức — **sáng vàng** nếu người chơi
đang có ≥1 thẻ loại đó trong tay lúc này, **mờ** nếu chưa có (chỉ tính có/không
— quyết định #8 ở trên, không đếm số lượng cần). Order **không cần phủ đủ
A/M/D** (quyết định #3) nên `.order-row` không có chip loại món riêng để
"đánh dấu tiến độ" — màu course, nếu còn xuất hiện ở đâu (ví dụ viền thẻ món
trong `#my-foods`, vốn đã có sẵn), chỉ là nhận diện món như mọi nơi khác.
Ghế đối thủ (`top`/`left`/`right`) không đổi vị trí/kích thước, chỉ mất 1
hàng nội dung (huy hiệu A/M/D) — xem Ảnh hưởng.

**Tín hiệu thứ 2 (mới, quyết định #5):** thẻ nguyên liệu trong tay của chính
người chơi có thêm 1 badge tím tĩnh góc trên-trái nếu loại đó phục vụ ≥1 hàng
Order còn `○` — dùng đúng token/hình `--order-need` artist đã định nghĩa ở
`art.md` mục 3. Badge này **cộng thêm**, không thay chip trong `.order-row` —
xem "Elements"/"Interactions" bên dưới.

## Layout — 1024×700

- `#menu-rail`: 10 món (trần `MENU_SIZE` ở 4 người) vẫn vừa 1 hàng
  (`10×52px≈520px < 1024px`); vẫn giữ cuộn ngang + mờ mép dự phòng nếu
  `MENU_SIZE` tương lai tăng thêm (cùng kiểu mờ mép `.seat-foods`).
- Dock `.seat[bottom]` giữ nguyên `clamp(210px,30vh,240px)`, anchor % ghế đối
  thủ không đổi (quyết định #7). `#my-order` **không cuộn** — luôn hiện đủ N
  hàng để người chơi thấy trọn Order mọi lúc — nên hàng phải **co chiều cao
  theo N** thay vì cố định 40/36px như bản DRAFT cũ; `#my-foods` bên dưới
  cuộn sớm hơn khi chật, đúng hành vi cuộn sẵn có.

| `ORDER_SIZE` (N) | Số người | `.order-row` height @1280 | `.order-row` height @1024 |
|---|---|---|---|
| 3 | 2 | 40px | 36px |
| 4 | 3 | 34px | 30px |
| 5 | 4 | 28px | 26px |

(GUESS — co tuyến tính đủ để N=5 vẫn nằm trong dock cùng phần đầu ~44px và
chừa vài chục px cho `#my-foods` cuộn được, xem phép tính ở Numbers.)

Chip nguyên liệu giữ nguyên 14×14 (1280) / 12×12 (1024) ở **mọi** N — chỉ
hàng co, chip không co thêm (dưới 12px mất phân biệt sáng/mờ). Vùng chạm mỗi
`.order-row` **vẫn tối thiểu 44px cao** dù hàng hiển thị ngắn hơn — hitbox mở
rộng ra ngoài viền hàng hiển thị (đã làm vậy với bản 36px cũ); 2 hitbox hàng
kề nhau có thể hơi chồng mép ở N=5, chấp nhận được vì đây là tap **không phá
huỷ** (chỉ mở popover công thức), không phải hành động rủi ro cần dead-space
nghiêm ngặt như nút Restart.

## Elements

| Element (id/class) | Vị trí | Kích thước | Tap target | States |
|---|---|---|---|---|
| `#menu-rail` (MỚI) | full-width, ngay dưới `#hud` | 100vw × 64px | — (khung), mỗi `.menu-item` ≥44×44 | luôn hiện suốt ván, từ ngay sau intro overlay |
| `.menu-item` (MỚI, trong `#menu-rail`) | flex row, gap 8px, căn giữa | 44×44 (ảnh món 40×40 + huy hiệu loại + góc `+N`) | 44×44 | idle · hover/tap-open (popover công thức) |
| Popover công thức (MỚI, dùng chung cho `.menu-item` và `.order-row`) | nổi ngay dưới item, không che item khác | auto × auto, max 220px rộng | nút đóng ẩn (đóng bằng tap ra ngoài) | ẩn · hiện; liệt kê từng loại nguyên liệu, sáng vàng nếu đang có trong tay (giống legend "gold = in your hand now" đã có ở Recipes) |
| `#my-order` (MỚI, trong `#my-panel`, thay `#my-h2`) | ngay dưới hàng số thẻ úp, trên `#my-foods` | auto × (N×hàng + tiêu đề ~18px), N=`ORDER_SIZE` (3–5) | mỗi `.order-row` hitbox ≥44px cao dù hàng hiển thị ngắn hơn ở N cao | N hàng cố định theo `ORDER_SIZE` của ván — không cuộn |
| `.order-row` (MỚI, trong `#my-order`) | 1 hàng/món Order | 100% × co theo N — 40/34/28px (1280) hoặc 36/30/26px (1024) cho N=3/4/5 (xem bảng ở "Layout — 1024×700") | hitbox ≥44px cao (hàng hiển thị có thể ngắn hơn, hitbox mở rộng ngoài viền) | chưa xong (`○`, viền xám) · đã xong (`✓`, viền vàng nhạt + glow 1 nhịp lúc vừa xong — quyết định #4, không dùng dim/gạch ngang) |
| `.order-chip` (MỚI, trong `.order-row`) | sau tên món, hàng ngang, wrap nếu cần | 14×14 (1024: 12×12), cố định ở mọi N | — (không tương tác riêng, cả `.order-row` là 1 vùng chạm) | có-trong-tay (sáng vàng) · chưa-có (mờ 45% opacity) — boolean, không đếm số lượng (quyết định #8) |
| Badge `order-need` (MỚI, trên thẻ nguyên liệu trong `.hand-fan` — chỉ tay của chính người chơi) | góc trên-trái ô ảnh thẻ, dưới dải header | Ø ~18% bề rộng thẻ (đúng token `--order-need` + SVG artist định nghĩa, `art.md` mục 3) | — (không tương tác riêng — thẻ đã có hitbox kéo/tap của chính nó, xem `ui/table.md`) | ẩn · hiện (tĩnh, không animate/pulse) — hiện khi loại nguyên liệu đó phục vụ ≥1 `.order-row` đang `○`; tắt ngay khi mất điều kiện |
| `#btnRecipes` (giữ id, đổi nhãn) | `#hud`, cụm phải — vị trí không đổi | auto×44 | ≥44×44 | mở `#recipeModal` — nội dung giờ chỉ liệt kê Menu (N món), không còn 20 món |
| Menu intro overlay — MỚI: `#menuIntroModal`/`#menuIntroBox` | modal dim 65%, box căn giữa — cùng kiểu `.modal`/`.box` đã có | box auto, max 640×420 | vùng dim toàn màn = 1 tap target lớn để skip | hiện đúng 1 lần đầu ván → tự ẩn |
| `#endModal`/`#endBox`, cột "Courses" cũ | bảng xếp hạng cuối ván | không đổi kích thước cột | mỗi ô Order-thumb ≥32×32 (đã có sẵn size Foods) | đổi nội dung cột: N thẻ món Order + tick xong/chưa (xem "Màn kết thúc") |

## Interactions

| Cử chỉ | Phản hồi | Feedback | Timing (GUESS) |
|---|---|---|---|
| ~~Ván bắt đầu (trước cả deal)~~ **[THAY bởi `10-match-intro.md`]** | `#menuIntroModal` hiện, liệt kê N món Menu (ảnh, tên, loại, điểm) | box pop-in nhẹ; dòng phụ "Tap to skip" | hiện `MENU_REVEAL_MS` = 2600ms rồi tự đóng, hoặc tap bất kỳ đâu trong dim để đóng ngay (chỉ đóng cục bộ ở client đó — không đồng bộ qua mạng, xem Online states) |
| ~~`#menuIntroModal` đóng (hết giờ hoặc tap)~~ **[THAY bởi `10-match-intro.md`]** | `#menu-rail` hiện các `.menu-item` so le; `#my-order` hiện N `.order-row` so le | mỗi item pop-in `scale .8→1` + fade, cách nhau `MENU_ITEM_POP_MS` = 120ms | tổng ~`(N-1)×120 + 300`ms cho rail, ~`(ORDER_SIZE-1)×120+300`ms cho Order (GUESS) |
| Ngay sau đó | deal đầu ván chạy như `ui/table.md` đã tả (không đổi) | — | trễ thêm 300ms (GUESS) sau khi item cuối cùng pop-in xong, tránh chồng animation |
| Hover (desktop) hoặc tap (giữ ≥150ms) 1 `.menu-item` | mở popover công thức của món đó | popover fade-in, chip nguyên liệu sáng vàng nếu đang có trong tay | mở sau 150ms hover-intent (tránh nháy khi rê chuột ngang qua); tap ngoài popover → đóng ngay |
| Hover/tap 1 `.order-row` | mở popover y hệt (món đó cũng nằm trong Menu) | như trên | như trên |
| Nấu xong 1 món **có** trong Order của mình, thu vào `#my-foods` | `.order-row` tương ứng chuyển `✓`, mọi chip trong hàng đó sáng vàng cố định; badge `order-need` trên các thẻ trong tay tính lại ngay (tắt ở loại không còn phục vụ hàng `○` nào khác) | glow xanh-vàng 1 nhịp quanh hàng + tick pop `scale 0→1.2→1`; toast nhỏ góc dưới-trái "Order 2/3 done" | glow 400ms; toast giữ 1500ms + fade 250ms (GUESS) |
| Nấu xong 1 món **không** trong Order (ngoài-Order) | vào `#my-foods` bình thường, cộng điểm | y hệt luồng "thu chính thức" đã có ở `ui/table.md` — không đụng tới `#my-order` | — |
| Thẻ nguyên liệu trong tay đổi trạng thái "phục vụ Order" (vừa bốc, vừa dùng để nấu, hoặc hàng Order liên quan vừa `✓`) | badge `order-need` trên thẻ đó bật/tắt tương ứng | tĩnh, không animate/rung — chỉ xuất hiện/biến mất theo state (giữ ngôn ngữ "thông tin nền", `art.md` mục 3) | tức thời (<100ms) |
| Xong đủ Order (`07-` Rule 10) | ván dừng ngay | không cần feedback riêng ở `#my-order` — `GAME_END` overlay mở ngay trong cùng khung hình, xem "Màn kết thúc" | — |
| Tap `Menu` (đổi tên từ `Recipes`) | mở `#recipeModal`, bảng chỉ N dòng (đúng Menu ván này) | không đổi hành vi mở/đóng so với `ui/table.md` | không đổi |

## Online states

- **Hidden info:** `#menu-rail` giống hệt mọi ghế (Menu công khai, `07-` Rule
  14). `#my-order`/popover của nó chỉ dựng từ Order **của đúng ghế đang xem**
  — không có payload, không có phần tử DOM nào chứa Order ghế khác trước khi
  ván kết thúc (khớp `07-` Rule 17 / `06-` Rule "redaction"). Badge
  `order-need` trên `.hand-fan` cũng chỉ derive từ Order + tay của chính ghế
  đang xem — không cần logic redaction riêng, kế thừa nguyên tắc của
  `#my-order`. Không có chỗ nào trên UI gợi ý "đối thủ vừa xong Order" — món
  họ nấu hiện ở `.seat-foods` giống hệt nhau dù trong hay ngoài Order của họ
  (không thêm huy hiệu/màu riêng cho món-Order trên pod đối thủ — quyết định
  chủ đích để không lộ tập Order qua hành vi UI).
- **Rejoin giữa ván (`06-` Rule 21):** host gửi snapshot đầy đủ đã redact cho
  ghế đó → `#menu-rail` và `#my-order` (đúng N hàng theo `ORDER_SIZE` ván
  đó) dựng thẳng ở trạng thái hiện tại (không phát lại `#menuIntroModal` hay
  animation pop-in — chỉ deal/animation bài mới mới replay theo cơ chế cũ).
  `.order-row` hiện đúng tick xong/chưa hiện tại ngay từ khung hình đầu; badge
  `order-need` trên tay cũng tính đúng ngay từ khung hình đầu.
- **Skip Menu intro cục bộ:** [SỬA bởi `10-match-intro.md` Rule 2–8 — 2 bước Menu/Order, host `wait` `introMs()` thay `MENU_REVEAL_MS`] tap skip chỉ ẩn overlay ở đúng client đó; các
  client khác (và host, dùng cho pacing bot) vẫn chạy hết `MENU_REVEAL_MS`
  của riêng họ — không có gói tin "skip" gửi qua mạng. Host `wait()`
  `MENU_REVEAL_MS` (hằng số mới, cùng giá trị client dùng để tự đóng overlay)
  trước khi cho phép Draw đầu tiên, đúng nguyên tắc "host pacing = client
  animation" — cần thêm vào `data.ts`.
- **Host left / disconnect / turn timer:** không đổi so với `06-online-room.md`
  — `#menu-rail`/`#my-order` chỉ là dữ liệu hiển thị thêm trong `View`, không
  ảnh hưởng luồng ngắt kết nối/rejoin/hết giờ đã có.

## Interruptions

| Tình huống | Xử lý |
|---|---|
| Resize trong lúc `#menuIntroModal` đang hiện | modal căn giữa lại theo viewport mới, không huỷ đếm giờ đang chạy |
| Tab blur trong lúc `#menuIntroModal` đang đếm | tạm dừng đếm giờ auto-đóng (giống tạm dừng `idle-wobble`/nhịp AI đã có), resume khi visible lại — tránh người chơi quay lại thấy Menu đã biến mất mà chưa kịp đọc |
| Resize khi `#menu-rail`/`#my-order` đang pop-in so le | các item chưa tới lượt pop-in xuất hiện thẳng ở vị trí mới (không đuổi theo animation dở dang) — cùng nguyên tắc đã áp dụng cho thẻ bay ở `ui/table.md` |
| Popover công thức đang mở, người chơi resize hoặc cuộn `#my-foods` | đóng popover ngay (đơn giản hơn đuổi theo vị trí neo đổi) |

## Empty / error states

- **Order bất khả thi giữa ván** (`07-` Edge case, Câu hỏi mở #8 của `07-`):
  doc này **không** thêm trạng thái cảnh báo nào cho `.order-row` — giữ đúng
  quyết định mặc định của `07-` (im lặng). Nếu người duyệt đổi ý ở câu hỏi đó,
  cần quay lại sửa doc này (thêm 1 state mới cho `.order-row`, ví dụ viền xám
  gạch chéo).
- **`#menu-rail` chưa có dữ liệu** (khung hình đầu tiên trước khi host build
  xong Match): không xảy ra trên UI vì overlay `#menuIntroModal` đã che toàn
  màn cho tới khi Menu sẵn sàng — không cần trạng thái rỗng riêng cho rail.
- **Menu chỉ có rất ít món dính tới tay hiện tại** (không có chip nào sáng
  vàng ở 1 hàng Order, không badge `order-need` nào hiện trên tay): hiển thị
  bình thường, toàn chip mờ — không phải lỗi, chỉ là chưa bốc được nguyên
  liệu cần.

## Màn kết thúc (bổ sung `#endModal`/`#endBox`)

Không đổi khung modal/2 nút đã có ở `ui/table.md`. Đổi nội dung:

- Cột **"Courses"** (3 huy hiệu A/M/D) → cột **"Order"**: N thẻ món thu nhỏ
  (dùng đúng cỡ 32×32 đã dùng cho cột Foods, N=`ORDER_SIZE` của ván), mỗi
  thẻ đè 1 dấu — **✓** (đã xong, viền vàng) hoặc **✕ mờ** (chưa xong, giữ
  nguyên ảnh nhưng xám 60%) — áp dụng cho **mọi người chơi**, vì lúc này
  Order không còn là bí mật (`07-` Rule 13/15).
- Hàng của người kích hoạt Kết thúc A' (xong Order đầu tiên, `07-` Rule 10)
  có thêm 1 nhãn nhỏ **"Finished order first"** cạnh tên — tách biệt với 🏆
  (điểm cao nhất) đã có, vì 2 người có thể khác nhau (`07-` Rule 12: xong
  Order trước không chắc thắng điểm). Kết thúc B (`07-` Rule 11, pool cạn)
  không có hàng nào mang nhãn này.
- Tiêu đề overlay đổi theo lý do: **"Game over — <Name> completed their
  Order"** (Kết thúc A') hoặc **"Game over — pool empty"** (Kết thúc B) —
  in-game text tiếng Anh, thay chuỗi lý do cũ dựa theo "đủ 3 loại".

## Numbers (toàn bộ GUESS — chỉ số UI, không trùng số luật của `07-`)

| Value | Default | Why |
|---|---|---|
| ~~`MENU_REVEAL_MS`~~ **[THAY bởi `10-match-intro.md`]** | 2600ms | đủ đọc lướt 6–10 tên món, không dài tới mức gây sốt ruột; host `wait()` đúng số này trước Draw đầu tiên |
| ~~`MENU_ITEM_POP_MS`~~ **[THAY bởi `10-match-intro.md`]** | 120ms/item | so le vừa đủ thấy chuyển động, N món (tối đa 10 theo `07-`) vẫn xong dưới 1.5s |
| `#menu-rail` height | 64px | vừa ảnh món 40×40 + lề, không lấn khoảng ghế `top` |
| `.menu-item` size | 44×44 | đúng sàn tap target, ảnh món 40×40 căn giữa |
| Hover-intent trước khi mở popover | 150ms | tránh popover nháy liên tục khi rê chuột ngang qua rail |
| `.order-row` height, N=3 (1280 / 1024) | 40px / 36px | N=3 (2 người) — 3 hàng vẫn nằm gọn trong dock cùng phần đầu ~44px + chừa chỗ cho `#my-foods` |
| `.order-row` height, N=4 (1280 / 1024) | 34px / 30px | N=4 (3 người) — co theo N để `#my-order` không phải cuộn |
| `.order-row` height, N=5 (1280 / 1024) | 28px / 26px | N=5 (4 người) — trường hợp chật nhất: `44+5×28+18=202px` (1280, dock max 240px) và `40+5×26+16=186px` (1024, dock max 210px) — vẫn còn vài chục px cho `#my-foods` cuộn |
| `.order-chip` size (1280 / 1024) | 14×14 / 12×12 | đủ phân biệt sáng/mờ ở khoảng cách nhìn bình thường trên desktop, không co thêm theo N |
| Badge `order-need` size | Ø 18% bề rộng thẻ | khớp đúng số artist đã chọn ở `art.md` mục 3 — không tự đặt số riêng ở đây |
| Glow "order dish done" | 400ms | đủ để mắt bắt được, không chặn thao tác tiếp theo |
| Toast "Order N/`ORDER_SIZE` done" | hiện 1500ms + fade 250ms | ngắn hơn toast tố (2500ms) vì đây là thông tin phụ, không cần hành động |

## Ảnh hưởng tới ui/table.md

**Đã áp dụng thẳng vào `design/ui/table.md` ngày 2026-09-19** (file đó chuyển
`BUILT` → `AGREED`, thêm Tuning pass mới). Liệt kê lại đây làm hồ sơ tra cứu
zone-by-zone:

1. **`#table-surface`** — chiều cao đổi từ `100vh − 56px` thành
   `100vh − 56px − 64px` (trừ thêm `#menu-rail` mới chen giữa `#hud` và nó).
   Mọi anchor % của `.seat`/`#center-play` vẫn tính theo chiều cao mới của
   chính `#table-surface` nên **không cần đổi số %** — chỉ đổi vùng pixel mà
   % đó áp lên (ghế nhích lên một chút theo pixel tuyệt đối, vẫn đúng tỉ lệ).
2. **`#hud`** — không đổi vị trí/kích thước/số dòng; chỉ đổi **nhãn** nút
   `Recipes` → `Menu` (giữ nguyên id `#btnRecipes`).
3. **`#my-panel`** — bỏ `#my-h2` (huy hiệu A/M/D, dùng `coursesHTML`), thay
   bằng khối `#my-order` mới (N hàng theo `ORDER_SIZE` — 3/4/5 tuỳ số người,
   không cuộn, hàng co chiều cao ở N cao). **[SỬA bởi `ui/table.md` Tuning
   pass (7), 2026-09-19]** `#my-panel` không còn nằm chung dock với
   `.hand-fan`/`#my-foods` — đã dời sang zone riêng ở góc phải dưới
   `#table-surface`; `#my-foods` tách hẳn sang góc trái dưới. Quyết định #7
   dưới đây (dock giữ nguyên `clamp(210px,30vh,240px)` để chừa chỗ
   `#my-foods`) **không còn áp dụng** — `#my-panel` giờ co theo đúng nội
   dung, không phải chia sẻ chiều cao dock với `#my-foods` nữa.
4. **`.seat-head`** (pod đối thủ) — bỏ hàng huy hiệu A/M/D (`coursesHTML`)
   vì huy hiệu đó ngầm ám chỉ tiến độ thắng theo luật cũ (đủ 3 loại), nay đã
   sai với luật Order. Không thêm gì thay thế — pod chỉ còn tên/stool/điểm/
   số thẻ úp như đã có, có thêm khoảng trống dư.
5. **`#recipeModal`/`#recipeBox`** — nội dung bảng đổi từ 20 món (toàn bộ
   `RECIPES`) thành đúng N món của Menu ván hiện tại; legend "gold = in your
   hand now" giữ nguyên logic.
6. **`#endModal`/`#endBox`** — cột "Courses" (huy hiệu A/M/D) đổi thành cột
   "Order" (N thẻ món + tick xong/chưa); thêm nhãn "Finished order first"
   cho người kích hoạt Kết thúc A'; chuỗi tiêu đề lý do kết thúc đổi nội dung.
7. **Mục "Deal đầu ván" (Interactions)** — thứ tự đầu ván đổi thành:
   `#menuIntroModal` (mới) → pop-in `#menu-rail` + `#my-order` (mới) → deal
   như cũ. Deal tự nó không đổi cách chạy, chỉ đổi thời điểm bắt đầu.
8. **Zone size mới cần thêm vào bảng "Zone sizes" của `ui/table.md`:**
   `#menu-rail` (100vw×64px).
9. **`.hand-fan`** (Elements, cột States) — thêm 1 trạng thái **cộng thêm**
   (không thay thế idle-wobble/hover-lift/selected/dragging/useful-highlight
   đã có): badge `order-need` tĩnh góc trên-trái, chỉ hiện trên thẻ trong tay
   của chính người chơi khi loại đó phục vụ ≥1 hàng Order chưa xong (xem
   Elements ở trên; màu/hình theo `art.md` mục 3).

## Depends on

- `design/07-menu-orders.md` — nguồn luật Menu/Order, hidden-info Rule 14–17.
- `design/ui/table.md` — layout/zone id nền; các thay đổi ở mục "Ảnh hưởng"
  đã được gộp trực tiếp vào file đó (nay `AGREED`).
- `design/06-online-room.md` — redaction theo ghế, rejoin snapshot, pacing host.
- `design/art.md` mục "Menu & Order — bổ sung" — token `--order-need`, hình
  badge, ngôn ngữ dim/gạch ngang cho Menu tile (không dùng cho `.order-row`,
  xem quyết định #4 ở trên).

## Done when

- Vào ván (cả 2 chế độ), `#menuIntroModal` hiện đủ N món Menu trước deal, tự
  đóng hoặc tap để đóng; sau đó `#menu-rail` hiện thường trực suốt ván.
- `#my-order` hiện đúng `ORDER_SIZE` hàng (3/4/5 theo 2/3/4 người), không hàng
  nào bị cắt hay cuộn, ở cả 1280×800 và 1024×700.
- `#my-order` chỉ hiện Order của đúng ghế đang xem; kiểm bằng 2 tab online —
  không tab nào thấy Order tab kia trước khi ván kết thúc.
- Nấu xong 1 món trong Order → `.order-row` tương ứng chuyển `✓`; nấu món
  ngoài Order → không đụng `#my-order`, vẫn cộng điểm vào `#my-foods`.
- Chip nguyên liệu trong `.order-row`/popover sáng vàng đúng lúc đang có
  loại đó trong tay, tắt sáng ngay khi thẻ đó rời tay (đánh ra/dùng để nấu).
- Thẻ nguyên liệu trong tay của chính người chơi hiện badge `order-need` tím
  tĩnh đúng lúc loại đó phục vụ ≥1 hàng Order chưa xong, tắt ngay khi mất
  điều kiện — kiểm ở cả 2 tab online, không tab nào thấy badge dựa theo Order
  của ghế khác.
- Pod đối thủ và `#my-panel` không còn huy hiệu A/M/D nào; `#recipeModal`
  chỉ liệt kê đúng N món Menu ván hiện tại.
- Xong đủ Order → `GAME_END` mở với cột "Order" đúng tick cho mọi người,
  nhãn "Finished order first" đúng người kích hoạt (nếu Kết thúc A').
- Rejoin online giữa ván → `#menu-rail` + `#my-order` (đúng N hàng) dựng
  đúng trạng thái hiện tại ngay lập tức, không phát lại overlay/animation
  đầu ván.

## Câu hỏi mở cho người duyệt (còn lại sau 2026-09-19)

1. **`#menu-rail` có nên hiện thêm số lần món đó đã được nấu (ví dụ "×2")
   không?** Số này suy ra được từ thông tin đã công khai (`.seat-foods` mọi
   ghế), không lộ thêm gì — nhưng cần cộng dồn qua toàn bàn, thêm việc code.
   Recommend: để dành cho 1 vòng `/tuning` sau playtest đầu, không làm ngay.
2. **Cắt hẳn quyền xem lại 20 món gốc không?** `#recipeModal` bản này chỉ
   còn N món Menu, đúng luật "không thẻ filler" của `07-`. Nếu người chơi
   muốn xem cả 20 món gốc (tò mò/tham khảo), doc này **không** giữ đường nào
   để xem — xác nhận đây là chủ đích, không phải thiếu sót.
3. **Cột "Order" ở màn kết thúc sắp theo thứ tự sinh ra hay xong-trước lên
   đầu?** Doc này chọn giữ nguyên thứ tự sinh Order (ổn định, dễ so hàng
   giữa nhiều người chơi cùng lúc). Thay thế: xong-trước lên đầu — dễ đọc
   "ai xong gì trước" hơn nhưng thứ tự nhảy lộn xộn giữa các hàng.
