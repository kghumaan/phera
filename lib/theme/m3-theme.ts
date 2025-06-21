import { createTheme } from '@mui/material/styles';

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

export const theme = createTheme({
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
    },
    h2: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
    },
    h3: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
    },
    h4: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
    },
    h5: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 600,
    },
    h6: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 600,
    },
    // Body text variants
    body1: {
      fontFamily: 'var(--font-outfit)',
      fontSize: '1.125rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontFamily: 'var(--font-outfit)',
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43,
    },
    subtitle1: {
      fontFamily: 'var(--font-outfit)',
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    subtitle2: {
      fontFamily: 'var(--font-outfit)',
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    caption: {
      fontFamily: 'var(--font-outfit)',
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.33,
    },
    overline: {
      fontFamily: 'var(--font-outfit)',
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 2.66,
      textTransform: 'uppercase',
      letterSpacing: '0.08333em',
    },
    button: {
      fontFamily: 'var(--font-outfit)',
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: 'none',
      letterSpacing: '0.02857em',
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
              borderColor: culturalColors.maroon,
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: culturalColors.maroon,
            borderWidth: '2px',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: culturalColors.maroon,
          },
        },
      },
    },
  },
}); 