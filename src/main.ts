// Screens: Restaurant → (Play vs Bots | Create room → Lobby | Join room → Lobby) → Table.
// The restaurant is the meta layer (design/12-restaurant-meta.md); it never reaches core/ or net/.
import { Match } from './core/match';
import { RoomClient, RoomHost, cleanCode, type LobbyState } from './net/room';
import { enterTable, leaveTable, onHostEvent, toast } from './ui/table';
import { awardMatch, enterRestaurant, playerName, renderRestaurant, restaurantShown, restMsg, setBotCount, setJoinCode, unlockFromMatch } from './ui/restaurant';
import type { HostEvent } from './core/types';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

type Screen = 'restaurant' | 'lobby' | 'app';
function show(s: Screen) {
  for (const id of ['restaurant', 'lobby', 'app'] as Screen[]) $(id).hidden = id !== s;
  restaurantShown(s === 'restaurant');          // 16- Rule 2: khách chỉ sống khi màn quán đang hiện
}

// ------------------------------------------------------------------ thưởng sau ván (14-)
// Client tự tính từ `end.view` đã có sẵn — không thêm field vào HostEvent, không hỏi host, không
// gửi gì qua mạng (14- Rule 2, 10). Match không biết gì về chuyện này (12- Rule 6).
let endAwarded = false;

function meta(ev: HostEvent) {
  if (ev.t === 'start') { endAwarded = false; return; }        // Play again = ván mới, thưởng lại được
  if (ev.t !== 'end' || endAwarded) return;                    // 14- Rule 6: mỗi `end` cộng đúng 1 lần
  endAwarded = true;
  const v = ev.view, me = v.players[v.you];
  if (!me) return;
  const top = Math.max(...v.players.map(p => p.score));
  awardMatch(me.score, me.score === top, ev.finisher === v.you);   // hoà nhất vẫn tính thắng (Rule 4)
  unlockFromMatch(me.foods.map(f => f.dish));                      // 17- Rule 2: nấu được món nào thì quán bán được món đó
}

// ------------------------------------------------------------------ session
let offline: Match | null = null;
let host: RoomHost | null = null;
let client: RoomClient | null = null;
let onTable = false;

function endSession() {
  offline?.stop(); offline = null;
  host?.close(); host = null;
  client?.close(); client = null;
  if (onTable) { leaveTable(); onTable = false; }
  document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
  const url = new URL(location.href);
  if (url.searchParams.has('room')) { url.searchParams.delete('room'); history.replaceState(null, '', url); }
}

// 12- Rule 1: the Home screen is gone — leaving a match or a lobby lands back in the restaurant.
function goRestaurant(msg = '', ok = false) {
  endSession();
  show('restaurant');
  renderRestaurant();
  restMsg(msg, ok);
}

// ------------------------------------------------------------------ offline
function startBots(n: number) {
  endSession();
  const me = playerName() || 'You';                             // 12- Rule 7: one source for the player's name
  const seats = Array.from({ length: n }, (_, i) => ({ name: i === 0 ? me : `Bot ${i}`, human: i === 0, connected: i === 0 }));
  const match = new Match(seats, false, (_seat, ev) => { meta(ev); onHostEvent(ev); });
  offline = match;
  enterTable({ send: m => match.intent(0, m), onHome: () => goRestaurant(), onAgain: () => match.start(), isHost: true, online: false });
  onTable = true;
  show('app');
  match.start();
}

// ------------------------------------------------------------------ online
const tableEvent = (roomCode: string, isHost: boolean) => (ev: HostEvent) => {
  if (!onTable) {
    enterTable({
      send: m => (host ? host.intent(m) : client?.intent(m)),
      onHome: () => goRestaurant(),
      onAgain: () => host?.start(),
      isHost, online: true, roomCode,
    });
    onTable = true;
    show('app');
  }
  meta(ev);
  onHostEvent(ev);
};

function renderLobby(s: LobbyState, isHost: boolean) {
  if (onTable) return;
  show('lobby');
  $('lobbyCode').textContent = s.code;
  const link = new URL(location.href);
  link.search = ''; link.hash = '';
  link.searchParams.set('room', s.code);
  $<HTMLInputElement>('shareLink').value = link.toString();
  $('seatCount').hidden = !isHost;
  const humans = s.seats.filter(x => x.human).length;
  $('seatCount').querySelectorAll<HTMLButtonElement>('button').forEach(b => {
    b.classList.toggle('on', +b.dataset.n! === s.size);
    b.disabled = +b.dataset.n! < humans;
  });
  $('seatList').innerHTML = s.seats.map(x => `<li class="${x.human ? '' : 'bot'}">
      <span class="stool ${x.human ? 'r' : 'b'}"></span>
      <span class="who">${esc(x.name)}${x.you ? ' (you)' : ''}</span>
      ${x.host ? '<span class="tagx">HOST</span>' : ''}
      ${x.human && !x.connected ? '<span class="tagx off">offline</span>' : ''}
      ${!x.human ? '<span class="tagx off">bot</span>' : ''}
    </li>`).join('');
  $('btnStart').hidden = !isHost;
  const msg = $('lobbyMsg'); msg.classList.add('ok');
  msg.textContent = isHost
    ? (humans < 2 ? 'Share the code or link. Empty seats are played by bots.' : `${humans} players here. Empty seats are played by bots.`)
    : s.started ? 'Game in progress — reconnecting…' : 'Waiting for the host to start…';
}

function needName() {                                           // online still needs a name (as before)
  restMsg('Name your chef first');
  $<HTMLInputElement>('rest-name').focus();
}

async function createRoom() {
  const name = playerName();
  if (!name) return needName();
  endSession();
  const h = new RoomHost(name, {
    onLobby: s => renderLobby(s, true),
    onEvent: ev => tableEvent(h.code, true)(ev),
    onFatal: msg => goRestaurant(msg),
  });
  host = h;
  show('lobby');
  $('lobbyCode').textContent = '·····';
  $('seatList').innerHTML = '';
  $('btnStart').hidden = true;
  $('lobbyMsg').textContent = 'Opening room…';
  try { await h.open(); }
  catch (e) { if (host === h) goRestaurant('Could not open room: ' + (e as Error).message); }
}

function joinRoom(codeIn?: string) {
  const code = cleanCode(codeIn ?? '');
  const name = playerName();
  if (!name) return needName();
  if (code.length !== 5) { restMsg('Room code is 5 characters'); $('roomCode').focus(); return; }
  endSession();
  const c = new RoomClient(code, name, {
    onLobby: s => renderLobby(s, false),
    onEvent: tableEvent(code, false),
    onFatal: msg => goRestaurant(msg),
  });
  client = c;
  show('lobby');
  $('lobbyCode').textContent = code;
  $('seatList').innerHTML = '';
  $('seatCount').hidden = true;
  $('btnStart').hidden = true;
  $('lobbyMsg').textContent = 'Connecting…';
  c.open();
}

// ------------------------------------------------------------------ wiring
function init() {
  enterRestaurant({ onBots: startBots, onCreate: createRoom, onJoin: joinRoom });
  $('seatCount').addEventListener('pointerup', e => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b || (b as HTMLButtonElement).disabled) return;
    host?.setSize(+b.dataset.n!);
  });
  $('btnStart').addEventListener('pointerup', () => host?.start());
  $('btnLeaveLobby').addEventListener('pointerup', () => goRestaurant());
  $('btnCopy').addEventListener('pointerup', async () => {
    const v = $<HTMLInputElement>('shareLink').value;
    try { await navigator.clipboard.writeText(v); toast('Link copied', 1200); }
    catch { $<HTMLInputElement>('shareLink').select(); }
  });
  window.addEventListener('beforeunload', () => { host?.close(); client?.close(); });

  const params = new URLSearchParams(location.search);
  const room = cleanCode(params.get('room') || '');
  const qp = params.get('players');
  if (['2', '3', '4'].includes(qp || '')) setBotCount(+qp!);

  show('restaurant');
  renderRestaurant();
  if (room.length === 5) {                                      // 12- Rule 10: invite link goes straight to the lobby
    setJoinCode(room);
    if (playerName()) joinRoom(room);
    else { restMsg(`Name your chef to join room ${room}`, true); $<HTMLInputElement>('rest-name').focus(); }
  }
}

init();
