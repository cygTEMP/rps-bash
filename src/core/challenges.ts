/**
 * Friendly stakes. Nothing in RPS Bash is a bet: the loser of a match takes
 * on a small real-life challenge, drawn from this deck or agreed at the table.
 */
export const CHALLENGES: readonly string[] = [
  'Pick the next restaurant',
  'Clear the table',
  'Choose the movie tonight',
  'Pick the next song',
  'Order dessert for the table',
  'Carry the bags',
  'Do the dishes',
  'Tell your best joke',
  'Sit in the middle seat next time',
  'Give the winner a high five and a compliment',
  'Refill everyone’s drinks',
  'Plan the next game night',
];

/** A challenge drawn from the deck, never the same as `previous` when there is a choice. */
export function drawChallenge(previous?: string, random: () => number = Math.random): string {
  const pool = CHALLENGES.filter((c) => c !== previous);
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
