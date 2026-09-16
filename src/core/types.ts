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
}

// Redacted state for one seat. Never contains other hands or pool order.
export interface View {
  you: number;
  players: PublicPlayer[];
  hand: CardType[];
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
  | { t: 'draw'; seat: number; card: CardType | null; view: View }
  | { t: 'prompt'; kind: 'draw' | 'play'; msLeft: number | null; view: View }
  | { t: 'cookShow'; seat: number; dish: string; view: View }
  | { t: 'reveal'; seat: number; dish: string; viaClaim: boolean; view: View }
  | { t: 'play'; seat: number; card: CardType; view: View }
  | { t: 'claimOpen'; card: CardType; by: string; opts: string[]; msLeft: number | null; view: View }
  | { t: 'claimClose'; view: View }
  | { t: 'claimResult'; winner: number; dish: string; pts: number; card: CardType; yourPts: number | null; view: View }
  | { t: 'discard'; card: CardType; view: View }
  | { t: 'emptyHand'; seat: number; view: View }
  | { t: 'end'; reason: 'full' | 'pool'; finisher: number | null; view: View }
  | { t: 'reject'; msg: string; view: View }
  | { t: 'sync'; view: View; phase: 'wait' | 'draw' | 'play' | 'claim'; claim?: { card: CardType; by: string; opts: string[] }; food?: string; msLeft: number | null };

export type Intent =
  | { t: 'draw' }
  | { t: 'cook'; dish: string }
  | { t: 'collect' }
  | { t: 'play'; card: CardType }
  | { t: 'claimCook'; dish: string }
  | { t: 'pass' };
