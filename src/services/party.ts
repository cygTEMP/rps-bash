import { useSyncExternalStore } from 'react';

import { Bracket, newBracket, recordWinner } from '../core/bracket';

/**
 * The party bracket in play. It lives only in memory: the bracket screen and
 * each match screen share it while the app is open.
 */
let current: Bracket | null = null;
const listeners = new Set<() => void>();

function set(next: Bracket | null) {
  current = next;
  listeners.forEach((l) => l());
}

export function startParty(players: string[]) {
  set(newBracket(players));
}

/** Records who won a bracket match: its first-listed player ('a') or its second ('b'). */
export function recordPartyWinner(round: number, index: number, side: 'a' | 'b') {
  if (!current) return;
  const match = current.rounds[round]?.[index];
  const winner = match?.[side];
  if (!match || match.winner !== null || winner === null || winner === undefined) return;
  set(recordWinner(current, round, index, winner));
}

export function useParty(): Bracket | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
