import { describe, it, expect } from 'vitest';
import { matchGuestsByName, normalize, tokens } from '@/lib/access/name-match';

const guests = [
  { id: 'a', name: 'Simran Savani', logistics_data: { party_size: 1 } },
  { id: 'b', name: 'KV Ghumaan Simran', logistics_data: { party_size: 2 } },
  { id: 'c', name: 'Priya Patel', logistics_data: { plus_one_name: 'Rahul Sharma', party_size: 2 } },
  { id: 'd', name: 'José González', logistics_data: null },
];

describe('normalize + tokens', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalize('José González')).toBe('jose gonzalez');
  });

  it('folds punctuation to spaces and collapses whitespace', () => {
    expect(normalize("O'Brien,  Jr.")).toBe('o brien jr');
  });

  it('tokens splits on spaces and drops empties', () => {
    expect(tokens('  hello  world  ')).toEqual(['hello', 'world']);
  });
});

describe('matchGuestsByName', () => {
  it('returns [] for an empty query', () => {
    expect(matchGuestsByName('', guests)).toEqual([]);
    expect(matchGuestsByName('   ', guests)).toEqual([]);
  });

  it('matches first-name prefix', () => {
    const result = matchGuestsByName('simr', guests);
    const ids = result.map(r => r.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('matches last-name prefix', () => {
    const result = matchGuestsByName('pat', guests);
    expect(result.map(r => r.id)).toEqual(['c']);
  });

  it('matches plus-one name', () => {
    const result = matchGuestsByName('rahul', guests);
    expect(result.map(r => r.id)).toEqual(['c']);
  });

  it('matches after diacritic folding', () => {
    const result = matchGuestsByName('jose', guests);
    expect(result.map(r => r.id)).toEqual(['d']);
  });

  it('narrows to strict matches when both tokens hit', () => {
    // "simran savani" strictly matches only guest a;
    // loose match for "simran" alone would also hit b.
    const result = matchGuestsByName('simran savani', guests);
    expect(result.map(r => r.id)).toEqual(['a']);
  });

  it('falls back to loose matches when no candidate hits every token', () => {
    const result = matchGuestsByName('simran nonexistent', guests);
    const ids = result.map(r => r.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('defaults partySize to 1 when missing', () => {
    const result = matchGuestsByName('gonz', guests);
    expect(result[0]?.partySize).toBe(1);
  });

  it('passes through plusOneName when present', () => {
    const [match] = matchGuestsByName('priya', guests);
    expect(match.plusOneName).toBe('Rahul Sharma');
  });
});
