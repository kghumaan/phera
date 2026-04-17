'use client';

/**
 * Standard Phera alerts / inline notices.
 *
 * Four tones: info, success, warning, error. Each renders a light-bg
 * panel with a leading icon + message. Use these anywhere you'd reach
 * for MUI's `<Alert>` — never import `@mui/material/Alert` directly in
 * app code.
 *
 * ```tsx
 * <InfoAlert>No email or phone detected — you can still import names.</InfoAlert>
 * <WarningAlert title="Heads up">Some rows are missing names.</WarningAlert>
 * <ErrorAlert>{error.message}</ErrorAlert>
 * ```
 */

import { Box, Typography } from '@mui/material';
import {
  InfoOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  ErrorOutline,
} from '@mui/icons-material';
import type { ReactNode } from 'react';
import { COLORS, RADII } from '@/lib/theme/tokens';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

export interface PheraAlertProps {
  tone?: AlertTone;
  /** Optional bold heading rendered above the body. */
  title?: ReactNode;
  children: ReactNode;
  /** Override leading icon. Pass `null` to hide. */
  icon?: ReactNode | null;
  /** Extra sx for outer container — use sparingly. */
  sx?: object;
}

const TONE_STYLES: Record<AlertTone, { bg: string; border: string; fg: string; icon: ReactNode }> = {
  info: {
    bg: COLORS.accent.infoBg,
    border: 'rgba(59, 130, 246, 0.25)',
    fg: COLORS.accent.infoText,
    icon: <InfoOutlined fontSize="small" />,
  },
  success: {
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.25)',
    fg: COLORS.accent.successText,
    icon: <CheckCircleOutline fontSize="small" />,
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
    fg: COLORS.accent.warningText,
    icon: <WarningAmberOutlined fontSize="small" />,
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.25)',
    fg: COLORS.accent.dangerText,
    icon: <ErrorOutline fontSize="small" />,
  },
};

export function PheraAlert({ tone = 'info', title, children, icon, sx }: PheraAlertProps) {
  const style = TONE_STYLES[tone];
  const resolvedIcon = icon === null ? null : icon ?? style.icon;

  return (
    <Box
      role="status"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        bgcolor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: RADII.md,
        px: 2,
        py: 1.5,
        color: style.fg,
        ...sx,
      }}
    >
      {resolvedIcon && (
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {resolvedIcon}
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {title && (
          <Typography
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: 13,
              color: COLORS.text.strong,
              mb: 0.25,
            }}
          >
            {title}
          </Typography>
        )}
        <Typography
          component="div"
          sx={{
            fontSize: 13,
            lineHeight: 1.55,
            color: COLORS.text.muted,
          }}
        >
          {children}
        </Typography>
      </Box>
    </Box>
  );
}

// Convenience presets so callers don't need to remember the `tone` prop.
export const InfoAlert = (props: Omit<PheraAlertProps, 'tone'>) => <PheraAlert tone="info" {...props} />;
export const SuccessAlert = (props: Omit<PheraAlertProps, 'tone'>) => <PheraAlert tone="success" {...props} />;
export const WarningAlert = (props: Omit<PheraAlertProps, 'tone'>) => <PheraAlert tone="warning" {...props} />;
export const ErrorAlert = (props: Omit<PheraAlertProps, 'tone'>) => <PheraAlert tone="error" {...props} />;

export default PheraAlert;
