// 17-restaurant-menu.md — món quán bán. KHÔNG phải Menu của ván bài (07-menu-orders.md).
// Hàm thuần trên `Save`; ghi save là việc của người gọi (ui/restaurant.ts).
import { MENU_SLOTS } from '../core/config';
import { RECIPES, type Recipe } from '../core/data';
import type { Save } from './save';

export const dishByName = (dish: string): Recipe | null => RECIPES.find(r => r.dish === dish) || null;

/** Món đang treo, theo đúng thứ tự người chơi chọn; tên lạ đã bị lọc lúc nạp save. */
export const menuRecipes = (s: Save): Recipe[] =>
  s.menu.map(dishByName).filter((r): r is Recipe => !!r);

export const menuFull = (s: Save) => s.menu.length >= MENU_SLOTS;

/** 17- Rule 4: treo / bỏ treo một món. Trả về lý do khi không làm được (in-game text). */
export function toggleMenu(s: Save, dish: string): { on: boolean; reason?: string } {
  const i = s.menu.indexOf(dish);
  if (i >= 0) { s.menu.splice(i, 1); return { on: false }; }
  if (!s.dishes.includes(dish)) return { on: false, reason: 'Cook it in a match to unlock it.' };
  if (menuFull(s)) return { on: false, reason: `Menu is full (${MENU_SLOTS}) — take one down first.` };
  s.menu.push(dish);
  return { on: true };
}

/** 17- Rule 2: món vừa nấu trong ván → mở khoá. Trả về danh sách món MỚI mở (để báo một lần). */
export function unlockDishes(s: Save, cooked: string[]): string[] {
  const fresh: string[] = [];
  for (const d of cooked)
    if (dishByName(d) && !s.dishes.includes(d)) { s.dishes.push(d); fresh.push(d); }
  return fresh;
}

/** Điểm trung bình của các món đang treo — 16- Rule 9 dùng để ước thu nhập lúc vắng mặt. */
export function avgMenuPoints(s: Save): number {
  const rs = menuRecipes(s);
  return rs.length ? rs.reduce((n, r) => n + r.pts, 0) / rs.length : 0;
}
