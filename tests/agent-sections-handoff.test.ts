import { describe, it, expect } from 'vitest';
import { SECTIONS, isSectionKey, publicSiteUrl } from '@/lib/agent/sections';
import { parseCoupleNames } from '@/lib/agent/couple-names';
import { sectionAskedFor } from '@/lib/agent/tools/handoff';
import type { SectionMetrics } from '@/lib/agent/sections';

const base: SectionMetrics = {
  guests: 0,
  taggedGuests: 0,
  rooms: 0,
  assignedGuests: 0,
  events: 0,
  faqs: 0,
  detailsComplete: false,
  published: false,
};

// The loop's safety net: if the model answers one of these asks and forgets to
// render the button, the loop opens the section anyway. That only works if we
// can tell "do this area for me" apart from a passing mention or a one-field fix.
describe('sectionAskedFor — what counts as needing the door opened', () => {
  it('catches the asks that must always end in a button', () => {
    expect(sectionAskedFor('Build a website for my wedding')).toBe('website');
    expect(sectionAskedFor('The website is the only thing I care about right now. Sort it.')).toBe('website');
    expect(sectionAskedFor('Help me with our guest list and tag everyone by side')).toBe('guest-list');
    expect(sectionAskedFor('I want to put everyone into their hotel rooms now')).toBe('rooms');
  });

  it('stays out of the way of one-field fixes and questions', () => {
    // These the agent answers in chat — throwing a section button at someone who
    // asked to change a date would be noise.
    expect(sectionAskedFor('Change the venue on our website to Rambagh Palace')).toBeNull();
    expect(sectionAskedFor('What does our website say about parking?')).toBeNull();
    expect(sectionAskedFor('How many guests have RSVP’d?')).toBeNull();
    expect(sectionAskedFor('Send the invite over WhatsApp')).toBeNull();
  });
});

describe('rich-section handoff detection', () => {
  it('sees what they actually did in the guest list', () => {
    // The whole point of stamping a baseline: come back and NAME the work,
    // rather than asking "did you finish?" forever.
    const progress = SECTIONS['guest-list'].progress(base, {
      ...base,
      guests: 214,
      taggedGuests: 96,
    });
    expect(progress).toBe('214 guests added, 96 guests tagged');
  });

  it('reports nothing when they did not touch the section', () => {
    expect(SECTIONS['guest-list'].progress(base, { ...base })).toBeNull();
    expect(SECTIONS.rooms.progress(base, { ...base })).toBeNull();
  });

  it('does not count work that was already there before the handoff', () => {
    const before = { ...base, guests: 214, taggedGuests: 96 };
    expect(SECTIONS['guest-list'].progress(before, before)).toBeNull();
  });

  it('sees rooms filled and guests placed', () => {
    expect(SECTIONS.rooms.progress(base, { ...base, rooms: 84, assignedGuests: 178 })).toBe(
      '84 rooms added, 178 guests placed'
    );
  });

  it('sees the website details get filled in, and the site go live', () => {
    expect(
      SECTIONS.website.progress(base, { ...base, detailsComplete: true, events: 3, published: true })
    ).toBe('the core details are filled in, 3 events added, the site is now LIVE');
  });

  it('knows when each section looks done', () => {
    expect(SECTIONS.website.looksDone({ ...base, detailsComplete: true })).toBe(true);
    expect(SECTIONS.website.looksDone(base)).toBe(false);
    expect(SECTIONS['guest-list'].looksDone({ ...base, guests: 1 })).toBe(true);
    // Rooms with no one in them is not "done" — the placing IS the work.
    expect(SECTIONS.rooms.looksDone({ ...base, rooms: 84, assignedGuests: 0 })).toBe(false);
    expect(SECTIONS.rooms.looksDone({ ...base, rooms: 84, assignedGuests: 1 })).toBe(true);
  });

  it('singularises properly (a receipt that reads like a person wrote it)', () => {
    expect(SECTIONS['guest-list'].progress(base, { ...base, guests: 1 })).toBe('1 guest added');
    expect(SECTIONS.rooms.progress(base, { ...base, rooms: 1, assignedGuests: 1 })).toBe(
      '1 room added, 1 guest placed'
    );
  });

  it('points each section at its real page', () => {
    expect(SECTIONS.website.path('priya-rahul-2027')).toBe('/admin/priya-rahul-2027/details');
    expect(SECTIONS['guest-list'].path('priya-rahul-2027')).toBe('/admin/priya-rahul-2027/guest-list');
    expect(SECTIONS.rooms.path('priya-rahul-2027')).toBe('/admin/priya-rahul-2027/room-assignments');
  });

  it('guards the section key', () => {
    expect(isSectionKey('rooms')).toBe(true);
    expect(isSectionKey('schedule')).toBe(false);
    expect(isSectionKey(undefined)).toBe(false);
  });

  it('builds the public site url guests will open', () => {
    expect(publicSiteUrl('priya-rahul-2027')).toBe('https://phera.io/priya-rahul-2027');
  });
});

describe('couple names are parsed, not guessed', () => {
  // Production UAT: the agent said "Lovely to meet you, Kavya & Aditya!" and the
  // row still read "Your Wedding". This write is now mechanical.
  it.each([
    ['Priya & Rahul', 'Priya', 'Rahul'],
    ['Priya and Rahul', 'Priya', 'Rahul'],
    ['Priya, Rahul', 'Priya', 'Rahul'],
    ['Kavya + Aditya', 'Kavya', 'Aditya'],
  ])('splits %s', (raw, p1, p2) => {
    const names = parseCoupleNames(raw);
    expect(names.couple_name).toBe(raw);
    expect(names.partner1_name).toBe(p1);
    expect(names.partner2_name).toBe(p2);
  });

  it('keeps a single name usable rather than dropping it', () => {
    const names = parseCoupleNames('Priya');
    expect(names.partner1_name).toBe('Priya');
    expect(names.partner2_name).toBe('');
  });

  it('collapses stray whitespace', () => {
    expect(parseCoupleNames('  Priya   &   Rahul  ').couple_name).toBe('Priya & Rahul');
  });
});
