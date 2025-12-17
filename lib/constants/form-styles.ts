/**
 * Enhanced TextField styling for admin onboarding forms
 * Provides consistent, larger, more readable form inputs across the platform
 */

export const ENHANCED_TEXT_FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    bgcolor: 'white',
    fontSize: { xs: '1rem', md: '1.125rem', lg: '1.25rem' },
    '& input': {
      py: { xs: 2, md: 2.5, lg: 3 },
      fontSize: { xs: '1rem', md: '1.125rem', lg: '1.25rem' },
    },
    '& textarea': {
      fontSize: { xs: '1rem', md: '1.125rem', lg: '1.25rem' },
    },
    '& .MuiSelect-select': {
      py: { xs: 2, md: 2.5, lg: 3 },
      fontSize: { xs: '1rem', md: '1.125rem', lg: '1.25rem' },
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
    fontSize: { xs: '1.125rem', md: '1.25rem', lg: '1.375rem' },
    fontWeight: 500,
    lineHeight: 1.5,
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
    fontSize: { xs: '0.875rem', md: '0.9375rem', lg: '1rem' },
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
export const ENHANCED_SECTION_SPACING = 5;

/**
 * Enhanced container max width for desktop
 */
export const ENHANCED_CONTAINER_MAX_WIDTH = 'xl' as const;

