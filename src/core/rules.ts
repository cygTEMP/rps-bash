/**
 * The rules of RPS Bash: the moves, what beats what, and the host settings.
 * Everything here is plain data so the same settings can later be shared by
 * a server and every phone at the table.
 */

export type Move = 'rock' | 'paper' | 'scissors';

export const MOVES: readonly Move[] = ['rock', 'paper', 'scissors'];

/** Each move and the one it beats: rock blunts scissors, paper covers rock, scissors cut paper. */
const BEATS: Record<Move, Move> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

/** 1 when `a` beats `b`, -1 when `b` beats `a`, 0 for a tie. */
export function compare(a: Move, b: Move): 1 | 0 | -1 {
  if (a === b) return 0;
  return BEATS[a] === b ? 1 : -1;
}

export type BestOf = 1 | 3 | 5 | 7 | 9 | 11;

export interface RuleSettings {
  /** Match length: first to a majority of this many throws. */
  bestOf: BestOf;
  /**
   * Seconds each player gets to queue their throws; 0 means no timer. When
   * time runs out the empty slots are filled at random.
   */
  loadTimerSeconds: number;
}

/** Throw wins needed to take the match. */
export function winsNeeded(settings: RuleSettings): number {
  return Math.floor(settings.bestOf / 2) + 1;
}

// 'quick' and 'classic' keep their old ids so a saved choice still loads.
export type PresetId = 'quick' | 'classic' | 'best5' | 'best7' | 'best9' | 'best11';

export interface Preset {
  id: PresetId;
  /** Throws needed to win, shown large. */
  wins: number;
  /** Out of how many throws. */
  bestOf: BestOf;
  settings: RuleSettings;
}

const preset = (id: PresetId, bestOf: BestOf): Preset => ({
  id,
  wins: Math.floor(bestOf / 2) + 1,
  bestOf,
  settings: { bestOf, loadTimerSeconds: 0 },
});

/** Match lengths, shortest first: 1 of 1, best 2 of 3, ... best 6 of 11. */
export const PRESETS: readonly Preset[] = [
  preset('quick', 1),
  preset('classic', 3),
  preset('best5', 5),
  preset('best7', 7),
  preset('best9', 9),
  preset('best11', 11),
];

/** "1 of 1" or "Best 2 of 3". */
export function presetLabel(p: Preset): string {
  return p.bestOf === 1 ? '1 of 1' : `Best ${p.wins} of ${p.bestOf}`;
}

export const DEFAULT_PRESET: PresetId = 'classic';

export function presetById(id: string | undefined): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS.find((p) => p.id === DEFAULT_PRESET)!;
}
