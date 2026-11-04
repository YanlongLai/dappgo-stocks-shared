import { sortInsightsByTier } from './insight-sort';
import type { Insight } from './insight-types';

function makeInsight(tier: Insight['tier'], id: string): Insight {
  return {
    id,
    asset_ref: 'us_AAPL',
    category: 'trend',
    tier,
    actionable: false,
    question: 'Test question?',
    answer: 'Test answer.',
    answer_short: 'Short',
    explanation: 'Explanation text.',
    evidence: { facts: {}, method: 'test', computed_from: ['test'] },
  };
}

describe('sortInsightsByTier', () => {
  it('sorts critical before warn before good before info before bad', () => {
    const input = [
      makeInsight('bad', 'bad'),
      makeInsight('info', 'info'),
      makeInsight('good', 'good'),
      makeInsight('warn', 'warn'),
      makeInsight('critical', 'critical'),
    ];
    const sorted = sortInsightsByTier(input);
    expect(sorted.map((i) => i.tier)).toEqual([
      'critical',
      'warn',
      'good',
      'info',
      'bad',
    ]);
  });

  it('does not mutate the original array', () => {
    const input = [makeInsight('info', 'a'), makeInsight('critical', 'b')];
    sortInsightsByTier(input);
    expect(input[0].tier).toBe('info');
    expect(input[1].tier).toBe('critical');
  });

  it('maintains stable order within the same tier', () => {
    const input = [
      makeInsight('warn', 'w1'),
      makeInsight('warn', 'w2'),
      makeInsight('warn', 'w3'),
    ];
    const sorted = sortInsightsByTier(input);
    expect(sorted.map((i) => i.id)).toEqual(['w1', 'w2', 'w3']);
  });

  it('returns empty array when given empty input', () => {
    expect(sortInsightsByTier([])).toEqual([]);
  });

  it('handles a single element without error', () => {
    const input = [makeInsight('critical', 'only')];
    expect(sortInsightsByTier(input)).toHaveLength(1);
  });

  it('sorts mixed tiers correctly with multiple entries', () => {
    const input = [
      makeInsight('info', 'i1'),
      makeInsight('critical', 'c1'),
      makeInsight('good', 'g1'),
      makeInsight('warn', 'w1'),
      makeInsight('bad', 'b1'),
      makeInsight('critical', 'c2'),
      makeInsight('good', 'g2'),
    ];
    const sorted = sortInsightsByTier(input);
    expect(sorted[0].tier).toBe('critical');
    expect(sorted[1].tier).toBe('critical');
    expect(sorted[2].tier).toBe('warn');
    expect(sorted[3].tier).toBe('good');
    expect(sorted[4].tier).toBe('good');
    expect(sorted[5].tier).toBe('info');
    expect(sorted[6].tier).toBe('bad');
  });
});
