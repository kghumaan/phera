/**
 * Legacy SX-prop constants.
 *
 * New code should prefer `components/shared/*` primitives (Alert, TextField,
 * Button, etc.) over these raw SX objects. Values here now resolve through
 * `@/lib/theme/tokens` so the source of truth is unified.
 */

import { COLORS, RADII } from '@/lib/theme/tokens';

/**
 * Enhanced TextField styling for admin onboarding forms.
 */
export const ENHANCED_TEXT_FIELD_SX = {
  mt: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.md,
    bgcolor: COLORS.bg.white,
    fontSize: { xs: '0.875rem', md: '0.925rem', lg: '0.975rem' },
    '& input': {
      py: { xs: 1.5, md: 1.75, lg: 2 },
      fontSize: { xs: '0.875rem', md: '0.925rem', lg: '0.975rem' },
    },
    '& textarea': {
      fontSize: { xs: '0.875rem', md: '0.925rem', lg: '0.975rem' },
    },
    '& .MuiSelect-select': {
      py: { xs: 1.5, md: 1.75, lg: 2 },
      fontSize: { xs: '0.875rem', md: '0.925rem', lg: '0.975rem' },
    },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
      color: COLORS.text.subtle,
    },
    '& fieldset': {
      borderColor: COLORS.border.strong,
    },
    '&:hover fieldset': {
      borderColor: COLORS.brand.primary,
    },
    '&.Mui-focused fieldset': {
      borderColor: COLORS.brand.primary,
      borderWidth: '2px',
    },
    '&.Mui-disabled': {
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      '& fieldset': {
        borderColor: COLORS.border.default,
      },
    },
  },
  '& .MuiInputLabel-root': {
    color: COLORS.text.muted,
    fontSize: { xs: '0.95rem', md: '1rem', lg: '1.05rem' },
    fontWeight: 500,
    lineHeight: 1.5,
    transform: 'translate(14px, 14px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
    },
    '&.Mui-disabled': {
      color: COLORS.text.subtle,
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: COLORS.brand.primary,
    fontWeight: 600,
  },
  '& .MuiInputBase-input': {
    color: COLORS.text.strong,
    '&.Mui-disabled': {
      WebkitTextFillColor: COLORS.text.muted,
      color: COLORS.text.muted,
    },
    '&:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 100px white inset',
      WebkitTextFillColor: COLORS.text.strong,
      caretColor: COLORS.text.strong,
      borderRadius: 'inherit',
    },
  },
  '& .MuiFormHelperText-root': {
    color: COLORS.text.subtle,
    fontSize: { xs: '0.875rem', md: '0.9rem', lg: '0.95rem' },
  },
};

/**
 * Enhanced Paper styling for form containers
 */
export const ENHANCED_PAPER_SX = {
  p: { xs: 4, md: 6 },
  borderRadius: RADII.dialog,
  bgcolor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
};

export const ENHANCED_SECTION_SPACING = 3;
export const ADMIN_PAGE_MAX_WIDTH = 1000;
export const ADMIN_INNER_SPACING = 2.5;

export const ADMIN_SECTION_HEADING_SX = {
  fontWeight: 600,
  color: COLORS.text.strong,
  fontSize: '1rem',
};

export const ADMIN_PAGE_HEADING_SX = {
  fontWeight: 600,
  color: COLORS.text.strong,
  mb: 0.5,
};

export const ENHANCED_CONTAINER_MAX_WIDTH = 'xl' as const;

/**
 * Primary button styling.
 */
export const PRIMARY_BUTTON_SX = {
  bgcolor: COLORS.brand.primary,
  color: COLORS.text.inverse,
  borderRadius: RADII.md,
  textTransform: 'none' as const,
  fontWeight: 600,
  '&:hover': {
    bgcolor: COLORS.brand.primaryHover,
  },
};

/**
 * Secondary button styling.
 */
export const SECONDARY_BUTTON_SX = {
  bgcolor: COLORS.bg.white,
  color: COLORS.text.strong,
  borderColor: COLORS.text.strong,
  borderRadius: RADII.md,
  textTransform: 'none' as const,
  fontWeight: 600,
  '&:hover': {
    bgcolor: 'rgba(0, 0, 0, 0.04)',
    borderColor: COLORS.text.strong,
  },
};

/**
 * Guest-facing TextField styling for RSVP and other guest forms.
 */
export const guestTextFieldSx = (themeColor: string = COLORS.brand.primary) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: { xs: '8px', md: '10px' },
    backgroundColor: COLORS.bg.white,
    fontSize: { xs: '1rem', md: '1.125rem' },
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.4)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.4)',
    },
    '&.Mui-focused fieldset': {
      borderColor: themeColor,
      borderWidth: '2px',
    },
    '& input': {
      color: '#000',
      py: { xs: 1.5, md: 1.75 },
    },
    '& textarea': {
      color: '#000',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#888888',
    fontSize: { xs: '1rem', md: '1.125rem' },
    transform: 'translate(14px, 12px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
      fontSize: '1rem',
    },
    '&.Mui-focused': {
      color: themeColor,
    },
  },
  '& .MuiFormHelperText-root': {
    fontSize: '0.875rem',
  },
});
