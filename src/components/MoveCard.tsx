import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Move } from '../core/rules';
import { ThrowSet } from '../core/themes';
import { useSettings } from '../services/settings';
import { colors } from '../theme';

interface Props {
  move: Move;
  /** The picture set to draw with; the player's chosen set when left out. */
  set?: ThrowSet;
  size?: number;
  showLabel?: boolean;
  style?: ViewStyle;
}

/** A throw drawn as a cream card: the picture plus its name, so it never relies on colour. */
export function MoveCard({ move, set, size = 120, showLabel = true, style }: Props) {
  const { throwSet } = useSettings();
  const art = (set ?? throwSet).art[move];
  return (
    <View
      accessible
      accessibilityLabel={art.name}
      style={[styles.card, { width: size, height: size * 1.25, borderRadius: size * 0.16 }, style]}
    >
      <Text style={{ fontSize: size * 0.48 }}>{art.emoji}</Text>
      {showLabel && <Text style={[styles.label, { fontSize: Math.max(11, size * 0.13) }]}>{art.name}</Text>}
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
