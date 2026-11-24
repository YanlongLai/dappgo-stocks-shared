/**
 * Scroll chrome for every long screen (2.0.0).
 *
 * - `useScrollChrome()` tracks offset and direction and owns 「回到頂部」.
 * - `ScrollChromeOverlay` draws the one bottom-right floating slot (「↑」 or the
 *   screen's own CTA, never both), the 「↓ 回到剛才」 pill and, for sub-pages,
 *   the compact title bar that appears once the large title scrolls away.
 * - `ScreenScroll` is a ScrollView with all of it built in. Lists (FlatList /
 *   SmartList) use the hook + overlay directly.
 *
 * All three ways back to the top end in the same place: the 「↑」 button calls
 * `scrollToTop`; an iOS status-bar tap and a native tab re-tap scroll the page
 * themselves and are recognised from the offset; JS tabs call `scrollToTop`
 * through `useScrollToTop`. Each then offers 「回到剛才」 for 3 seconds.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import {
  Animated, Keyboard, Pressable, ScrollView, StyleSheet, Text, View,
  type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewProps, type TextStyle,
} from 'react-native';
import {
  CHROME_ANIM_MS, INITIAL_CHROME, RETURN_PILL_MS, TOP_SLOP, isExternalReturnToTop, nextChrome, scrollToTopPlan, type ChromeState,
} from '../../mobile/scroll/scroll-chrome';
import { tapHaptic } from '../tiles/PressableCard';

/** Anything with scrollTo / scrollToOffset (ScrollView, FlatList, SectionList). */
export interface Scrollable {
  scrollTo?: (o: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToOffset?: (o: { offset: number; animated?: boolean }) => void;
}

function scrollTo(target: Scrollable | null | undefined, y: number, animated: boolean) {
  if (!target) return;
  if (target.scrollToOffset) target.scrollToOffset({ offset: y, animated });
  else target.scrollTo?.({ y, animated });
}

export interface ScrollChrome {
  ref: React.MutableRefObject<Scrollable | null>;
  state: ChromeState;
  /** Offset to go back to after a return to the top, while the pill shows. */
  returnTo: number | null;
  viewport: number;
  keyboardOpen: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
  onMomentumScrollEnd: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  onContentSizeChange: (w: number, h: number) => void;
  scrollToTop: () => void;
  goBack: () => void;
}

export function useScrollChrome(): ScrollChrome {
  const ref = useRef<Scrollable | null>(null);
  const [state, setState] = useState<ChromeState>(INITIAL_CHROME);
  const [viewport, setViewport] = useState(0);
  const [returnTo, setReturnTo] = useState<number | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const content = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;
  const dragging = useRef(false);
  const programmatic = useRef(false);
  const lastY = useRef(0);
  const deepest = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); if (timer.current) clearTimeout(timer.current); };
  }, []);

  const offerReturn = useCallback((y: number) => {
    if (timer.current) clearTimeout(timer.current);
    setReturnTo(y);
    timer.current = setTimeout(() => setReturnTo(null), RETURN_PILL_MS);
  }, []);
  const dismissReturn = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setReturnTo(null);
  }, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const y = Math.max(0, contentOffset.y);
    const v = layoutMeasurement.height || viewport;
    content.current = contentSize.height;
    if (!programmatic.current && isExternalReturnToTop(lastY.current, y, v, dragging.current)) offerReturn(lastY.current);
    if (dragging.current && returnTo !== null && y > TOP_SLOP) dismissReturn();
    if (y > TOP_SLOP) deepest.current = y;
    lastY.current = y;
    const next = nextChrome(stateRef.current, y, v, contentSize.height, keyboardOpen);
    const cur = stateRef.current;
    if (next.showTop !== cur.showTop || next.direction !== cur.direction || Math.abs(next.y - cur.y) > 24 || (y <= TOP_SLOP) !== (cur.y <= TOP_SLOP)) setState(next);
    else stateRef.current = next;
  }, [viewport, keyboardOpen, offerReturn, dismissReturn, returnTo]);

  const scrollToTop = useCallback(() => {
    const from = lastY.current;
    if (from <= TOP_SLOP) return;
    programmatic.current = true;
    const { jumpTo } = scrollToTopPlan(from, viewport);
    if (jumpTo !== null) scrollTo(ref.current, jumpTo, false);
    scrollTo(ref.current, 0, true);
    offerReturn(from);
    setState((s) => ({ ...s, showTop: false, direction: 'up' }));
    setTimeout(() => { programmatic.current = false; }, 700);
  }, [viewport, offerReturn]);

  const goBack = useCallback(() => {
    const y = returnTo;
    dismissReturn();
    if (y === null) return;
    programmatic.current = true;
    scrollTo(ref.current, y, true);
    setTimeout(() => { programmatic.current = false; }, 700);
  }, [returnTo, dismissReturn]);

  return {
    ref,
    state,
    returnTo,
    viewport,
    keyboardOpen,
    onScroll,
    onScrollBeginDrag: () => { dragging.current = true; },
    onScrollEndDrag: () => { dragging.current = false; },
    onMomentumScrollEnd: () => { dragging.current = false; },
    onLayout: (e) => setViewport(e.nativeEvent.layout.height),
    onContentSizeChange: (_w, h) => { content.current = h; },
    scrollToTop,
    goBack,
  };
}

export interface ScrollChromeTheme {
  accent: string;
  onAccent: string;
  card: string;
  border: string;
  background: string;
  textHeading: string;
  textMuted: string;
  text: { label: TextStyle; body: TextStyle };
}

export interface ScrollChromeLabels {
  /** 「回到頂部」 / "Back to top" */
  backToTop: string;
  /** 「回到剛才」 / "Back to where you were" */
  backToWhereYouWere: string;
  /** Accessible name of the compact bar's back button. */
  back: string;
}

/** Fades a child in and out over the chrome duration (150–200 ms). */
function Fade({ visible, children, style }: { visible: boolean; children: ReactNode; style?: object }) {
  const v = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(v, { toValue: visible ? 1 : 0, duration: CHROME_ANIM_MS, useNativeDriver: true }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, v]);
  if (!mounted) return null;
  return (
    <Animated.View pointerEvents={visible ? 'box-none' : 'none'} style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/**
 * The single bottom-right slot. Items are in priority order; the first visible
 * one is shown and the rest wait, so two floating controls never overlap.
 */
export function FloatingSlot({ items, bottom, testID = 'floating-slot' }: {
  items: readonly { key: string; visible: boolean; render: () => ReactElement }[];
  bottom: number;
  testID?: string;
}) {
  const active = items.find((i) => i.visible)?.key ?? null;
  return (
    <View pointerEvents="box-none" style={[styles.slot, { bottom }]} testID={testID}>
      {items.map((i) => (
        <Fade key={i.key} visible={i.key === active} style={styles.slotItem}>{i.render()}</Fade>
      ))}
    </View>
  );
}

export function BackToTopButton({ onPress, theme, labels }: { onPress: () => void; theme: ScrollChromeTheme; labels: ScrollChromeLabels }) {
  return (
    <Pressable
      onPress={() => { tapHaptic(); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={labels.backToTop}
      hitSlop={8}
      style={({ pressed }) => [styles.top, { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 }]}
      testID="scroll-chrome-top"
    >
      <Text style={[styles.topGlyph, { color: theme.onAccent }]} accessible={false}>↑</Text>
    </Pressable>
  );
}

/** Thin bar pinned at the top of a sub-page once its large title has scrolled away. */
export function CompactTitleBar({ title, onBack, onTitlePress, top, theme, labels, testID = 'scroll-chrome-title' }: {
  title: string;
  onBack?: () => void;
  onTitlePress: () => void;
  top: number;
  theme: ScrollChromeTheme;
  labels: ScrollChromeLabels;
  testID?: string;
}) {
  return (
    <View style={[styles.bar, { paddingTop: top, backgroundColor: theme.background, borderBottomColor: theme.border }]} testID={testID}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={labels.back} hitSlop={12} style={styles.barBack} testID={`${testID}-back`}>
          <Text style={[styles.barChevron, { color: theme.accent }]} accessible={false}>‹</Text>
        </Pressable>
      ) : <View style={styles.barBack} />}
      <Pressable onPress={onTitlePress} accessibilityRole="button" accessibilityHint={labels.backToTop} style={styles.barTitleWrap} testID={`${testID}-text`}>
        <Text style={[theme.text.body, styles.barTitle, { color: theme.textHeading }]} numberOfLines={1} maxFontSizeMultiplier={1.4}>{title}</Text>
      </Pressable>
      <View style={styles.barBack} />
    </View>
  );
}

export interface CompactTitle {
  title: string;
  onBack?: () => void;
  /** Offset after which the bar appears (the large title's height). */
  after: number;
  /** Safe-area top. */
  top: number;
}

/** Everything drawn over a scrolling screen: compact title, 「回到剛才」 and the floating slot. */
export function ScrollChromeOverlay({ chrome, theme, labels, bottom, cta, compactTitle, testID = 'scroll-chrome' }: {
  chrome: ScrollChrome;
  theme: ScrollChromeTheme;
  labels: ScrollChromeLabels;
  /** Distance from the screen bottom to the slot (tab bar, ads, safe area). */
  bottom: number;
  /** The screen's own floating CTA (e.g. 「查看今日報告」), shown near the top instead of 「↑」. */
  cta?: { visible: boolean; render: () => ReactElement } | null;
  compactTitle?: CompactTitle | null;
  testID?: string;
}) {
  const { state, returnTo } = chrome;
  const showTitle = !!compactTitle && state.y > compactTitle.after;
  return (
    <>
      {compactTitle ? (
        <Fade visible={showTitle} style={styles.barWrap}>
          <CompactTitleBar title={compactTitle.title} onBack={compactTitle.onBack} onTitlePress={chrome.scrollToTop} top={compactTitle.top} theme={theme} labels={labels} testID={`${testID}-title`} />
        </Fade>
      ) : null}
      <Fade visible={returnTo !== null} style={[styles.pillWrap, { top: (compactTitle?.top ?? 0) + 12 }]}>
        <Pressable
          onPress={() => { tapHaptic(); chrome.goBack(); }}
          accessibilityRole="button"
          accessibilityLabel={labels.backToWhereYouWere}
          style={[styles.pill, { backgroundColor: theme.card, borderColor: theme.border }]}
          testID={`${testID}-return`}
        >
          <Text style={[theme.text.label, styles.pillText, { color: theme.accent }]}>{`↓ ${labels.backToWhereYouWere}`}</Text>
        </Pressable>
      </Fade>
      <FloatingSlot
        bottom={bottom}
        testID={`${testID}-slot`}
        items={[
          { key: 'top', visible: state.showTop && !chrome.keyboardOpen, render: () => <BackToTopButton onPress={chrome.scrollToTop} theme={theme} labels={labels} /> },
          ...(cta ? [{ key: 'cta', visible: cta.visible && !state.showTop, render: cta.render }] : []),
        ]}
      />
    </>
  );
}

/** A ScrollView with the scroll chrome built in. Only this view takes the iOS status-bar tap. */
export const ScreenScroll = React.forwardRef<ScrollView, ScrollViewProps & {
  theme: ScrollChromeTheme;
  labels: ScrollChromeLabels;
  bottom: number;
  cta?: { visible: boolean; render: () => ReactElement } | null;
  compactTitle?: CompactTitle | null;
  /** Lets the screen reach the chrome (e.g. JS tab re-tap → scrollToTop). */
  chromeRef?: React.MutableRefObject<ScrollChrome | null>;
  /** Told when 「↑」 takes the floating slot, so a screen-level CTA elsewhere can step aside. */
  onShowTopChange?: (showTop: boolean) => void;
  /** Wrap the scroll view (e.g. Animated.ScrollView for a collapsible header). */
  ScrollComponent?: React.ComponentType<ScrollViewProps & { ref?: unknown }>;
}>(function ScreenScroll({ theme, labels, bottom, cta, compactTitle, chromeRef, onShowTopChange, ScrollComponent, onScroll, onLayout, onScrollBeginDrag, onScrollEndDrag, onMomentumScrollEnd, onContentSizeChange, style, ...rest }, forwarded) {
  const chrome = useScrollChrome();
  if (chromeRef) chromeRef.current = chrome;
  const showTop = chrome.state.showTop && !chrome.keyboardOpen;
  useEffect(() => { onShowTopChange?.(showTop); }, [showTop, onShowTopChange]);
  const setRef = useCallback((node: ScrollView | null) => {
    chrome.ref.current = node as unknown as Scrollable;
    if (typeof forwarded === 'function') forwarded(node);
    else if (forwarded) (forwarded as React.MutableRefObject<ScrollView | null>).current = node;
  }, [chrome.ref, forwarded]);
  const Comp = (ScrollComponent ?? ScrollView) as React.ComponentType<ScrollViewProps & { ref?: unknown }>;
  const handlers = useMemo(() => ({
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => { chrome.onScroll(e); onScroll?.(e); },
    onLayout: (e: LayoutChangeEvent) => { chrome.onLayout(e); onLayout?.(e); },
    onScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => { chrome.onScrollBeginDrag(); onScrollBeginDrag?.(e); },
    onScrollEndDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => { chrome.onScrollEndDrag(); onScrollEndDrag?.(e); },
    onMomentumScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) => { chrome.onMomentumScrollEnd(); onMomentumScrollEnd?.(e); },
    onContentSizeChange: (w: number, h: number) => { chrome.onContentSizeChange(w, h); onContentSizeChange?.(w, h); },
  }), [chrome, onScroll, onLayout, onScrollBeginDrag, onScrollEndDrag, onMomentumScrollEnd, onContentSizeChange]);
  return (
    <View style={[styles.flex, style as object]}>
      <Comp ref={setRef} scrollEventThrottle={16} scrollsToTop {...rest} {...handlers} style={styles.flex} />
      <ScrollChromeOverlay chrome={chrome} theme={theme} labels={labels} bottom={bottom} cta={cta} compactTitle={compactTitle} />
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  slot: { position: 'absolute', right: 16, alignItems: 'flex-end' },
  slotItem: { position: 'absolute', right: 0, bottom: 0 },
  top: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  topGlyph: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  pillWrap: { position: 'absolute', alignSelf: 'center', left: 0, right: 0, alignItems: 'center' },
  pill: {
    borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, minHeight: 36, justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  pillText: { fontWeight: '700' },
  barWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  bar: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 44 },
  barBack: { width: 48, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  barChevron: { fontSize: 30, lineHeight: 34, fontWeight: '300' },
  barTitleWrap: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  barTitle: { fontWeight: '700' },
});
