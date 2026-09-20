// Đồ đạc trong quán — 12-restaurant-meta.md Rule 3, 13-restaurant-grid.md Rule 2.
// Footprint dáng dọc 2:3 để card quán trùng tỉ lệ .card của bàn chơi (ui/restaurant.md Tuning pass (1)).
// Giá và mức level mở khoá sống ở shop (15-shop-unlocks.md, ticket #27); file này chỉ mô tả
// món đồ: tên hiển thị, loại, và nó ăn mấy ô.
export type ItemKind = 'facility' | 'decor';
export interface ItemDef { name: string; kind: ItemKind; w: number; h: number; art: string }

// art = TÊN FILE (kèm đuôi) dưới public/art/Props/ (design/art.md "Restaurant meta" §3, sửa
// 2026-09-20 (6): một thư mục chung cho facility lẫn decor, và tên file giữ nguyên đuôi thật
// vì ảnh người duyệt thả vào có đủ .jpg/.jpeg/.png). Chuỗi rỗng = chưa có ảnh → placeholder chữ cái.
export const ITEMS: Record<string, ItemDef> = {
  table_basic:    { name: 'Street Table',   kind: 'facility', w: 2, h: 3, art: 'Table.jpg' },
  kitchen_basic:  { name: 'Kitchen',        kind: 'facility', w: 2, h: 3, art: 'Kitchen.jpg' },
  kitchen_extra:  { name: 'Second Burner',  kind: 'facility', w: 2, h: 3, art: 'Kitchen.jpg' },
  plant_pot:      { name: 'Potted Plant',   kind: 'decor',    w: 1, h: 2, art: 'Tree.jpg' },
};

export const itemDef = (type: string): ItemDef =>
  ITEMS[type] || { name: type, kind: 'decor', w: 1, h: 2, art: '' };
