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

// ---- Quán của người chơi (meta — KHÔNG ảnh hưởng ván bài) -----------------------------

/** Level và gold lúc mới mở game lần đầu (hoặc khi save hỏng phải dựng lại quán).
 *  Range gold 0–200 · design/12-restaurant-meta.md */
export const START_LEVEL = 1;
export const START_GOLD = 0;

/** Lưới đặt đồ trong quán: số cột, số hàng, và cạnh nhỏ nhất / lớn nhất của một ô (px).
 *  Ô không nhỏ hơn CELL_MIN_PX (sàn tap target — màn hẹp thì lưới cuộn) và không lớn hơn
 *  CELL_MAX_PX (chặn card phình to trên màn rộng). Ít cột/hàng hơn = ô to hơn = card to hơn.
 *  Range cột 12–28 · hàng 8–18 · ô 44–96 · design/13-restaurant-grid.md */
export const GRID_COLS = 22;
export const GRID_ROWS = 14;
export const CELL_MIN_PX = 44;
export const CELL_MAX_PX = 64;

// ---- Thưởng sau ván: gold, XP, level (design/14-gold-xp-level.md) --------------------
//  Thưởng KHÔNG ảnh hưởng ván bài — chỉ cộng vào quán (12- Rule 6). Cùng một công thức
//  cho Play vs Bots lẫn phòng online, không phân biệt chế độ.

/** Gold: thưởng nền mỗi ván + gold cho mỗi điểm ghi được.
 *  Range nền 0–50 · mỗi điểm 1–5 */
export const GOLD_BASE = 20;
export const GOLD_PER_POINT = 2;
/** Gold thêm khi điểm cao nhất bàn (hoà nhất vẫn tính là thắng). Range 0–60 */
export const GOLD_WIN = 30;
/** Gold thêm cho người xong Order trước — trả riêng với GOLD_WIN vì hai chuyện khác nhau. Range 0–40 */
export const GOLD_FINISH = 20;
/** Trần gold mỗi ván, chặn ván dị thường. Range 100–400 */
export const GOLD_MATCH_MAX = 200;

/** XP: thưởng nền + mỗi điểm + thưởng thắng, và trần mỗi ván. */
export const XP_BASE = 10;
export const XP_PER_POINT = 1;
export const XP_WIN = 15;
export const XP_MATCH_MAX = 100;

/** Đường cong level: cần XP_L0 + XP_STEP × (level − 1) XP để lên level kế tiếp.
 *  XP_L0 nhỏ = lên level đầu nhanh; XP_STEP lớn = càng về sau càng chậm.
 *  Range L0 50–300 · STEP 0–150 */
export const XP_L0 = 100;
export const XP_STEP = 60;

// ---- Shop (design/15-shop-unlocks.md) -----------------------------------------------
//  Giá tính theo ván điển hình ~120 gold (14-): 80 ≈ 1 ván, 150 ≈ 1–2 ván, 400 ≈ 4 ván.
//  Món nào cần level bao nhiêu mới mua được thì ghi ở SHOP_MIN_LEVEL (1 = mở ngay từ đầu).
//  Thêm món mới: khai báo ở src/meta/items.ts rồi thêm id vào 2 bảng dưới + SHOP_ORDER.

/** Giá gold từng món. Range 40–800 */
export const SHOP_PRICE: Record<string, number> = {
  plant_pot: 80,
  table_basic: 150,
  kitchen_extra: 400,
};

/** Level tối thiểu để mua. Range 1–10 */
export const SHOP_MIN_LEVEL: Record<string, number> = {
  plant_pot: 1,
  table_basic: 1,
  kitchen_extra: 3,
};

// ---- Menu quán (design/17-restaurant-menu.md) ---------------------------------------
//  Món trong quán KHÁC Menu của ván bài (07-menu-orders.md) — hai thứ không dính nhau.
//  Món chỉ mở khoá khi người chơi đã nấu nó trong một ván (17- Rule 2).

/** Số món treo được cùng lúc trong quán. Range 1–8 */
export const MENU_SLOTS = 3;

/** Món có sẵn lúc mới mở quán — tên phải khớp đúng `dish` trong RECIPES (src/core/data.ts).
 *  Hai món 2 nguyên liệu = nấu nhanh nhất, để quán mới bán được hàng ngay. */
export const START_DISHES = ['Phở Bò', 'Xôi Gấc'];

// ---- Khách trong quán (design/16-customers-idle.md) ---------------------------------
//  Khách KHÔNG đụng ván bài (12- Rule 6) — chỉ chạy trên màn quán và cộng gold/XP vào save.
//  Số bàn = số khách cùng lúc; số bếp = số món nấu song song. Mua lệch một bên thì khách chờ
//  quá CUS_PATIENCE_MS rồi bỏ đi tay không.

/** Nhịp nhảy từng ô kiểu Stacklands: thời gian một bước (ms), độ nhấc (× cạnh ô), độ nghiêng (deg).
 *  Range 150–500 · 0.1–0.6 · 0–15 */
export const HOP_MS = 260;
export const HOP_LIFT = 0.35;
export const HOP_TILT = 7;

/** Bao lâu một khách mới vào (nếu còn bàn trống), và các chặng của một lượt phục vụ (ms).
 *  COOK_PER_CARD_MS nhân với số nguyên liệu của món — món to nấu lâu hơn và trả nhiều hơn.
 *  Range 2000–20000 · 300–3000 · 800–6000 · 800–6000 · 8000–60000 */
export const CUS_SPAWN_MS = 5000;
export const CUS_ORDER_MS = 900;
export const COOK_PER_CARD_MS = 2500;
export const CUS_EAT_MS = 2600;
export const CUS_PATIENCE_MS = 22000;

/** Tiền và XP một khách trả: nền + theo điểm của món (điểm lấy từ POINTS_BY_SIZE).
 *  Gold còn nhân thêm `tip` của loại khách. Range nền 0–20 · mỗi điểm 1–8 */
export const CUS_GOLD_BASE = 2;
export const CUS_GOLD_PER_PT = 1;
export const CUS_XP_BASE = 1;
export const CUS_XP_PER_PT = 1;

/** Các loại khách. `tip` nhân vào gold, `weight` là tỉ lệ xuất hiện (càng lớn càng hay gặp),
 *  `art` là tên file trong public/art/Customer/. Thêm loại mới = thêm một dòng. */
export const CUS_TYPES = [
  { id: 'local',   name: 'Local',   tip: 1.0, weight: 5, art: 'Local' },
  { id: 'student', name: 'Student', tip: 0.7, weight: 3, art: 'Student' },
  { id: 'tourist', name: 'Tourist', tip: 1.6, weight: 2, art: 'Tourist' },
];

/** Thu nhập lúc KHÔNG mở màn quán (đang chơi ván, đóng tab…): cứ IDLE_CYCLE_MS được một lượt
 *  khách mỗi bàn, ăn IDLE_RATE phần tiền, cộng dồn tối đa IDLE_CAP_H giờ.
 *  Range 60000–900000 · 0–1 · 1–24 */
export const IDLE_CYCLE_MS = 300000;
export const IDLE_RATE = 0.5;
export const IDLE_CAP_H = 8;

/** Nhịp chạm `lastSeen` lúc đang xem quán (để thời gian ngồi xem không bị tính thành vắng mặt),
 *  và nhịp chạy vòng đời khách. Range 2000–60000 · 60–500 */
export const IDLE_TOUCH_MS = 10000;
export const TICK_MS = 120;
