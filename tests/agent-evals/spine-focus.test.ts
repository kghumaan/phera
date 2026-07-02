/**
 * DETERMINISTIC (CI) — the Working-on bar's progression logic
 * (lib/agent/spine.ts): forward walk, skip = defer-and-resurface, no
 * bounce-back of the just-skipped step, wrap-around for out-of-order work,
 * and completion detection.
 */
import { describe, it, expect } from 'vitest';
import {
  SPINE_STEP_KEYS,
  nextSpineStep,
  spineComplete,
  spineStepLabel,
} from '@/lib/agent/spine';

describe('spine order', () => {
  it('matches the decided order (PLANNER-SPINE-TRACKER E1)', () => {
    expect(SPINE_STEP_KEYS).toEqual([
      'schedule',
      'travel',
      'website',
      'guest-list',
      'rsvps',
      'rooms',
      'vendors',
      'registry',
      'photos',
    ]);
  });

  it('labels resolve for every step', () => {
    for (const key of SPINE_STEP_KEYS) {
      expect(spineStepLabel(key)).toBeTruthy();
    }
    expect(spineStepLabel('nope')).toBeNull();
    expect(spineStepLabel(null)).toBeNull();
  });
});

describe('nextSpineStep', () => {
  it('advances to the immediate next step', () => {
    expect(nextSpineStep('schedule', ['schedule'], [])).toBe('travel');
    expect(nextSpineStep('travel', ['schedule', 'travel'], [])).toBe('website');
  });

  it('skipped steps are jumped over mid-spine', () => {
    // travel was skipped earlier; finishing website goes to guest-list, not back to travel
    expect(nextSpineStep('website', ['schedule', 'website'], ['travel'])).toBe('guest-list');
  });

  it('skipped steps resurface once the rest of the chain is exhausted', () => {
    const done = SPINE_STEP_KEYS.filter((k) => k !== 'travel');
    expect(nextSpineStep('photos', done, ['travel'])).toBe('travel');
  });

  it('the just-skipped step never bounces straight back', () => {
    const done = SPINE_STEP_KEYS.filter((k) => k !== 'photos');
    // photos is skipped as the LAST remaining step → complete, not photos again
    expect(nextSpineStep('photos', done, ['photos'])).toBeNull();
  });

  it('wraps around for out-of-order work', () => {
    // They did rooms early with nothing else done → next is vendors, and
    // finishing photos wraps back to the untouched start of the chain.
    expect(nextSpineStep('rooms', ['rooms'], [])).toBe('vendors');
    expect(nextSpineStep('photos', ['rooms', 'vendors', 'registry', 'photos'], [])).toBe('schedule');
  });

  it('returns null when everything is done', () => {
    expect(nextSpineStep('photos', [...SPINE_STEP_KEYS], [])).toBeNull();
  });
});

describe('spineComplete', () => {
  it('true when every step is done or skipped and nothing is active', () => {
    expect(spineComplete({ step: null, done: [...SPINE_STEP_KEYS], skipped: [] })).toBe(true);
    expect(
      spineComplete({
        step: null,
        done: SPINE_STEP_KEYS.filter((k) => k !== 'photos'),
        skipped: ['photos'],
      })
    ).toBe(true);
  });

  it('false while a step is active or missing', () => {
    expect(spineComplete({ step: 'rsvps', done: [], skipped: [] })).toBe(false);
    expect(spineComplete({ step: null, done: ['schedule'], skipped: [] })).toBe(false);
  });
});
