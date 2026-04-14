'use client';

import { Box, Stack } from '@mui/material';
import { ChevronLeft, ChevronRight, IosShare, MenuBook, ContentCopy, Lock } from '@mui/icons-material';
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
}

const TOOLBAR_BG = '#0d0d0d';
const TOOLBAR_FG = '#e0e0e0';
const URL_PILL_BG = '#2a2a2c';
const URL_PILL_FG = '#f5f5f7';

const STATUS_BAR_HEIGHT = 44;
const URL_BAR_HEIGHT = 44;
const BOTTOM_TOOLBAR_HEIGHT = 44;

const ToolbarButton = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <Box
    onClick={onClick}
    sx={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: onClick ? 'pointer' : 'default',
      color: TOOLBAR_FG,
      '& svg': { fontSize: 22 },
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
}: MobileBrowserShellProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        bgcolor: TOOLBAR_BG,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Status bar spacer — keeps URL bar below the iPhone status bar */}
      {reserveStatusBar && <Box sx={{ height: `${STATUS_BAR_HEIGHT}px`, flexShrink: 0 }} />}

      {/* Top URL bar */}
      <Box
        sx={{
          height: `${URL_BAR_HEIGHT}px`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 1.5,
          gap: 1,
        }}
      >
        <Box
          component="span"
          sx={{
            color: TOOLBAR_FG,
            fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
            fontSize: '15px',
            fontWeight: 400,
            opacity: 0.7,
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          AA
        </Box>
        <Box
          sx={{
            flex: 1,
            maxWidth: 280,
            height: 30,
            bgcolor: URL_PILL_BG,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.6,
            px: 1.5,
            color: URL_PILL_FG,
            fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.01em',
          }}
        >
          <Lock sx={{ fontSize: 11, color: URL_PILL_FG, opacity: 0.85 }} />
          <Box
            component="span"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 220,
            }}
          >
            {url}
          </Box>
        </Box>
        <Box
          component="span"
          sx={{
            color: TOOLBAR_FG,
            fontSize: '13px',
            opacity: 0.7,
            cursor: 'default',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Tabs / refresh stand-in: simple square icon */}
          <Box
            sx={{
              width: 14,
              height: 14,
              border: `1.5px solid ${TOOLBAR_FG}`,
              borderRadius: '3px',
              opacity: 0.6,
            }}
          />
        </Box>
      </Box>

      {/* Page content */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', bgcolor: 'white' }}>{children}</Box>

      {/* Bottom toolbar — back, forward, share, bookmarks, tabs */}
      <Box
        sx={{
          height: `${BOTTOM_TOOLBAR_HEIGHT}px`,
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Stack direction="row" sx={{ height: '100%', alignItems: 'center' }}>
          <ToolbarButton onClick={onBack}>
            <ChevronLeft />
          </ToolbarButton>
          <ToolbarButton>
            <ChevronRight sx={{ opacity: 0.4 }} />
          </ToolbarButton>
          <ToolbarButton>
            <IosShare />
          </ToolbarButton>
          <ToolbarButton>
            <MenuBook />
          </ToolbarButton>
          <ToolbarButton>
            <ContentCopy />
          </ToolbarButton>
        </Stack>
      </Box>
    </Box>
  );
}
