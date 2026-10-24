/**
 * How fast the reveal plays. Normal is slow enough for someone who has never
 * played to follow each throw; Fast is close to the first prototype's speed.
 */
export type PaceId = 'verySlow' | 'slow' | 'normal' | 'fast' | 'veryFast';

export interface Pace {
  id: PaceId;
  name: string;
  /** Multiplies every reveal duration; 1 is Normal. */
  scale: number;
}

/** Slowest first. */
export const PACES: readonly Pace[] = [
  { id: 'verySlow', name: 'Very slow', scale: 2.25 },
  { id: 'slow', name: 'Slow', scale: 1.5 },
  { id: 'normal', name: 'Normal', scale: 1 },
  { id: 'fast', name: 'Fast', scale: 0.5 },
  { id: 'veryFast', name: 'Very fast', scale: 0.3 },
];

export const DEFAULT_PACE: PaceId = 'normal';

export function paceById(id: string | undefined): Pace {
  return PACES.find((p) => p.id === id) ?? PACES.find((p) => p.id === DEFAULT_PACE)!;
}

export interface ThrowTiming {
  /** The two cards flying in. */
  flyMs: number;
  /** Showing who won and why, before the next throw. */
  holdMs: number;
}

/**
 * Timing for throw `index` of a reveal at Normal speed scaled by `pace`.
 * Later throws speed up gently, never below 80% of the first, and the throw
 * that decides the match plays slower with a longer hold.
 */
export function throwTiming(index: number, decisive: boolean, pace: Pace): ThrowTiming {
  const ramp = decisive ? 1.4 : Math.max(0.8, 0.93 ** index);
  return {
    flyMs: Math.round(600 * ramp * pace.scale),
    holdMs: Math.round((decisive ? 2200 : 1700) * ramp * pace.scale),
  };
}

/** How long each combo banner stays up. */
export function comboMs(pace: Pace): number {
  return Math.round(1500 * pace.scale);
}
