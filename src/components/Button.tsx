import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, kind = 'primary', disabled, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        kind === 'primary' ? styles.primary : styles.ghost,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, kind === 'primary' ? styles.primaryLabel : styles.ghostLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' },
  primary: { backgroundColor: colors.button },
  ghost: { backgroundColor: colors.buttonGhost },
  disabled: { opacity: 0.35 },
  pressed: { transform: [{ scale: 0.97 }] },
  label: { fontSize: 18, fontWeight: '700' },
  primaryLabel: { color: colors.buttonText },
  ghostLabel: { color: colors.text },
});
