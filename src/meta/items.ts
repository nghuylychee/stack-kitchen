// Đồ đạc trong quán — 12-restaurant-meta.md Rule 3, 13-restaurant-grid.md Rule 2.
// Footprint dáng dọc 2:3 để card quán trùng tỉ lệ .card của bàn chơi (ui/restaurant.md Tuning pass (1)).
// Giá và mức level mở khoá sống ở shop (15-shop-unlocks.md, ticket #27); file này chỉ mô tả
// món đồ: tên hiển thị, loại, và nó ăn mấy ô.
export type ItemKind = 'facility' | 'decor';
export interface ItemDef { name: string; kind: ItemKind; w: number; h: number; art: string }

// art = tên file PascalCase dưới public/art/<Facility|Decor>/ (design/art.md "Restaurant meta" §3).
export const ITEMS: Record<string, ItemDef> = {
  table_basic:    { name: 'Street Table',   kind: 'facility', w: 2, h: 3, art: 'TableBasic' },
  kitchen_basic:  { name: 'Kitchen',        kind: 'facility', w: 2, h: 3, art: 'KitchenBasic' },
  kitchen_extra:  { name: 'Second Burner',  kind: 'facility', w: 2, h: 3, art: 'KitchenExtra' },
  plant_pot:      { name: 'Potted Plant',   kind: 'decor',    w: 1, h: 2, art: 'PlantPot' },
};

export const itemDef = (type: string): ItemDef =>
  ITEMS[type] || { name: type, kind: 'decor', w: 1, h: 2, art: '' };
