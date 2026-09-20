// Màn quán — design/ui/restaurant.md. Dựng HUD + lưới + 3 card điều hướng từ save (12-restaurant-meta.md).
// Kéo thả đồ trong lưới là ticket #25 (13-restaurant-grid.md); ở đây lưới chỉ dựng và đặt đồ đúng ô.
import './restaurant.css';
import { ART, RECIPES, type Recipe } from '../core/data';
import {
  CELL_MAX_PX, CELL_MIN_PX, GRID_COLS, GRID_ROWS, HOP_LIFT, HOP_MS, HOP_TILT,
  IDLE_TOUCH_MS, MENU_SLOTS, TICK_MS,
} from '../core/config';
import { itemDef } from '../meta/items';
import { menuFull, menuRecipes, toggleMenu, unlockDishes } from '../meta/menu';
import { CUS_H, CUS_W, awayIncome, newWorld, tickCustomers, type Customer, type Paid } from '../meta/customers';
import { applyReward, matchReward, xpToLevel, type Reward } from '../meta/economy';
import { shopEntries, shopEntry } from '../meta/shop';
import { loadSave, saveWarning, writeSave, type Save } from '../meta/save';
import { toast } from './table';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export interface RestaurantHooks {
  onBots(n: number): void;
  onCreate(): void;
  onJoin(code: string): void;
}

let S: Save = loadSave();          // nạp đúng một lần; từ đây S là bản authoritative trong phiên
let hooks: RestaurantHooks | null = null;
let wired = false;
let botCount = 4;

export const playerName = () => S.name.trim().slice(0, 12);
export const saveState = () => writeSave(S);

export function setJoinCode(code: string) { $<HTMLInputElement>('roomCode').value = code; }

export function restMsg(text = '', ok = false) {
  const m = $('rest-msg');
  m.textContent = text;
  m.classList.toggle('ok', ok);
}

// ---------------------------------------------------------------- HUD
function renderHud() {
  $<HTMLInputElement>('rest-name').value = S.name;
  $('rest-level').textContent = `Level ${S.level}`;
  $('rest-gold').textContent = String(S.gold);
  const need = xpToLevel(S.level);                             // 14- Rule 7
  $('rest-xptext').textContent = `${S.xp}/${need}`;
  $('rest-xp').style.width = Math.min(100, (S.xp / need) * 100) + '%';
  const warn = saveWarning();
  const w = $('rest-warn');
  w.hidden = !warn;
  w.textContent = warn || '';
  // 16- Rule 1: không có món hoặc không có bàn thì không có khách — nói thẳng ra một dòng.
  const hint = !menuRecipes(S).length ? 'Pick a dish for your menu.'
    : !S.items.some(i => i.type === 'table_basic') ? 'No tables — the shop sells one.' : '';
  const h = $('rest-hint');
  h.hidden = !hint;
  h.textContent = hint;
}

// ---------------------------------------------------------------- lưới + đồ đạc
// 13- Rule 3 + ui/restaurant.md Tuning pass (1): lưới phủ kín màn — cell tính trên TOÀN viewport,
// không trừ HUD/nav (hai cái đó nổi lên trên). Chật hơn sàn CELL_MIN_PX thì #rest-stage cuộn.
function cellSize() {
  const w = window.innerWidth, h = window.innerHeight;
  if (!(w > 0 && h > 0)) return CELL_MIN_PX;
  const fit = Math.floor(Math.min(w / GRID_COLS, h / GRID_ROWS));
  return Math.min(CELL_MAX_PX, Math.max(CELL_MIN_PX, fit));   // trần chặn card phình to trên màn rộng
}

// 13- Rule 13: đổi ô -> pixel cho mọi thứ vẽ trên lưới (khách nhảy từng ô ở đợt 2 sẽ dùng lại).
export function gridGeometry() {
  const r = $('rest-grid').getBoundingClientRect();
  return { cell: cellSize(), left: r.left, top: r.top };
}

const fits = (x: number, y: number, w: number, h: number) =>
  x >= 0 && y >= 0 && x + w <= GRID_COLS && y + h <= GRID_ROWS;

// 13- Rule 6: mọi ô trong footprint phải trong lưới và không bị món KHÁC chiếm.
function freeAt(x: number, y: number, w: number, h: number, exceptId = -1) {
  if (!fits(x, y, w, h)) return false;
  return !S.items.some(it => {
    if (it.id === exceptId) return false;
    const d = itemDef(it.type);
    return x < it.x + d.w && it.x < x + w && y < it.y + d.h && it.y < y + h;
  });
}

// 13- Rule 10: ô trống đầu tiên, quét trái->phải rồi trên->xuống.
export function firstFreeCell(w: number, h: number, exceptId = -1) {
  for (let y = 0; y + h <= GRID_ROWS; y++)
    for (let x = 0; x + w <= GRID_COLS; x++)
      if (freeAt(x, y, w, h, exceptId)) return { x, y };
  return null;
}

// 13- Rule 11: save có toạ độ ngoài lưới / chồng nhau -> dồn về ô trống đầu tiên, không mất đồ.
function repairPlacement() {
  let moved = 0;
  const placed: typeof S.items = [];
  for (const it of S.items) {
    const d = itemDef(it.type);
    const clash = placed.some(o => {
      const od = itemDef(o.type);
      return it.x < o.x + od.w && o.x < it.x + d.w && it.y < o.y + od.h && o.y < it.y + d.h;
    });
    if (!fits(it.x, it.y, d.w, d.h) || clash) {
      const spot = firstFreeCell(d.w, d.h, it.id);
      if (spot) { it.x = spot.x; it.y = spot.y; moved++; }
      else console.warn(`[meta] no room for ${it.type} — left where it was`);
    }
    placed.push(it);
  }
  if (moved) { console.warn(`[meta] ${moved} item(s) repositioned to fit the grid`); saveState(); }
}

function renderGrid() {
  const cell = cellSize();
  const g = $('rest-grid');
  g.style.width = GRID_COLS * cell + 'px';
  g.style.height = GRID_ROWS * cell + 'px';
  g.style.backgroundSize = `${cell}px ${cell}px`;
  g.innerHTML = '';
  for (const it of S.items) {
    const d = itemDef(it.type);
    // ui/restaurant.md Tuning pass (1): dùng đúng .card/.hdr/.ph của bàn chơi, chỉ đổi màu viền theo loại.
    const w = d.w * cell - 6, h = d.h * cell - 6;
    const el = document.createElement('div');
    el.className = `card ritem ${d.kind}`;
    el.dataset.id = String(it.id);
    el.dataset.drag = 'item';
    el.style.cssText = `--w:${w}px;--h:${h}px;--fs:${Math.max(9, Math.round(w * .11))}px;` +
      `left:${it.x * cell + 3}px;top:${it.y * cell + 3}px`;
    // art.md "Restaurant meta" §2: chưa có ảnh thì ô ảnh hiện chữ cái đầu; thả ảnh đúng đường dẫn là tự đổi.
    el.innerHTML = `<div class="hdr"><span>${d.name}</span></div><div class="ph"><span class="phl">${d.name.charAt(0).toUpperCase()}</span></div>`;
    if (d.art) {
      const img = new Image();
      img.draggable = false;
      img.addEventListener('load', () => el.querySelector('.ph')!.appendChild(img));
      img.src = `${ART}${d.kind === 'facility' ? 'Facility' : 'Decor'}/${d.art}.jpg`;
    }
    g.appendChild(el);
  }
}

export function renderRestaurant() {
  if ($('restaurant').hidden) return;
  renderHud();
  renderGrid();
  renderCus();
  placePop();
  if (shopOpen()) renderShop();
  if (menuOpen()) renderMenu();
  if (pendingFx) setTimeout(playRewardFx, 30);   // timer chứ không rAF: rAF không chạy khi tab bị ẩn
  if (pendingUnlocks.length) setTimeout(flushUnlocks, 60);
}

// ---------------------------------------------------------------- thưởng sau ván (14-)
// Thưởng cộng ngay lúc nhận `end` (người chơi còn đang ở bàn), animation chạy đúng MỘT lần khi
// màn quán hiện ra lại (ui/restaurant.md Interactions).
let pendingFx: Reward | null = null;

export function awardMatch(points: number, win: boolean, finishedFirst: boolean) {
  const { gold, xp } = matchReward(points, win, finishedFirst);
  const r = applyReward(S, gold, xp);
  saveState();
  pendingFx = pendingFx
    ? { gold: pendingFx.gold + r.gold, xp: pendingFx.xp + r.xp, levels: pendingFx.levels + r.levels }
    : r;
  return r;
}

function playRewardFx() {
  const r = pendingFx;
  if (!r) return;
  pendingFx = null;
  const gold = $('rest-gold');
  gold.parentElement!.classList.add('punch');
  setTimeout(() => gold.parentElement!.classList.remove('punch'), 320);
  const box = gold.getBoundingClientRect();
  goldPop(box.right + 8, box.top, `+${r.gold}`);
  if (r.levels) toast(`Level ${S.level}!`, 2200);
}

// "+N" bay lên, dùng lại .pop của bàn chơi — thưởng sau ván và tiền khách nói cùng một thứ tiếng.
function goldPop(x: number, y: number, text: string) {
  const pop = document.createElement('div');
  pop.className = 'pop';
  pop.textContent = text;
  pop.style.left = x + 'px';
  pop.style.top = y + 'px';
  document.body.appendChild(pop);
  pop.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-26px)', opacity: 0 }],
    { duration: 900, easing: 'ease-out', fill: 'forwards' });
  setTimeout(() => pop.remove(), 950);
}


// ---------------------------------------------------------------- khách trong quán (16-)
// Vòng đời chạy ở meta/customers.ts (không DOM); ở đây chỉ vẽ: mỗi khách một .card, nhảy từng ô
// (ui/restaurant.md "Đợt 2"), bong bóng món trên đầu, "+N" vàng lúc trả tiền.
let world = newWorld();
let live = false;                     // màn quán đang hiện → vòng đời chạy (16- Rule 2)
let loop = 0;
let lastTouch = 0;

const cusLayer = () => {
  let l = document.getElementById('rest-cus');
  if (!l) { l = document.createElement('div'); l.id = 'rest-cus'; $('rest-grid').appendChild(l); }
  return l;
};

function bubbleFor(c: Customer, cell: number) {
  if (!c.dish || c.phase === 'in' || c.phase === 'out') return { key: '', html: '' };
  const w = Math.round(cell * .9), h = Math.round(w * 1.4);
  const state = c.phase === 'cook' ? 'cooking' : c.phase === 'wait' ? 'waiting' : c.phase === 'angry' ? 'bad' : 'done';
  const r = c.dish;
  return {
    key: `${state}:${r.dish}`,
    html: `<div class="cus-bub ${state}"><div class="card food cc-${r.c}" style="--w:${w}px;--h:${h}px;--fs:9px">
      <div class="cchip">${r.c}</div><div class="hdr"><span>${esc(r.dish)}</span></div>
      <div class="ph"><img src="${ART}Food/${r.img}" alt="" draggable="false"></div></div></div>`,
  };
}

function renderCus() {
  const l = cusLayer();
  const cell = cellSize();
  const w = CUS_W * cell - 6, h = CUS_H * cell - 6;
  const seen = new Set<number>();
  for (const c of world.list) {
    seen.add(c.id);
    let el = l.querySelector<HTMLElement>(`[data-cid="${c.id}"]`);
    if (!el) {
      el = document.createElement('div');
      el.className = 'cus';
      el.dataset.cid = String(c.id);
      // Mặt khách là .card thật, nhưng .card có overflow:hidden nên bong bóng phải nằm NGOÀI nó,
      // cùng cấp trong .cus — nếu không thì bong bóng bị cắt mất (phát hiện lúc verify #31).
      // art.md "Restaurant meta" §2: chưa có ảnh thì chữ cái đầu của loại khách.
      el.innerHTML = `<div class="card cusface"><div class="hdr"><span>${c.type.name}</span></div>` +
        `<div class="ph"><span class="phl">${c.type.name.charAt(0)}</span></div></div><div class="bub"></div>`;
      const img = new Image();
      img.draggable = false;
      img.addEventListener('load', () => el!.querySelector('.ph')!.appendChild(img));
      img.src = `${ART}Customer/${c.type.art}.jpg`;
      l.appendChild(el);
    }
    el.style.setProperty('--w', w + 'px');
    el.style.setProperty('--h', h + 'px');
    el.style.setProperty('--fs', Math.max(9, Math.round(w * .11)) + 'px');
    const X = c.x * cell + 3, Y = c.y * cell + 3, pos = `${X},${Y}`;
    const prev = el.dataset.pos;
    if (prev !== pos) {
      el.style.transform = `translate(${X}px,${Y}px)`;
      if (prev && c.moved) {                                   // 16- Rule 4: một bước = một cú nhún
        const [px, py] = prev.split(',').map(Number);
        el.animate([
          { transform: `translate(${px}px,${py}px)` },
          { transform: `translate(${(px + X) / 2}px,${(py + Y) / 2 - HOP_LIFT * cell}px) rotate(${X >= px ? HOP_TILT : -HOP_TILT}deg)`, offset: .5 },
          { transform: `translate(${X}px,${Y}px)` },
        ], { duration: HOP_MS, easing: 'ease-out' });
      }
      el.dataset.pos = pos;
    }
    const bub = el.querySelector<HTMLElement>('.bub')!;
    const b = bubbleFor(c, cell);
    if (el.dataset.bub !== b.key) { bub.innerHTML = b.html; el.dataset.bub = b.key; }
    if (c.phase === 'cook' && c.dish) {                        // vòng tiến trình quanh bong bóng
      const total = c.cookEnd - c.since;
      const p = total > 0 ? Math.min(100, Math.max(0, ((Date.now() - c.since) / total) * 100)) : 0;
      bub.querySelector<HTMLElement>('.cus-bub')?.style.setProperty('--p', p.toFixed(1) + '%');
    }
    el.querySelector('.cusface')!.classList.toggle('invalid', c.phase === 'angry');   // 16- Rule 7: rung rồi bỏ đi
  }
  for (const el of [...l.children]) if (!seen.has(+(el as HTMLElement).dataset.cid!)) el.remove();
}

// 16- Rule 8: tiền khách đi đúng đường của thưởng sau ván (14- applyReward), lưu ngay.
function applyPaid(paid: Paid[]) {
  if (!paid.length) return;
  let levels = 0;
  const cell = cellSize();
  const g = $('rest-grid').getBoundingClientRect();
  for (const p of paid) {
    levels += applyReward(S, p.gold, p.xp).levels;
    goldPop(g.left + p.c.x * cell + cell * .6, g.top + p.c.y * cell, `+${p.gold}`);
  }
  saveState();
  renderHud();
  if (shopOpen()) renderShop();                                // gold đổi → trạng thái card đổi ngay
  if (levels) toast(`Level ${S.level}!`, 2200);
}

function tick() {
  if ($('restaurant').hidden) return;
  const now = Date.now();
  applyPaid(tickCustomers(S, world, now));
  renderCus();
  if (now - lastTouch >= IDLE_TOUCH_MS) { lastTouch = now; saveState(); }   // 16- Rule 10
}

// 16- Rule 9 + 11: thu nhập cho khoảng thời gian không mở màn quán, báo một dòng rồi tự ẩn.
let awayTimer = 0;
function applyAway() {
  const inc = awayIncome(S, Date.now());
  if (inc.gold <= 0 && inc.xp <= 0) return;
  const levels = applyReward(S, inc.gold, inc.xp).levels;
  const el = $('rest-away');
  el.hidden = false;
  el.textContent = `While you were away +${inc.gold}`;
  clearTimeout(awayTimer);
  awayTimer = window.setTimeout(() => { el.hidden = true; }, 6000);
  if (levels) setTimeout(() => toast(`Level ${S.level}!`, 2200), 400);
}

/** Màn quán hiện/ẩn — gọi từ main.ts. Khách chỉ sống khi màn quán đang hiện (16- Rule 2). */
export function restaurantShown(on: boolean) {
  if (on === live) return;
  live = on;
  if (!on) {
    clearInterval(loop); loop = 0;
    world = newWorld();
    document.getElementById('rest-cus')?.remove();
    saveState();                                               // lastSeen = lúc rời quán
    return;
  }
  applyAway();                                                 // tính TRƯỚC khi chạm lastSeen
  lastTouch = Date.now();
  saveState();
  loop = window.setInterval(tick, TICK_MS);
}

// ---------------------------------------------------------------- kéo thả đồ trong lưới (13-)
// Cùng lớp Pointer Events với bàn chơi: ngưỡng 6px mới nhấc, ghost nằm ở #drag-layer, thả sai thì
// bật về + rung (dùng lại .card.invalid của table.css). Hit-test tính theo Ô và tính lại mỗi
// pointermove (13- Rule 8) nên resize giữa lúc kéo không làm lệch.
interface ItemDrag { id: number; pid: number; x0: number; y0: number; dx: number; dy: number; ghost: HTMLElement | null; el: HTMLElement }
let drag: ItemDrag | null = null;

// renderGrid() xoá sạch #rest-grid nên ô chỉ dẫn thả phải dựng lại được bất cứ lúc nào
function dropEl() {
  let d = document.getElementById('rest-drop');
  if (!d) {
    d = document.createElement('div');
    d.id = 'rest-drop'; d.hidden = true;
    $('rest-grid').appendChild(d);
  }
  return d;
}

// 13- Rule 8: ô đích tính lại từ layout của khung hình hiện tại, theo góc trên-trái của card đang kéo.
// Nhận `d` tường minh thay vì đọc biến `drag` — onItemUp đã bỏ `drag` trước khi chốt ô.
function dropCell(e: PointerEvent, d: ItemDrag) {
  const { cell, left, top } = gridGeometry();
  return {
    cell,
    x: Math.round((e.clientX - d.dx - left) / cell),
    y: Math.round((e.clientY - d.dy - top) / cell),
  };
}

function onItemDown(e: PointerEvent) {
  if (drag || e.button) return;
  const el = (e.target as HTMLElement).closest('.ritem') as HTMLElement | null;
  if (!el) return;
  const r = el.getBoundingClientRect();
  e.preventDefault();
  try { $('restaurant').setPointerCapture(e.pointerId); } catch { /* ignore */ }
  drag = { id: +el.dataset.id!, pid: e.pointerId, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, ghost: null, el };
}

function onItemMove(e: PointerEvent) {
  if (!drag || e.pointerId !== drag.pid) return;
  if (!drag.ghost) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;   // cùng ngưỡng với bàn chơi
    const gh = drag.el.cloneNode(true) as HTMLElement;
    gh.classList.add('ghost');
    $('drag-layer').appendChild(gh);
    drag.ghost = gh;
    drag.el.classList.add('dragging');
    dropEl().hidden = false;
  }
  const it = S.items.find(i => i.id === drag!.id)!;
  const d = itemDef(it.type);
  const { cell, x, y } = dropCell(e, drag);
  drag.ghost.style.left = e.clientX - drag.dx + 'px';
  drag.ghost.style.top = e.clientY - drag.dy + 'px';
  const ok = freeAt(x, y, d.w, d.h, it.id);                                // 13- Rule 5-6
  const dp = dropEl();
  dp.className = ok ? 'ok' : 'bad';
  Object.assign(dp.style, {
    left: Math.max(0, Math.min(x, GRID_COLS - d.w)) * cell + 'px',
    top: Math.max(0, Math.min(y, GRID_ROWS - d.h)) * cell + 'px',
    width: d.w * cell + 'px', height: d.h * cell + 'px',
  });
}

function onItemUp(e: PointerEvent) {
  if (!drag || e.pointerId !== drag.pid) return;
  const d0 = drag;
  drag = null;
  dropEl().hidden = true;
  d0.ghost?.remove();
  d0.el.classList.remove('dragging');
  if (!d0.ghost) return;                                                   // tap, không phải kéo
  const it = S.items.find(i => i.id === d0.id);
  if (!it) return;
  const d = itemDef(it.type);
  const { x, y } = dropCell(e, d0);
  if (freeAt(x, y, d.w, d.h, it.id)) {                                     // 13- Rule 7: thả đúng -> snap + lưu ngay
    it.x = x; it.y = y;
    saveState();
    renderGrid();
  } else {                                                                 // thả sai -> bật về + rung, save không đổi
    d0.el.classList.add('invalid');
    setTimeout(() => d0.el.classList.remove('invalid'), 300);
  }
}

function cancelDrag() {
  if (!drag) return;
  drag.ghost?.remove();
  drag.el.classList.remove('dragging');
  dropEl().hidden = true;
  drag = null;
}

// ---------------------------------------------------------------- shop (15-)
let buying = false;                       // 15- Edge cases: bấm mua 2 lần thật nhanh chỉ trừ 1 lần

// 15- Rule 3: đúng MỘT trạng thái mỗi card, theo thứ tự ưu tiên khoá level → hết chỗ → thiếu gold.
function shopState(e: ReturnType<typeof shopEntries>[number]) {
  if (S.level < e.minLevel) return { k: 'locked', label: `Level ${e.minLevel}` };
  if (!firstFreeCell(e.w, e.h)) return { k: 'noroom', label: 'No room left' };
  if (S.gold < e.price) return { k: 'poor', label: `${e.price}` };
  return { k: 'ok', label: `${e.price}` };
}

function renderShop() {
  const rows = shopEntries().map(e => {
    const st = shopState(e);
    return `<div class="shop-row ${st.k}">
      <div class="card shop-thumb ${e.kind}" style="--w:76px;--h:106px;--fs:9px">
        <div class="hdr"><span>${esc(e.name)}</span></div>
        <div class="ph"><span class="phl">${e.name.charAt(0).toUpperCase()}</span></div>
        <span class="fp">${e.w}×${e.h}</span>
      </div>
      <div class="shop-txt"><b>${esc(e.name)}</b><span class="blurb">${esc(e.blurb)}</span></div>
      <button class="shop-buy" data-buy="${e.id}"${st.k === 'ok' ? '' : ' disabled'}>
        ${st.k === 'ok' || st.k === 'poor' ? '<span class="coin"></span>' : ''}${st.label}
      </button>
    </div>`;
  }).join('');
  $('shopBox').innerHTML = `<h2>Shop</h2>
    <div class="shop-gold"><span class="coin"></span><b>${S.gold}</b></div>
    <div class="shop-list">${rows}</div>
    <div class="row"><button id="btnShopClose">Close</button></div>`;
}

const shopOpen = () => $('shopModal').classList.contains('show');

function openShop() {
  renderShop();
  $('shopModal').classList.add('show');
}

// 15- Rule 4: trừ gold → vào ô trống đầu tiên → lưu ngay → card bay từ shop về đúng ô đó.
function buy(id: string, from: DOMRect | null) {
  if (buying) return;
  const e = shopEntry(id);
  if (!e || shopState(e).k !== 'ok') return;
  const spot = firstFreeCell(e.w, e.h);
  if (!spot) return;
  buying = true;
  S.gold -= e.price;
  const nid = S.items.reduce((m, it) => Math.max(m, it.id), 0) + 1;
  S.items.push({ id: nid, type: id, x: spot.x, y: spot.y });
  saveState();
  renderHud();
  renderGrid();
  renderShop();                                       // trạng thái các card đổi ngay (Edge cases)
  flyToItem(from, nid);
  buying = false;
}

function flyToItem(from: DOMRect | null, itemId: number) {
  const target = $('rest-grid').querySelector<HTMLElement>(`.ritem[data-id="${itemId}"]`);
  if (!from || !target) return;
  const to = target.getBoundingClientRect();
  const fly = target.cloneNode(true) as HTMLElement;
  fly.classList.add('ghost');
  Object.assign(fly.style, { left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px' });
  $('drag-layer').appendChild(fly);
  target.style.visibility = 'hidden';
  fly.animate([{ transform: 'none' }, { transform: `translate(${to.left - from.left}px,${to.top - from.top}px) scale(${to.width / from.width})` }],
    { duration: 420, easing: 'cubic-bezier(.4,0,.25,1)', fill: 'forwards' });
  setTimeout(() => { fly.remove(); target.style.visibility = ''; }, 460);
}


// ---------------------------------------------------------------- menu quán (17-)
// Món quán KHÁC Menu của ván bài. Card món dùng nguyên .card.food của bàn chơi (ui/restaurant.md
// mục "Đợt 2") — cùng ảnh, cùng chip course, cùng chip điểm.
let menuWhy = '';                         // lý do ngắn khi tap không ăn (menu đầy / chưa mở khoá)
let whyTimer = 0;
const pendingUnlocks: string[] = [];      // món mới mở khoá trong ván, báo khi về tới quán

function dishCard(r: Recipe, cls: string, w: number, extra = '') {
  const h = Math.round(w * 1.4);
  return `<div class="card food cc-${r.c} mdish ${cls}" data-dish="${esc(r.dish)}"
      style="--w:${w}px;--h:${h}px;--fs:${Math.max(9, Math.round(w * .11))}px">
      <div class="cchip">${r.c}</div><div class="hdr"><span>${esc(r.dish)}</span></div>
      <div class="ph"><img src="${ART}Food/${r.img}" alt="" draggable="false"></div>
      <div class="pchip">+${r.pts}</div>${extra}</div>`;
}

function renderMenu() {
  const on = menuRecipes(S);
  const slots = on.map(r => dishCard(r, 'on', 96)).join('')
    + Array.from({ length: Math.max(0, MENU_SLOTS - on.length) }, () => '<div class="mslot"></div>').join('');
  const all = RECIPES.map(r => {
    const picked = S.menu.includes(r.dish);
    const locked = !S.dishes.includes(r.dish);          // 17- Rule 5: món khoá vẫn hiện, không giấu
    const cls = `${picked ? 'on' : ''} ${locked ? 'locked' : ''} ${!picked && !locked && menuFull(S) ? 'full' : ''}`;
    return dishCard(r, cls, 84, locked ? '<span class="lockl">Cook it in a match</span>' : '');
  }).join('');
  $('menuBox').innerHTML = `<h2>Your menu <span class="mcount">${S.menu.length}/${MENU_SLOTS}</span></h2>
    <div class="menu-slots">${slots}</div>
    <div class="menu-why"${menuWhy ? '' : ' hidden'}>${esc(menuWhy)}</div>
    <div class="menu-all">${all}</div>
    <div class="row"><button id="btnMenuClose">Close</button></div>`;
}

const menuOpen = () => $('menuModal').classList.contains('show');

function openMenu() {
  menuWhy = '';
  renderMenu();
  $('menuModal').classList.add('show');
}

// 17- Rule 6: chọn/bỏ có hiệu lực ngay, lưu ngay, không nút Apply.
function pickDish(dish: string) {
  const r = toggleMenu(S, dish);
  menuWhy = r.reason || '';
  saveState();
  renderMenu();
  clearTimeout(whyTimer);
  if (menuWhy) whyTimer = window.setTimeout(() => { menuWhy = ''; if (menuOpen()) renderMenu(); }, 3200);
}

/** 17- Rule 2 — gọi từ main.ts khi nhận `end`; báo toast lúc người chơi về tới quán. */
export function unlockFromMatch(cooked: string[]) {
  const fresh = unlockDishes(S, cooked);
  if (fresh.length) { saveState(); pendingUnlocks.push(...fresh); }
  return fresh;
}

function flushUnlocks() {
  const fresh = pendingUnlocks.splice(0, pendingUnlocks.length);
  fresh.forEach((d, i) => setTimeout(() => toast(`New dish unlocked: ${d}`, 2400), i * 700));
}

// ---------------------------------------------------------------- popover của card điều hướng
let popFor = '';
function placePop() {
  if (!popFor) return;
  const card = $(popFor === 'pop-bots' ? 'navBots' : popFor === 'pop-online' ? 'navOnline' : 'navShop');
  const pop = $('rest-pop');
  const r = card.getBoundingClientRect(), p = pop.getBoundingClientRect();
  pop.style.left = Math.min(Math.max(8, r.left + r.width / 2 - p.width / 2), window.innerWidth - p.width - 8) + 'px';
  pop.style.top = Math.max(8, r.top - p.height - 10) + 'px';
}

function openPop(id: string) {
  const pop = $('rest-pop');
  if (popFor === id) return closePop();
  popFor = id;
  pop.hidden = false;
  pop.querySelectorAll<HTMLElement>('.pop-body').forEach(b => { b.hidden = b.id !== id; });
  document.querySelectorAll<HTMLElement>('.nav-card').forEach(c => c.classList.toggle('on', c.dataset.pop === id));
  placePop();
}

function closePop() {
  popFor = '';
  $('rest-pop').hidden = true;
  document.querySelectorAll<HTMLElement>('.nav-card').forEach(c => c.classList.remove('on'));
}

// ---------------------------------------------------------------- wiring
function wire() {
  if (wired) return;
  wired = true;

  const name = $<HTMLInputElement>('rest-name');
  const commitName = () => {                                   // 12- Rule 7: một nguồn tên duy nhất
    const v = name.value.trim().slice(0, 12);
    if (v === S.name) return;
    S.name = v; saveState();
  };
  name.addEventListener('change', commitName);
  name.addEventListener('blur', commitName);
  name.addEventListener('keydown', e => { if (e.key === 'Enter') name.blur(); });

  document.querySelectorAll<HTMLElement>('.nav-card').forEach(c =>
    c.addEventListener('pointerup', () => {
      if (c.id === 'navShop') { closePop(); openShop(); return; }
      if (c.id === 'navMenu') { closePop(); openMenu(); return; }
      openPop(c.dataset.pop!);
    }));

  $('menuModal').addEventListener('pointerup', e => {
    const t = e.target as HTMLElement;
    if (t.id === 'btnMenuClose' || t.id === 'menuModal') { $('menuModal').classList.remove('show'); return; }
    const card = t.closest('[data-dish]') as HTMLElement | null;
    if (card) pickDish(card.dataset.dish!);
  });

  $('shopModal').addEventListener('pointerup', e => {
    const t = e.target as HTMLElement;
    if (t.id === 'btnShopClose' || t.id === 'shopModal') { $('shopModal').classList.remove('show'); return; }
    const b = t.closest('[data-buy]') as HTMLElement | null;
    if (!b || (b as HTMLButtonElement).disabled) return;
    buy(b.dataset.buy!, b.closest('.shop-row')!.querySelector('.shop-thumb')!.getBoundingClientRect());
  });

  const rest = $('restaurant');
  rest.addEventListener('pointerdown', onItemDown);
  rest.addEventListener('pointermove', onItemMove);
  rest.addEventListener('pointerup', onItemUp);
  rest.addEventListener('pointercancel', cancelDrag);
  rest.addEventListener('lostpointercapture', () => { if (drag?.ghost) cancelDrag(); });

  $('botCount').addEventListener('pointerup', e => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    $('botCount').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    botCount = +b.dataset.n!;
  });
  $('btnBots').addEventListener('pointerup', () => { closePop(); hooks!.onBots(botCount); });
  $('btnCreate').addEventListener('pointerup', () => hooks!.onCreate());
  $('btnJoin').addEventListener('pointerup', () => hooks!.onJoin($<HTMLInputElement>('roomCode').value));
  $('roomCode').addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Enter') hooks!.onJoin($<HTMLInputElement>('roomCode').value); });

  document.addEventListener('pointerdown', e => {              // tap ra ngoài = đóng popover
    if (!popFor) return;
    const t = e.target as HTMLElement;
    if (t.closest('#rest-pop') || t.closest('.nav-card')) return;
    closePop();
  });
  window.addEventListener('resize', () => renderRestaurant());
}

export function setBotCount(n: number) {
  botCount = n;
  $('botCount').querySelectorAll<HTMLElement>('button').forEach(b => b.classList.toggle('on', +b.dataset.n! === n));
}

export function enterRestaurant(h: RestaurantHooks) {
  hooks = h;
  wire();
  repairPlacement();                 // 13- Rule 11
  closePop();
  restaurantShown(true);             // 16- Rule 9: thu nhập vắng mặt tính trước khi lastSeen bị chạm
  renderRestaurant();
}
