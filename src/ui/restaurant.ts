// Màn quán — design/ui/restaurant.md. Dựng HUD + lưới + 3 card điều hướng từ save (12-restaurant-meta.md).
// Kéo thả đồ trong lưới là ticket #25 (13-restaurant-grid.md); ở đây lưới chỉ dựng và đặt đồ đúng ô.
import './restaurant.css';
import { ART, RECIPES, type Recipe } from '../core/data';
import {
  CELL_MIN_PX, CELL_PX, CUS_EAT_MS, CUS_PATIENCE_MS, GRID_COLS, GRID_ROWS, HOP_LIFT, HOP_MS, HOP_TILT,
  IDLE_TOUCH_MS, MENU_SLOTS, STAFF_ART, STAFF_HOP_MS, STAFF_MAX, TICK_MS, ZOOM_MAX, ZOOM_WHEEL_STEP,
} from '../core/config';
import { itemDef } from '../meta/items';
import { menuFull, menuRecipes, toggleMenu, unlockDishes } from '../meta/menu';
import { CUS_H, CUS_W, awayIncome, newWorld, tickCustomers, type Customer, type Paid } from '../meta/customers';
import { newStaffWorld, tickStaff, type Staff } from '../meta/staff';
import { applyReward, matchReward, xpToLevel, type Reward } from '../meta/economy';
import { STAFF_ID, shopEntries, shopEntry, type ShopEntry } from '../meta/shop';
import { loadSave, saveWarning, startSave, writeSave, type Save } from '../meta/save';
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
  // Khách trả tiền cũng gọi renderHud() — đang gõ tên dở mà đạp lên thì mất chữ (thấy lúc verify #42).
  const nameEl = $<HTMLInputElement>('rest-name');
  if (document.activeElement !== nameEl) nameEl.value = S.name;
  $('rest-level').textContent = String(S.level);           // chip tròn góc trái trên (Tuning pass (3))
  $('rest-gold').textContent = String(S.gold);
  $('rest-face').textContent = (S.name.trim()[0] || '?').toUpperCase();   // art.md §3 placeholder
  const need = xpToLevel(S.level);                             // 14- Rule 7
  $('rest-xptext').textContent = `${S.xp}/${need}`;
  $('rest-xp').style.width = Math.min(100, (S.xp / need) * 100) + '%';
  const warn = saveWarning();
  const w = $('rest-warn');
  w.hidden = !warn;
  w.textContent = warn || '';
  // 16- Rule 1: không có món hoặc không có bàn thì không có khách — nói thẳng ra một dòng.
  const hint = !menuRecipes(S).length ? 'Pick a dish for your menu.'
    : !S.items.some(i => i.type === 'table_basic') ? 'No tables — the shop sells one.'
    : !S.items.some(i => i.type === 'kitchen_basic' || i.type === 'kitchen_extra') ? 'No kitchen — nobody can cook.'
    : S.staff < 1 ? 'No staff — nobody takes orders.' : '';   // 18- Rule 11 + Edge cases
  const h = $('rest-hint');
  h.hidden = !hint;
  h.textContent = hint;
}

// ---------------------------------------------------------------- camera (13- Rule 14-17)
// Lưới vẽ bằng ĐƠN VỊ THẾ GIỚI (CELL_PX, không đổi theo zoom); camera là một transform duy nhất
// trên #rest-grid, nên zoom/pan chỉ tốn một lần compose chứ không layout lại card nào.
// `pan` tính bằng px ĐÃ nhân zoom: điểm thế giới p hiện ở màn tại p*z - pan (+ gốc của stage).
const cam = { z: 1, x: 0, y: 0 };
let camReady = false;

const worldW = () => GRID_COLS * CELL_PX;
const worldH = () => GRID_ROWS * CELL_PX;
const stageBox = () => $('rest-stage').getBoundingClientRect();

// 13- Rule 16: thu hết cỡ thì lưới vẫn phủ kín màn, và ô không nhỏ hơn sàn tap target.
function zoomMin() {
  const b = stageBox();
  return Math.min(ZOOM_MAX, Math.max(b.width / worldW(), b.height / worldH(), CELL_MIN_PX / CELL_PX));
}

function clampCam() {
  const b = stageBox();
  cam.z = Math.min(ZOOM_MAX, Math.max(zoomMin(), cam.z));
  cam.x = Math.min(Math.max(0, cam.x), Math.max(0, worldW() * cam.z - b.width));
  cam.y = Math.min(Math.max(0, cam.y), Math.max(0, worldH() * cam.z - b.height));
}

function applyCam() {
  clampCam();
  $('rest-grid').style.transform = `translate(${-cam.x}px,${-cam.y}px) scale(${cam.z})`;
}

/** Zoom quanh một điểm trên màn — điểm đó đứng yên (13- Rule 15). */
function zoomAt(z: number, sx: number, sy: number) {
  const b = stageBox();
  const px = sx - b.left, py = sy - b.top;
  const wx = (cam.x + px) / cam.z, wy = (cam.y + py) / cam.z;     // điểm thế giới dưới con trỏ
  cam.z = Math.min(ZOOM_MAX, Math.max(zoomMin(), z));
  cam.x = wx * cam.z - px;
  cam.y = wy * cam.z - py;
  applyCam();
}

/** Căn camera vào giữa đống đồ đang có — chỗ người chơi muốn nhìn khi mở game (13- Rule 14). */
function centerCam() {
  const b = stageBox();
  let cx = worldW() / 2, cy = worldH() / 2;
  if (S.items.length) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const it of S.items) {
      const d = itemDef(it.type);
      x0 = Math.min(x0, it.x); y0 = Math.min(y0, it.y);
      x1 = Math.max(x1, it.x + d.w); y1 = Math.max(y1, it.y + d.h);
    }
    cx = ((x0 + x1) / 2) * CELL_PX; cy = ((y0 + y1) / 2) * CELL_PX;
  }
  cam.z = Math.min(ZOOM_MAX, Math.max(zoomMin(), 1));
  cam.x = cx * cam.z - b.width / 2;
  cam.y = cy * cam.z - b.height / 2;
  camReady = true;
  applyCam();
}

// 13- Rule 13: đổi ô <-> pixel MÀN HÌNH, đúng ở mọi mức zoom và mọi vị trí camera.
export function gridGeometry() {
  const r = $('rest-grid').getBoundingClientRect();
  return { cell: CELL_PX * cam.z, left: r.left, top: r.top };
}

/** Ô đang ở giữa khung nhìn — mỏ neo cho "ô trống gần tâm màn" (13- Rule 10). */
function viewCenterCell() {
  const b = stageBox();
  return {
    x: Math.round(((cam.x + b.width / 2) / cam.z) / CELL_PX),
    y: Math.round(((cam.y + b.height / 2) / cam.z) / CELL_PX),
  };
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

// 13- Rule 10: ô trống GẦN NHẤT quanh một mỏ neo (tâm màn khi mua, tâm lưới khi sửa save).
// Lưới rộng hơn màn rồi nên "ô đầu tiên từ góc trái trên" sẽ ném món vừa mua ra ngoài tầm nhìn.
export function freeCellNear(ax: number, ay: number, w: number, h: number, exceptId = -1) {
  let best: { x: number; y: number } | null = null, bestD = Infinity;
  for (let y = 0; y + h <= GRID_ROWS; y++)
    for (let x = 0; x + w <= GRID_COLS; x++) {
      const d = (x - ax) * (x - ax) + (y - ay) * (y - ay);
      if (d < bestD && freeAt(x, y, w, h, exceptId)) { best = { x, y }; bestD = d; }
    }
  return best;
}

/** Ô trống gần giữa màn nhất — dùng khi mua đồ (15- Rule 4). */
const freeCellInView = (w: number, h: number) => {
  const c = viewCenterCell();
  return freeCellNear(c.x, c.y, w, h);
};

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
      const spot = freeCellNear(GRID_COLS / 2, GRID_ROWS / 2, d.w, d.h, it.id);   // lúc nạp chưa có camera
      if (spot) { it.x = spot.x; it.y = spot.y; moved++; }
      else console.warn(`[meta] no room for ${it.type} — left where it was`);
    }
    placed.push(it);
  }
  if (moved) { console.warn(`[meta] ${moved} item(s) repositioned to fit the grid`); saveState(); }
}

/** Gắn ảnh vào ô `.ph` của một card, ĐÚNG một kiểu cho mọi card quán: chỉ chèn khi ảnh đã tải
 *  xong, nên ảnh thiếu thì card giữ nguyên placeholder chữ cái thay vì hiện icon ảnh hỏng
 *  (art.md "Restaurant meta" §2). `file` rỗng = chưa khai báo ảnh. */
function putArt(card: Element, folder: 'Props' | 'NPC', file: string) {
  if (!file) return;
  const img = new Image();
  img.draggable = false;
  img.addEventListener('load', () => card.querySelector('.ph')!.appendChild(img));
  img.src = `${ART}${folder}/${file}`;
}

/** Dựng lại lưới theo kiểu ĐỐI CHIẾU, không xoá sạch (sửa 2026-09-20 (7), backlog #44).
 *  Bản cũ `innerHTML = ''` rồi dựng lại tất cả: mỗi lần thả một món đồ là MỌI card mất `<img>`
 *  rồi gắn lại qua sự kiện `load` — dù ảnh đã nằm trong cache thì `load` vẫn là async, nên luôn
 *  có ít nhất một khung hình cả lưới trơ ra placeholder chữ cái. Đó chính là cú nháy.
 *  Giờ card được giữ nguyên theo `data-id` — chỉ card mới được dựng, card biến mất mới bị xoá,
 *  còn lại chỉ cập nhật vị trí và kích thước. Cùng cách `renderActors()` đã làm với khách. */
function renderGrid() {
  const cell = CELL_PX;                      // vẽ bằng đơn vị thế giới; zoom là việc của transform
  const g = $('rest-grid');
  g.style.width = worldW() + 'px';
  g.style.height = worldH() + 'px';
  g.style.backgroundSize = `${cell}px ${cell}px`;

  const seen = new Set<string>();
  for (const it of S.items) {
    const d = itemDef(it.type);
    const key = String(it.id);
    seen.add(key);
    let el = g.querySelector<HTMLElement>(`.ritem[data-id="${key}"]`);
    if (el && el.dataset.type !== it.type) { el.remove(); el = null; }    // đổi loại → dựng lại hẳn
    if (!el) {
      // ui/restaurant.md Tuning pass (1): dùng đúng .card/.hdr/.ph của bàn chơi, chỉ đổi màu viền theo loại.
      el = document.createElement('div');
      el.className = `card ritem ${d.kind}`;
      el.dataset.id = key;
      el.dataset.type = it.type;
      el.dataset.drag = 'item';
      // art.md "Restaurant meta" §2: chưa có ảnh thì ô ảnh hiện chữ cái đầu; thả ảnh đúng đường dẫn là tự đổi.
      el.innerHTML = `<div class="hdr"><span>${d.name}</span></div><div class="ph"><span class="phl">${d.name.charAt(0).toUpperCase()}</span></div>`;
      putArt(el, 'Props', d.art);                       // art.md §3 (sửa 2026-09-20 (6))
      g.appendChild(el);
    }
    const w = d.w * cell - 6;
    el.style.setProperty('--w', w + 'px');
    el.style.setProperty('--h', d.h * cell - 6 + 'px');
    el.style.setProperty('--fs', Math.max(9, Math.round(w * .11)) + 'px');
    el.style.left = it.x * cell + 3 + 'px';
    el.style.top = it.y * cell + 3 + 'px';
  }
  // món đồ biến mất khỏi save (reset quán) thì card của nó đi theo; #rest-drop không phải .ritem
  // nên không bao giờ bị quét mất — đó cũng là lý do dropEl() không còn phải dựng lại mỗi lần.
  for (const el of [...g.querySelectorAll<HTMLElement>('.ritem')])
    if (!seen.has(el.dataset.id!)) el.remove();
}

export function renderRestaurant() {
  if ($('restaurant').hidden) return;
  if (!camReady) centerCam(); else applyCam();
  renderHud();
  renderGrid();
  renderActors();
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
  punchGold();                                 // TP(6): viên .pchip nằm trên card SHOP
  const box = goldTarget().getBoundingClientRect();
  goldPop(box.right + 8, box.top, `+${r.gold}`);
  if (r.levels) toast(`Level ${S.level}!`, 2200);
}

/** TP(6): gold sống trên card SHOP. Dải card đang tắt thì nó không có trên màn — đích thay thế là
 *  nút toggle, để tiền không bao giờ bay vào hư không. */
const goldTarget = () => $(navOn ? 'rest-gold' : 'rest-toggle');

/** Nảy viên gold (TP(6): viên .pchip của card SHOP, hoặc nút toggle khi dải card đang tắt). */
function punchGold() {
  const g = goldTarget();
  g.classList.remove('punch'); void g.offsetWidth;
  g.classList.add('punch');
  setTimeout(() => g.classList.remove('punch'), 320);
}

/** TP(4): tiền khách trả BAY về viên gold trên card chef rồi mới cộng vào mắt người chơi —
 *  nối thẳng "ai trả" với "tiền vào đâu". Cong lên giữa đường cho có trọng lượng. */
const GOLD_FLY_MS = 720;
function goldFly(x: number, y: number, text: string) {
  const b = goldTarget().getBoundingClientRect();
  const tx = b.left + b.width / 2, ty = b.top + b.height / 2;
  const pop = document.createElement('div');
  pop.className = 'pop';
  pop.textContent = text;
  pop.style.left = x + 'px';
  pop.style.top = y + 'px';
  document.body.appendChild(pop);
  const a = pop.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${(tx - x) * .45}px,${(ty - y) * .45 - 34}px) scale(1.12)`, opacity: 1, offset: .55 },
    { transform: `translate(${tx - x}px,${ty - y}px) scale(.45)`, opacity: .15 },
  ], { duration: GOLD_FLY_MS, easing: 'cubic-bezier(.35,0,.6,1)', fill: 'forwards' });
  a.onfinish = () => { pop.remove(); punchGold(); };
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


// ------------------------------------------------- khách + nhân viên trên sàn quán (16-, 18-)
// Vòng đời chạy ở meta/customers.ts + meta/staff.ts (không DOM); ở đây chỉ vẽ. Khách và nhân viên
// là **cùng một thứ** với UI: một .card nhảy từng ô, một bong bóng món trên đầu
// (ui/restaurant.md Tuning pass (3) mục 2) — khác nhau ở màu viền và ở bong bóng nào có vòng nấu.
let world = newWorld();
let sworld = newStaffWorld();
let live = false;                     // màn quán đang hiện → vòng đời chạy (16- Rule 2)
let loop = 0;
let lastTouch = 0;

const cusLayer = () => {
  let l = document.getElementById('rest-cus');
  if (!l) { l = document.createElement('div'); l.id = 'rest-cus'; $('rest-grid').appendChild(l); }
  return l;
};

interface Ring { start: number; end: number; drain?: boolean }
interface Bub { key: string; html: string; ring: Ring | null }
interface Actor {
  key: string; cls: string; name: string; art: string;
  x: number; y: number; moved: boolean; hopMs: number;
  bub: Bub; angry: boolean;
}

const NO_BUB: Bub = { key: '', html: '', ring: null };

// Ba icon dựng thẳng bằng SVG nét — không cần file ảnh nào (art.md "Icon trạng thái").
const ICON: Record<string, string> = {
  // đồng hồ cát = đang chờ có người tới nhận order
  hourglass: '<path d="M7 3h10M7 21h10M8 3v4l4 4 4-4V3M8 21v-4l4-4 4 4v4"/>',
  // dao dĩa = order đã có người nhận, đang chờ món ra
  cutlery: '<path d="M7 3v5a2 2 0 0 0 2 2v11M11 3v5a2 2 0 0 1-2 2M17 3c-1.3 1.7-2 3.6-2 5.4 0 1.6.8 2.6 2 2.8V21"/>',
  // phiếu order = nhân viên đang cầm order chạy về bếp
  ticket: '<path d="M6 3h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4V3z"/><path d="M9.5 8h5M9.5 12h5"/>',
};

/** Khung bong bóng dùng chung cho mọi trạng thái; `ring` bọc đúng khung bên trong.
 *  #38: viewBox phải ĐÚNG tỉ lệ khung vẽ, nếu không góc bo méo và vòng chạy nhanh chậm khác nhau
 *  giữa cạnh ngang với cạnh dọc. Đo ra: bong bóng = ruột + padding 3 + viền 1 mỗi cạnh; `.ring`
 *  rộng `calc(100% + 6px)` tính trên padding-box (đã trừ viền) → đúng bằng ruột + 12 mỗi chiều. */
function wrap(state: string, key: string, w: number, h: number, inner: string, ring: Ring | null): Bub {
  const W = w + 12, H = h + 12;
  const arc = ring
    ? `<svg class="ring" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
         <rect class="arc" x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="13" ry="13"
               vector-effect="non-scaling-stroke"/>
       </svg>` : '';
  return { key, html: `<div class="cus-bub ${state}">${arc}${inner}</div>`, ring };
}

/** Bong bóng card món — dùng lúc đang nấu (trên nhân viên) và lúc đang ăn (trên khách). */
function dishBub(state: string, r: Recipe, cell: number, ring: Ring | null): Bub {
  const w = Math.round(cell * .9), h = Math.round(w * 1.4);
  const inner = `<div class="card" style="--w:${w}px;--h:${h}px;--fs:9px">
      <div class="hdr"><span>${esc(r.dish)}</span></div>
      <div class="ph"><img src="${ART}Food/${r.img}" alt="" draggable="false"></div></div>`;
  return wrap(state, `${state}:${r.dish}`, w, h, inner, ring);
}

/** Bong bóng icon — trạng thái chưa có món thật nào trên bàn (TP(5)). */
function iconBub(state: string, icon: string, cell: number, ring: Ring | null): Bub {
  const d = Math.round(cell * .52);
  const inner = `<div class="icn" style="--d:${d}px"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[icon]}</svg></div>`;
  return wrap(state + ' icon', `${state}:${icon}`, d, d, inner, ring);
}

// TP(4) + TP(5) — trên đầu khách lần lượt: đồng hồ cát (chờ người nhận order, vòng đếm ngược đúng
// độ kiên nhẫn) → dao dĩa (order đã nhận, chờ món) → card món + vòng (đang ăn).
function cusBub(c: Customer, cell: number): Bub {
  if (c.phase === 'wait')
    return iconBub('patience', 'hourglass', cell,
      { start: c.orderedAt, end: c.orderedAt + CUS_PATIENCE_MS, drain: true });   // 16- Rule 7
  if (c.phase === 'cook') return iconBub('hold', 'cutlery', cell, null);
  if (c.phase === 'eat' && c.dish)
    return dishBub('done', c.dish, cell, { start: c.since, end: c.since + CUS_EAT_MS });
  return NO_BUB;
}

// Trên đầu nhân viên: phiếu order (đang chạy về bếp) → card món + vòng (đang nấu) → card món
// (đang bưng ra). Lúc đi nhận order thì tay không.
function staffBub(st: Staff, cell: number): Bub {
  if (!st.dish) return NO_BUB;
  if (st.phase === 'toKit') return iconBub('carry', 'ticket', cell, null);
  if (st.phase === 'cook') return dishBub('cooking', st.dish, cell, { start: st.since, end: st.cookEnd });
  return dishBub('done', st.dish, cell, null);
}

// Một animation duy nhất cho cả lượt — trình duyệt nội suy theo khung hình nên không giật theo
// nhịp TICK_MS. `drain` = vòng đầy rồi vơi dần (đếm ngược), ngược với vòng nấu/ăn là vẽ dần lên.
function startRing(bub: HTMLElement, r: Ring) {
  const arc = bub.querySelector('.arc') as SVGGeometryElement | null;
  if (!arc) return;
  const total = Math.max(1, r.end - r.start);
  const len = arc.getTotalLength();
  arc.style.strokeDasharray = String(len);
  const from = r.drain ? 0 : len, to = r.drain ? len : 0;
  const a = arc.animate([{ strokeDashoffset: from }, { strokeDashoffset: to }],
    { duration: total, easing: 'linear', fill: 'forwards' });
  a.currentTime = Math.min(total, Math.max(0, Date.now() - r.start));
}

function renderActors() {
  const l = cusLayer();
  const cell = CELL_PX;
  const w = CUS_W * cell - 6, h = CUS_H * cell - 6;
  const acts: Actor[] = [];
  for (const c of world.list) acts.push({
    key: `c${c.id}`, cls: 'cus', name: c.type.name, art: c.type.art,
    x: c.x, y: c.y, moved: c.moved, hopMs: HOP_MS,
    bub: cusBub(c, cell), angry: c.phase === 'angry',
  });
  for (const st of sworld.list) acts.push({
    key: `s${st.id}`, cls: 'cus staff', name: 'Waiter', art: STAFF_ART,
    x: st.x, y: st.y, moved: st.moved, hopMs: STAFF_HOP_MS,
    bub: staffBub(st, cell), angry: false,
  });

  const seen = new Set<string>();
  for (const a of acts) {
    seen.add(a.key);
    let el = l.querySelector<HTMLElement>(`[data-k="${a.key}"]`);
    if (!el) {
      el = document.createElement('div');
      el.className = a.cls;
      el.dataset.k = a.key;
      // Mặt người là .card thật, nhưng .card có overflow:hidden nên bong bóng phải nằm NGOÀI nó,
      // cùng cấp trong .cus — nếu không thì bong bóng bị cắt mất (phát hiện lúc verify #31).
      // art.md "Restaurant meta" §2: chưa có ảnh thì chữ cái đầu của tên.
      el.innerHTML = `<div class="card cusface"><div class="hdr"><span>${esc(a.name)}</span></div>` +
        `<div class="ph"><span class="phl">${esc(a.name.charAt(0))}</span></div></div><div class="bub"></div>`;
      putArt(el, 'NPC', a.art);
      l.appendChild(el);
    }
    el.style.setProperty('--w', w + 'px');
    el.style.setProperty('--h', h + 'px');
    el.style.setProperty('--fs', Math.max(9, Math.round(w * .11)) + 'px');
    const X = a.x * cell + 3, Y = a.y * cell + 3, pos = `${X},${Y}`;
    const prev = el.dataset.pos;
    if (prev !== pos) {
      el.style.transform = `translate(${X}px,${Y}px)`;
      if (prev && a.moved) {                                   // 16- Rule 4: một bước = một cú nhún
        const [px, py] = prev.split(',').map(Number);
        el.animate([
          { transform: `translate(${px}px,${py}px)` },
          { transform: `translate(${(px + X) / 2}px,${(py + Y) / 2 - HOP_LIFT * cell}px) rotate(${X >= px ? HOP_TILT : -HOP_TILT}deg)`, offset: .5 },
          { transform: `translate(${X}px,${Y}px)` },
        ], { duration: a.hopMs, easing: 'ease-out' });
      }
      el.dataset.pos = pos;
    }
    const bub = el.querySelector<HTMLElement>('.bub')!;
    if (el.dataset.bub !== a.bub.key) {                        // chỉ dựng lại khi ĐỔI trạng thái
      bub.innerHTML = a.bub.html;
      el.dataset.bub = a.bub.key;
      if (a.bub.ring) startRing(bub, a.bub.ring);
    }
    el.querySelector('.cusface')!.classList.toggle('invalid', a.angry);   // 16- Rule 7: rung rồi bỏ đi
  }
  for (const el of [...l.children]) if (!seen.has((el as HTMLElement).dataset.k!)) el.remove();
}

// 16- Rule 8: tiền khách đi đúng đường của thưởng sau ván (14- applyReward), lưu ngay.
function applyPaid(paid: Paid[]) {
  if (!paid.length) return;
  let levels = 0;
  const { cell, left, top } = gridGeometry();          // "+N" bay ở toạ độ MÀN HÌNH
  for (const p of paid) {
    levels += applyReward(S, p.gold, p.xp).levels;
    goldFly(left + p.c.x * cell + cell * .6, top + p.c.y * cell, `+${p.gold}`);   // TP(4)
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
  tickStaff(S, world, sworld, now);           // khách đi trước, nhân viên phản ứng sau (18-)
  renderActors();
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
    sworld = newStaffWorld();
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

// Ô chỉ dẫn thả sống trong #rest-grid và renderGrid() không còn xoá sạch (#44), nhưng hàm này
// vẫn dựng lại được bất cứ lúc nào — rẻ, và không phụ thuộc vào thứ tự khởi tạo.
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

// 13- Rule 15: kéo chỗ trống = di chuyển camera; hai ngón = zoom. Kéo trúng món đồ thì món đồ
// thắng, camera đứng yên — ai bắt trước người đó giữ.
interface PanDrag { pid: number; sx: number; sy: number; cx: number; cy: number; live: boolean }
let pan: PanDrag | null = null;
const touches = new Map<number, { x: number; y: number }>();
let pinch: { dist: number; z: number } | null = null;

const pinchMid = () => {
  const [a, b] = [...touches.values()];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
};

function onStageWheel(e: WheelEvent) {
  if (!(e.target as HTMLElement).closest('#rest-stage')) return;
  e.preventDefault();
  zoomAt(cam.z * Math.exp(-e.deltaY * ZOOM_WHEEL_STEP), e.clientX, e.clientY);
}

function onItemDown(e: PointerEvent) {
  if (e.button) return;
  const onStage = !!(e.target as HTMLElement).closest('#rest-stage');
  if (onStage) {
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) {                                  // hai ngón: bỏ mọi thao tác một ngón
      cancelDrag(); pan = null;
      pinch = { dist: pinchMid().d, z: cam.z };
      return;
    }
  }
  if (drag || pan || pinch) return;
  const el = (e.target as HTMLElement).closest('.ritem') as HTMLElement | null;
  if (!el) {
    if (onStage) pan = { pid: e.pointerId, sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, live: false };
    return;
  }
  const r = el.getBoundingClientRect();
  e.preventDefault();
  try { $('restaurant').setPointerCapture(e.pointerId); } catch { /* ignore */ }
  drag = { id: +el.dataset.id!, pid: e.pointerId, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, ghost: null, el };
}

function onItemMove(e: PointerEvent) {
  if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch) {
    if (touches.size < 2) return;
    const m = pinchMid();
    if (m.d > 0 && pinch.dist > 0) zoomAt(pinch.z * (m.d / pinch.dist), m.x, m.y);
    return;
  }
  if (pan && e.pointerId === pan.pid) {
    const dx = e.clientX - pan.sx, dy = e.clientY - pan.sy;
    if (!pan.live && Math.hypot(dx, dy) < 6) return;           // ngưỡng nhấc như mọi thao tác kéo khác
    pan.live = true;
    $('rest-stage').classList.add('panning');
    cam.x = pan.cx - dx; cam.y = pan.cy - dy;
    applyCam();
    return;
  }
  if (!drag || e.pointerId !== drag.pid) return;
  if (!drag.ghost) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;   // cùng ngưỡng với bàn chơi
    const gh = drag.el.cloneNode(true) as HTMLElement;
    gh.classList.add('ghost');
    const sr = drag.el.getBoundingClientRect();                              // #drag-layer không bị zoom
    gh.style.setProperty('--w', sr.width + 'px');
    gh.style.setProperty('--h', sr.height + 'px');
    gh.style.setProperty('--fs', Math.max(9, Math.round(sr.width * .11)) + 'px');
    $('drag-layer').appendChild(gh);
    drag.ghost = gh;
    drag.el.classList.add('dragging');
    dropEl().hidden = false;
  }
  const it = S.items.find(i => i.id === drag!.id)!;
  const d = itemDef(it.type);
  const { x, y } = dropCell(e, drag);
  drag.ghost.style.left = e.clientX - drag.dx + 'px';
  drag.ghost.style.top = e.clientY - drag.dy + 'px';
  const ok = freeAt(x, y, d.w, d.h, it.id);                                // 13- Rule 5-6
  const dp = dropEl();
  dp.className = ok ? 'ok' : 'bad';
  Object.assign(dp.style, {                                                // ô chỉ dẫn nằm TRONG lưới -> đơn vị thế giới
    left: Math.max(0, Math.min(x, GRID_COLS - d.w)) * CELL_PX + 'px',
    top: Math.max(0, Math.min(y, GRID_ROWS - d.h)) * CELL_PX + 'px',
    width: d.w * CELL_PX + 'px', height: d.h * CELL_PX + 'px',
  });
}

function onItemUp(e: PointerEvent) {
  touches.delete(e.pointerId);
  if (pinch && touches.size < 2) pinch = null;
  if (pan && e.pointerId === pan.pid) { pan = null; $('rest-stage').classList.remove('panning'); return; }
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
  if (pan) { pan = null; $('rest-stage').classList.remove('panning'); }
  if (!drag) return;
  drag.ghost?.remove();
  drag.el.classList.remove('dragging');
  dropEl().hidden = true;
  drag = null;
}

// ---------------------------------------------------------------- shop (15-)
let buying = false;                       // 15- Edge cases: bấm mua 2 lần thật nhanh chỉ trừ 1 lần

// 15- Rule 3 + 9: đúng MỘT trạng thái mỗi card, ưu tiên kịch trần → khoá level → hết chỗ →
// thiếu gold. Món 'hire' không chiếm ô nên không bao giờ "hết chỗ".
function shopState(e: ShopEntry) {
  if (e.maxed) return { k: 'maxed', label: 'All hired' };
  if (S.level < e.minLevel) return { k: 'locked', label: `Level ${e.minLevel}` };
  if (e.kind !== 'hire' && !freeCellInView(e.w, e.h)) return { k: 'noroom', label: 'No room left' };
  if (S.gold < e.price) return { k: 'poor', label: `${e.price}` };
  return { k: 'ok', label: `${e.price}` };
}

function renderShop() {
  const rows = shopEntries(S.staff).map(e => {
    const st = shopState(e);
    return `<div class="shop-row ${st.k}">
      <div class="card shop-thumb ${e.kind}" style="--w:76px;--h:106px;--fs:9px">
        <div class="hdr"><span>${esc(e.name)}</span></div>
        <div class="ph"><span class="phl">${e.name.charAt(0).toUpperCase()}</span></div>
        <span class="fp">${e.kind === 'hire' ? `${S.staff}/${STAFF_MAX}` : `${e.w}×${e.h}`}</span>
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
  // Thumbnail trong shop là cùng một .card nên cũng mang cùng ảnh: người chơi thấy đúng thứ
  // mình sắp đặt xuống lưới, không phải một ô chữ cái (art.md "Restaurant meta" §3).
  const thumbs = $('shopBox').querySelectorAll('.shop-thumb');
  shopEntries(S.staff).forEach((e, i) =>
    thumbs[i] && putArt(thumbs[i], e.kind === 'hire' ? 'NPC' : 'Props', e.art));
}

const shopOpen = () => $('shopModal').classList.contains('show');

function openShop() {
  renderShop();
  $('shopModal').classList.add('show');
}

// 15- Rule 4: trừ gold → vào ô trống đầu tiên → lưu ngay → card bay từ shop về đúng ô đó.
function buy(id: string, from: DOMRect | null) {
  if (buying) return;
  const e = shopEntry(id, S.staff);
  if (!e || shopState(e).k !== 'ok') return;
  if (id === STAFF_ID) return hire(e.price, from);     // 15- Rule 9: món không đặt lên lưới
  const spot = freeCellInView(e.w, e.h);               // 15- Rule 4: rơi vào chỗ đang nhìn
  if (!spot) return;
  buying = true;
  S.gold -= e.price;
  const nid = S.items.reduce((m, it) => Math.max(m, it.id), 0) + 1;
  S.items.push({ id: nid, type: id, x: spot.x, y: spot.y });
  saveState();
  renderHud();
  renderGrid();
  renderShop();                                       // trạng thái các card đổi ngay (Edge cases)
  flyTo(from, $('rest-grid').querySelector<HTMLElement>(`.ritem[data-id="${nid}"]`));
  buying = false;
}

/** 18- Rule 14: thuê người. Không có ô nào bị chiếm — chỉ `save.staff` tăng. Chạy luôn một nhịp
 *  vòng đời để người mới có mặt trên sàn ngay, rồi card bay từ shop về đúng người đó. */
function hire(price: number, from: DOMRect | null) {
  buying = true;
  S.gold -= price;
  S.staff += 1;
  saveState();
  renderHud();
  const id = S.staff;
  tickStaff(S, world, sworld, Date.now());
  renderActors();
  renderShop();
  flyTo(from, cusLayer().querySelector<HTMLElement>(`[data-k="s${id}"] .cusface`));
  toast(`Waiter hired — ${S.staff} on shift`, 2000);
  buying = false;
}

function flyTo(from: DOMRect | null, target: HTMLElement | null) {
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
  // TP(4): quán không dùng khoá món (A/M/D) vào việc gì — bỏ chip loại và viền màu theo loại.
  return `<div class="card mdish ${cls}" data-dish="${esc(r.dish)}"
      style="--w:${w}px;--h:${h}px;--fs:${Math.max(9, Math.round(w * .11))}px">
      <div class="hdr"><span>${esc(r.dish)}</span></div>
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

// ---------------------------------------------------------------- dải card: bật / tắt (TP(6) mục 3)
// Trạng thái phiên, KHÔNG vào save: đây là cái nháy mắt để ngắm quán, không phải một tuỳ chọn.
let navOn = true;
function setNav(on: boolean) {
  navOn = on;
  $('restaurant').classList.toggle('nav-off', !on);
  const b = $('rest-toggle');
  const label = on ? 'Hide cards' : 'Show cards';       // in-game text
  b.setAttribute('aria-label', label);
  b.title = label;
  if (!on) closePop();                                  // popover không được treo lại khi card biến mất
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

// ---------------------------------------------------------------- reset quán (cheat, #44)
// ui/restaurant.md "Nút reset (cheat)". Xoá đúng những gì `12-` coi là quán: save + mẻ khách
// đang chạy + camera. KHÔNG đụng ván bài, không đụng phòng online (12- Rule 6) — nút chỉ có mặt
// trên màn quán, và màn quán chỉ hiện khi không có ván nào đang chạy.
const ARM_MS = 6000;                // nhịp 1 giữ "đã nạp đạn" bao lâu — đủ đọc xong toast rồi quyết
let armTimer = 0;

function armReset(on: boolean) {
  const b = $('rest-reset');
  b.classList.toggle('armed', on);
  b.setAttribute('aria-label', on ? 'Tap again to wipe the restaurant' : 'Reset restaurant');
  b.setAttribute('title', on ? 'Tap again to wipe the restaurant' : 'Reset restaurant');
  clearTimeout(armTimer);
  if (on) armTimer = window.setTimeout(() => armReset(false), ARM_MS);   // tự nguội, không kẹt đỏ
}

function resetRestaurant() {
  armReset(false);
  S = startSave();
  saveState();
  world = newWorld();                 // mẻ khách và kíp nhân viên cũ không còn bàn/bếp để bám
  sworld = newStaffWorld();
  pendingFx = null;
  pendingUnlocks.length = 0;
  camReady = false;                   // quán mới ở giữa lưới → camera căn lại từ đầu
  $('rest-away').hidden = true;
  $('shopModal').classList.remove('show');
  $('menuModal').classList.remove('show');
  closePop();
  renderRestaurant();
  toast('Restaurant reset', 2000);
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

  $('rest-toggle').addEventListener('pointerup', () => setNav(!navOn));

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
  rest.addEventListener('pointercancel', e => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; cancelDrag(); });
  rest.addEventListener('wheel', onStageWheel, { passive: false });
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
  // #44: nhịp 1 = nạp đạn (nút đỏ, tự nguội sau 4s), nhịp 2 = xoá. Không dùng confirm() của
  // trình duyệt: nó chặn cả vòng đời khách đang chạy và nhìn không giống phần còn lại của game.
  $('rest-reset').addEventListener('pointerup', () => {
    if ($('rest-reset').classList.contains('armed')) return resetRestaurant();
    armReset(true);
    toast('Tap again to wipe your restaurant', 3000);
  });

  window.addEventListener('resize', () => { applyCam(); renderRestaurant(); });   // 13- Rule 17
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
