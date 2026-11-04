import { sentimentDotColor } from './sentiment-dot';

describe('sentimentDotColor', () => {
  it('maps very_positive → positive', () => {
    expect(sentimentDotColor('very_positive')).toBe('positive');
  });

  it('maps positive → positive', () => {
    expect(sentimentDotColor('positive')).toBe('positive');
  });

  it('maps neutral → neutral', () => {
    expect(sentimentDotColor('neutral')).toBe('neutral');
  });

  it('maps negative → negative', () => {
    expect(sentimentDotColor('negative')).toBe('negative');
  });

  it('maps very_negative → negative', () => {
    expect(sentimentDotColor('very_negative')).toBe('negative');
  });

  it('returns null for unknown', () => {
    expect(sentimentDotColor('unknown')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(sentimentDotColor(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(sentimentDotColor(undefined)).toBeNull();
  });
});
