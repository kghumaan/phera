/**
 * Enhanced TextField styling for admin onboarding forms
 * Provides consistent, larger, more readable form inputs across the platform
 */

export const ENHANCED_TEXT_FIELD_SX = {
  mt: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    bgcolor: 'white',
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
      color: '#666',
    },
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: '#DE3F5E',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#DE3F5E',
      borderWidth: '2px',
    },
    '&.Mui-disabled': {
      bgcolor: 'rgba(255, 255, 255, 0.8)',
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.15)',
      },
    },
  },
  '& .MuiInputLabel-root': {
    color: '#4a4a4a',
    fontSize: { xs: '0.95rem', md: '1rem', lg: '1.05rem' },
    fontWeight: 500,
    lineHeight: 1.5,
    // Center label vertically within the custom input padding
    transform: 'translate(14px, 14px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
    },
    '&.Mui-disabled': {
      color: '#6a6a6a',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#DE3F5E',
    fontWeight: 600,
  },
  '& .MuiInputBase-input': {
    color: '#1a1a1a',
    '&.Mui-disabled': {
      WebkitTextFillColor: '#4a4a4a',
      color: '#4a4a4a',
    },
    '&:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 100px white inset',
      WebkitTextFillColor: '#1a1a1a',
      caretColor: '#1a1a1a',
      borderRadius: 'inherit',
    },
  },
  '& .MuiFormHelperText-root': {
    color: '#6a6a6a',
    fontSize: { xs: '0.75rem', md: '0.8rem', lg: '0.85rem' },
  },
};

/**
 * Enhanced Paper styling for form containers
 * Use for main content sections in onboarding pages
 */
export const ENHANCED_PAPER_SX = {
  p: { xs: 4, md: 6 },
  borderRadius: '24px',
  bgcolor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
};

/**
 * Enhanced section spacing
 * Use for Stack components containing form sections
 */
export const ENHANCED_SECTION_SPACING = 3;

/**
 * Standard max width for admin form pages
 */
export const ADMIN_PAGE_MAX_WIDTH = 1000;

/**
 * Spacing between form inputs within a section
 */
export const ADMIN_INNER_SPACING = 2.5;

/**
 * SX props for section sub-headings within admin pages
 */
export const ADMIN_SECTION_HEADING_SX = {
  fontWeight: 600,
  color: '#1a1a1a',
  fontSize: '1rem',
};

/**
 * SX props for the main page heading (use with variant="h6")
 */
export const ADMIN_PAGE_HEADING_SX = {
  fontWeight: 600,
  color: '#1a1a1a',
  mb: 0.5,
};

/**
 * Enhanced container max width for desktop
 */
export const ENHANCED_CONTAINER_MAX_WIDTH = 'xl' as const;

/**
 * Primary button styling (used throughout the platform)
 * Pink/red color scheme
 */
export const PRIMARY_BUTTON_SX = {
  bgcolor: '#DE3F5E',
  color: 'white',
  borderRadius: '12px',
  textTransform: 'none' as const,
  fontWeight: 600,
  '&:hover': {
    bgcolor: '#C8365A',
  },
};

/**
 * Guest-facing TextField styling for RSVP and other guest forms.
 * Uses floating labels (placeholder becomes label on focus/fill).
 * Accepts an optional themeColor for the focus color.
 */
export const guestTextFieldSx = (themeColor = '#DE3F5E') => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: { xs: '8px', md: '10px' },
    backgroundColor: 'white',
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
    // Center the label vertically when not shrunk (no value, not focused)
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
    fontSize: '0.75rem',
  },
});

/**
 * Secondary button styling
 * White background with black text and border
 */
export const SECONDARY_BUTTON_SX = {
  bgcolor: 'white',
  color: 'black',
  borderColor: 'black',
  borderRadius: '12px',
  textTransform: 'none' as const,
  fontWeight: 600,
  '&:hover': {
    bgcolor: 'rgba(0, 0, 0, 0.04)',
    borderColor: 'black',
  },
};
