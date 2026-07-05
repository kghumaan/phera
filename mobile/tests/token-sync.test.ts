import { describe, expect, it } from 'vitest';

// Web tokens are the source of truth (lib/theme/tokens.ts at repo root).
// The mobile port must never drift on color values — this test fails the
// moment someone edits one file without the other.
import {
  COLORS as WEB_COLORS,
  PALETTE as WEB_PALETTE,
  RADII as WEB_RADII,
} from '../../lib/theme/tokens';
import {
  COLORS as MOBILE_COLORS,
  PALETTE as MOBILE_PALETTE,
  RADII as MOBILE_RADII,
} from '../src/lib/theme/tokens';

// Groups the mobile app mirrors. Web-only palettes (whatsapp, vendorCategory,
// social) are intentionally absent until a mobile screen needs them.
const MIRRORED_GROUPS = ['brand', 'text', 'bg', 'border', 'accent', 'cultural', 'side'] as const;

describe('mobile design tokens stay in sync with web', () => {
  it('PALETTE matches web exactly', () => {
    expect(MOBILE_PALETTE).toEqual(WEB_PALETTE);
  });

  it.each(MIRRORED_GROUPS)('COLORS.%s matches web exactly', (group) => {
    expect(MOBILE_COLORS[group]).toEqual(WEB_COLORS[group]);
  });

  it('RADII values match web (numbers vs px strings)', () => {
    for (const [key, webValue] of Object.entries(WEB_RADII)) {
      const mobileValue = MOBILE_RADII[key as keyof typeof MOBILE_RADII];
      expect(`${mobileValue}px`, `RADII.${key}`).toBe(webValue);
    }
  });
});
