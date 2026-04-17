'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/Download';
import { generateBulkWaLinks, generateBroadcastMessage, GuestContact } from '@/lib/whatsapp/deep-links';
import { ActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface PersonalOutreachGeneratorProps {
  coupleName: string;
  weddingDate: string;
  websiteUrl: string;
  guests: GuestContact[];
  onGuestsMarkedSent?: (guestIds: string[]) => void;
}

export default function PersonalOutreachGenerator({
  coupleName,
  weddingDate,
  websiteUrl,
  guests,
  onGuestsMarkedSent,
}: PersonalOutreachGeneratorProps) {
  const defaultMessage = generateBroadcastMessage(coupleName, weddingDate, websiteUrl);
  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);

  const waLinks = generateBulkWaLinks(guests, message);

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadContacts = () => {
    const csv = ['Name,Phone']
      .concat(guests.map((g) => `${g.name},${g.phone}`))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${coupleName.replace(/\s+/g, '-')}-guest-contacts.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      <Typography variant="h6" sx={{ color: COLORS.text.strong, fontWeight: 600, mb: 1 }}>
        Send your first save-the-date personally
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 3 }}>
        Your guests will trust a message from you more than from a new number. Send this personally, and Phera will handle everything after.
      </Typography>

      <TextField
        multiline
        rows={6}
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            bgcolor: COLORS.bg.white,
            borderRadius: RADII.md,
          },
        }}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <ActionButton
          variant="contained"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyMessage}
          sx={{
            borderRadius: RADII.md,
            textTransform: 'none',
            bgcolor: copied ? COLORS.accent.success : COLORS.brand.primary,
            '&:hover': { bgcolor: copied ? '#45a049' : '#c13550' },
          }}
        >
          {copied ? 'Copied!' : 'Copy message'}
        </ActionButton>
        <ActionButton
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadContacts}
          sx={{
            borderRadius: RADII.md,
            textTransform: 'none',
            borderColor: COLORS.brand.primary,
            color: COLORS.brand.primary,
          }}
        >
          Download contact list
        </ActionButton>
      </Stack>

      {guests.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ color: COLORS.text.muted, mb: 1 }}>
            Quick send links ({guests.length} guests)
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {waLinks.slice(0, 10).map((link) => (
              <Chip
                key={link.phone}
                label={link.name}
                component="a"
                href={link.link}
                target="_blank"
                rel="noopener noreferrer"
                clickable
                icon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                sx={{ mb: 1 }}
              />
            ))}
            {waLinks.length > 10 && (
              <Chip label={`+${waLinks.length - 10} more`} variant="outlined" />
            )}
          </Stack>
        </Box>
      )}

      {guests.length > 256 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          WhatsApp broadcast lists support max 256 contacts. You may need to create multiple lists.
        </Alert>
      )}
    </Paper>
  );
}
