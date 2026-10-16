import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fillQueue } from '../core/bot';
import { Move, MOVES } from '../core/rules';
import * as haptics from '../services/haptics';
import { play } from '../services/sound';
import { colors } from '../theme';
import { Button } from './Button';
import { MOVE_ART, MoveCard } from './MoveCard';

interface Props {
  playerName: string;
  color: string;
  length: number;
  timerSeconds: number;
  tiebreak: boolean;
  onLocked: (queue: Move[]) => void;
}

/** The load phase: one player secretly queues their throws, then locks them in. */
export function LoadPanel({ playerName, color, length, timerSeconds, tiebreak, onLocked }: Props) {
  const [queue, setQueue] = useState<Move[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(timerSeconds);
  const locked = useRef(false);
  // Mirrors `queue` for the timer, which runs outside render.
  const queueRef = useRef<Move[]>([]);
  const update = (next: Move[]) => {
    queueRef.current = next;
    setQueue(next);
  };

  const lock = (moves: Move[]) => {
    if (locked.current) return;
    locked.current = true;
    play('lock');
    onLocked(moves);
  };

  useEffect(() => {
    if (timerSeconds <= 0) return;
    let left = timerSeconds;
    const id = setInterval(() => {
      left -= 1;
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(id);
        lock(fillQueue(queueRef.current, length));
      }
    }, 1000);
    return () => clearInterval(id);
    // The timer runs once per load phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = (move: Move) => {
    if (queue.length >= length) return;
    play('tap');
    haptics.tap();
    update([...queue, move]);
  };

  const removeAt = (index: number) => {
    haptics.tap();
    update(queue.filter((_, i) => i !== index));
  };

  const full = queue.length === length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color }]}>{playerName}</Text>
        <Text style={styles.title}>{tiebreak ? 'Tiebreak: one throw' : `Load ${length} ${length === 1 ? 'throw' : 'throws'}`}</Text>
        <Text style={styles.hint}>Keep them secret. They play out in order.</Text>
        {timerSeconds > 0 && (
          <Text style={[styles.timer, secondsLeft <= 3 && styles.timerLow]} accessibilityLiveRegion="polite">
            {secondsLeft}s
          </Text>
        )}
      </View>

      <View style={styles.slots}>
        {Array.from({ length }, (_, i) => {
          const move = queue[i];
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={move ? `Throw ${i + 1}: ${MOVE_ART[move].label}. Tap to remove.` : `Throw ${i + 1}: empty`}
              disabled={!move}
              onPress={() => removeAt(i)}
              style={styles.slot}
            >
              {move ? (
                <MoveCard move={move} size={slotSize(length)} showLabel={false} />
              ) : (
                <View style={[styles.emptySlot, { width: slotSize(length), height: slotSize(length) * 1.25 }]}>
                  <Text style={styles.slotNumber}>{i + 1}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.picker}>
        {MOVES.map((move) => (
          <Pressable
            key={move}
            accessibilityRole="button"
            accessibilityLabel={`Add ${MOVE_ART[move].label}`}
            disabled={full}
            onPress={() => add(move)}
            style={({ pressed }) => [full && styles.dim, pressed && styles.pressed]}
          >
            <MoveCard move={move} size={96} />
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="Clear" kind="ghost" onPress={() => update([])} disabled={queue.length === 0} style={styles.action} />
        <Button label="Lock in" onPress={() => lock(queue)} disabled={!full} style={styles.action} />
      </View>
    </View>
  );
}

function slotSize(length: number): number {
  return length <= 3 ? 72 : length <= 5 ? 56 : 42;
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between', padding: 20 },
  header: { alignItems: 'center', gap: 6, marginTop: 12 },
  kicker: { fontSize: 16, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  hint: { color: colors.textMuted, fontSize: 15 },
  timer: { color: colors.gold, fontSize: 28, fontWeight: '800', marginTop: 6 },
  timerLow: { color: colors.players[0] },
  slots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  slot: { alignItems: 'center' },
  emptySlot: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.slotBorder,
    backgroundColor: colors.slot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotNumber: { color: colors.textMuted, fontSize: 18, fontWeight: '700' },
  picker: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  dim: { opacity: 0.4 },
  pressed: { transform: [{ scale: 0.95 }] },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
});
