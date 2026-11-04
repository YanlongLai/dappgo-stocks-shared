import { TW_AXIS_LABELS, US_AXIS_LABELS } from './contribution-display';

describe('TW_AXIS_LABELS', () => {
  it('has correct trend label', () => {
    expect(TW_AXIS_LABELS.trend).toBe('趨勢');
  });

  it('has chip label (TW-specific)', () => {
    expect(TW_AXIS_LABELS.chip).toBe('籌碼');
  });

  it('does not have ownership label', () => {
    expect(TW_AXIS_LABELS.ownership).toBeUndefined();
  });
});

describe('US_AXIS_LABELS', () => {
  it('has correct momentum label', () => {
    expect(US_AXIS_LABELS.momentum).toBe('動能');
  });

  it('has ownership label (US-specific)', () => {
    expect(US_AXIS_LABELS.ownership).toBe('機構');
  });

  it('does not have chip label', () => {
    expect(US_AXIS_LABELS.chip).toBeUndefined();
  });
});
