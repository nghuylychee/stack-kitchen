// 05-ai-player.md — ported unchanged from the prototype.
import { COPIES_PER_TYPE, COURSE_WEIGHT, DUPLICATE_FACTOR, HOLD_MIN_UNSEEN, NOISE, RECIPES, label, recipeByDish, type CardType, type Recipe } from '../core/data';
import { count, formable, hasCourse, type FoodLike } from '../core/rules';

export interface BotSelf { hand: CardType[]; foods: FoodLike[] }
export interface BotTable { discard: CardType[]; lastPlayed: CardType | null; players: { foods: FoodLike[] }[] }

function seen(bot: BotSelf, g: BotTable, t: CardType) {
  let n = count(bot.hand, t) + count(g.discard, t);
  for (const p of g.players) for (const f of p.foods) if (recipeByDish(f.dish)!.types.includes(t)) n++;
  if (g.lastPlayed === t) n++;
  return n;
}
const unseen = (bot: BotSelf, g: BotTable, t: CardType) => Math.max(0, COPIES_PER_TYPE - seen(bot, g, t));

export function aiShouldReveal(bot: BotSelf, g: BotTable, r: Recipe, hand: CardType[]) {
  const courses = new Set(bot.foods.map(f => f.c)); courses.add(r.c);
  if (courses.size === 3) return { reveal: true, why: 'completes all 3 courses' };
  for (const big of RECIPES) {
    if (big.pts <= r.pts || !r.types.every(t => big.types.includes(t))) continue;
    const miss = big.types.filter(t => !hand.includes(t));
    if (miss.length === 1) {
      const u = unseen(bot, g, miss[0]);
      if (u >= HOLD_MIN_UNSEEN) return { reveal: false, why: `holding for ${big.dish}, waiting ${label(miss[0])} (${u} unseen)` };
    }
  }
  return { reveal: true, why: 'best available' };
}

export function aiChooseReveal(bot: BotSelf, g: BotTable, onHold: (r: Recipe, why: string) => void) {
  const opts = formable(bot.hand).sort((a, b) =>
    (b.pts - a.pts) || ((hasCourse(bot, a.c) ? 1 : 0) - (hasCourse(bot, b.c) ? 1 : 0)));
  for (const r of opts) {
    const d = aiShouldReveal(bot, g, r, bot.hand);
    if (d.reveal) return { r, why: d.why };
    onHold(r, d.why);
  }
  return null;
}

export function aiChooseDiscard(bot: BotSelf, g: BotTable) {
  const scored: { c: CardType; v: number; noisy: number; bestDish: string }[] = [];
  const seenType: Partial<Record<CardType, boolean>> = {};
  for (const c of bot.hand) {
    let v = 0, bestDish = '-';
    for (const r of RECIPES) {
      if (!r.types.includes(c)) continue;
      const miss = r.types.filter(t => !bot.hand.includes(t));
      if (miss.some(t => unseen(bot, g, t) < 1)) continue;
      const have = r.types.length - miss.length;
      const val = (have / r.types.length) * r.pts * (hasCourse(bot, r.c) ? 1 : COURSE_WEIGHT);
      if (val > v) { v = val; bestDish = r.dish; }
    }
    if (seenType[c]) v *= DUPLICATE_FACTOR;
    seenType[c] = true;
    scored.push({ c, v, noisy: v + (Math.random() * 2 - 1) * NOISE, bestDish });
  }
  scored.sort((a, b) => a.noisy - b.noisy);
  const pick = scored[0];
  return { card: pick.c, why: `lowest value ${label(pick.c)}=${pick.v.toFixed(2)} (best use: ${pick.bestDish})` };
}
