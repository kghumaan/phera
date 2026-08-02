import { describe, it, expect } from 'vitest';
import { guestTags, guestMatchesTags } from '@/lib/utils/guest-tags';

describe('guestTags', () => {
  it('reads the modern array shape (logistics_data.tags)', () => {
    expect(guestTags({ tags: ['Cousins', 'VIP'] })).toEqual(['Cousins', 'VIP']);
  });

  it('reads the legacy singular shape (logistics_data.tag)', () => {
    expect(guestTags({ tag: 'Family' })).toEqual(['Family']);
  });

  it('prefers the array shape when both are present', () => {
    expect(guestTags({ tags: ['New'], tag: 'Old' })).toEqual(['New']);
  });

  it('drops empty / non-string entries', () => {
    expect(guestTags({ tags: ['Ok', '', '  ', 3, null] })).toEqual(['Ok']);
  });

  it('returns [] for null / missing / malformed logistics_data', () => {
    expect(guestTags(null)).toEqual([]);
    expect(guestTags(undefined)).toEqual([]);
    expect(guestTags({})).toEqual([]);
    expect(guestTags('nope')).toEqual([]);
  });
});

describe('guestMatchesTags', () => {
  it('matches a guest tagged the modern (array) way — the bug that silently skipped them', () => {
    expect(guestMatchesTags({ tags: ['Cousins'] }, ['Cousins'])).toBe(true);
  });

  it('matches when any tag overlaps the target set', () => {
    expect(guestMatchesTags({ tags: ['A', 'B', 'C'] }, ['Z', 'B'])).toBe(true);
  });

  it('still matches the legacy singular shape', () => {
    expect(guestMatchesTags({ tag: 'Family' }, ['Family'])).toBe(true);
  });

  it('is false with no overlap, no tags, or no targets', () => {
    expect(guestMatchesTags({ tags: ['A'] }, ['B'])).toBe(false);
    expect(guestMatchesTags({}, ['A'])).toBe(false);
    expect(guestMatchesTags({ tags: ['A'] }, [])).toBe(false);
  });
});
