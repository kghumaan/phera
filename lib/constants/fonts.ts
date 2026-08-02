export interface CoupleNameFont {
  id: string;
  name: string;
  cssVar: string;
  fontStyle?: string;
}

export const COUPLE_NAME_FONTS: CoupleNameFont[] = [
  { id: 'instrument-serif', name: 'Instrument Serif', cssVar: 'var(--font-instrument-serif)', fontStyle: 'italic' },
  { id: 'ballet', name: 'Ballet', cssVar: 'var(--font-ballet)' },
  { id: 'tenor-sans', name: 'Tenor Sans', cssVar: 'var(--font-tenor-sans)' },
  { id: 'petit-formal-script', name: 'Petit Formal Script', cssVar: 'var(--font-petit-formal-script)' },
  { id: 'forum', name: 'Forum', cssVar: 'var(--font-forum)' },
  { id: 'cormorant', name: 'Cormorant Semi Bold', cssVar: 'var(--font-cormorant)' },
];

export const DEFAULT_COUPLE_FONT_ID = 'instrument-serif';

export function getCoupleFont(fontId: string | null | undefined): CoupleNameFont {
  return COUPLE_NAME_FONTS.find(f => f.id === fontId) || COUPLE_NAME_FONTS[0];
}
