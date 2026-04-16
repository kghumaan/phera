'use client';

import { Container } from '@mui/material';
import GuestHierarchy from '@/components/admin/GuestHierarchy';

export default function GuestsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <GuestHierarchy />
    </Container>
  );
} 