<!-- Raw human notes. Written by /playtest. One dated section per session,
     appended, never overwritten or rewritten into design language.
     No AI verdict ever goes in this file — the person who played decides. -->

# Playtest — Stack Kitchen

> Các phiên 2026-09-16 (1)–(4) được ghi khi game còn là slot `007-kitchen-mahjong` trong
> incubator, chơi trên prototype 1 file. Giữ nguyên, không sửa.

## 2026-09-16

Oke tôi thấy hiện tại ổn về gameplay logic cho bản MVP. Tôi cần Artist + UI Designer tham gia vào để chúng ta rework lại phần visual.

**Next status:** KEEP GOING → BUILDING

## 2026-09-16 (2)

hiện tại cảm giác chơi rất ổn đó nhưng tôi muốn đơn giản hóa 1 số thông tin UI, tôi sẽ mô tả chi tiết

Oke chúng ta sẽ

* Bỏ button Speed:, Show AI Hands, Pool, Claim, Discard
* Trong phần UI hiển thị info các người chơi khác:  bỏ phần đếm số Food: 1, bỏ phần x10 nằm trơ trọi đơn lẻ bên phải vì bị duplicate thông tin
* Ở phần bàn chơi ở giữa, bỏ phần ghi thứ tự Clockwise:...
* Bỏ phần text Cook food lands here
* Bỏ phần khu vực Drop Card Here để cook, thay vào đó đổi behaviour lại thành dạng stack trên chính hand đang cầm (thao tác kéo bài trong hand stack lên nhau). Sau đó có thể mở rộng thêm ô info của player ở góc trái dưới ra

Với các yêu cầu này hãy phân chia cho đúng assignee thực hiện

**Next status:** KEEP GOING — giữ nhãn Pool dưới chồng bài giữa bàn, chỉ bỏ bộ đếm ở HUD (người test chọn)

## 2026-09-16 (3)

phần logic ổn rồi nhưng tôi muốn sửa lại visual chút xíu

* Hand dời xích qua bên trái xíu cho nằm giữa bàn á. Với lại lúc đánh ra xong lúc nào cũng phải căn hand sao cho ở giữa bàn chơi
* Đổi tên KitchenMahjong thành Stack Kitchen
* Phần stack thẻ để cook tôi nghĩ cũng nên đặt ở khu vực giữa bàn (tính theo chiều ngang), với lại stack cũng phải theo dạng hình cong nằm ngang thay vì stack dọc sẽ oke hơn (giống dạng xòe quạt á). Diễn thêm anim lúc nấu xong kiểu đóng quạt lại rồi biến ra thành card food

**Next status:** KEEP GOING

## 2026-09-16 (4)

cảm giác chơi ổn rồi, giờ tôi muốn test bằng cách deploy lên repo để gửi link cho bạn bè test chung

**Next status:** KEEP GOING → BUILDING (deploy để bạn bè test chung)
