// 18-staff.md — nhân viên nhận order tận bàn, chạy về bếp đứng nấu, rồi bưng món ra.
// Không đụng DOM (vẽ là việc của ui/restaurant.ts) và không đụng ván bài (12- Rule 6).
// Một chiều import: file này đọc customers.ts, customers.ts KHÔNG đọc ngược lại.
import { COOK_PER_CARD_MS, GRID_COLS, GRID_ROWS, STAFF_HOP_MS, STAFF_PICK_MS } from '../core/config';
import type { Recipe } from '../core/data';
import { CUS_H, CUS_W, doorCell, hop, kitchens, seatCell, type CusWorld, type Customer } from './customers';
import { itemDef } from './items';
import type { PlacedItem, Save } from './save';

export type SPhase = 'idle' | 'toCus' | 'pick' | 'toKit' | 'cook' | 'toServe' | 'serve' | 'back';

export interface Staff {
  id: number;
  x: number; y: number;
  phase: SPhase; since: number; hopAt: number;
  cusId: number;              // khách đang phục vụ, 0 = rảnh
  kitId: number;              // bếp đang giữ, 0 = chưa giữ cái nào (18- Rule 6)
  dish: Recipe | null;        // món đang cầm
  cookEnd: number;
  moved: boolean;             // ô vừa đổi trong tick này → UI cho nhảy một bước
}
export interface StaffWorld { list: Staff[] }

export const newStaffWorld = (): StaffWorld => ({ list: [] });

/** 18- Rule 3: chỗ đứng là ô bên TRÁI bếp (đối xứng với chỗ ngồi của khách ở 16- Rule 5). */
export function stationCell(k: PlacedItem) {
  const d = itemDef(k.type);
  const y = Math.max(0, Math.min(GRID_ROWS - CUS_H, k.y + 1));
  if (k.x - CUS_W >= 0) return { x: k.x - CUS_W, y };
  if (k.x + d.w + CUS_W <= GRID_COLS) return { x: k.x + d.w, y };
  return { x: k.x, y };
}

/** Ô đứng cạnh khách để nhận order / trả món — bên phải chỗ ngồi, hết chỗ thì bên trái. */
function besideCell(seat: { x: number; y: number }) {
  // cả hai bên đều phải chứa lọt CẢ card nhân viên (rộng CUS_W ô), không chỉ ô đầu của nó.
  if (seat.x + CUS_W + CUS_W <= GRID_COLS) return { x: seat.x + CUS_W, y: seat.y };
  return { x: Math.max(0, seat.x - CUS_W), y: seat.y };
}

/** Món nhân viên đang cầm có vòng tiến trình chạy hay không (UI đọc). */
export const staffBusy = (st: Staff) => st.phase !== 'idle' && st.phase !== 'back';

export function tickStaff(s: Save, cw: CusWorld, sw: StaffWorld, now: number) {
  const kits = kitchens(s);

  // 18- Rule 1: số nhân viên nằm ở save; thuê thêm trong shop thì đồng bộ ngay ở tick kế tiếp.
  const want = Math.max(0, s.staff);
  while (sw.list.length < want) {
    const i = sw.list.length;
    const home = kits.length ? stationCell(kits[i % kits.length]) : doorCell();
    sw.list.push({
      id: i + 1, x: home.x, y: home.y, phase: 'idle', since: now, hopAt: now,
      cusId: 0, kitId: 0, dish: null, cookEnd: 0, moved: true,
    });
  }
  if (sw.list.length > want) {                 // kíp nhỏ lại (save lạ): khách của người bị bỏ
    for (const gone of sw.list.slice(want)) {                 // phải được thả ra, không kẹt 'cook'
      const c = cw.list.find(x => x.id === gone.cusId);
      if (c) { c.staffId = 0; if (c.phase === 'cook') { c.phase = 'wait'; c.orderedAt = now; } }
    }
    sw.list.length = want;
  }

  for (const st of sw.list) st.moved = false;
  const held = new Set(sw.list.map(st => st.kitId).filter(Boolean));

  for (const st of sw.list) {
    const home = kits.length ? stationCell(kits[(st.id - 1) % kits.length]) : doorCell();
    const cus = st.cusId ? cw.list.find(c => c.id === st.cusId) : undefined;

    // 18- Rule 10: khách bỏ đi giữa chừng → bỏ dở, nhả bếp, về chỗ.
    if (st.cusId && (!cus || cus.phase === 'angry' || cus.phase === 'out')) {
      if (cus) cus.staffId = 0;
      if (st.kitId) held.delete(st.kitId);
      st.cusId = 0; st.kitId = 0; st.dish = null; st.cookEnd = 0;
      st.phase = 'back'; st.since = now;
    }

    // Một bước về phía đích; trả về true khi đã đứng đúng ô.
    const step = (tx: number, ty: number) => {
      if (st.x === tx && st.y === ty) return true;
      if (now < st.hopAt) return false;
      st.hopAt = now + STAFF_HOP_MS;
      if (hop(st, tx, ty)) { st.moved = true; return false; }
      return true;
    };
    const table = cus ? s.items.find(t => t.id === cus.tableId) : undefined;
    const seat = table ? seatCell(table) : null;
    const target = seat ? besideCell(seat) : home;

    switch (st.phase) {
      case 'idle': {
        // 18- Rule 5: nhận khách chờ lâu nhất mà chưa ai nhận.
        let pick: Customer | null = null;
        for (const c of cw.list)
          if (c.phase === 'wait' && !c.staffId && (!pick || c.orderedAt < pick.orderedAt)) pick = c;
        if (pick) {
          pick.staffId = st.id;
          st.cusId = pick.id; st.phase = 'toCus'; st.since = now; st.hopAt = now;
          break;
        }
        step(home.x, home.y);                                    // rảnh thì về chỗ đứng
        break;
      }
      case 'toCus':
        if (step(target.x, target.y)) { st.phase = 'pick'; st.since = now; }
        break;
      case 'pick':
        if (now - st.since < STAFF_PICK_MS) break;
        if (!cus) { st.phase = 'back'; st.since = now; break; }
        st.dish = cus.dish;                                      // 18- Rule 5: order sang tay nhân viên
        cus.phase = 'cook'; cus.since = now;
        st.phase = 'toKit'; st.since = now;
        break;
      case 'toKit': {
        // 18- Rule 6: giữ một cái bếp chưa ai giữ; chưa có thì đứng yên cầm order và thử lại.
        if (st.kitId && !kits.some(k => k.id === st.kitId)) { held.delete(st.kitId); st.kitId = 0; }
        if (!st.kitId) {
          const free = kits.find(k => !held.has(k.id));
          if (!free) break;
          st.kitId = free.id; held.add(free.id);
        }
        const k = kits.find(x => x.id === st.kitId)!;
        const at = stationCell(k);
        if (step(at.x, at.y)) {
          st.phase = 'cook'; st.since = now;
          st.cookEnd = now + COOK_PER_CARD_MS * (st.dish ? st.dish.types.length : 1);   // 16- Rule 7
        }
        break;
      }
      case 'cook': {
        const k = kits.find(x => x.id === st.kitId);
        if (k) {                                                 // kéo bếp đi → bám theo, đồng hồ không reset
          const at = stationCell(k);
          if (st.x !== at.x || st.y !== at.y) { st.x = at.x; st.y = at.y; st.moved = true; }
        }
        if (now < st.cookEnd) break;
        if (st.kitId) { held.delete(st.kitId); st.kitId = 0; }   // 18- Rule 7: nấu xong là nhả bếp ngay
        st.phase = 'toServe'; st.since = now;
        break;
      }
      case 'toServe':
        if (step(target.x, target.y)) { st.phase = 'serve'; st.since = now; }
        break;
      case 'serve':
        if (now - st.since < STAFF_PICK_MS) break;
        if (cus) { cus.phase = 'eat'; cus.since = now; cus.staffId = 0; }   // 18- Rule 8 → 16- Rule 8 trả tiền
        st.cusId = 0; st.dish = null; st.cookEnd = 0;
        st.phase = 'back'; st.since = now;
        break;
      case 'back':
        if (step(home.x, home.y)) { st.phase = 'idle'; st.since = now; }
        break;
    }
  }
}
