import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Felt } from '../components/Felt';
import { MoveCard } from '../components/MoveCard';
import { DEFAULT_PRESET, PresetId, PRESETS } from '../core/rules';
import { loadSounds } from '../services/sound';
import { colors } from '../theme';

export default function Home() {
  const [preset, setPreset] = useState<PresetId>(DEFAULT_PRESET);

  useEffect(loadSounds, []);

  const start = (mode: 'bot' | 'pass') => router.push({ pathname: '/match', params: { mode, preset } });

  return (
    <Felt>
      <View style={styles.root}>
        <View style={styles.hero}>
          <View style={styles.cards}>
            <MoveCard move="rock" size={72} showLabel={false} style={styles.tiltLeft} />
            <MoveCard move="paper" size={72} showLabel={false} style={styles.raised} />
            <MoveCard move="scissors" size={72} showLabel={false} style={styles.tiltRight} />
          </View>
          <Text style={styles.title}>RPS Bash</Text>
          <Text style={styles.tagline}>Load your throws in secret. Reveal them all at once.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Rules</Text>
          <View style={styles.presets}>
            {PRESETS.map((p) => {
              const selected = p.id === preset;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setPreset(p.id)}
                  style={[styles.preset, selected && styles.presetSelected]}
                >
                  <Text style={[styles.presetName, selected && styles.presetNameSelected]}>{p.name}</Text>
                  <Text style={[styles.presetBlurb, selected && styles.presetBlurbSelected]}>{p.blurb}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Button label="Play the bot" onPress={() => start('bot')} />
          <Button label="Pass and play (2 players)" kind="ghost" onPress={() => start('pass')} />
        </View>

        <Text style={styles.footer}>by stillmoth</Text>
      </View>
    </Felt>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, justifyContent: 'space-between' },
  hero: { alignItems: 'center', marginTop: 24, gap: 8 },
  cards: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  tiltLeft: { transform: [{ rotate: '-10deg' }, { translateY: 8 }] },
  raised: { transform: [{ translateY: -4 }] },
  tiltRight: { transform: [{ rotate: '10deg' }, { translateY: 8 }] },
  title: { color: colors.text, fontSize: 48, fontWeight: '900', letterSpacing: 1 },
  tagline: { color: colors.textMuted, fontSize: 16, textAlign: 'center' },
  section: { gap: 12 },
  label: { color: colors.textMuted, fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  preset: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colors.slot,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetSelected: { backgroundColor: colors.card, borderColor: colors.gold },
  presetName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  presetNameSelected: { color: colors.cardText },
  presetBlurb: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  presetBlurbSelected: { color: colors.cardText, opacity: 0.75 },
  footer: { color: colors.textMuted, textAlign: 'center', fontSize: 13, opacity: 0.7 },
});
