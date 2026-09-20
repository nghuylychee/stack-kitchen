import { TYPE_ORDER, type CardType, type Course, type Recipe } from './data';

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function count<T>(arr: T[], t: T) { let n = 0; for (const x of arr) if (x === t) n++; return n; }
export function removeOne<T>(arr: T[], t: T) { const i = arr.indexOf(t); if (i >= 0) arr.splice(i, 1); }
export function sortHand(h: CardType[]) { h.sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b)); }

// 07 Rule 4: only this game's Menu can be cooked or claimed — every helper takes it
export const formable = (hand: CardType[], menu: Recipe[]) => menu.filter(r => r.types.every(t => hand.includes(t)));
export const claimable = (hand: CardType[], card: CardType, menu: Recipe[]) =>
  menu.filter(r => r.types.includes(card) && r.types.every(t => t === card || hand.includes(t)));

export interface FoodLike { dish: string; c: Course; pts: number; img: string }
export const hasCourse = (p: { foods: FoodLike[] }, c: Course) => p.foods.some(f => f.c === c);
// 07 Rule 9: an Order dish is done once it has been revealed at least once
export const orderDone = (p: { foods: FoodLike[] }, dish: string) => p.foods.some(f => f.dish === dish);

export const matchRecipe = (types: CardType[], menu: Recipe[]): Recipe | null =>
  menu.find(r => r.types.length === types.length && r.types.every(t => types.includes(t))) || null;
