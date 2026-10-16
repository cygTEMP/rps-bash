import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';

/** The table: a felt gradient filling the screen, with content inside the safe area. */
export function Felt({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={[colors.feltTop, colors.feltBottom]} style={styles.fill}>
      <View style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
