import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Felt } from '../components/Felt';
import { MoveCard } from '../components/MoveCard';
import { PACES } from '../core/pace';
import { MOVES } from '../core/rules';
import { customThrowSet, describeThrow, ThrowSet, THROW_SETS } from '../core/themes';
import { useSettings } from '../services/settings';
import { colors } from '../theme';

/** Game speed and throw pictures, saved on the device. */
export default function SettingsScreen() {
  const { settings, update } = useSettings();

  return (
    <Felt>
      <ScrollView contentContainerStyle={styles.root}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Game speed</Text>
          <Text style={styles.hint}>How fast the throws play out after everyone locks in.</Text>
          <View style={styles.segments} accessibilityRole="radiogroup">
            {PACES.map((p) => {
              const selected = p.id === settings.pace;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => update({ pace: p.id })}
                  style={[styles.segment, selected && styles.selected]}
                >
                  <Text style={[styles.segmentText, selected && styles.selectedText]}>{p.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Throws</Text>
          <Text style={styles.hint}>Same game, different pictures. Each one beats the next in a circle.</Text>
          {[...THROW_SETS, customThrowSet(settings.custom)].map((set: ThrowSet) => {
            const selected = set.id === settings.throwSet;
            return (
              <Pressable
                key={set.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${set.name}. ${set.blurb}`}
                onPress={() => update({ throwSet: set.id })}
                style={[styles.set, selected && styles.selected]}
              >
                <View style={styles.setCards}>
                  {MOVES.map((m) => (
                    <MoveCard key={m} move={m} set={set} size={52} showLabel={false} />
                  ))}
                </View>
                <View style={styles.setText}>
                  <Text style={[styles.setName, selected && styles.selectedText]}>{set.name}</Text>
                  <Text style={[styles.setBlurb, selected && styles.selectedText]}>{set.blurb}</Text>
                  <Text style={[styles.setRules, selected && styles.selectedText]}>
                    {MOVES.map((m) => describeThrow(set, m, beaten(m))).join(' · ')}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <Button
            label={settings.throwSet === 'custom' ? 'Edit your own set' : 'Make your own set'}
            kind="ghost"
            onPress={() => router.push('/custom-set')}
          />
        </View>

        <Button label="Done" onPress={() => router.back()} />
      </ScrollView>
    </Felt>
  );
}

/** The move each move beats, in rock-paper-scissors order. */
function beaten(move: (typeof MOVES)[number]) {
  return move === 'rock' ? 'scissors' : move === 'paper' ? 'rock' : 'paper';
}

const styles = StyleSheet.create({
  root: { padding: 20, gap: 24 },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', marginTop: 8 },
  section: { gap: 10 },
  label: { color: colors.textMuted, fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  hint: { color: colors.textMuted, fontSize: 14 },
  segments: { flexDirection: 'row', gap: 6 },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderRadius: 14,
    backgroundColor: colors.slot,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { backgroundColor: colors.card, borderColor: colors.gold },
  segmentText: { color: colors.text, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  selectedText: { color: colors.cardText },
  set: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.slot,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  setCards: { flexDirection: 'row', gap: 4 },
  setText: { flex: 1, gap: 2 },
  setName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  setBlurb: { color: colors.textMuted, fontSize: 13 },
  setRules: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
