'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { Box, Typography, Button, Container } from '@mui/material';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Box
            sx={{
              textAlign: 'center',
              backgroundColor: COLORS.bg.subtle,
              borderRadius: 3,
              p: 4,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: COLORS.text.strong,
                fontWeight: 600,
                mb: 2,
              }}
            >
              Something went wrong
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: COLORS.text.subtle,
                mb: 3,
                lineHeight: 1.6,
              }}
            >
              We encountered an unexpected error. Please try refreshing the page.
            </Typography>
            <Button
              variant="contained"
              onClick={this.resetError}
              sx={{
                backgroundColor: COLORS.brand.primary,
                color: COLORS.text.inverse,
                px: 4,
                py: 1.5,
                borderRadius: RADII.dialog,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: COLORS.brand.primaryHover,
                },
              }}
            >
              Try Again
            </Button>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 