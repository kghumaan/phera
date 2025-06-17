'use client';

import { Box, Container, Typography } from '@mui/material';

export default function GuestEventsPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              color: '#333',
              fontWeight: 600,
              mb: 2,
            }}
          >
            Events Page
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              fontSize: '1.1rem',
            }}
          >
            Coming Soon - Wedding Events Details
          </Typography>
        </Box>
      </Container>
    </Box>
  );
} 