'use client';

import { Box, Stack } from '@mui/material';
import {
  ArrowBackIos,
  ArrowForwardIos,
  Add,
  MoreVert,
  Lock,
} from '@mui/icons-material';
import type { ReactNode } from 'react';

interface MobileBrowserShellProps {
  /**
   * Browser content (typically an iframe). Will be sized to fill the
   * area between the top URL bar and the bottom toolbar.
   */
  children: ReactNode;
  /**
   * URL displayed in the top address bar.
   */
  url: string;
  /**
   * Reserve space at the very top for an externally rendered status bar
   * (e.g. when nested inside IPhoneMockup which draws its own 44px status bar).
   * Defaults to true.
   */
  reserveStatusBar?: boolean;
  /**
   * Click handler for the back button (rendered in the bottom toolbar).
   */
  onBack?: () => void;
  /**
   * Number shown in the tabs pill at the bottom right. Defaults to 1.
   */
  tabCount?: number;
}

// Chrome mobile light theme palette
const CHROME_BG = '#f1f3f4';
const CHROME_FG = '#1a1a1a';
const CHROME_FG_MUTED = '#5f6368';
const URL_PILL_BG = '#e1e3e6';

const STATUS_BAR_HEIGHT = 44;
const URL_BAR_HEIGHT = 44;
const BOTTOM_TOOLBAR_HEIGHT = 48;

const ToolbarButton = ({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <Box
    onClick={disabled ? undefined : onClick}
    sx={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled || !onClick ? 'default' : 'pointer',
      color: disabled ? 'rgba(0,0,0,0.3)' : CHROME_FG,
      '& svg': { fontSize: 20 },
    }}
  >
    {children}
  </Box>
);

export default function MobileBrowserShell({
  children,
  url,
  reserveStatusBar = true,
  onBack,
  tabCount = 1,
}: MobileBrowserShellProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        bgcolor: CHROME_BG,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Status bar spacer — keeps URL bar below the iPhone status bar */}
      {reserveStatusBar && <Box sx={{ height: `${STATUS_BAR_HEIGHT}px`, flexShrink: 0 }} />}

      {/* Top URL bar (Chrome mobile: URL pill + 3-dot menu) */}
      <Box
        sx={{
          height: `${URL_BAR_HEIGHT}px`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 1,
          gap: 1,
        }}
      >
        <Box
          sx={{
            flex: 1,
            maxWidth: 300,
            height: 32,
            bgcolor: URL_PILL_BG,
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            color: CHROME_FG,
            fontFamily: '-apple-system, "SF Pro Text", Roboto, system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <Lock sx={{ fontSize: 13, color: CHROME_FG_MUTED, flexShrink: 0 }} />
          <Box
            component="span"
            sx={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {url}
          </Box>
        </Box>
        <Box
          sx={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: CHROME_FG,
            flexShrink: 0,
          }}
        >
          <MoreVert sx={{ fontSize: 20 }} />
        </Box>
      </Box>

      {/* Page content */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', bgcolor: 'white' }}>{children}</Box>

      {/* Bottom toolbar (Chrome mobile: back, forward, +, tabs, menu) */}
      <Box
        sx={{
          height: `${BOTTOM_TOOLBAR_HEIGHT}px`,
          flexShrink: 0,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          bgcolor: CHROME_BG,
        }}
      >
        <Stack direction="row" sx={{ height: '100%', alignItems: 'center' }}>
          <ToolbarButton onClick={onBack}>
            <ArrowBackIos sx={{ fontSize: 18, ml: 0.5 }} />
          </ToolbarButton>
          <ToolbarButton disabled>
            <ArrowForwardIos sx={{ fontSize: 18 }} />
          </ToolbarButton>
          <ToolbarButton>
            <Add />
          </ToolbarButton>
          <ToolbarButton>
            {/* Tabs pill with count */}
            <Box
              sx={{
                width: 22,
                height: 22,
                border: `1.8px solid ${CHROME_FG}`,
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: CHROME_FG,
                lineHeight: 1,
                fontFamily: '-apple-system, "SF Pro Text", Roboto, system-ui, sans-serif',
              }}
            >
              {tabCount}
            </Box>
          </ToolbarButton>
          <ToolbarButton>
            <MoreVert />
          </ToolbarButton>
        </Stack>
      </Box>
    </Box>
  );
}
