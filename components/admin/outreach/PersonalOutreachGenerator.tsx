'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/Download';
import { generateBulkWaLinks, generateBroadcastMessage, GuestContact } from '@/lib/whatsapp/deep-links';

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
      <Typography variant="h6" sx={{ color: '#1a1a1a', fontWeight: 600, mb: 1 }}>
        Send your first save-the-date personally
      </Typography>
      <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 3 }}>
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
            bgcolor: 'white',
            borderRadius: '12px',
          },
        }}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyMessage}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            bgcolor: copied ? '#4CAF50' : '#DE3F5E',
            '&:hover': { bgcolor: copied ? '#45a049' : '#c13550' },
          }}
        >
          {copied ? 'Copied!' : 'Copy message'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadContacts}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            borderColor: '#DE3F5E',
            color: '#DE3F5E',
          }}
        >
          Download contact list
        </Button>
      </Stack>

      {guests.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ color: '#4a4a4a', mb: 1 }}>
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
