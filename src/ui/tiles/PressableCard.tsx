import React, { useCallback, useRef, type ReactNode } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { ACCENT_BAR_WIDTH } from '../../mobile/tiles/valuation-accent';

/**
 * Card tap rule for all three apps (1.12.0 plan §3.2). A card declares what a
 * tap opens and the look follows:
 * - 'list'   (opens a list):   「›」 by the title, 3 preview rows inside, footer 「還有 N 筆 ›」;
 * - 'detail' (opens one page): 「›」 by the title, footer such as 「查看完整報告 ›」;
 * - 'static' (not tappable):   nothing added.
 * Pressing brightens the background and springs the card to 0.97 with one light
 * haptic (iOS selection, Android context click); the page changes on release.
 * The whole card is the target, role button, with a hint naming the destination.
 * No shadow, lift or flashing hint.
 */
export type CardKind = 'list' | 'detail' | 'static';

export const PRESSED_SCALE = 0.97;

/** One light haptic for a card tap. expo-haptics is the app's dependency, loaded lazily. */
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
    // No haptics module (tests, web).
  }
}

/** Spring scale for press in/out; shared by every tappable card. */
export function usePressSpring() {
  const scale = useRef(new Animated.Value(1)).current;
  const to = useCallback((v: number) => {
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  }, [scale]);
  return { scale, pressIn: useCallback(() => to(PRESSED_SCALE), [to]), pressOut: useCallback(() => to(1), [to]) };
}

export interface PressableCardProps {
  onPress: () => void;
  /** Where the tap goes, e.g. 「打開估值清單」. */
  accessibilityHint: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Background while pressed (a slightly lighter card colour). */
  pressedColor?: string;
  /** Colour of a 3-pt bar on the left edge; nothing is drawn when absent. */
  accentColor?: string | null;
  testID?: string;
  children: ReactNode;
}

export function PressableCard({ onPress, accessibilityHint, accessibilityLabel, style, pressedColor, accentColor, testID, children }: PressableCardProps) {
  const { scale, pressIn, pressOut } = usePressSpring();
  const handlePressIn = useCallback(() => { tapHaptic(); pressIn(); }, [pressIn]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [style, accentColor ? styles.clip : null, pressed && pressedColor ? { backgroundColor: pressedColor } : null]}
        testID={testID}
      >
        {accentColor ? <AccentBar color={accentColor} /> : null}
        {children}
      </Pressable>
    </Animated.View>
  );
}

/** A 3-pt colour strip flush with the card's left edge; the card's own radius rounds it. */
export function AccentBar({ color, testID = 'card-accent-bar' }: { color: string; testID?: string }) {
  return <View pointerEvents="none" accessible={false} style={[styles.bar, { backgroundColor: color }]} testID={testID} />;
}

/** The 「›」 next to a tappable card's title. */
export function TapHint({ color, style, testID = 'card-tap-hint' }: { color: string; style?: StyleProp<TextStyle>; testID?: string }) {
  return (
    <Text accessible={false} importantForAccessibility="no" style={[styles.hint, { color }, style]} testID={testID}>
      ›
    </Text>
  );
}

/** Bottom action row of a 'list' or 'detail' card, e.g. 「還有 1,833 筆 ›」 or 「查看完整報告 ›」. */
export function CardFooter({ text, color, borderColor, style, testID = 'card-footer' }: { text: string; color: string; borderColor?: string; style?: StyleProp<ViewStyle>; testID?: string }) {
  return (
    <View style={[styles.footer, borderColor ? { borderTopColor: borderColor, borderTopWidth: StyleSheet.hairlineWidth } : null, style]} testID={testID}>
      <Text accessible={false} style={[styles.footerText, { color }]} numberOfLines={1}>{text}</Text>
    </View>
  );
}

/** @deprecated 1.11.1 name; use CardFooter. */
export function CardLink({ text, color, style, testID = 'card-link' }: { text: string; color: string; style?: StyleProp<TextStyle>; testID?: string }) {
  return <Text accessible={false} style={[styles.footerText, styles.link, { color }, style]} numberOfLines={1} testID={testID}>{text}</Text>;
}

/** What a card of each kind shows: the 「›」 and a footer for list/detail, nothing for static. */
export function cardAffordance(kind: CardKind): { hint: boolean; footer: boolean; tappable: boolean } {
  return kind === 'static' ? { hint: false, footer: false, tappable: false } : { hint: true, footer: true, tappable: true };
}

/** Rows a 'list' card previews before its 「還有 N 筆」 footer. */
export const LIST_PREVIEW_ROWS = 3;

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  bar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: ACCENT_BAR_WIDTH },
  hint: { fontSize: 15, lineHeight: 17, fontWeight: '600', marginLeft: 6 },
  footer: { marginTop: 8, paddingTop: 8, minHeight: 28, justifyContent: 'center' },
  footerText: { fontSize: 13, fontWeight: '700' },
  link: { marginTop: 8 },
});
