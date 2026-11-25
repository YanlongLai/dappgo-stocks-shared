/**
 * One settings layout for all apps (2.0.1). Sections always appear in this
 * order; a section with nothing in it is not drawn.
 */
export const SETTINGS_SECTION_ORDER = [
  'purchase', // 移除廣告、訂閱選項、恢復購買
  'appearance', // 主題、語言
  'notifications', // 價格提醒、推播
  'content', // app-specific display (Options 今日分析顯示; US/TW 估值、自選清單)
  'personalization', // 個人化開關、清除使用紀錄
  'privacy', // 選擇性詳細使用分析、廣告隱私、刪除我的資料
  'support', // 意見回饋、追蹤 DappGo、更多 App
  'about', // 版本、App 使用者 ID、分析 ID
] as const;

export type SettingsSectionKey = (typeof SETTINGS_SECTION_ORDER)[number];

/** The sections to draw, in the fixed order, skipping empty ones. */
export function orderedSections<T extends { rows: readonly unknown[]; extra?: unknown }>(
  sections: Partial<Record<SettingsSectionKey, T | null | undefined>>,
): { key: SettingsSectionKey; section: T }[] {
  return SETTINGS_SECTION_ORDER.flatMap((key) => {
    const s = sections[key];
    if (!s) return [];
    const rows = s.rows.filter((r) => r !== null && r !== undefined && r !== false);
    return rows.length || s.extra ? [{ key, section: { ...s, rows } }] : [];
  });
}

/** Large text: segmented controls give way to a value row with a chooser. */
export const SEGMENTED_MAX_FONT_SCALE = 1.3;
/** Large text: a value row puts its value under the label instead of beside it. */
export const VALUE_STACK_FONT_SCALE = 1.3;
