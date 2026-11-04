import { createAnalyticsConsent, ANALYTICS_CONSENT_KEY } from './analytics-consent';
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();
describe('optional first-party analytics consent settings', () => {
  beforeEach(() => {
    jest.resetModules();
    mockGetItem.mockReset().mockResolvedValue(null);
    mockSetItem.mockReset().mockResolvedValue(undefined);
    mockRemoveItem.mockReset().mockResolvedValue(undefined);
  });
  it('defaults on only when the preference is missing and preserves explicit choices', async () => {
    for (const stored of [null, 'false', '1', 'TRUE', '{}']) {
      jest.resetModules();
      mockGetItem.mockResolvedValue(stored);
      const consent = ({ ANALYTICS_CONSENT_KEY, ...createAnalyticsConsent({ getItem: mockGetItem, setItem: mockSetItem, removeItem: mockRemoveItem }) });
      expect(consent.getAnalyticsConsent()).toBe(true);
      expect(consent.getAnalyticsConsentHydrated()).toBe(false);
      await consent.initializeAnalyticsConsent();
      expect(consent.getAnalyticsConsentHydrated()).toBe(true);
      expect(consent.getAnalyticsConsent()).toBe(stored === null);
    }
    jest.resetModules();
    mockGetItem.mockRejectedValue(new Error('storage unavailable'));
    const consent = ({ ANALYTICS_CONSENT_KEY, ...createAnalyticsConsent({ getItem: mockGetItem, setItem: mockSetItem, removeItem: mockRemoveItem }) });
    expect(consent.getAnalyticsConsent()).toBe(true);
    await consent.initializeAnalyticsConsent();
    expect(consent.getAnalyticsConsentHydrated()).toBe(true);
    expect(consent.getAnalyticsConsent()).toBe(false);
  });
  it('restores only an explicitly persisted true', async () => {
    mockGetItem.mockResolvedValue('true');
    const consent = ({ ANALYTICS_CONSENT_KEY, ...createAnalyticsConsent({ getItem: mockGetItem, setItem: mockSetItem, removeItem: mockRemoveItem }) });
    await consent.initializeAnalyticsConsent();
    expect(consent.getAnalyticsConsent()).toBe(true);
  });
  it('persists an explicit choice and notifies withdrawal synchronously', async () => {
    const consent = ({ ANALYTICS_CONSENT_KEY, ...createAnalyticsConsent({ getItem: mockGetItem, setItem: mockSetItem, removeItem: mockRemoveItem }) });
    await consent.setAnalyticsConsent(true);
    const listener = jest.fn();
    const stop = consent.subscribeAnalyticsConsent(listener);
    const pending = consent.setAnalyticsConsent(false);
    expect(consent.getAnalyticsConsent()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    await pending;
    expect(mockSetItem).toHaveBeenLastCalledWith(consent.ANALYTICS_CONSENT_KEY, 'false');
    stop();
  });
  it('does not let late hydration override withdrawal or opt-in', async () => {
    for (const choice of [false, true]) {
      jest.resetModules();
      let finish!: (stored: string) => void;
      mockGetItem.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
      const consent = ({ ANALYTICS_CONSENT_KEY, ...createAnalyticsConsent({ getItem: mockGetItem, setItem: mockSetItem, removeItem: mockRemoveItem }) });
      const hydration = consent.initializeAnalyticsConsent();
      await consent.setAnalyticsConsent(choice);
      finish(choice ? 'false' : 'true');
      await hydration;
      expect(consent.getAnalyticsConsent()).toBe(choice);
    }
  });
  it('serializes writes so a slow grant cannot overwrite withdrawal', async () => {
    let finish!: () => void;
    mockSetItem.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
    const consent = ({ ANALYTICS_CONSENT_KEY, ...createAnalyticsConsent({ getItem: mockGetItem, setItem: mockSetItem, removeItem: mockRemoveItem }) });
    const grant = consent.setAnalyticsConsent(true);
    while (!finish) await Promise.resolve();
    const withdrawal = consent.setAnalyticsConsent(false);
    expect(consent.getAnalyticsConsent()).toBe(false);
    finish();
    await Promise.all([grant, withdrawal]);
    expect(mockSetItem).toHaveBeenLastCalledWith(consent.ANALYTICS_CONSENT_KEY, 'false');
  });
  it('persists a re-entrant subscriber withdrawal after the triggering grant', async () => {
    const consent = ({ ANALYTICS_CONSENT_KEY, ...createAnalyticsConsent({ getItem: mockGetItem, setItem: mockSetItem, removeItem: mockRemoveItem }) });
    let withdrawal: Promise<void> | undefined;
    let revoke = true;
    const stop = consent.subscribeAnalyticsConsent(() => {
      if (revoke && consent.getAnalyticsConsent()) {
        revoke = false;
        withdrawal = consent.setAnalyticsConsent(false);
      }
    });
    const grant = consent.setAnalyticsConsent(true);
    expect(consent.getAnalyticsConsent()).toBe(false);
    await Promise.all([grant, withdrawal]);
    expect(mockSetItem.mock.calls.map((call) => call[1])).toEqual(['true', 'false']);
    stop();
  });
  it('fails closed and surfaces a failed opt-in save', async () => {
    const consent = ({ ANALYTICS_CONSENT_KEY, ...createAnalyticsConsent({ getItem: mockGetItem, setItem: mockSetItem, removeItem: mockRemoveItem }) });
    mockSetItem.mockRejectedValueOnce(new Error('write failed'));
    await consent.setAnalyticsConsent(true);
    expect(consent.getAnalyticsConsent()).toBe(false);
    expect(consent.getAnalyticsConsentSaveError()).toBe(true);
    expect(mockRemoveItem).toHaveBeenCalledWith(consent.ANALYTICS_CONSENT_KEY);
  });
  it('removes an old grant when saving withdrawal fails', async () => {
    const consent = ({ ANALYTICS_CONSENT_KEY, ...createAnalyticsConsent({ getItem: mockGetItem, setItem: mockSetItem, removeItem: mockRemoveItem }) });
    await consent.setAnalyticsConsent(true);
    mockSetItem.mockRejectedValueOnce(new Error('write failed'));
    await consent.setAnalyticsConsent(false);
    expect(consent.getAnalyticsConsent()).toBe(false);
    expect(consent.getAnalyticsConsentSaveError()).toBe(false);
    expect(mockRemoveItem).toHaveBeenCalledWith(consent.ANALYTICS_CONSENT_KEY);
  });
  it('surfaces failed withdrawal durability and permits a retry', async () => {
    const consent = ({ ANALYTICS_CONSENT_KEY, ...createAnalyticsConsent({ getItem: mockGetItem, setItem: mockSetItem, removeItem: mockRemoveItem }) });
    await consent.setAnalyticsConsent(true);
    mockSetItem.mockRejectedValueOnce(new Error('write failed'));
    mockRemoveItem.mockRejectedValueOnce(new Error('remove failed'));
    const withdrawal = consent.setAnalyticsConsent(false);
    expect(consent.getAnalyticsConsent()).toBe(false);
    await withdrawal;
    expect(consent.getAnalyticsConsentSaveError()).toBe(true);
    await consent.setAnalyticsConsent(false);
    expect(consent.getAnalyticsConsentSaveError()).toBe(false);
    expect(mockSetItem).toHaveBeenLastCalledWith(consent.ANALYTICS_CONSENT_KEY, 'false');
  });
});
