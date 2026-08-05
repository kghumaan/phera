import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Module augmentation for custom typography variants
declare module '@mui/material/styles' {
  interface TypographyVariants {
    body3: React.CSSProperties;
    body4: React.CSSProperties;
    subtitleCaps: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    body3?: any; // Using any to properly support nested media queries in theme definition
    body4?: any;
    subtitleCaps?: any;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    body3: true;
    body4: true;
    subtitleCaps: true;
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
  // Light only, on purpose. Phera's surfaces are hardcoded white/light via
  // tokens, so a dark scheme never restyles them — it only leaks MUI's dark
  // palette into derived states (e.g. disabled buttons went white-on-white and
  // read as empty space for anyone whose OS prefers dark). Do not add a dark
  // scheme back without actually designing one.
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
      fontWeight: 600,
      fontSize: '1.3rem', // Base mobile size
      '@media (min-width:600px)': {
        fontSize: '1.4rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 600,
      fontSize: '1.1rem', // Base mobile size
      '@media (min-width:600px)': {
        fontSize: '1.125rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.25rem',
      },
    },
    h6: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 600,
      fontSize: '0.95rem', // Base mobile size
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.1rem',
      },
    },
    // Body text variants
    body1: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      lineHeight: 1.5,
      fontSize: '0.95rem', // Base mobile size
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1.1rem',
      },
    },
    // 14px (0.875rem) is the minimum readable size across the app.
    // No text variant drops below it — consumers should not set inline
    // fontSize smaller than 0.875rem.
    body2: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      lineHeight: 1.5,
      fontSize: '0.875rem', // 14px floor
      '@media (min-width:600px)': {
        fontSize: '0.925rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1rem',
      },
    },
    body3: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      lineHeight: 1.5,
      fontSize: '0.875rem', // 14px floor
      '@media (min-width:600px)': {
        fontSize: '0.9rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '0.95rem',
      },
    },
    body4: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      lineHeight: 1.43,
      fontSize: '0.875rem', // 14px floor
      '@media (min-width:600px)': {
        fontSize: '0.9rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '0.925rem',
      },
    },
    subtitle1: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 600,
      lineHeight: 1.4,
      fontSize: '0.9rem',
      '@media (min-width:600px)': {
        fontSize: '0.95rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '1rem',
      },
    },
    subtitle2: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 600,
      lineHeight: 1.4,
      fontSize: '0.875rem', // 14px floor
      '@media (min-width:600px)': {
        fontSize: '0.9rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '0.925rem',
      },
    },
    subtitleCaps: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 600,
      lineHeight: 1.4,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontSize: '0.875rem', // 14px floor
      '@media (min-width:600px)': {
        fontSize: '0.9rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '0.925rem',
      },
    },
    caption: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 400,
      lineHeight: 1.4,
      fontSize: '0.875rem', // 14px floor
      '@media (min-width:600px)': {
        fontSize: '0.875rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '0.9rem',
      },
    },
    overline: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
      lineHeight: 2,
      textTransform: 'uppercase',
      letterSpacing: '0.08333em',
      fontSize: '0.875rem', // 14px floor
      '@media (min-width:600px)': {
        fontSize: '0.875rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '0.9rem',
      },
    },
    button: {
      fontFamily: 'var(--font-outfit)',
      fontWeight: 500,
      lineHeight: 1.75,
      textTransform: 'none',
      letterSpacing: '0.02857em',
      fontSize: '0.875rem', // 14px floor
      '@media (min-width:600px)': {
        fontSize: '0.9rem',
      },
      '@media (min-width:1200px)': {
        fontSize: '0.95rem',
      },
    },
  },
  shape: {
    borderRadius: 16, // M3 larger radius
  },
  components: {
    // M3 component customizations
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: '0.85rem',
          '@media (min-width:600px)': {
            fontSize: '0.9rem',
          },
          '@media (min-width:1200px)': {
            fontSize: '1rem',
          },
        },
      },
    },
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
      defaultProps: {
        variantMapping: {
          body3: 'p',
          body4: 'p',
          subtitleCaps: 'p',
        },
      },
      styleOverrides: {
        root: {
          // Allow variants to determine color
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginTop: '8px',
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
    // Soften table row dividers — default MUI is ~rgba(224,224,224,1)
    // which reads as a hard line. We want barely-there grey across every
    // table in the app.
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

// Disable for testing manual overrides
// export const theme = responsiveFontSizes(baseTheme);
export const theme = baseTheme; 