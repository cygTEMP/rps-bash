/**
 * Party bracket: three to eight players share one phone in a knockout
 * tournament. The field is padded to 4 or 8 slots; the extra slots are byes,
 * spread so no one plays a bye against a bye, and a bye winner moves on
 * without playing.
 */

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;

export interface BracketMatch {
  /** Player indexes; null while waiting on an earlier match, or for a bye. */
  a: number | null;
  b: number | null;
  winner: number | null;
  /** True for a first-round slot with only one player. */
  bye: boolean;
}

export interface Bracket {
  players: string[];
  /** rounds[0] is the first round; the last round is the final. */
  rounds: BracketMatch[][];
}

export function newBracket(players: string[], random: () => number = Math.random): Bracket {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new Error(`A bracket needs ${MIN_PLAYERS} to ${MAX_PLAYERS} players`);
  }
  const size = players.length <= 4 ? 4 : 8;
  const order = shuffle(
    players.map((_, i) => i),
    random,
  );
  const byes = size - players.length;

  // The first `byes` matches each get one player; the rest get two.
  const first: BracketMatch[] = [];
  let next = 0;
  for (let m = 0; m < size / 2; m++) {
    const a = order[next++];
    const b = m < byes ? null : order[next++];
    first.push({ a, b, winner: b === null ? a : null, bye: b === null });
  }
  // Spread the byes out so the bye winners don't all meet each other first.
  const spread = interleave(first);

  let bracket: Bracket = { players, rounds: [spread] };
  for (let n = size / 4; n >= 1; n /= 2) {
    bracket.rounds.push(Array.from({ length: n }, () => ({ a: null, b: null, winner: null, bye: false })));
  }
  spread.forEach((m, i) => {
    if (m.bye) bracket = advance(bracket, 0, i, m.winner!);
  });
  return bracket;
}

/** The next match to play, in round order, or null when the bracket is done. */
export function nextMatch(bracket: Bracket): { round: number; index: number } | null {
  for (let round = 0; round < bracket.rounds.length; round++) {
    const index = bracket.rounds[round].findIndex((m) => m.winner === null && m.a !== null && m.b !== null);
    if (index >= 0) return { round, index };
  }
  return null;
}

/** Records the winner of a match and moves them into the next round. */
export function recordWinner(bracket: Bracket, round: number, index: number, winner: number): Bracket {
  const match = bracket.rounds[round][index];
  if (match.winner !== null) throw new Error('That match is already decided');
  if (winner !== match.a && winner !== match.b) throw new Error('The winner must be one of the two players');
  const rounds = bracket.rounds.map((r) => r.map((m) => ({ ...m })));
  rounds[round][index].winner = winner;
  return advance({ ...bracket, rounds }, round, index, winner);
}

export function champion(bracket: Bracket): number | null {
  return bracket.rounds[bracket.rounds.length - 1][0].winner;
}

/** "Final", "Semifinals" or "Round 1". */
export function roundName(bracket: Bracket, round: number): string {
  const fromEnd = bracket.rounds.length - 1 - round;
  if (fromEnd === 0) return 'Final';
  if (fromEnd === 1) return 'Semifinals';
  return `Round ${round + 1}`;
}

function advance(bracket: Bracket, round: number, index: number, winner: number): Bracket {
  if (round + 1 >= bracket.rounds.length) return bracket;
  const rounds = bracket.rounds.map((r) => r.map((m) => ({ ...m })));
  const slot = rounds[round + 1][index >> 1];
  if (index % 2 === 0) slot.a = winner;
  else slot.b = winner;
  return { ...bracket, rounds };
}

/** Byes first, then the full matches, alternated: bye, full, bye, full... */
function interleave(matches: BracketMatch[]): BracketMatch[] {
  const byes = matches.filter((m) => m.bye);
  const full = matches.filter((m) => !m.bye);
  const out: BracketMatch[] = [];
  while (byes.length || full.length) {
    if (byes.length) out.push(byes.shift()!);
    if (full.length) out.push(full.shift()!);
  }
  return out;
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
