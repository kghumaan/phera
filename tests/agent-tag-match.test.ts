import { describe, it, expect } from 'vitest';
import { matchTagQuery } from '@/lib/agent/tools/guests';

const TAGS = ['Bridesmaid', 'Groomsman', "Bride's Fam", 'Transport Covered', 'Family', 'Family2'];

describe('matchTagQuery', () => {
  it('matches exactly, case-insensitive, returning the canonical tag string', () => {
    expect(matchTagQuery('bridesmaid', TAGS)).toEqual({ kind: 'exact', tag: 'Bridesmaid' });
    expect(matchTagQuery('FAMILY', TAGS)).toEqual({ kind: 'exact', tag: 'Family' });
  });

  it('loose-matches a plural query to the singular tag', () => {
    expect(matchTagQuery('bridesmaids', TAGS)).toEqual({ kind: 'loose', tag: 'Bridesmaid' });
    expect(matchTagQuery('Groomsmen', TAGS)).toEqual({ kind: 'none', candidates: [] }); // irregular plural stays unmatched
  });

  it('loose-matches through punctuation differences', () => {
    expect(matchTagQuery('brides fam', TAGS)).toEqual({ kind: 'loose', tag: "Bride's Fam" });
  });

  it('reports ambiguity instead of guessing', () => {
    const res = matchTagQuery('fam', TAGS);
    expect(res.kind).toBe('ambiguous');
    if (res.kind === 'ambiguous') {
      expect(res.candidates).toEqual(expect.arrayContaining(["Bride's Fam", 'Family', 'Family2']));
    }
  });

  it('exact match wins even when loose candidates exist', () => {
    expect(matchTagQuery('family', TAGS)).toEqual({ kind: 'exact', tag: 'Family' });
  });

  it('returns none for a tag with no relation to the inventory', () => {
    expect(matchTagQuery('photographer', TAGS)).toEqual({ kind: 'none', candidates: [] });
  });

  it('returns none for empty or punctuation-only queries', () => {
    expect(matchTagQuery('', TAGS)).toEqual({ kind: 'none', candidates: [] });
    expect(matchTagQuery('  --  ', TAGS)).toEqual({ kind: 'none', candidates: [] });
  });

  it('handles an empty inventory', () => {
    expect(matchTagQuery('bridesmaid', [])).toEqual({ kind: 'none', candidates: [] });
  });
});
