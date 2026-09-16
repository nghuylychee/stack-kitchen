// Numbers & content — lifted from design/01–05. Tags live in the docs.

// 01-card-pool-deal.md
export const COPIES_PER_TYPE = 4;
export const HAND_START = 11;
// 04-food-score-end.md
export const POINTS_BY_SIZE: Record<number, number> = { 2: 2, 3: 4, 4: 7 };
export const FIRST_FULL_BONUS = 10;
// 03-play-claim.md
export const PLAY_REVEAL_MS = 500;
// 02-draw-reveal.md
export const COOK_MS = 1200;
// 05-ai-player.md
export const HOLD_MIN_UNSEEN = 2;
export const COURSE_WEIGHT = 2;
export const DUPLICATE_FACTOR = 0.4;
export const NOISE = 0.3;
export const AI_STEP_MS = 900;
// 06-online-room.md (online only; offline has no limits)
export const CLAIM_WINDOW_MS = 8000;
export const TURN_LIMIT_MS = 30000;

// ui/table.md animation timings — the host paces events with the same numbers the client animates with
export const T = { draw: 300, play: 300, discard: 250, stackFly: 180, collect: 500, deal: 180, dealStagger: 30, newRing: 1500, toast: 2500, tip: 4000, fanClose: 260 };

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
  { dish: 'Goi Cuon',         c: 'A', types: ['rice_paper', 'shrimp', 'herb', 'vermicelli'], img: 'GoiCuon.webp' },
  { dish: 'Nem Ran',          c: 'A', types: ['rice_paper', 'pork', 'mushroom'],             img: 'NemRan.jpeg' },
  { dish: 'Cha Gio',          c: 'A', types: ['rice_paper', 'pork', 'herb'],                 img: 'ChaGio.jpg' },
  { dish: 'Banh Cuon',        c: 'A', types: ['rice_flour', 'pork', 'mushroom'],             img: 'BanhCuon.jpeg' },
  { dish: 'Banh Xeo',         c: 'A', types: ['rice_flour', 'coconut_milk', 'shrimp', 'pork'], img: 'BanhXeo.webp' },
  { dish: 'Banh Mi',          c: 'A', types: ['bread', 'pork', 'herb'],                      img: 'BanhMi.jpeg' },
  { dish: 'Pho Bo',           c: 'M', types: ['rice_noodle', 'beef'],                        img: 'PhoBo.jpg' },
  { dish: 'Bun Bo Hue',       c: 'M', types: ['rice_noodle', 'beef', 'chili', 'lemongrass'], img: 'BunBoHue.jpeg' },
  { dish: 'Bun Cha',          c: 'M', types: ['vermicelli', 'pork_belly', 'fish_sauce', 'herb'], img: 'BunCha.jpeg' },
  { dish: 'Com Tam',          c: 'M', types: ['broken_rice', 'pork', 'fish_sauce'],          img: 'ComTam.jpg' },
  { dish: 'Cao Lau',          c: 'M', types: ['rice_noodle', 'pork', 'herb'],                img: 'CaoLau.jpg' },
  { dish: 'Mi Quang',         c: 'M', types: ['rice_noodle', 'shrimp', 'pork', 'herb'],      img: 'MiQuang.jpeg' },
  { dish: 'Hu Tieu Nam Vang', c: 'M', types: ['rice_noodle', 'pork', 'shrimp'],              img: 'HuTieuNamVang.jpg' },
  { dish: 'Banh Canh Cua',    c: 'M', types: ['rice_flour', 'crab', 'pork'],                 img: 'BanhCanhCua.jpg' },
  { dish: 'Com Ga Hoi An',    c: 'M', types: ['rice', 'chicken', 'herb'],                    img: 'ComGaHoiAn.jpg' },
  { dish: 'Chao Ga',          c: 'M', types: ['rice', 'chicken', 'water'],                   img: 'ChaoGa.jpg' },
  { dish: 'Che Ba Mau',       c: 'D', types: ['bean', 'coconut_milk', 'sugar'],              img: 'CheBaMau.jpg' },
  { dish: 'Ca Phe Sua Da',    c: 'D', types: ['coffee_bean', 'milk', 'ice'],                 img: 'CaPheSuaDa.jpg' },
  { dish: 'Xoi Gac',          c: 'D', types: ['sticky_rice', 'gac_fruit'],                   img: 'XoiGac.avif' },
  { dish: 'Banh Chung',       c: 'D', types: ['sticky_rice', 'pork', 'bean'],                img: 'BanhChung.jpeg' },
];
export const RECIPES: Recipe[] = RAW.map(r => ({ ...r, pts: POINTS_BY_SIZE[r.types.length] }));
export const recipeByDish = (dish: string) => RECIPES.find(r => r.dish === dish) || null;

export const COURSE_NAME: Record<Course, string> = { A: 'Appetizer', M: 'Main', D: 'Dessert' };
export const SEATS: Record<number, string[]> = { 2: ['bottom', 'top'], 3: ['bottom', 'top-left', 'top-right'], 4: ['bottom', 'left', 'top', 'right'] };
export const label = (t: CardType) => CARDS[t][0];
export const ART = import.meta.env.BASE_URL + 'art/';
