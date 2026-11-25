import { labelLayout } from './label-layout';

describe('distribution label layout', () => {
  it('keeps one row when all labels fit, else a two-column grid', () => {
    expect(labelLayout([80, 70, 75, 90], 370)).toBe('row'); // 315 + 12
    expect(labelLayout([95, 80, 90, 110], 370)).toBe('grid'); // 375 + 12
    expect(labelLayout([92, 92, 92, 92], 380)).toBe('row'); // exactly 368 + 12
  });
  it('stays a row until measured', () => {
    expect(labelLayout([80, 0, 70], 370)).toBe('row');
    expect(labelLayout([80, 70], 0)).toBe('row');
  });
});
