// Numbers & content — lifted from design/01–05. Tags live in the docs.

// User-tunable counts, points and online timers live in config.ts (08, 04, 06, 07) — re-exported here.
import { CLAIM_WINDOW_MS, COPIES_PER_TYPE_MENU, HAND_SIZE, MENU_SIZE, ORDER_BONUS, ORDER_SIZE, POINTS_BY_SIZE, TURN_LIMIT_MS } from './config';
export { CLAIM_WINDOW_MS, COPIES_PER_TYPE_MENU, HAND_SIZE, MENU_SIZE, ORDER_BONUS, ORDER_SIZE, POINTS_BY_SIZE, TURN_LIMIT_MS };
// 08-hand-refill.md
export const REFILL_STAGGER_MS = 150;
// 10-match-intro.md — Menu then Order revealed one dish at a time; host waits the same intro before the deal
export const MENU_ITEM_REVEAL_MS = 220;
export const MENU_HOLD_MS = 900;
export const ORDER_ITEM_REVEAL_MS = 280;
export const ORDER_HOLD_MS = 1400;
export const MENU_LAND_MS = 500;            // Menu shrinks into #menu-rail (10 Rule 3)
export const MENU_LAND_STAGGER_MS = 40;
export const ORDER_LAND_MS = 550;           // Order list shrinks into #my-order (10 Rule 5)
export const ORDER_LAND_STAGGER_MS = 70;
// 11-match-finale.md — celebration between the `end` event and #endModal, Kết thúc A' only.
// Client-only: the match is already over, so no host wait() pairs with these (11 Rule 7–8).
export const FINALE_SPOTLIGHT_MS = 900;     // dim + ring settle before the order rows light up (11 Rule 2)
export const FINALE_ROW_STAGGER_MS = 220;   // one order row per beat, same cadence as the intro (10)
export const FINALE_CONFETTI_MS = 1600;     // burst length (11 Rule 3)
export const FINALE_TEXT_HOLD_MS = 1300;
export const FINALE_TEXT_FADE_MS = 250;
// 03-play-claim.md
export const PLAY_REVEAL_MS = 500;
// 02-draw-reveal.md
export const COOK_MS = 1200;
// 05-ai-player.md
export const HOLD_MIN_UNSEEN = 2;
export const ORDER_WEIGHT = 2;
export const DUPLICATE_FACTOR = 0.4;
export const NOISE = 0.3;
export const AI_STEP_MS = 900;
// 05-ai-player.md Rule 8–12 — opponent reading
export const COOK_W = 3;
export const SHARE_W = 1;
export const PASS_W = 2;
export const DISCARD_W = 1;
export const FEED_WEIGHT = 0.5;
export const DENY_DANGER_MIN = 3;
export const DENY_UNSEEN_MAX = 2;

// ui/table.md animation timings — the host paces events with the same numbers the client animates with
export const T = { draw: 300, play: 300, discard: 250, stackFly: 180, collect: 500, deal: 180, dealStagger: 30, newRing: 1500, toast: 2500, tip: 4000, fanClose: 260, introPop: 350, introSwap: 250, menuGap: 300 };
// full, unskipped intro length (10 Rule 8): each step = stagger × (n−1) + last item's pop + hold
export const introMs = (menuN: number, orderN: number) =>
  (menuN - 1) * MENU_ITEM_REVEAL_MS + T.introPop + MENU_HOLD_MS + (menuN - 1) * MENU_LAND_STAGGER_MS + MENU_LAND_MS + T.introSwap +
  (orderN - 1) * ORDER_ITEM_REVEAL_MS + T.introPop + ORDER_HOLD_MS + (orderN - 1) * ORDER_LAND_STAGGER_MS + ORDER_LAND_MS;

export type CardType = keyof typeof CARDS;
export type Course = 'A' | 'M' | 'D';

export const CARDS = {
  rice: ['Rice', 'Gao.jpg'], broken_rice: ['Broken Rice', 'GaoTam.jpeg'], sticky_rice: ['Sticky Rice', 'Nep.jpg'],
  rice_noodle: ['Rice Noodle', 'RiceNoodle.jpg'], vermicelli: ['Vermicelli', 'Vermicelli.jpg'], bread: ['Bread', 'Bread.jpeg'],
  rice_flour: ['Rice Flour', 'RiceFlour.jpg'], rice_paper: ['Rice Paper', 'RicePaper.jpeg'], beef: ['Beef', 'Beef.jpg'],
  pork: ['Pork', 'Pork.jpeg'], pork_belly: ['Pork Belly', 'PorkBelly.jpg'], chicken: ['Chicken', 'Chicken.jpg'],
  shrimp: ['Shrimp', 'Shrimp.jpeg'], crab: ['Crab', 'Crab.jpg'], herb: ['Herb', 'Herb.jpeg'], mushroom: ['Mushroom', 'Mushroom.jpg'],
  bean: ['Bean', 'Bean.jpeg'], coconut_milk: ['Coconut Milk', 'CoconutMilk.jpeg'], coffee_bean: ['Coffee Bean', 'CoffeeBean.jpg'],
  milk: ['Milk', 'Milk.jpeg'], ice: ['Ice', 'Ice.png'], lemongrass: ['Lemongrass', 'Lemongrass.webp'], chili: ['Chili', 'Chilli.jpeg'],
  fish_sauce: ['Fish Sauce', 'FishSauce.jpg'], sugar: ['Sugar', 'Sugar.jpg'], water: ['Water', 'Water.jpg'], gac_fruit: ['Gac Fruit', 'GacFruit.webp'],
} as const;
export const TYPE_ORDER = Object.keys(CARDS) as CardType[];

export interface Recipe { dish: string; c: Course; types: CardType[]; img: string; pts: number }

const RAW: Omit<Recipe, 'pts'>[] = [
  { dish: 'Gỏi Cuốn',         c: 'A', types: ['rice_paper', 'shrimp', 'herb', 'vermicelli'], img: 'GoiCuon.webp' },
  { dish: 'Nem Rán',          c: 'A', types: ['rice_paper', 'pork', 'mushroom'],             img: 'NemRan.jpeg' },
  { dish: 'Chả Giò',          c: 'A', types: ['rice_paper', 'pork', 'herb'],                 img: 'ChaGio.jpg' },
  { dish: 'Bánh Cuốn',        c: 'A', types: ['rice_flour', 'pork', 'mushroom'],             img: 'BanhCuon.jpeg' },
  { dish: 'Bánh Xèo',         c: 'A', types: ['rice_flour', 'coconut_milk', 'shrimp', 'pork'], img: 'BanhXeo.webp' },
  { dish: 'Bánh Mì',          c: 'A', types: ['bread', 'pork', 'herb'],                      img: 'BanhMi.jpeg' },
  { dish: 'Phở Bò',           c: 'M', types: ['rice_noodle', 'beef'],                        img: 'PhoBo.jpg' },
  { dish: 'Bún Bò Huế',       c: 'M', types: ['rice_noodle', 'beef', 'chili', 'lemongrass'], img: 'BunBoHue.jpeg' },
  { dish: 'Bún Chả',          c: 'M', types: ['vermicelli', 'pork_belly', 'fish_sauce', 'herb'], img: 'BunCha.jpeg' },
  { dish: 'Cơm Tấm',          c: 'M', types: ['broken_rice', 'pork', 'fish_sauce'],          img: 'ComTam.jpg' },
  { dish: 'Cao Lầu',          c: 'M', types: ['rice_noodle', 'pork', 'herb'],                img: 'CaoLau.jpg' },
  { dish: 'Mì Quảng',         c: 'M', types: ['rice_noodle', 'shrimp', 'pork', 'herb'],      img: 'MiQuang.jpeg' },
  { dish: 'Hủ Tiếu Nam Vang', c: 'M', types: ['rice_noodle', 'pork', 'shrimp'],              img: 'HuTieuNamVang.jpg' },
  { dish: 'Bánh Canh Cua',    c: 'M', types: ['rice_flour', 'crab', 'pork'],                 img: 'BanhCanhCua.jpg' },
  { dish: 'Cơm Gà Hội An',    c: 'M', types: ['rice', 'chicken', 'herb'],                    img: 'ComGaHoiAn.jpg' },
  { dish: 'Cháo Gà',          c: 'M', types: ['rice', 'chicken', 'water'],                   img: 'ChaoGa.jpg' },
  { dish: 'Chè Ba Màu',       c: 'D', types: ['bean', 'coconut_milk', 'sugar'],              img: 'CheBaMau.jpg' },
  { dish: 'Cà Phê Sữa Đá',    c: 'D', types: ['coffee_bean', 'milk', 'ice'],                 img: 'CaPheSuaDa.jpg' },
  { dish: 'Xôi Gấc',          c: 'D', types: ['sticky_rice', 'gac_fruit'],                   img: 'XoiGac.avif' },
  { dish: 'Bánh Chưng',       c: 'D', types: ['sticky_rice', 'pork', 'bean'],                img: 'BanhChung.jpeg' },
];
export const RECIPES: Recipe[] = RAW.map(r => ({ ...r, pts: POINTS_BY_SIZE[r.types.length] }));
export const recipeByDish = (dish: string) => RECIPES.find(r => r.dish === dish) || null;

// Sanity check of config.ts — Match.start() refuses to deal when this returns anything.
export function configErrors(): string[] {
  const e: string[] = [];
  const int = (v: unknown, min: number) => Number.isInteger(v) && (v as number) >= min;
  if (!int(HAND_SIZE, 1)) e.push(`HAND_SIZE must be a whole number ≥ 1 (is ${HAND_SIZE})`);
  if (!int(COPIES_PER_TYPE_MENU, 1)) e.push(`COPIES_PER_TYPE_MENU must be a whole number ≥ 1 (is ${COPIES_PER_TYPE_MENU})`);
  if (typeof ORDER_BONUS !== 'number' || !isFinite(ORDER_BONUS)) e.push(`ORDER_BONUS must be a number (is ${ORDER_BONUS})`);
  for (const n of [2, 3, 4]) {
    const m = MENU_SIZE[n], o = ORDER_SIZE[n];
    if (!int(m, 1) || m > RAW.length) e.push(`MENU_SIZE[${n}] must be 1–${RAW.length} (is ${m})`);
    if (!int(o, 1)) e.push(`ORDER_SIZE[${n}] must be a whole number ≥ 1 (is ${o})`);
    else if (int(m, 1) && o > m) e.push(`ORDER_SIZE[${n}] (${o}) must be ≤ MENU_SIZE[${n}] (${m})`);
  }
  for (const size of new Set(RAW.map(r => r.types.length)))
    if (typeof POINTS_BY_SIZE[size] !== 'number' || !isFinite(POINTS_BY_SIZE[size])) e.push(`POINTS_BY_SIZE[${size}] is missing — some dishes have ${size} cards`);
  if (!(CLAIM_WINDOW_MS > 0)) e.push(`CLAIM_WINDOW_MS must be > 0 (is ${CLAIM_WINDOW_MS})`);
  if (!(TURN_LIMIT_MS > 0)) e.push(`TURN_LIMIT_MS must be > 0 (is ${TURN_LIMIT_MS})`);
  return e;
}

export const COURSE_NAME: Record<Course, string> = { A: 'Appetizer', M: 'Main', D: 'Dessert' };
export const SEATS: Record<number, string[]> = { 2: ['bottom', 'top'], 3: ['bottom', 'top-left', 'top-right'], 4: ['bottom', 'left', 'top', 'right'] };
export const label = (t: CardType) => CARDS[t][0];
export const ART = import.meta.env.BASE_URL + 'art/';
