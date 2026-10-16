import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { CountUp } from './CountUp';

interface Props {
  name: string;
  color: string;
  wins: number;
  winsNeeded: number;
  points: number;
  flipped?: boolean;
}

/** One player's side of the table: name, throw wins as pips, and bragging points. */
export function Scoreboard({ name, color, wins, winsNeeded, points, flipped }: Props) {
  return (
    <View
      style={[styles.root, flipped && styles.flipped]}
      accessible
      accessibilityLabel={`${name}: ${wins} of ${winsNeeded} wins, ${points} points`}
    >
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.name}>{name}</Text>
        <View style={styles.pips}>
          {Array.from({ length: winsNeeded }, (_, i) => (
            <View key={i} style={[styles.pip, i < wins && { backgroundColor: colors.gold, borderColor: colors.gold }]} />
          ))}
        </View>
      </View>
      <View style={styles.right}>
        <CountUp value={points} style={styles.points} />
        <Text style={styles.pointsLabel}>pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  flipped: { transform: [{ rotate: '180deg' }] },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { color: colors.text, fontSize: 20, fontWeight: '800' },
  pips: { flexDirection: 'row', gap: 6, marginLeft: 4 },
  pip: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.slotBorder },
  right: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  points: { color: colors.gold, fontSize: 26, fontWeight: '900', fontVariant: ['tabular-nums'] },
  pointsLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
});
