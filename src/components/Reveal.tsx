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

import { Combo, COMBOS, Pair, RoundResult, Side, ThrowResult } from '../core/match';
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
 * after another. The winner's half of the table lights up in their colour,
 * their card grows and the loser's fades, so everyone around the table can
 * see the result from any side. Against the bot a plain sentence also says
 * who beat whom; in pass and play the middle stays wordless, with a row of
 * dots for the throws. It speeds up gently as it goes and the deciding throw
 * plays in slow motion, all scaled by the player's game speed setting.
 * Combos are announced at the end.
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
  const topLight = useSharedValue(0);
  const bottomLight = useSharedValue(0);
  const tieLight = useSharedValue(0);
  const topPop = useSharedValue(0);
  const bottomPop = useSharedValue(0);
  const [pops, setPops] = useState<Pair<Pop | null>>([null, null]);
  const [history, setHistory] = useState<(Side | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) =>
        setTimeout(() => (cancelled ? reject(new Error('cancelled')) : resolve()), ms),
      );

    // Floating points stand in for the sentence in pass and play.
    const popUp = (side: Side, text: string, color: string) => {
      if (!flipTop) return;
      setPops((p) => (side === 0 ? [{ text, color }, p[1]] : [p[0], { text, color }]));
      const pop = side === 0 ? bottomPop : topPop;
      pop.value = 0;
      pop.value = withTiming(1, { duration: 1100 * pace.scale, easing: Easing.out(Easing.quad) });
    };

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
        topLight.value = withTiming(0, { duration: 150 });
        bottomLight.value = withTiming(0, { duration: 150 });
        tieLight.value = withTiming(0, { duration: 150 });
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
          const light = t.winner === 0 ? bottomLight : topLight;
          light.value = withSequence(
            withTiming(0.5, { duration: 160 }),
            withTiming(t.decisive ? 0.3 : 0.16, { duration: 600 }),
          );
          popUp(t.winner, `+${t.points[t.winner]}`, colors.players[t.winner]);
        } else {
          topScale.value = withSequence(withTiming(1.08, { duration: 120 }), withSpring(1, { damping: 6 }));
          bottomScale.value = withSequence(withTiming(1.08, { duration: 120 }), withSpring(1, { damping: 6 }));
          tieLight.value = withSequence(withTiming(0.3, { duration: 140 }), withTiming(0.08, { duration: 500 }));
        }
        setHistory((h) => [...h, t.winner]);
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
        popUp(c.side, `+${c.points} ★`, colors.gold);
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

  const arenaStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const topStyle = useAnimatedStyle(() => ({
    opacity: topFade.value,
    transform: [{ translateY: topY.value }, { scale: topScale.value }, { rotate: flipTop ? '180deg' : '0deg' }],
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    opacity: bottomFade.value,
    transform: [{ translateY: bottomY.value }, { scale: bottomScale.value }],
  }));
  const bannerStyle = useAnimatedStyle(() => ({ transform: [{ scale: banner.value }], opacity: banner.value }));

  const topLightStyle = useAnimatedStyle(() => ({ opacity: topLight.value }));
  const bottomLightStyle = useAnimatedStyle(() => ({ opacity: bottomLight.value }));
  const tieLightStyle = useAnimatedStyle(() => ({ opacity: tieLight.value }));
  // The points float from the card towards the scorer's own edge of the table, then fade.
  const bottomPopStyle = useAnimatedStyle(() => ({
    opacity: bottomPop.value === 0 ? 0 : 1 - bottomPop.value * bottomPop.value,
    transform: [{ translateY: bottomPop.value * 60 - 20 }, { scale: 0.8 + Math.min(bottomPop.value * 4, 1) * 0.4 }],
  }));
  const topPopStyle = useAnimatedStyle(() => ({
    opacity: topPop.value === 0 ? 0 : 1 - topPop.value * topPop.value,
    transform: [{ translateY: topPop.value * 60 - 20 }, { scale: 0.8 + Math.min(topPop.value * 4, 1) * 0.4 }],
  }));

  const total = round.throws.length + round.unrevealed;

  return (
    <View style={styles.root}>
      <Animated.View
        pointerEvents="none"
        style={[styles.light, styles.topHalf, { backgroundColor: colors.players[1] }, topLightStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.light, styles.bottomHalf, { backgroundColor: colors.players[0] }, bottomLightStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.light, styles.whole, { backgroundColor: colors.tie }, tieLightStyle]}
      />

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

        <View style={styles.middle}>
          {flipTop ? (
            <Dots history={history} total={total} />
          ) : combo ? (
            <Animated.View style={[styles.comboBanner, bannerStyle]}>
              <Text style={styles.comboName}>{COMBOS[combo.id].name}!</Text>
              <Text style={styles.comboText}>
                {names[combo.side]} +{combo.points} · {COMBOS[combo.id].description}
              </Text>
            </Animated.View>
          ) : current && landed ? (
            <Outcome result={current} names={names} set={throwSet} />
          ) : (
            <Text style={styles.counter}>
              Throw {index + 1} of {total}
            </Text>
          )}
        </View>

        <Animated.View style={bottomStyle}>{current && <MoveCard move={current.moves[0]} size={CARD} />}</Animated.View>
      </Animated.View>

      <Scoreboard name={names[0]} color={colors.players[0]} wins={wins[0]} winsNeeded={winsNeeded} points={points[0]} />

      <View pointerEvents="none" style={[styles.popHalf, styles.topHalf, flipTop && styles.flipped]}>
        <Animated.Text style={[styles.pop, { color: pops[1]?.color }, topPopStyle]}>{pops[1]?.text}</Animated.Text>
      </View>
      <View pointerEvents="none" style={[styles.popHalf, styles.bottomHalf]}>
        <Animated.Text style={[styles.pop, { color: pops[0]?.color }, bottomPopStyle]}>{pops[0]?.text}</Animated.Text>
      </View>
    </View>
  );
}

interface Pop {
  text: string;
  color: string;
}

/** One dot per throw, coloured by who won it, so the middle reads the same from either side. */
function Dots({ history, total }: { history: (Side | null)[]; total: number }) {
  return (
    <View
      style={[styles.dots, total > 11 && styles.dotsSmall]}
      accessible
      accessibilityLabel={`Throw ${Math.max(history.length, 1)} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const done = i < history.length;
        const winner = history[i];
        return (
          <View
            key={i}
            style={[
              styles.dot,
              total > 11 && styles.dotSmall,
              done && {
                backgroundColor: winner === null ? colors.tie : colors.players[winner],
                borderColor: 'transparent',
              },
              i === history.length && styles.dotNext,
            ]}
          />
        );
      })}
    </View>
  );
}

function Outcome({ result, names, set }: { result: ThrowResult; names: Pair<string>; set: ThrowSet }) {
  const reason = describeThrow(set, result.moves[0], result.moves[1]);
  if (result.winner === null) {
    return (
      <View style={styles.outcomeRow}>
        <Text style={[styles.reason, { color: colors.tie }]}>{reason}</Text>
        <Text style={styles.verdict}>No one scores</Text>
      </View>
    );
  }
  const side = result.winner;
  return (
    <View style={styles.outcomeRow}>
      <Text style={styles.reason}>{reason}</Text>
      <Text style={[styles.verdict, { color: colors.players[side] }]}>
        {result.decisive
          ? `${names[side]} ${names[side] === 'You' ? 'win' : 'wins'} the match!`
          : `${names[side]} +${result.points[side]}${result.multiplier > 1 ? `  (x${result.multiplier} streak)` : ''}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  light: { position: 'absolute', left: 0, right: 0 },
  topHalf: { position: 'absolute', left: 0, right: 0, top: 0, height: '50%' },
  bottomHalf: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
  whole: { top: 0, bottom: 0 },
  flipped: { transform: [{ rotate: '180deg' }] },
  popHalf: { alignItems: 'flex-end', justifyContent: 'center', paddingRight: 28 },
  pop: { fontSize: 34, fontWeight: '900', fontVariant: ['tabular-nums'] },
  dots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.slotBorder },
  dotNext: { borderColor: colors.text },
  // Long custom matches (up to 39 throws) need smaller dots to fit two rows.
  dotsSmall: { gap: 5 },
  dotSmall: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  arena: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  middle: { height: 88, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  counter: { color: colors.textMuted, fontSize: 18, fontWeight: '700' },
  outcomeRow: { alignItems: 'center', gap: 4 },
  reason: { color: colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  verdict: { color: colors.textMuted, fontSize: 18, fontWeight: '800', textAlign: 'center' },
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
