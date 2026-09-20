# 12 — Restaurant Meta (quán của người chơi thay cho main menu)

**Status:** BUILT (2026-09-20, backlog #24)
**Attaches to:** màn `Home` của `main.ts` — thay hẳn bằng màn quán. `Lobby`, `Table` và toàn bộ
`core/`, `net/` không đổi một dòng.

> Quyết định trong phiên chat (2026-09-20, không phải playtest note): main menu biến thành một
> progress loop — quán ăn Việt của người chơi. 8 quyết định kiến trúc đã chốt với người duyệt:
> meta **thuần cosmetic** · lưu **localStorage** · idle **có trần** · gold/XP từ **cả ván lẫn khách** ·
> lưới **kéo thả tự do** · người chơi **tự chọn menu quán** · **vài loại khách cố định** · playtest đầu
> tiên sau khi có vỏ + gold từ ván + shop tối thiểu. Doc này là **khung**: state, lưu trữ, ranh giới.
> Lưới ở `13-`, kinh tế ở `14-`, shop ở `15-`; khách và menu quán là đợt 2 (`16-`, `17-`, chưa viết).

## Overview

Mở game ra không còn là một bảng nút bấm nữa mà là **quán của mình**: một mặt bằng có bàn ghế và
bếp, một thanh thông tin ghi tên - level - gold, và vài tấm card để đi tới nơi khác (đánh với bot,
mở phòng online, vào shop). Quán này là của riêng người chơi, nằm hoàn toàn ngoài ván bài: nó
không cho thêm thẻ, không đổi luật, không ai trong phòng online nhìn thấy nó.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: có một chỗ "của mình" để quay lại — đánh vài ván, thấy gold tăng, mua thêm cái bàn,
  quán khác đi một chút. Lý do mở game ngày mai không chỉ là "đánh thêm ván nữa".
- Intended: người mới mở game lần đầu vẫn hiểu ngay phải bấm đâu để chơi — 3 tấm card điều hướng
  nằm ngay trên màn, quán không được che mất đường vào ván bài.
- Degenerate: cày gold thay vì chơi cho vui. Chặn tận gốc bằng Rule 6 — gold không mua được bất kỳ
  lợi thế nào trong ván, nên cày nhiều chỉ đổi lấy cái quán đẹp hơn, không đổi lấy sức mạnh.
- Degenerate: quán trở thành màn chờ vô nghĩa vì đợt 1 chưa có khách. Chấp nhận có chủ đích: đợt 1
  chỉ để xem bố cục và cảm giác sở hữu có đúng ý không, trước khi đổ công vào hệ khách (`16-`).
- Online: không có dynamic nào — đối thủ không thấy và không chịu ảnh hưởng gì từ quán.

**Aesthetics**

| | |
|---|---|
| **Primary** | fantasy |
| **Secondary** | expression |
| **Serves the core by** | dựng bối cảnh cho đúng thứ người chơi đang làm trong ván bài (nấu món Việt) — ván bài là cái bếp, quán là lý do nấu. Không cạnh tranh với **challenge** của ván vì nó không có thử thách nào để thắng |

## Rules

1. **Màn `Restaurant` thay `Home`.** Vào game là thấy quán. `Lobby` và `Table` giữ nguyên; nút
   `Home` ở HUD bàn chơi giờ quay về quán (`ui/table.md` cập nhật lúc build).
2. **State lưu** (một object duy nhất, `src/meta/save.ts`):
   `{ v, name, level, xp, gold, items: [{ id, type, x, y }], lastSeen }` — `v` là số hiệu schema,
   `xp` là XP trong level hiện tại, `items` là đồ đã sở hữu **và** vị trí ô của nó (`13-`).
3. **Quán khởi điểm** (save chưa có): level `START_LEVEL`, `START_GOLD` gold, 1 `table_basic` +
   1 `kitchen_basic` đặt sẵn giữa lưới, `name` rỗng (HUD nhắc đặt tên).
4. **Lưu:** ghi thẳng `localStorage[SAVE_KEY]` mỗi lần state đổi (mua đồ, đặt đồ, nhận thưởng, đổi
   tên) và khi rời màn. Không có nút Save.
5. **Nạp:** đọc lúc khởi động. Thiếu / hỏng / `v` lạ → dựng quán khởi điểm và ghi 1 dòng vào
   console, **không** crash và **không** chặn người chơi vào ván.
6. **Ranh giới — bất di bất dịch:** không một byte dữ liệu meta nào đi vào `core/match.ts`,
   `core/types.ts` (`View`/`HostEvent`/`Intent`), `ai/bot.ts` hay `net/room.ts`. Ván bài không biết
   quán tồn tại. `src/meta/**` được phép `import` từ `core/data` (tên món, ảnh) nhưng **không** có
   chiều ngược lại.
7. **Tên người chơi:** `save.name` là nguồn duy nhất — dùng luôn cho ghế trong ván (thay ô nhập tên
   ở Home cũ). Sửa tên ngay trên HUD; tên rỗng thì ván dùng tên mặc định như hiện tại.
8. **Online:** đối thủ không bao giờ thấy quán, level hay gold của mình. Không thêm message nào vào
   giao thức phòng, **không** bump `PREFIX`.
9. **`lastSeen`** (epoch ms) cập nhật mỗi lần lưu. Đợt 1 chỉ ghi, chưa ai đọc — `16-customers-idle.md`
   (đợt 2) sẽ dùng nó để tính thu nhập lúc vắng mặt.
10. **Link mời phòng:** URL có `?room=CODE` vẫn vào thẳng lobby như hiện tại, không dừng ở quán —
    quán vẫn nạp ngầm để lấy `name`.
11. Đợt 1 quán **tĩnh**: không có gì chạy theo thời gian thực, không có khách, không có animation nền.

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `SAVE_KEY` | `"sk.save"` | — | GUESS | một key duy nhất, đổi tên key = mất save nên coi như cố định |
| `SAVE_VERSION` | 1 | — | GUESS | tăng khi shape đổi; `v` cũ mà không có đường migrate → quán khởi điểm |
| `START_LEVEL` | 1 | — | GUESS | |
| `START_GOLD` | 0 | 0–200 | GUESS | bắt đầu tay trắng để ván đầu tiên có ý nghĩa; nếu playtest thấy chờ lâu mới mua được gì thì nâng |
| Đồ khởi điểm | `table_basic` ×1, `kitchen_basic` ×1 | — | GUESS | đúng mô tả "nhà hàng trống, chỉ có 1 bộ bàn ghế + 1 bếp" |

## Edge cases

- **localStorage bị chặn** (private mode, chặn site data): mọi thao tác vẫn chạy trong phiên, hiện
  **1** dòng cảnh báo trên HUD ("Progress can't be saved in this browser"), không hỏi lại nữa, và
  tuyệt đối không chặn đường vào ván bài.
- **Mở 2 tab cùng lúc:** tab nào lưu sau thắng (last write wins). Không đồng bộ giữa tab, không khoá —
  ghi rõ là giới hạn đã biết, không phải bug.
- **Save của bản mới mở bằng bản cũ** (người chơi mở link Pages cũ): `v` lớn hơn `SAVE_VERSION` →
  không cố đọc, dựng quán khởi điểm trong phiên đó và **không ghi đè** save cũ.
- **Người chơi tự sửa localStorage:** chấp nhận được — meta chỉ ảnh hưởng chính họ (Rule 6), không
  có bảng xếp hạng, không ai bị thiệt.
- **Đổi máy / xoá cache:** mất tiến trình. Giới hạn đã chốt khi chọn localStorage; nếu sau này thấy
  đau thì mở ticket riêng cho mã export/import.
- **Vào ván rồi thoát giữa chừng:** quán không đổi gì (thưởng chỉ tính khi có `end`, `14-` Rule 5).

## Depends on

- `13-restaurant-grid.md` — ý nghĩa của `x`/`y` trong `items`.
- `14-gold-xp-level.md` — ai ghi vào `gold`/`xp`/`level`.
- `15-shop-unlocks.md` — ai ghi vào `items`.
- `design/ui/restaurant.md` — màn hình dựng từ state này.
- `06-online-room.md` — xác nhận không có message mới, không bump `PREFIX`.

## Done when

- Mở game lần đầu: thấy quán có đúng 1 bàn + 1 bếp, HUD ghi Level 1 / 0 gold, 3 card điều hướng chạy đúng.
- Đặt tên ở HUD → vào ván (bots và online) thấy đúng tên đó ở ghế mình.
- F5: đồ đạc, vị trí, gold, level, tên giữ nguyên.
- Xoá `localStorage["sk.save"]` rồi F5 → quán khởi điểm, không lỗi console.
- Mở link `?room=CODE` → vào thẳng lobby, không kẹt ở quán.
- Đọc code: `grep` không thấy `meta/` được import trong `core/`, `ai/`, `net/`.
