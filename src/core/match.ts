// Host-authoritative match. Runs the rules (01–05) and bots, paces events with the same
// timings the client animates with, and talks to seats only through send()/intent().
// Used as-is for both modes: offline = one local human seat, online = PeerJS host.
import {
  AI_STEP_MS, CLAIM_WINDOW_MS, COOK_MS, COPIES_PER_TYPE_MENU, COURSE_NAME, HAND_SIZE, introMs,
  MENU_SIZE, ORDER_BONUS, ORDER_SIZE, PLAY_REVEAL_MS, RECIPES, REFILL_STAGGER_MS, configErrors, T, TURN_LIMIT_MS, TYPE_ORDER, label, type CardType, type Recipe,
} from './data';
import { claimable, orderDone, removeOne, shuffle, sortHand, type FoodLike } from './rules';
import { aiChooseClaim, aiChooseDiscard, aiChooseReveal, type BotSelf, type BotTable, type PubEv } from '../ai/bot';
import type { HostEvent, Intent, View } from './types';

export interface SeatConfig { name: string; human: boolean; connected: boolean }

interface P {
  idx: number; name: string; human: boolean; connected: boolean;
  hand: CardType[]; foods: FoodLike[]; score: number; bonus: number;
  order: string[];                                                    // 07 Rule 5 — secret, host-only until the end
  cook: { r: Recipe; start: number; id: number } | null;
  ready: Recipe | null; autoCollect: boolean;
  prompt: { phase: 'draw' | 'play' | 'claim'; deadline: number | null; claim?: { card: CardType; by: string; opts: string[] } } | null;
}

type Res<T> = { done: T } | { keep: true } | { err: string };
const TIMEOUT = Symbol('timeout'), GONE = Symbol('gone'), ENDED = Symbol('ended');
type Stop = typeof TIMEOUT | typeof GONE | typeof ENDED;
interface Waiter { handle: (m: Intent) => Res<unknown>; resolve: (v: unknown) => void; timer: ReturnType<typeof setTimeout> | null }

class Abort extends Error {}

export class Match {
  players: P[];
  pool: CardType[] = [];
  menu: Recipe[] = [];                                                // 07 Rule 1 — public
  private pub: PubEv[] = [];                                          // public event history bots read (05 Rule 8)
  discard: CardType[] = [];
  current = 0; turn = 0; claims = 0; ended = false;
  lastPlayed: CardType | null = null; lastBy: string | null = null;
  private token = 0;
  private cookId = 0;
  private waiters = new Map<number, Waiter>();

  constructor(seats: SeatConfig[], private online: boolean, private send: (seat: number, ev: HostEvent) => void) {
    this.players = seats.map((s, idx) => ({ idx, name: s.name, human: s.human, connected: s.human && s.connected,
      hand: [], foods: [], score: 0, bonus: 0, order: [], cook: null, ready: null, autoCollect: false, prompt: null }));
  }

  // ------------------------------------------------------------------ lifecycle
  start() {
    this.stop();
    const bad = configErrors();
    if (bad.length) {                                                 // config.ts edited into an impossible game — don't deal
      console.error('Stack Kitchen: invalid src/core/config.ts —\n  ' + bad.join('\n  '));
      this.emit(() => ({ t: 'toast', msg: 'Invalid config — see console' }));
      return;
    }
    const tok = this.token;
    const n = this.players.length;
    this.menu = shuffle(RECIPES.slice()).slice(0, MENU_SIZE[n]);        // 07 Rule 1
    const types = TYPE_ORDER.filter(t => this.menu.some(r => r.types.includes(t)));
    const deck: CardType[] = [];
    types.forEach(t => { for (let i = 0; i < COPIES_PER_TYPE_MENU; i++) deck.push(t); });   // 07 Rule 2-3
    shuffle(deck);
    for (const p of this.players) Object.assign(p, { hand: [], foods: [], score: 0, bonus: 0, cook: null, ready: null, autoCollect: false, prompt: null,
      order: shuffle(this.menu.slice()).slice(0, ORDER_SIZE[n]).map(r => r.dish) });   // 07 Rule 5-6: independent, may overlap
    for (let k = 0; k < HAND_SIZE; k++) for (const p of this.players) p.hand.push(deck.pop()!);
    this.players.forEach(p => sortHand(p.hand));
    this.pub = [];
    Object.assign(this, { pool: deck, discard: [], current: Math.floor(Math.random() * n), turn: 0, claims: 0, ended: false, lastPlayed: null, lastBy: null });
    this.emit(() => ({ t: 'start' }));
    this.log(() => `New game: ${n} players, ${HAND_SIZE} cards each, pool ${deck.length}. ${this.players[this.current].name} starts.`);
    this.log(() => `Menu: ${this.menu.map(r => r.dish).join(', ')}.`, '',          // 07 "Theo dõi khi build": real pool size per game
      `${types.length} ingredient types × ${COPIES_PER_TYPE_MENU} = ${types.length * COPIES_PER_TYPE_MENU} cards, ${deck.length} left after the deal`);
    this.log(s => `Your order: ${this.players[s].order.join(', ')}.`, 'reveal');
    this.run(tok).catch(e => { if (!(e instanceof Abort)) console.error(e); });
  }

  stop() {
    this.token++;
    for (const [seat, w] of this.waiters) { if (w.timer) clearTimeout(w.timer); this.waiters.delete(seat); w.resolve(ENDED); }
  }

  // ------------------------------------------------------------------ seat I/O
  intent(seat: number, m: Intent) {
    const p = this.players[seat];
    if (!p || !this.controlled(p)) return;
    const w = this.waiters.get(seat);
    if (!w) { this.reject(seat, 'Not now'); return; }
    const r = w.handle(m);
    if ('err' in r) this.reject(seat, r.err);
    else if ('done' in r) this.finishWait(seat, r.done);
  }

  setConnected(seat: number, connected: boolean, name?: string) {
    const p = this.players[seat];
    if (!p || !p.human || p.connected === connected) return;
    p.connected = connected;
    if (name) p.name = name;
    if (!connected) {
      this.log(() => `${p.name} disconnected — a bot plays for them.`, 'end');
      this.finishWait(seat, GONE);
      p.prompt = null;
    } else {
      this.log(() => `${p.name} is back.`, 'reveal');
    }
    this.broadcastSync();
  }

  // full snapshot for one seat (rejoin, seat changes)
  syncSeat(seat: number) {
    const p = this.players[seat];
    const pr = p.prompt;
    const food = p.cook ? p.cook.r.dish : p.ready ? p.ready.dish : undefined;
    this.send(seat, { t: 'sync', view: this.view(seat), phase: pr ? pr.phase : 'wait', claim: pr?.claim, food,
      msLeft: pr && pr.deadline ? Math.max(0, pr.deadline - Date.now()) : null });
  }
  private broadcastSync() { for (const p of this.players) if (this.controlled(p)) this.syncSeat(p.idx); }

  // ------------------------------------------------------------------ views & emit
  private controlled = (p: P) => p.human && p.connected;

  view(seat: number): View {
    const me = this.players[seat];
    return {
      you: seat,
      players: this.players.map(p => ({ idx: p.idx, name: p.name, human: p.human, connected: p.connected, handCount: p.hand.length,
        foods: p.foods.slice(), score: p.score, bonus: p.bonus, hand: this.ended ? p.hand.slice() : undefined,
        order: this.ended ? p.order.slice() : undefined,
        orderDone: p.order.filter(d => orderDone(p, d)).length, orderSize: p.order.length })),   // 09 Rule 2 — count only
      hand: me.hand.slice(), menu: this.menu.map(r => r.dish), order: me.order.slice(), pool: this.pool.length, discard: this.discard.slice(), lastPlayed: this.lastPlayed, lastBy: this.lastBy,
      current: this.current, turn: this.turn, claims: this.claims, ended: this.ended, online: this.online,
    };
  }

  // build(seat) returns the event without `view`; view is attached per seat. `only` filters recipients.
  private emit(build: (seat: number) => Record<string, unknown> | null, only?: (p: P) => boolean) {
    for (const p of this.players) {
      if (!this.controlled(p) || (only && !only(p))) continue;
      const ev = build(p.idx); if (!ev) continue;
      this.send(p.idx, { ...ev, view: this.view(p.idx) } as unknown as HostEvent);
    }
  }
  // a rejected intent means the client guessed wrong — toast, then resync that seat from truth
  private reject(seat: number, msg: string) { this.send(seat, { t: 'reject', msg, view: this.view(seat) }); this.syncSeat(seat); }

  // what a bot may know: its own hand + Order, and public table state (05 Overview — never other hands/Orders/pool)
  private botSelf = (p: P): BotSelf => ({ idx: p.idx, hand: p.hand, foods: p.foods, order: p.order });
  private botTable(): BotTable {
    return { menu: this.menu, discard: this.discard, lastPlayed: this.lastPlayed, players: this.players.map(p => ({ foods: p.foods })), pub: this.pub };
  }

  private nm = (p: P, seat: number) => p.idx === seat ? 'You' : p.name;
  private vb = (p: P, seat: number, verb: string, third?: string) => p.idx === seat ? verb : (third || verb + 's');
  private log(make: (seat: number) => string, cls = '', why = '', only?: (seat: number) => boolean) {
    for (const p of this.players) if (this.controlled(p) && (!only || only(p.idx))) this.send(p.idx, { t: 'log', msg: make(p.idx), cls, why });
  }

  // ------------------------------------------------------------------ timing
  private wait(ms: number) {
    const tok = this.token;
    return new Promise<void>((res, rej) => setTimeout(() => (tok === this.token ? res() : rej(new Abort())), ms));
  }
  private check(tok: number) { if (tok !== this.token || this.ended) throw new Abort(); }

  private waitFor<T>(p: P, ms: number | null, handle: (m: Intent) => Res<T>): Promise<T | Stop> {
    if (!this.controlled(p)) return Promise.resolve(GONE);
    return new Promise(resolve => {
      const w: Waiter = { handle, resolve: resolve as (v: unknown) => void, timer: null };
      if (ms !== null) w.timer = setTimeout(() => this.finishWait(p.idx, TIMEOUT), ms);
      this.waiters.set(p.idx, w);
    });
  }
  private finishWait(seat: number, v: unknown) {
    const w = this.waiters.get(seat); if (!w) return;
    if (w.timer) clearTimeout(w.timer);
    this.waiters.delete(seat);
    w.resolve(v);
  }
  private limit() { return this.online ? TURN_LIMIT_MS : null; }

  // ------------------------------------------------------------------ game loop
  private async run(tok: number) {
    const n = this.players.length;
    await this.wait(introMs(this.menu.length, this.players[0].order.length) + T.menuGap);   // 10-match-intro.md
    this.check(tok);
    await this.wait(200 + HAND_SIZE * n * T.dealStagger + T.deal + 60);
    while (!this.ended) {
      this.check(tok);
      const p = this.players[this.current];
      if (this.pool.length === 0) {                                   // 04 Rule 4
        this.emit(() => ({ t: 'toast', msg: 'Pool empty' }));
        await this.wait(700);
        this.endGame('pool', null); return;
      }
      if (this.controlled(p)) {
        const ms = this.limit();
        p.prompt = { phase: 'draw', deadline: ms ? Date.now() + ms : null };
        this.emit(s => s === p.idx ? { t: 'prompt', kind: 'draw', msLeft: ms } : null);
        const r = await this.waitFor(p, ms, m => m.t === 'draw' ? { done: true } : { err: 'Draw a card first' });
        p.prompt = null;
        this.check(tok);
        if (r === TIMEOUT) this.log(s => `${this.nm(p, s)} timed out — auto draw.`, 'why');
      } else {
        await this.wait(AI_STEP_MS);
      }
      this.check(tok);
      const card = this.pool.pop()!;
      p.hand.push(card); sortHand(p.hand);
      this.turn++;
      this.emit(s => ({ t: 'draw', seat: p.idx, card: s === p.idx ? card : null }));
      this.log(s => s === p.idx ? `You draw ${label(card)}.` : `${p.name} draws.`);
      await this.wait(T.draw);
      await this.playPhase(p, tok);
    }
  }

  private async playPhase(p: P, tok: number) {
    while (true) {
      this.check(tok);
      const pick = await this.checkAndPlay(p, tok);
      if (this.ended) return;
      if (pick === null) {                                            // 02 Rule 8
        this.log(s => `${this.nm(p, s)} ${this.vb(p, s, 'have', 'has')} no cards left to play.`);
        this.current = (p.idx + 1) % this.players.length; return;
      }
      const { card, why } = pick;
      removeOne(p.hand, card);
      this.lastPlayed = card; this.lastBy = p.name;
      this.pub.push({ k: 'play', seat: p.idx, card });
      this.emit(() => ({ t: 'play', seat: p.idx, card }));
      this.log(s => `${this.nm(p, s)} ${this.vb(p, s, 'play')} ${label(card)}.`, '', why);
      await this.wait(T.play + PLAY_REVEAL_MS);
      const w = await this.resolveClaims(p, card, tok);
      if (this.ended) return;
      if (!w) {                                                       // 03 Rule 8
        this.lastPlayed = null;
        this.discard.push(card);
        this.emit(() => ({ t: 'discard', card }));
        await this.wait(T.discard);
        this.current = (p.idx + 1) % this.players.length; return;
      }
      this.lastPlayed = null;                                         // 03 Rule 6-7
      await this.refill(w, tok);                                      // 08 Rule 2 — claim winner just revealed
      if (this.ended) return;
      p = w;
      this.current = w.idx;
    }
  }

  // 08 Rule 2-9 — right after a reveal, top up to HAND_SIZE + 1 (the player still owes one Play, which leaves
  // exactly HAND_SIZE). Stops quietly when the pool runs dry (Kết thúc B stays at Draw).
  private async refill(p: P, tok: number) {
    let k = 0;
    while (!this.ended && p.hand.length < HAND_SIZE + 1 && this.pool.length) {
      const card = this.pool.pop()!;
      p.hand.push(card); sortHand(p.hand); k++;
      this.emit(s => ({ t: 'draw', seat: p.idx, card: s === p.idx ? card : null, refill: true }));
      await this.wait(REFILL_STAGGER_MS); this.check(tok);
    }
    if (k) this.log(s => `${this.nm(p, s)} ${this.vb(p, s, 'refill')} +${k}.`);
  }

  // returns the card to play, or null when the hand is empty
  private async checkAndPlay(p: P, tok: number): Promise<{ card: CardType; why: string } | null> {
    if (this.controlled(p)) {
      const ms = this.limit();
      const deadline = ms ? Date.now() + ms : null;
      while (true) {
        if (this.ended) return null;
        if (p.hand.length === 0 && !p.cook && !p.ready) {
          this.emit(() => ({ t: 'emptyHand', seat: p.idx }));
          await this.wait(1000);
          return null;
        }
        p.prompt = { phase: 'play', deadline };
        this.emit(s => s === p.idx ? { t: 'prompt', kind: 'play', msLeft: deadline ? Math.max(0, deadline - Date.now()) : null } : null);
        const left = deadline ? Math.max(0, deadline - Date.now()) : null;
        const r = await this.waitFor<CardType | 'recheck'>(p, left, m => this.handlePlayIntent(p, m));
        p.prompt = null;
        this.check(tok);
        if (r === 'recheck') { await this.refill(p, tok); continue; }   // 08 Rule 2 — food just collected
        if (r === ENDED) return null;
        if (r === TIMEOUT || r === GONE) {
          if (r === TIMEOUT) this.log(s => `${this.nm(p, s)} timed out — bot plays this step.`, 'why');
          await this.settleCook(p, tok);
          if (this.ended) return null;
          await this.refill(p, tok);                                  // 08 Rule 2 — no-op unless a dish was just collected
          break;                                                      // fall through to the bot path
        }
        return { card: r, why: '' };
      }
    }
    while (true) {                                                    // 05 Rule 2
      const pick = aiChooseReveal(this.botSelf(p), this.botTable(), (r, why) => this.log(() => `${p.name} holds ${r.dish}`, 'why', why));
      if (!pick) break;
      await this.wait(AI_STEP_MS); this.check(tok);
      await this.botCook(p, pick.r, pick.why, false, tok);
      if (this.ended) return null;
      await this.refill(p, tok);                                      // 08 Rule 2 — may enable another dish
    }
    if (p.hand.length === 0) return null;
    await this.wait(AI_STEP_MS); this.check(tok);
    return aiChooseDiscard(this.botSelf(p), this.botTable());
  }

  private handlePlayIntent(p: P, m: Intent): Res<CardType | 'recheck'> {
    if (m.t === 'cook') {                                             // 02 Rule 11
      const r = this.menu.find(x => x.dish === m.dish);              // 07 Rule 4
      if (!r) return { err: 'Not on the menu' };
      if (!r.types.every(t => p.hand.includes(t))) return { err: 'You do not have those cards' };
      if (p.cook || p.ready) return { err: 'Collect your food first' };
      this.startCook(p, r);
      return { keep: true };
    }
    if (m.t === 'collect') {                                          // 02 Rule 12
      if (p.ready) { this.collectNow(p); return { done: 'recheck' }; }
      if (p.cook) { p.autoCollect = true; return { keep: true }; }
      return { err: 'Nothing to collect' };
    }
    if (m.t === 'play') {                                             // 03 Rule 1
      if (p.cook) return { err: 'Wait for the cook to finish' };
      if (p.ready) return { err: 'Collect your food first' };
      if (!p.hand.includes(m.card)) return { err: 'Card not in hand' };
      return { done: m.card };
    }
    return { err: 'Not now' };
  }

  private startCook(p: P, r: Recipe) {
    const id = ++this.cookId, tok = this.token;
    p.cook = { r, start: Date.now(), id };
    this.emit(() => ({ t: 'cookShow', seat: p.idx, dish: r.dish }), q => q.idx !== p.idx);
    setTimeout(() => {
      if (tok !== this.token || !p.cook || p.cook.id !== id) return;
      p.cook = null; p.ready = r;
      if (p.autoCollect) { this.collectNow(p); this.finishWait(p.idx, 'recheck'); }
    }, COOK_MS);
  }
  private collectNow(p: P) {
    const r = p.ready!; p.ready = null; p.autoCollect = false;
    this.revealFood(p, r, '', false);
  }
  // bot takeover mid-cook: let the cook finish, then collect it
  private async settleCook(p: P, tok: number) {
    if (p.cook) { p.autoCollect = false; await this.wait(Math.max(0, p.cook.start + COOK_MS - Date.now()) + 30); this.check(tok); }
    if (p.cook) { p.ready = p.cook.r; p.cook = null; }
    if (p.ready) this.collectNow(p);
  }

  private async botCook(p: P, r: Recipe, why: string, viaClaim: boolean, tok: number) {
    this.emit(() => ({ t: 'cookShow', seat: p.idx, dish: r.dish }));
    await this.wait(T.stackFly * r.types.length + 200 + COOK_MS + 450); this.check(tok);
    this.revealFood(p, r, why, viaClaim);
    await this.wait(400);
  }

  private revealFood(p: P, r: Recipe, why: string, viaClaim: boolean) {
    r.types.forEach(t => removeOne(p.hand, t));
    p.foods.push({ dish: r.dish, c: r.c, pts: r.pts, img: r.img });
    p.score += r.pts;
    this.pub.push({ k: 'reveal', seat: p.idx, dish: r.dish, viaClaim });
    this.emit(() => ({ t: 'reveal', seat: p.idx, dish: r.dish, viaClaim }));
    this.log(s => `${this.nm(p, s)} ${viaClaim ? this.vb(p, s, 'claim') + ' & reveal' + (p.idx === s ? '' : 's') : this.vb(p, s, 'reveal')} ${r.dish} (${COURSE_NAME[r.c]}) +${r.pts}`,
      viaClaim ? 'claim' : 'reveal', why);
    if (p.order.includes(r.dish)) {                                   // own seat only — never hints at others' orders
      const done = p.order.filter(d => orderDone(p, d)).length;
      this.log(s => `Order ${done}/${p.order.length} done.`, 'reveal', '', s => s === p.idx);
    }
    if (p.order.every(d => orderDone(p, d)) && !this.ended) {        // 07 Rule 10 — Kết thúc A'
      p.bonus = ORDER_BONUS; p.score += ORDER_BONUS;
      this.log(s => `${this.nm(p, s)} ${this.vb(p, s, 'finish', 'finishes')} ${p.idx === s ? 'your' : 'their'} order! +${ORDER_BONUS}`, 'end');
      this.endGame('order', p);
    }
  }

  // 03 Rules 2-5, 11-15 + 06 claim window. Bots decide instantly and secretly; humans get a simultaneous window.
  private async resolveClaims(discarder: P, card: CardType, tok: number): Promise<P | null> {
    const n = this.players.length;
    const others: P[] = [];
    for (let k = 1; k < n; k++) others.push(this.players[(discarder.idx + k) % n]);
    const bids: { q: P; r: Recipe; why: string; start: number; human: boolean }[] = [];
    const humans: { q: P; opts: Recipe[] }[] = [];
    const botBid = (q: P) => {                                       // 05 Rule 3 + 11
      const { pick, why } = aiChooseClaim(this.botSelf(q), this.botTable(), card);
      if (pick) bids.push({ q, r: pick.r, why: pick.why, start: 0, human: false });
      else { this.pub.push({ k: 'pass', seat: q.idx, card }); this.log(() => `${q.name} passes`, 'why', why); }
    };
    for (const q of others) {
      const opts = claimable(q.hand, card, this.menu).sort((a, b) => b.pts - a.pts);
      if (!opts.length) continue;
      if (this.controlled(q)) humans.push({ q, opts }); else botBid(q);
    }
    if (humans.length) {
      const ms = this.online ? CLAIM_WINDOW_MS : null;
      const deadline = ms ? Date.now() + ms : null;
      const results = await Promise.all(humans.map(({ q, opts }) => {
        const claim = { card, by: discarder.name, opts: opts.map(r => r.dish) };
        q.prompt = { phase: 'claim', deadline, claim };
        this.emit(s => s === q.idx ? { t: 'claimOpen', ...claim, msLeft: ms } : null);
        return this.waitFor<{ r: Recipe; start: number } | 'pass'>(q, ms, m => {
          if (m.t === 'pass') return { done: 'pass' };
          if (m.t === 'claimCook') {
            const r = opts.find(o => o.dish === m.dish);
            return r ? { done: { r, start: Date.now() } } : { err: 'That food does not use this card' };
          }
          return { err: 'Claim or Pass' };
        });
      }));
      this.check(tok);
      humans.forEach(({ q }, i) => {
        q.prompt = null;
        const res = results[i];
        if (res === GONE) botBid(q);
        else if (res === 'pass' || res === TIMEOUT || res === ENDED) {
          this.pub.push({ k: 'pass', seat: q.idx, card });
          this.log(s => `${this.nm(q, s)} ${this.vb(q, s, 'pass', 'passes')} on ${label(card)}.`);
        } else bids.push({ q, r: res.r, why: '', start: res.start, human: true });
      });
      this.emit(() => ({ t: 'claimClose' }), q => humans.some(h => h.q === q));
    }
    if (!bids.length) return null;
    const order = (q: P) => others.indexOf(q);
    bids.sort((a, b) => order(a.q) - order(b.q));
    let best = bids[0];
    for (const b of bids) if (b.r.pts > best.r.pts) best = b;         // ties: nearest clockwise
    if (bids.length > 1) this.log(() => `Claim contest on ${label(card)}: ` + bids.map(b => `${b.q.name}→${b.r.dish}(${b.r.pts})`).join(', ') + ` — ${best.q.name} wins`, 'claim');
    this.claims++;
    const w = best.q;
    if (best.human && this.controlled(w)) {                           // 03 Rule 14: winner's cook already runs on their screen
      w.hand.push(card); sortHand(w.hand);
      this.emit(s => ({ t: 'claimResult', winner: w.idx, dish: best.r.dish, pts: best.r.pts, card, yourPts: bids.find(b => b.q.idx === s)?.r.pts ?? null }));
      this.emit(() => ({ t: 'cookShow', seat: w.idx, dish: best.r.dish }), q => q !== w);
      await this.wait(Math.max(0, best.start + COOK_MS - Date.now()) + T.fanClose + 300 + T.collect); this.check(tok);
      this.revealFood(w, best.r, '', true);
      return w;
    }
    await this.wait(AI_STEP_MS); this.check(tok);
    this.emit(s => ({ t: 'claimResult', winner: w.idx, dish: best.r.dish, pts: best.r.pts, card, yourPts: bids.find(b => b.q.idx === s)?.r.pts ?? null }));
    await this.wait(300); this.check(tok);
    w.hand.push(card); sortHand(w.hand);
    await this.botCook(w, best.r, best.why, true, tok);
    return w;
  }

  private endGame(reason: 'order' | 'pool', finisher: P | null) {
    if (this.ended) return;
    this.ended = true;
    this.log(s => reason === 'order' ? `Game over — ${this.nm(finisher!, s)} finished ${finisher!.idx === s ? 'your' : 'their'} order first.` : 'Game over — pool empty.', 'end');
    this.emit(() => ({ t: 'end', reason, finisher: finisher ? finisher.idx : null }));
    this.stop();
  }
}
