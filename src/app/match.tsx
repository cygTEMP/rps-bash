import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Felt } from '../components/Felt';
import { LoadPanel } from '../components/LoadPanel';
import { ResultPanel } from '../components/ResultPanel';
import { Reveal } from '../components/Reveal';
import { botQueue } from '../core/bot';
import { isTiebreak, MatchState, newMatch, Pair, playRound, queueLength, RoundResult, Side } from '../core/match';
import { Move, presetById, winsNeeded } from '../core/rules';
import { recordPartyWinner } from '../services/party';
import { useSettings } from '../services/settings';
import { colors } from '../theme';

type Phase =
  | { kind: 'load'; side: Side }
  | { kind: 'handoff'; next: 'player2' | 'reveal' }
  | { kind: 'reveal'; round: RoundResult; startWins: Pair<number>; startPoints: Pair<number> }
  | { kind: 'result' };

/**
 * One match on one phone. Against the bot, the player loads and the bot's
 * queue is drawn at random. In pass and play, the phone goes to player 2 to
 * load, then sits in the middle of the table for the reveal.
 */
export default function MatchScreen() {
  const params = useLocalSearchParams<{
    mode?: string;
    preset?: string;
    /** Party bracket matches: the two players' names and where the match sits in the bracket. */
    p1?: string;
    p2?: string;
    round?: string;
    index?: string;
  }>();
  const pass = params.mode === 'pass';
  const party = params.round !== undefined && params.index !== undefined;
  const { settings: saved } = useSettings();
  const settings = presetById(params.preset, saved.customWins).settings;
  const names: Pair<string> = party
    ? [params.p1 || 'Player 1', params.p2 || 'Player 2']
    : pass
      ? ['Player 1', 'Player 2']
      : ['You', 'Bot'];

  const [match, setMatch] = useState<MatchState>(() => newMatch(settings));
  const [phase, setPhase] = useState<Phase>({ kind: 'load', side: 0 });
  const queues = useRef<Pair<Move[]>>([[], []]);

  const reveal = (current: MatchState) => {
    const { state, round } = playRound(current, queues.current);
    setPhase({ kind: 'reveal', round, startWins: current.wins, startPoints: current.points });
    setMatch(state);
  };

  const onLocked = (side: Side, queue: Move[]) => {
    queues.current[side] = queue;
    if (side === 0) {
      if (pass) {
        setPhase({ kind: 'handoff', next: 'player2' });
      } else {
        queues.current[1] = botQueue(queueLength(match));
        reveal(match);
      }
    } else {
      setPhase({ kind: 'handoff', next: 'reveal' });
    }
  };

  const afterReveal = () => {
    if (party && match.winner !== null) {
      // Player 1 is the bracket's first-listed player, player 2 the second.
      const m = { round: Number(params.round), index: Number(params.index) };
      recordPartyWinner(m.round, m.index, match.winner === 0 ? 'a' : 'b');
    }
    setPhase(match.winner !== null ? { kind: 'result' } : { kind: 'load', side: 0 });
  };

  const rematch = () => {
    setMatch(newMatch(settings));
    setPhase({ kind: 'load', side: 0 });
  };

  return (
    <Felt>
      {phase.kind === 'load' && (
        <LoadPanel
          key={`${match.rounds.length}-${phase.side}`}
          playerName={names[phase.side]}
          color={colors.players[phase.side]}
          length={queueLength(match)}
          timerSeconds={settings.loadTimerSeconds}
          tiebreak={isTiebreak(match)}
          onLocked={(queue) => onLocked(phase.side, queue)}
        />
      )}

      {phase.kind === 'handoff' && (
        <Handoff
          title={phase.next === 'player2' ? `Pass the phone to ${names[1]}` : 'Both players locked in'}
          body={
            phase.next === 'player2'
              ? `${names[0]}, no peeking at what comes next.`
              : 'Put the phone in the middle of the table where everyone can see it.'
          }
          action={phase.next === 'player2' ? `I'm ${names[1]}` : 'Reveal!'}
          onPress={() => (phase.next === 'player2' ? setPhase({ kind: 'load', side: 1 }) : reveal(match))}
        />
      )}

      {phase.kind === 'reveal' && (
        <Reveal
          key={match.rounds.length}
          round={phase.round}
          names={names}
          winsNeeded={winsNeeded(settings)}
          startWins={phase.startWins}
          startPoints={phase.startPoints}
          flipTop={pass}
          onDone={afterReveal}
        />
      )}

      {phase.kind === 'result' && (
        <ResultPanel
          match={match}
          names={names}
          onRematch={party ? undefined : rematch}
          onHome={() => router.back()}
          homeLabel={party ? 'Back to bracket' : 'Home'}
        />
      )}
    </Felt>
  );
}

function Handoff({
  title,
  body,
  action,
  onPress,
}: {
  title: string;
  body: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.handoff}>
      <View style={styles.handoffText}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      <Button label={action} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  handoff: { flex: 1, padding: 20, justifyContent: 'space-between' },
  handoffText: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  body: { color: colors.textMuted, fontSize: 17, textAlign: 'center' },
});
