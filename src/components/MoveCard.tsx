import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Move } from '../core/rules';
import { colors } from '../theme';

export const MOVE_ART: Record<Move, { emoji: string; label: string }> = {
  rock: { emoji: '✊', label: 'Rock' },
  paper: { emoji: '✋', label: 'Paper' },
  scissors: { emoji: '✌️', label: 'Scissors' },
};

interface Props {
  move: Move;
  size?: number;
  showLabel?: boolean;
  style?: ViewStyle;
}

/** A throw drawn as a cream card: the hand shape plus its name, so it never relies on colour. */
export function MoveCard({ move, size = 120, showLabel = true, style }: Props) {
  const art = MOVE_ART[move];
  return (
    <View
      accessible
      accessibilityLabel={art.label}
      style={[styles.card, { width: size, height: size * 1.25, borderRadius: size * 0.16 }, style]}
    >
      <Text style={{ fontSize: size * 0.48 }}>{art.emoji}</Text>
      {showLabel && <Text style={[styles.label, { fontSize: Math.max(11, size * 0.13) }]}>{art.label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardEdge,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  label: { color: colors.cardText, fontWeight: '700', marginTop: 4 },
});
