import { alpha, SxProps, Theme } from '@mui/material';

/**
 * Primary Button Style (Pink Filled)
 * Use for main actions like Save, Submit, Publish, Confirm
 */
export const PRIMARY_BUTTON_SX: SxProps<Theme> = {
  bgcolor: '#DE3F5E',
  color: 'white',
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': {
    bgcolor: '#C8365A',
  },
  '&.Mui-disabled': {
    bgcolor: alpha('#DE3F5E', 0.5),
    color: 'rgba(255, 255, 255, 0.7)',
  },
};

/**
 * Secondary Button Style (Black Outlined)
 * Use for cancel, secondary actions, or less important actions
 */
export const SECONDARY_BUTTON_SX: SxProps<Theme> = {
  borderColor: '#000',
  color: '#000',
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': {
    borderColor: '#333',
    bgcolor: alpha('#000', 0.05),
  },
  '&.Mui-disabled': {
    borderColor: alpha('#000', 0.3),
    color: alpha('#000', 0.3),
  },
};

/**
 * Primary Button Style with custom padding
 * Use for buttons that need specific padding
 */
export const getPrimaryButtonSx = (py: number = 1.5): SxProps<Theme> => ({
  ...PRIMARY_BUTTON_SX,
  py,
});

/**
 * Secondary Button Style with custom padding
 * Use for buttons that need specific padding
 */
export const getSecondaryButtonSx = (py: number = 1.5): SxProps<Theme> => ({
  ...SECONDARY_BUTTON_SX,
  py,
});
