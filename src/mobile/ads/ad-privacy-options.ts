/** A displayed form is not proof that any advertising purpose was granted. */
export type AdPrivacyOptionsResult =
  | { status: 'shown' }
  | { status: 'not-required' }
  | { status: 'unavailable'; reason: 'sdk-unavailable' | 'unknown-status' | 'unsupported-platform' }
  | { status: 'superseded' }
  | { status: 'error'; stage?: 'info-update' | 'form' | 'apply' };
