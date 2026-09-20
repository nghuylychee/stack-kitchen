// 16-customers-idle.md — vòng đời khách + thu nhập lúc vắng mặt. Không đụng DOM: file này chỉ
// biết `Save` và thời gian; vẽ là việc của ui/restaurant.ts. Không đụng ván bài (12- Rule 6).
import {
  CUS_EAT_MS, CUS_GOLD_BASE, CUS_GOLD_PER_PT, CUS_ORDER_MS, CUS_PATIENCE_MS, CUS_SPAWN_MS,
  CUS_TYPES, CUS_XP_BASE, CUS_XP_PER_PT, GRID_COLS, GRID_ROWS, HOP_MS,
  IDLE_CAP_H, IDLE_CYCLE_MS, IDLE_RATE,
} from '../core/config';
import type { Recipe } from '../core/data';
import { itemDef } from './items';
import { avgMenuPoints, menuRecipes } from './menu';
import type { PlacedItem, Save } from './save';

export const CUS_W = 2, CUS_H = 2;                 // card vuông 2×2 ô — người to hơn đồ đạc
                                                   // (13- Numbers, sửa 2026-09-20 (6))
export type CusType = typeof CUS_TYPES[number];
export type Phase = 'in' | 'order' | 'wait' | 'cook' | 'eat' | 'angry' | 'out';

export interface Customer {
  id: number; type: CusType; tableId: number;
  x: number; y: number;                            // ô hiện tại
  phase: Phase; since: number; hopAt: number;
  dish: Recipe | null; orderedAt: number; cookEnd: number;
  moved: boolean;                                  // ô vừa đổi trong tick này → UI cho nhảy một bước
  staffId: number;                                 // nhân viên đang lo đơn này, 0 = chưa ai (18- Rule 5)
}
export interface CusWorld { list: Customer[]; nextSpawn: number; nextId: number }
export interface Paid { c: Customer; gold: number; xp: number }

export const newWorld = (): CusWorld => ({ list: [], nextSpawn: 0, nextId: 1 });

const tables = (s: Save) => s.items.filter(i => i.type === 'table_basic');
export const kitchens = (s: Save) => s.items.filter(i => i.type === 'kitchen_basic' || i.type === 'kitchen_extra');

/** 16- Rule 5: chỗ ngồi là ô bên phải bàn (hết chỗ thì bên trái, cùng đường thì đè lên bàn). */
export function seatCell(t: PlacedItem) {
  const d = itemDef(t.type);
  const y = Math.max(0, Math.min(GRID_ROWS - CUS_H, t.y + 1));
  if (t.x + d.w + CUS_W <= GRID_COLS) return { x: t.x + d.w, y };
  if (t.x - CUS_W >= 0) return { x: t.x - CUS_W, y };
  return { x: t.x, y };
}

/** Ô cửa: giữa cạnh TRÊN lưới và lùi hẳn lên trên mép (y âm) — khách đi từ phía trên màn xuống
 *  (16- Rule 3, sửa 2026-09-20 (3)). Camera không bao giờ nhìn lên trên mép lưới (13- Rule 16),
 *  nên chỗ khách đứng chờ trước khi vào quán là vùng khuất. */
export const doorCell = () => ({ x: Math.max(0, Math.floor(GRID_COLS / 2)), y: -CUS_H });

const rollType = (): CusType => {
  let n = Math.random() * CUS_TYPES.reduce((a, t) => a + t.weight, 0);
  for (const t of CUS_TYPES) if ((n -= t.weight) <= 0) return t;
  return CUS_TYPES[0];
};

/** 16- Rule 8. Tip chỉ nhân vào gold; XP không có tip. */
export function fare(c: Customer) {
  const pts = c.dish ? c.dish.pts : 0;
  return {
    gold: Math.round((CUS_GOLD_BASE + CUS_GOLD_PER_PT * pts) * c.type.tip),
    xp: Math.round(CUS_XP_BASE + CUS_XP_PER_PT * pts),
  };
}

// Một bước nhảy về phía đích: đúng MỘT ô, ưu tiên trục còn lệch nhiều hơn (16- Rule 4).
// Dùng chung cho khách và nhân viên (18- Rule 2) nên chỉ cần {x, y}.
export function hop(c: { x: number; y: number }, tx: number, ty: number) {
  const dx = tx - c.x, dy = ty - c.y;
  if (!dx && !dy) return false;
  if (Math.abs(dx) >= Math.abs(dy)) c.x += Math.sign(dx);
  else c.y += Math.sign(dy);
  return true;
}

/** Chạy vòng đời tới mốc `now`. Trả về danh sách khách vừa trả tiền (người gọi cộng vào save). */
export function tickCustomers(s: Save, w: CusWorld, now: number): Paid[] {
  const paid: Paid[] = [];
  const menu = menuRecipes(s);
  const seats = tables(s);
  const door = doorCell();
  for (const c of w.list) c.moved = false;

  // 16- Rule 3: còn bàn trống + menu có món thì sinh khách ở cửa
  const taken = new Set(w.list.map(c => c.tableId));
  const free = seats.filter(t => !taken.has(t.id));
  if (!w.nextSpawn) w.nextSpawn = now + CUS_SPAWN_MS;
  if (menu.length && free.length && now >= w.nextSpawn) {
    const t = free[Math.floor(Math.random() * free.length)];
    w.list.push({
      id: w.nextId++, type: rollType(), tableId: t.id, x: door.x, y: door.y,
      phase: 'in', since: now, hopAt: now + HOP_MS, dish: null, orderedAt: 0, cookEnd: 0,
      moved: true, staffId: 0,
    });
    w.nextSpawn = now + CUS_SPAWN_MS;
  }

  for (const c of w.list) {
    const table = seats.find(t => t.id === c.tableId);
    const seat = table ? seatCell(table) : door;
    switch (c.phase) {
      case 'in':
        if (now < c.hopAt) break;
        c.hopAt = now + HOP_MS;
        if (hop(c, seat.x, seat.y)) { c.moved = true; break; }
        c.phase = 'order'; c.since = now;
        break;
      case 'order':
        if (c.x !== seat.x || c.y !== seat.y) { c.x = seat.x; c.y = seat.y; c.moved = true; }   // bàn bị kéo đi
        if (now - c.since < CUS_ORDER_MS) break;
        c.dish = menu.length ? menu[Math.floor(Math.random() * menu.length)] : null;
        if (!c.dish) { c.phase = 'angry'; c.since = now; break; }                               // menu vừa bị dọn sạch
        c.phase = 'wait'; c.orderedAt = now; c.since = now;
        break;
      case 'wait':
        // Chờ MỘT NHÂN VIÊN tới nhận order (18- Rule 5). Chỉ giai đoạn này mới đếm kiên nhẫn:
        // khách bỏ đi phải là lỗi quán thiếu tay làm, không phải lỗi món nấu lâu (18- Rule 9).
        if (c.x !== seat.x || c.y !== seat.y) { c.x = seat.x; c.y = seat.y; c.moved = true; }
        if (now - c.orderedAt > CUS_PATIENCE_MS) { c.phase = 'angry'; c.since = now; }
        break;
      case 'cook':
        // Nhân viên đã cầm order đi nấu — khách chỉ ngồi đợi, không còn hết kiên nhẫn nữa.
        // Chuyển sang 'eat' là việc của staff.ts lúc bưng món tới (18- Rule 8).
        if (c.x !== seat.x || c.y !== seat.y) { c.x = seat.x; c.y = seat.y; c.moved = true; }
        break;
      case 'eat': {
        if (c.x !== seat.x || c.y !== seat.y) { c.x = seat.x; c.y = seat.y; c.moved = true; }
        if (now - c.since < CUS_EAT_MS) break;
        const f = fare(c);
        paid.push({ c, gold: f.gold, xp: f.xp });
        c.phase = 'out'; c.since = now; c.hopAt = now + HOP_MS;
        break;
      }
      case 'angry':
        if (now - c.since < 600) break;                      // một nhịp để thấy card rung rồi mới đi
        c.phase = 'out'; c.since = now; c.hopAt = now + HOP_MS;
        break;
      case 'out':
        if (now < c.hopAt) break;
        c.hopAt = now + HOP_MS;
        if (hop(c, door.x, door.y)) c.moved = true;
        break;
    }
  }
  // về tới cửa thì biến mất
  w.list = w.list.filter(c => !(c.phase === 'out' && c.x === door.x && c.y === door.y && now - c.since > HOP_MS));
  return paid;
}

/** 16- Rule 9: thu nhập cho khoảng thời gian không mở màn quán, có trần. */
export function awayIncome(s: Save, now: number) {
  // 18- Rule 12: nút thắt lúc vắng mặt phải GIỐNG lúc có mặt — bàn, bếp và người, cạnh nào thiếu
  // cũng chặn. Nếu không thì đóng tab lại lời hơn ngồi xem.
  const rate = Math.min(tables(s).length, kitchens(s).length, s.staff);
  const avg = avgMenuPoints(s);
  const ms = Math.max(0, Math.min(now - s.lastSeen, IDLE_CAP_H * 3600_000));   // lastSeen ở tương lai → 0
  if (!rate || !avg) return { gold: 0, xp: 0, ms };
  const cycles = Math.floor(ms / IDLE_CYCLE_MS) * rate;
  return {
    gold: Math.floor(cycles * (CUS_GOLD_BASE + CUS_GOLD_PER_PT * avg) * IDLE_RATE),
    xp: Math.floor(cycles * (CUS_XP_BASE + CUS_XP_PER_PT * avg) * IDLE_RATE),
    ms,
  };
}
