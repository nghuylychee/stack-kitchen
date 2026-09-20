// 12-restaurant-meta.md — toàn bộ state của quán nằm ở đây.
// Rule 6 (bất di bất dịch): core/, ai/ và net/ KHÔNG BAO GIỜ import file này. Ván bài không
// biết quán tồn tại. Chiều ngược lại (meta đọc core/) thì được phép.
import { GRID_COLS, GRID_ROWS, MENU_SLOTS, START_DISHES, START_GOLD, START_LEVEL } from '../core/config';
import { RECIPES } from '../core/data';

export interface PlacedItem { id: number; type: string; x: number; y: number }
export interface Save {
  v: number;
  name: string;
  level: number;
  xp: number;            // XP trong level hiện tại (14-gold-xp-level.md)
  gold: number;
  items: PlacedItem[];   // đồ đã sở hữu + ô của nó (13-restaurant-grid.md)
  dishes: string[];      // món đã mở khoá bằng cách nấu trong ván (17- Rule 2)
  menu: string[];        // món đang treo trong quán, tối đa MENU_SLOTS (17- Rule 4)
  lastSeen: number;      // epoch ms — 16-customers-idle.md đọc để tính thu nhập lúc vắng mặt
}

export const SAVE_KEY = 'sk.save';
export const SAVE_VERSION = 2;        // v1 -> v2: thêm dishes/menu (17- Rule 9), migrate chứ không xoá
const OLD_NICK_KEY = 'sk-nick';        // tên người chơi của bản trước màn quán

let blocked = false;                    // localStorage không ghi được (private mode…)
let newer = false;                      // save của bản mới hơn — đọc không nổi, cấm ghi đè

/** Dòng cảnh báo trên HUD, hoặc null khi mọi thứ bình thường (12- Edge cases). In-game text. */
export function saveWarning(): string | null {
  if (newer) return 'Save is from a newer version — changes are not being saved';
  if (blocked) return "Progress can't be saved in this browser";
  return null;
}

// Quán khởi điểm: 1 bếp + 1 bàn đặt sẵn cạnh nhau giữa lưới, toạ độ cố định (13- Edge cases).
export function startSave(): Save {
  const x = Math.max(0, Math.floor(GRID_COLS / 2) - 2), y = Math.max(0, Math.floor(GRID_ROWS / 2) - 1);
  const start = knownDishes(START_DISHES);                 // 17- Rule 3: quán mới đã bán được hàng
  return {
    v: SAVE_VERSION, name: '', level: START_LEVEL, xp: 0, gold: START_GOLD,
    items: [{ id: 1, type: 'kitchen_basic', x, y }, { id: 2, type: 'table_basic', x: x + 2, y }],
    dishes: [...start], menu: start.slice(0, MENU_SLOTS),
    lastSeen: Date.now(),
  };
}

// 17- Rule 1 + Edge cases: tên món chỉ hợp lệ khi khớp `dish` trong RECIPES — tên rác (sửa tay
// localStorage, hoặc bản deploy sau bỏ món) bị lọc lúc nạp, không crash.
export function knownDishes(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const d of list)
    if (typeof d === 'string' && RECIPES.some(r => r.dish === d) && !out.includes(d)) out.push(d);
  return out;
}

const int = (v: unknown, dflt: number) => (typeof v === 'number' && isFinite(v) ? Math.floor(v) : dflt);

// 12- Rule 5: thiếu / hỏng / version lạ → quán khởi điểm, một dòng console, không bao giờ ném lỗi.
export function loadSave(): Save {
  let raw: string | null = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch { blocked = true; }
  if (!raw) {
    const s = startSave();
    try { s.name = (localStorage.getItem(OLD_NICK_KEY) || '').slice(0, 12); } catch { /* ignore */ }
    return s;
  }
  try {
    const o = JSON.parse(raw) as Partial<Save>;
    if (int(o.v, 0) > SAVE_VERSION) {                       // 12- Edge cases: không cố đọc, không ghi đè
      newer = true;
      console.warn(`[meta] save v${o.v} is newer than v${SAVE_VERSION} — running on a fresh restaurant, not overwriting`);
      return startSave();
    }
    const v = int(o.v, 0);
    if (v < 1 || !Array.isArray(o.items)) throw new Error('shape');
    // 17- Rule 9: save cũ (v1) giữ nguyên gold/level/đồ đạc, chỉ thêm menu khởi điểm.
    const dishes = v >= 2 ? knownDishes(o.dishes) : knownDishes(START_DISHES);
    const menu = (v >= 2 ? knownDishes(o.menu) : knownDishes(START_DISHES))
      .filter(d => dishes.includes(d)).slice(0, MENU_SLOTS);
    return {
      v: SAVE_VERSION,
      name: typeof o.name === 'string' ? o.name.slice(0, 12) : '',
      level: Math.max(1, int(o.level, START_LEVEL)),
      xp: Math.max(0, int(o.xp, 0)),
      gold: Math.max(0, int(o.gold, START_GOLD)),
      items: o.items.filter(it => it && typeof it.type === 'string')
        .map((it, i) => ({ id: int(it.id, i + 1), type: it.type, x: int(it.x, 0), y: int(it.y, 0) })),
      dishes, menu,
      lastSeen: int(o.lastSeen, Date.now()),
    };
  } catch (e) {
    console.warn('[meta] save unreadable — starting a fresh restaurant:', (e as Error).message);
    return startSave();
  }
}

// 12- Rule 4: ghi mỗi lần state đổi. Không có nút Save.
export function writeSave(s: Save) {
  if (newer) return;
  s.lastSeen = Date.now();                                   // 12- Rule 9
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }
  catch { blocked = true; }
}
