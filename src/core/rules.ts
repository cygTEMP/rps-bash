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

export type BestOf = 1 | 3 | 5 | 7;

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

export type PresetId = 'quick' | 'classic';

export interface Preset {
  id: PresetId;
  name: string;
  blurb: string;
  settings: RuleSettings;
}

export const PRESETS: readonly Preset[] = [
  { id: 'quick', name: 'Quick', blurb: 'One throw decides it', settings: { bestOf: 1, loadTimerSeconds: 0 } },
  { id: 'classic', name: 'Classic', blurb: 'Best two out of three', settings: { bestOf: 3, loadTimerSeconds: 0 } },
];

export const DEFAULT_PRESET: PresetId = 'classic';

export function presetById(id: string | undefined): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS.find((p) => p.id === DEFAULT_PRESET)!;
}
