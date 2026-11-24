import React, { useCallback, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { ACCENT_BAR_WIDTH } from '../../mobile/tiles/valuation-accent';

/**
 * One way to make a card tappable in all three apps:
 * - the whole card is the target (role button, a hint saying where it goes);
 * - pressing scales it to 0.98 and fades it to 0.85, with one light haptic
 *   (selection on iOS, a context click on Android);
 * - {@link TapHint} puts a small 「›」 at the top right, only on tappable cards;
 * - {@link CardLink} is the accent line at the bottom of cards that open a list.
 */

export const PRESSED_SCALE = 0.98;
export const PRESSED_OPACITY = 0.85;

/** One light haptic for a card tap. expo-haptics is the app's dependency, so it is loaded lazily. */
export function tapHaptic(): void {
  if (Platform.OS === 'web') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Haptics = require('expo-haptics');
    if (Platform.OS === 'android' && typeof Haptics.performAndroidHapticsAsync === 'function' && Haptics.AndroidHaptics) {
      void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Context_Click).catch(() => {});
    } else {
      void Haptics.selectionAsync().catch(() => {});
    }
  } catch {
    // No haptics module (tests, web): nothing to do.
  }
}

export interface PressableCardProps {
  onPress: () => void;
  /** Where the tap goes, e.g. 「打開估值清單」. */
  accessibilityHint: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Accent colour for a 3-pt bar on the left edge; nothing is drawn when absent. */
  accentColor?: string | null;
  testID?: string;
  children: ReactNode;
}

export function PressableCard({ onPress, accessibilityHint, accessibilityLabel, style, accentColor, testID, children }: PressableCardProps) {
  const handlePress = useCallback(() => {
    tapHaptic();
    onPress();
  }, [onPress]);
  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [style, accentColor ? styles.clip : null, pressed && styles.pressed]}
      testID={testID}
    >
      {accentColor ? <AccentBar color={accentColor} /> : null}
      {children}
    </Pressable>
  );
}

/** A 3-pt colour strip flush with the card's left edge; the card's own radius rounds it (overflow hidden). */
export function AccentBar({ color, testID = 'card-accent-bar' }: { color: string; testID?: string }) {
  return <View pointerEvents="none" accessible={false} style={[styles.bar, { backgroundColor: color }]} testID={testID} />;
}

/** The small 「›」 at the top right of a tappable card's title row. */
export function TapHint({ color, style, testID = 'card-tap-hint' }: { color: string; style?: StyleProp<TextStyle>; testID?: string }) {
  return (
    <Text accessible={false} importantForAccessibility="no" style={[styles.hint, { color }, style]} testID={testID}>
      ›
    </Text>
  );
}

/** Accent text line at the bottom of a card that opens a list, e.g. 「查看全部 1,836 檔 ›」. */
export function CardLink({ text, color, style, testID = 'card-link' }: { text: string; color: string; style?: StyleProp<TextStyle>; testID?: string }) {
  return (
    <Text accessible={false} style={[styles.link, { color }, style]} numberOfLines={1} testID={testID}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  pressed: { transform: [{ scale: PRESSED_SCALE }], opacity: PRESSED_OPACITY },
  clip: { overflow: 'hidden' },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: ACCENT_BAR_WIDTH },
  hint: { fontSize: 15, lineHeight: 17, fontWeight: '600', marginLeft: 6 },
  link: { fontSize: 13, fontWeight: '700', marginTop: 8 },
});
