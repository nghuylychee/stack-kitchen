// Online room over PeerJS (06-online-room.md). The host owns the Match; clients only
// send intents and receive redacted events. Peer id = PREFIX + room code.
import Peer, { type DataConnection } from 'peerjs';
import { Match, type SeatConfig } from '../core/match';
import type { HostEvent, Intent } from '../core/types';

const PREFIX = 'stack-kitchen-v1-';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';     // no 0/O/1/I
const PING_MS = 2000, HOST_SILENCE_MS = 9000, CLIENT_SILENCE_MS = 7000;

export const makeCode = () => Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
const newToken = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export interface LobbySeat { name: string; human: boolean; connected: boolean; you: boolean; host: boolean }
export interface LobbyState { code: string; size: number; seats: LobbySeat[]; started: boolean }

type ToClient =
  | { k: 'welcome'; seat: number; token: string }
  | { k: 'lobby'; seat: number; size: number; seats: Omit<LobbySeat, 'you'>[]; started: boolean }
  | { k: 'refuse'; reason: string }
  | { k: 'ev'; ev: HostEvent }
  | { k: 'ping' }
  | { k: 'closed' };
type ToHost =
  | { k: 'hello'; name: string; token: string | null }
  | { k: 'intent'; m: Intent }
  | { k: 'pong' };

export interface RoomCallbacks {
  onLobby(s: LobbyState): void;
  onEvent(ev: HostEvent): void;
  onFatal(msg: string): void;          // room gone / refused / network error
}

interface Member { token: string; name: string; conn: DataConnection | null; lastSeen: number }

// ====================================================================== host
export class RoomHost {
  code = makeCode();
  size = 4;
  match: Match | null = null;
  private peer: Peer | null = null;
  private members: Member[] = [];       // index = seat; 0 = host
  private timer: ReturnType<typeof setInterval> | null = null;
  private closed = false;

  constructor(hostName: string, private cb: RoomCallbacks) {
    this.members.push({ token: 'host', name: hostName, conn: null, lastSeen: Date.now() });
  }

  open(): Promise<string> {
    return new Promise((resolve, reject) => {
      let tries = 0;
      const attempt = () => {
        const peer = new Peer(PREFIX + this.code);
        this.peer = peer;
        peer.on('open', () => { this.pushLobby(); resolve(this.code); });
        peer.on('connection', conn => this.accept(conn));
        peer.on('error', (err: { type?: string; message?: string }) => {
          if (err.type === 'unavailable-id' && tries++ < 5) { peer.destroy(); this.code = makeCode(); attempt(); return; }
          if (this.closed) return;
          if (!peer.open) reject(new Error(err.message || String(err.type)));
          else console.warn('peer error', err);
        });
        peer.on('disconnected', () => { if (!this.closed) peer.reconnect(); });
      };
      attempt();
      this.timer = setInterval(() => this.heartbeat(), PING_MS);
    });
  }

  private heartbeat() {
    const now = Date.now();
    this.members.forEach((m, seat) => {
      if (!m.conn) return;
      if (now - m.lastSeen > CLIENT_SILENCE_MS) { const c = m.conn; this.drop(seat); c.close(); return; }
      this.sendTo(m, { k: 'ping' });
    });
  }

  private accept(conn: DataConnection) {
    conn.on('data', raw => {
      if (this.closed) return;
      const msg = raw as ToHost;
      const seat = this.members.findIndex(m => m.conn === conn);
      if (msg.k === 'hello') { this.hello(conn, msg); return; }
      if (seat < 0) return;
      this.members[seat].lastSeen = Date.now();
      if (msg.k === 'intent' && this.match) this.match.intent(seat, msg.m);
    });
    const gone = () => { const seat = this.members.findIndex(m => m.conn === conn); if (seat > 0) this.drop(seat); };
    conn.on('close', gone);
    conn.on('error', gone);
  }

  private hello(conn: DataConnection, msg: { name: string; token: string | null }) {
    const name = (msg.name || 'Chef').trim().slice(0, 12) || 'Chef';
    const refuse = (reason: string) => { conn.send({ k: 'refuse', reason } satisfies ToClient); setTimeout(() => conn.close(), 300); };
    let seat = msg.token ? this.members.findIndex((m, i) => i > 0 && m.token === msg.token) : -1;
    // a token whose seat is still live belongs to another tab of the same browser → treat as a new player
    if (seat > 0 && this.members[seat].conn?.open && Date.now() - this.members[seat].lastSeen < CLIENT_SILENCE_MS) seat = -1;
    if (seat > 0) {                                                  // rejoin
      const m = this.members[seat];
      if (m.conn && m.conn !== conn) m.conn.close();
      Object.assign(m, { conn, name, lastSeen: Date.now() });
    } else {
      if (this.match) return refuse('Game already started');
      if (this.members.length >= this.size) return refuse('Room full');
      this.members.push({ token: newToken(), name, conn, lastSeen: Date.now() });
      seat = this.members.length - 1;
    }
    const m = this.members[seat];
    this.sendTo(m, { k: 'welcome', seat, token: m.token });
    if (this.match) { this.match.setConnected(seat, true, name); this.match.syncSeat(seat); }
    this.pushLobby();
  }

  private drop(seat: number) {
    if (this.closed) return;
    const m = this.members[seat];
    if (!m || !m.conn) return;
    m.conn = null;
    if (this.match) this.match.setConnected(seat, false);
    else this.members.splice(seat, 1);                               // lobby: free the seat, later joiners move up
    this.pushLobby();
  }

  setSize(n: number) {
    if (this.match) return;
    this.size = Math.max(this.members.length, Math.min(4, Math.max(2, n)));
    this.pushLobby();
  }

  private lobbySeats(): Omit<LobbySeat, 'you'>[] {
    const out: Omit<LobbySeat, 'you'>[] = [];
    for (let i = 0; i < this.size; i++) {
      const m = this.members[i];
      if (m) out.push({ name: m.name, human: true, connected: i === 0 || !!m.conn, host: i === 0 });
      else out.push({ name: `Bot ${i}`, human: false, connected: false, host: false });
    }
    return out;
  }
  private pushLobby() {
    const seats = this.lobbySeats();
    const started = !!this.match;
    this.cb.onLobby({ code: this.code, size: this.size, seats: seats.map((s, i) => ({ ...s, you: i === 0 })), started });
    this.members.forEach((m, seat) => { if (m.conn) this.sendTo(m, { k: 'lobby', seat, size: this.size, seats, started }); });
  }

  start() {
    if (!this.match) {
      const seats: SeatConfig[] = this.lobbySeats().map((s, i) => ({ name: s.name, human: s.human, connected: i === 0 || !!this.members[i]?.conn }));
      this.match = new Match(seats, true, (seat, ev) => {
        if (this.closed) return;
        if (seat === 0) this.cb.onEvent(ev);
        else { const m = this.members[seat]; if (m) this.sendTo(m, { k: 'ev', ev }); }
      });
      this.pushLobby();
    }
    this.match.start();
  }

  intent(m: Intent) { this.match?.intent(0, m); }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.match?.stop();
    for (const m of this.members) if (m.conn) { try { m.conn.send({ k: 'closed' } satisfies ToClient); } catch { /* ignore */ } }
    if (this.timer) clearInterval(this.timer);
    setTimeout(() => this.peer?.destroy(), 200);
  }

  private sendTo(m: Member, msg: ToClient) {
    if (!m.conn || !m.conn.open) return;
    try { m.conn.send(msg); } catch (e) { console.warn(e); }
  }
}

// ====================================================================== client
export class RoomClient {
  seat = -1;
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private lastSeen = Date.now();
  private timer: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private retries = 0;

  constructor(public code: string, private name: string, private cb: RoomCallbacks) {}

  private tokenKey() { return 'sk-token-' + this.code; }

  open() {
    const peer = new Peer();
    this.peer = peer;
    peer.on('open', () => {
      const conn = peer.connect(PREFIX + this.code, { reliable: true });
      this.conn = conn;
      this.wireConn(conn);
    });
    peer.on('error', (err: { type?: string; message?: string }) => {
      if (err.type === 'peer-unavailable') this.fatal(`Room ${this.code} not found`);
      else if (!this.conn?.open) this.fatal('Could not connect: ' + (err.message || err.type));
      else console.warn('peer error', err);
    });
    this.timer = setInterval(() => {
      if (this.conn?.open && Date.now() - this.lastSeen > HOST_SILENCE_MS) this.fatal('Host left — room closed');
    }, 1000);
  }

  private wireConn(conn: DataConnection) {
    conn.on('open', () => {
      let token: string | null = null;
      try { token = localStorage.getItem(this.tokenKey()); } catch { /* ignore */ }
      this.lastSeen = Date.now();
      conn.send({ k: 'hello', name: this.name, token } satisfies ToHost);
    });
    conn.on('data', raw => { if (conn === this.conn) this.onData(raw as ToClient); });
    conn.on('close', () => { if (conn === this.conn) this.fatal('Host left — room closed'); });
    conn.on('error', () => { if (conn === this.conn) this.fatal('Connection lost'); });
  }

  private onData(msg: ToClient) {
    this.lastSeen = Date.now();
    switch (msg.k) {
      case 'ping': this.conn?.send({ k: 'pong' } satisfies ToHost); return;
      case 'welcome':
        this.seat = msg.seat;
        try { localStorage.setItem(this.tokenKey(), msg.token); } catch { /* ignore */ }
        return;
      case 'lobby':
        this.seat = msg.seat;
        this.cb.onLobby({ code: this.code, size: msg.size, started: msg.started, seats: msg.seats.map((s, i) => ({ ...s, you: i === this.seat })) });
        return;
      case 'refuse':
        if (msg.reason === 'Game already started' && this.retries++ < 3) { this.retry(); return; }
        this.fatal(msg.reason); return;
      case 'closed': this.fatal('Host left — room closed'); return;
      case 'ev': this.cb.onEvent(msg.ev); return;
    }
  }

  // our previous connection may still look alive to the host for a few seconds — reconnect after it times out
  private retry() {
    const old = this.conn;
    this.conn = null;
    old?.removeAllListeners();
    old?.close();
    setTimeout(() => {
      if (this.closed || !this.peer) return;
      const conn = this.peer.connect(PREFIX + this.code, { reliable: true });
      this.conn = conn;
      this.wireConn(conn);
    }, CLIENT_SILENCE_MS / 2);
  }

  intent(m: Intent) { if (this.conn?.open) this.conn.send({ k: 'intent', m } satisfies ToHost); }

  private fatal(msg: string) {
    if (this.closed) return;
    this.close();
    this.cb.onFatal(msg);
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    if (this.timer) clearInterval(this.timer);
    try { this.conn?.close(); } catch { /* ignore */ }
    setTimeout(() => this.peer?.destroy(), 200);
  }
}
