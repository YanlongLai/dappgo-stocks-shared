/**
 * One settings page for all three apps (2.0.1).
 *
 * - `SettingsScreen` draws the sections in the fixed order (purchase,
 *   appearance, notifications, content, personalization, privacy, support,
 *   about) and skips empty ones. Apps pass only their rows.
 * - `SettingsSection` is a titled, grouped card; rows get hairline dividers.
 * - `SettingsRow` kinds: navigate ›, toggle, value ›, action, destructive.
 * - `SegmentedSetting` (theme): three equal segments; with large text it
 *   becomes a value row › with a chooser, so labels are never cut.
 * - `LanguagePicker`: one row 「語言　繁體中文 ›」 opening a list: 「使用裝置語言」
 *   first, then the nine languages (native name + name in the UI language),
 *   the current one checked.
 *
 * Structure, spacing and type sizes are identical in every app; colours come
 * from the app's theme (each keeps its accent). Icons are drawn by the app
 * through `theme.renderIcon`, so this file needs no icon library. Rows used
 * outside a SettingsScreen fall back to a neutral theme.
 */
import React, { Children, createContext, isValidElement, useContext, useState, type ReactElement, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions, type TextStyle } from 'react-native';
import { languageChoices } from '../../mobile/i18n/language-names';
import { LOCALE_LABELS, type Locale } from '../../mobile/i18n/locale';
import {
  SEGMENTED_MAX_FONT_SCALE, VALUE_STACK_FONT_SCALE, orderedSections, type SettingsSectionKey,
} from '../../mobile/settings/settings-order';
import { tapHaptic } from '../tiles/PressableCard';

export type SettingsIconName = 'chevron-forward' | 'open-outline' | 'checkmark' | 'information-circle-outline' | 'close' | (string & {});

export interface SettingsTheme {
  background: string;
  card: string;
  border: string;
  textHeading: string;
  textMuted: string;
  accent: string;
  onAccent: string;
  negative: string;
  /** Switch track when on; defaults to the accent. */
  switchOn?: string;
  /** Defaults to SETTINGS_TEXT, the same sizes in every app. */
  text?: { row: TextStyle; helper: TextStyle; section: TextStyle };
  renderIcon: (name: SettingsIconName, size: number, color: string) => ReactNode;
}

/** One type scale for every app's settings (they scale with the system text size). */
export const SETTINGS_TEXT: { row: TextStyle; helper: TextStyle; section: TextStyle } = {
  row: { fontSize: 16, fontWeight: '500' },
  helper: { fontSize: 12.5, fontWeight: '400', lineHeight: 17 },
  section: { fontSize: 13.5, fontWeight: '700', letterSpacing: 0.6 },
};

/** Neutral fallback so a row drawn on its own (tests, previews) still renders. */
const FALLBACK_THEME: SettingsTheme = {
  background: '#ffffff', card: '#ffffff', border: '#d0d7de', textHeading: '#1f2328', textMuted: '#59636e',
  accent: '#0969da', onAccent: '#ffffff', negative: '#cf222e', renderIcon: () => null,
};

const ThemeContext = createContext<SettingsTheme | null>(null);
function useSettingsTheme(): SettingsTheme & { text: NonNullable<SettingsTheme['text']> } {
  const t = useContext(ThemeContext) ?? FALLBACK_THEME;
  return { ...t, text: t.text ?? SETTINGS_TEXT };
}
export const SettingsThemeProvider = ThemeContext.Provider;

// ── Row ──────────────────────────────────────────────────────────────

export type SettingsRowKind = 'navigate' | 'toggle' | 'value' | 'action' | 'destructive';

export interface SettingsRowProps {
  kind: SettingsRowKind;
  label: string;
  subtitle?: string | null;
  /** value rows: the current choice, shown before ›; action rows: a plain value. */
  value?: string | null;
  /** Leading icon name (drawn by the app). */
  icon?: SettingsIconName | null;
  onPress?: () => void;
  /** toggle rows. */
  toggle?: { value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean; testID?: string };
  /** navigate rows that leave the app (mail, browser). */
  external?: boolean;
  /** Small ⓘ after the label. */
  info?: { onPress: () => void; accessibilityLabel: string; testID?: string } | null;
  /** Extra content under the label (e.g. an error with a retry). */
  below?: ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export function SettingsRow(p: SettingsRowProps) {
  const theme = useSettingsTheme();
  const stack = useWindowDimensions().fontScale >= VALUE_STACK_FONT_SCALE;
  const destructive = p.kind === 'destructive';
  const labelColor = destructive ? theme.negative : theme.textHeading;
  const trailing = p.kind === 'navigate' || p.kind === 'value'
    ? theme.renderIcon(p.external ? 'open-outline' : 'chevron-forward', 16, theme.textMuted)
    : null;
  // value rows end in ›; an action row may show a plain value (e.g. the version).
  const valueText = (p.kind === 'value' || p.kind === 'action') && p.value ? (
    <Text style={[theme.text.row, stack ? styles.valueStacked : styles.value, { color: theme.textMuted }]} testID={p.testID ? `${p.testID}-value` : undefined}>
      {p.value}
    </Text>
  ) : null;
  const body = (
    <>
      {p.icon ? <View style={styles.icon}>{theme.renderIcon(p.icon, 18, destructive ? theme.negative : theme.accent)}</View> : null}
      <View style={styles.texts}>
        <View style={styles.labelLine}>
          <Text style={[theme.text.row, styles.label, { color: labelColor }]}>{p.label}</Text>
          {p.info ? (
            <Pressable onPress={p.info.onPress} hitSlop={13} accessibilityRole="button" accessibilityLabel={p.info.accessibilityLabel} testID={p.info.testID} style={styles.info}>
              {theme.renderIcon('information-circle-outline', 18, theme.accent)}
            </Pressable>
          ) : null}
        </View>
        {p.subtitle ? <Text style={[theme.text.helper, { color: theme.textMuted }]}>{p.subtitle}</Text> : null}
        {stack ? valueText : null}
        {p.below}
      </View>
      {stack ? null : valueText}
      {p.kind === 'toggle' && p.toggle ? (
        <Switch
          value={p.toggle.value}
          onValueChange={p.toggle.onValueChange}
          disabled={p.toggle.disabled}
          accessibilityLabel={p.accessibilityLabel ?? p.label}
          accessibilityHint={p.accessibilityHint}
          accessibilityRole="switch"
          accessibilityState={{ checked: p.toggle.value, disabled: !!p.toggle.disabled }}
          // Off track stays the platform's own grey: the app border token is
          // near-white on light cards and made an off switch invisible.
          trackColor={{ true: theme.switchOn ?? theme.accent }}
          testID={p.toggle.testID ?? (p.testID ? `${p.testID}-switch` : undefined)}
        />
      ) : null}
      {trailing}
    </>
  );
  if (p.kind === 'toggle' || !p.onPress) {
    return <View style={styles.row} testID={p.testID}>{body}</View>;
  }
  return (
    <Pressable
      onPress={() => { tapHaptic(); p.onPress?.(); }}
      accessibilityRole="button"
      accessibilityLabel={p.accessibilityLabel ?? (p.value ? `${p.label}, ${p.value}` : p.label)}
      accessibilityHint={p.accessibilityHint}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      testID={p.testID}
    >
      {body}
    </Pressable>
  );
}

// ── Section ──────────────────────────────────────────────────────────

export function SettingsSection({ title, children, extra, footer, testID }: {
  title: string;
  children?: ReactNode;
  /** Content below the grouped card (e.g. a purchase card, app links). */
  extra?: ReactNode;
  footer?: string | null;
  testID?: string;
}) {
  const theme = useSettingsTheme();
  const rows = Children.toArray(children); // toArray already drops null, undefined and booleans
  if (!rows.length && !extra) return null;
  return (
    <View style={styles.section} testID={testID}>
      <Text style={[theme.text.section, styles.sectionTitle, { color: theme.textMuted }]} accessibilityRole="header">{title}</Text>
      {rows.length ? (
        <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {rows.map((row, i) => (
            <React.Fragment key={isValidElement(row) && row.key != null ? row.key : i}>
              {i > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
              {row}
            </React.Fragment>
          ))}
        </View>
      ) : null}
      {extra ? <View style={styles.extra}>{extra}</View> : null}
      {footer ? <Text style={[theme.text.helper, styles.footer, { color: theme.textMuted }]}>{footer}</Text> : null}
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────

export interface SettingsSectionSpec {
  title: string;
  rows: ReactNode[];
  extra?: ReactNode;
  footer?: string | null;
}

/** The whole page body: sections in the fixed order, empty ones skipped. */
export function SettingsScreen({ theme, sections, testID = 'settings-screen' }: {
  theme: SettingsTheme;
  sections: Partial<Record<SettingsSectionKey, SettingsSectionSpec | null>>;
  testID?: string;
}) {
  return (
    <ThemeContext.Provider value={theme}>
      <View testID={testID}>
        {orderedSections(sections).map(({ key, section }) => (
          <SettingsSection key={key} title={section.title} extra={section.extra} footer={section.footer} testID={`settings-section-${key}`}>
            {section.rows.map((r, i) => (isValidElement(r) ? React.cloneElement(r as ReactElement, { key: (r as ReactElement).key ?? i }) : r))}
          </SettingsSection>
        ))}
      </View>
    </ThemeContext.Provider>
  );
}

// ── Chooser sheet ────────────────────────────────────────────────────

export interface ChoiceOption {
  key: string;
  label: string;
  sub?: string | null;
  testID?: string;
}

export function ChoiceSheet({ visible, title, options, selected, onSelect, onClose, closeLabel, testID = 'settings-choice-sheet' }: {
  visible: boolean;
  title: string;
  options: readonly ChoiceOption[];
  selected: string | null;
  onSelect: (key: string) => void;
  onClose: () => void;
  closeLabel: string;
  testID?: string;
}) {
  const theme = useSettingsTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel={closeLabel} />
      <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]} testID={testID}>
        <View style={[styles.grabber, { backgroundColor: theme.border }]} />
        <View style={styles.sheetHead}>
          <Text style={[theme.text.row, styles.sheetTitle, { color: theme.textHeading }]} accessibilityRole="header">{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={closeLabel} style={styles.close} testID={`${testID}-close`}>
            <Text style={[theme.text.row, { color: theme.accent, fontWeight: '700' }]}>{closeLabel}</Text>
          </Pressable>
        </View>
        <ScrollView scrollsToTop={false}>
          {options.map((o, i) => {
            const on = o.key === selected;
            return (
              <React.Fragment key={o.key}>
                {i > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
                <Pressable
                  onPress={() => { tapHaptic(); onSelect(o.key); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={o.sub ? `${o.label}, ${o.sub}` : o.label}
                  style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
                  testID={o.testID ?? `${testID}-${o.key}`}
                >
                  <View style={styles.texts}>
                    <Text style={[theme.text.row, { color: theme.textHeading, fontWeight: on ? '700' : '400' }]}>{o.label}</Text>
                    {o.sub ? <Text style={[theme.text.helper, { color: theme.textMuted }]}>{o.sub}</Text> : null}
                  </View>
                  {on ? theme.renderIcon('checkmark', 20, theme.accent) : null}
                </Pressable>
              </React.Fragment>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Theme (segmented) ────────────────────────────────────────────────

export function SegmentedSetting<K extends string>({ label, icon, options, value, onChange, closeLabel, testID = 'settings-segmented' }: {
  label: string;
  icon?: SettingsIconName | null;
  options: readonly { key: K; label: string; testID?: string; accessibilityLabel?: string }[];
  value: K;
  onChange: (key: K) => void;
  closeLabel: string;
  testID?: string;
}) {
  const theme = useSettingsTheme();
  const large = useWindowDimensions().fontScale >= SEGMENTED_MAX_FONT_SCALE;
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.key === value);
  if (large) {
    return (
      <>
        <SettingsRow kind="value" icon={icon} label={label} value={current?.label ?? null} onPress={() => setOpen(true)} testID={testID} />
        <ChoiceSheet
          visible={open}
          title={label}
          options={options.map((o) => ({ key: o.key, label: o.label, testID: o.testID }))}
          selected={value}
          onSelect={(k) => { onChange(k as K); setOpen(false); }}
          onClose={() => setOpen(false)}
          closeLabel={closeLabel}
          testID={`${testID}-sheet`}
        />
      </>
    );
  }
  return (
    <View style={styles.segmentedRow} testID={testID}>
      <View style={styles.segmentedLabel}>
        {icon ? <View style={styles.icon}>{theme.renderIcon(icon, 18, theme.accent)}</View> : null}
        <Text style={[theme.text.row, { color: theme.textHeading }]}>{label}</Text>
      </View>
      <View style={[styles.segments, { borderColor: theme.border }]} accessibilityRole="radiogroup">
        {options.map((o, i) => {
          const on = o.key === value;
          return (
            <Pressable
              key={o.key}
              onPress={() => { tapHaptic(); onChange(o.key); }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on, checked: on }}
              accessibilityLabel={o.accessibilityLabel ?? o.label}
              style={[styles.segment, i > 0 && { borderLeftColor: theme.border, borderLeftWidth: StyleSheet.hairlineWidth }, on && { backgroundColor: theme.accent }]}
              testID={o.testID}
            >
              <Text style={[theme.text.row, styles.segmentText, { color: on ? theme.onAccent : theme.textHeading }]} numberOfLines={1}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Language ─────────────────────────────────────────────────────────

/** Stable test IDs (Maestro flows tap these): written out so they can be found in source. */
export const LANGUAGE_OPTION_TEST_IDS: Record<Locale | 'device', string> = {
  device: 'language-button-device',
  en: 'language-button-en',
  'zh-Hant': 'language-button-zh-Hant',
  'zh-Hans': 'language-button-zh-Hans',
  ja: 'language-button-ja',
  ko: 'language-button-ko',
  es: 'language-button-es',
  de: 'language-button-de',
  fr: 'language-button-fr',
  'pt-BR': 'language-button-pt-BR',
};

export interface LanguagePickerLabels {
  /** 「語言」 */
  title: string;
  /** 「使用裝置語言」 */
  useDevice: string;
  /** Subtitle under 「使用裝置語言」, e.g. 「目前：繁體中文」. */
  deviceCurrent: (nativeName: string) => string;
  close: string;
}

export function LanguagePicker({ language, source, deviceLanguage, onSelect, onUseDevice, labels, icon, testID = 'language-row' }: {
  icon?: SettingsIconName | null;
  /** The language the app shows now. */
  language: Locale;
  source: 'device' | 'manual';
  /** What 「使用裝置語言」 would resolve to. */
  deviceLanguage: Locale;
  onSelect: (locale: Locale) => void;
  onUseDevice: () => void;
  labels: LanguagePickerLabels;
  testID?: string;
}) {
  const [open, setOpen] = useState(false);
  const choices = languageChoices(language);
  const options: ChoiceOption[] = [
    { key: 'device', label: labels.useDevice, sub: labels.deviceCurrent(LOCALE_LABELS[deviceLanguage]), testID: LANGUAGE_OPTION_TEST_IDS.device },
    ...choices.map((c) => ({ key: c.locale, label: c.label, sub: c.sub, testID: LANGUAGE_OPTION_TEST_IDS[c.locale] })),
  ];
  return (
    <>
      <SettingsRow kind="value" icon={icon} label={labels.title} value={LOCALE_LABELS[language]} onPress={() => setOpen(true)} testID={testID} />
      <ChoiceSheet
        visible={open}
        title={labels.title}
        options={options}
        selected={source === 'device' ? 'device' : language}
        onSelect={(k) => { if (k === 'device') onUseDevice(); else onSelect(k as Locale); setOpen(false); }}
        onClose={() => setOpen(false)}
        closeLabel={labels.close}
        testID="language-sheet"
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  // One look in every language: uppercase titles (no effect on CJK).
  sectionTitle: { marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
  group: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, overflow: 'hidden' },
  extra: { marginTop: 12, gap: 12 },
  footer: { marginTop: 6, marginHorizontal: 4 },
  divider: { height: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingVertical: 10, gap: 12 },
  pressed: { opacity: 0.6 },
  icon: { width: 22, alignItems: 'center' },
  texts: { flex: 1, minWidth: 0, gap: 2 },
  labelLine: { flexDirection: 'row', alignItems: 'center' },
  label: { flexShrink: 1 },
  info: { marginLeft: 6 },
  value: { flexShrink: 1, maxWidth: '50%', textAlign: 'right' },
  valueStacked: { marginTop: 2 },
  segmentedRow: { paddingVertical: 12, gap: 10 },
  segmentedLabel: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  segments: { flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, overflow: 'hidden' },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segmentText: { fontWeight: '600' },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { maxHeight: '80%', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingBottom: 28 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginTop: 8, marginBottom: 4 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 8 },
  sheetTitle: { flex: 1, fontWeight: '700' },
  close: { minHeight: 44, justifyContent: 'center', paddingLeft: 12 },
  choice: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingVertical: 8, gap: 12 },
});
