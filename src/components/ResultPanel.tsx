import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { drawChallenge } from '../core/challenges';
import { COMBOS, MatchState, Pair } from '../core/match';
import { colors } from '../theme';
import { Button } from './Button';

interface Props {
  match: MatchState;
  names: Pair<string>;
  /** Left out when there is no rematch, as in a party bracket. */
  onRematch?: () => void;
  onHome: () => void;
  homeLabel?: string;
}

/** End of the match: who won, the bragging points, and a friendly challenge for the loser. */
export function ResultPanel({ match, names, onRematch, onHome, homeLabel = 'Home' }: Props) {
  const winner = match.winner ?? 0;
  const loser = winner === 0 ? 1 : 0;
  const [challenge, setChallenge] = useState(() => drawChallenge());
  const combos = match.rounds.flatMap((r) => r.combos);

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Text style={[styles.kicker, { color: colors.players[winner] }]}>Match over</Text>
        <Text style={styles.title}>{names[winner] === 'You' ? 'You win!' : `${names[winner]} wins!`}</Text>
        <Text style={styles.score}>
          {match.wins[winner]} to {match.wins[loser]} in throws
        </Text>
      </View>

      <View style={styles.table}>
        {[0, 1].map((side) => (
          <View key={side} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: colors.players[side] }]} />
            <Text style={styles.rowName}>{names[side]}</Text>
            <Text style={styles.rowPoints}>{match.points[side].toLocaleString()} pts</Text>
          </View>
        ))}
        {combos.length > 0 && (
          <Text style={styles.combos}>{combos.map((c) => `${COMBOS[c.id].name} (${names[c.side]})`).join(' · ')}</Text>
        )}
      </View>

      <View style={styles.challenge}>
        <Text style={styles.challengeKicker}>{names[loser] === 'You' ? 'Your' : `${names[loser]}’s`} challenge</Text>
        <Text style={styles.challengeText}>{challenge}</Text>
        <Button label="Draw another" kind="ghost" onPress={() => setChallenge(drawChallenge(challenge))} />
      </View>

      <Text style={styles.note}>
        Points are just for bragging. They can&rsquo;t be bought or cashed out, and nobody here is betting anything.
        Real-life stakes are friendly challenges the table agrees on.
      </Text>

      <View style={styles.actions}>
        <Button label={homeLabel} kind={onRematch ? 'ghost' : 'primary'} onPress={onHome} style={styles.action} />
        {onRematch && <Button label="Rematch" onPress={onRematch} style={styles.action} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, justifyContent: 'space-between' },
  top: { alignItems: 'center', marginTop: 16, gap: 4 },
  kicker: { fontSize: 16, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 36, fontWeight: '900' },
  score: { color: colors.textMuted, fontSize: 16 },
  table: { backgroundColor: colors.slot, borderRadius: 16, padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  rowName: { color: colors.text, fontSize: 18, fontWeight: '700', flex: 1 },
  rowPoints: { color: colors.gold, fontSize: 20, fontWeight: '900', fontVariant: ['tabular-nums'] },
  combos: { color: colors.textMuted, fontSize: 13 },
  challenge: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 10 },
  challengeKicker: {
    color: colors.cardText,
    opacity: 0.7,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  challengeText: { color: colors.cardText, fontSize: 22, fontWeight: '800' },
  note: { color: colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
});
