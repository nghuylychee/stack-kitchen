// 15-shop-unlocks.md — catalogue tĩnh. Giá và level nằm ở config.ts để người duyệt tự vặn;
// tên/loại/footprint lấy từ items.ts (một nguồn duy nhất, không chép lại — 13- Numbers).
import { SHOP_MIN_LEVEL, SHOP_PRICE } from '../core/config';
import { itemDef, type ItemDef } from './items';

export interface ShopEntry extends ItemDef { id: string; price: number; minLevel: number; blurb: string }

// Thứ tự hiện trong shop (rẻ → đắt). In-game text tiếng Anh (15- Rule 2).
const BLURB: Record<string, string> = {
  plant_pot: 'Green corner. Purely for looks.',
  table_basic: 'Seats one more customer.',
  kitchen_extra: 'Cook one more dish at a time.',
};
export const SHOP_ORDER = ['plant_pot', 'table_basic', 'kitchen_extra'];

export const shopEntries = (): ShopEntry[] => SHOP_ORDER.map(id => ({
  id, ...itemDef(id),
  price: SHOP_PRICE[id] ?? 0,
  minLevel: SHOP_MIN_LEVEL[id] ?? 1,
  blurb: BLURB[id] || '',
}));

export const shopEntry = (id: string) => shopEntries().find(e => e.id === id) || null;
