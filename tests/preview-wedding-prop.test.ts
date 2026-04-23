import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Regression test for frame/design fields being dropped when callers build a
 * whitelisted `wedding` prop for <VerticalScrollLayout>.
 *
 * Bug history: frame changes from Look & Feel updated mobile preview but not
 * the desktop VerticalScrollLayout because the caller's object literal omitted
 * `frame_image_url`. This test locks in every field that VerticalScrollLayout
 * actually reads off `wedding` so the next drop gets caught at CI time.
 */

const ROOT = resolve(__dirname, '..');

const COMPONENT = resolve(ROOT, 'components/guest/VerticalScrollLayout.tsx');

const CALLERS = [
  'app/preview/[weddingSlug]/page.tsx',
  'app/preview/[weddingSlug]/[section]/page.tsx',
  'app/(guest)/[weddingSlug]/page.tsx',
];

function extractRequiredFields(source: string): string[] {
  const usage = new Set<string>();
  const regex = /\bwedding\.([a-z_][a-z0-9_]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(source)) !== null) {
    const field = m[1];
    if (field === 'id' || field === 'slug') continue;
    usage.add(field);
  }
  return [...usage];
}

function firstWeddingLiteral(source: string): string {
  const idx = source.indexOf('wedding={{');
  if (idx === -1) return '';
  let depth = 0;
  let start = -1;
  for (let i = idx; i < source.length; i++) {
    const c = source[i];
    if (c === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return '';
}

describe('VerticalScrollLayout wedding prop forwarding', () => {
  const componentSource = readFileSync(COMPONENT, 'utf8');
  const requiredFields = extractRequiredFields(componentSource);

  it('discovers fields that VerticalScrollLayout reads off wedding', () => {
    expect(requiredFields).toContain('frame_image_url');
    expect(requiredFields).toContain('couple_name');
    expect(requiredFields).toContain('primary_color');
  });

  for (const caller of CALLERS) {
    it(`${caller} forwards every wedding field VerticalScrollLayout reads`, () => {
      const src = readFileSync(resolve(ROOT, caller), 'utf8');
      const literal = firstWeddingLiteral(src);
      expect(literal, `no wedding={{...}} literal found in ${caller}`).not.toBe('');

      const missing = requiredFields.filter((f) => !new RegExp(`\\b${f}\\s*:`).test(literal));
      expect(missing, `${caller} drops fields: ${missing.join(', ')}`).toEqual([]);
    });
  }
});
