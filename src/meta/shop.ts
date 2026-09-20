// 15-shop-unlocks.md — catalogue tĩnh. Giá và level nằm ở config.ts để người duyệt tự vặn;
// tên/loại/footprint lấy từ items.ts (một nguồn duy nhất, không chép lại — 13- Numbers).
import { SHOP_MIN_LEVEL, SHOP_PRICE, STAFF_ART, STAFF_MAX, STAFF_MIN_LEVEL, STAFF_PRICE } from '../core/config';
import { itemDef, type ItemDef } from './items';

/** 15- Rule 9: 'hire' là món KHÔNG đặt lên lưới — mua xong chỉ một con số trong save tăng lên. */
export type ShopKind = ItemDef['kind'] | 'hire';
export interface ShopEntry extends Omit<ItemDef, 'kind'> {
  id: string; kind: ShopKind; price: number; minLevel: number; blurb: string;
  /** đã mua hết số lượng cho phép (chỉ có ở món 'hire') */
  maxed?: boolean;
}

export const STAFF_ID = 'staff_hire';

// Thứ tự hiện trong shop (rẻ → đắt). In-game text tiếng Anh (15- Rule 2).
const BLURB: Record<string, string> = {
  plant_pot: 'Green corner. Purely for looks.',
  table_basic: 'Seats one more customer.',
  kitchen_extra: 'Cook one more dish at a time.',
  [STAFF_ID]: 'Takes orders, cooks, serves. One more pair of hands.',
};
// Thứ tự cố định theo giá người thứ hai (15- Rule 2).
export const SHOP_ORDER = ['plant_pot', 'table_basic', STAFF_ID, 'kitchen_extra'];

/** 18- Rule 14: giá và level của NGƯỜI TIẾP THEO, đọc theo số nhân viên đang có. */
function hireEntry(staff: number): ShopEntry {
  const i = Math.max(0, staff - 1);                  // staff = 1 → thuê người thứ 2 → bảng[0]
  const maxed = staff >= STAFF_MAX || i >= STAFF_PRICE.length;
  return {
    id: STAFF_ID, name: 'Waiter', kind: 'hire', w: 2, h: 2, art: STAFF_ART,
    price: STAFF_PRICE[Math.min(i, STAFF_PRICE.length - 1)] ?? 0,
    minLevel: STAFF_MIN_LEVEL[Math.min(i, STAFF_MIN_LEVEL.length - 1)] ?? 1,
    blurb: BLURB[STAFF_ID], maxed,
  };
}

export const shopEntries = (staff = 0): ShopEntry[] => SHOP_ORDER.map(id => id === STAFF_ID
  ? hireEntry(staff)
  : { id, ...itemDef(id), price: SHOP_PRICE[id] ?? 0, minLevel: SHOP_MIN_LEVEL[id] ?? 1, blurb: BLURB[id] || '' });

export const shopEntry = (id: string, staff = 0) => shopEntries(staff).find(e => e.id === id) || null;
