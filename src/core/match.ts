/**
 * A match between two players. Each round both players secretly queue their
 * throws, then the throws are revealed in pairs until someone has enough wins.
 * A tied throw scores nothing; if the queues run out before anyone wins, the
 * next round is a single tiebreak throw each, repeated until it is decided.
 *
 * The match is won on throws. Points are for bragging only: each win scores
 * 100 times the winner's current streak, plus bonuses for named combos.
 */
import { compare, Move, RuleSettings, winsNeeded } from './rules';

export type Side = 0 | 1;
export type Pair<T> = [T, T];

export const POINTS_PER_WIN = 100;

export type ComboId = 'fullCircle' | 'stubborn' | 'cleanSweep';

export const COMBOS: Record<ComboId, { name: string; description: string; points: number }> = {
  fullCircle: { name: 'Full circle', description: 'Threw all three moves', points: 150 },
  stubborn: { name: 'Stubborn', description: 'Same move three times in a row', points: 150 },
  cleanSweep: { name: 'Clean sweep', description: 'Won without losing a throw', points: 300 },
};

export interface Combo {
  side: Side;
  id: ComboId;
  points: number;
}

export interface ThrowResult {
  moves: Pair<Move>;
  winner: Side | null;
  /** The winner's streak multiplier for this throw (1 for a first win). */
  multiplier: number;
  /** Points each side earned on this throw. */
  points: Pair<number>;
  /** Throw wins after this throw. */
  wins: Pair<number>;
  /** True for the throw that won the match. */
  decisive: boolean;
}

export interface RoundResult {
  throws: ThrowResult[];
  combos: Combo[];
  /** Queued throws never revealed because the match was already decided. */
  unrevealed: number;
}

export interface MatchState {
  settings: RuleSettings;
  wins: Pair<number>;
  points: Pair<number>;
  streak: Pair<number>;
  rounds: RoundResult[];
  winner: Side | null;
}

export function newMatch(settings: RuleSettings): MatchState {
  return { settings, wins: [0, 0], points: [0, 0], streak: [0, 0], rounds: [], winner: null };
}

/** How many throws each player queues for the next round. */
export function queueLength(state: MatchState): number {
  return state.rounds.length === 0 ? state.settings.bestOf : 1;
}

/** True when the next round is a tiebreak rather than the opening queue. */
export function isTiebreak(state: MatchState): boolean {
  return state.rounds.length > 0 && state.winner === null;
}

/** Reveals a round of queued throws and returns the updated match. */
export function playRound(
  state: MatchState,
  queues: Pair<readonly Move[]>,
): { state: MatchState; round: RoundResult } {
  if (state.winner !== null) throw new Error('The match is already over');
  const length = queueLength(state);
  if (queues[0].length !== length || queues[1].length !== length) {
    throw new Error(`Each player must queue exactly ${length} throws`);
  }

  const target = winsNeeded(state.settings);
  const wins: Pair<number> = [...state.wins];
  const points: Pair<number> = [...state.points];
  const streak: Pair<number> = [...state.streak];
  let winner: Side | null = null;
  const throws: ThrowResult[] = [];

  for (let i = 0; i < length && winner === null; i++) {
    const moves: Pair<Move> = [queues[0][i], queues[1][i]];
    const result = compare(moves[0], moves[1]);
    const earned: Pair<number> = [0, 0];
    let throwWinner: Side | null = null;
    let multiplier = 0;
    if (result !== 0) {
      throwWinner = result === 1 ? 0 : 1;
      const loser: Side = throwWinner === 0 ? 1 : 0;
      streak[throwWinner] += 1;
      streak[loser] = 0;
      multiplier = streak[throwWinner];
      earned[throwWinner] = POINTS_PER_WIN * multiplier;
      points[throwWinner] += earned[throwWinner];
      wins[throwWinner] += 1;
      if (wins[throwWinner] >= target) winner = throwWinner;
    }
    throws.push({
      moves,
      winner: throwWinner,
      multiplier,
      points: earned,
      wins: [...wins],
      decisive: winner !== null,
    });
  }

  const combos: Combo[] = [];
  for (const side of [0, 1] as Side[]) {
    const played = throws.map((t) => t.moves[side]);
    if (new Set(played).size === 3) combos.push(combo(side, 'fullCircle'));
    if (hasRun(played, 3)) combos.push(combo(side, 'stubborn'));
  }
  if (winner !== null && state.settings.bestOf > 1 && wins[winner === 0 ? 1 : 0] === 0) {
    combos.push(combo(winner, 'cleanSweep'));
  }
  for (const c of combos) points[c.side] += c.points;

  const round: RoundResult = { throws, combos, unrevealed: length - throws.length };
  return {
    state: { ...state, wins, points, streak, winner, rounds: [...state.rounds, round] },
    round,
  };
}

function combo(side: Side, id: ComboId): Combo {
  return { side, id, points: COMBOS[id].points };
}

function hasRun(moves: readonly Move[], length: number): boolean {
  let run = 0;
  for (let i = 0; i < moves.length; i++) {
    run = i > 0 && moves[i] === moves[i - 1] ? run + 1 : 1;
    if (run >= length) return true;
  }
  return false;
}
