import { describe, it, expect } from 'vitest';
import { drainSentences } from '@/components/agent/useSpeechQueue';

describe('drainSentences', () => {
  it('extracts complete sentences and carries the remainder forward', () => {
    const { sentences, rest } = drainSentences('Hello there. How are ', false);
    expect(sentences).toEqual(['Hello there.']);
    expect(rest).toBe(' How are ');
  });

  it('splits on ! and ? and newlines', () => {
    const { sentences, rest } = drainSentences('Done! Next?\nMore text', false);
    expect(sentences).toEqual(['Done!', 'Next?']);
    // trailing chunk after the newline has no terminator → carried forward
    expect(rest).toBe('More text');
  });

  it('does not split mid-stream when no terminator is present', () => {
    const { sentences, rest } = drainSentences('Setting the venue to the Leela', false);
    expect(sentences).toEqual([]);
    expect(rest).toBe('Setting the venue to the Leela');
  });

  it('flushes the trailing partial sentence when flushAll is set', () => {
    const { sentences, rest } = drainSentences('All set', true);
    expect(sentences).toEqual(['All set']);
    expect(rest).toBe('');
  });

  it('keeps a terminator followed by a closing quote together', () => {
    const { sentences } = drainSentences('She said "yes." And smiled.', false);
    expect(sentences).toEqual(['She said "yes."', 'And smiled.']);
  });

  it('returns nothing for empty input', () => {
    expect(drainSentences('', false)).toEqual({ sentences: [], rest: '' });
    expect(drainSentences('   ', true)).toEqual({ sentences: [], rest: '' });
  });
});
