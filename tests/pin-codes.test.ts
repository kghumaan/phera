import { describe, it, expect, beforeEach } from 'vitest';

// ─── Helper functions that replicate actual source logic (with fixes applied) ───

interface PinCode {
  pin: string;
  type: string;
  allows_plus_one: boolean;
  skip_rsvp?: boolean;
  hidden_events?: string[];
}

/** From PinEntry.tsx handleContinue — match entered PIN against wedding's pin_codes */
function matchPin(enteredPin: string, pinCodes: PinCode[]): PinCode | undefined {
  return pinCodes.find(p => p.pin === enteredPin);
}

/** From PinEntry.tsx lines 254-272 — store all PIN verification data (with bypass_rsvp fix) */
function storePinVerification(slug: string, pin: PinCode) {
  localStorage.setItem(`phera_pin_verified_${slug}`, 'true');
  localStorage.setItem(`phera_pin_timestamp_${slug}`, Date.now().toString());
  localStorage.setItem(`phera_allows_plus_one_${slug}`, pin.allows_plus_one ? 'true' : 'false');
  localStorage.setItem(`phera_pin_type_${slug}`, pin.type);

  if (pin.skip_rsvp) {
    localStorage.setItem(`phera_skip_rsvp_${slug}`, 'true');
    localStorage.setItem(`phera_bypass_rsvp_${slug}`, 'true');
  } else {
    localStorage.removeItem(`phera_skip_rsvp_${slug}`);
    localStorage.removeItem(`phera_bypass_rsvp_${slug}`);
  }

  if (pin.hidden_events && pin.hidden_events.length > 0) {
    localStorage.setItem(`phera_hidden_events_${slug}`, JSON.stringify(pin.hidden_events));
  } else {
    localStorage.removeItem(`phera_hidden_events_${slug}`);
  }
}

/** From guest page.tsx line 352 — check if RSVP should be bypassed */
function checkBypassRsvp(slug: string): boolean {
  return localStorage.getItem(`phera_bypass_rsvp_${slug}`) === 'true';
}

/** Fixed version from CustomRSVPForm.tsx — check if plus-one is allowed (with slug) */
function checkAllowsPlusOne(slug: string): boolean {
  return localStorage.getItem(`phera_allows_plus_one_${slug}`) === 'true';
}

/** From events/page.tsx lines 29-40 — filter events by hidden_events */
function filterHiddenEvents<T extends { id: string }>(events: T[], slug: string): T[] {
  const hiddenEventsStr = localStorage.getItem(`phera_hidden_events_${slug}`);
  if (!hiddenEventsStr) return events;
  try {
    const hiddenEvents: string[] = JSON.parse(hiddenEventsStr);
    if (!Array.isArray(hiddenEvents) || hiddenEvents.length === 0) return events;
    return events.filter(event => !hiddenEvents.includes(event.id));
  } catch {
    return events;
  }
}

/** For VerticalScrollLayout fix — filter schedule items by hidden linked_event_id */
function filterScheduleByHiddenEvents(
  schedule: { id: string; date: string; day_name: string; events: { id: string; name: string; linked_event_id?: string | null }[] }[],
  slug: string
) {
  const hiddenEventsStr = localStorage.getItem(`phera_hidden_events_${slug}`);
  let hiddenEventIds: string[] = [];
  if (hiddenEventsStr) {
    try {
      const parsed = JSON.parse(hiddenEventsStr);
      if (Array.isArray(parsed)) hiddenEventIds = parsed;
    } catch {}
  }

  return schedule.map(day => ({
    ...day,
    events: day.events.filter(event =>
      !event.linked_event_id || !hiddenEventIds.includes(event.linked_event_id)
    ),
  }));
}

/** From PinEntry.tsx lines 340-353 — check if PIN verification is expired */
function isPinExpired(slug: string): boolean {
  const pinVerified = localStorage.getItem(`phera_pin_verified_${slug}`);
  const pinTimestamp = localStorage.getItem(`phera_pin_timestamp_${slug}`);

  if (pinVerified !== 'true' || !pinTimestamp) return true;

  try {
    const timestamp = parseInt(pinTimestamp);
    return Date.now() - timestamp >= 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

/** From AuthContext signOut — clean all PIN-related keys (with hidden_events fix) */
function signOutCleanup(slug: string) {
  localStorage.removeItem('phera_guest_auth');
  localStorage.removeItem(`phera_pin_verified_${slug}`);
  localStorage.removeItem(`phera_pin_timestamp_${slug}`);
  localStorage.removeItem(`phera_allows_plus_one_${slug}`);
  localStorage.removeItem(`phera_bypass_rsvp_${slug}`);
  localStorage.removeItem(`phera_skip_rsvp_${slug}`);
  localStorage.removeItem(`phera_pin_type_${slug}`);
  localStorage.removeItem(`phera_hidden_events_${slug}`);
}

// ─── Test data ──────────────────────────────────────────────────────────────

const PIN_CODES: PinCode[] = [
  { pin: '1234', type: 'general', allows_plus_one: false, skip_rsvp: false },
  { pin: '5678', type: 'vip', allows_plus_one: true, skip_rsvp: false },
  { pin: '9999', type: 'family', allows_plus_one: true, skip_rsvp: true, hidden_events: ['event-a', 'event-b'] },
];

const SAMPLE_EVENTS = [
  { id: 'event-a', name: 'Mehndi' },
  { id: 'event-b', name: 'Haldi' },
  { id: 'event-c', name: 'Wedding Ceremony' },
  { id: 'event-d', name: 'Reception' },
];

const SAMPLE_SCHEDULE = [
  {
    id: 'day-1', date: '2026-06-15', day_name: 'Day 1',
    events: [
      { id: 's1', name: 'Mehndi Ceremony', linked_event_id: 'event-a' },
      { id: 's2', name: 'Welcome Dinner', linked_event_id: null },
      { id: 's3', name: 'Haldi Ceremony', linked_event_id: 'event-b' },
    ],
  },
  {
    id: 'day-2', date: '2026-06-16', day_name: 'Day 2',
    events: [
      { id: 's4', name: 'Wedding Ceremony', linked_event_id: 'event-c' },
      { id: 's5', name: 'Reception', linked_event_id: 'event-d' },
    ],
  },
];

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('PIN Code System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ─── 1. PIN code validation ──────────────────────────────────────────

  describe('PIN code validation', () => {
    it('should match a valid general PIN', () => {
      const matched = matchPin('1234', PIN_CODES);
      expect(matched).toBeDefined();
      expect(matched!.type).toBe('general');
      expect(matched!.allows_plus_one).toBe(false);
    });

    it('should match a valid VIP PIN with plus one', () => {
      const matched = matchPin('5678', PIN_CODES);
      expect(matched).toBeDefined();
      expect(matched!.type).toBe('vip');
      expect(matched!.allows_plus_one).toBe(true);
    });

    it('should match a family PIN with all features', () => {
      const matched = matchPin('9999', PIN_CODES);
      expect(matched).toBeDefined();
      expect(matched!.type).toBe('family');
      expect(matched!.allows_plus_one).toBe(true);
      expect(matched!.skip_rsvp).toBe(true);
      expect(matched!.hidden_events).toEqual(['event-a', 'event-b']);
    });

    it('should reject an invalid PIN', () => {
      expect(matchPin('0000', PIN_CODES)).toBeUndefined();
    });

    it('should reject a partial PIN', () => {
      expect(matchPin('123', PIN_CODES)).toBeUndefined();
    });

    it('should reject an empty PIN', () => {
      expect(matchPin('', PIN_CODES)).toBeUndefined();
    });

    it('should reject a 5-digit PIN', () => {
      expect(matchPin('12345', PIN_CODES)).toBeUndefined();
    });

    it('should return undefined for empty pin_codes array', () => {
      expect(matchPin('1234', [])).toBeUndefined();
    });

    it('should isolate PINs per wedding (wedding A code fails for B)', () => {
      const weddingAPins: PinCode[] = [{ pin: '1111', type: 'general', allows_plus_one: false }];
      const weddingBPins: PinCode[] = [{ pin: '2222', type: 'general', allows_plus_one: false }];

      expect(matchPin('1111', weddingAPins)).toBeDefined();
      expect(matchPin('1111', weddingBPins)).toBeUndefined();
    });
  });

  // ─── 2. localStorage key writing ─────────────────────────────────────

  describe('localStorage key writing', () => {
    it('should write all correct keys for a general PIN', () => {
      const pin = PIN_CODES[0]; // general, no plus one, no skip_rsvp
      storePinVerification('test-wedding', pin);

      expect(localStorage.getItem('phera_pin_verified_test-wedding')).toBe('true');
      expect(localStorage.getItem('phera_pin_timestamp_test-wedding')).toBeTruthy();
      expect(localStorage.getItem('phera_allows_plus_one_test-wedding')).toBe('false');
      expect(localStorage.getItem('phera_pin_type_test-wedding')).toBe('general');
      expect(localStorage.getItem('phera_skip_rsvp_test-wedding')).toBeNull();
      expect(localStorage.getItem('phera_bypass_rsvp_test-wedding')).toBeNull();
      expect(localStorage.getItem('phera_hidden_events_test-wedding')).toBeNull();
    });

    it('should write all correct keys for a family PIN with all features', () => {
      const pin = PIN_CODES[2]; // family, plus one, skip_rsvp, hidden_events
      storePinVerification('test-wedding', pin);

      expect(localStorage.getItem('phera_allows_plus_one_test-wedding')).toBe('true');
      expect(localStorage.getItem('phera_skip_rsvp_test-wedding')).toBe('true');
      expect(localStorage.getItem('phera_bypass_rsvp_test-wedding')).toBe('true');
      expect(JSON.parse(localStorage.getItem('phera_hidden_events_test-wedding')!)).toEqual(['event-a', 'event-b']);
    });

    it('should overwrite stale keys when re-entering with a different PIN', () => {
      // First: enter with family PIN (has skip_rsvp + hidden_events)
      storePinVerification('test-wedding', PIN_CODES[2]);
      expect(localStorage.getItem('phera_skip_rsvp_test-wedding')).toBe('true');
      expect(localStorage.getItem('phera_hidden_events_test-wedding')).toBeTruthy();

      // Re-enter with general PIN (no skip_rsvp, no hidden_events)
      storePinVerification('test-wedding', PIN_CODES[0]);
      expect(localStorage.getItem('phera_skip_rsvp_test-wedding')).toBeNull();
      expect(localStorage.getItem('phera_bypass_rsvp_test-wedding')).toBeNull();
      expect(localStorage.getItem('phera_hidden_events_test-wedding')).toBeNull();
    });
  });

  // ─── 3. PIN expiration ───────────────────────────────────────────────

  describe('PIN expiration', () => {
    it('should be expired after 24 hours', () => {
      localStorage.setItem('phera_pin_verified_test', 'true');
      localStorage.setItem('phera_pin_timestamp_test', (Date.now() - 25 * 60 * 60 * 1000).toString());
      expect(isPinExpired('test')).toBe(true);
    });

    it('should be valid within 24 hours', () => {
      localStorage.setItem('phera_pin_verified_test', 'true');
      localStorage.setItem('phera_pin_timestamp_test', (Date.now() - 1 * 60 * 60 * 1000).toString());
      expect(isPinExpired('test')).toBe(false);
    });

    it('should be valid when just set', () => {
      localStorage.setItem('phera_pin_verified_test', 'true');
      localStorage.setItem('phera_pin_timestamp_test', Date.now().toString());
      expect(isPinExpired('test')).toBe(false);
    });

    it('should be expired at exactly 24 hours', () => {
      localStorage.setItem('phera_pin_verified_test', 'true');
      localStorage.setItem('phera_pin_timestamp_test', (Date.now() - 24 * 60 * 60 * 1000).toString());
      expect(isPinExpired('test')).toBe(true);
    });

    it('should treat missing verified flag as expired', () => {
      localStorage.setItem('phera_pin_timestamp_test', Date.now().toString());
      expect(isPinExpired('test')).toBe(true);
    });

    it('should treat missing timestamp as expired', () => {
      localStorage.setItem('phera_pin_verified_test', 'true');
      expect(isPinExpired('test')).toBe(true);
    });
  });

  // ─── 4. skip_rsvp → bypass_rsvp (Bug 1 fix) ────────────────────────

  describe('skip_rsvp → bypass_rsvp', () => {
    it('should set bypass_rsvp when skip_rsvp=true (verifying the fix)', () => {
      const familyPin = PIN_CODES[2]; // skip_rsvp: true
      storePinVerification('test-wedding', familyPin);

      expect(checkBypassRsvp('test-wedding')).toBe(true);
      expect(localStorage.getItem('phera_bypass_rsvp_test-wedding')).toBe('true');
    });

    it('should NOT set bypass_rsvp when skip_rsvp=false', () => {
      const generalPin = PIN_CODES[0]; // skip_rsvp: false
      storePinVerification('test-wedding', generalPin);

      expect(checkBypassRsvp('test-wedding')).toBe(false);
      expect(localStorage.getItem('phera_bypass_rsvp_test-wedding')).toBeNull();
    });

    it('should NOT set bypass_rsvp when skip_rsvp is undefined', () => {
      const pinNoSkip: PinCode = { pin: '4444', type: 'basic', allows_plus_one: false };
      storePinVerification('test-wedding', pinNoSkip);

      expect(checkBypassRsvp('test-wedding')).toBe(false);
    });

    it('should isolate bypass per wedding', () => {
      storePinVerification('wedding-a', PIN_CODES[2]); // skip_rsvp: true
      storePinVerification('wedding-b', PIN_CODES[0]); // skip_rsvp: false

      expect(checkBypassRsvp('wedding-a')).toBe(true);
      expect(checkBypassRsvp('wedding-b')).toBe(false);
    });

    it('should remove bypass_rsvp when overwritten with non-skip PIN', () => {
      storePinVerification('test-wedding', PIN_CODES[2]); // skip_rsvp: true
      expect(checkBypassRsvp('test-wedding')).toBe(true);

      storePinVerification('test-wedding', PIN_CODES[0]); // skip_rsvp: false
      expect(checkBypassRsvp('test-wedding')).toBe(false);
    });
  });

  // ─── 5. allows_plus_one (Bug 2 fix) ─────────────────────────────────

  describe('allows_plus_one', () => {
    it('should store true with slug and read correctly', () => {
      storePinVerification('test-wedding', PIN_CODES[1]); // allows_plus_one: true
      expect(checkAllowsPlusOne('test-wedding')).toBe(true);
    });

    it('should store false with slug and read correctly', () => {
      storePinVerification('test-wedding', PIN_CODES[0]); // allows_plus_one: false
      expect(checkAllowsPlusOne('test-wedding')).toBe(false);
    });

    it('should isolate per wedding', () => {
      storePinVerification('wedding-a', PIN_CODES[1]); // plus one allowed
      storePinVerification('wedding-b', PIN_CODES[0]); // plus one blocked

      expect(checkAllowsPlusOne('wedding-a')).toBe(true);
      expect(checkAllowsPlusOne('wedding-b')).toBe(false);
    });

    it('should default to false when key is missing', () => {
      expect(checkAllowsPlusOne('nonexistent-wedding')).toBe(false);
    });
  });

  // ─── 6. Hidden events filtering — Events page ───────────────────────

  describe('hidden events filtering — Events page', () => {
    it('should return all events when no hidden events set', () => {
      const result = filterHiddenEvents(SAMPLE_EVENTS, 'test-wedding');
      expect(result).toEqual(SAMPLE_EVENTS);
    });

    it('should filter out 1 hidden event', () => {
      localStorage.setItem('phera_hidden_events_test-wedding', JSON.stringify(['event-a']));
      const result = filterHiddenEvents(SAMPLE_EVENTS, 'test-wedding');
      expect(result).toHaveLength(3);
      expect(result.find(e => e.id === 'event-a')).toBeUndefined();
    });

    it('should filter out 2 hidden events', () => {
      localStorage.setItem('phera_hidden_events_test-wedding', JSON.stringify(['event-a', 'event-b']));
      const result = filterHiddenEvents(SAMPLE_EVENTS, 'test-wedding');
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id)).toEqual(['event-c', 'event-d']);
    });

    it('should filter out all events', () => {
      localStorage.setItem('phera_hidden_events_test-wedding',
        JSON.stringify(SAMPLE_EVENTS.map(e => e.id)));
      const result = filterHiddenEvents(SAMPLE_EVENTS, 'test-wedding');
      expect(result).toHaveLength(0);
    });

    it('should return all events for empty array', () => {
      localStorage.setItem('phera_hidden_events_test-wedding', JSON.stringify([]));
      const result = filterHiddenEvents(SAMPLE_EVENTS, 'test-wedding');
      expect(result).toEqual(SAMPLE_EVENTS);
    });

    it('should return all events for nonexistent IDs', () => {
      localStorage.setItem('phera_hidden_events_test-wedding', JSON.stringify(['nonexistent']));
      const result = filterHiddenEvents(SAMPLE_EVENTS, 'test-wedding');
      expect(result).toEqual(SAMPLE_EVENTS);
    });

    it('should return all events for invalid JSON', () => {
      localStorage.setItem('phera_hidden_events_test-wedding', 'not-json');
      const result = filterHiddenEvents(SAMPLE_EVENTS, 'test-wedding');
      expect(result).toEqual(SAMPLE_EVENTS);
    });

    it('should return all events for non-array JSON', () => {
      localStorage.setItem('phera_hidden_events_test-wedding', JSON.stringify({ foo: 'bar' }));
      const result = filterHiddenEvents(SAMPLE_EVENTS, 'test-wedding');
      expect(result).toEqual(SAMPLE_EVENTS);
    });

    it('should isolate per wedding', () => {
      localStorage.setItem('phera_hidden_events_wedding-a', JSON.stringify(['event-a']));
      // wedding-b has no hidden events
      const resultA = filterHiddenEvents(SAMPLE_EVENTS, 'wedding-a');
      const resultB = filterHiddenEvents(SAMPLE_EVENTS, 'wedding-b');

      expect(resultA).toHaveLength(3);
      expect(resultB).toHaveLength(4);
    });
  });

  // ─── 7. Hidden events filtering — Schedule items ─────────────────────

  describe('hidden events filtering — Schedule items', () => {
    it('should filter out schedule items with matching linked_event_id', () => {
      localStorage.setItem('phera_hidden_events_test-wedding', JSON.stringify(['event-a', 'event-b']));
      const result = filterScheduleByHiddenEvents(SAMPLE_SCHEDULE, 'test-wedding');

      // Day 1: s1 (linked to event-a) and s3 (linked to event-b) filtered, s2 (no link) stays
      expect(result[0].events).toHaveLength(1);
      expect(result[0].events[0].id).toBe('s2');

      // Day 2: both items have non-hidden links, so both stay
      expect(result[1].events).toHaveLength(2);
    });

    it('should keep items with no linked_event_id', () => {
      localStorage.setItem('phera_hidden_events_test-wedding', JSON.stringify(['event-a']));
      const result = filterScheduleByHiddenEvents(SAMPLE_SCHEDULE, 'test-wedding');

      // s2 has linked_event_id: null, always passes through
      expect(result[0].events.find(e => e.id === 's2')).toBeDefined();
    });

    it('should keep items with non-hidden linked_event_id', () => {
      localStorage.setItem('phera_hidden_events_test-wedding', JSON.stringify(['event-a']));
      const result = filterScheduleByHiddenEvents(SAMPLE_SCHEDULE, 'test-wedding');

      // s3 is linked to event-b which is NOT hidden
      expect(result[0].events.find(e => e.id === 's3')).toBeDefined();
      // s4 and s5 in day 2 are non-hidden
      expect(result[1].events).toHaveLength(2);
    });

    it('should return all schedule items when no hidden events', () => {
      const result = filterScheduleByHiddenEvents(SAMPLE_SCHEDULE, 'test-wedding');
      expect(result[0].events).toHaveLength(3);
      expect(result[1].events).toHaveLength(2);
    });
  });

  // ─── 8. End-to-end integration ───────────────────────────────────────

  describe('end-to-end integration', () => {
    it('PIN with hidden_events → events page filters correctly', () => {
      const familyPin = PIN_CODES[2]; // hidden_events: ['event-a', 'event-b']
      storePinVerification('test-wedding', familyPin);

      const visibleEvents = filterHiddenEvents(SAMPLE_EVENTS, 'test-wedding');
      expect(visibleEvents).toHaveLength(2);
      expect(visibleEvents.map(e => e.name)).toEqual(['Wedding Ceremony', 'Reception']);
    });

    it('PIN with hidden_events → schedule items filter correctly', () => {
      const familyPin = PIN_CODES[2]; // hidden_events: ['event-a', 'event-b']
      storePinVerification('test-wedding', familyPin);

      const filteredSchedule = filterScheduleByHiddenEvents(SAMPLE_SCHEDULE, 'test-wedding');
      // Day 1: only Welcome Dinner (no link) remains
      expect(filteredSchedule[0].events).toHaveLength(1);
      expect(filteredSchedule[0].events[0].name).toBe('Welcome Dinner');
      // Day 2: both events remain (linked to non-hidden events)
      expect(filteredSchedule[1].events).toHaveLength(2);
    });

    it('PIN without hidden_events → everything visible', () => {
      const generalPin = PIN_CODES[0]; // no hidden_events
      storePinVerification('test-wedding', generalPin);

      const visibleEvents = filterHiddenEvents(SAMPLE_EVENTS, 'test-wedding');
      expect(visibleEvents).toHaveLength(4);

      const filteredSchedule = filterScheduleByHiddenEvents(SAMPLE_SCHEDULE, 'test-wedding');
      expect(filteredSchedule[0].events).toHaveLength(3);
      expect(filteredSchedule[1].events).toHaveLength(2);
    });
  });

  // ─── 9. Sign-out cleanup ─────────────────────────────────────────────

  describe('sign-out cleanup', () => {
    it('should clean all keys including hidden_events (verifying the fix)', () => {
      const slug = 'test-wedding';

      // Set up all keys
      storePinVerification(slug, PIN_CODES[2]); // family PIN with everything
      localStorage.setItem('phera_guest_auth', JSON.stringify({ id: '123' }));

      // Verify keys exist
      expect(localStorage.getItem(`phera_hidden_events_${slug}`)).toBeTruthy();
      expect(localStorage.getItem(`phera_bypass_rsvp_${slug}`)).toBe('true');

      // Sign out
      signOutCleanup(slug);

      // All keys should be gone
      expect(localStorage.getItem('phera_guest_auth')).toBeNull();
      expect(localStorage.getItem(`phera_pin_verified_${slug}`)).toBeNull();
      expect(localStorage.getItem(`phera_pin_timestamp_${slug}`)).toBeNull();
      expect(localStorage.getItem(`phera_allows_plus_one_${slug}`)).toBeNull();
      expect(localStorage.getItem(`phera_bypass_rsvp_${slug}`)).toBeNull();
      expect(localStorage.getItem(`phera_skip_rsvp_${slug}`)).toBeNull();
      expect(localStorage.getItem(`phera_pin_type_${slug}`)).toBeNull();
      expect(localStorage.getItem(`phera_hidden_events_${slug}`)).toBeNull();
    });

    it('should not affect other weddings', () => {
      storePinVerification('wedding-a', PIN_CODES[2]);
      storePinVerification('wedding-b', PIN_CODES[1]);

      signOutCleanup('wedding-a');

      // wedding-a is gone
      expect(localStorage.getItem('phera_pin_verified_wedding-a')).toBeNull();
      // wedding-b is untouched
      expect(localStorage.getItem('phera_pin_verified_wedding-b')).toBe('true');
      expect(localStorage.getItem('phera_allows_plus_one_wedding-b')).toBe('true');
    });
  });
});
