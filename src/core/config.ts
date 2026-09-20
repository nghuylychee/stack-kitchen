// =====================================================================================
//  CẤU HÌNH GAME — chỉnh tự do các số dưới đây rồi tải lại trang (npm run dev tự reload).
//  Mỗi số ghi: ý nghĩa · khoảng hợp lý (Range) · doc nguồn trong design/.
//  Nếu chỉnh sai (vd Order dài hơn Menu), game KHÔNG bắt đầu ván và báo lỗi rõ trong console.
//  Khi một số đã chơi thử và thấy ổn, nhớ cập nhật bảng Numbers của doc tương ứng.
//  File này không import gì — chỉ là số.
// =====================================================================================

// ---- Tay bài ------------------------------------------------------------------------

/** Số thẻ mỗi người được chia đầu ván, và cuối mỗi lượt tự bốc bù về đúng số này.
 *  Range 5–11 · design/08-hand-refill.md */
export const HAND_SIZE = 7;

// ---- Menu & Order (theo số người chơi: 2 / 3 / 4) -------------------------------------

/** Số món trong Menu công khai của mỗi ván, rút ngẫu nhiên từ 20 món gốc.
 *  Phải ≤ 20 và ≥ ORDER_SIZE cùng số người. Range 5–12 · design/07-menu-orders.md */
export const MENU_SIZE: Record<number, number> = { 2: 6, 3: 8, 4: 10 };

/** Số món trong Order bí mật của mỗi người (mục tiêu phải nấu xong để kết thúc ván).
 *  Phải ≤ MENU_SIZE cùng số người. Range 2–6 · design/07-menu-orders.md */
export const ORDER_SIZE: Record<number, number> = { 2: 3, 3: 4, 4: 5 };

// ---- Bộ bài --------------------------------------------------------------------------

/** Số bản của mỗi loại nguyên liệu trong bộ bài (chỉ các loại có trong Menu ván đó).
 *  Tăng → pool dày hơn, ván dài hơn. Range 4–8 · design/07-menu-orders.md */
export const COPIES_PER_TYPE_MENU = 6;

// ---- Điểm ----------------------------------------------------------------------------

/** Điểm món theo số thẻ trong công thức: món 2 thẻ / 3 thẻ / 4 thẻ.
 *  Phải có đủ cả 3 cỡ 2, 3, 4 (20 món gốc dùng đủ 3 cỡ). design/04-food-score-end.md */
export const POINTS_BY_SIZE: Record<number, number> = { 2: 2, 3: 4, 4: 7 };

/** Điểm thưởng cho người đầu tiên nấu xong hết Order (ván dừng ngay).
 *  Range 5–20 · design/07-menu-orders.md */
export const ORDER_BONUS = 10;

// ---- Thời gian (chỉ phòng online; Play vs Bots không giới hạn) ------------------------

/** Thời gian chờ mỗi người quyết định tố hay Pass, tính bằng mili-giây (8000 = 8 giây).
 *  design/06-online-room.md */
export const CLAIM_WINDOW_MS = 10000;

/** Thời gian tối đa cho mỗi bước trong lượt (bốc / đánh), mili-giây (30000 = 30 giây).
 *  Hết giờ → bot đánh thay bước đó. design/06-online-room.md */
export const TURN_LIMIT_MS = 30000;
