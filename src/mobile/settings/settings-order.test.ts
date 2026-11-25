import { SETTINGS_SECTION_ORDER, orderedSections } from './settings-order';

describe('settings order', () => {
  it('is the agreed order', () => {
    expect(SETTINGS_SECTION_ORDER).toEqual(['purchase', 'appearance', 'notifications', 'content', 'personalization', 'privacy', 'support', 'about']);
  });
  it('orders sections and drops empty ones', () => {
    const out = orderedSections({
      about: { rows: ['v'] },
      appearance: { rows: ['theme', null, false] },
      content: { rows: [] },
      support: { rows: [], extra: 'card' },
      notifications: null,
    });
    expect(out.map((s) => s.key)).toEqual(['appearance', 'support', 'about']);
    expect(out[0].section.rows).toEqual(['theme']);
  });
});
