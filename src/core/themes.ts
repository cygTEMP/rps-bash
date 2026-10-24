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

export type ThrowSetId = 'hands' | 'swamp' | 'jungle' | 'frontier' | 'custom';

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

/**
 * The player's own set, kept as a circle: `a` beats `b`, `b` beats `c` and
 * `c` beats `a`, each with its own verb ("Cat chases Mouse").
 */
export interface CustomSet {
  pictures: [ThrowArt, ThrowArt, ThrowArt];
  /** verbs[0]: a beats b, verbs[1]: b beats c, verbs[2]: c beats a. */
  verbs: [string, string, string];
}

export const DEFAULT_CUSTOM_SET: CustomSet = {
  pictures: [
    { emoji: '\u{1F431}', name: 'Cat' },
    { emoji: '\u{1F42D}', name: 'Mouse' },
    { emoji: '\u{1F418}', name: 'Elephant' },
  ],
  verbs: ['chases', 'spooks', 'squashes'],
};

/**
 * Maps a custom circle onto the moves: rock beats scissors beats paper beats
 * rock, so a is rock, b is scissors and c is paper. Blank fields fall back to
 * the default set so a half-finished set still plays.
 */
export function customThrowSet(custom: CustomSet | undefined): ThrowSet {
  const pick = (i: 0 | 1 | 2): ThrowArt => {
    const fallback = DEFAULT_CUSTOM_SET.pictures[i];
    const p = custom?.pictures?.[i];
    return { emoji: p?.emoji?.trim() || fallback.emoji, name: p?.name?.trim() || fallback.name };
  };
  const verb = (i: 0 | 1 | 2) => custom?.verbs?.[i]?.trim() || 'beats';
  const [a, b, c] = [pick(0), pick(1), pick(2)];
  return {
    id: 'custom',
    name: 'Your own',
    blurb: `${a.name}, ${b.name}, ${c.name}`,
    art: { rock: a, scissors: b, paper: c },
    verbs: { rock: verb(0), scissors: verb(1), paper: verb(2) },
  };
}

export function throwSetById(id: string | undefined, custom?: CustomSet): ThrowSet {
  if (id === 'custom') return customThrowSet(custom);
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
