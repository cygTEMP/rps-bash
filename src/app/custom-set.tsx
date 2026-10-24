import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { Felt } from '../components/Felt';
import { MoveCard } from '../components/MoveCard';
import { CustomSet, customThrowSet, describeThrow } from '../core/themes';
import { useSettings } from '../services/settings';
import { colors } from '../theme';

type Index = 0 | 1 | 2;

/** The moves the three pictures play as, in circle order (see customThrowSet). */
const CIRCLE = ['rock', 'scissors', 'paper'] as const;

/**
 * Make your own set: three pictures in a circle and the word for each one
 * beating the next. Saving also picks it as the set to play with.
 */
export default function CustomSetScreen() {
  const { settings, update } = useSettings();
  const [draft, setDraft] = useState<CustomSet>(settings.custom);
  const preview = customThrowSet(draft);

  const setPicture = (i: Index, change: Partial<CustomSet['pictures'][Index]>) => {
    const pictures = [...draft.pictures] as CustomSet['pictures'];
    pictures[i] = { ...pictures[i], ...change };
    setDraft({ ...draft, pictures });
  };
  const setVerb = (i: Index, verb: string) => {
    const verbs = [...draft.verbs] as CustomSet['verbs'];
    verbs[i] = verb;
    setDraft({ ...draft, verbs });
  };

  const save = () => {
    update({ custom: draft, throwSet: 'custom' });
    router.back();
  };

  const name = (i: Index) => preview.art[CIRCLE[i]].name;

  return (
    <Felt>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Make your own</Text>
          <Text style={styles.hint}>Pick three pictures. Each one beats the next, and the last beats the first.</Text>

          <View style={styles.cards}>
            {CIRCLE.map((m) => (
              <MoveCard key={m} move={m} set={preview} size={84} />
            ))}
          </View>

          {([0, 1, 2] as const).map((i) => {
            const next = ((i + 1) % 3) as Index;
            return (
              <View key={i} style={styles.block}>
                <View style={styles.row}>
                  <TextInput
                    accessibilityLabel={`Picture ${i + 1} emoji`}
                    value={draft.pictures[i].emoji}
                    onChangeText={(emoji) => setPicture(i, { emoji })}
                    maxLength={12}
                    style={[styles.input, styles.emoji]}
                  />
                  <TextInput
                    accessibilityLabel={`Picture ${i + 1} name`}
                    value={draft.pictures[i].name}
                    onChangeText={(n) => setPicture(i, { name: n })}
                    placeholder="Name"
                    placeholderTextColor={colors.textMuted}
                    maxLength={14}
                    style={[styles.input, styles.name]}
                  />
                </View>
                <View style={styles.row}>
                  <Text style={styles.beats}>{name(i)}</Text>
                  <TextInput
                    accessibilityLabel={`What ${name(i)} does to ${name(next)}`}
                    value={draft.verbs[i]}
                    onChangeText={(v) => setVerb(i, v)}
                    placeholder="beats"
                    placeholderTextColor={colors.textMuted}
                    maxLength={14}
                    style={[styles.input, styles.verb]}
                  />
                  <Text style={styles.beats}>{name(next)}</Text>
                </View>
              </View>
            );
          })}

          <Text style={styles.rules}>
            {CIRCLE.map((move, i) => describeThrow(preview, move, CIRCLE[(i + 1) % 3])).join(' · ')}
          </Text>

          <View style={styles.actions}>
            <Button label="Cancel" kind="ghost" onPress={() => router.back()} style={styles.action} />
            <Button label="Save and use" onPress={save} style={styles.action} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Felt>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { padding: 20, gap: 18 },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', marginTop: 8 },
  hint: { color: colors.textMuted, fontSize: 15 },
  cards: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  block: { gap: 8, backgroundColor: colors.slot, borderRadius: 16, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    backgroundColor: colors.buttonGhost,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  emoji: { width: 64, fontSize: 28, textAlign: 'center', paddingVertical: 6 },
  name: { flex: 1 },
  verb: { flex: 1, textAlign: 'center' },
  beats: { color: colors.text, fontSize: 15, fontWeight: '800', maxWidth: 90 },
  rules: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
});
