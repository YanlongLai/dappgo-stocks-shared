export type ThemeMode = 'system' | 'light' | 'dark';
export type ThemeActual = 'light' | 'dark';

/**
 * Resolve the actual rendered theme from a user-chosen mode and the device
 * system colour scheme.  'system' delegates to the device; explicit choices
 * always win.
 */
export function resolveActualTheme(
  mode: ThemeMode,
  systemValue: ThemeActual,
): ThemeActual {
  if (mode === 'system') return systemValue;
  return mode;
}
