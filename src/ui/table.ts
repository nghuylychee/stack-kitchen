// Table screen — ported from the prototype's RENDER / ANIMATION / HUMAN INPUT sections.
// Rules truth lives in the host (core/match.ts). This module only:
//   - plays host events in order (queue), animating each,
//   - keeps local UI-only state (hand groups, table stack, drag),
//   - sends intents.
import './table.css';
import {
  ART, CARDS, COOK_MS, COURSE_NAME, HAND_SIZE, MENU_HOLD_MS, MENU_ITEM_REVEAL_MS, ORDER_BONUS, ORDER_HOLD_MS, ORDER_ITEM_REVEAL_MS, ORDER_LAND_MS, MENU_LAND_MS, MENU_LAND_STAGGER_MS, ORDER_LAND_STAGGER_MS, REFILL_STAGGER_MS, SEATS, T, TYPE_ORDER,
  label, recipeByDish, type CardType, type Recipe,
} from '../core/data';
import { formable, matchRecipe, orderDone, removeOne, type FoodLike } from '../core/rules';
import type { HostEvent, Intent, PublicPlayer, View } from '../core/types';

// ---------------------------------------------------------------- types
interface UCard { uid: number; t: CardType; claim: boolean; arriving?: boolean; settle?: boolean }
interface Group { id: number; cards: UCard[]; table: boolean; cooking: boolean; cookStart: number; cookR: Recipe | null; food: Recipe | null; fresh: boolean }
interface Stk { stack: { t: CardType }[]; food: Recipe | null; collecting: Recipe | null; cooking: boolean; cookStart: number; arriving: number }
interface CP extends PublicPlayer { stk: Stk; seat: string; hand: CardType[] }
interface Me extends CP { groups: Group[] }
interface Rect { left: number; top: number; width: number; height: number }
type Phase = 'wait' | 'draw' | 'play' | 'collecting' | 'claim' | 'claimCook' | 'over';

interface GS {
  you: number; players: CP[]; me: Me;
  menu: Recipe[]; order: string[];
  pool: number; discard: CardType[]; lastPlayed: CardType | null; lastBy: string | null;
  current: number; turn: number; claims: number; ended: boolean; online: boolean;
  phase: Phase; claimOpts: { card: CardType; opts: Recipe[]; by: string } | null;
  dealing: boolean; dealt: number[] | null; dealSkip: boolean;
  lastHidden: boolean; lastJust: boolean; newUid: number | null; newAt: number; drawHidden: boolean;
  playFrom: Rect | null; fanMsg: string; foodIncoming: Recipe | null;
  playPending: CardType | null; collectPending: Recipe | null; collectPromise: Promise<void> | null;
  deadline: number | null;
  expectPlay: boolean;   // my Draw/collect was sent, the host's play prompt is still in the event queue (ticket #17)
}

export interface TableHooks {
  send(m: Intent): void;
  onHome(): void;
  onAgain(): void;       // offline: new game; online host: new game in room
  isHost: boolean;
  online: boolean;
  roomCode?: string;
}

// ---------------------------------------------------------------- module state
const $ = (id: string) => document.getElementById(id)!;
const noop = () => {};
class Abort extends Error {}

let G: GS | null = null;
let hooks: TableHooks | null = null;
let gameToken = 0;
let UID = 0, GID = 0;
let tipDone = false, tipUntil = 0;
let catchUp = false;
const dur = (ms: number) => (catchUp ? Math.min(ms, 40) : ms);

const g = () => G!;
const ME = () => G!.me;
const V = (p: CP, verb: string, third?: string) => (p.idx === G!.you ? verb : (third || verb + 's'));
void V;

let tabPaused = false;
document.addEventListener('visibilitychange', () => { tabPaused = document.hidden; });
function wait(ms: number) {
  const tok = gameToken;
  return new Promise<void>((res, rej) => {
    const done = () => { if (tok !== gameToken) return rej(new Abort()); if (tabPaused && !G?.online) return setTimeout(done, 200); res(); };
    setTimeout(done, ms);
  });
}
function checkToken(tok: number) { if (tok !== gameToken) throw new Abort(); }

// ---------------------------------------------------------------- hand groups (UI layer over hand)
const newGroup = (cards: UCard[], table = false): Group => ({ id: ++GID, cards, table, cooking: false, cookStart: 0, cookR: null, food: null, fresh: false });
function insertLoose(me: Me, card: UCard) {
  const oi = TYPE_ORDER.indexOf(card.t);
  const at = me.groups.findIndex(x => !x.table && !x.food && x.cards.length === 1 && TYPE_ORDER.indexOf(x.cards[0].t) > oi);
  const ng = newGroup([card]);
  if (at < 0) me.groups.push(ng); else me.groups.splice(at, 0, ng);
}
// reconcile groups against the host hand; optimistic play/collect are subtracted until the host confirms
function syncHand(me: Me) {
  const need = me.hand.slice();
  if (G!.playPending) removeOne(need, G!.playPending);
  if (G!.collectPending) G!.collectPending.types.forEach(t => removeOne(need, t));
  for (const gr of me.groups) {
    if (gr.food) { gr.food.types.forEach(t => removeOne(need, t)); continue; }
    gr.cards = gr.cards.filter(c => { if (c.claim) return true; const i = need.indexOf(c.t); if (i < 0) return false; need.splice(i, 1); return true; });
  }
  me.groups = me.groups.filter(x => x.food || x.cards.length);
  const added: UCard[] = [];
  for (const t of need) { const c = { uid: ++UID, t, claim: false }; insertLoose(me, c); added.push(c); }
  return added;
}
function findCard(me: Me, uid: number) {
  for (const gr of me.groups) { const k = gr.cards.findIndex(c => c.uid === uid); if (k >= 0) return { g: gr, k, c: gr.cards[k] }; }
  return null;
}
const groupById = (id: number) => ME().groups.find(x => x.id === id);
const claimInGroup = (me: Me) => me.groups.some(x => x.cards.some(c => c.claim));
function dropEmptyGroups(me: Me) { me.groups = me.groups.filter(x => x.food || x.cards.length); }
function stripClaim(me: Me) {                                       // 03 Rule 13/15
  for (const gr of me.groups) {
    const n = gr.cards.length;
    gr.cards = gr.cards.filter(c => !c.claim);
    if (gr.cards.length !== n && gr.cooking) { gr.cooking = false; gr.cookR = null; }
  }
  dropEmptyGroups(me);
}
const groupMatch = (gr: Group) => matchRecipe(gr.cards.map(c => c.t), g().menu);
function mergeReject(tg: Group | undefined, t: CardType) {          // 02 Rule 10
  if (!tg) return 'No target';
  if (!tg.table) return 'Stack cards on the table';
  if (tg.food) return 'Collect your food first';
  if (tg.cooking) return 'Cooking…';
  const types = tg.cards.map(c => c.t).concat([t]);
  if (new Set(types).size !== types.length) return 'Already in this stack';
  if (!g().menu.some(r => types.every(x => r.types.includes(x)))) return 'No menu dish uses these together';
  return null;
}
function canCook(gr: Group | undefined) {                           // 02 Rule 11/14, 03 Rule 11
  if (!gr || gr.cooking || gr.food || gr.cards.length < 2) return null;
  const me = ME();
  if (me.groups.some(o => o.cooking)) return null;
  const r = groupMatch(gr); if (!r) return null;
  const hasClaim = gr.cards.some(c => c.claim);
  if (g().phase === 'play' && !hasClaim) return r;
  if (g().phase === 'claim' && hasClaim && g().claimOpts && g().claimOpts!.opts.includes(r)) return r;
  return null;
}


// ---------------------------------------------------------------- view → local state
const emptyStk = (): Stk => ({ stack: [], food: null, collecting: null, cooking: false, cookStart: 0, arriving: 0 });

function buildState(v: View) {
  const n = v.players.length;
  const players = v.players.map(p => ({ ...p, hand: p.hand || [], stk: emptyStk(), seat: SEATS[n][(p.idx - v.you + n) % n] })) as CP[];
  const me = players[v.you] as Me;
  me.groups = [];
  me.hand = v.hand.slice();
  G = {
    you: v.you, players, me, menu: v.menu.map(d => recipeByDish(d)!), order: v.order.slice(), pool: v.pool, discard: v.discard.slice(), lastPlayed: v.lastPlayed, lastBy: v.lastBy,
    current: v.current, turn: v.turn, claims: v.claims, ended: v.ended, online: v.online,
    phase: 'wait', claimOpts: null, expectPlay: false, dealing: false, dealt: null, dealSkip: false,
    lastHidden: false, lastJust: false, newUid: null, newAt: 0, drawHidden: false, playFrom: null, fanMsg: '', foodIncoming: null,
    playPending: null, collectPending: null, collectPromise: null, deadline: null,
  };
  syncHand(me);
}

function applyView(v: View) {
  const s = g();
  for (const pv of v.players) {
    const p = s.players[pv.idx];
    Object.assign(p, { name: pv.name, human: pv.human, connected: pv.connected, handCount: pv.handCount, foods: pv.foods, score: pv.score, bonus: pv.bonus, orderDone: pv.orderDone, orderSize: pv.orderSize });
    if (pv.hand) p.hand = pv.hand;
    if (pv.order) p.order = pv.order;
  }
  s.me.hand = v.hand.slice();
  Object.assign(s, { pool: v.pool, discard: v.discard.slice(), lastPlayed: v.lastPlayed, lastBy: v.lastBy, current: v.current, turn: v.turn, claims: v.claims, ended: v.ended });
  return syncHand(s.me);
}

// ---------------------------------------------------------------- render
const BACK_SVG = '<svg viewBox="0 0 64 64" fill="none" stroke="#f0e6d8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="26" cy="40" rx="14" ry="7"/><path d="M12 36 Q26 20 40 36"/><path d="M38 28 Q48 27 47 34 Q46 40 38 38"/><path d="M14 26 Q8 26 8 32 Q8 37 14 36"/><rect x="23" y="12" width="6" height="4" rx="1"/><path d="M46 34 L50 48 L58 48 L60 34 Z"/></svg>';
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const ingHTML = (t: CardType, s: string, cls = '', attrs = '') =>
  `<div class="card s-${s} ${cls}" ${attrs}><div class="hdr"><span>${label(t)}</span></div><div class="ph"><img src="${ART}Card/${CARDS[t][1]}" alt="" draggable="false"></div></div>`;
const backHTML = (s: string, cls = '', attrs = '') => `<div class="card back s-${s} ${cls}" ${attrs}>${BACK_SVG}</div>`;
const foodHTML = (r: Recipe, s: string, cls = '', attrs = '') =>
  `<div class="card food cc-${r.c} s-${s} ${cls}" ${attrs}><div class="cchip">${r.c}</div><div class="hdr"><span>${r.dish}</span></div><div class="ph"><img src="${ART}Food/${r.img}" alt="" draggable="false"></div><div class="pchip">+${r.pts}</div></div>`;
const foodThumb = (f: FoodLike, size: string, cls = '') =>
  `<span class="fcard ${size} cc-${f.c} ${cls}" title="${f.dish} (${COURSE_NAME[f.c]}) +${f.pts}"><img src="${ART}Food/${f.img}" alt="" draggable="false"><span class="l">${f.c}</span><span class="p">+${f.pts}</span><span class="n">${f.dish}</span></span>`;
function elFrom(html: string) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild as HTMLElement; }
const rectOf = (el: Element): Rect => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const others = () => { const s = g(), n = s.players.length; return Array.from({ length: n - 1 }, (_, k) => s.players[(s.you + 1 + k) % n]); };
const playerName = (p: CP) => esc(p.name) + (p.human && !p.connected ? '<span class="off">bot</span>' : '');

// other players' hand cards not currently shown in their mini stack
function visCount(p: CP) {
  const b = p.stk;
  const excl = (b.food || b.collecting) ? (b.food || b.collecting)!.types.length : b.stack.length;
  const n = Math.max(0, p.handCount - excl);
  if (g().dealing) return Math.min(n, g().dealt![p.idx]);
  return n;
}
function visFaces(p: CP) {
  const b = p.stk;
  const excl = (b.food || b.collecting) ? (b.food || b.collecting)!.types.slice() : b.stack.map(x => x.t);
  return p.hand.filter(t => { const k = excl.indexOf(t); if (k >= 0) { excl.splice(k, 1); return false; } return true; });
}
function humanCardCount(me: Me) {
  if (g().dealing) return g().dealt![me.idx];
  return me.groups.reduce((a, x) => a + x.cards.filter(c => !c.claim).length, 0);
}

function buildSeats() {
  const box = $('seats'); box.innerHTML = '';
  for (const p of others()) {
    const s = document.createElement('div');
    s.className = 'seat' + (g().players.length === 2 ? ' two' : '');
    s.dataset.seat = p.seat; s.dataset.p = String(p.idx);
    s.innerHTML = `<div class="seat-head"></div><div class="seat-hand-backs"></div><div class="seat-foods"></div><div class="seat-stack empty"></div>`;
    box.appendChild(s);
  }
  $('center-play').classList.toggle('two', g().players.length === 2);
}
const seatEl = (i: number) => document.querySelector(`.seat[data-p="${i}"]`) as HTMLElement;

function headHTML(p: CP) {
  return `<div class="head1"><span class="stool ${p.idx % 2 ? 'b' : 'r'}"></span><span class="plate">${playerName(p)}</span><span class="score" id="score-${p.idx}">${p.score} pts</span></div>
    <div class="head2"><span class="stat"><span class="backicon"></span>×<b>${visCount(p)}</b></span>${pipsHTML(p)}</div>`;
}
// 09 Rule 5 — Order progress as dots only: no number, no "Order" label, no dish identity
const pipsHTML = (p: CP) => p.orderSize ? `<span class="opips">${Array.from({ length: p.orderSize }, (_, i) => `<i${i < p.orderDone ? ' class="on"' : ''}></i>`).join('')}</span>` : '';
function progHTML(start: number) {
  const el = Date.now() - start;
  return `<div class="prog"><i style="animation-duration:${COOK_MS}ms;animation-delay:-${Math.min(el, COOK_MS)}ms"></i></div><div class="steam"><span></span><span></span><span></span></div>`;
}

let renderQueued = false;
function softRender() { if (renderQueued) return; renderQueued = true; setTimeout(() => { renderQueued = false; render(); }, 16); }
let foodsKey = '';

function render() {
  if (!G) return;
  const s = G;
  const n = s.players.length;
  const undealt = s.dealing ? HAND_SIZE * n - s.dealt!.reduce((a, b) => a + b, 0) : 0;
  const poolShown = s.pool + undealt;
  $('cTurn').textContent = String(s.turn);
  const me = s.me;

  // ---- center ----
  const pp = $('pool-pile');
  pp.classList.toggle('glow', s.phase === 'draw');
  pp.classList.toggle('dashed', poolShown === 0);
  pp.innerHTML = poolShown === 0 ? '<span class="lbl">Pool empty</span>'
    : [2, 1, 0].filter(k => poolShown > k).map(k => backHTML('center', '', `style="left:${k * 2}px;top:${-k * 2}px" ${k === 0 ? 'data-act="pool"' : ''}`)).join('') + `<span class="lbl">Pool ${poolShown}</span>`;
  const ls = $('last-slot');
  let lh = '';
  if (s.lastPlayed && !s.lastHidden && !claimInGroup(me)) {
    const cls = (s.phase === 'claim' ? 'claimable' : '') + (s.lastJust ? ' just shine' : '');
    const hid = drag && drag.src.kind === 'claim' && drag.ghost ? 'incoming' : '';
    lh = ingHTML(s.lastPlayed, 'center', cls + ' ' + hid, s.phase === 'claim' ? 'data-drag="claim"' : '') + `<span class="lbl">by ${esc(s.lastBy || '')}</span>`;
  } else if (!s.lastPlayed) lh = s.phase === 'play' ? '<span class="lbl">Drag here to play</span>' : '<span class="lbl" style="opacity:.6">Last played</span>';
  if (s.phase === 'claim') lh += '<button class="pass" id="btnPass" data-act="pass">Pass</button>';
  ls.innerHTML = lh;
  ls.classList.toggle('play-target', s.phase === 'play' && !s.lastPlayed);
  ls.classList.toggle('dashed', !s.lastPlayed);
  const dsc = $('discard-slot');
  const older = s.discard.slice(-6, -1);
  dsc.innerHTML = s.discard.length ? older.map((t, i) => {
    const age = older.length - i;
    return ingHTML(t, 'disc', '', `style="left:${40 + age * 3}px;top:${-4 + age * 8}px;opacity:${Math.max(.35, 1 - age * .13)};rotate:${age * 4}deg"`);
  }).join('') + ingHTML(s.discard[s.discard.length - 1], 'center', '', 'style="left:0;top:0"') + `<span class="lbl">Discard</span>`
    : '<span class="lbl" style="opacity:.6">Discard</span>';
  dsc.classList.toggle('dashed', !s.discard.length);

  // ---- other seats ----
  for (const p of others()) {
    const se = seatEl(p.idx); if (!se) continue;
    se.classList.toggle('active', s.current === p.idx && !s.ended && !s.dealing);
    se.querySelector('.seat-head')!.innerHTML = headHTML(p);
    const bk = se.querySelector('.seat-hand-backs') as HTMLElement;
    const W = bk.clientWidth - 40;
    const faces = s.ended && p.hand.length > 0;                      // flip only at GAME_END
    const cnt = faces ? visFaces(p).length : visCount(p);
    const off = cnt > 1 ? Math.min(faces ? 20 : 12, W / (cnt - 1)) : 0;
    bk.innerHTML = faces ? visFaces(p).map((t, i) => ingHTML(t, 'mini', '', `style="left:${i * off}px"`)).join('')
      : Array.from({ length: cnt }, (_, i) => backHTML('mini', '', `style="left:${i * off}px"`)).join('');
    bk.dataset.next = String(cnt * off);
    se.querySelector('.seat-foods')!.innerHTML = p.foods.map(f => foodThumb(f, 'xs')).join('');
    const be = se.querySelector('.seat-stack') as HTMLElement;
    const b = p.stk;
    be.classList.toggle('empty', !b.stack.length && !b.food);
    if (b.food) be.innerHTML = `<div class="stack" style="height:67px">${foodHTML(b.food, 'bstk', 'pop-in shine')}</div>`;
    else if (b.stack.length) {
      be.innerHTML = `<div class="stack" style="height:${67 + 12 * (b.stack.length - 1)}px">` + (b.cooking ? progHTML(b.cookStart) : '') +
        b.stack.map((c, i) => ingHTML(c.t, 'bstk', (b.cooking ? 'locked ' : '') + (i >= b.stack.length - b.arriving ? 'incoming' : ''), `style="top:${i * 12}px"`)).join('') + '</div>';
    } else be.innerHTML = '';
  }

  // ---- my panel ----
  $('dock').classList.toggle('active', s.current === s.you && !s.ended && !s.dealing);
  $('my-h1').innerHTML = `<span class="stool r"></span><span class="plate">${playerName(me)}</span><span class="stat"><span class="backicon"></span>×<b>${humanCardCount(me)}</b></span><span class="score" id="score-${me.idx}">${me.score} pts</span>`;
  const fk = me.foods.length + '|' + (s.foodIncoming ? s.foodIncoming.dish : '');
  if (fk !== foodsKey) {
    foodsKey = fk;
    const mf = $('my-foods');
    mf.innerHTML = me.foods.map(f => foodThumb(f, 'sm')).join('') + (s.foodIncoming ? foodThumb(s.foodIncoming, 'sm', 'incoming') : '');
    mf.scrollTop = mf.scrollHeight;
  }
  renderOrder(me);
  renderTimer();
  renderFan(me);
}

// ---------------------------------------------------------------- menu & order (ui/menu-orders.md)
let railHidden = false, orderHidden = false;  // true until the start-of-game intro lands them (10 Rule 3, 5)
let orderKey = '';
let justDone: { dish: string; at: number } | null = null;
const recipesOf = (dishes: string[]) => dishes.map(d => recipeByDish(d)!);
// ingredient types that still serve an unfinished dish of my Order (07 Rule 9)
const needTypes = (me: Me) => new Set(recipesOf(g().order.filter(d => !orderDone(me, d))).flatMap(r => r.types));

function renderRail() {
  const s = g();
  $('menu-rail').innerHTML = railHidden ? '' : s.menu.map(r =>
    `<div class="menu-item cc-${r.c}" data-menu="${esc(r.dish)}"><img src="${ART}Food/${r.img}" alt="" draggable="false"><span class="dot"></span><span class="p">+${r.pts}</span></div>`).join('');
}

function renderOrder(me: Me) {
  const s = g();
  const rows = recipesOf(s.order);
  const key = orderHidden ? 'hidden' : rows.map(r => (orderDone(me, r.dish) ? 'd' : 'o') + r.types.map(t => (me.hand.includes(t) ? 1 : 0)).join('')).join('|');
  if (key === orderKey) return;
  orderKey = key;
  const el = $('my-order');
  el.className = 'n' + rows.length;
  if (orderHidden) { el.innerHTML = ''; return; }
  const just = justDone && Date.now() - justDone.at < 400 ? justDone.dish : null;
  el.innerHTML = '<div class="oh">YOUR ORDER</div>' + rows.map(r => {
    const done = orderDone(me, r.dish);
    const chips = r.types.map(t => `<img class="order-chip${me.hand.includes(t) ? ' have' : ''}" src="${ART}Card/${CARDS[t][1]}" alt="" title="${label(t)}" draggable="false">`).join('');
    return `<div class="order-row${done ? ' done' : ''}${just === r.dish ? ' just' : ''}" data-menu="${esc(r.dish)}">` +
      `<span class="st">${done ? '✓' : '○'}</span><span class="nm">${r.dish}</span><span class="pt">+${r.pts}</span><span class="chips">${chips}</span></div>`;
  }).join('');
}

// start of game (10-match-intro.md): Menu one dish at a time → my Order one dish at a time → deal.
// Skip is local only; the host always waits the full introMs().
async function introWait(ms: number, tok: number, stop: () => boolean) {
  let left = ms, last = performance.now();
  while (left > 0 && !stop() && tok === gameToken) {
    await new Promise(r => setTimeout(r, Math.min(50, left)));
    const now = performance.now();
    if (!document.hidden) left -= now - last;                         // countdown pauses while the tab is hidden
    last = now;
  }
}
// one step: items (.ii) appear `step` ms apart; 1st tap shows the rest now, a tap during the hold ends the step
async function introStep(id: 'menu' | 'order', html: string, step: number, hold: number, tok: number, keep = false) {
  const m = $(id + 'IntroModal');
  $(id + 'IntroBox').innerHTML = html;
  const items = [...m.querySelectorAll<HTMLElement>('.ii')];
  let tapped = catchUp;
  const tap = () => { tapped = true; };
  m.addEventListener('pointerup', tap);
  m.classList.add('show');
  for (let i = 0; i < items.length && tok === gameToken; i++) {
    if (tapped) { items.slice(i).forEach(e => e.classList.add('in', 'now')); break; }
    items[i].classList.add('in');
    if (i < items.length - 1) await introWait(step, tok, () => tapped);
  }
  tapped = catchUp;
  await introWait(dur(T.introPop + hold), tok, () => tapped);
  m.removeEventListener('pointerup', tap);
  if (!keep) m.classList.remove('show');
  checkToken(tok);
}
// 10 Rule 3/5: the overlay fades while each dish flies + shrinks into its slot (Menu → #menu-rail, Order → #my-order)
async function introLand(id: 'menu' | 'order', tok: number) {
  const m = $(id + 'IntroModal');
  m.querySelectorAll('.ii').forEach(e => e.classList.add('now'));     // measure the settled layout, not a mid-flip frame
  const imgs = [...m.querySelectorAll<HTMLImageElement>('.ii img')];
  const from = imgs.map(e => e.getBoundingClientRect());
  let targets: HTMLElement[];
  if (id === 'menu') { railHidden = false; renderRail(); targets = [...document.querySelectorAll<HTMLElement>('#menu-rail .menu-item')]; }
  else { orderHidden = false; orderKey = ''; render(); targets = [...document.querySelectorAll<HTMLElement>('#my-order .order-row')]; }
  const [each, stagger] = id === 'menu' ? [MENU_LAND_MS, MENU_LAND_STAGGER_MS] : [ORDER_LAND_MS, ORDER_LAND_STAGGER_MS];
  targets.forEach(t => { t.style.visibility = 'hidden'; });
  m.classList.add('leaving');
  targets.forEach((t, i) => {
    const a = from[i]; if (!a || !imgs[i]) { t.style.visibility = ''; return; }
    const b = (id === 'menu' ? t.querySelector('img') ?? t : t).getBoundingClientRect();
    const f = document.createElement('img');
    f.className = 'intro-fly ' + id; f.src = imgs[i].src; f.draggable = false;
    Object.assign(f.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.appendChild(f);
    const s = b.height / a.height, delay = dur(i * stagger), ms = dur(each);
    f.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${b.left - a.left}px,${b.top - a.top}px) scale(${s})`, opacity: .6 }],
      { duration: ms, delay, easing: 'cubic-bezier(.5,0,.25,1)', fill: 'forwards' });
    setTimeout(() => { f.remove(); if (tok === gameToken) { t.style.visibility = ''; t.classList.add('land'); } }, delay + ms);
  });
  await wait(dur((targets.length - 1) * stagger + each));
  document.querySelectorAll('.intro-fly.' + id).forEach(e => e.remove());
  targets.forEach(t => { t.style.visibility = ''; });
  m.classList.remove('show', 'leaving');
  checkToken(tok);
}
async function menuIntro(tok: number) {
  const s = g();
  const item = (r: Recipe) => `<div class="ii cc-${r.c}"><img src="${ART}Food/${r.img}" alt="" draggable="false"><b>${r.dish}</b><span class="c">${COURSE_NAME[r.c]} · +${r.pts}</span></div>`;
  await introStep('menu', `<h2>Today's menu</h2><div class="grid">${s.menu.map(item).join('')}</div><div class="skip">Tap to skip</div>`,
    MENU_ITEM_REVEAL_MS, MENU_HOLD_MS, tok, true);
  await introLand('menu', tok);
  await wait(dur(T.introSwap));
  await introStep('order', `<h2>Your order</h2><p class="goal">Cook every dish on this list to <b>end the match instantly</b> and score a big bonus <b>+${ORDER_BONUS}</b>.<br>You can still cook anything else on the Menu for points.</p>` +
    `<div class="grid">${recipesOf(s.order).map(item).join('')}</div><div class="skip">Tap to skip · only you can see this</div>`,
    ORDER_ITEM_REVEAL_MS, ORDER_HOLD_MS, tok, true);
  await introLand('order', tok);
  await wait(dur(T.menuGap));
  checkToken(tok);
}

// recipe popover shared by .menu-item and .order-row
const pop = () => $('recipe-pop');
function showPop(el: HTMLElement) {
  const r = recipeByDish(el.dataset.menu!); if (!r || !G) return;
  const hand = G.me.hand;
  const p = pop();
  p.className = 'cc-' + r.c;
  p.innerHTML = `<div class="t"><span class="cdot">${r.c}</span><span>${r.dish}</span><span class="pt">+${r.pts}</span></div><div class="ings">${r.types.map(t =>
    `<span class="ing${hand.includes(t) ? ' have' : ''}"><img src="${ART}Card/${CARDS[t][1]}" alt="" draggable="false">${label(t)}</span>`).join('')}</div>`;
  p.hidden = false;
  const er = el.getBoundingClientRect(), pr = p.getBoundingClientRect();
  const below = er.bottom + 6 + pr.height < window.innerHeight;
  p.style.left = clamp(er.left + er.width / 2 - pr.width / 2, 6, window.innerWidth - pr.width - 6) + 'px';
  p.style.top = (below ? er.bottom + 6 : er.top - pr.height - 6) + 'px';
  popFor = el.dataset.menu!;
}
let popFor: string | null = null, popTimer: ReturnType<typeof setTimeout> | undefined;
function hidePop() { clearTimeout(popTimer); popFor = null; pop().hidden = true; }

function renderTimer() {
  const el = $('cTimer');
  const s = G;
  const on = !!(s && s.deadline && ['draw', 'play', 'claim'].includes(s.phase));
  el.hidden = !on;
  if (!on) return;
  const left = Math.max(0, Math.ceil((s!.deadline! - Date.now()) / 1000));
  el.textContent = `⏱ ${left}s`;
  el.classList.toggle('low', left <= 5);
}
setInterval(renderTimer, 250);

const STACK_DY = 16;
const PREP_W = 76, PREP_H = 106;
const FAN_DX = 40, FAN_ROT = 6, FAN_DIP = 5, FAN_H = PREP_H + 26;

function renderFan(me: Me) {
  const s = g();
  const fan = $('hand-fan'), ui = $('fan-ui');
  const live = s.phase === 'play' || s.phase === 'claim';
  fan.classList.toggle('live', live);
  const W = fan.clientWidth, H = fan.clientHeight;
  const hand = me.groups.filter(x => !x.table);
  const groups = s.dealing ? hand.slice(0, s.dealt![me.idx]) : hand;
  const n = groups.length;
  const FW = W - 64;
  const sp = n > 1 ? clamp((FW - 96) / (n - 1), 44, 70) : 0;
  const total = 96 + sp * (n - 1);
  const tableR = rectOf($('alu-table')), fanR = rectOf(fan);
  const tableCenter = tableR.left + tableR.width / 2 - fanR.left;
  const x0 = clamp(tableCenter - total / 2, 0, Math.max(0, W - total)), mid = (n - 1) / 2;
  const rotStep = Math.min(3, 28 / Math.max(n, 1));
  const base = Math.max(2, H - 134 - 4);
  const dip = mid > 0 ? 12 / (mid * mid) : 0;
  let useful = new Set<CardType>();
  if (s.phase === 'play') useful = new Set(formable(me.hand, s.menu).flatMap(r => r.types));
  if (s.phase === 'claim' && s.claimOpts) useful = new Set(s.claimOpts.opts.flatMap(r => r.types).filter(t => t !== s.claimOpts!.card));
  const newOn = s.newUid !== null && Date.now() - s.newAt < T.newRing;
  const need = needTypes(me);
  const keep = new Map<string, HTMLElement>();
  fan.querySelectorAll<HTMLElement>(':scope > .hgroup').forEach(e => keep.set(e.dataset.gid!, e));
  let uiHtml = '';
  groups.forEach((gr, i) => {
    const d = i - mid;
    const x = x0 + i * sp, yb = base + d * d * dip, r = d * rotStep;
    const cnt = gr.food ? 1 : gr.cards.length;
    const hStack = 134 + STACK_DY * (cnt - 1);
    const yTop = yb - STACK_DY * (cnt - 1);
    let el = keep.get(String(gr.id));
    if (el) keep.delete(String(gr.id));
    else { el = document.createElement('div'); el.dataset.gid = String(gr.id); el.innerHTML = '<div class="wob"></div>'; fan.insertBefore(el, ui); }
    const hint = ['drop-ok', 'drop-bad'].filter(c => el!.classList.contains(c));
    el.className = 'hgroup' + (cnt > 1 ? ' stack' : '') + (gr.cooking ? ' locked' : '') + (hint.length ? ' ' + hint.join(' ') : '');
    el.style.cssText = `--x:${x}px;--y:${yTop}px;--r:${r}deg;height:${hStack}px;z-index:${i + 1}`;
    const wob = el.firstChild as HTMLElement;
    wob.style.animationDelay = `-${(i * .37) % 2.6}s`;
    let inner = '';
    gr.cards.forEach((c, k) => {
      const cls: string[] = [];
      if (k === cnt - 1) cls.push('top');
      if (gr.cooking) cls.push('locked');
      if (c.claim) cls.push('claimable');
      else if (useful.has(c.t) && !gr.cooking) cls.push('useful');
      if (!c.claim && need.has(c.t)) cls.push('need');
      const isNew = c.uid === s.newUid;
      if (isNew && newOn) cls.push('new');
      if ((isNew && s.drawHidden) || c.arriving || (drag && drag.ghost && drag.src.uid === c.uid)) cls.push('incoming');
      if (c.settle) { cls.push('settle'); c.settle = false; }
      inner += ingHTML(c.t, 'hand', cls.join(' '), `style="top:${k * STACK_DY}px" data-drag="hand" data-uid="${c.uid}" ${c.claim ? 'data-claim="1"' : ''}`);
    });
    if (gr.cooking) inner = progHTML(gr.cookStart) + inner;
    wob.innerHTML = inner;
  });
  keep.forEach(e => e.remove());
  if (s.fanMsg) uiHtml += `<div class="fan-msg">${s.fanMsg}</div>`;
  ui.innerHTML = uiHtml;
  renderPrep(me, useful);
}

// the one table stack (02 Rule 9–15), centred in the cook zone
function renderPrep(me: Me, useful: Set<CardType>) {
  const s = g();
  const box = $('prep');
  const W = box.clientWidth, H = box.clientHeight;
  const groups = me.groups.filter(x => x.table);
  const n = groups.length;
  const keep = new Map<string, HTMLElement>();
  box.querySelectorAll<HTMLElement>(':scope > .hgroup').forEach(e => keep.set(e.dataset.gid!, e));
  const cookable = groups.map(x => canCook(x));
  const btns = new Set<HTMLElement>();
  let uiHtml = '';
  groups.forEach((gr, i) => {
    const cnt = gr.food ? 1 : gr.cards.length;
    const mid = (cnt - 1) / 2;
    const fanW = gr.food ? PREP_W : PREP_W + FAN_DX * (cnt - 1);
    const x = W / 2 - fanW / 2, yTop = (H - FAN_H) / 2;
    let el = keep.get(String(gr.id));
    if (el) keep.delete(String(gr.id));
    else { el = document.createElement('div'); el.dataset.gid = String(gr.id); el.innerHTML = '<div class="wob"></div>'; box.appendChild(el); }
    const hint = ['drop-ok', 'drop-bad'].filter(c => el!.classList.contains(c));
    el.className = 'hgroup' + (cnt > 1 ? ' stack' : '') + (gr.cooking ? ' locked' : '') + (hint.length ? ' ' + hint.join(' ') : '');
    el.style.cssText = `--x:${x}px;--y:${yTop}px;--r:0deg;width:${fanW}px;height:${FAN_H}px;z-index:${i + 1}`;
    const wob = el.firstChild as HTMLElement;
    wob.style.animation = 'none';
    let inner = '';
    if (gr.food) {
      const hid = drag && drag.ghost && drag.src.kind === 'food' && drag.src.gid === gr.id;
      inner = foodHTML(gr.food, 'prep', 'top useful' + (gr.fresh ? ' pop-in shine' : '') + (hid ? ' incoming' : ''), `data-drag="food" data-gid="${gr.id}" style="left:0;top:${(FAN_H - PREP_H) / 2}px"`);
      gr.fresh = false;
    } else {
      const dip = mid > 0 ? FAN_DIP / (mid * mid) : 0;
      gr.cards.forEach((c, k) => {
        const cls: string[] = [];
        if (k === cnt - 1) cls.push('top');
        if (gr.cooking) cls.push('locked');
        if (c.claim) cls.push('claimable');
        else if (useful.has(c.t) && !gr.cooking) cls.push('useful');
        if (c.arriving || (drag && drag.ghost && drag.src.uid === c.uid)) cls.push('incoming');
        if (c.settle) { cls.push('settle'); c.settle = false; }
        const d = k - mid, rot = d * FAN_ROT, y = (FAN_H - PREP_H) / 2 + d * d * dip;
        inner += ingHTML(c.t, 'prep', cls.join(' '), `style="left:${k * FAN_DX}px;top:${y}px;transform:rotate(${rot}deg)" data-drag="hand" data-uid="${c.uid}" ${c.claim ? 'data-claim="1"' : ''}`);
      });
      if (gr.cooking) inner = progHTML(gr.cookStart) + inner;
    }
    wob.innerHTML = inner;
    const cr = cookable[i];
    if (cr) {                                                         // reuse the button across renders so its pop-in plays once (Tuning pass (9))
      let b = box.querySelector<HTMLElement>(`:scope > .cookbtn[data-gid="${gr.id}"]`);
      if (!b) { b = elFrom(`<button class="primary cookbtn" data-act="cook" data-gid="${gr.id}">COOK</button>`); box.appendChild(b); }
      b.title = `Cook ${cr.dish} +${cr.pts}`;
      b.style.cssText = `left:${x + fanW / 2}px;top:${yTop + FAN_H - 22}px;translate:-50% 0`;   // `translate`, not `transform`: the pop-in `scale` would shrink a transform offset
      btns.add(b);
    }
  });
  keep.forEach(e => e.remove());
  box.querySelectorAll(':scope > .cookbtn').forEach(e => { if (!btns.has(e as HTMLElement)) e.remove(); });
  box.querySelectorAll(':scope > .prep-tip').forEach(e => e.remove());
  if (!n && !tipDone && Date.now() < tipUntil && s.phase === 'play') uiHtml += `<div class="prep-tip">Stack here to cook</div>`;
  box.insertAdjacentHTML('beforeend', uiHtml);
}

// ---------------------------------------------------------------- animation
const sized = (r: Rect, w: number, h: number): Rect => ({ left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h });

function fly(html: string, from: Rect, to: Rect, msIn: number, opt: { arc?: number; spin?: number; easing?: string } = {}) {
  const ms = dur(msIn);
  const el = elFrom(html);
  el.style.cssText += `;position:fixed;left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;margin:0;transform-origin:0 0;`;
  $('fx').appendChild(el);
  const dx = to.left - from.left, dy = to.top - from.top, sx = to.width / from.width, sy = to.height / from.height;
  const arc = opt.arc ?? Math.min(140, Math.hypot(dx, dy) * .25 + 20);
  const cx = dx / 2, cy = dy / 2 - arc;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14, u = 1 - t;
    const x = 2 * u * t * cx + t * t * dx, y = 2 * u * t * cy + t * t * dy;
    const rot = (opt.spin || 0) * Math.sin(Math.PI * t);
    frames.push({ transform: `translate(${x}px,${y}px) rotate(${rot}deg) scale(${1 + (sx - 1) * t},${1 + (sy - 1) * t})` });
  }
  el.animate(frames, { duration: ms, easing: opt.easing || 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
  return wait(ms).finally(() => el.remove());
}

function backsTarget(p: CP): Rect {
  if (p.idx === g().you) return sized(rectOf($('hand-fan')), 40, 56);
  const bk = seatEl(p.idx).querySelector('.seat-hand-backs') as HTMLElement;
  const r = rectOf(bk);
  return { left: r.left + Math.min(+(bk.dataset.next || 0), r.width - 40), top: r.top + 1, width: 40, height: 56 };
}

async function dealAnim(tok: number) {
  const s = g();
  const n = s.players.length;
  s.dealing = true; s.dealt = s.players.map(() => 0); s.dealSkip = false; render();
  await wait(200);
  const poolR = rectOf($('pool-pile'));
  for (let k = 0; k < HAND_SIZE && !s.dealSkip; k++) for (let j = 0; j < n && !s.dealSkip; j++) {
    const i = (s.current + j) % n, p = s.players[i];
    const mine = i === s.you;
    const to = mine ? sized(rectOf($('hand-fan')), 96, 134) : backsTarget(p);
    fly(backHTML(mine ? 'center' : 'mini'), mine ? poolR : sized(poolR, 40, 56), to, T.deal, { arc: 30, spin: mine ? 0 : 8 })
      .then(() => { if (s.dealing) { s.dealt![i]++; softRender(); } }).catch(noop);
    await wait(dur(T.dealStagger));
  }
  if (s.dealSkip) $('fx').innerHTML = '';
  else await wait(dur(T.deal + 60));
  checkToken(tok);
  s.dealing = false; s.dealt = null; render();
}

async function animPlay(p: CP, card: CardType) {
  const s = g();
  const to = rectOf($('last-slot'));
  const mine = p.idx === s.you;
  const from = mine ? (s.playFrom || sized(rectOf($('hand-fan')), 96, 134)) : backsTarget(p);
  s.playFrom = null;
  await fly(ingHTML(card, mine ? 'hand' : 'mini'), from, to, T.play);
}
async function animClaimToSeat(q: CP, card: CardType, fromRect: Rect | null) {
  g().lastHidden = true; render();
  const from = fromRect || rectOf($('last-slot'));
  await fly(ingHTML(card, 'center'), from, backsTarget(q), 300);
}

// 02 Rule 15: other seats show mini stack → progress → food card at .seat-stack (stays until reveal)
async function seatCook(p: CP, r: Recipe) {
  const b = p.stk;
  const se = seatEl(p.idx);
  const fromR = backsTarget(p);
  b.food = null; b.collecting = null;
  b.stack = r.types.map(t => ({ t })); b.arriving = b.stack.length; render();
  for (let i = 0; i < b.stack.length; i++) {
    const cards = se.querySelectorAll('.seat-stack .stack .card');
    if (cards[i]) await fly(ingHTML(b.stack[i].t, 'bstk'), fromR, rectOf(cards[i]), T.stackFly, { arc: 16 });
    b.arriving--; render();
  }
  await wait(dur(200));
  b.cooking = true; b.cookStart = Date.now(); render();
  await wait(dur(COOK_MS));
  b.cooking = false; b.stack = []; b.food = r; render();
  smokeAt(rectOf(se.querySelector('.seat-stack')!));
}
async function seatCollect(p: CP, r: Recipe) {
  const b = p.stk;
  const se = seatEl(p.idx);
  if (!b.food) return;
  await wait(dur(450));
  const fromF = rectOf(se.querySelector('.seat-stack .card') || se.querySelector('.seat-stack')!);
  b.food = null; b.collecting = r; render();
  const fr = rectOf(se.querySelector('.seat-foods')!);
  const fs = 44;
  const to = { left: fr.left + Math.min(p.foods.length * (fs + 4), fr.width - fs), top: fr.top + (fr.height - fs) / 2, width: fs, height: fs };
  await fly(foodHTML(r, 'bstk'), fromF, { left: to.left, top: to.top, width: 48, height: 67 }, 400);
  b.collecting = null;
  return to;
}

// one fold per group: the local timer and a late host event may both ask for it (Tuning pass (9))
const folding = new WeakMap<Group, Promise<void>>();
function finishCook(gr: Group) {
  let p = folding.get(gr);
  if (!p) { p = foldCook(gr); folding.set(gr, p); }
  return p;
}
// start the fold the moment the progress bar ends, not when the host's next event arrives
function foldWhenDone(gr: Group) {
  const tok = gameToken;
  wait(Math.max(0, gr.cookStart + COOK_MS - Date.now()))
    .then(() => { if (tok === gameToken && ME().groups.includes(gr) && gr.cooking) return finishCook(gr); }).catch(noop);
}
async function foldCook(gr: Group) {
  // ui/table.md Tuning pass (8): fold each card onto the middle one — the group itself never moves
  const el = document.querySelector(`#prep .hgroup[data-gid="${gr.id}"]`) as HTMLElement | null;
  if (el) {
    const cards = [...el.querySelectorAll<HTMLElement>('.card')];
    const mid = (cards.length - 1) / 2, yMid = (FAN_H - PREP_H) / 2;
    const anims = cards.map((c, k) => c.animate([
      { transform: c.style.transform || 'none', top: c.style.top },
      { transform: `translateX(${(mid - k) * FAN_DX}px) rotate(0deg)`, top: `${yMid}px`, offset: .75 },
      { transform: `translateX(${(mid - k) * FAN_DX}px) scale(.9, .96)`, top: `${yMid}px` },
    ], { duration: dur(T.fanClose), easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }));
    const tok = gameToken;
    await Promise.race([Promise.all(anims.map(a => a.finished)).catch(noop), wait(dur(T.fanClose) + 80).catch(noop)]);   // hidden tabs may never finish WAAPI
    checkToken(tok);
  }
  gr.cooking = false; gr.food = gr.cookR; gr.cards = []; gr.fresh = true;
  render();
  el?.getAnimations().forEach(a => a.finish());                       // fan → food narrows the group: snap, don't slide its --x
  if (el) smokeAt(rectOf(el));
}

// 02 Rule 12: food card → #my-foods
async function collectFly(gr: Group, r: Recipe, fromRect: Rect, viaClaim: boolean) {
  const s = g(), me = s.me;
  const i = me.groups.indexOf(gr); if (i >= 0) me.groups.splice(i, 1);
  s.collectPending = r;
  s.foodIncoming = r; render();
  const ph = $('my-foods').querySelector('.fcard.incoming');
  const to = ph ? rectOf(ph) : sized(rectOf($('my-foods')), 64, 64);
  await fly(foodHTML(r, 'hand'), fromRect, { left: to.left, top: to.top, width: 64 * 96 / 134, height: 64 }, T.collect);
  s.foodIncoming = null;
  if (!viaClaim && s.phase === 'collecting') s.phase = 'play';
  scorePop(to, 'score-' + me.idx, r);
  render();
}
function collectFromGroup(gr: Group, viaClaim: boolean) {
  const el = document.querySelector(`#prep .hgroup[data-gid="${gr.id}"] .card`);
  const fromRect = el ? rectOf(el) : sized(rectOf($('prep')), PREP_W, PREP_H);
  return collectFly(gr, gr.food!, fromRect, viaClaim);
}

function collectFood(gr: Group | undefined, fromRect: Rect) {
  const s = g();
  if (s.phase !== 'play' || !gr || !gr.food) return;
  s.phase = 'collecting'; s.expectPlay = true;
  hooks!.send({ t: 'collect' });
  s.collectPromise = collectFly(gr, gr.food, fromRect, false).catch(e => { if (!(e instanceof Abort)) console.error(e); });
}

function scorePop(fromRect: Rect, scoreId: string, r: Recipe) {
  const el = document.createElement('div'); el.className = 'pop';
  el.innerHTML = `+${r.pts}<small>${r.c}</small>`;
  const x = fromRect.left + fromRect.width / 2, y = fromRect.top + fromRect.height / 2;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  document.body.appendChild(el);
  const t = document.getElementById(scoreId), tr = t ? rectOf(t) : null;
  const dx = tr ? tr.left + tr.width / 2 - x : 0, dy = tr ? tr.top + tr.height / 2 - y : -30;
  el.animate([
    { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
    { transform: 'translate(-50%,-50%) scale(1.2)', opacity: 1, offset: .2 },
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .3 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.8)`, opacity: .85 },
  ], { duration: 650, easing: 'ease-in', fill: 'forwards' });
  setTimeout(() => {
    el.remove();
    const sc = document.getElementById(scoreId); if (sc) { sc.classList.remove('punch'); void sc.offsetWidth; sc.classList.add('punch'); }
  }, 650);
}

function smokeAt(r: Rect) {
  for (let i = 0; i < 4; i++) {
    const s = document.createElement('div'); s.className = 'smoke';
    s.style.left = (r.left + r.width * (.25 + i * .17) - 9) + 'px'; s.style.top = (r.top + 10) + 'px';
    document.body.appendChild(s);
    s.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${(Math.random() - .5) * 16}px,-24px) scale(1.3)`, opacity: 0 }],
      { duration: 450, easing: 'ease-out', fill: 'forwards' });
    setTimeout(() => s.remove(), 460);
  }
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string, ms = T.toast) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

// ---------------------------------------------------------------- host events
const queue: HostEvent[] = [];
let pumping = false;

export function onHostEvent(ev: HostEvent) {
  if (!hooks) return;
  if (ev.t === 'log') return;                                         // ui/table.md (7): no Log UI — host still sends
  if (ev.t === 'toast') { toast(ev.msg); return; }
  if (ev.t === 'reject') { toast(ev.msg, 1500); return; }
  if (ev.t === 'start' || ev.t === 'sync') { queue.length = 0; gameToken++; }
  queue.push(ev);
  pump();
}

async function pump() {
  if (pumping) return;
  pumping = true;
  while (queue.length) {
    catchUp = queue.length > 4;
    const ev = queue.shift()!;
    try { await handle(ev); }
    catch (e) { if (!(e instanceof Abort)) console.error(e); }
  }
  catchUp = false;
  pumping = false;
}

function resetTableDom() {
  $('endModal').classList.remove('show');
  $('fx').innerHTML = ''; $('drag-layer').innerHTML = ''; drag = null;
  document.querySelectorAll('.pop,.smoke,.intro-fly').forEach(e => e.remove());
  $('menuIntroModal').classList.remove('leaving'); $('orderIntroModal').classList.remove('leaving');
  $('toast').classList.remove('show');
  $('my-foods').classList.remove('hot');
  $('menuIntroModal').classList.remove('show'); $('orderIntroModal').classList.remove('show');
  hidePop(); orderKey = ''; justDone = null;
  document.querySelectorAll('#hand-fan > .hgroup, #prep > .hgroup').forEach(e => e.remove());
  foodsKey = '';
}

async function handle(ev: HostEvent) {
  const tok = gameToken;
  switch (ev.t) {
    case 'start': {
      resetTableDom();
      buildState(ev.view);
      const s = g();
      s.dealing = true; s.dealt = s.players.map(() => 0);            // hand stays hidden under the intro
      railHidden = orderHidden = true;
      buildSeats(); renderRail(); render();
      await menuIntro(tok);
      await dealAnim(tok);
      return;
    }
    case 'sync': {
      resetTableDom();
      buildState(ev.view);
      railHidden = orderHidden = false;                  // rejoin: no intro replay
      renderRail();
      const s = g();
      s.phase = ev.view.ended ? 'over' : ev.phase;
      s.deadline = ev.msLeft !== null ? Date.now() + ev.msLeft : null;
      if (ev.claim) s.claimOpts = { card: ev.claim.card, by: ev.claim.by, opts: ev.claim.opts.map(d => recipeByDish(d)!) };
      if (ev.food) {                                                 // a cook in progress / uncollected food survives the resync
        const r = recipeByDish(ev.food)!;
        const gr = newGroup([], true); gr.food = r; gr.cookR = r;
        s.collectPending = r; syncHand(s.me); s.collectPending = null;
        s.me.groups.push(gr);
      }
      buildSeats(); render();
      if (ev.view.ended) showEnd(null, null);
      return;
    }
    case 'prompt': {
      const s = g();
      applyView(ev.view);
      s.deadline = ev.msLeft !== null ? Date.now() + ev.msLeft : null;
      s.expectPlay = false;
      if (ev.kind === 'draw') s.phase = 'draw';
      else {
        s.phase = 'play';
        if (!tipDone && !tipUntil) { tipUntil = Date.now() + T.tip; setTimeout(() => { tipDone = true; render(); }, T.tip + 30); }
      }
      s.fanMsg = '';
      render();
      return;
    }
    case 'draw': {
      const s = g();
      const p = s.players[ev.seat];
      const ms = ev.refill ? REFILL_STAGGER_MS : T.draw;             // 08 Rule 11 — same constant the host waits
      if (ev.seat === s.you) {
        s.phase = 'wait';
        const [nc] = applyView(ev.view);
        s.newUid = nc ? nc.uid : null; s.newAt = Date.now(); s.drawHidden = true;
        render();
        const el = $('hand-fan').querySelector(`.card[data-uid="${s.newUid}"]`);
        const to = el ? rectOf(el) : sized(rectOf($('hand-fan')), 96, 134);
        await fly(ingHTML(ev.card!, 'center', 'shine'), rectOf($('pool-pile')), to, ms);
        s.drawHidden = false; render();
        const uid = s.newUid;
        setTimeout(() => { if (G && G.newUid === uid) render(); }, T.newRing + 30);
      } else {
        await fly(backHTML('center'), rectOf($('pool-pile')), backsTarget(p), ms);
        applyView(ev.view); render();
      }
      return;
    }
    case 'cookShow': {
      const s = g();
      if (ev.seat === s.you) return;
      applyView(ev.view);
      await seatCook(s.players[ev.seat], recipeByDish(ev.dish)!);
      return;
    }
    case 'reveal': {
      const s = g();
      const r = recipeByDish(ev.dish)!;
      if (ev.seat === s.you) {
        if (ev.viaClaim) {
          const gr = s.me.groups.find(x => x.cookR === r && (x.cooking || x.food));
          if (gr) {
            if (gr.cooking) {
              const left = gr.cookStart + COOK_MS - Date.now();
              if (left > 0) await wait(dur(left));
              checkToken(tok);
              await finishCook(gr);
              await wait(dur(300)); checkToken(tok);
            }
            await collectFromGroup(gr, true);
          }
        } else if (s.collectPromise) {
          await s.collectPromise; s.collectPromise = null;
        } else {
          // collected for us (timeout / takeover): animate whatever is on the table
          const gr = s.me.groups.find(x => x.table && (x.food || x.cooking) && (x.cookR === r || x.food === r));
          if (gr) {
            if (gr.cooking) { const left = gr.cookStart + COOK_MS - Date.now(); if (left > 0) await wait(dur(left)); await finishCook(gr); }
            await collectFromGroup(gr, false);
          }
        }
        s.collectPending = null;
        if (s.phase === 'collecting') s.phase = ev.viaClaim ? 'wait' : 'play';
        const wasDone = orderDone(s.me, r.dish);
        applyView(ev.view);
        if (s.order.includes(r.dish) && !wasDone) {
          justDone = { dish: r.dish, at: Date.now() }; orderKey = '';
          toast(`Order ${s.order.filter(d => orderDone(s.me, d)).length}/${s.order.length} done`, 1500);
        }
        render();
      } else {
        const p = s.players[ev.seat];
        const to = await seatCollect(p, r);
        applyView(ev.view); render();
        if (to) scorePop(to, 'score-' + p.idx, r);
      }
      return;
    }
    case 'play': {
      const s = g();
      const p = s.players[ev.seat];
      if (ev.seat === s.you) {
        s.phase = 'wait'; s.deadline = null;
        if (s.playPending === null) {                                // played for us (timeout/takeover)
          s.playPending = ev.card;
          const f = s.me.groups.find(x => !x.table && x.cards.length === 1 && x.cards[0].t === ev.card);
          if (f) { const el = $('hand-fan').querySelector(`.hgroup[data-gid="${f.id}"] .card`); if (el) s.playFrom = rectOf(el); s.me.groups.splice(s.me.groups.indexOf(f), 1); }
        }
        render();
      }
      await animPlay(p, ev.card);
      s.playPending = null;
      applyView(ev.view);
      s.lastHidden = false; s.lastJust = true;
      render(); s.lastJust = false;
      return;
    }
    case 'claimOpen': {
      const s = g();
      applyView(ev.view);
      s.phase = 'claim'; s.expectPlay = false;
      s.claimOpts = { card: ev.card, by: ev.by, opts: ev.opts.map(d => recipeByDish(d)!) };
      s.deadline = ev.msLeft !== null ? Date.now() + ev.msLeft : null;
      render();
      return;
    }
    case 'claimClose': {
      const s = g();
      if (s.phase === 'claim') { stripClaim(s.me); s.phase = 'wait'; s.claimOpts = null; }
      s.deadline = null;
      applyView(ev.view); render();
      return;
    }
    case 'claimResult': {
      const s = g();
      const w = s.players[ev.winner];
      if (ev.winner === s.you) {
        for (const gr of s.me.groups) gr.cards.forEach(c => (c.claim = false));
        s.lastHidden = true; s.claimOpts = null; s.phase = 'collecting';
        applyView(ev.view); render();
        const cg = s.me.groups.find(x => x.cooking);                 // won: fold on our own clock, 'reveal' comes ~1s after COOK_MS
        if (cg) foldWhenDone(cg);
        return;
      }
      let fromEl: Rect | null = null;
      if (ev.yourPts !== null) {                                     // 03 Rule 13
        const ce = document.querySelector('#prep .card[data-claim="1"]');
        fromEl = ce ? rectOf(ce) : null;
        stripClaim(s.me);
        toast(`${w.name} took it — ${ev.dish} ${ev.pts} ${ev.pts > ev.yourPts ? '>' : '='} ${ev.yourPts}`);
      }
      if (s.phase === 'claim' || s.phase === 'claimCook') s.phase = 'wait';
      s.claimOpts = null;
      render();
      await animClaimToSeat(w, ev.card, fromEl);
      applyView(ev.view); render();
      return;
    }
    case 'discard': {
      const s = g();
      s.lastHidden = true; render();
      await fly(ingHTML(ev.card, 'center'), rectOf($('last-slot')), rectOf($('discard-slot')), T.discard, { arc: 20 });
      applyView(ev.view); s.lastHidden = false; render();
      return;
    }
    case 'emptyHand': {
      const s = g();
      applyView(ev.view);
      if (ev.seat === s.you) {
        s.phase = 'wait'; s.deadline = null;
        s.fanMsg = 'No cards to play — waiting…'; render();
        await wait(1000);
        s.fanMsg = ''; render();
      }
      return;
    }
    case 'reject': {
      toast(ev.msg, 1500);
      return;
    }
    case 'end': {
      const s = g();
      applyView(ev.view);
      s.phase = 'over'; s.deadline = null; s.claimOpts = null; s.expectPlay = false;
      showEnd(ev.reason, ev.finisher);
      render();
      return;
    }
  }
}

const TICK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#f0e6d8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.4)" stroke="none"/><path d="M6 12 L10 16 L18 7"/></svg>';
const CROSS_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#a89a86" stroke-width="3" stroke-linecap="round"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.4)" stroke="none"/><path d="M7 7 L17 17 M17 7 L7 17"/></svg>';
const orderThumb = (r: Recipe, done: boolean) =>
  `<span class="othumb ${done ? 'done' : 'miss'}" title="${r.dish}${done ? ' — done' : ' — not done'}"><img src="${ART}Food/${r.img}" alt="" draggable="false">${done ? TICK_SVG : CROSS_SVG}</span>`;

function showEnd(reason: 'order' | 'pool' | null, finisher: number | null) {
  const s = g();
  const nameOf = (p: CP) => (p.idx === s.you ? 'You' : esc(p.name));
  const ranked = [...s.players].sort((a, b) => b.score - a.score);
  const top = ranked[0].score;
  const rows = ranked.map(p => {
    const foods = p.foods.map(f => `<span class="fitem">${foodThumb(f, 'th')}${f.dish}</span>`).join('') || '—';
    return `<tr class="${p.score === top ? 'win' : ''}"><td>${p.score === top ? '🏆 ' : ''}<b>${nameOf(p)}</b>${reason === 'order' && finisher === p.idx ? '<span class="tagfirst">Finished order first</span>' : ''}</td><td class="score" style="margin:0">${p.score}</td><td>${p.bonus ? '+' + p.bonus : ''}</td><td>${recipesOf(p.order || []).map(r => orderThumb(r, orderDone(p, r.dish))).join('')}</td><td>${foods}</td></tr>`;
  }).join('');
  const fin = finisher !== null ? s.players[finisher] : null;
  const why = reason === 'order' && fin ? `${nameOf(fin)} completed ${fin.idx === s.you ? 'your' : 'their'} order` : reason === 'pool' ? 'pool empty' : '';
  const again = !s.online || hooks!.isHost
    ? `<button class="primary" id="btnAgain">Play again</button>`
    : `<span class="chip">Waiting for host…</span>`;
  $('endBox').innerHTML = `<h2>Game over${why ? ' — ' + why : ''}</h2>
    <div style="color:var(--text-dim)">${reason === 'order' && fin ? `${nameOf(fin)} finished ${fin.idx === s.you ? 'your' : 'their'} order first (+${ORDER_BONUS}).` : reason === 'pool' ? 'Pool empty — no finish bonus.' : ''}
    Turns: ${s.turn} · Claims: ${s.claims} · Pool left: ${s.pool}</div>
    <table class="recipes" style="margin-top:8px"><tr><th>Player</th><th>Score</th><th>Bonus</th><th>Order</th><th>Foods</th></tr>${rows}</table>
    <div class="row">${again}<button id="btnCloseEnd">View table</button><button id="btnEndHome">Home</button></div>`;
  $('endModal').classList.add('show');
  document.getElementById('btnAgain')?.addEventListener('pointerup', () => { $('endModal').classList.remove('show'); hooks!.onAgain(); });
  $('btnCloseEnd').addEventListener('pointerup', () => $('endModal').classList.remove('show'));
  $('btnEndHome').addEventListener('pointerup', () => { $('endModal').classList.remove('show'); hooks!.onHome(); });
}

// ---------------------------------------------------------------- input
interface DragSrc { kind: string; el: HTMLElement; uid?: number; gid?: number | null; t?: CardType; claim?: boolean; table?: boolean; top?: boolean; solo?: boolean }
interface Drag { src: DragSrc; id: number; x0: number; y0: number; lx: number; lt: number; vx: number; tilt: number; ghost: HTMLElement | null; rect: Rect; tok: number; snapping?: boolean;
  trail: { x: number; y: number; t: number }[] }   // recent pointer path, for fling drops (ui/table.md Edge cases)
let drag: Drag | null = null;
const app = () => $('app');

// #17: a card dropped on the play slot before the host's play prompt was processed — keep it hidden in the
// hand and play it the moment the prompt lands; if it never does (game ended, claim window), show it again.
async function deferPlay(uid: number, fromRect: Rect) {
  const tok = gameToken, me = ME();
  const f = findCard(me, uid); if (!f) return;
  f.c.arriving = true; render();
  const t0 = Date.now();
  while (tok === gameToken && G && G.expectPlay && G.phase !== 'play' && Date.now() - t0 < 3000) await wait(30).catch(noop);
  if (tok !== gameToken || !G) return;
  const c = findCard(ME(), uid);
  if (c) c.c.arriving = false;
  if (G.phase !== 'play' || !playCard(uid, fromRect)) render();
}

function playCard(uid: number, fromRect: Rect) {                    // 03 Rule 1
  const s = g();
  if (s.phase !== 'play') return false;
  const me = ME();
  if (me.groups.some(x => x.cooking)) { toast('Wait for the cook to finish', 1200); return false; }
  if (me.groups.some(x => x.food)) { toast('Collect your food first', 1200); return false; }
  const f = findCard(me, uid); if (!f || f.c.claim || f.k !== f.g.cards.length - 1) return false;
  f.g.cards.splice(f.k, 1); dropEmptyGroups(me);
  s.phase = 'wait'; s.playFrom = fromRect; s.playPending = f.c.t; s.deadline = null;
  hooks!.send({ t: 'play', card: f.c.t });
  return true;
}

function cookPress(gid: number) {
  const gr = groupById(gid), r = canCook(gr); if (!gr || !r) return;
  const s = g();
  gr.cooking = true; gr.cookStart = Date.now(); gr.cookR = r;
  if (s.phase === 'claim') { s.phase = 'claimCook'; s.deadline = null; render(); hooks!.send({ t: 'claimCook', dish: r.dish }); return; }   // 03 Rule 12
  render();
  hooks!.send({ t: 'cook', dish: r.dish });
  foldWhenDone(gr);
}

function doAct(el: HTMLElement) {
  const s = G;
  if (!s || s.ended) return;
  const a = el.dataset.act;
  if (a === 'pool' && s.phase === 'draw') { s.phase = 'wait'; s.expectPlay = true; s.deadline = null; render(); hooks!.send({ t: 'draw' }); }
  else if (a === 'pass' && s.phase === 'claim') { stripClaim(ME()); s.phase = 'wait'; s.claimOpts = null; s.deadline = null; render(); hooks!.send({ t: 'pass' }); }
  else if (a === 'cook') cookPress(+el.dataset.gid!);
}

function onTap(src: DragSrc) {
  if (src.kind === 'hand' && src.table) { if (!src.claim) toHand(ME(), src.uid!); }
  else if (src.kind === 'hand') {
    if (g().phase === 'play' && !src.claim) {
      const ls = $('last-slot'); ls.classList.remove('play-flash'); void ls.offsetWidth; ls.classList.add('play-flash');
      setTimeout(() => ls.classList.remove('play-flash'), 460);
    }
  }
  else if (src.kind === 'claim') toast('Drag it onto a stack on the table to claim', 1500);
  else if (src.kind === 'food') collectFood(groupById(src.gid!), rectOf(src.el));
}

function inRect(el: Element | null, x: number, y: number, pad = 0) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
}
function hitAt(x: number, y: number): { kind: string; gid?: number; el?: HTMLElement } | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const gg = el.closest('.hgroup') as HTMLElement | null;
    if (gg) return { kind: 'group', gid: +gg.dataset.gid!, el: gg };
    if (el.closest('#my-foods')) return { kind: 'panel' };          // (7) food drop zone moved out of #my-panel
    if (el.closest('#center-play')) return { kind: 'center' };
  }
  if (inRect($('center-play'), x, y, 30)) return { kind: 'center' };
  if (inRect($('my-foods'), x, y, 6)) return { kind: 'panel' };
  if (inRect($('prep'), x, y, 16)) return { kind: 'table' };
  if (inRect($('hand-fan'), x, y, 20)) return { kind: 'fan' };
  return null;
}
function clearHints() {
  document.querySelectorAll('.hgroup.drop-ok, .hgroup.drop-bad').forEach(e => e.classList.remove('drop-ok', 'drop-bad'));
  $('my-foods').classList.remove('hot'); $('prep').classList.remove('hot', 'show'); $('last-slot').classList.remove('play-hot');
}
function flashBad(el: Element | null | undefined) {
  if (!el) return;
  el.classList.remove('bad-flash'); void (el as HTMLElement).offsetWidth; el.classList.add('bad-flash');
  setTimeout(() => el.classList.remove('bad-flash'), 220);
}
function consume(d: Drag) { const gr = rectOf(d.ghost!); d.ghost!.remove(); drag = null; return gr; }
function takeCard(me: Me, s: DragSrc): UCard | null {
  if (s.kind === 'claim') return { uid: ++UID, t: s.t!, claim: true };
  const f = findCard(me, s.uid!); if (!f) return null;
  f.g.cards.splice(f.k, 1); dropEmptyGroups(me);
  return f.c;
}
function onDrop(d: Drag, x: number, y: number): 'ok' | 'quiet' | 'bad' {
  const s = d.src, me = ME();
  const h = hitAt(x, y);
  if (s.kind === 'food') {
    if (h && h.kind === 'panel') { const gr = consume(d); collectFood(groupById(s.gid!), gr); return 'ok'; }
    return 'quiet';
  }
  const fromGroup = s.kind === 'hand';
  const place = (tg: Group | null, gr: Rect) => {
    const c = takeCard(me, s); if (!c) { render(); return; }
    c.arriving = true;
    if (tg) tg.cards.push(c); else me.groups.push(newGroup([c], true));
    tipDone = true;
    render();
    const ce = $('prep').querySelector(`.card[data-uid="${c.uid}"]`);
    const tok = gameToken;
    if (ce) fly(ingHTML(c.t, 'prep'), gr, rectOf(ce), T.stackFly, { arc: 10, easing: 'ease-out' })
      .then(() => { if (tok !== gameToken) return; c.arriving = false; c.settle = true; render(); }).catch(noop);
    else { c.arriving = false; render(); }
  };
  if (h && h.kind === 'group') {
    if (fromGroup && h.gid === s.gid) return 'quiet';
    const tg = groupById(h.gid!)!;
    if (!tg.table) {
      if (s.table && !s.claim) { consume(d); toHand(me, s.uid!); return 'ok'; }
      if (s.claim && s.table) { consume(d); takeCard(me, s); render(); return 'ok'; }
      return s.claim ? 'bad' : 'quiet';
    }
    const err = mergeReject(tg, s.t!);
    if (err) { flashBad(h.el); toast(err, 1200); return 'bad'; }
    place(tg, consume(d));
    return 'ok';
  }
  if (h && h.kind === 'table') {
    const tg = me.groups.find(x => x.table);
    if (!tg) { place(null, consume(d)); return 'ok'; }
    if (s.table) return 'quiet';
    const err = mergeReject(tg, s.t!);
    if (err) { flashBad($('prep').querySelector(`.hgroup[data-gid="${tg.id}"]`)); toast(err, 1200); return 'bad'; }
    place(tg, consume(d));
    return 'ok';
  }
  if (s.claim) {
    if (!fromGroup) return h && h.kind === 'center' ? 'quiet' : 'bad';
    consume(d); takeCard(me, s); render(); return 'ok';
  }
  if (h && h.kind === 'center') {
    if (!s.top) return 'bad';
    if (g().phase !== 'play' && g().expectPlay) { deferPlay(s.uid!, consume(d)); return 'ok'; }   // #17
    if (g().phase !== 'play') { toast(g().phase === 'claim' ? 'Not your turn — claim or Pass' : 'Not your turn', 1200); return 'bad'; }
    const gr = rectOf(d.ghost!);
    if (!playCard(s.uid!, gr)) return 'bad';
    consume(d); render(); return 'ok';
  }
  if (h && h.kind === 'fan') {
    if (!s.table) return 'quiet';
    consume(d); toHand(me, s.uid!); return 'ok';
  }
  return 'bad';
}
function toHand(me: Me, uid: number) {                               // 02 Rule 13
  const f = findCard(me, uid); if (!f || !f.g.table || f.g.cooking || f.c.claim) { render(); return; }
  f.g.cards.splice(f.k, 1); dropEmptyGroups(me);
  insertLoose(me, f.c);
  render();
}

function snapBack(d: Drag, bad: boolean) {
  const gh = d.ghost!; d.snapping = true;
  const gr = rectOf(gh);
  gh.style.transform = ''; gh.style.opacity = '';
  if (bad) gh.classList.add('invalid');
  gh.animate([{ left: gr.left + 'px', top: gr.top + 'px' }, { left: d.rect.left + 'px', top: d.rect.top + 'px' }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
  setTimeout(() => { gh.remove(); if (drag === d) { drag = null; render(); } }, 210);
}

function tiltLoop() {
  if (!drag || !drag.ghost || drag.snapping) return;
  drag.vx *= .85;
  const target = clamp(drag.vx * .05, -12, 12);
  drag.tilt += (target - drag.tilt) * .25;
  drag.ghost.style.transform = `rotate(${drag.tilt}deg) scale(1.05)`;
  requestAnimationFrame(tiltLoop);
}

function onPointerDown(e: PointerEvent) {
  const s = G;
  if (!s || !hooks) return;
  if (s.dealing) { s.dealSkip = true; return; }
  const target = e.target as HTMLElement;
  if (target.closest('[data-act]') || drag) return;
  const d = target.closest('[data-drag]') as HTMLElement | null; if (!d) return;
  const kind = d.dataset.drag!, me = ME();
  const src: DragSrc = { kind, el: d };
  if (kind === 'hand') {
    if (!['play', 'claim'].includes(s.phase) && !s.expectPlay) return;   // #17: don't swallow a grab made right after Draw/collect
    const f = findCard(me, +d.dataset.uid!); if (!f || f.g.cooking) return;
    if (f.c.claim && s.phase !== 'claim') return;
    Object.assign(src, { uid: f.c.uid, gid: f.g.id, t: f.c.t, claim: f.c.claim, table: f.g.table, top: f.k === f.g.cards.length - 1, solo: f.g.cards.length === 1 });
  } else if (kind === 'claim') {
    if (s.phase !== 'claim' || claimInGroup(me)) return;
    Object.assign(src, { t: s.lastPlayed, claim: true, gid: null });
  } else if (kind === 'food') {
    if (s.phase !== 'play') return;
    const gr = groupById(+d.dataset.gid!); if (!gr || !gr.food) return;
    src.gid = gr.id;
  } else return;
  e.preventDefault();
  try { app().setPointerCapture(e.pointerId); } catch { /* ignore */ }
  drag = { src, id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, lt: performance.now(), vx: 0, tilt: 0, ghost: null, rect: rectOf(d), tok: gameToken, trail: [] };
}

function onPointerMove(e: PointerEvent) {
  if (!drag || e.pointerId !== drag.id || drag.snapping) return;
  const s = drag.src;
  if (!drag.ghost) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
    const html = s.kind === 'food' ? foodHTML(groupById(s.gid!)!.food!, 'prep') : ingHTML(s.t!, s.kind === 'claim' ? 'center' : s.table ? 'prep' : 'hand');
    drag.ghost = elFrom(html);
    $('drag-layer').appendChild(drag.ghost);
    render();
    requestAnimationFrame(tiltLoop);
  }
  const now = performance.now(), dt = Math.max(1, now - drag.lt);
  const pts = e.getCoalescedEvents ? e.getCoalescedEvents() : [];   // a fast flick is coalesced into few moves — keep every point
  for (const p of pts.length ? pts : [e]) drag.trail.push({ x: p.clientX, y: p.clientY, t: now });
  while (drag.trail.length && now - drag.trail[0].t > FLING_MS) drag.trail.shift();
  drag.vx = drag.vx * .5 + ((e.clientX - drag.lx) / dt * 1000) * .5;
  drag.lx = e.clientX; drag.lt = now;
  const gh = drag.ghost!;
  gh.style.left = (e.clientX - gh.offsetWidth / 2 + GHOST_DX) + 'px';
  gh.style.top = (e.clientY - gh.offsetHeight / 2 + GHOST_DY) + 'px';
  clearHints();
  const h = hitAt(...dropPoint(drag, e.clientX, e.clientY, false));
  gh.style.opacity = '';
  if (s.kind === 'food') { if (h && h.kind === 'panel') $('my-foods').classList.add('hot'); }
  else if (h && h.kind === 'group' && h.gid !== s.gid && groupById(h.gid!)?.table) {
    const bad = mergeReject(groupById(h.gid!), s.t!);
    h.el!.classList.add(bad ? 'drop-bad' : 'drop-ok');
    if (bad) gh.style.opacity = '.6';
  }
  else if (h && h.kind === 'table' && !s.table) {
    const tg = ME().groups.find(q => q.table), bad = tg && mergeReject(tg, s.t!);
    $('prep').classList.add('hot');
    if (bad && tg) { gh.style.opacity = '.6'; const ge = $('prep').querySelector(`.hgroup[data-gid="${tg.id}"]`); if (ge) ge.classList.add('drop-bad'); }
  }
  if (s.kind !== 'food') {
    $('prep').classList.add('show');
    if (g().phase === 'play' && !s.claim && s.top && h && h.kind === 'center') $('last-slot').classList.add('play-hot');
  }
}

// Where a drop lands. The card is drawn 20px left / 40px above the pointer, and players aim with the card,
// not the cursor (Tuning pass (9): "lúc card nó đang nghiêng ngả chưa nằm thẳng thì thả ra sẽ không detect
// đúng") — so the card's centre is asked first, then the pointer. On a fling (playtest 2026-09-19 (3):
// "drag quá khu đó kiểu vẩy chuột ấy"), walk the last FLING_MS of the path backwards and use the most
// recent zone the card crossed. Nothing found → the pointer, as before. The hover hints use the same
// answer (without the fling walk), so what glows is what the drop does.
const FLING_MS = 150;
const GHOST_DX = -20, GHOST_DY = -40;
function dropPoint(d: Drag, x: number, y: number, fling = true): [number, number] {
  // The fan (and its cards) sits right under the cook zone. For a card taken from the hand, ending over the
  // fan or another hand card does nothing, so it is not a choice — keep looking. A card taken from the table
  // still returns to hand there.
  const fromHand = d.src.kind === 'hand' && !d.src.table && !d.src.claim;
  const noop = (h: ReturnType<typeof hitAt>) => !h || (fromHand && (h.kind === 'fan' || (h.kind === 'group' && !groupById(h.gid!)?.table)));
  const cands: [number, number][] = [[x + GHOST_DX, y + GHOST_DY], [x, y]];
  for (const [cx, cy] of cands) if (!noop(hitAt(cx, cy))) return [cx, cy];
  if (!fling) return [x, y];
  const now = performance.now();
  for (let i = d.trail.length - 1; i >= 0; i--) {
    const p = d.trail[i]; if (now - p.t > FLING_MS) break;
    for (const [cx, cy] of [[p.x + GHOST_DX, p.y + GHOST_DY], [p.x, p.y]]) { const h = hitAt(cx, cy); if (!noop(h) && h!.kind !== 'fan') return [cx, cy]; }
  }
  return [x, y];
}

function endDrag(e: PointerEvent, cancelled: boolean) {
  const d = drag!;
  try { app().releasePointerCapture(d.id); } catch { /* ignore */ }
  clearHints();
  if (d.snapping) return;
  if (d.tok !== gameToken || !G) { drag = null; $('drag-layer').innerHTML = ''; return; }
  if (!d.ghost) { drag = null; if (!cancelled) onTap(d.src); return; }
  const [x, y] = cancelled ? [e.clientX, e.clientY] : dropPoint(d, e.clientX, e.clientY);
  const res = cancelled ? 'bad' : onDrop(d, x, y);
  if (res !== 'ok' && drag === d) snapBack(d, res === 'bad');
}

let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  const a = app();
  a.addEventListener('pointerdown', onPointerDown);
  a.addEventListener('pointermove', onPointerMove);
  a.addEventListener('pointerup', e => {
    if (drag && e.pointerId === drag.id) { endDrag(e, false); return; }
    const act = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
    if (act) doAct(act);
  });
  a.addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.id) endDrag(e, true); });
  a.addEventListener('lostpointercapture', e => { if (drag && e.pointerId === drag.id && !drag.snapping && drag.ghost && drag.ghost.isConnected) endDrag(e, true); });
  $('btnHome').addEventListener('pointerup', () => hooks && hooks.onHome());
  let resizeT: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('resize', () => { hidePop(); clearTimeout(resizeT); resizeT = setTimeout(render, 60); });
  const menuEl = (e: Event) => (e.target as HTMLElement).closest?.('[data-menu]') as HTMLElement | null;
  document.addEventListener('pointerover', e => {                   // desktop hover, 150ms intent
    if (e.pointerType !== 'mouse') return;
    const el = menuEl(e); if (!el || el.dataset.menu === popFor) return;
    clearTimeout(popTimer); popTimer = setTimeout(() => showPop(el), 150);
  });
  document.addEventListener('pointerout', e => {
    if (e.pointerType !== 'mouse') return;
    const el = menuEl(e); if (el && !el.contains(e.relatedTarget as Node)) hidePop();
  });
  document.addEventListener('pointerup', e => {                     // touch/pen: tap toggles, tap elsewhere closes
    if (e.pointerType === 'mouse') return;
    const el = menuEl(e);
    if (el && el.dataset.menu !== popFor) showPop(el); else hidePop();
  });
  $('my-foods').addEventListener('scroll', hidePop);
}

// ---------------------------------------------------------------- public
export function enterTable(h: TableHooks) {
  wire();
  hooks = h;
  gameToken++;
  queue.length = 0;
  G = null;
  const room = $('cRoom');
  room.hidden = !h.roomCode;
  room.textContent = h.roomCode ? `Room ${h.roomCode}` : '';
}

export function leaveTable() {
  hooks = null;
  gameToken++;
  queue.length = 0;
  G = null;
  resetTableDom();
  $('seats').innerHTML = '';
}
