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
    fontFamily: 'var(--font-work-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontFamily: 'var(--font-instrument-serif), Georgia, serif',
      fontWeight: 400,
    },
    h2: {
      fontFamily: 'var(--font-instrument-serif), Georgia, serif',
      fontWeight: 400,
    },
    h3: {
      fontFamily: 'var(--font-instrument-serif), Georgia, serif',
      fontWeight: 400,
    },
    h4: {
      fontFamily: 'var(--font-instrument-serif), Georgia, serif',
      fontWeight: 400,
    },
    h5: {
      fontFamily: 'var(--font-instrument-serif), Georgia, serif',
      fontWeight: 400,
    },
    h6: {
      fontFamily: 'var(--font-instrument-serif), Georgia, serif',
      fontWeight: 400,
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
  },
}); 