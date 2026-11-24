import { INITIAL_CHROME, isExternalReturnToTop, nextChrome, scrollToTopPlan } from './scroll-chrome';

const V = 800;
function run(ys: number[], content = V * 5, kb = false) {
  return ys.reduce((s, y) => nextChrome(s, y, V, content, kb), INITIAL_CHROME);
}

describe('scroll chrome', () => {
  it('shows ↑ only after 1.5 screens down and then scrolling up', () => {
    expect(run([400, 900, 1300]).showTop).toBe(false); // still going down
    expect(run([400, 900, 1300, 1250]).showTop).toBe(true);
    expect(run([400, 900, 1000, 950]).showTop).toBe(false); // not deep enough (1.5 × 800 = 1200)
  });
  it('hides on scrolling down again, near the top, with the keyboard open, and on short pages', () => {
    expect(run([400, 900, 1300, 1250, 1400]).showTop).toBe(false);
    expect(run([400, 900, 1300, 1250, 0]).showTop).toBe(false);
    expect(run([400, 900, 1300, 1250], V * 5, true).showTop).toBe(false);
    expect(run([400, 900, 1300, 1250], V * 1.9).showTop).toBe(false);
  });
  it('ignores tiny jitter when deciding direction', () => {
    const s = run([400, 900, 1300, 1250, 1253]);
    expect(s.direction).toBe('up');
    expect(s.showTop).toBe(true);
  });
  it('jumps to one screen first when more than three screens down', () => {
    expect(scrollToTopPlan(V * 3.5, V)).toEqual({ jumpTo: V });
    expect(scrollToTopPlan(V * 2, V)).toEqual({ jumpTo: null });
  });
  it('detects a return to the top it did not start (status bar, tab re-tap)', () => {
    expect(isExternalReturnToTop(2000, 0, V, false)).toBe(true);
    expect(isExternalReturnToTop(2000, 0, V, true)).toBe(false);
    expect(isExternalReturnToTop(500, 0, V, false)).toBe(false);
  });
});
