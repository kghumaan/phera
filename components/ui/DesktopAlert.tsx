'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertTitle, Snackbar, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Close as CloseIcon, PhoneIphone as PhoneIcon } from '@mui/icons-material';

interface DesktopAlertProps {
  show?: boolean;
}

export default function DesktopAlert({ show = true }: DesktopAlertProps) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    // Only show on desktop and if show prop is true
    if (isDesktop && show) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000); // Show after 1 second delay

      return () => clearTimeout(timer);
    }
  }, [isDesktop, show]);

  const handleClose = () => {
    setOpen(false);
  };

  if (!isDesktop || !show) {
    return null;
  }

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{
        mt: 2,
        '& .MuiSnackbarContent-root': {
          padding: 0,
        },
      }}
    >
      <Alert
        severity="info"
        icon={<PhoneIcon />}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{
          backgroundColor: '#DE3F5E',
          color: 'white',
          minWidth: '400px',
          '& .MuiAlert-icon': {
            color: 'white',
          },
          '& .MuiAlert-action': {
            color: 'white',
          },
        }}
      >
        <AlertTitle sx={{ color: 'white', fontWeight: 600, mb: 0.5 }}>
          📱 Best viewed on mobile
        </AlertTitle>
        This experience is designed for your phone – desktop coming soon!
      </Alert>
    </Snackbar>
  );
}