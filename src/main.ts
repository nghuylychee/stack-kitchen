// Screens: Home → (Play vs Bots | Create room → Lobby | Join room → Lobby) → Table.
import { Match } from './core/match';
import { RoomClient, RoomHost, cleanCode, type LobbyState } from './net/room';
import { enterTable, leaveTable, onHostEvent, toast } from './ui/table';
import type { HostEvent } from './core/types';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

type Screen = 'home' | 'lobby' | 'app';
function show(s: Screen) {
  for (const id of ['home', 'lobby', 'app'] as Screen[]) $(id).hidden = id !== s;
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

function goHome(msg = '', ok = false) {
  endSession();
  show('home');
  const m = $('homeMsg'); m.textContent = msg; m.classList.toggle('ok', ok);
}

const nick = () => {
  const v = $<HTMLInputElement>('nick').value.trim().slice(0, 12);
  if (v) store.set('sk-nick', v);
  return v;
};

// ------------------------------------------------------------------ offline
let botCount = 4;
function startBots() {
  endSession();
  const seats = Array.from({ length: botCount }, (_, i) => ({ name: i === 0 ? 'You' : `Bot ${i}`, human: i === 0, connected: i === 0 }));
  const match = new Match(seats, false, (_seat, ev) => onHostEvent(ev));
  offline = match;
  enterTable({ send: m => match.intent(0, m), onHome: () => goHome(), onAgain: () => match.start(), isHost: true, online: false });
  onTable = true;
  show('app');
  match.start();
}

// ------------------------------------------------------------------ online
const tableEvent = (roomCode: string, isHost: boolean) => (ev: HostEvent) => {
  if (!onTable) {
    enterTable({
      send: m => (host ? host.intent(m) : client?.intent(m)),
      onHome: () => goHome(),
      onAgain: () => host?.start(),
      isHost, online: true, roomCode,
    });
    onTable = true;
    show('app');
  }
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

async function createRoom() {
  const name = nick();
  if (!name) { $('homeMsg').textContent = 'Enter your name first'; $('nick').focus(); return; }
  endSession();
  const h = new RoomHost(name, {
    onLobby: s => renderLobby(s, true),
    onEvent: ev => tableEvent(h.code, true)(ev),
    onFatal: msg => goHome(msg),
  });
  host = h;
  show('lobby');
  $('lobbyCode').textContent = '·····';
  $('seatList').innerHTML = '';
  $('btnStart').hidden = true;
  $('lobbyMsg').textContent = 'Opening room…';
  try { await h.open(); }
  catch (e) { if (host === h) goHome('Could not open room: ' + (e as Error).message); }
}

function joinRoom(codeIn?: string) {
  const code = cleanCode(codeIn ?? $<HTMLInputElement>('roomCode').value);
  const name = nick();
  if (!name) { $('homeMsg').textContent = 'Enter your name first'; $('nick').focus(); return; }
  if (code.length !== 5) { $('homeMsg').textContent = 'Room code is 5 characters'; $('roomCode').focus(); return; }
  endSession();
  const c = new RoomClient(code, name, {
    onLobby: s => renderLobby(s, false),
    onEvent: tableEvent(code, false),
    onFatal: msg => goHome(msg),
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
function segment(boxId: string, onPick: (n: number) => void) {
  $(boxId).addEventListener('pointerup', e => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b || b.disabled) return;
    $(boxId).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    onPick(+b.dataset.n!);
  });
}

function init() {
  const nickEl = $<HTMLInputElement>('nick');
  nickEl.value = store.get('sk-nick') || '';
  segment('botCount', n => (botCount = n));
  segment('seatCount', n => host?.setSize(n));
  $('btnBots').addEventListener('pointerup', startBots);
  $('btnCreate').addEventListener('pointerup', createRoom);
  $('btnJoin').addEventListener('pointerup', () => joinRoom());
  $('roomCode').addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom(); });
  $('btnStart').addEventListener('pointerup', () => host?.start());
  $('btnLeaveLobby').addEventListener('pointerup', () => goHome());
  $('btnCopy').addEventListener('pointerup', async () => {
    const v = $<HTMLInputElement>('shareLink').value;
    try { await navigator.clipboard.writeText(v); toast('Link copied', 1200); }
    catch { $<HTMLInputElement>('shareLink').select(); }
  });
  window.addEventListener('beforeunload', () => { host?.close(); client?.close(); });

  const params = new URLSearchParams(location.search);
  const room = cleanCode(params.get('room') || '');
  const qp = params.get('players');
  if (['2', '3', '4'].includes(qp || '')) {
    botCount = +qp!;
    $('botCount').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.n === qp));
  }
  show('home');
  if (room.length === 5) {
    $<HTMLInputElement>('roomCode').value = room;
    if (nickEl.value) joinRoom(room);
    else { $('homeMsg').textContent = `Enter your name to join room ${room}`; $('homeMsg').classList.add('ok'); nickEl.focus(); }
  }
}

init();
