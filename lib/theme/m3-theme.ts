import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Cultural color tokens
const culturalColors = {
  // Traditional
  gold: '#D4AF37',
  maroon: '#800020',
  saffron: '#FF9933',

  // Modern accent
  coral: '#FF6B6B',
  teal: '#20C997',
  purple: '#6C5CE7'
};

const baseTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-mui-color-scheme'
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: culturalColors.maroon,
        },
        secondary: {
          main: culturalColors.gold,
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: culturalColors.gold,
        },
        secondary: {
          main: culturalColors.coral,
        },
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-outfit), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 300,
      '@media (min-width:600px)': {
        fontSize: '3.5rem',
      },
      '@media (min-width:900px)': {
        fontSize: '4rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '4.5rem',
      },
    },
    h2: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      '@media (min-width:600px)': {
        fontSize: '2.75rem',
      },
      '@media (min-width:900px)': {
        fontSize: '3rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '3.25rem',
      },
    },
    h3: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
      '@media (min-width:600px)': {
        fontSize: '2.25rem',
      },
      '@media (min-width:900px)': {
        fontSize: '2.5rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '2.75rem',
      },
    },
    h4: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      '@media (min-width:600px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:900px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '2rem',
      },
    },
    h5: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 600,
      '@media (min-width:600px)': {
        fontSize: '1.375rem',
      },
      '@media (min-width:900px)': {
        fontSize: '1.5rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.625rem',
      },
    },
    h6: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 600,
      '@media (min-width:600px)': {
        fontSize: '1.125rem',
      },
      '@media (min-width:900px)': {
        fontSize: '1.25rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.375rem',
      },
    },
    // Body text variants
    body1: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      lineHeight: 1.5,
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
      '@media (min-width:900px)': {
        fontSize: '1.125rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.25rem',
      },
    },
    body2: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      lineHeight: 1.43,
      '@media (min-width:600px)': {
        fontSize: '0.875rem',
      },
      '@media (min-width:900px)': {
        fontSize: '1rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.125rem',
      },
    },
    subtitle1: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (min-width:600px)': {
        fontSize: '1.125rem',
      },
      '@media (min-width:900px)': {
        fontSize: '1.25rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.375rem',
      },
    },
    subtitle2: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
      '@media (min-width:900px)': {
        fontSize: '1.125rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.25rem',
      },
    },
    caption: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      lineHeight: 1.33,

      '@media (min-width:600px)': {
        fontSize: '0.8rem',
      },
      '@media (min-width:900px)': {
        fontSize: '0.875rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1rem',
      },
    },
    overline: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
      lineHeight: 2.66,
      textTransform: 'uppercase',
      letterSpacing: '0.08333em',
      '@media (min-width:600px)': {
        fontSize: '0.8rem',
      },
      '@media (min-width:900px)': {
        fontSize: '0.875rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1rem',
      },
    },
    button: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: 'none',
      letterSpacing: '0.02857em',
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
      '@media (min-width:900px)': {
        fontSize: '1.125rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.25rem',
      },
    },
  },
  shape: {
    borderRadius: 16, // M3 larger radius
  },
  components: {
    // M3 component customizations
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          textTransform: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#141414',
              borderWidth: '2px',
            },
            '& input::placeholder': {
              color: '#C2C2C2 !important',
            },
            '& textarea::placeholder': {
              color: '#C2C2C2 !important',
            },
          },
          '& .MuiInputBase-input': {
            '@media (min-width:600px)': {
              fontSize: '1rem',
            },
            '@media (min-width:900px)': {
              fontSize: '1.125rem',
            },
          },
          '& .MuiInputBase-inputMultiline': {
            '@media (min-width:600px)': {
              fontSize: '1rem',
            },
            '@media (min-width:900px)': {
              fontSize: '1.125rem',
            },
            '&::placeholder': {
              '@media (min-width:600px)': {
                fontSize: '1rem',
              },
              '@media (min-width:900px)': {
                fontSize: '1.125rem',
              },
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#141414',
            borderWidth: '2px',
          },
          '& .MuiInputBase-input': {
            '@media (min-width:600px)': {
              fontSize: '1rem',
            },
            '@media (min-width:900px)': {
              fontSize: '1.125rem',
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: '#141414',
          },
        },
      },
    },
  },
});

export const theme = responsiveFontSizes(baseTheme); 