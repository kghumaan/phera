'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  DialogActions,
  DialogContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS } from '@/lib/theme/tokens';
import { supabase } from '@/lib/supabase/client';

export interface GroupGuestsDialogGuest {
  id: string;
  name: string;
  phone: string | null;
  logistics_data: Record<string, unknown> | null;
}

export interface GroupGuestsDialogProps {
  open: boolean;
  onClose: () => void;
  selected: GroupGuestsDialogGuest[];
  onCreated: () => void;
}

/**
 * Group N selected guests into one party. The primary keeps their row;
 * everyone else is absorbed into the primary's logistics_data as
 * plus_one_name (first extra) + additional_guests[] (rest), and their
 * standalone guest rows are deleted. Phones come along too. Party size
 * is bumped to match.
 */
export function GroupGuestsDialog({
  open,
  onClose,
  selected,
  onCreated,
}: GroupGuestsDialogProps) {
  const [primaryId, setPrimaryId] = useState<string>(selected[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPrimaryId(selected[0]?.id ?? '');
      setError(null);
    }
  }, [open, selected]);

  const handleCreate = async () => {
    if (!primaryId || selected.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const primary = selected.find((g) => g.id === primaryId);
      if (!primary) throw new Error('primary not found');
      const extras = selected.filter((g) => g.id !== primaryId);

      // Merge extras into primary's logistics_data. First extra → plus_one,
      // remaining → additional_guests array.
      const ld: Record<string, unknown> = { ...(primary.logistics_data ?? {}) };
      const [first, ...rest] = extras;
      ld.plus_one_name = first.name;
      ld.plus_one_phone = first.phone || null;

      // Append rest to existing additional_guests if any (preserve previous).
      const existingAdditional = Array.isArray(ld.additional_guests)
        ? (ld.additional_guests as Array<{ name?: string | null; phone?: string | null }>)
        : [];
      ld.additional_guests = [
        ...existingAdditional,
        ...rest.map((g) => ({ name: g.name, phone: g.phone })),
      ];

      // Bump party_size — primary + 1 plus-one + N additional.
      ld.party_size = 1 + 1 + (ld.additional_guests as unknown[]).length;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated supabase types omit the JSON shape
      const { error: updateErr } = await (supabase as any)
        .from('guests')
        .update({ logistics_data: ld })
        .eq('id', primary.id);
      if (updateErr) throw new Error(updateErr.message);

      const extraIds = extras.map((g) => g.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: delErr } = await (supabase as any)
        .from('guests')
        .delete()
        .in('id', extraIds);
      if (delErr) throw new Error(delErr.message);

      onCreated();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to group');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PheraDialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <PheraDialogTitle onClose={busy ? undefined : onClose}>
        Group {selected.length} guests
      </PheraDialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
            Pick the primary contact. The others become plus-ones on the
            primary&apos;s row, and their standalone rows are removed.
            Outreach + RSVP go to the primary only.
          </Typography>

          <Box>
            <Typography
              variant="body2"
              sx={{ color: COLORS.text.strong, fontWeight: 600, mb: 1 }}
            >
              Primary contact
            </Typography>
            <RadioGroup
              value={primaryId}
              onChange={(e) => setPrimaryId(e.target.value)}
            >
              {selected.map((g) => (
                <FormControlLabel
                  key={g.id}
                  value={g.id}
                  control={
                    <Radio
                      size="small"
                      sx={{ '&.Mui-checked': { color: COLORS.brand.primary } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
                        {g.name}
                      </Typography>
                      {g.phone && (
                        <Typography variant="body2" sx={{ color: COLORS.text.faint, fontSize: '0.8125rem' }}>
                          {g.phone}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </Box>

          {error && (
            <Typography variant="body2" sx={{ color: COLORS.accent.dangerText }}>
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <SecondaryActionButton onClick={onClose} disabled={busy}>
          Cancel
        </SecondaryActionButton>
        <PrimaryActionButton
          onClick={handleCreate}
          disabled={busy || !primaryId || selected.length < 2}
        >
          {busy ? 'Grouping…' : 'Group together'}
        </PrimaryActionButton>
      </DialogActions>
    </PheraDialog>
  );
}

export default GroupGuestsDialog;
