// 14-gold-xp-level.md — thưởng sau ván và đường cong level. Hàm thuần, không đụng DOM, không
// đụng Match: gọi từ client khi nhận `end` event, dữ liệu lấy từ `end.view` đã có sẵn.
import {
  GOLD_BASE, GOLD_FINISH, GOLD_MATCH_MAX, GOLD_PER_POINT, GOLD_WIN,
  XP_BASE, XP_L0, XP_MATCH_MAX, XP_PER_POINT, XP_STEP, XP_WIN,
} from '../core/config';
import type { Save } from './save';

export interface Reward { gold: number; xp: number; levels: number }

/** XP cần để đi từ `level` lên `level + 1` (14- Rule 7). */
export const xpToLevel = (level: number) => Math.max(1, Math.floor(XP_L0 + XP_STEP * (level - 1)));

/** 14- Rule 3: cùng công thức cho cả 2 chế độ, làm tròn xuống rồi chặn trần. */
export function matchReward(points: number, win: boolean, finishedFirst: boolean) {
  const pts = Math.max(0, Math.floor(points));
  const gold = Math.min(GOLD_MATCH_MAX,
    Math.floor(GOLD_BASE + GOLD_PER_POINT * pts + (win ? GOLD_WIN : 0) + (finishedFirst ? GOLD_FINISH : 0)));
  const xp = Math.min(XP_MATCH_MAX, Math.floor(XP_BASE + XP_PER_POINT * pts + (win ? XP_WIN : 0)));
  return { gold, xp };
}

/** Cộng thưởng vào save. XP dư tràn sang level kế tiếp, một ván có thể lên nhiều level (Rule 7). */
export function applyReward(s: Save, gold: number, xp: number): Reward {
  s.gold += gold;
  s.xp += xp;
  let levels = 0;
  while (s.xp >= xpToLevel(s.level)) {          // không có trần level ở đợt 1 (Rule 8)
    s.xp -= xpToLevel(s.level);
    s.level++;
    levels++;
  }
  return { gold, xp, levels };
}
