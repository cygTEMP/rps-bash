import { champion, newBracket, nextMatch, recordWinner, roundName } from '../bracket';

const names = (n: number) => Array.from({ length: n }, (_, i) => `P${i + 1}`);

/** Plays every match, the first-listed player always winning. */
function playOut(n: number) {
  let b = newBracket(names(n), () => 0.5);
  let played = 0;
  for (let next = nextMatch(b); next; next = nextMatch(b)) {
    const m = b.rounds[next.round][next.index];
    b = recordWinner(b, next.round, next.index, m.a!);
    played++;
  }
  return { bracket: b, played };
}

describe('party bracket', () => {
  it('takes three to eight players', () => {
    expect(() => newBracket(names(2))).toThrow();
    expect(() => newBracket(names(9))).toThrow();
  });

  it.each([3, 4, 5, 6, 7, 8])('plays %i players down to one champion in n - 1 matches', (n) => {
    const { bracket, played } = playOut(n);
    expect(played).toBe(n - 1);
    expect(champion(bracket)).not.toBeNull();
    // Every player appears exactly once in the first round.
    const first = bracket.rounds[0].flatMap((m) => [m.a, m.b]).filter((p) => p !== null);
    expect(new Set(first).size).toBe(n);
  });

  it('never pairs a bye with a bye, and bye winners wait for a real opponent', () => {
    const b = newBracket(names(5), () => 0.3);
    expect(b.rounds[0].every((m) => m.a !== null)).toBe(true);
    expect(b.rounds[0].filter((m) => m.bye)).toHaveLength(3);
    const first = nextMatch(b)!;
    expect(first.round).toBe(0);
    expect(b.rounds[0][first.index].bye).toBe(false);
  });

  it('names the rounds', () => {
    const b = newBracket(names(8));
    expect([0, 1, 2].map((r) => roundName(b, r))).toEqual(['Round 1', 'Semifinals', 'Final']);
  });

  it('only lets one of the two players win', () => {
    const b = newBracket(names(4));
    const next = nextMatch(b)!;
    expect(() => recordWinner(b, next.round, next.index, 99)).toThrow();
  });
});
