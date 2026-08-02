import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Regression test for the preview ViewSwitcher (floating top-center button).
 *
 * Bug history: the section preview page (/preview/[slug]/[section]) hardcoded
 * isBypassPin={true} and never rendered PinEntry for the 'pin_entry' view,
 * so switching view modes from the floating button was a no-op there.
 *
 * These checks lock in the plumbing that makes every option work:
 *   - PinEntry is imported and rendered when previewView === 'pin_entry'
 *   - isBypassPin follows previewView (not hardcoded)
 *   - hasRSVPed / user props reflect the view
 *   - the SET_PREVIEW_MODE postMessage listener is wired
 */

const ROOT = resolve(__dirname, '..');

const MAIN_PREVIEW = resolve(ROOT, 'app/preview/[weddingSlug]/page.tsx');
const SECTION_PREVIEW = resolve(ROOT, 'app/preview/[weddingSlug]/[section]/page.tsx');

function loadSource(path: string): string {
  return readFileSync(path, 'utf8');
}

describe('Preview ViewSwitcher wiring', () => {
  describe.each([
    ['main preview', MAIN_PREVIEW],
    ['section preview', SECTION_PREVIEW],
  ])('%s', (_label, path) => {
    const src = loadSource(path);

    it('imports PinEntry', () => {
      expect(src).toMatch(/from ['"]@\/components\/guest\/PinEntry['"]/);
    });

    it('renders PinEntry when previewView === "pin_entry"', () => {
      expect(src).toMatch(/previewView === ['"]pin_entry['"]/);
      expect(src).toMatch(/<PinEntry[\s\S]*?isPreview=\{true\}/);
    });

    it('ties isBypassPin to previewView (never hardcoded to true)', () => {
      expect(src).toMatch(/isBypassPin=\{previewView === ['"]rsvp_submitted['"]\}/);
      expect(src).not.toMatch(/isBypassPin=\{true\}/);
    });

    it('ties hasRSVPed to previewView', () => {
      expect(src).toMatch(/hasRSVPed=\{previewView === ['"]rsvp_submitted['"]\}/);
    });

    it('clears user when previewView === "no_rsvp"', () => {
      expect(src).toMatch(/user=\{previewView === ['"]no_rsvp['"] \? null : /);
    });

    it('listens for SET_PREVIEW_MODE postMessage', () => {
      expect(src).toMatch(/SET_PREVIEW_MODE/);
      expect(src).toMatch(/setPreviewView\(event\.data\.mode\)/);
    });

    it('exposes all three view options in the menu', () => {
      expect(src).toMatch(/Pin Entry Screen/);
      expect(src).toMatch(/No RSVP Submitted/);
      expect(src).toMatch(/RSVP Submitted/);
    });
  });
});

describe('Preview view rendering decisions', () => {
  // Replicates the decision logic both preview pages use. If any branch
  // diverges, one of the source-level assertions above will also flag it.
  type View = 'pin_entry' | 'no_rsvp' | 'rsvp_submitted';

  function decide(previewView: View) {
    return {
      renderPinEntry: previewView === 'pin_entry',
      isBypassPin: previewView === 'rsvp_submitted',
      hasRSVPed: previewView === 'rsvp_submitted',
      user: previewView === 'no_rsvp' ? null : { id: 'preview-user' },
    };
  }

  it('pin_entry → render PinEntry, no bypass, no user RSVP', () => {
    const d = decide('pin_entry');
    expect(d.renderPinEntry).toBe(true);
    expect(d.isBypassPin).toBe(false);
    expect(d.hasRSVPed).toBe(false);
  });

  it('no_rsvp → no PinEntry, no bypass, user cleared', () => {
    const d = decide('no_rsvp');
    expect(d.renderPinEntry).toBe(false);
    expect(d.isBypassPin).toBe(false);
    expect(d.user).toBeNull();
  });

  it('rsvp_submitted → no PinEntry, bypass + hasRSVPed true', () => {
    const d = decide('rsvp_submitted');
    expect(d.renderPinEntry).toBe(false);
    expect(d.isBypassPin).toBe(true);
    expect(d.hasRSVPed).toBe(true);
    expect(d.user).toMatchObject({ id: 'preview-user' });
  });
});
