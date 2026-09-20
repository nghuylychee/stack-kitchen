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
export const MENU_SIZE: Record<number, number> = { 2: 4, 3: 6, 4: 8 };

/** Số món trong Order bí mật của mỗi người (mục tiêu phải nấu xong để kết thúc ván).
 *  Phải ≤ MENU_SIZE cùng số người. Range 2–6 · design/07-menu-orders.md */
export const ORDER_SIZE: Record<number, number> = { 2: 2, 3: 3, 4: 4 };

// ---- Bộ bài --------------------------------------------------------------------------

/** Số bản của mỗi loại nguyên liệu trong bộ bài (chỉ các loại có trong Menu ván đó).
 *  Tăng → pool dày hơn, ván dài hơn. Range 4–8 · design/07-menu-orders.md */
export const COPIES_PER_TYPE_MENU = 6;

// ---- Điểm ----------------------------------------------------------------------------

/** Điểm món theo số thẻ trong công thức: món 2 thẻ / 3 thẻ / 4 thẻ.
 *  Phải có đủ cả 3 cỡ 2, 3, 4 (20 món gốc dùng đủ 3 cỡ). design/04-food-score-end.md */
export const POINTS_BY_SIZE: Record<number, number> = { 2: 2, 3: 3, 4: 5 };

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

/** Mặt bằng quán: số cột × số hàng. Rộng hơn màn hình nhiều lần — người chơi kéo/zoom để đi quanh
 *  (design/13-restaurant-grid.md Rule 14–17). Muốn quán to hơn thì tăng hai số này, không cần sửa code.
 *  Range cột 22–120 · hàng 14–80 */
export const GRID_COLS = 100;
export const GRID_ROWS = 50;

/** Cạnh một ô ở zoom 1 (px). Card facility 2×3 = 112×168, xấp xỉ thẻ bài trên tay. Range 40–80 */
export const CELL_PX = 56;

/** Giới hạn zoom: ô không bao giờ nhỏ hơn CELL_MIN_PX (sàn tap target) và không phóng quá ZOOM_MAX.
 *  Thu hết cỡ thì lưới vẫn luôn phủ kín màn, nên không bao giờ nhìn thấy mép lưới.
 *  ZOOM_WHEEL_STEP là hệ số nhân cho mỗi đơn vị deltaY của con lăn.
 *  Range 44+ · 1–4 · 0.0005–0.005 */
export const CELL_MIN_PX = 30;
export const ZOOM_MAX = 1.8;
export const ZOOM_WHEEL_STEP = 0.0015;

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
//  Số bàn = số khách cùng lúc; nấu song song được min(số bếp, số nhân viên) món (xem STAFF_START).
//  Mua lệch một cạnh thì khách chờ quá CUS_PATIENCE_MS rồi bỏ đi tay không.

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
export const CUS_PATIENCE_MS = 22000;   // 18- Rule 9: chỉ đếm khi CHƯA có nhân viên nhận order

/** Tiền và XP một khách trả: nền + theo điểm của món (điểm lấy từ POINTS_BY_SIZE).
 *  Gold còn nhân thêm `tip` của loại khách. Range nền 0–20 · mỗi điểm 1–8 */
export const CUS_GOLD_BASE = 2;
export const CUS_GOLD_PER_PT = 1;
export const CUS_XP_BASE = 1;
export const CUS_XP_PER_PT = 1;

/** Các loại khách. `tip` nhân vào gold, `weight` là tỉ lệ xuất hiện (càng lớn càng hay gặp),
 *  `art` là TÊN FILE (kèm đuôi) trong public/art/NPC/. Thêm loại mới = thả ảnh vào thư mục đó
 *  rồi thêm một dòng ở đây, không cần sửa code chỗ nào khác (16- Rule 3).
 *  `name` là in-game text nên viết tiếng Anh. Range tip 0.5–2.5 · weight 1–10 */
export const CUS_TYPES = [
  { id: 'student',  name: 'Student',        tip: 0.7, weight: 5, art: 'Student.avif' },
  { id: 'vendor',   name: 'Street Vendor',  tip: 1.0, weight: 4, art: 'HangRong.jpg' },
  { id: 'rider',    name: 'Delivery Rider', tip: 0.9, weight: 4, art: 'Grab.jpg' },
  { id: 'tourist',  name: 'Tourist',        tip: 1.6, weight: 2, art: 'Tourist.jpg' },
  { id: 'officer',  name: 'Police Officer', tip: 1.2, weight: 2, art: 'CongAn.jpg' },
  { id: 'boss',     name: 'Businessman',    tip: 2.0, weight: 2, art: 'Businessman.jpeg' },
  { id: 'gangster', name: 'Gangster',       tip: 0.4, weight: 1, art: 'Gangster.png' },
];

// ---- Nhân viên (design/18-staff.md) -------------------------------------------------
//  Nhân viên nhận order tận bàn, chạy về BẾP đứng nấu rồi bưng ra. Nấu song song được
//  min(số nhân viên, số bếp) món — mua thêm bếp mà không có người thì bếp đứng không.

/** Số nhân viên của quán MỚI. Về sau người chơi thuê thêm trong shop, số thật nằm ở `save.staff`
 *  (18- Rule 1). Range 0–4 · 0 = không ai phục vụ, khách gọi món rồi bỏ đi hết */
export const STAFF_START = 1;

/** Ảnh nhân viên — tên file (kèm đuôi) trong public/art/NPC/, như `art` của CUS_TYPES. */
export const STAFF_ART = 'Waiter.png';

/** Giá thuê NGƯỜI TIẾP THEO và level tối thiểu để thuê: phần tử [0] là người thứ 2, [1] là người
 *  thứ 3… Hai bảng phải dài bằng nhau; độ dài bảng quyết định luôn trần số nhân viên.
 *  Range giá 100–3000 · level 1–15 (18- Rule 14) */
export const STAFF_PRICE = [250, 700, 1500];
export const STAFF_MIN_LEVEL = [2, 5, 8];

/** Trần số nhân viên — suy ra từ bảng giá để hai chỗ không bao giờ lệch nhau. KHÔNG sửa tay. */
export const STAFF_MAX = STAFF_START + STAFF_PRICE.length;

/** Nhịp nhảy của nhân viên (ms) — nhanh hơn khách (HOP_MS) để đọc ra "đang chạy",
 *  và nhịp đứng lại lúc nhận order / lúc trả món. Range 120–400 · 200–1200 */
export const STAFF_HOP_MS = 190;
export const STAFF_PICK_MS = 420;

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
