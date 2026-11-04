// Pure helper types for settings screen row consistency.
export interface SettingsRow {
  emoji: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  badge?: string; // small pill text on right (e.g. "新")
}
