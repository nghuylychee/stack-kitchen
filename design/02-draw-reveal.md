# 02 — Draw & Reveal

**Status:** BUILT (2026-09-16 (5))
**Attaches to:** bước 1 (Draw) và bước 2 (Check) trong lượt của `00-core.md`

## Overview

Đầu lượt bạn bốc 1 thẻ. Sau đó xem tay: món nào đã đủ nguyên liệu thì bạn **có
thể** lật ngửa (reveal) để ghi điểm ngay — hoặc giữ lại chờ ráp món to hơn.

## MDA

**Mechanics** — xem Rules.

**Dynamics**

- Intended: cân nhắc "chim trong tay" — reveal Pho Bo 2 điểm bây giờ hay giữ
  Rice Noodle + Beef chờ Chili/Lemongrass thành Bun Bo Hue 7 điểm.
- Intended: reveal cũng là **lộ thông tin** — đối thủ thấy bạn đã có loại nào.
- Chưa rõ (sửa (3)): stack đặt ngửa trên bàn → nếu sau này có người thật khác cùng bàn, đó là lộ thông
  tin trước khi nấu. MVP chỉ đấu bot (bot không nhìn stack của người thật) nên chưa ảnh hưởng — theo dõi.
- Degenerate: reveal mọi thứ ngay lập tức. Không chặn bằng luật; chặn bằng
  bảng điểm (`04-`) làm món to đáng giá hơn hẳn.

**Aesthetics**

| | |
|---|---|
| **Primary** | challenge |
| **Secondary** | none |
| **Serves the core by** | đây chính là quyết định "giữ hay chốt" mà riskiest assumption đang test |

## Rules

1. **Draw:** đầu lượt, người chơi bốc thẻ trên cùng của pool vào tay. Bắt buộc, không được bỏ qua.
   Nếu pool rỗng → ván kết thúc ngay (`04-`), không có lượt này.
2. **Check:** sau khi bốc, game tính mọi món ráp được từ tay hiện tại: món `R`
   ráp được khi tay có ít nhất 1 thẻ của **mỗi** loại trong công thức `R`.
   (Không chỉ món có thẻ vừa bốc — món đã đủ sẵn từ trước cũng tính.)
3. Người chơi được reveal **0, 1 hoặc nhiều** món, mỗi lần 1 món, theo thứ tự tuỳ chọn.
   Sau mỗi lần reveal, danh sách món ráp được tính lại từ tay còn lại.
4. Reveal món `R`: lấy đúng 1 thẻ mỗi loại trong `R` ra khỏi tay → đặt ngửa
   trước mặt người chơi thành 1 món, cộng điểm của `R`, ghi nhận loại của `R` (`04-`).
5. Công thức là **tập loại, không thứ tự**. Món có công thức là tập con của món khác
   (Pho Bo ⊂ Bun Bo Hue) đều ráp được riêng — người chơi chọn.
6. Được reveal cùng 1 món nhiều lần trong ván (nếu đủ thẻ), mỗi lần đều ghi điểm.
7. Sau mỗi reveal kiểm tra điều kiện kết thúc (`04-`). Nếu hết ván → dừng ngay, không Play.
8. Bước Check kết thúc khi người chơi chọn đánh 1 thẻ (sang `03-`). Nếu tay rỗng
   sau khi reveal → bỏ qua Play, sang lượt người kế tiếp.

### Thao tác reveal bằng stack trên mặt bàn (sửa 2026-09-16 (3), thay stack trong tay; sửa (5): 1 vùng nấu nhỏ, 1 stack)

9. Người thật reveal bằng cách **kéo 1 thẻ từ tay thả vào vùng nấu** — 1 ô nhỏ nằm giữa bàn theo chiều
   ngang, ngay dưới chồng bài giữa. Vùng trống → mở stack (1 thẻ); đã có stack → thẻ nhập vào stack đó
   (thả vào bất kỳ chỗ nào trong vùng). Thả ra ngoài vùng nấu trên bàn → thẻ bật về tay. Quạt bài trong tay
   chỉ còn thẻ lẻ. (sửa 2026-09-16 (5): thay "cả mặt bàn trống là chỗ xếp")
10. Nhập hợp lệ khi tập loại của stack **sau khi thêm** vẫn là tập con của ít nhất 1 công thức và không
    trùng loại; sai → thẻ bật về chỗ cũ. Thả thẻ lên 1 thẻ khác **trong tay** không làm gì (không còn
    stack trong tay).
11. Khi tập loại của stack **khớp đúng** 1 công thức, hiện nút **Cook <món> +N** gắn với stack đó. Nấu
    **không tự chạy** — vì Pho Bo ⊂ Bun Bo Hue, tự chạy sẽ cướp mất quyết định giữ bài. Người chơi có thể
    thêm thẻ vào stack trước khi bấm Cook.
12. Bấm Cook → stack khoá, thanh progress chạy `COOK_MS` **ngay trên stack** → thẻ nguyên liệu biến mất,
    1 **thẻ món** xuất hiện tại đúng chỗ đó trên bàn. Người chơi kéo/tap thẻ món vào **ô info của mình
    (góc trái dưới)** → đây là lúc **reveal chính thức** (Rule 4: cộng điểm, kiểm tra kết thúc). Còn thẻ
    món chưa thu thì chưa Play được.
13. Kéo 1 thẻ (chưa khoá nấu) từ stack trên bàn thả về quạt bài, **hoặc tap** thẻ đó → thẻ về lại tay.
14. Trên bàn chỉ có **đúng 1 stack** tại 1 thời điểm (sửa 2026-09-16 (5), trước là nhiều stack) — vì mỗi
    lúc chỉ nấu 1 món. Muốn đổi hướng thì rút thẻ về tay (Rule 13). Còn thẻ món chưa thu thì vùng nấu không
    nhận thẻ mới. Stack tồn tại xuyên lượt; thẻ trên stack vẫn tính là thẻ trong tay (số thẻ, luật Play/tố
    không đổi).
15. Bot không đổi: bot hiển thị chuỗi gom thẻ thành stack nhỏ → progress Cook → thẻ món → bay vào khu món
    ngay tại ghế của bot. Luật quyết định của bot (`05-`) không đổi.

## Numbers

| Value | Default | Range | VALIDATED / GUESS | Why |
|---|---|---|---|---|
| `COOK_MS` | 1200 ms | 600–3000 | GUESS | 006 dùng 3s cho game nấu; đây là card game theo lượt, cần nhanh hơn |

Điểm món nằm ở `04-food-score-end.md`.

## Edge cases

- Tay có 2 Pork và công thức chỉ cần 1 → chỉ lấy 1, bản còn lại giữ trên tay.
- 2 món ráp được dùng chung 1 thẻ (Banh Mi và Cha Gio đều cần Pork + Herb) → reveal món này xong, món kia có thể không còn ráp được. Danh sách tính lại (Rule 3).
- Tay đầu ván có món đủ sẵn: chỉ được reveal khi tới lượt mình, sau Draw.

## Depends on

- `01-card-pool-deal.md` — pool để bốc.
- `04-food-score-end.md` — công thức, điểm, loại, kết thúc ván.

## Done when

- Tới lượt: bấm Draw → tay +1 thẻ, pool −1.
- Mọi món ráp được hiện thành nút "Reveal <món> +N"; bấm → thẻ rời tay, món
  ngửa trước mặt, điểm tăng đúng; danh sách nút cập nhật lại.
- Không reveal gì vẫn đánh thẻ được bình thường.
- Kéo Rice Noodle ra mặt bàn, kéo Beef lên nó → hiện Cook Pho Bo nhưng không tự nấu; thêm Chili +
  Lemongrass vào stack → nút đổi thành Bun Bo Hue +7.
- Cook → progress chạy trên stack → thẻ món xuất hiện đúng chỗ đó trên bàn → kéo/tap vào ô info góc
  trái dưới → điểm tăng. (sửa 2026-09-16 (3))
