import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { Felt } from '../components/Felt';
import { MAX_PLAYERS, MIN_PLAYERS } from '../core/bracket';
import { presetById, presetLabel } from '../core/rules';
import { startParty } from '../services/party';
import { useSettings } from '../services/settings';
import { colors } from '../theme';

const defaultName = (i: number) => `Player ${i + 1}`;

/** Party bracket setup: how many players and their names. */
export default function PartySetup() {
  const { settings, update } = useSettings();
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: MAX_PLAYERS }, (_, i) => settings.partyNames[i] ?? ''),
  );
  const [count, setCount] = useState(() =>
    Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, settings.partyNames.length || 4)),
  );

  const start = () => {
    const players = names.slice(0, count).map((n, i) => n.trim() || defaultName(i));
    update({ partyNames: names.slice(0, count).map((n) => n.trim()) });
    startParty(players);
    router.replace('/bracket');
  };

  return (
    <Felt>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Party bracket</Text>
          <Text style={styles.hint}>
            Everyone plays a knockout bracket on this phone, passing it along for each match. Matches are{' '}
            {presetLabel(presetById(settings.preset)).toLowerCase()}.
          </Text>

          <View style={styles.counter}>
            <Stepper label="−" disabled={count <= MIN_PLAYERS} onPress={() => setCount(count - 1)} />
            <Text style={styles.count} accessibilityLiveRegion="polite">
              {count} players
            </Text>
            <Stepper label="+" disabled={count >= MAX_PLAYERS} onPress={() => setCount(count + 1)} />
          </View>

          <View style={styles.names}>
            {Array.from({ length: count }, (_, i) => (
              <TextInput
                key={i}
                accessibilityLabel={`Player ${i + 1} name`}
                value={names[i]}
                onChangeText={(text) => setNames(names.map((n, j) => (j === i ? text : n)))}
                placeholder={defaultName(i)}
                placeholderTextColor={colors.textMuted}
                maxLength={16}
                style={styles.input}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Button label="Back" kind="ghost" onPress={() => router.back()} style={styles.action} />
            <Button label="Start" onPress={start} style={styles.action} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Felt>
  );
}

function Stepper({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'More players' : 'Fewer players'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.stepper, disabled && styles.dim, pressed && styles.pressed]}
    >
      <Text style={styles.stepperText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { padding: 20, gap: 18 },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', marginTop: 8 },
  hint: { color: colors.textMuted, fontSize: 15 },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  count: { color: colors.text, fontSize: 24, fontWeight: '900', minWidth: 130, textAlign: 'center' },
  stepper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.buttonGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: { color: colors.text, fontSize: 28, fontWeight: '800' },
  dim: { opacity: 0.35 },
  pressed: { transform: [{ scale: 0.95 }] },
  names: { gap: 10 },
  input: {
    backgroundColor: colors.slot,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
});
