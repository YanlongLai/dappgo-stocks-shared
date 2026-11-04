/** Phase one has no browser push or permission prompts. Native module is not imported. */
export async function requestPermissions(): Promise<false> { return false; }
export async function scheduleDailyReminder(_hour = 9, _minute = 0): Promise<void> {}
export async function cancelDailyReminder(): Promise<void> {}
export async function cancelAll(): Promise<void> {}
export async function fireLocalNotification(_params: {
  title: string; body: string; data?: Record<string, unknown>;
}): Promise<void> {}
