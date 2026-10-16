import { Move, MOVES } from './rules';

/** A move picked at random. `random` is injectable so tests can fix the sequence. */
export function randomMove(random: () => number = Math.random): Move {
  return MOVES[Math.min(MOVES.length - 1, Math.floor(random() * MOVES.length))];
}

/** The bot's queue: random moves, which is also the best strategy in a fair game. */
export function botQueue(length: number, random: () => number = Math.random): Move[] {
  return Array.from({ length }, () => randomMove(random));
}

/** Fills the empty slots of a partly loaded queue at random, for when the load timer runs out. */
export function fillQueue(
  queue: readonly Move[],
  length: number,
  random: () => number = Math.random,
): Move[] {
  return [...queue, ...botQueue(Math.max(0, length - queue.length), random)].slice(0, length);
}
