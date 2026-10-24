import { botQueue, fillQueue } from '../bot';
import { CHALLENGES, drawChallenge } from '../challenges';
import { isTiebreak, newMatch, playRound, queueLength } from '../match';
import { compare, Move, presetById, presetLabel, PRESETS, RuleSettings, winsNeeded } from '../rules';

const classic: RuleSettings = { bestOf: 3, loadTimerSeconds: 0 };

describe('compare', () => {
  it('follows the circle', () => {
    expect(compare('rock', 'scissors')).toBe(1);
    expect(compare('scissors', 'paper')).toBe(1);
    expect(compare('paper', 'rock')).toBe(1);
    expect(compare('scissors', 'rock')).toBe(-1);
    expect(compare('paper', 'paper')).toBe(0);
  });
});

describe('settings', () => {
  it('needs a majority of the throws', () => {
    expect(winsNeeded({ bestOf: 1, loadTimerSeconds: 0 })).toBe(1);
    expect(winsNeeded(classic)).toBe(2);
    expect(winsNeeded({ bestOf: 7, loadTimerSeconds: 0 })).toBe(4);
  });

  it('defaults to Classic, best two out of three', () => {
    expect(presetById(undefined).settings).toEqual(classic);
    expect(presetById('nope').id).toBe('classic');
    expect(presetById('quick').settings.bestOf).toBe(1);
  });

  it('offers 1 of 1 up to best 6 of 11', () => {
    expect(PRESETS.map(presetLabel)).toEqual([
      '1 of 1',
      'Best 2 of 3',
      'Best 3 of 5',
      'Best 4 of 7',
      'Best 5 of 9',
      'Best 6 of 11',
    ]);
    for (const p of PRESETS) expect(winsNeeded(p.settings)).toBe(p.wins);
  });
});

describe('playRound', () => {
  it('stops revealing once someone has two wins', () => {
    const { state, round } = playRound(newMatch(classic), [
      ['rock', 'rock', 'paper'],
      ['scissors', 'scissors', 'rock'],
    ]);
    expect(state.winner).toBe(0);
    expect(round.throws).toHaveLength(2);
    expect(round.unrevealed).toBe(1);
    expect(round.throws[1].decisive).toBe(true);
    expect(state.wins).toEqual([2, 0]);
  });

  it('scores 100 times the streak and resets the loser', () => {
    const { state, round } = playRound(newMatch({ bestOf: 5, loadTimerSeconds: 0 }), [
      ['rock', 'paper', 'rock', 'rock', 'rock'],
      ['scissors', 'rock', 'paper', 'scissors', 'scissors'],
    ]);
    // Side 0 wins twice (x1, x2), loses once (streak resets), then wins at x1.
    expect(round.throws.map((t) => t.multiplier)).toEqual([1, 2, 1, 1]);
    expect(round.throws.map((t) => t.points)).toEqual([
      [100, 0],
      [200, 0],
      [0, 100],
      [100, 0],
    ]);
    expect(state.winner).toBe(0);
    expect(round.throws).toHaveLength(4);
    expect(state.wins).toEqual([3, 1]);
  });

  it('keeps the streak through a tie', () => {
    const { round } = playRound(newMatch({ bestOf: 5, loadTimerSeconds: 0 }), [
      ['rock', 'rock', 'rock', 'paper', 'paper'],
      ['scissors', 'rock', 'scissors', 'paper', 'rock'],
    ]);
    expect(round.throws.map((t) => t.multiplier)).toEqual([1, 0, 2, 0, 3]);
  });

  it('goes to single tiebreak throws when ties leave it undecided', () => {
    let match = newMatch(classic);
    ({ state: match } = playRound(match, [
      ['rock', 'paper', 'scissors'],
      ['rock', 'paper', 'paper'],
    ]));
    expect(match.winner).toBeNull();
    expect(match.wins).toEqual([1, 0]);
    expect(isTiebreak(match)).toBe(true);
    expect(queueLength(match)).toBe(1);

    ({ state: match } = playRound(match, [['rock'], ['rock']]));
    expect(match.winner).toBeNull();
    ({ state: match } = playRound(match, [['rock'], ['paper']]));
    expect(match.winner).toBeNull();
    expect(match.wins).toEqual([1, 1]);
    ({ state: match } = playRound(match, [['scissors'], ['paper']]));
    expect(match.winner).toBe(0);
    expect(isTiebreak(match)).toBe(false);
  });

  it('rejects a queue of the wrong length or a finished match', () => {
    expect(() => playRound(newMatch(classic), [['rock'], ['rock']])).toThrow();
    const { state } = playRound(newMatch({ bestOf: 1, loadTimerSeconds: 0 }), [['rock'], ['scissors']]);
    expect(() => playRound(state, [['rock'], ['rock']])).toThrow();
  });
});

describe('combos', () => {
  it('awards Full circle for throwing all three moves', () => {
    const { round, state } = playRound(newMatch(classic), [
      ['rock', 'paper', 'scissors'],
      ['rock', 'rock', 'scissors'],
    ]);
    expect(round.combos).toContainEqual({ side: 0, id: 'fullCircle', points: 150 });
    expect(state.winner).toBeNull();
    expect(state.points[0]).toBe(100 + 150);
  });

  it('awards Stubborn for the same move three times in a row', () => {
    const { round } = playRound(newMatch(classic), [
      ['rock', 'rock', 'rock'],
      ['rock', 'rock', 'paper'],
    ]);
    expect(round.combos).toContainEqual({ side: 0, id: 'stubborn', points: 150 });
  });

  it('only counts throws that were revealed', () => {
    const { round } = playRound(newMatch(classic), [
      ['rock', 'rock', 'rock'],
      ['scissors', 'scissors', 'paper'],
    ]);
    expect(round.throws).toHaveLength(2);
    expect(round.combos.map((c) => c.id)).not.toContain('stubborn');
  });

  it('awards Clean sweep for winning without dropping a throw', () => {
    const { round, state } = playRound(newMatch(classic), [
      ['rock', 'paper', 'paper'],
      ['scissors', 'rock', 'rock'],
    ]);
    expect(round.combos).toContainEqual({ side: 0, id: 'cleanSweep', points: 300 });
    expect(state.points).toEqual([100 + 200 + 300, 0]);
  });

  it('gives no Clean sweep in a one-throw match', () => {
    const { round } = playRound(newMatch({ bestOf: 1, loadTimerSeconds: 0 }), [['rock'], ['scissors']]);
    expect(round.combos).toEqual([]);
  });
});

describe('bot and timer fill', () => {
  it('queues valid random moves', () => {
    const values = [0, 0.4, 0.99, 0.999999];
    let i = 0;
    const queue = botQueue(4, () => values[i++]);
    expect(queue).toEqual<Move[]>(['rock', 'paper', 'scissors', 'scissors']);
  });

  it('fills only the empty slots', () => {
    expect(fillQueue(['paper'], 3, () => 0)).toEqual(['paper', 'rock', 'rock']);
    expect(fillQueue(['paper', 'rock'], 1)).toEqual(['paper']);
  });
});

describe('challenges', () => {
  it('never repeats the previous challenge', () => {
    for (const previous of CHALLENGES) {
      expect(drawChallenge(previous, () => 0)).not.toBe(previous);
    }
    expect(CHALLENGES.join(' ').toLowerCase()).not.toMatch(/bet|wager/);
  });
});
