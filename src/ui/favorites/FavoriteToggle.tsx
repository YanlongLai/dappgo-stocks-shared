/**
 * Favorite star (2.0.1), the same in every list of every app.
 *
 * - `FavoriteToggle`: the leading star. 44×44 touch area, 20pt star whose
 *   left edge sits 16pt from the card edge and 12pt before the code
 *   (`FAVORITE_TOGGLE_INSET` = 4 of row padding + 12 inside the target).
 *   Off: thin outline in the secondary grey. On: filled with the app's accent.
 *   A tap bounces it (1 → 1.2 → 1, ~180 ms) with one light haptic.
 * - `FavoriteToastHost`: 「已加入我的最愛」 / 「已從我的最愛移除 · 復原」 at the
 *   bottom; removing never asks first, 復原 puts it back within 5 s.
 * - `SwipeFavoriteRow`: swipe a row right to show 「加入自選」 / 「移除」.
 */
import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  FAVORITE_BOUNCE_MS, subscribeFavoriteToast, undoFavoriteToast, dismissFavoriteToast, type FavoriteToast,
} from '../../mobile/favorites/favorite-toast';
import { tapHaptic } from '../tiles/PressableCard';

export const FAVORITE_TOGGLE_SIZE = 44;
export const FAVORITE_STAR_SIZE = 20;
/** Row padding before the toggle so the star's edge lands 16pt from the card edge. */
export const FAVORITE_TOGGLE_INSET = 16 - (FAVORITE_TOGGLE_SIZE - FAVORITE_STAR_SIZE) / 2;

const STAR = 'M12 2.6l2.93 5.94 6.56.95-4.75 4.63 1.12 6.53L12 17.57l-5.86 3.08 1.12-6.53-4.75-4.63 6.56-.95L12 2.6z';

export function FavoriteStar({ on, accent, muted, size = FAVORITE_STAR_SIZE }: { on: boolean; accent: string; muted: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d={STAR} fill={on ? accent : 'none'} stroke={on ? accent : muted} strokeWidth={on ? 1.2 : 1.5} strokeLinejoin="round" />
    </Svg>
  );
}

export function FavoriteToggle({ on, onToggle, accessibilityLabel, accent, muted, reduceMotion = false, testID }: {
  on: boolean;
  onToggle: () => void;
  /** 「加入我的最愛：2330 台積電」 / 「從我的最愛移除：2330 台積電」 (favoriteA11yLabel). */
  accessibilityLabel: string;
  accent: string;
  muted: string;
  reduceMotion?: boolean;
  testID?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const bounce = () => {
    if (reduceMotion) return;
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.2, duration: FAVORITE_BOUNCE_MS / 2, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: FAVORITE_BOUNCE_MS / 2, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
  };
  return (
    <Pressable
      onPress={() => { tapHaptic(); bounce(); onToggle(); }}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={accessibilityLabel}
      style={styles.toggle}
      testID={testID}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <FavoriteStar on={on} accent={accent} muted={muted} />
      </Animated.View>
    </Pressable>
  );
}

// ── Toast ────────────────────────────────────────────────────────────

export interface FavoriteToastLabels {
  /** 「已加入我的最愛」 */
  added: string;
  /** 「已從我的最愛移除」 */
  removed: string;
  /** 「復原」 */
  undo: string;
  /**
   * Say what was saved (Options: 「已加入我的最愛：SPY 600C 12/19」), so a contract is
   * not mistaken for the stock. Used when the toast carries a name.
   */
  named?: { added: (name: string) => string; removed: (name: string) => string } | null;
}

export function FavoriteToastHost({ labels, theme, bottom = 96, testID = 'favorite-toast' }: {
  labels: FavoriteToastLabels;
  theme: { card: string; border: string; text: string; accent: string; textStyle?: TextStyle };
  /** Distance from the screen bottom (clear the tab bar and banner). */
  bottom?: number;
  testID?: string;
}) {
  const [toast, setToast] = useState<FavoriteToast | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => subscribeFavoriteToast(setToast), []);
  useEffect(() => {
    Animated.timing(opacity, { toValue: toast ? 1 : 0, duration: 160, useNativeDriver: true }).start();
  }, [toast, opacity]);
  if (!toast) return null;
  const text = labels.named && toast.name
    ? (toast.kind === 'removed' ? labels.named.removed(toast.name) : labels.named.added(toast.name))
    : (toast.kind === 'removed' ? labels.removed : labels.added);
  return (
    <Animated.View pointerEvents="box-none" style={[styles.toastWrap, { bottom, opacity }]} testID={testID}>
      <View style={[styles.toast, { backgroundColor: theme.card, borderColor: theme.border }]} accessibilityLiveRegion="polite">
        <Text style={[{ fontSize: 15, fontWeight: '600' }, theme.textStyle, { color: theme.text }]} numberOfLines={2}>{text}</Text>
        {toast.kind === 'removed' && toast.undo ? (
          <Pressable onPress={() => { tapHaptic(); undoFavoriteToast(toast.id); }} accessibilityRole="button" accessibilityLabel={labels.undo} hitSlop={10} style={styles.undo} testID={`${testID}-undo`}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.accent }}>{labels.undo}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => dismissFavoriteToast(toast.id)} accessible={false} style={styles.undo} />
        )}
      </View>
    </Animated.View>
  );
}

// ── Swipe ────────────────────────────────────────────────────────────

const ACTION_WIDTH = 104;
const OPEN_AT = 40;
const COMMIT_AT = 180;

/**
 * Swipe a row right to reveal one action (「加入自选」 / 「移除」). A short swipe
 * opens it (tap to run); a long one runs it straight away. Vertical scrolling
 * is never captured: only clearly horizontal right drags are.
 */
export function SwipeFavoriteRow({ children, on, onToggle, labels, theme, testID }: {
  children: ReactNode;
  on: boolean;
  onToggle: () => void;
  labels: { add: string; remove: string };
  /** background: the row's own surface, so the action never shows through. */
  theme: { accent: string; onAccent: string; negative: string; background: string };
  testID?: string;
}) {
  const x = useRef(new Animated.Value(0)).current;
  // The action is invisible until the row actually moves.
  const actionOpacity = x.interpolate({ inputRange: [0, 12], outputRange: [0, 1], extrapolate: 'clamp' });
  const open = useRef(false);
  const close = () => { open.current = false; Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start(); };
  const run = () => { tapHaptic(); onToggle(); close(); };
  const responder = useRef(PanResponder.create({
    // Capture phase: the row's own Pressable holds the touch, so the swipe must claim a clearly
    // horizontal drag before it (vertical scrolling still goes to the list).
    onMoveShouldSetPanResponderCapture: (_e, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 2 && (g.dx > 0 || open.current),
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_e, g) => { x.setValue(Math.max(0, Math.min(COMMIT_AT + 40, (open.current ? ACTION_WIDTH : 0) + g.dx))); },
    onPanResponderRelease: (_e, g) => {
      const d = (open.current ? ACTION_WIDTH : 0) + g.dx;
      if (d >= COMMIT_AT) { runRef.current(); return; }
      if (d >= OPEN_AT) { open.current = true; Animated.spring(x, { toValue: ACTION_WIDTH, useNativeDriver: true, bounciness: 0 }).start(); return; }
      close();
    },
    onPanResponderTerminate: () => close(),
  })).current;
  const runRef = useRef(run);
  runRef.current = run;
  const bg = on ? theme.negative : theme.accent;
  return (
    <View style={styles.swipe} testID={testID}>
      <Animated.View style={[styles.swipeAction, { backgroundColor: bg, opacity: actionOpacity }]}>
      <Pressable onPress={run} style={styles.swipeActionInner} accessibilityRole="button" accessibilityLabel={on ? labels.remove : labels.add} testID={testID ? `${testID}-action` : undefined}>
        <Text style={{ color: theme.onAccent, fontSize: 14, fontWeight: '700' }} numberOfLines={2}>{on ? labels.remove : labels.add}</Text>
      </Pressable>
      </Animated.View>
      <Animated.View style={{ backgroundColor: theme.background, transform: [{ translateX: x }] }} {...responder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: { width: FAVORITE_TOGGLE_SIZE, height: FAVORITE_TOGGLE_SIZE, alignItems: 'center', justifyContent: 'center' },
  toastWrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 48, maxWidth: 520, width: '100%',
    borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  undo: { marginLeft: 'auto', minHeight: 44, justifyContent: 'center' },
  swipe: { overflow: 'hidden' },
  swipeAction: { position: 'absolute', left: 0, top: 0, bottom: 0, width: ACTION_WIDTH },
  // Label at the leading edge so it reads from the first ~50pt of a swipe.
  swipeActionInner: { flex: 1, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 14, paddingRight: 6 },
});
