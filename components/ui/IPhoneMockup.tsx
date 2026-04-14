'use client';

import { Box, type SxProps, type Theme } from '@mui/material';
import type { ReactNode } from 'react';

type ResponsiveValue = string | number | Record<string, string | number>;

interface IPhoneMockupProps {
  children: ReactNode;
  /**
   * Responsive width of the mockup. Aspect ratio is fixed (9 / 19 — iPhone 15 Pro).
   * Defaults to a sensible parallax-section size.
   */
  width?: ResponsiveValue;
  /**
   * Show the faux iOS status bar (9:41, signal, WiFi, battery). Defaults to true.
   * Pass false when the screen content already includes its own status bar.
   */
  showStatusBar?: boolean;
  /**
   * Show the Dynamic Island pill at the top. Defaults to true.
   */
  showDynamicIsland?: boolean;
  /**
   * Icon/text color used for the faux status bar. Use 'dark' when the screen
   * content sits on a light background (e.g. a browser chrome). Defaults to 'light'.
   */
  statusBarColor?: 'light' | 'dark';
  /**
   * Inner-bezel padding around the screen. Defaults to a responsive value
   * matching the parallax mockup. Pass a smaller value for tighter mockups.
   */
  bezelPadding?: ResponsiveValue;
  /**
   * Optional sx applied to the outermost container (e.g. mx, mt).
   */
  sx?: SxProps<Theme>;
}

const TITANIUM = '#9a9a9e';
const SIDE_BUTTON_BG = '#0a0a0b';

const sideButtonSx = {
  position: 'absolute',
  width: '3px',
  bgcolor: SIDE_BUTTON_BG,
  zIndex: 5,
} as const;

export default function IPhoneMockup({
  children,
  width = { xs: '260px', md: '320px', lg: '380px' },
  showStatusBar = true,
  showDynamicIsland = true,
  statusBarColor = 'light',
  bezelPadding = { xs: '7px', md: '9px', lg: '10px' },
  sx,
}: IPhoneMockupProps) {
  const statusFg = statusBarColor === 'dark' ? '#1a1a1a' : 'white';
  const batteryOuterBorder = `1.2px solid ${statusFg}`;
  return (
    <Box
      sx={{
        width,
        aspectRatio: '9 / 19',
        position: 'relative',
        borderRadius: '54px',
        background: TITANIUM,
        padding: '2.5px',
        boxShadow: `
          0 28px 70px rgba(0, 0, 0, 0.22),
          0 10px 24px rgba(0, 0, 0, 0.12),
          inset 0 0 0 0.5px rgba(255, 255, 255, 0.4)
        `,
        ...sx,
      }}
    >
      {/* Inner dark bezel */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          borderRadius: '51px',
          background: 'linear-gradient(160deg, #2a2a2c 0%, #1a1a1c 40%, #0f0f10 100%)',
          padding: bezelPadding,
          boxShadow: `
            inset 0 0 0 1px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.06)
          `,
        }}
      >
        {/* Side buttons — left: silent toggle + 2 volume; right: power */}
        <Box sx={{ ...sideButtonSx, left: '-5px', top: '14%', height: '32px', borderRadius: '2px 0 0 2px', boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.05)' }} />
        <Box sx={{ ...sideButtonSx, left: '-5px', top: '24%', height: '52px', borderRadius: '2px 0 0 2px', boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.05)' }} />
        <Box sx={{ ...sideButtonSx, left: '-5px', top: '32%', height: '52px', borderRadius: '2px 0 0 2px', boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.05)' }} />
        <Box sx={{ ...sideButtonSx, right: '-5px', top: '26%', height: '72px', borderRadius: '0 2px 2px 0', boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.05)' }} />

        {/* Inner screen */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '40px',
            overflow: 'hidden',
            bgcolor: '#000',
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)',
          }}
        >
          {/* Faux iOS status bar */}
          {showStatusBar && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '44px',
                zIndex: 25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                color: statusFg,
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
                pointerEvents: 'none',
              }}
            >
              <Box sx={{ minWidth: 50 }}>9:41</Box>
              <Box sx={{ flex: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 50, justifyContent: 'flex-end' }}>
                {/* Signal bars */}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                  {[3, 5, 7, 9].map((h) => (
                    <Box key={h} sx={{ width: '3px', height: `${h}px`, bgcolor: statusFg, borderRadius: '0.5px' }} />
                  ))}
                </Box>
                {/* 5G label */}
                <Box
                  component="span"
                  sx={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  5G
                </Box>
                {/* Battery */}
                <Box
                  sx={{
                    ml: 0.5,
                    width: 22,
                    height: 11,
                    border: batteryOuterBorder,
                    borderRadius: '3px',
                    position: 'relative',
                    p: '1px',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      right: '-3px',
                      top: '3px',
                      width: '1.5px',
                      height: '5px',
                      bgcolor: statusFg,
                      borderRadius: '0 1px 1px 0',
                    },
                  }}
                >
                  <Box sx={{ width: '78%', height: '100%', bgcolor: statusFg, borderRadius: '1px' }} />
                </Box>
              </Box>
            </Box>
          )}

          {/* Dynamic Island */}
          {showDynamicIsland && (
            <Box
              sx={{
                position: 'absolute',
                top: '11px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '108px',
                height: '32px',
                bgcolor: '#000',
                borderRadius: '999px',
                zIndex: 30,
                boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.05)',
              }}
            />
          )}

          {/* Screen content */}
          <Box sx={{ position: 'absolute', inset: 0, lineHeight: 0 }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}
