# Art — Kitchen Mahjong

**Status:** BUILT (2026-09-16 (2))
**Ngày:** 2026-09-16 (sau playtest đầu tiên — "Oke tôi thấy hiện tại ổn về gameplay
logic cho bản MVP. Tôi cần Artist + UI Designer tham gia vào để chúng ta rework
lại phần visual" → `playtest.md`, Next status: KEEP GOING → BUILDING)
**Sửa 2026-09-16 (2)** (playtest 2026-09-16 (2), KEEP GOING — đơn giản hoá UI):
bỏ hẳn zone Bếp riêng (khay men, viền `Cook food lands here`) — reveal giờ là
1 thao tác kéo-chồng ngay trong hand-fan; mở rộng panel info người chơi
(`#me`) thành nơi chứa món đã nấu; xoá mọi spec cho các phần tử HUD bị người
test bỏ (Speed, Show AI hands, Pool/Claims/Discard ở topbar, "Foods N"/`×N`
lẻ ở ghế đối thủ, nhãn "Clockwise"). Nhãn `Pool N` dưới chồng bài giữa bàn
**giữ nguyên** (người test chọn). Mọi mục dưới đây liên quan đã cập nhật theo
đợt sửa này; phần chưa nhắc tới giữ nguyên bản 2026-09-16 (1).
**Viewport:** responsive, lấp đầy cửa sổ trình duyệt (`00-core.md`)
**Ràng buộc build:** `prototype.html` là 1 file HTML duy nhất — không CDN,
không web font. Mọi thứ trong doc này dựng bằng CSS gradient/shadow/border,
inline SVG nhỏ, font hệ thống, và ảnh có sẵn trong `Art/Card/*`
(27 ảnh nguyên liệu) + `Art/Food/*` (20 ảnh món). Không đề asset raster mới
cho pass này — mục "Prompt tạo ảnh AI (để sau)" ở cuối chỉ là tuỳ chọn cho
tương lai.
**Phối hợp:** `design/ui/table.md` (ui-designer) sở hữu layout, zone, gesture,
animation *timing*. File này sở hữu theme, bảng màu, texture, mặt thẻ, ghế/đôn/
bàn, và *nhìn* (không phải timing) của hiệu ứng. Tên zone dùng lại đúng ID/class
đã có trong `prototype.html` hiện tại (`#table`, `#opponents`, `.seat`, `#me`,
`#center`, `#lastPlay`, `#discardWrap`, `.hand`, `.card`, `.food`) — nếu
`ui/table.md` đặt tên khác khi file đó xong, đối chiếu lại và thống nhất theo
tên xuất hiện trước trong code, không tạo bộ tên thứ ba.

## Định hướng (Direction)

- **Slay the Spire (bố cục thẻ)** — khung thẻ dày, đọc được ngay ở kích thước
  nhỏ: dải màu/viền theo loại ở mép ngoài, một "viên đá" giá trị ở góc trên-
  trái. Lấy: cấu trúc mặt thẻ món (viền màu theo course + chip tròn góc mang
  chữ cái A/M/D) và nguyên tắc "chỉ thẻ ghi điểm mới có đủ khung nặng."
- **Balatro (juice)** — số điểm bay lên to, nảy, có viền đen dày để nổi trên
  mọi nền; thẻ đang "ăn điểm" phát sáng viền vàng nhịp đều thay vì đứng yên.
  Lấy: kiểu chữ số điểm bay (`+N` to, bật `scale`, nổi lên rồi mờ) và ngôn ngữ
  "viền vàng nhịp đều = đang có thể ăn điểm," dùng xuyên suốt game chứ không
  chỉ một chỗ.
- **Stacklands (kỷ luật thẻ phẳng)** — vẫn đúng kỷ luật đã dùng ở `006`: thẻ là
  1 khối màu + viền dày + 1 ảnh/glyph, không vẽ minh hoạ tay, và vẫn đọc được
  ngay. Lấy: cách đặt ảnh thật (từ `Art/`) vào đúng 1 ô ảnh cố định trong thẻ,
  không để ảnh cạnh tranh với viền/khung.
- **Quán trà đá vỉa hè Việt Nam (theme)** — bàn nhôm/inox xếp thấp mặt bạc xước,
  đôn nhựa đỏ/xanh dương thấp, ấm trà inox + ly trà đá đọng hơi nước, khay men
  trắng viền xanh coban, bóng đèn tròn dây tóc treo thấp ánh vàng ấm ban đêm,
  nền vỉa hè lát gạch. Lấy: toàn bộ palette nền/bàn/ghế/Bếp + prop trang trí
  (ấm trà, ly, bóng đèn) — đây là "cái khung," thẻ bài vẫn là ngôi sao nên mọi
  yếu tố theme ở độ tương phản thấp hơn hẳn thẻ (xem Readability).

Tổng thể: nền tối ấm (không phải nền xanh-xám lạnh của `006`), mặt bàn nhôm
sáng làm sân khấu trung tâm cho thẻ, 3 màu course rõ ràng theo kiểu quán ăn
Việt (xanh lá rau thơm / cam đỏ nước lèo / tím hồng chè), và một màu vàng
"đang ăn điểm" dùng nhất quán ở mọi nơi có nghĩa "bạn có thể hành động ở đây."

## Bảng màu (Palette — token)

### Nền & bàn

| Token | Giá trị | Vai trò | Không dùng cho |
|---|---|---|---|
| `--bg-page` | `#0d0b09` | nền trang sau viewport (hẻm đêm) | panel, thẻ |
| `--bg-bulb-glow` | `radial-gradient(circle at 50% -10%, rgba(255,214,140,.14), transparent 60%)` | quầng sáng bóng đèn tròn treo, phủ decor lên `--bg-page` | không phủ lên `#table`/`.card` — chỉ ở viền/góc trang |
| `--sidewalk` | `#2b2620` | nền `#table` (mô phỏng gạch vỉa hè) | nền thẻ, nền panel |
| `--sidewalk-line` | `#3a352c` | đường ron gạch (ô lát), 1px, trang trí nền | viền thẻ |
| `--table-top-1` → `--table-top-2` | `#c7cacd` → `#8d9094` (gradient 135deg) | mặt bàn nhôm/inox | ghế, thẻ |
| `--table-rim` | `#6e7276` | viền/mép bàn | — |
| `--table-shadow` | `rgba(0,0,0,.45)` | bóng đổ mép bàn xuống vỉa hè | — |

### Đôn/ghế nhựa (trang trí — không mang nghĩa dữ liệu, không cần colorblind-safe)

| Token | Giá trị | Vai trò |
|---|---|---|
| `--stool-red` | `#c9433c` | đôn màu đỏ, gán cho ghế lẻ (seat index chẵn/lẻ) |
| `--stool-blue` | `#2f6fb0` | đôn màu xanh dương, gán cho ghế còn lại |

Chỉ 2 tông theo đúng yêu cầu "đôn nhựa đỏ/xanh dương" — luân phiên theo chỉ số
ghế, không cần mỗi ghế 1 màu riêng vì đây là **trang trí nhận diện ghế, không
phải tín hiệu luật chơi** (khác hẳn màu course bên dưới). Vì không mang nghĩa
dữ liệu, không bắt buộc phân biệt được với course color qua thị giác — nhưng
vẫn nên khác tông: `--stool-red` trầm/gạch hơn hẳn `--invalid` (bên dưới) để
mắt không đọc nhầm "ghế đỏ" thành "báo lỗi."

### UI chrome

| Token | Giá trị | Vai trò |
|---|---|---|
| `--panel` | `#201b16` | nền panel ghế, log, modal |
| `--panel-border` | `#3a332a` | viền panel |
| `--text` | `#f0e6d8` | chữ chính (kem ấm, như bảng thực đơn) |
| `--text-dim` | `#a89a86` | chữ phụ (why, hint) |

### Màu course (mang nghĩa dữ liệu — bắt buộc colorblind-safe, luôn đi kèm chữ cái)

| Token | Giá trị | Course | Chữ cái |
|---|---|---|---|
| `--course-a` | `#4caf6b` (xanh lá rau thơm) | Appetizer | **A** |
| `--course-m` | `#c9552c` (cam-đỏ nước lèo/ớt) | Main | **M** |
| `--course-d` | `#b0559e` (tím hồng chè) | Dessert | **D** |

Ba tông cố ý tách xa nhau cả về *hue* lẫn *lightness* (xanh lá ~50%L, cam-đỏ
~45%L, tím hồng ~55%L) để còn phân biệt được khi mù màu đỏ-lục (kiểu mù màu
phổ biến nhất) chỉ dựa vào độ sáng — nhưng luật vẫn là: **màu không bao giờ là
tín hiệu duy nhất**, chữ cái A/M/D luôn đi kèm (xem Readability).

### Vàng "có thể hành động" / báo lỗi / mới bốc

| Token | Giá trị | Vai trò | Không dùng cho |
|---|---|---|---|
| `--gold` | `#f2c14e` | **1 nghĩa duy nhất, dùng khắp game:** "bạn có thể hành động ở đây để ra điểm" — viền glow thẻ hữu dụng trong tay, thẻ đang chờ tố giữa bàn, nút Cook sẵn sàng, số điểm bay, viền thắng ở màn kết thúc | không dùng cho course Main (đã tách hẳn khỏi `--course-m` phía trên — đây là fix bắt buộc so với bản hiện tại, xem mục Fix) |
| `--invalid` | `#ff5252` | flash + rung khi thả thẻ sai vào Bếp | không dùng cho `--stool-red` (nhạt/trầm hơn hẳn), không dùng trang trí |
| `--new-ring` | `#6fd1ff` | viền tĩnh (không nhịp) quanh thẻ vừa vào tay (Draw hoặc thắng tố) | không dùng cho `--stool-blue` (đậm/trầm hơn, khác ngữ cảnh: đồ nội thất vs viền thẻ) |

### Chất liệu thẻ & tiến trình nấu (sửa 2026-09-16 (2) — bỏ khay men Bếp)

`--tray`/`--tray-rim` của bản trước đã bỏ cùng với zone Bếp (xem mục "Chồng
nấu trong tay"). `--ember-1`/`--ember-2` **giữ lại** — vẫn là fill duy nhất
của progress bar khi Cook, giờ vẽ đè lên chồng thẻ trong tay thay vì lên khay.

| Token | Giá trị | Vai trò |
|---|---|---|
| `--ember-1` → `--ember-2` | `#ff8a3d` → `#ffcf6b` (gradient) | fill thanh progress khi Cook — như than hồng |
| `--ing-bg` | `#f4efe2` | nền thẻ nguyên liệu (giấy/giấy gói hàng chợ) |
| `--ing-border` | `#8a6f42` | viền thẻ nguyên liệu (gỗ crate) |
| `--back-1` → `--back-2` | `#6b4530` → `#4a2f1f` (gradient 135deg) | mặt sau thẻ (đất nung ấm trà) |

## Quy tắc dễ đọc (Readability)

Viewport responsive, chủ yếu nhìn ở khoảng cách bàn làm việc (không phải điện
thoại cầm tay), nhưng vẫn phải co giãn xuống layout hẹp (`@media 820px` đã có
trong code) — kích thước thẻ nhỏ nhất hiện dùng là 44×62px (`.card.small`, bài
đối thủ + discard).

- **Màu không bao giờ là tín hiệu duy nhất.** Course luôn đi kèm chữ cái A/M/D;
  trạng thái thẻ (useful/claimable/invalid/new) luôn có thêm hình dạng khác
  nhau (viền tĩnh vs viền nhịp vs rung) chứ không chỉ đổi màu — một người xem
  ảnh xám hoá vẫn phân biệt được nhờ *có glow hay không* và *chữ cái nào*.
- **`--gold` chỉ mang đúng 1 nghĩa** trong toàn bộ game ("có thể hành động để
  ra điểm"). Không được gán cho course, không được dùng trang trí, không được
  dùng cho ghế/bàn.
- **Course color không bao giờ lặp lại ở đôn/Bếp/trang trí.** `--course-a`
  (`#4caf6b`) khác hẳn `--stool-red`/`--stool-blue`; `--course-m`
  (`#c9552c`) không được để trôi gần `--gold` như bản hiện tại đang bị (xem
  Fix).
- **Tương phản tối thiểu:** mọi viền/ring vẽ ở 3px trở lên trên cả `--sidewalk`
  (`#2b2620`) và `--panel` (`#201b16`) — tất cả hex course/gold/invalid/new ở
  trên đều đủ sáng/bão hoà hơn hai nền này để đọc là viền, không phải bóng.
  Ảnh nguyên liệu/món (`Art/*`) không bị che bởi overlay tối quá `rgba(0,0,0,.55)`
  ở bất kỳ trạng thái nào — chữ trên overlay luôn dùng `--text` (`#f0e6d8`) để
  giữ tỷ lệ tương phản cao.
- **Theme không được làm giảm tương phản của thẻ.** Prop trang trí (ấm trà, ly
  trà, quầng đèn, đường ron gạch) chỉ nằm ở nền `#table`/trang, và luôn ở
  opacity thấp (`--bg-bulb-glow` dạng radial mờ, đường ron `#3a352c` gần với
  `--sidewalk` `#2b2620` — chênh chỉ ~1 bậc sáng) — không bao giờ đặt phía sau
  hoặc chồng lên `.hand`/`.card`.
- **Ảnh xám hoá (greyscale check):** `--course-a` (~50%L xanh lá), `--course-m`
  (~45%L cam-đỏ), `--course-d` (~55%L tím hồng) rơi vào 3 bậc sáng khác nhau
  rõ rệt kể cả khi bỏ màu — cộng với chữ cái luôn hiện, course vẫn đọc được ở
  ảnh xám. `--gold` sáng nhất trong mọi hex glow → luôn nổi bật nhất kể cả xám.
- **Silhouette ở 44px (kích thước thẻ nhỏ nhất hiện có):** viền course 3px +
  chip góc tròn vẫn phải tạo được hình dạng phân biệt ở `.card.small`
  (44×62px) — nếu chữ A/M/D bên trong chip quá nhỏ để đọc (<8px), giữ nguyên
  chip màu + viền dày làm tín hiệu chính, chữ cái là tín hiệu phụ ở size này
  (chữ cái vẫn bắt buộc ở size mặc định 66×92 trở lên).

## Card spec

Thẻ hiện có trong code ở 3 cỡ cố định: mặc định `.card` 66×92px (bài trên tay),
`.card.small` 44×62px (bài đối thủ + discard), `#lastPlay .card` 84×116px (thẻ
vừa đánh giữa bàn). Tỉ lệ bên dưới áp dụng cho cả 3; `ui/table.md` có thể chỉnh
lại px cụ thể, nhưng phải giữ đúng tỉ lệ/ngôn ngữ này.

### Thẻ nguyên liệu (ingredient card)

- Bo góc `border-radius: 10%` chiều rộng (tối thiểu 6px).
- Viền 2px `--ing-border`, nền `--ing-bg` (giữ nguyên từ bản hiện tại).
- **Dải header** ở mép trên, cao ~20% chiều cao thẻ, nền `rgba(20,16,10,.55)`
  phủ lên trên, tên nguyên liệu căn giữa, đậm, màu `--text`, cỡ chữ co theo
  card (8px ở `.small`, 10px ở mặc định, 12px ở `#lastPlay`), ellipsis nếu
  tràn.
- **Ô ảnh** chiếm phần thân còn lại dưới header, ảnh từ `Art/Card/*`
  (`object-fit: cover`), lề trong 4px, bo góc 4px. Không thêm khung phụ quanh
  ảnh — ảnh là điểm nhấn, viền thẻ đã đủ làm khung.
- **Không có chip/điểm** — thẻ nguyên liệu cố tình "nhẹ" hơn thẻ món để mắt
  phân biệt ngay "cái này chưa ra điểm."

### Thẻ món (food card — mặt xuất hiện khi 1 chồng trong tay Cook xong, `02-` Rule 11)

**Sửa 2026-09-16 (2):** thẻ món không còn xuất hiện ở 1 khay Bếp riêng — nó
thay thế đúng ô chồng vừa Cook xong ngay trong hand-fan (người) hoặc đúng vị
trí chồng mini ở ghế (bot). Vì vậy dùng đúng size của ô nó thay thế: `.card`
mặc định 66×92 trong tay người, `.card.small`/`.mini` ở ghế bot — **không**
dùng size `#lastPlay` (84×116) nữa, để thẻ món không đổi kích thước ô fan khi
xuất hiện (đổi kích thước giữa chừng sẽ làm layout tay nhảy).

- Bo góc như thẻ nguyên liệu, nhưng **viền dày 3px, màu theo course**
  (`--course-a`/`--course-m`/`--course-d`) — dày hơn hẳn viền 2px của thẻ
  nguyên liệu, đây là tín hiệu silhouette đầu tiên phân biệt 2 loại thẻ trước
  khi đọc chữ.
- **Chip góc trên-trái** (tham khảo viên năng lượng Slay the Spire): hình
  tròn Ø ~28% chiều rộng thẻ, nền màu course, viền tối `rgba(0,0,0,.4)` 1.5px,
  chữ cái A/M/D căn giữa, đậm, màu `--text`.
- Dải header giống thẻ nguyên liệu, tên món thay vì tên nguyên liệu.
- Ô ảnh dùng `Art/Food/*`.
- **Chip điểm góc dưới-phải:** viên bo tròn nhỏ, nền `--gold`, chữ `+N` đậm
  màu tối (`#231a0c`), viền tối mảnh — kiểu "chip/mult" của Balatro, đây là
  chỗ duy nhất trên mặt thẻ hiện điểm số.
- Kết quả: thẻ món "nặng" hơn thẻ nguyên liệu rõ rệt (viền dày hơn + 2 chip
  thêm) — đúng nguyên tắc Slay the Spire "chỉ vật đang ghi điểm mới có khung
  đầy đủ."

**Food pill** (gọn — tray món đã reveal dưới mỗi ghế, `.food`, đã có trong
code): giữ nguyên cấu trúc pill (ảnh nhỏ 28×28 + tên + điểm), nhưng:
- `border-left` 3px đổi sang đúng 3 hex course mới (`--course-a/m/d`) thay vì
  bộ hex hiện tại (xem Fix).
- **Thêm chữ cái course** (hiện chưa có) — 1 badge nhỏ 10px trước tên món,
  nền màu course nhạt hơn (`color-mix` hoặc alpha .25), chữ đậm màu course.
  Đây là fix bắt buộc cho colorblind-safety — hiện tại pill chỉ có màu, không
  chữ.

Superseded 2026-09-16 (2): món đã thu hiển thị dạng thẻ món thu nhỏ theo ui/table.md, không dùng pill.

### Mặt sau thẻ (card back — bài úp của đối thủ, mặc định trước khi ván kết thúc)

- Nền gradient `--back-1` → `--back-2` (đất nung), viền 2px `--ing-border` —
  **đúng silhouette với mặt trước** (cùng bo góc, cùng độ dày viền tổng thể)
  để việc lật/úp không đổi hình dạng thẻ, chỉ đổi nội dung.
- Hoạ tiết nền: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(240,230,216,.08) 6px, rgba(240,230,216,.08) 10px)`
  — vân chéo mảnh, không đọc được là gì, chỉ tạo chất liệu.
- **Huy hiệu giữa thẻ:** SVG line-art ấm trà + ly nhỏ, ~40% chiều rộng thẻ,
  stroke `--text` opacity .35, đủ mờ để không cạnh tranh với viền/silhouette:

```html
<svg viewBox="0 0 64 64" width="40%" style="opacity:.35" fill="none"
     stroke="#f0e6d8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <ellipse cx="26" cy="40" rx="14" ry="7"/>
  <path d="M12 36 Q26 20 40 36"/>
  <path d="M38 28 Q48 27 47 34 Q46 40 38 38"/>
  <path d="M14 26 Q8 26 8 32 Q8 37 14 36"/>
  <rect x="23" y="12" width="6" height="4" rx="1"/>
  <path d="M46 34 L50 48 L58 48 L60 34 Z"/>
</svg>
```

### Trạng thái thẻ (states — cộng thêm lên mặt trước, độc lập ingredient/food)

| Trạng thái | Khi nào | Nhìn |
|---|---|---|
| **Hover** | con trỏ chuột (desktop) | `translateY(-4px)`, shadow `0 6px 10px rgba(0,0,0,.35)`, 120ms — không đổi màu |
| **Selected** | đã chọn để Play | viền 3px `--text` (kem, trung tính — không trùng bất kỳ glow nào bên dưới), `translateY(-8px)` |
| **Valid-in-recipe hint** (hữu dụng trong tay / Bếp sẵn Cook) | thẻ nằm trong 1 công thức ráp được | viền glow 3px `--gold`, `opacity .5↔1` nhịp 1.1s ease-in-out vô hạn |
| **Claimable glow** | thẻ vừa đánh giữa bàn, đang trong cửa sổ tố | cùng ngôn ngữ glow `--gold` như trên nhưng **bán kính lớn hơn (6px) và nhịp nhanh hơn (0.7s)** — tốc độ nhịp tự nó là tín hiệu "gấp hơn" |
| **Invalid shake** | thả thẻ vào Bếp không hợp lệ (`02-` Rule 9) | keyframe 300ms: `translateX 0→-6→6→-4→4→0`, viền chuyển `--invalid` chỉ trong lúc rung rồi trả lại màu cũ |
| **Locked-while-cooking** | chồng trong tay (hoặc ở ghế bot) đã bấm Cook — sửa 2026-09-16 (2), không còn ở Bếp | `filter: brightness(.82) saturate(.85)` trên toàn chồng, không glow, không đổi viền, `pointer-events: none` (chỉ chồng đó, các ô fan khác vẫn kéo-thả bình thường) — đi kèm hiệu ứng khói (xem "Chồng nấu trong tay") để "đang bận" đọc qua chuyển động chứ không chỉ tối màu |
| **New-drawn** | thẻ vừa vào tay (Draw hoặc thắng tố) | viền **tĩnh** (không nhịp) 3px `--new-ring`, giữ tới khi thẻ rời tay — cố ý tĩnh để không đánh nhau với glow nhịp `--gold` nếu 1 thẻ vừa mới vừa hữu dụng (2 viền xếp lồng: `--new-ring` ngoài, `--gold` trong) |
| **Shine (sheen) nhẹ** | mỗi khi 1 thẻ mới xuất hiện trên bàn (fly-in, reveal, món ra lò) | 1 dải sáng chéo quét qua mặt thẻ 1 lần, ~400ms: `background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,.35) 50%, transparent 60%)` trên pseudo-element, animate `background-position` từ ngoài trái sang ngoài phải rồi remove — chỉ chạy 1 lần, không lặp, giữ đúng tinh thần "juice nhẹ, không loá" |

## Bàn / Ghế / Đôn

### Mặt bàn (`#table`)

- Nền `--sidewalk`, phủ pattern ô gạch: `background-image: linear-gradient(0deg, var(--sidewalk-line) 1px, transparent 1px), linear-gradient(90deg, var(--sidewalk-line) 1px, transparent 1px); background-size: 28px 28px;` — ô lát vỉa hè mờ, chỉ là chất liệu nền.
- Khu vực trung tâm (`#center`, nơi đặt `#lastPlay`/discard) ngồi trên 1 mảng
  "mặt bàn nhôm": `background: linear-gradient(135deg, var(--table-top-1), var(--table-top-2))`,
  viền `--table-rim` 2px, bo góc 10px, `box-shadow: 0 6px 14px var(--table-shadow)`
  đổ xuống nền vỉa hè bên dưới — đọc như 1 cái bàn nhôm thật đặt giữa vỉa hè.

### Ghế / panel người chơi (`.seat`, `#me`)

- Panel nền `--panel`, viền 2px `--panel-border`, bo góc 10px (giữ layout hiện
  có, chỉ đổi màu/chi tiết).
- **Chip đôn** cạnh tên: 1 khối nhỏ 16×12px, bo góc trên 4px/bo góc dưới 1px
  (dáng mặt đôn nhựa nhìn nghiêng), nền `--stool-red` hoặc `--stool-blue` luân
  phiên theo `seat index % 2` — thuần trang trí, xác nhận "đây là chỗ ngồi của
  ai" bằng thị giác trước khi đọc tên.
- **Bảng tên (name plate):** giữ nguyên vị trí tên hiện có, nhưng đặt trên 1
  nền thẻ nhỏ màu `--ing-bg` (giấy kem) bo góc 4px, chữ tối `#231a0c` — như tấm
  biển tên để trên bàn quán.
- **Badge điểm/số món:** giữ counter điểm hiện có (`.score`, giữ `--gold` làm
  màu số — nhất quán với nghĩa "điểm/reward" đã định nghĩa), badge course
  (`.course`) đổi màu `.have` sang đúng 3 hex `--course-a/m/d` (xem Fix), luôn
  kèm chữ A/M/D (đã có sẵn trong code, giữ nguyên).
- **Chỉ báo đang tới lượt (active-turn):** viền panel chuyển `--gold`, cộng 1
  `box-shadow: 0 0 0 3px rgba(242,193,78,.35)` nhịp `opacity .6↔1` 1.6s —
  đọc như "bóng đèn phía trên ghế này vừa sáng lên," dùng đúng `--gold` (nhất
  quán nghĩa "lượt của bạn = có thể hành động").

### Panel info người chơi mở rộng (`#me`, sửa 2026-09-16 (2))

Panel góc trái-dưới giờ kiêm luôn chỗ "chứa" món đã nấu (trước đây là
`#my-foods`/food-pills tách rời) — vì Bếp không còn là 1 khay riêng để bay
thẳng thẻ món vào, món nấu xong phải có 1 đích rõ ràng để người chơi kéo/chạm
vào. `ui/table.md` quyết định layout/khoảng cách chính xác; đây là *nhìn*.

- Giữ nền `--panel`, viền 2px `--panel-border`, bo góc 10px như Ghế — nhưng
  cao hơn hẳn bản cũ để chứa thêm hàng food-pill cuộn ngang.
- Xếp dọc 4 hàng, mỗi hàng cách nhau 4px, ngăn bằng 1 đường kẻ mảnh
  `--panel-border` opacity `.4` (không phải viền đậm — chỉ đủ tách nhóm):
  1. **Tên** — chip đôn (`--stool-red`/`--stool-blue`) + bảng tên giấy kem,
     giữ nguyên spec ở mục Ghế trên.
  2. **Điểm + course** — `.score` màu `--gold`, 3 badge A/M/D giữ đúng màu
     course, luôn kèm chữ cái (spec cũ, không đổi).
  3. **Số bài trên tay** — icon mặt sau thẻ nhỏ (14px) + `×N`, dùng lại đúng
     token `.backicon`×N đã có ở ghế đối thủ — 1 chữ số duy nhất cho hand
     count, không lặp lại ở nơi khác trong panel.
  4. **Món đã thu hoạch** — `.foods-row` cuộn ngang, mỗi món 1 food pill
     28×28 + tên + `+N` + badge course (spec "Food pill" ở Card spec, không
     đổi). Rỗng thì hiện `--text-dim` "No foods yet".
- **Drop-target khi kéo 1 thẻ món từ hand-fan vào panel để thu hoạch:** toàn
  panel phát viền `--gold` 3px + `box-shadow: 0 0 0 4px rgba(242,193,78,.25)`
  nhịp 0.7s (tái dùng đúng nhịp "Claimable glow" — đây cũng là 1 hành động sắp
  ghi điểm) trong lúc 1 food card đang được kéo và điểm chạm nằm trong vùng
  panel. Thả đúng: food card bay vào cuối hàng 4, kèm 1 lần "Shine quét" (Card
  spec). Kéo ra ngoài panel: resnap về đúng ô chồng cũ trong hand-fan — không
  invalid-shake, đây không phải lỗi luật, chỉ là huỷ thao tác.

### Chồng nấu trong tay (in-hand stack — thay thế Bếp, sửa 2026-09-16 (2))

Zone Bếp riêng (khay men, chữ "Cook food lands here"/"Drop card here") đã bỏ.
Reveal giờ là kéo 1 thẻ trong tay thả lên 1 thẻ/chồng khác trong cùng tay —
gộp thành 1 chồng, nằm nguyên trong đúng 1 ô của hand-fan.

- **Hình dạng chồng:** mỗi thẻ thêm vào lệch dọc `+12px` (giữ đúng convention
  cascade hiện có trong code, đủ cao hơn dải header ~18px để header thẻ dưới
  vẫn lộ ra), viền ngoài chồng dùng đúng viền ingredient 2px `--ing-border`
  (không thêm khung phụ). Mỗi thẻ trong chồng trừ thẻ trên cùng thêm
  `box-shadow: 0 3px 4px rgba(0,0,0,.35)`; cả chồng thêm 1
  `box-shadow: 0 6px 12px rgba(0,0,0,.4)` đổ xuống nền tay — độ lệch + bóng đổ
  là silhouette phân biệt "1 chồng" với "1 thẻ đơn" ở cùng cỡ ô fan.
- **Valid-drop hint (đang kéo thẻ lên thẻ/chồng khác):** đích phát viền glow
  `--gold` 3px nhịp 0.7s (tái dùng "Claimable glow") nếu chồng kết quả vẫn
  khớp được ≥1 công thức. Đích chuyển viền `--invalid` 2px **tĩnh** (không
  nhịp — cảnh báo trước khi thả, khác "Invalid shake" là phản hồi sau khi thả
  sai) + ghost thẻ đang kéo giảm `opacity .6` nếu chồng kết quả không khớp
  công thức nào.
- **Nút Cook `<Món> +N`:** xuất hiện ngay khi 1 chồng khớp đúng 1 công thức —
  ≥44px cao, dán cạnh trên đúng chồng đó trong hand-fan
  (`bottom: calc(100% + 6px)` so với chồng, không so với khay cố định như bản
  cũ). **Chốt màu (giải quyết ambiguity gold-vs-ember bản trước):** nút Cook
  dùng **`--gold`**, không dùng ember — đúng theo bản dev đã build. Lý do:
  `--gold` là ngôn ngữ duy nhất cho "có hành động ra điểm ở đây" xuyên suốt
  game (bài hữu dụng, claim window, nút Cook); `--ember` chỉ còn đúng 1 vai
  trò là fill progress bar (than hồng), không dùng cho nút bấm.
- **Progress bar khi Cook chạy:** đè lên đúng chồng đang nấu, không phải trên
  khay riêng — dải mỏng `height: 6px` ngang bề rộng thẻ, neo `top: -8px` so
  với thẻ trên cùng chồng. Track `rgba(0,0,0,.25)`, fill gradient
  `--ember-1` → `--ember-2` chạy trái→phải theo `COOK_MS` — giữ nguyên ngôn
  ngữ than hồng, chỉ đổi điểm neo.
- **Locked-while-cooking:** xem bảng Trạng thái thẻ ở Card spec (đã cập nhật)
  — chỉ chồng đang nấu bị khoá, các ô fan khác quanh nó vẫn kéo-thả bình
  thường.
- **Khói / transform khi Cook xong:** giữ nguyên ngôn ngữ hiệu ứng cũ (3–4
  cụm khói mờ bay lên, thẻ món bật `scale(0.6→1.1→1)` + 1 lần shine quét —
  xem "Hiệu ứng" bên dưới), nhưng khói giờ bốc lên **từ đúng ô chồng đó trong
  hand-fan** thay vì từ khay Bếp — đọc như "món vừa chín ngay trên tay bạn."
  Thẻ món kết quả giữ nguyên vị trí ô đó, không tự bay đi, tới khi người chơi
  kéo/chạm nó vào panel info để thu hoạch (xem "Panel info người chơi mở
  rộng" ở trên).
- **Bot-seat mini stack:** bot không có hand-fan hiển thị — chồng nấu của bot
  vẫn ở đúng vị trí `.seat-bep` hiện có cạnh pod ghế, nhưng bỏ khay men nền:
  chỉ là các thẻ cỡ nhỏ nhất (`.card.small`/`.mini`) xếp lệch dọc `+8px` (tỉ
  lệ nhỏ hơn theo cỡ thẻ), cùng ngôn ngữ box-shadow chồng ở trên nhưng giảm 1
  bậc bán kính (`0 4px 8px rgba(0,0,0,.4)`). Progress bar + khói +
  locked-while-cooking dùng đúng spec trên, co theo tỉ lệ mini. Thẻ món kết
  quả xuất hiện tại đúng vị trí chồng đó rồi bay vào food-pills row có sẵn
  dưới ghế bot (animation pill hiện có, không đổi).

### Prop trang trí tĩnh (không tương tác — chỉ ở nền `#table`, `ui/table.md` quyết định vị trí đặt)

- **Ấm trà + ly trà đá** cạnh mép bàn nhôm, SVG line-art đơn giản, stroke
  `#cfd3d6` (bạc nhạt, tách khỏi mọi hex mang nghĩa ở trên), fill ly bằng
  `rgba(120,80,40,.55)` (màu nước trà) + 2 chấm tròn trắng xanh nhạt (đá viên):

```html
<svg viewBox="0 0 120 64" width="120" height="64" fill="none"
     stroke="#cfd3d6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <ellipse cx="34" cy="46" rx="20" ry="10" fill="#d9dcdf"/>
  <path d="M14 42 Q34 20 54 42" fill="#eceff1"/>
  <path d="M50 32 Q66 30 64 42 Q62 50 50 46"/>
  <path d="M18 30 Q10 30 10 38 Q10 46 18 44"/>
  <rect x="30" y="14" width="10" height="6" rx="2" fill="#eceff1"/>
  <path d="M84 30 L90 54 L106 54 L112 30 Z" fill="rgba(120,80,40,.55)"/>
  <circle cx="93" cy="36" r="3" fill="#e8f4ff"/>
  <circle cx="101" cy="40" r="3" fill="#e8f4ff"/>
</svg>
```

- **Bóng đèn treo:** không phải SVG — chỉ 1 `--bg-bulb-glow` radial-gradient cố
  định ở top của trang (phía sau `#app`), rất mờ, gợi ánh đèn ban đêm mà không
  cần vẽ dây/bóng đèn thật.
- Cả hai prop trên **chỉ đặt ở mép/nền `#table`, không bao giờ che `.hand`,
  `.seat`, hay khu vực thẻ** (Readability rule).

## Hiệu ứng (nhìn — timing chi tiết do `game-dev`/`ui-designer` tinh chỉnh, đây là ngôn ngữ hình ảnh)

- **Score pop (Balatro-style):** tại vị trí reveal/claim, text `+N` to (20–24px
  tuỳ context), đậm, màu `--gold`, viền chữ tối `text-shadow: 0 2px 0 #231a0c`
  để nổi trên mọi nền — bật `scale(0.4→1.2→1)` rồi `translateY(-30px)` +
  `opacity 1→0`, ~500ms. Course letter nhỏ đi kèm bên cạnh số (vd. "+7 M") để
  ngay khoảnh khắc điểm bay lên cũng củng cố course vừa ăn.
- **Khói / transform khi Cook xong (`02-` Rule 11):** đúng lúc chồng nguyên
  liệu trong Bếp biến mất và thẻ món xuất hiện — 3–4 cụm khói nhỏ (div tròn mờ,
  `background: radial-gradient(circle, rgba(240,230,216,.5), transparent 70%)`,
  Ø 14–20px), bay lên `translateY(-24px)` lệch trái/phải ngẫu nhiên nhẹ, `opacity 1→0`
  ~450ms, đồng thời thẻ món bật vào bằng `scale(0.6→1.1→1)` + 1 lần "shine" quét
  (đã định nghĩa ở Card spec) — đọc như hơi nước bốc lên từ khay nóng, không
  cần chữ "Cooking..." (đúng luật `02-` không cần text).
- **Toast tố (claim contest):** khi thua tố — banner nhỏ dạng pill giữa màn
  hình trên, nền `--panel`, viền trái 3px `--gold`, chữ `--text`, ví dụ
  `Bot 2 took it — Bun Bo Hue 7 > 4` — fade+slide xuống nhẹ khi vào, giữ ~1.5s,
  fade khi ra. Không dùng `--invalid` — thua tố không phải lỗi, chỉ là thua
  ưu tiên, nên vẫn dùng ngôn ngữ "vàng = có liên quan tới điểm."
- **Turn-light pulse:** đã mô tả ở phần Ghế — nhắc lại ở đây vì nó là hiệu ứng,
  không phải static state: viền panel + shadow `--gold` nhịp chậm 1.6s trong
  suốt lượt của người/bot đó, tắt ngay khi lượt chuyển.
- **Shine quét** trên thẻ mới xuất hiện — đã mô tả ở Card spec states, áp dụng
  cho mọi thẻ mới bay vào bàn (Draw, thắng tố, thẻ món ra lò).

## HUD / Overlay

- **Topbar (`#topbar`), sửa 2026-09-16 (2):** nền `--panel`, viền dưới 1px
  `--panel-border`. Bỏ hẳn chip `Pool`/`Claims`/`Discard` khỏi topbar (người
  test đánh giá dư thừa — thông tin này đã đọc được qua bàn chơi/panel). Chip
  còn lại (`Turn`) giữ đúng style cũ: nền `rgba(0,0,0,.25)` trên `--panel`,
  chữ `--text-dim` cho label + `--text` cho số — không dùng `--gold` ở đây
  (vàng dành riêng cho "điểm/hành động" trong khu vực chơi, topbar chỉ là
  thống kê). Nhãn `Pool N` riêng dưới chồng bài giữa bàn (`ui/table.md` sở
  hữu vị trí) **không đổi** — không phải chip topbar, người test giữ lại.
- **Nút (buttons), mọi nút ≥44×44px (đã đúng luật code hiện tại):**
  - Primary (Draw, Play, Play again) — nền `--gold`, chữ tối `#231a0c` đậm.
  - Reveal/Cook (`.reveal`) — nền `--ember-1`→`--ember-2` gradient nhạt hơn
    primary một bậc (để primary vẫn nổi nhất khi cả hai cùng xuất hiện),
    chữ `--text`.
  - Secondary/chrome (Restart, Recipes) — nền `--panel` sáng hơn 1 bậc
    (`#2a241d`), viền `--panel-border`, chữ `--text`. **Sửa 2026-09-16 (2):**
    bỏ nút Show AI hands và Speed khỏi nhóm này — cả hai đã bị gỡ khỏi HUD.
  - Pass — viền `--invalid` mảnh 1.5px, nền trong suốt, chữ `--text` — đủ để
    đọc là "từ chối" mà không cần fill đỏ đặc (Pass không phải lỗi, chỉ là 1
    lựa chọn hợp lệ).
- **Modal claim (`#claimModal`):** nền `--panel`, thẻ vừa đánh hiển thị lớn
  (dùng size `#lastPlay`), mỗi lựa chọn Claim hiển thị như 1 hàng có ảnh món
  nhỏ (28×28, `Art/Food/*`) + chữ cái course + tên + `+N` màu `--gold` — nâng
  cấp từ nút text thuần hiện tại để người chơi thấy ngay mình sắp ăn món gì,
  không chỉ đọc tên.
- **Recipes modal:** khung như "bảng thực đơn dán" — nền `--panel`, mỗi dòng
  món có chấm màu course nhỏ trước tên (không chỉ chữ "Appetizer/Main/Dessert"
  as text như hiện tại — thêm swatch màu + chữ cái để nhất quán với course
  color ở nơi khác). Dòng "làm được ngay" (`tr.can`) đổi từ xanh lá sang
  **`--gold`** (fix bắt buộc, xem dưới) — nghĩa "bạn có thể làm món này ngay
  bây giờ" đúng là 1 dạng "có thể hành động," không phải course Appetizer.
- **End screen:** giữ khung hiện có, thêm viền `--gold` quanh hàng người thắng
  (🏆 emoji giữ nguyên), điểm số dùng `--gold`, tên món trong bảng kèm chấm màu
  course nhỏ.
- **Log drawer (`#log`):** giữ style "sổ order" hiện có (nền `--panel`, chữ
  nhỏ), đổi 2 màu: `.claim` giữ `--gold` (đã đúng nghĩa sẵn), `.reveal` đổi từ
  xanh lá (`#7fd69a`, trùng `--course-a`) sang **`--text`** hoặc **`--new-ring`**
  nhạt — log là bookkeeping trung tính, không nên mượn màu course.
- **Số `Turn` (topbar) và nhãn `Pool N` (giữa bàn)** không bao giờ dùng
  `--gold` (đã nói ở Topbar, sửa 2026-09-16 (2) bỏ Claims/Discard) — giữ quy
  tắc "vàng chỉ có 1 nghĩa" xuyên suốt mọi overlay.

## Fix bắt buộc khi build (đối chiếu với `prototype.html` hiện tại)

CSS hiện tại đã có vài chỗ trùng nghĩa màu — liệt kê rõ để `game-dev` sửa cùng
lúc build lại theo doc này, không phải lỗi mới phát sinh:

1. `.course.M.have { background: #f0b35a }` và `.food.M { border-left-color: #f0b35a }`
   — hex này gần như trùng `--gold` mới (`#f2c14e`). Đổi cả hai sang
   `--course-m` (`#c9552c`).
2. `tr.can td { color: #7fd69a }` (bảng Recipes, "làm được ngay") trùng hex
   course A hiện tại. Đổi sang `--gold` — đúng nghĩa "có thể hành động," tách
   khỏi course Appetizer.
3. `#log .reveal { color: #7fd69a }` cũng trùng course A. Đổi sang `--text`
   hoặc `--new-ring`.
4. `.card.new { box-shadow: 0 0 0 3px #e2b84a }` hiện dùng vàng cho "thẻ mới" —
   theo doc này đổi sang `--new-ring` (`#6fd1ff`, viền tĩnh), để `--gold` rảnh
   ra làm glow nhịp riêng cho "hữu dụng/claimable."
5. `.card.sel { border-color: #4aa3ff; box-shadow: 0 0 0 3px #4aa3ff }` (thẻ
   đang chọn) hiện dùng xanh dương gần giống `--new-ring` mới — đổi sang viền
   `--text` (kem) để 2 trạng thái "mới" và "đang chọn" không trùng tông xanh.
6. `.food` pill: thêm chữ cái course (hiện chỉ có màu `border-left`), theo
   spec Card spec > Food pill ở trên.

## Prompt tạo ảnh AI (tuỳ chọn — không cần cho pass này)

Toàn bộ pass này chạy bằng CSS/SVG/ảnh có sẵn, không cần thêm raster art. Nếu
sau này muốn nâng cấp bằng ảnh nền thật thay vì CSS gradient:

- *Background hero (trang chủ/màn chờ):* "overhead-adjacent view of a Vietnamese
  sidewalk iced-tea stall (quán trà đá vỉa hè) at night, low aluminum folding
  table, red and blue plastic stools, warm hanging bulb light, stainless
  teapot and condensation-covered iced tea glasses, sidewalk tiles, blurred
  street trees at the edges, warm amber lighting, flat illustration style,
  no people, wide empty space in the center for UI overlay."
- *(Khay men Bếp đã bỏ khỏi prompt list — sửa 2026-09-16 (2), zone Bếp không
  còn tồn tại; xem "Chồng nấu trong tay" cho ngôn ngữ mới.)*

## Menu & Order — bổ sung cho `07-menu-orders.md` (Status: BUILT — backlog #10)

**Ngày:** 2026-09-19, theo playtest 2026-09-19 ("...cần cả GD, Art, UI làm doc
trước để tôi duyệt sau đó lên ticket" → `playtest.md`, Next status: KEEP GOING).
Đối tượng: `design/07-menu-orders.md` (Status: DRAFT). Mục này **chỉ thêm**,
không sửa gì ở các mục phía trên.

**Sửa 2026-09-19 (2)** (review cùng người dùng, đối chiếu `design/ui/menu-orders.md`
đã viết xong — không còn 2 file mù thông tin nhau): đổi trạng thái "đã xong"
của Order sang viền vàng nhạt + glow (không còn dim+gạch ngang), bỏ hẳn hình
dạng "ticket giấy nghiêng + que xiên" (Order giờ là `.order-row` trong
`#my-panel`, không phải 1 vật thể rời trên bàn), khớp lại theo `#menu-rail`/
`.menu-item` thật (rail ngang 44×44, không phải "Menu board" tốc kê trước
đó), cập nhật `ORDER_SIZE` theo số người, sửa lỗi đếm `public/art/Card` (27
ảnh, không phải 26), trả lời trọn bộ asset ask của UI. Chuyển
**Status: AGREED** — không còn câu hỏi mở chặn `/build` (trừ 2 câu nhỏ giữ
lại ở cuối mục, không chặn).

**Phối hợp:** `design/ui/menu-orders.md` (đã viết xong) sở hữu layout/zone/
kích thước px thật của `#menu-rail`, `.menu-item`, `#my-order`, `.order-row`,
`.order-chip`, popover, cột Order ở `#endModal` — mục này chỉ sở hữu màu/
chất liệu/token, dùng đúng số đã chốt ở file đó (không còn kích thước GUESS
riêng của Art).

### 1. Menu item (`#menu-rail` / `.menu-item`, `07-` Rule 1, 14 — công khai, đứng nguyên suốt ván)

**Sửa:** bản trước đề xuất 1 "Menu board" dạng thẻ đứng ~52×80px xếp lưới —
`ui/menu-orders.md` (đã chốt) chọn khác: 1 dải ngang `#menu-rail` full-width
ngay dưới `#hud`, mỗi món là `.menu-item` 44×44 (đúng sàn tap target, không
lớn hơn). Viết lại theo đúng hình dạng thật này; ý gốc "Menu là danh sách
tham khảo tĩnh, nhẹ hơn hẳn food card" giữ nguyên.

- **Ảnh:** `Art/Food/*` (có sẵn, 20/20 món), `object-fit: cover`, 40×40
  trong ô 44×44 (lề 2px). Không cần crop mới — 40×40 lớn hơn kích thước ảnh
  nhỏ nhất đã duyệt trong code (`Food pill` 28×28), nên chắc chắn đọc được.
- **Huy hiệu loại (course badge), góc trên-trái ảnh:** ở ~9–10px khả dụng,
  chữ A/M/D **không đọc được** (<8px, dưới ngưỡng silhouette Readability).
  **Chốt:** badge chỉ còn 1 chấm tròn màu course, bỏ chữ cái — đây là ngoại
  lệ với luật "course color luôn kèm chữ cái," chấp nhận có kiểm soát vì (1)
  thông tin tham khảo tĩnh, không phải tín hiệu cần đọc tức thời để hành
  động, (2) bản đầy đủ (chip + chữ cái) luôn cách đúng 1 hover/tap ở popover
  công thức (mục 2b). Nếu người duyệt thấy chấm màu đơn độc vẫn gây khó chịu
  khi test thật, thay thế duy nhất khả thi là bỏ hẳn course badge khỏi
  `.menu-item`, dồn 100% vào popover (xem Câu hỏi mở #2 cuối mục).
- **Số điểm góc dưới-phải:** chip nhỏ, nền tối `rgba(20,16,10,.7)`, chữ
  `--text` — **không** `--gold` (số tham khảo, chưa phải "có thể hành động
  ngay", giữ nguyên lý do gốc của quyết định này).
- **Popover công thức (hover/tap):** dùng chung 1 component với `.order-row`
  — xem mục 2b bên dưới (trả lời asset ask "recipe popover styling" của UI).
- **`#menu-rail` (khung dải):** nền `--panel`, viền dưới 1px `--panel-border`
  — tái dùng đúng ngôn ngữ `#topbar`, không cần token mới.
- Menu item **tĩnh suốt ván** — không có trạng thái "đã nấu"/"hết nguyên
  liệu" ở MVP này (khớp lựa chọn "không báo hiệu" của `07-` Câu hỏi mở #8).

### 2. Order rows (bí mật, `07-` Rule 5-8, 15-17 — trong `#my-order`)

**Sửa:** bỏ hẳn hình dạng "giấy order xé mép + nghiêng -1.5deg + que xiên"
của bản trước. Lý do: `ui/menu-orders.md` đặt Order thành `.order-row` — các
hàng thẳng bên trong `#my-panel` (cùng khối với Tên/Điểm/Số bài/Món đã thu),
không phải 1 vật thể rời đặt tự do trên `#table-surface`. Giấy nghiêng + mép
xé là ngôn ngữ "vật thể vật lý đặt lên bàn", không khớp khi nó chỉ là 1 khối
trong danh sách dọc hẹp (`clamp(190–220px)`) — nghiêng tĩnh còn tràn chữ ở
cột hẹp đó (đúng lo ngại đã nêu ở Câu hỏi mở #5 bản trước, nay xác nhận: bỏ).

**Quyết định chất liệu:** không giữ tint giấy kem (`--ing-bg`) làm nền riêng
cho `.order-row` — 3 khối khác trong cùng `#my-panel` (Tên, Điểm, Số bài,
Món đã thu) đều dùng nền `--panel` tối nhất quán; đổi riêng khối Order sang
nền giấy sáng sẽ đọc như 1 lỗi bố cục hơn là "đây là Order của tôi." Tín hiệu
"của riêng tôi" giờ đến từ **vị trí** (chỉ nằm trong `#my-panel` của chính
người xem, không hiện ở pod đối thủ — đã là sự thật cấu trúc) và **nhãn "YOUR
ORDER"**, không cần giả lập vật liệu giấy nữa. Que xiên trang trí bỏ hẳn khỏi
asset list — không còn chỗ để đặt nó.

- **Header:** "YOUR ORDER" nhỏ, `--text-dim`, căn trái.
- **Phân cách khối:** đường kẻ mảnh `--panel-border` opacity `.4` phía trên
  và dưới khối Order — tái dùng đúng convention "Panel info người chơi mở
  rộng" đã có ở phần trên file này.
- **Số hàng:** `ORDER_SIZE` theo số người — **3 (2 người) / 4 (3 người) / 5
  (4 người)** (chốt mới, không còn cố định 3, không còn ràng buộc phủ đủ
  A/M/D). `#my-order` cần cao đủ cho tối đa **5 hàng** (ván 4 người) — cùng 1
  ngôn ngữ hàng, chỉ đổi số lượng lặp. Đây là input cho Câu hỏi mở #4 của
  `ui/menu-orders.md` (chiều cao dock ở 1024×700) — Art không quyết layout,
  chỉ nêu số hàng tối đa để `ui-designer`/`game-dev` tính lại nếu cần.
- **`.order-row` (40px / 36px @1024, theo `ui/menu-orders.md`):**
  - Dấu trạng thái đầu hàng: `○` chưa xong (`--text-dim`, ~10px) → `✓` đã
    xong (cùng màu vàng nhạt với viền hàng, xem dưới).
  - Tên món `--text`, điểm `+N` `--text-dim` — **không** `--gold` (điểm đã
    ghi nhận lúc reveal ở hand-fan; hàng Order chỉ nhắc lại con số, không
    phải nơi "sắp hành động").
  - `.order-chip` (nguyên liệu công thức, 14×14 / 12×12 theo `ui/`):
    thumbnail crop `Art/Card/*` — **tái dùng đúng crop 18×18** đã định ở mục
    2b (chỉ co nhỏ qua CSS, không cắt ảnh mới). Ở 12–14px, chữ course A/M/D
    **chắc chắn không đọc được** — nhưng `.order-chip` không cần mang nghĩa
    course: nó chỉ trả lời "có-trong-tay hay chưa", không phải "loại gì".
    Có-trong-tay: đủ màu + viền `--gold` 1px mảnh (tái dùng đúng ngữ nghĩa
    "useful" của thẻ trong tay — chip này là 1 bản đọc thu nhỏ của chính
    trạng thái đó, không phải nghĩa mới). Chưa-có: `opacity .45`, không viền.
  - **Viền hàng — "chưa xong":** `1px --panel-border` (trung tính, giống mọi
    viền chia nhóm khác trong panel — trả lời asset ask "unfinished
    `.order-row` border colour").
  - **Viền hàng — "đã xong" (chốt mới, thay dim+gạch ngang):** `1.5px`, màu
    **vàng nhạt `rgba(242,193,78,.5)`** (50% alpha của `--gold`) + 1 glow
    tĩnh rất nhẹ `box-shadow: 0 0 6px rgba(242,193,78,.25)`. Cố tình **yếu
    hơn rõ rệt** cả 2 mốc dùng `--gold` đặc 100%: (a) chip điểm `+N` trên
    food card, và (b) khoảnh khắc hoàn thành cả Order (viền `--gold` 3px 1
    lần + Shine, xem dưới) — 3 cấp vàng đọc được thứ bậc "1 món đã xong (50%
    alpha, tĩnh) < đang có thể hành động (100%, nhịp, ở nơi khác trong tay/
    Cook) < vừa ăn điểm lớn toàn Order (100%, viền dày, 1 lần)." Dấu `✓` đầu
    hàng dùng cùng `rgba(242,193,78,.5)`.
  - **Glow 1 nhịp lúc vừa chuyển xong** (`ui/` Interactions, 400ms): 1 lần
    `box-shadow 0 0 0 4px rgba(242,193,78,.35)` scale-out + fade, đúng
    khung thời gian UI đã định, sau đó hạ về viền tĩnh 50% alpha ở trên —
    không lặp lại.
  - **Không dùng** `filter: brightness(.7) saturate(.6)` (dim) hay
    `text-decoration: line-through` cho trạng thái này nữa — 2 công thức đó
    giữ nguyên vai trò cũ ở nơi khác trong file (locked-while-cooking).
- **Khoảnh khắc hoàn thành toàn bộ Order (`07-` Rule 10, `ORDER_BONUS`):**
  không đổi ý nghĩa, chỉ đổi nơi áp — vì không còn 1 "ticket" rời, hiệu ứng
  áp lên **khối `#my-order`** (không phải từng `.order-row`): viền `--gold`
  3px 1 lần (không lặp) quanh khối + 1 lượt "Shine quét" (đã định nghĩa ở
  Card spec) chạy qua toàn khối.

#### 2b. Popover công thức (dùng chung `.menu-item` + `.order-row`, trả lời asset ask của UI)

- Khung: nền `--panel`, viền 1px `--panel-border`, bo góc 8px, shadow
  `0 6px 10px rgba(0,0,0,.35)` (tái dùng đúng shadow hover thẻ đã có).
- Dòng tiêu đề: tên món `--text` đậm + chip course tròn Ø16px kèm chữ A/M/D
  (đủ chỗ ở popover — không bị giới hạn kích thước như `.menu-item`/
  `.order-chip`) + điểm `+N` `--text`.
- Danh sách nguyên liệu: mỗi loại 1 thumbnail **18×18** crop từ `Art/Card/*`
  (ảnh có sẵn, không cắt mới) xếp ngang, không viền phụ mặc định; **đang có
  trong tay** → viền `--gold` 1px mảnh (tái dùng đúng chữ legend "gold = in
  your hand now" đã có ở Recipes modal); **chưa có** → `opacity .5`, không
  viền.

### 3. "Nguyên liệu phục vụ Order của tôi" — highlight trên thẻ trong tay

Giữ nguyên toàn bộ spec bản trước (token `--order-need: #6a5cc4`, badge góc
trên-trái tĩnh, không viền/glow, hue tách xa mọi hex khác trong file) —
**đã duyệt, không đổi**. Xác nhận: dùng **song song, không thay thế**
`.order-chip` (mục 2) — `--order-need` trả lời "thẻ *trong tay* này phục vụ
Order" (đặt ở đúng thẻ nguyên liệu, khi kéo/chọn), `.order-chip` trả lời
"công thức *trong Order* này còn thiếu gì" (đặt ở đúng hàng Order) — 2 câu
hỏi khác nhau, 2 vị trí khác nhau, không tranh chấp thị giác.

```html
<svg viewBox="0 0 24 24" width="18%" fill="#6a5cc4" stroke="#6a5cc4"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 11 L11 3 L21 3 L21 13 L13 21 Z" fill="#6a5cc4"/>
  <circle cx="16" cy="8" r="1.6" fill="rgba(0,0,0,.4)" stroke="none"/>
</svg>
```

### 4. Màn kết thúc — reveal Order (`07-` Rule 13, 17)

**Sửa:** bỏ hẳn "mini Order ticket" (component giấy thu nhỏ) của bản trước —
`ui/menu-orders.md` (đã chốt) dùng đúng khuôn cột "Foods" có sẵn: mỗi món
trong Order hiện dưới dạng 1 thumbnail **32×32** (`Art/Food/*`, cùng size đã
dùng cho cột Foods, không cần asset mới) đè 1 icon trạng thái. Mục này định
nghĩa icon đó (trả lời asset ask "end-screen ✓/✕ icons" của UI):

| Trạng thái | Ảnh | Viền quanh ảnh | Icon góc dưới-phải | Vẽ bằng |
|---|---|---|---|---|
| Đã xong | nguyên màu | `1.5px rgba(242,193,78,.5)` — **cùng giá trị vàng nhạt với `.order-row` đã xong** (mục 2), giữ nhất quán "đã xong" xuyên suốt trong-ván và cuối-ván | ✓, nền tròn tối `rgba(0,0,0,.4)` Ø~18% ảnh, stroke `--text` | inline SVG line-art, không dùng emoji ✓ thật — nhất quán với mọi glyph khác trong file |
| Chưa xong | `filter: brightness(.7) saturate(.6)` — **tái dùng đúng công thức dim** của locked-while-cooking, không bịa `grayscale(60%)` mới | `1px --panel-border` (trung tính, giống `.order-row` chưa xong) | ✕, nền tròn tối như trên, stroke `--text-dim` (**không** `--invalid` — chưa xong không phải lỗi thao tác) | inline SVG line-art, cùng bộ vẽ tay với ✓ |

```html
<svg viewBox="0 0 24 24" width="18%" fill="none" stroke="#f0e6d8"
     stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.4)" stroke="none"/>
  <path d="M6 12 L10 16 L18 7"/>
</svg>
<!-- ✕ chưa xong: đổi stroke sang #a89a86 (--text-dim), path "M7 7 L17 17 M17 7 L7 17" -->
```

- Hàng người thắng (`#endModal` đã có viền `--gold` quanh hàng) — viền đó lan
  sang khối Order-thumbnails của họ, không cần viền riêng thêm (không đổi).
- Người chưa xong Order khi ván kết thúc: hiện nguyên trạng dở dang (vài ✓,
  vài ✕ trên cùng hàng) — không có "trạng thái thất bại" gộp riêng, đúng tinh
  thần `04-`/`07-` "không ai bị phạt vì chưa xong Order" (không đổi).

### 5. Token mới & Asset list

| Token | Giá trị | Vai trò | Không dùng cho |
|---|---|---|---|
| `--order-need` | `#6a5cc4` | badge góc nhỏ trên thẻ nguyên liệu **của chính mình**, báo "thẻ này phục vụ 1 món trong Order của tôi" | viền/outline thẻ, food card, Menu item, thẻ của người khác, mọi hiệu ứng nhịp/rung |

Không cần token mới cho: viền `.order-row`/end-screen-thumbnail "chưa xong"
(`--panel-border`), "đã xong" (vàng nhạt = `rgba(242,193,78,.5)`, công thức
alpha trên `--gold` có sẵn, không phải token riêng), nền Menu rail/popover
(`--panel`, `--panel-border`), khoảnh khắc hoàn thành Order (`--gold` + Shine
quét có sẵn), dim "chưa xong" cuối ván (công thức dim có sẵn).

**Asset list — không có raster mới; sửa lỗi đếm ảnh:**

| Asset | Loại | Nguồn | Ghi chú |
|---|---|---|---|
| `.menu-item` ảnh 40×40 | CSS + `Art/Food/*` | có sẵn (20/20 món) | `object-fit: cover`, không cắt mới |
| Popover công thức | CSS + `Art/Card/*` crop 18×18 | có sẵn (**27** ảnh nguyên liệu trong `public/art/Card`, sửa lỗi đếm 26 của bản trước) | dùng chung cho `.menu-item` và `.order-row` |
| `.order-chip` | CSS, tái dùng crop 18×18 ở trên (co nhỏ qua CSS) | có sẵn | không cắt ảnh riêng cho size 14×14/12×12 |
| End-screen Order thumbnail | CSS + `Art/Food/*` 32×32 | có sẵn (cùng size cột Foods) | không raster mới |
| Icon ✓/✕ (end-screen) | inline SVG line-art | mới vẽ, 1 cặp glyph nhỏ ở mục 4 | corner badge, tĩnh, không emoji thật |
| Badge `order-need` | inline SVG line-art | mới vẽ (giữ nguyên bản trước) | badge góc, tĩnh |
| ~~Que xiên (spike)~~ | — | **bỏ** | Order không còn là vật thể rời, không còn chỗ đặt prop này |
| ~~Mini Order ticket~~ | — | **bỏ**, thay bằng End-screen Order thumbnail ở mục 4 | — |

Không có prompt tạo ảnh AI cho pass này — mọi thứ vẫn CSS/SVG/ảnh có sẵn.

### Câu hỏi mở còn lại cho người duyệt (không chặn `/build`)

1. Số điểm trên `.menu-item`/popover dùng `--text` (trung tính) thay vì
   `--gold`, theo đúng luật "gold = đang có thể hành động" — vẫn cần người
   duyệt xác nhận không bị đọc nhầm là "món này không đáng giá" (giữ nguyên
   câu hỏi này từ bản trước, chưa có quyết định mới).
2. Course badge trên `.menu-item` bỏ chữ cái A/M/D (chỉ còn chấm màu, xem
   mục 1) — ngoại lệ mới với luật "course color luôn kèm chữ cái." Cần người
   duyệt xác nhận chấp nhận được, hay ưu tiên bỏ hẳn course badge khỏi
   `.menu-item` (dồn 100% vào popover) thay vì giữ 1 chấm màu đơn độc.
