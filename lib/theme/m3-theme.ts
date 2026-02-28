import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Module augmentation for custom typography variants
declare module '@mui/material/styles' {
  interface TypographyVariants {
    body3: React.CSSProperties;
    body4: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    body3?: any; // Using any to properly support nested media queries in theme definition
    body4?: any;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    body3: true;
    body4: true;
  }
}

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
          main: '#DE3F5E',
        },
        secondary: {
          main: culturalColors.gold,
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#DE3F5E',
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
      fontFamily: 'var(--font-instrument-serif)',
      fontWeight: 400,
      fontStyle: 'italic',
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
      fontFamily: 'var(--font-instrument-serif)',
      fontWeight: 400,
      // fontSize: '8rem', // Base size for < 600px
      fontStyle: 'italic',
      '@media (min-width:600px)': {
        fontSize: '3.25rem',
      },
      '@media (min-width:900px)': {
        fontSize: '3.50rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '3.75rem',
      },
    },
    h3: {
      fontFamily: 'var(--font-instrument-serif)',
      fontWeight: 400,
      fontStyle: 'italic',
      '@media (min-width:600px)': {
        fontSize: '2.25rem',
      },
      '@media (min-width:900px)': {
        fontSize: '2.50rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '2.75rem',
      },
    },
    h4: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
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
      fontWeight: 500,
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
      fontWeight: 500,
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
        fontSize: '1.1rem',
      },
      '@media (min-width:900px)': {
        fontSize: '1.1875rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.25rem',
      },
    },
    body2: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      lineHeight: 1.5,
      '@media (min-width:600px)': {
        fontSize: '1.0rem',
      },
      '@media (min-width:900px)': {
        fontSize: '1.0625rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.125rem',
      },
    },
    body3: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      lineHeight: 1.5,
      '@media (min-width:600px)': {
        fontSize: '0.9rem',
      },
      '@media (min-width:900px)': {
        fontSize: '0.95rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1rem',
      },
    },
    body4: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      lineHeight: 1.43,
      '@media (min-width:600px)': {
        fontSize: '0.8rem',
      },
      '@media (min-width:900px)': {
        fontSize: '0.85rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '0.9rem',
      },
    },
    subtitle1: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (min-width:600px)': {
        fontSize: '0.95rem',
      },
      '@media (min-width:900px)': {
        fontSize: '1rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.05rem',
      },
    },
    subtitle2: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
      lineHeight: 1.4,
      '@media (min-width:600px)': {
        fontSize: '0.875rem',
      },
      '@media (min-width:900px)': {
        fontSize: '0.95rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1rem',
      },
    },
    caption: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      lineHeight: 1.33,

      '@media (min-width:600px)': {
        fontSize: '0.72rem',
      },
      '@media (min-width:900px)': {
        fontSize: '0.78rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '0.82rem',
      },
    },
    overline: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
      lineHeight: 2.66,
      textTransform: 'uppercase',
      letterSpacing: '0.08333em',
      '@media (min-width:600px)': {
        fontSize: '0.72rem',
      },
      '@media (min-width:900px)': {
        fontSize: '0.78rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '0.82rem',
      },
    },
    button: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: 'none',
      letterSpacing: '0.02857em',
      '@media (min-width:600px)': {
        fontSize: '0.875rem',
      },
      '@media (min-width:900px)': {
        fontSize: '0.925rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '0.975rem',
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
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          borderRadius: 24,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          // Allow variants to determine color
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#DE3F5E',
              borderWidth: '2px',
            },
            '& input::placeholder': {
              color: '#C2C2C2 !important',
            },
            '& textarea::placeholder': {
              color: '#C2C2C2 !important',
            },
            '& input': {
              color: '#1a1a1a',
            },
            '& textarea': {
              color: '#1a1a1a',
            },
          },
          '& .MuiInputBase-input': {
            '@media (min-width:600px)': {
              fontSize: '0.875rem',
            },
            '@media (min-width:900px)': {
              fontSize: '0.925rem',
            },
          },
          '& .MuiInputBase-inputMultiline': {
            '@media (min-width:600px)': {
              fontSize: '0.875rem',
            },
            '@media (min-width:900px)': {
              fontSize: '0.925rem',
            },
            '&::placeholder': {
              '@media (min-width:600px)': {
                fontSize: '0.875rem',
              },
              '@media (min-width:900px)': {
                fontSize: '0.925rem',
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
            borderColor: '#DE3F5E',
            borderWidth: '2px',
          },
          '& .MuiInputBase-input': {
            color: '#1a1a1a',
            '@media (min-width:600px)': {
              fontSize: '0.875rem',
            },
            '@media (min-width:900px)': {
              fontSize: '0.925rem',
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: '#DE3F5E',
          },
        },
      },
    },
  },
});

// Disable for testing manual overrides
// export const theme = responsiveFontSizes(baseTheme);
export const theme = baseTheme; 