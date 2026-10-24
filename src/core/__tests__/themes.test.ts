import { comboMs, paceById, PACES, throwTiming } from '../pace';
import { compare, MOVES } from '../rules';
import { customThrowSet, describeThrow, throwSetById, THROW_SETS } from '../themes';

describe('throw sets', () => {
  it('has the classic set plus three more, twelve pictures in all', () => {
    expect(THROW_SETS).toHaveLength(4);
    const emoji = THROW_SETS.flatMap((s) => MOVES.map((m) => s.art[m].emoji));
    expect(new Set(emoji).size).toBe(12);
    expect(throwSetById(undefined).id).toBe('hands');
    expect(throwSetById('nope').id).toBe('hands');
  });

  it('describes every pairing in plain words', () => {
    const hands = throwSetById('hands');
    expect(describeThrow(hands, 'paper', 'rock')).toBe('Paper covers Rock');
    expect(describeThrow(hands, 'rock', 'paper')).toBe('Paper covers Rock');
    expect(describeThrow(hands, 'scissors', 'paper')).toBe('Scissors cut Paper');
    expect(describeThrow(hands, 'rock', 'rock')).toBe('Tie: both threw Rock');
  });

  it('keeps each set’s story true to the circle', () => {
    expect(describeThrow(throwSetById('swamp'), 'rock', 'scissors')).toBe('Frog gobbles Slug');
    expect(describeThrow(throwSetById('swamp'), 'scissors', 'paper')).toBe('Slug slimes Snake');
    expect(describeThrow(throwSetById('jungle'), 'paper', 'rock')).toBe('Ant tickles Elephant');
    expect(describeThrow(throwSetById('frontier'), 'paper', 'rock')).toBe('Cowboy lassos Bear');
    expect(describeThrow(throwSetById('frontier'), 'scissors', 'paper')).toBe('Ninja outsmarts Cowboy');
    // Every winning sentence names the move compare() says wins.
    for (const set of THROW_SETS) {
      for (const a of MOVES) {
        for (const b of MOVES) {
          if (compare(a, b) === 1) expect(describeThrow(set, a, b).startsWith(set.art[a].name)).toBe(true);
        }
      }
    }
  });
});

describe('your own set', () => {
  it('plays the circle in the order it was made', () => {
    const set = customThrowSet({
      pictures: [
        { emoji: '🐱', name: 'Cat' },
        { emoji: '🐭', name: 'Mouse' },
        { emoji: '🧀', name: 'Cheese' },
      ],
      verbs: ['chases', 'nibbles', 'tempts'],
    });
    expect(describeThrow(set, 'rock', 'scissors')).toBe('Cat chases Mouse');
    expect(describeThrow(set, 'scissors', 'paper')).toBe('Mouse nibbles Cheese');
    expect(describeThrow(set, 'paper', 'rock')).toBe('Cheese tempts Cat');
  });

  it('fills blanks so a half-made set still plays', () => {
    const set = throwSetById('custom', {
      pictures: [
        { emoji: ' ', name: '' },
        { emoji: '🐭', name: 'Mouse' },
        { emoji: '🐘', name: 'Elephant' },
      ],
      verbs: ['', 'spooks', 'squashes'],
    });
    expect(set.art.rock).toEqual({ emoji: '\u{1F431}', name: 'Cat' });
    expect(describeThrow(set, 'rock', 'scissors')).toBe('Cat beats Mouse');
    expect(throwSetById('custom').art.paper.name).toBe('Elephant');
  });
});

describe('pace', () => {
  it('defaults to Normal and runs from Very slow to Very fast', () => {
    expect(paceById(undefined).id).toBe('normal');
    expect(PACES.map((p) => p.id)).toEqual(['verySlow', 'slow', 'normal', 'fast', 'veryFast']);
    const total = (p: (typeof PACES)[number]) => throwTiming(0, false, p).flyMs + throwTiming(0, false, p).holdMs;
    for (let i = 1; i < PACES.length; i++) {
      expect(total(PACES[i - 1])).toBeGreaterThan(total(PACES[i]));
      expect(comboMs(PACES[i - 1])).toBeGreaterThan(comboMs(PACES[i]));
    }
  });

  it('speeds up gently and slows down for the deciding throw', () => {
    const normal = paceById('normal');
    expect(throwTiming(1, false, normal).holdMs).toBeLessThan(throwTiming(0, false, normal).holdMs);
    expect(throwTiming(10, false, normal).holdMs).toBeGreaterThanOrEqual(0.8 * throwTiming(0, false, normal).holdMs);
    expect(throwTiming(1, true, normal).flyMs).toBeGreaterThan(throwTiming(0, false, normal).flyMs);
  });
});
