// 05-ai-player.md — bots play for their own Order (Rule 2–5) and read opponents (Rule 8–12).
// Bots only ever receive a BotTable: public table state + public event history. Never other hands or Orders.
import {
  COOK_W, COPIES_PER_TYPE_MENU, DENY_DANGER_MIN, DENY_UNSEEN_MAX, DISCARD_W, DUPLICATE_FACTOR, FEED_WEIGHT, HOLD_MIN_UNSEEN,
  NOISE, ORDER_WEIGHT, PASS_W, POINTS_BY_SIZE, SHARE_W, label, recipeByDish, type CardType, type Recipe,
} from '../core/data';
import { claimable, count, formable, orderDone, type FoodLike } from '../core/rules';

// public events, in order (05 Rule 8 inputs)
export type PubEv =
  | { k: 'reveal'; seat: number; dish: string; viaClaim: boolean }
  | { k: 'pass'; seat: number; card: CardType }                        // seat could claim but passed
  | { k: 'play'; seat: number; card: CardType };

export interface BotSelf { idx: number; hand: CardType[]; foods: FoodLike[]; order: string[] }
export interface BotTable { menu: Recipe[]; discard: CardType[]; lastPlayed: CardType | null; players: { foods: FoodLike[] }[]; pub: PubEv[] }
type Pick = { r: Recipe; why: string };

function seen(bot: BotSelf, g: BotTable, t: CardType) {
  let n = count(bot.hand, t) + count(g.discard, t);
  for (const p of g.players) for (const f of p.foods) if (recipeByDish(f.dish)!.types.includes(t)) n++;
  if (g.lastPlayed === t) n++;
  return n;
}
const unseen = (bot: BotSelf, g: BotTable, t: CardType) => Math.max(0, COPIES_PER_TYPE_MENU - seen(bot, g, t));
const inOrder = (bot: BotSelf, r: Recipe) => bot.order.includes(r.dish) && !orderDone(bot, r.dish);
const finishesOrder = (bot: BotSelf, r: Recipe) => inOrder(bot, r) && bot.order.every(d => d === r.dish || orderDone(bot, d));

// ---- Rule 8: interest(o, D) from public events only, clamped at 0 after each step
function interest(bot: BotSelf, g: BotTable) {
  const m = new Map<number, Map<string, number>>();
  const add = (o: number, D: Recipe, v: number) => {
    if (o === bot.idx) return;
    const row = m.get(o) || new Map<string, number>(); m.set(o, row);
    row.set(D.dish, Math.max(0, (row.get(D.dish) || 0) + v));
  };
  const cooked = new Set<string>();
  for (const e of g.pub) {
    if (e.k === 'reveal') {
      const r = recipeByDish(e.dish)!;
      const key = e.seat + '|' + e.dish;
      if (!cooked.has(key)) { cooked.add(key); add(e.seat, r, COOK_W); }
      if (e.viaClaim) for (const D of g.menu) {
        if (D.dish === r.dish) continue;
        const shared = D.types.filter(t => r.types.includes(t)).length;
        if (shared) add(e.seat, D, SHARE_W * shared);
      }
    } else {
      const w = e.k === 'pass' ? PASS_W : -DISCARD_W;
      for (const D of g.menu) if (D.types.includes(e.card)) add(e.seat, D, w);
    }
  }
  return m;
}

// ---- Rule 9: danger(t) over live dishes (some needed type still has unseen ≥ 1)
function dangerMap(bot: BotSelf, g: BotTable) {
  const im = interest(bot, g);
  const alive = g.menu.filter(D => D.types.some(t => unseen(bot, g, t) >= 1));
  const d = new Map<CardType, number>();
  for (const row of im.values()) for (const D of alive) {
    const v = row.get(D.dish) || 0;
    if (v) for (const t of D.types) d.set(t, (d.get(t) || 0) + v);
  }
  return d;
}
const dangerOf = (d: Map<CardType, number>, t: CardType) => d.get(t) || 0;

// ---- Rule 2 keep-or-reveal for one dish (hold only for a bigger dish in the same priority group)
function shouldReveal(bot: BotSelf, g: BotTable, r: Recipe, hand: CardType[]) {
  if (finishesOrder(bot, r)) return { reveal: true, why: `finishes Order (${bot.order.length}/${bot.order.length})` };
  const group = inOrder(bot, r);
  for (const big of g.menu) {
    if (big.pts <= r.pts || inOrder(bot, big) !== group || !r.types.every(t => big.types.includes(t))) continue;
    const miss = big.types.filter(t => !hand.includes(t));
    if (miss.length === 1) {
      const u = unseen(bot, g, miss[0]);
      if (u >= HOLD_MIN_UNSEEN) return { reveal: false, why: `holding for ${big.dish}, waiting ${label(miss[0])} (${u} unseen)` };
    }
  }
  return { reveal: true, why: group ? 'in Order' : 'best off-Order dish' };
}
// (a) unfinished Order dishes first, then (b) the rest — highest points inside each group
const byPriority = (bot: BotSelf, rs: Recipe[]) =>
  rs.slice().sort((a, b) => (Number(inOrder(bot, b)) - Number(inOrder(bot, a))) || (b.pts - a.pts));

// Rule 12: an off-Order dish that uses up a scarce, dangerous type
function denyReveal(bot: BotSelf, g: BotTable, r: Recipe, d: Map<CardType, number>) {
  if (inOrder(bot, r)) return null;
  const t = r.types.find(t => dangerOf(d, t) >= DENY_DANGER_MIN && unseen(bot, g, t) <= DENY_UNSEEN_MAX);
  return t ? `to deny — danger(${label(t)})=${dangerOf(d, t)}, ${unseen(bot, g, t)} unseen` : null;
}

export function aiChooseReveal(bot: BotSelf, g: BotTable, onHold: (r: Recipe, why: string) => void): Pick | null {
  const d = dangerMap(bot, g);
  for (const r of byPriority(bot, formable(bot.hand, g.menu))) {
    const s = shouldReveal(bot, g, r, bot.hand);
    if (s.reveal) return { r, why: s.why };
    const deny = denyReveal(bot, g, r, d);
    if (deny) return { r, why: deny };
    onHold(r, s.why);
  }
  return null;
}

// Rule 3 + 11: claim what Rule 2 would reveal; otherwise pass — unless claiming is a cheap way to deny
export function aiChooseClaim(bot: BotSelf, g: BotTable, card: CardType): { pick: Pick | null; why: string } {
  const hand = bot.hand.concat([card]);
  const opts = byPriority(bot, claimable(bot.hand, card, g.menu));
  if (!opts.length) return { pick: null, why: 'nothing to claim' };
  const d = dangerMap(bot, g);
  let firstHold = '';
  for (const r of opts) {
    const s = shouldReveal(bot, g, r, hand);
    if (s.reveal) return { pick: { r, why: s.why }, why: s.why };
    firstHold ||= `could claim ${r.dish} but ${s.why}`;
  }
  const dt = dangerOf(d, card);
  if (dt >= DENY_DANGER_MIN) {
    const r = opts.find(r => r.pts === POINTS_BY_SIZE[2] || inOrder(bot, r));
    if (r) return { pick: { r, why: `claims to deny — danger(${label(card)})=${dt}` }, why: '' };
  }
  return { pick: null, why: firstHold };
}

// Rule 4–5: discard the lowest-value card; value includes how much the card would feed opponents
export function aiChooseDiscard(bot: BotSelf, g: BotTable) {
  const d = dangerMap(bot, g);
  const scored: { c: CardType; v: number; noisy: number; bestDish: string; feed: number }[] = [];
  const seenType: Partial<Record<CardType, boolean>> = {};
  for (const c of bot.hand) {
    let v = 0, bestDish = '-';
    for (const r of g.menu) {
      if (!r.types.includes(c)) continue;
      const miss = r.types.filter(t => !bot.hand.includes(t));
      if (miss.some(t => unseen(bot, g, t) < 1)) continue;
      const have = r.types.length - miss.length;
      const val = (have / r.types.length) * r.pts * (inOrder(bot, r) ? ORDER_WEIGHT : 1);
      if (val > v) { v = val; bestDish = r.dish; }
    }
    if (seenType[c]) v *= DUPLICATE_FACTOR;
    seenType[c] = true;
    const feed = FEED_WEIGHT * dangerOf(d, c);
    v += feed;
    scored.push({ c, v, noisy: v + (Math.random() * 2 - 1) * NOISE, bestDish, feed });
  }
  scored.sort((a, b) => a.noisy - b.noisy);
  const pick = scored[0];
  return { card: pick.c, why: `lowest value ${label(pick.c)}=${pick.v.toFixed(2)} (best use: ${pick.bestDish}${pick.feed ? `, feeds rivals +${pick.feed.toFixed(1)}` : ''})` };
}
