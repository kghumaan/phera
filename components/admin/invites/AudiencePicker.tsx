'use client';

/**
 * Audience selector for a campaign. Three modes:
 *   - "all": every guest with a phone number
 *   - "tags": guests whose tags intersect with the chosen tag set
 *   - "specific": manual checkbox selection
 *
 * Filters out guests without a phone — wa.me links need one.
 */

import { useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraChip } from '@/components/shared/Chip';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { getTagColor } from '@/lib/utils/tag-color';

export interface AudienceGuest {
  id: string;
  name: string;
  phone: string | null;
  tags: string[];
  outreach_status?: string | null;
}

export type AudienceMode = 'all' | 'tags' | 'specific';

export interface AudienceSelection {
  mode: AudienceMode;
  tags: string[];
  guestIds: string[];
}

export interface AudiencePickerProps {
  guests: AudienceGuest[];
  value: AudienceSelection;
  onChange: (next: AudienceSelection) => void;
}

export function resolveAudience(guests: AudienceGuest[], sel: AudienceSelection): AudienceGuest[] {
  const withPhone = guests.filter((g) => g.phone && g.phone.trim().length > 0);
  if (sel.mode === 'all') return withPhone;
  if (sel.mode === 'tags') {
    if (sel.tags.length === 0) return [];
    return withPhone.filter((g) => g.tags.some((t) => sel.tags.includes(t)));
  }
  return withPhone.filter((g) => sel.guestIds.includes(g.id));
}

export function AudiencePicker({ guests, value, onChange }: AudiencePickerProps) {
  const [search, setSearch] = useState('');

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const g of guests) g.tags.forEach((t) => set.add(t));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [guests]);

  const filteredGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    const withPhone = guests.filter((g) => g.phone);
    if (!q) return withPhone;
    return withPhone.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.phone || '').toLowerCase().includes(q),
    );
  }, [guests, search]);

  const toggleTag = (tag: string) => {
    const next = value.tags.includes(tag)
      ? value.tags.filter((t) => t !== tag)
      : [...value.tags, tag];
    onChange({ ...value, tags: next });
  };

  const toggleGuest = (id: string) => {
    const next = value.guestIds.includes(id)
      ? value.guestIds.filter((x) => x !== id)
      : [...value.guestIds, id];
    onChange({ ...value, guestIds: next });
  };

  const selectedCount = resolveAudience(guests, value).length;
  const missingPhone = guests.filter((g) => !g.phone).length;

  return (
    <Box>
      <RadioGroup
        value={value.mode}
        onChange={(e) => onChange({ ...value, mode: e.target.value as AudienceMode })}
      >
        <FormControlLabel
          value="all"
          control={<Radio sx={{ color: COLORS.border.default, '&.Mui-checked': { color: COLORS.brand.primary } }} />}
          label={
            <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
              Everyone with a phone number
            </Typography>
          }
        />
        <FormControlLabel
          value="tags"
          control={<Radio sx={{ color: COLORS.border.default, '&.Mui-checked': { color: COLORS.brand.primary } }} />}
          label={
            <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
              Guests with specific tags
            </Typography>
          }
        />
        <FormControlLabel
          value="specific"
          control={<Radio sx={{ color: COLORS.border.default, '&.Mui-checked': { color: COLORS.brand.primary } }} />}
          label={
            <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
              Pick guests manually
            </Typography>
          }
        />
      </RadioGroup>

      {value.mode === 'tags' && (
        <Box sx={{ mt: 1.5 }}>
          {allTags.length === 0 ? (
            <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
              No tags yet — add some on the guest list first.
            </Typography>
          ) : (
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {allTags.map((t) => {
                const active = value.tags.includes(t);
                const c = getTagColor(t);
                return (
                  <PheraChip
                    key={t}
                    tone="neutral"
                    label={t}
                    size="small"
                    onClick={() => toggleTag(t)}
                    sx={{
                      cursor: 'pointer',
                      ...(active && {
                        bgcolor: c.bg,
                        color: c.fg,
                        border: `1px solid ${c.border}`,
                      }),
                    }}
                  />
                );
              })}
            </Stack>
          )}
        </Box>
      )}

      {value.mode === 'specific' && (
        <Box sx={{ mt: 1.5 }}>
          <PheraTextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests by name or phone"
            size="small"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: COLORS.text.faint }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Box
            sx={{
              mt: 1,
              maxHeight: 240,
              overflowY: 'auto',
              border: `1px solid ${COLORS.border.faint}`,
              borderRadius: RADII.md,
              bgcolor: COLORS.bg.white,
            }}
          >
            {filteredGuests.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
                  No matching guests with a phone number.
                </Typography>
              </Box>
            ) : (
              filteredGuests.map((g) => {
                const checked = value.guestIds.includes(g.id);
                return (
                  <Box
                    key={g.id}
                    onClick={() => toggleGuest(g.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.25,
                      py: 0.75,
                      cursor: 'pointer',
                      borderBottom: `1px solid ${COLORS.border.faint}`,
                      '&:last-child': { borderBottom: 'none' },
                      '&:hover': { bgcolor: COLORS.bg.muted },
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={checked}
                      sx={{
                        color: COLORS.border.default,
                        '&.Mui-checked': { color: COLORS.brand.primary },
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                        {g.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                        {g.phone}
                      </Typography>
                    </Box>
                    {g.tags.slice(0, 2).map((t) => (
                      <PheraChip key={t} tone="neutral" label={t} size="small" />
                    ))}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      )}

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
        <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
          {selectedCount} recipient{selectedCount === 1 ? '' : 's'}
        </Typography>
        {missingPhone > 0 && (
          <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
            · {missingPhone} guest{missingPhone === 1 ? '' : 's'} skipped (no phone)
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

export default AudiencePicker;
