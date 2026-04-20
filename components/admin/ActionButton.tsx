'use client';

import { forwardRef, useState } from 'react';
import {
  Button,
  CircularProgress,
  IconButton,
  type ButtonProps,
  type IconButtonProps,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { PRIMARY_BUTTON_SX, SECONDARY_BUTTON_SX } from '@/lib/constants/form-styles';
import { COLORS } from '@/lib/theme/tokens';

export interface ActionButtonProps extends Omit<ButtonProps, 'onClick' | 'href'> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  /** Next.js client-side nav target. Shows spinner until page unmounts. */
  href?: string;
  /** External control of loading state (use for nav handlers that don't return a promise). */
  loading?: boolean;
  spinnerSize?: number;
  spinnerColor?: string;
}

/**
 * Shared admin button that shows a centered spinner while in-flight.
 *
 * Two ways to drive the spinner:
 * 1. Return a Promise from `onClick` — spinner auto-shows until it resolves.
 * 2. Pass `loading={boolean}` — caller controls state (useful for nav where
 *    the page unmounts before the promise resolves).
 *
 * The button auto-disables while loading and preserves its width so the
 * layout doesn't jump when the spinner appears.
 */
export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  {
    onClick,
    href,
    loading,
    disabled,
    children,
    startIcon,
    endIcon,
    spinnerSize = 18,
    spinnerColor,
    sx,
    variant,
    ...rest
  },
  ref,
) {
  const [internalLoading, setInternalLoading] = useState(false);
  const router = useRouter();
  const isLoading = loading ?? internalLoading;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading) return;
    if (href) {
      setInternalLoading(true);
      router.push(href);
    }
    if (!onClick) return;
    const result = onClick(e);
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      setInternalLoading(true);
      (result as Promise<unknown>).finally(() => setInternalLoading(false));
    }
  };

  const resolvedSpinnerColor = spinnerColor ?? COLORS.brand.primary;

  const loadingSx = isLoading
    ? {
        bgcolor: `${COLORS.bg.white} !important`,
        color: 'transparent !important',
        border: `1.5px solid ${resolvedSpinnerColor} !important`,
        boxShadow: 'none !important',
        opacity: 1,
        '& .MuiButton-startIcon, & .MuiButton-endIcon': {
          visibility: 'hidden',
        },
        '&.Mui-disabled': {
          bgcolor: `${COLORS.bg.white} !important`,
          color: 'transparent !important',
          border: `1.5px solid ${resolvedSpinnerColor} !important`,
          opacity: 1,
        },
      }
    : undefined;

  return (
    <Button
      {...rest}
      ref={ref}
      variant={variant}
      disabled={disabled || isLoading}
      startIcon={startIcon}
      endIcon={endIcon}
      onClick={handleClick}
      sx={{
        position: 'relative',
        ...sx,
        ...loadingSx,
      }}
    >
      {children}
      {isLoading && (
        <CircularProgress
          size={spinnerSize}
          sx={{
            color: resolvedSpinnerColor,
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: `-${spinnerSize / 2}px`,
            marginLeft: `-${spinnerSize / 2}px`,
          }}
        />
      )}
    </Button>
  );
});

type PresetProps = Omit<ActionButtonProps, 'variant'>;

/**
 * Primary pink CTA with shared styling + auto-spinner.
 */
export const PrimaryActionButton = forwardRef<HTMLButtonElement, PresetProps>(
  function PrimaryActionButton({ sx, ...rest }, ref) {
    return (
      <ActionButton
        ref={ref}
        variant="contained"
        {...rest}
        sx={{ ...PRIMARY_BUTTON_SX, ...sx }}
      />
    );
  },
);

/**
 * Secondary outlined button with shared styling + auto-spinner.
 */
export const SecondaryActionButton = forwardRef<HTMLButtonElement, PresetProps>(
  function SecondaryActionButton({ sx, ...rest }, ref) {
    return (
      <ActionButton
        ref={ref}
        variant="outlined"
        {...rest}
        sx={{ ...SECONDARY_BUTTON_SX, ...sx }}
      />
    );
  },
);

// ─── Icon variant ───────────────────────────────────────────────────

export interface IconActionButtonProps extends Omit<IconButtonProps, 'onClick'> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  loading?: boolean;
  spinnerSize?: number;
  spinnerColor?: string;
}

/**
 * Small square icon button with auto-spinner. Use for inline table actions
 * (save/cancel/delete row) where a full ActionButton is too big.
 */
export const IconActionButton = forwardRef<HTMLButtonElement, IconActionButtonProps>(
  function IconActionButton(
    { onClick, loading, disabled, children, spinnerSize = 16, spinnerColor, sx, ...rest },
    ref,
  ) {
    const [internalLoading, setInternalLoading] = useState(false);
    const isLoading = loading ?? internalLoading;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick || isLoading) return;
      const result = onClick(e);
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        setInternalLoading(true);
        (result as Promise<unknown>).finally(() => setInternalLoading(false));
      }
    };

    return (
      <IconButton
        {...rest}
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        sx={{
          position: 'relative',
          ...sx,
          ...(isLoading
            ? {
                border: `1.5px solid ${COLORS.brand.primary}`,
                bgcolor: COLORS.bg.white,
                color: 'transparent',
                '& svg': { visibility: 'hidden' },
                '&.Mui-disabled': {
                  border: `1.5px solid ${COLORS.brand.primary}`,
                  bgcolor: COLORS.bg.white,
                  color: 'transparent',
                },
              }
            : {}),
        }}
      >
        {children}
        {isLoading && (
          <CircularProgress
            size={spinnerSize}
            sx={{
              color: spinnerColor ?? COLORS.brand.primary,
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: `-${spinnerSize / 2}px`,
              marginLeft: `-${spinnerSize / 2}px`,
            }}
          />
        )}
      </IconButton>
    );
  },
);

export default ActionButton;
