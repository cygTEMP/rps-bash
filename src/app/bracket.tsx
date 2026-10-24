import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Felt } from '../components/Felt';
import { BracketMatch, champion, nextMatch, roundName } from '../core/bracket';
import { useParty } from '../services/party';
import { useSettings } from '../services/settings';
import { colors } from '../theme';

/** The bracket between matches: who has played, who is next, and the champion. */
export default function BracketScreen() {
  const bracket = useParty();
  const { settings } = useSettings();

  if (!bracket) {
    return (
      <Felt>
        <View style={styles.empty}>
          <Text style={styles.title}>No bracket yet</Text>
          <Button label="Set one up" onPress={() => router.replace('/party')} />
        </View>
      </Felt>
    );
  }

  const next = nextMatch(bracket);
  const winner = champion(bracket);
  const name = (p: number | null) => (p === null ? '?' : bracket.players[p]);

  const play = () => {
    if (!next) return;
    const m = bracket.rounds[next.round][next.index];
    router.push({
      pathname: '/match',
      params: {
        mode: 'pass',
        preset: settings.preset,
        p1: name(m.a),
        p2: name(m.b),
        round: String(next.round),
        index: String(next.index),
      },
    });
  };

  return (
    <Felt>
      <View style={styles.root}>
        <View style={styles.header}>
          {winner !== null ? (
            <>
              <Text style={styles.kicker}>Champion</Text>
              <Text style={styles.title}>{name(winner)}</Text>
            </>
          ) : (
            next && (
              <>
                <Text style={styles.kicker}>{roundName(bracket, next.round)}</Text>
                <Text style={styles.title}>
                  {name(bracket.rounds[next.round][next.index].a)} vs {name(bracket.rounds[next.round][next.index].b)}
                </Text>
              </>
            )
          )}
        </View>

        <ScrollView contentContainerStyle={styles.rounds}>
          {bracket.rounds.map((round, r) => (
            <View key={r} style={styles.round}>
              <Text style={styles.roundName}>{roundName(bracket, r)}</Text>
              {round.map((m, i) => (
                <MatchRow key={i} match={m} name={name} current={next?.round === r && next.index === i} />
              ))}
            </View>
          ))}
        </ScrollView>

        <View style={styles.actions}>
          {winner !== null ? (
            <>
              <Button label="Home" kind="ghost" onPress={() => router.back()} style={styles.action} />
              <Button label="New bracket" onPress={() => router.replace('/party')} style={styles.action} />
            </>
          ) : (
            <Button label="Play this match" onPress={play} style={styles.action} />
          )}
        </View>
      </View>
    </Felt>
  );
}

function MatchRow({
  match,
  name,
  current,
}: {
  match: BracketMatch;
  name: (p: number | null) => string;
  current: boolean;
}) {
  const side = (p: number | null, right = false) => {
    const decided = match.winner !== null;
    const won = decided && match.winner === p;
    return (
      <Text
        numberOfLines={1}
        style={[
          styles.player,
          right && styles.right,
          won && styles.won,
          decided && !won && styles.lost,
          p === null && styles.waiting,
        ]}
      >
        {name(p)}
      </Text>
    );
  };
  if (match.bye) {
    return (
      <View style={styles.match}>
        {side(match.a)}
        <Text style={styles.vs}>moves on</Text>
      </View>
    );
  }
  return (
    <View style={[styles.match, current && styles.current]}>
      {side(match.a)}
      <Text style={styles.vs}>vs</Text>
      {side(match.b, true)}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, gap: 16 },
  empty: { flex: 1, padding: 20, justifyContent: 'center', gap: 20 },
  header: { alignItems: 'center', gap: 4, marginTop: 8 },
  kicker: { color: colors.gold, fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  rounds: { gap: 18, paddingBottom: 8 },
  round: { gap: 8 },
  roundName: { color: colors.textMuted, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  match: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.slot,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  current: { borderColor: colors.gold },
  player: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '700' },
  right: { textAlign: 'right' },
  won: { color: colors.gold, fontWeight: '900' },
  lost: { opacity: 0.4 },
  waiting: { color: colors.textMuted },
  vs: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
});
