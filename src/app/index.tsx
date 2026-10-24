import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Felt } from '../components/Felt';
import { GearIcon } from '../components/GearIcon';
import { MoveCard } from '../components/MoveCard';
import { customPreset, MAX_CUSTOM_WINS, MIN_CUSTOM_WINS, Preset, presetLabel, PRESETS } from '../core/rules';
import { useSettings } from '../services/settings';
import { loadSounds } from '../services/sound';
import { colors } from '../theme';

export default function Home() {
  const { settings, update } = useSettings();
  const preset = settings.preset;

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
            {[...PRESETS, customPreset(settings.customWins)].map((p: Preset) => {
              const selected = p.id === preset;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={presetLabel(p)}
                  onPress={() => update({ preset: p.id })}
                  style={[styles.preset, selected && styles.presetSelected]}
                >
                  <Text style={[styles.presetBlurb, selected && styles.presetBlurbSelected]}>
                    {p.id === 'custom' ? 'Custom' : p.bestOf === 1 ? 'One throw' : 'Best'}
                  </Text>
                  <Text style={[styles.presetName, selected && styles.presetNameSelected]}>
                    {p.wins} of {p.bestOf}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {preset === 'custom' && (
            <View style={styles.custom}>
              <Step
                label="−"
                name="Fewer wins"
                disabled={settings.customWins <= MIN_CUSTOM_WINS}
                onPress={() => update({ customWins: settings.customWins - 1 })}
              />
              <Text style={styles.customText} accessibilityLiveRegion="polite">
                First to {settings.customWins} wins
              </Text>
              <Step
                label="+"
                name="More wins"
                disabled={settings.customWins >= MAX_CUSTOM_WINS}
                onPress={() => update({ customWins: settings.customWins + 1 })}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Button label="Play the bot" onPress={() => start('bot')} />
          <Button label="Pass and play (2 players)" kind="ghost" onPress={() => start('pass')} />
          <Button label="Party bracket (3 to 8 players)" kind="ghost" onPress={() => router.push('/party')} />
        </View>

        <Text style={styles.footer}>by stillmoth</Text>

        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={10}
          style={styles.gear}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <GearIcon color={colors.textMuted} />
        </Pressable>
      </View>
    </Felt>
  );
}

function Step({
  label,
  name,
  disabled,
  onPress,
}: {
  label: string;
  name: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.step, disabled && styles.stepDisabled, pressed && styles.stepPressed]}
    >
      <Text style={styles.stepText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, justifyContent: 'space-between' },
  hero: { alignItems: 'center', marginTop: 8, gap: 8 },
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
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    backgroundColor: colors.slot,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetSelected: { backgroundColor: colors.card, borderColor: colors.gold },
  presetName: { color: colors.text, fontSize: 22, fontWeight: '900' },
  presetNameSelected: { color: colors.cardText },
  presetBlurb: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetBlurbSelected: { color: colors.cardText, opacity: 0.75 },
  custom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  customText: { color: colors.text, fontSize: 17, fontWeight: '800', minWidth: 130, textAlign: 'center' },
  step: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.buttonGhost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisabled: { opacity: 0.35 },
  stepPressed: { transform: [{ scale: 0.95 }] },
  stepText: { color: colors.text, fontSize: 22, fontWeight: '800' },
  gear: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { color: colors.textMuted, textAlign: 'center', fontSize: 13, opacity: 0.7 },
});
