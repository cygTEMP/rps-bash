import { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Combo, COMBOS, Pair, RoundResult, ThrowResult } from '../core/match';
import { comboMs, throwTiming } from '../core/pace';
import { describeThrow, ThrowSet } from '../core/themes';
import * as haptics from '../services/haptics';
import { useSettings } from '../services/settings';
import { play, playWin } from '../services/sound';
import { colors } from '../theme';
import { MoveCard } from './MoveCard';
import { Scoreboard } from './Scoreboard';

interface Props {
  round: RoundResult;
  names: Pair<string>;
  winsNeeded: number;
  /** Wins and points before this round, so the scoreboard can count up from them. */
  startWins: Pair<number>;
  startPoints: Pair<number>;
  /** Turn the top player's side to face across the table (pass and play). */
  flipTop: boolean;
  onDone: () => void;
}

const CARD = 128;

/**
 * The reveal: each pair of throws flies in and clashes in the middle, one
 * after another, with a plain sentence saying who beat whom. It speeds up
 * gently as it goes and the deciding throw plays in slow motion, all scaled
 * by the player's game speed setting. Combos are announced at the end.
 */
export function Reveal({ round, names, winsNeeded, startWins, startPoints, flipTop, onDone }: Props) {
  const { height } = useWindowDimensions();
  const { pace, throwSet } = useSettings();
  const [current, setCurrent] = useState<ThrowResult | null>(null);
  const [landed, setLanded] = useState(false);
  const [index, setIndex] = useState(0);
  const [wins, setWins] = useState<Pair<number>>(startWins);
  const [points, setPoints] = useState<Pair<number>>(startPoints);
  const [combo, setCombo] = useState<Combo | null>(null);

  const topY = useSharedValue(-height);
  const bottomY = useSharedValue(height);
  const topScale = useSharedValue(1);
  const bottomScale = useSharedValue(1);
  const topFade = useSharedValue(1);
  const bottomFade = useSharedValue(1);
  const shake = useSharedValue(0);
  const banner = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) =>
        setTimeout(() => (cancelled ? reject(new Error('cancelled')) : resolve()), ms),
      );

    const run = async () => {
      await wait(500 * pace.scale);
      let total: Pair<number> = [...startPoints];
      for (let i = 0; i < round.throws.length; i++) {
        const t = round.throws[i];
        const { flyMs, holdMs } = throwTiming(i, t.decisive, pace);

        topY.value = -height;
        bottomY.value = height;
        topScale.value = 1;
        bottomScale.value = 1;
        topFade.value = 1;
        bottomFade.value = 1;
        setIndex(i);
        setCurrent(t);
        setLanded(false);

        play('whoosh');
        const easing = Easing.in(Easing.quad);
        topY.value = withTiming(0, { duration: flyMs, easing });
        bottomY.value = withTiming(0, { duration: flyMs, easing });
        await wait(flyMs);

        play(t.winner === null ? 'tie' : 'clash');
        haptics.clash(t.decisive);
        const amp = t.decisive ? 18 : 10;
        shake.value = withSequence(
          withTiming(-amp, { duration: 40 }),
          withTiming(amp, { duration: 60 }),
          withTiming(-amp / 2, { duration: 60 }),
          withTiming(0, { duration: 60 }),
        );
        if (t.winner !== null) {
          const [win, lose] = t.winner === 0 ? [bottomScale, topScale] : [topScale, bottomScale];
          const loseFade = t.winner === 0 ? topFade : bottomFade;
          win.value = withSpring(1.18, { damping: 8 });
          lose.value = withTiming(0.82, { duration: 200 });
          loseFade.value = withTiming(0.35, { duration: 200 });
        }
        total = [total[0] + t.points[0], total[1] + t.points[1]];
        setWins(t.wins);
        setPoints(total);
        setLanded(true);

        await wait(110);
        if (t.winner !== null) playWin(t.multiplier);
        await wait(holdMs);
      }

      for (const c of round.combos) {
        total = c.side === 0 ? [total[0] + c.points, total[1]] : [total[0], total[1] + c.points];
        setCombo(c);
        setPoints(total);
        banner.value = 0;
        banner.value = withSpring(1, { damping: 9 });
        play('combo');
        await wait(comboMs(pace));
      }
      setCombo(null);

      if (round.throws.some((t) => t.decisive)) {
        play('fanfare');
        haptics.matchWon();
      }
      await wait(600);
      onDone();
    };

    run().catch(() => {});
    return () => {
      cancelled = true;
    };
    // The reveal runs once for the round it was given.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arenaStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));
  const topStyle = useAnimatedStyle(() => ({
    opacity: topFade.value,
    transform: [{ translateY: topY.value }, { scale: topScale.value }, { rotate: flipTop ? '180deg' : '0deg' }],
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    opacity: bottomFade.value,
    transform: [{ translateY: bottomY.value }, { scale: bottomScale.value }],
  }));
  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: banner.value }],
    opacity: banner.value,
  }));

  const total = round.throws.length + round.unrevealed;
  const compact = flipTop;

  const middle = combo ? (
    <Animated.View style={[styles.comboBanner, bannerStyle]}>
      <Text style={styles.comboName}>{COMBOS[combo.id].name}!</Text>
      <Text style={styles.comboText}>
        {names[combo.side]} +{combo.points} · {COMBOS[combo.id].description}
      </Text>
    </Animated.View>
  ) : current && landed ? (
    <Outcome result={current} names={names} set={throwSet} compact={compact} />
  ) : (
    <Text style={styles.counter}>
      Throw {index + 1} of {total}
    </Text>
  );

  return (
    <View style={styles.root}>
      <Scoreboard
        name={names[1]}
        color={colors.players[1]}
        wins={wins[1]}
        winsNeeded={winsNeeded}
        points={points[1]}
        flipped={flipTop}
      />

      <Animated.View style={[styles.arena, arenaStyle]}>
        <Animated.View style={topStyle}>{current && <MoveCard move={current.moves[1]} size={CARD} />}</Animated.View>

        {flipTop ? (
          // Pass and play: the phone lies between the players, so the text is shown twice, once facing each side.
          <View style={styles.middleTwoSided}>
            <View style={[styles.half, styles.flipped]}>{middle}</View>
            <View style={styles.half}>{middle}</View>
          </View>
        ) : (
          <View style={styles.middle}>{middle}</View>
        )}

        <Animated.View style={bottomStyle}>{current && <MoveCard move={current.moves[0]} size={CARD} />}</Animated.View>
      </Animated.View>

      <Scoreboard name={names[0]} color={colors.players[0]} wins={wins[0]} winsNeeded={winsNeeded} points={points[0]} />
    </View>
  );
}

interface OutcomeProps {
  result: ThrowResult;
  names: Pair<string>;
  set: ThrowSet;
  /** Smaller text, for when it is shown twice. */
  compact: boolean;
}

function Outcome({ result, names, set, compact }: OutcomeProps) {
  const reasonStyle = [styles.reason, compact && styles.reasonCompact];
  const verdictStyle = [styles.verdict, compact && styles.verdictCompact];
  const reason = describeThrow(set, result.moves[0], result.moves[1]);
  if (result.winner === null) {
    return (
      <View style={styles.outcomeRow}>
        <Text style={[reasonStyle, { color: colors.tie }]}>{reason}</Text>
        <Text style={verdictStyle}>No one scores</Text>
      </View>
    );
  }
  const side = result.winner;
  return (
    <View style={styles.outcomeRow}>
      <Text style={reasonStyle}>{reason}</Text>
      <Text style={[verdictStyle, { color: colors.players[side] }]}>
        {result.decisive
          ? `${names[side]} ${names[side] === 'You' ? 'win' : 'wins'} the match!`
          : `${names[side]} +${result.points[side]}${result.multiplier > 1 ? `  (x${result.multiplier} streak)` : ''}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  arena: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  middle: {
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  middleTwoSided: { height: 152, alignSelf: 'stretch', paddingHorizontal: 16 },
  half: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flipped: { transform: [{ rotate: '180deg' }] },
  counter: { color: colors.textMuted, fontSize: 18, fontWeight: '700' },
  outcomeRow: { alignItems: 'center', gap: 4 },
  reason: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  verdict: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  reasonCompact: { fontSize: 21 },
  verdictCompact: { fontSize: 15 },
  comboBanner: {
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  comboName: { color: colors.buttonText, fontSize: 22, fontWeight: '900' },
  comboText: { color: colors.buttonText, fontSize: 13, fontWeight: '600' },
});
