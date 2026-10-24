import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** A light tick for loading a move into a slot. */
export function tap(): void {
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key).catch(() => {});
  } else {
    Haptics.selectionAsync().catch(() => {});
  }
}

/** The two throws meeting. Heavier for the throw that decides the match. */
export function clash(decisive: boolean): void {
  Haptics.impactAsync(decisive ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium).catch(
    () => {},
  );
}

/** The match is over. */
export function matchWon(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
