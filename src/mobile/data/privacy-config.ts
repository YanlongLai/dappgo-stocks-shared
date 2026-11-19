/**
 * First-party Firebase user-data collection is paused by Owner direction.
 * Keep this explicit so writers fail closed.
 */
export const FIREBASE_USER_DATA_COLLECTION_ENABLED = false as const;

/**
 * Push-token registration only (Owner 2026-11-19: 「推播開放美股台股，只收推播 token」).
 * Allows anonymous Firebase auth and the user's own users/{uid} push document (device
 * token, platform, bundle id, subscribed market, locale, time zone and notification
 * preferences) after the user turns notifications on. Nothing else is written.
 */
export const PUSH_TOKEN_REGISTRATION_ENABLED = true as const;
