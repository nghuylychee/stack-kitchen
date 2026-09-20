import type { CardType } from './data';
import type { FoodLike } from './rules';

export interface PublicPlayer {
  idx: number;
  name: string;
  human: boolean;        // seat owned by a real person
  connected: boolean;    // false → a bot is playing it right now
  handCount: number;
  foods: FoodLike[];
  score: number;
  bonus: number;
  hand?: CardType[];     // only revealed at game end
  order?: string[];      // only revealed at game end (07 Rule 13, 15)
  orderDone: number;     // Order dishes finished — public count, never which ones (09 Rule 1-2)
  orderSize: number;     // this game's ORDER_SIZE, same for every seat (09 Rule 1)
}

// Redacted state for one seat. Never contains other hands or pool order.
export interface View {
  you: number;
  players: PublicPlayer[];
  hand: CardType[];
  menu: string[];        // this game's Menu, public (07 Rule 14)
  order: string[];       // this seat's own Order only (07 Rule 15, 17)
  pool: number;
  discard: CardType[];
  lastPlayed: CardType | null;
  lastBy: string | null;
  current: number;
  turn: number;
  claims: number;
  ended: boolean;
  online: boolean;
}

export type HostEvent =
  | { t: 'start'; view: View }
  | { t: 'log'; msg: string; cls: string; why: string }
  | { t: 'toast'; msg: string }
  | { t: 'draw'; seat: number; card: CardType | null; refill?: boolean; view: View }   // refill: 08 end-of-turn top-up
  | { t: 'prompt'; kind: 'draw' | 'play'; msLeft: number | null; view: View }
  | { t: 'cookShow'; seat: number; dish: string; view: View }
  | { t: 'reveal'; seat: number; dish: string; viaClaim: boolean; view: View }
  | { t: 'play'; seat: number; card: CardType; view: View }
  | { t: 'claimOpen'; card: CardType; by: string; opts: string[]; msLeft: number | null; view: View }
  | { t: 'claimClose'; view: View }
  | { t: 'claimResult'; winner: number; dish: string; pts: number; card: CardType; yourPts: number | null; view: View }
  | { t: 'discard'; card: CardType; view: View }
  | { t: 'emptyHand'; seat: number; view: View }
  | { t: 'end'; reason: 'order' | 'pool'; finisher: number | null; view: View }
  | { t: 'reject'; msg: string; view: View }
  | { t: 'sync'; view: View; phase: 'wait' | 'draw' | 'play' | 'claim'; claim?: { card: CardType; by: string; opts: string[] }; food?: string; msLeft: number | null };

export type Intent =
  | { t: 'draw' }
  | { t: 'cook'; dish: string }
  | { t: 'collect' }
  | { t: 'play'; card: CardType }
  | { t: 'claimCook'; dish: string }
  | { t: 'pass' };
