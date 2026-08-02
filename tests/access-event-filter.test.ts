import { describe, it, expect } from 'vitest';
import { computeInvitedEventIds } from '@/lib/access/event-filter';

describe('computeInvitedEventIds — default-true contract', () => {
  const allEventIds = ['haldi', 'vows', 'reception'];

  it('returns all events when the guest has no access rows', () => {
    expect(computeInvitedEventIds(allEventIds, [])).toEqual(['haldi', 'vows', 'reception']);
  });

  it('excludes only events explicitly marked invited=false', () => {
    const rows = [
      { event_id: 'haldi', invited: false },
      { event_id: 'vows', invited: true }, // redundant but should not remove
    ];
    expect(computeInvitedEventIds(allEventIds, rows)).toEqual(['vows', 'reception']);
  });

  it('treats missing rows as invited', () => {
    const rows = [{ event_id: 'reception', invited: false }];
    expect(computeInvitedEventIds(allEventIds, rows)).toEqual(['haldi', 'vows']);
  });

  it('is stable when the same event appears multiple times in rows', () => {
    const rows = [
      { event_id: 'haldi', invited: false },
      { event_id: 'haldi', invited: false },
    ];
    expect(computeInvitedEventIds(allEventIds, rows)).toEqual(['vows', 'reception']);
  });

  it('keeps the input ordering of allEventIds', () => {
    const input = ['b', 'a', 'c'];
    expect(computeInvitedEventIds(input, [])).toEqual(['b', 'a', 'c']);
  });
});
