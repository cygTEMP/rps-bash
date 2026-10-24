/**
 * Throw sets: the same rock-paper-scissors circle drawn with different
 * pictures. The game always plays rock, paper and scissors underneath; a set
 * only changes what each throw looks like and the words for who beats whom.
 *
 * Within a set, `rock` beats `scissors`, `paper` beats `rock` and `scissors`
 * beats `paper`, so each picture is mapped onto the move that keeps its
 * story true.
 */
import { compare, Move } from './rules';

export interface ThrowArt {
  emoji: string;
  name: string;
}

export interface ThrowSet {
  id: ThrowSetId;
  name: string;
  /** One line on where the set comes from, shown in settings. */
  blurb: string;
  art: Record<Move, ThrowArt>;
  /** The verb for each move beating the one it beats, e.g. rock "blunts" scissors. */
  verbs: Record<Move, string>;
}

export type ThrowSetId = 'hands' | 'swamp' | 'jungle' | 'frontier';

export const THROW_SETS: readonly ThrowSet[] = [
  {
    id: 'hands',
    name: 'Rock, Paper, Scissors',
    blurb: 'The classic',
    art: {
      rock: { emoji: '✊', name: 'Rock' },
      paper: { emoji: '✋', name: 'Paper' },
      scissors: { emoji: '✌️', name: 'Scissors' },
    },
    verbs: { rock: 'blunts', paper: 'covers', scissors: 'cut' },
  },
  {
    id: 'swamp',
    name: 'Frog, Snake, Slug',
    blurb: 'Mushi-ken, an old Japanese hand game',
    art: {
      rock: { emoji: '\u{1F438}', name: 'Frog' },
      paper: { emoji: '\u{1F40D}', name: 'Snake' },
      scissors: { emoji: '\u{1F40C}', name: 'Slug' },
    },
    verbs: { rock: 'gobbles', paper: 'swallows', scissors: 'slimes' },
  },
  {
    id: 'jungle',
    name: 'Elephant, Person, Ant',
    blurb: 'A version played in Indonesia',
    art: {
      rock: { emoji: '\u{1F418}', name: 'Elephant' },
      paper: { emoji: '\u{1F41C}', name: 'Ant' },
      scissors: { emoji: '\u{1F9D1}', name: 'Person' },
    },
    verbs: { rock: 'scares', paper: 'tickles', scissors: 'shoos' },
  },
  {
    id: 'frontier',
    name: 'Bear, Ninja, Cowboy',
    blurb: 'A full-body party version',
    art: {
      rock: { emoji: '\u{1F43B}', name: 'Bear' },
      paper: { emoji: '\u{1F920}', name: 'Cowboy' },
      scissors: { emoji: '\u{1F977}', name: 'Ninja' },
    },
    verbs: { rock: 'chases off', paper: 'lassos', scissors: 'outsmarts' },
  },
];

export const DEFAULT_THROW_SET: ThrowSetId = 'hands';

export function throwSetById(id: string | undefined): ThrowSet {
  return THROW_SETS.find((s) => s.id === id) ?? THROW_SETS[0];
}

/**
 * A plain sentence saying what happened on a throw, so a new player can tell
 * at a glance: "Paper covers Rock" or "Tie: both threw Rock".
 */
export function describeThrow(set: ThrowSet, a: Move, b: Move): string {
  const result = compare(a, b);
  if (result === 0) return `Tie: both threw ${set.art[a].name}`;
  const [winner, loser] = result === 1 ? [a, b] : [b, a];
  return `${set.art[winner].name} ${set.verbs[winner]} ${set.art[loser].name}`;
}
