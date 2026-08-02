'use client';

/**
 * Standard Phera switch.
 *
 * Wraps MUI Switch with token-backed iOS-style styling so both off
 * and on states look deliberate. Off = soft neutral track + white
 * thumb; on = brand pink track + white thumb. Never invert.
 */

import { Switch, type SwitchProps } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { COLORS } from '@/lib/theme/tokens';

export const PheraSwitch = (props: SwitchProps) => {
  const { sx, ...rest } = props;
  return (
    <Switch
      disableRipple
      focusVisibleClassName=".Mui-focusVisible"
      {...rest}
      sx={{
        width: 42,
        height: 24,
        padding: 0,
        overflow: 'visible',
        '& .MuiSwitch-switchBase': {
          padding: 0,
          margin: '2px',
          transitionDuration: '220ms',
          '&.Mui-checked': {
            transform: 'translateX(18px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
              backgroundColor: COLORS.brand.primary,
              opacity: 1,
              border: 0,
            },
            '&:hover + .MuiSwitch-track': {
              backgroundColor: COLORS.brand.primaryHover,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
              opacity: 0.5,
            },
          },
          '&.Mui-focusVisible .MuiSwitch-thumb': {
            boxShadow: `0 0 0 3px ${alpha(COLORS.brand.primary, 0.35)}`,
          },
          '&.Mui-disabled .MuiSwitch-thumb': {
            color: alpha('#000', 0.2),
          },
          '&.Mui-disabled + .MuiSwitch-track': {
            opacity: 0.4,
          },
        },
        '& .MuiSwitch-thumb': {
          boxSizing: 'border-box',
          width: 20,
          height: 20,
          backgroundColor: '#fff',
          boxShadow:
            '0 1px 3px rgba(0,0,0,0.18), 0 1px 1px rgba(0,0,0,0.06)',
        },
        '& .MuiSwitch-track': {
          borderRadius: 999,
          backgroundColor: alpha('#000', 0.18),
          opacity: 1,
          transition: 'background-color 220ms ease',
        },
        ...(sx as object),
      }}
    />
  );
};

export default PheraSwitch;
