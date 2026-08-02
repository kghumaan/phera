'use client';

import { Box, Button, Stack, TextField, Typography, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { guestTextFieldSx } from '@/lib/constants/form-styles';
import { COLORS, RADII } from '@/lib/theme/tokens';

export interface NameMatch {
  id: string;
  name: string;
  plusOneName: string | null;
  partySize: number;
  avatarColor: string | null;
  initials: string | null;
}

export interface NameSelectProps {
  weddingSlug: string;
  password: string;
  isPreview?: boolean;
  primaryColor?: string;
  fontColor?: string;
  buttonFontColor?: string;
  onSelect: (guestId: string) => void;
}

export default function NameSelect({
  weddingSlug,
  password,
  isPreview = false,
  primaryColor = COLORS.brand.primary,
  fontColor = COLORS.text.strong,
  buttonFontColor = COLORS.bg.white,
  onSelect,
}: NameSelectProps) {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<NameMatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canSearch = query.trim().length >= 2 && !searching;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSearch) return;

    if (isPreview) {
      setMatches([
        { id: 'preview-1', name: 'Simran Savani', plusOneName: null, partySize: 1, avatarColor: null, initials: 'SS' },
        { id: 'preview-2', name: 'KV Ghumaan Simran', plusOneName: null, partySize: 2, avatarColor: null, initials: 'KG' },
      ]);
      setSearched(true);
      return;
    }

    setSearching(true);
    setError(null);
    setSearched(false);
    try {
      const res = await fetch('/api/access/match-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingSlug, password, query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not search for your name. Please try again.');
        setMatches([]);
      } else {
        setMatches((data.matches || []) as NameMatch[]);
      }
      setSearched(true);
    } catch (err) {
      console.error('Name match error:', err);
      setError('Something went wrong. Please try again.');
      setMatches([]);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Stack spacing={3} alignItems="center" sx={{ width: '100%' }}>
      <motion.form
        onSubmit={handleSearch}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
      >
        <Box sx={{ width: '100%', maxWidth: { xs: 354, lg: 420 } }}>
          <TextField
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(null); }}
            placeholder="First and last name"
            fullWidth
            autoFocus
            sx={guestTextFieldSx(primaryColor)}
            inputProps={{ 'aria-label': 'Your full name' }}
          />
          <Typography
            variant="body2"
            sx={{ mt: 1, color: fontColor, opacity: 0.75, textAlign: 'center', fontSize: '0.8125rem' }}
          >
            Ex. Sarah Fortune (not The Fortune Family or Dr. &amp; Mr. Fortune)
          </Typography>
        </Box>

        {error && (
          <Typography
            variant="body2"
            sx={{
              color: primaryColor,
              fontWeight: 600,
              textAlign: 'center',
              backgroundColor: `${primaryColor}15`,
              px: 3,
              py: 1,
              borderRadius: RADII.pill,
              border: `1px solid ${primaryColor}33`,
            }}
          >
            {error}
          </Typography>
        )}

        <Button
          type="submit"
          disabled={!canSearch}
          sx={{
            backgroundColor: primaryColor,
            color: buttonFontColor,
            borderRadius: RADII.md,
            px: { xs: 2.5, sm: 3 },
            py: 1.5,
            minHeight: { xs: 48, sm: 52 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '6.25%',
            width: '100%',
            maxWidth: { xs: 354, lg: 420 },
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: primaryColor,
              filter: 'brightness(0.95)',
              boxShadow: 'none',
            },
            '&.Mui-disabled': {
              backgroundColor: COLORS.border.default,
              color: COLORS.text.inverse,
            },
          }}
        >
          {searching ? 'Searching…' : 'Continue'}
        </Button>
      </motion.form>

      {searched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          <Typography variant="body2" sx={{ color: fontColor, textAlign: 'center', mb: 1.5, opacity: 0.9 }}>
            {matches.length > 0
              ? 'Select your info below or try searching again.'
              : 'No matches found. Try just your first or last name.'}
          </Typography>
          <Divider sx={{ borderColor: `${fontColor}30`, mb: 1.5 }} />
          <Stack spacing={1.5}>
            {matches.map((m) => (
              <Box key={m.id} sx={{ textAlign: 'center' }}>
                <Typography
                  sx={{
                    color: fontColor,
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                >
                  {m.name}
                </Typography>
                {m.plusOneName && (
                  <Typography variant="body2" sx={{ color: fontColor, opacity: 0.7, fontSize: '0.8125rem' }}>
                    +1 {m.plusOneName}
                  </Typography>
                )}
                <Button
                  onClick={() => onSelect(m.id)}
                  sx={{
                    mt: 1,
                    backgroundColor: primaryColor,
                    color: buttonFontColor,
                    borderRadius: RADII.md,
                    px: 3,
                    py: 1.25,
                    minWidth: 160,
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: primaryColor,
                      filter: 'brightness(0.95)',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Select
                </Button>
                <Divider sx={{ borderColor: `${fontColor}20`, mt: 1.5 }} />
              </Box>
            ))}
          </Stack>
        </motion.div>
      )}
    </Stack>
  );
}
