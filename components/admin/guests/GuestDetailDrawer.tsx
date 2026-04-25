'use client';

/**
 * Right-side slide-in drawer for editing a single guest's details. Replaces
 * inline cell editing for everything except the Tags column — the couple gets
 * a full form with primary guest + plus one + party size, tabbed alongside a
 * read-only RSVP summary.
 *
 * Save writes to guests row directly (name, email, phone) and merges
 * plus_one_name + party_size into logistics_data. Tag editing stays out of
 * this drawer — it's the one thing that stays interactive on the row.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
  Divider,
} from '@mui/material';
import { Close, Add as AddIcon, CheckCircle, Cancel as CancelIcon, HelpOutline, MailOutline } from '@mui/icons-material';
import { supabase } from '@/lib/supabase/client';
import { PheraTextField } from '@/components/shared/TextField';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, FONTS, RADII, SHADOWS } from '@/lib/theme/tokens';

// ─── Types ────────────────────────────────────────────────────────

export interface AdditionalGuest {
  name: string;
  phone: string;
}

export interface GuestDetailRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  logistics_data:
  | ({
    plus_one_name?: string | null;
    plus_one_phone?: string | null;
    /** Extra named companions beyond the primary + plus one. Each row
     *  surfaces independently in the guest-list Name + Phone columns. */
    additional_guests?: AdditionalGuest[];
    party_size?: number;
  } & Record<string, unknown>)
  | null;
  rsvps?: Array<{
    attending: 'yes' | 'no' | 'maybe' | '' | null;
    guest_count: number | null;
    plus_one: boolean | null;
    created_at: string | null;
  }> | null;
}

export interface GuestDetailDrawerProps {
  open: boolean;
  guest: GuestDetailRecord | null;
  onClose: () => void;
  onSaved: (updated: GuestDetailRecord) => void;
}

// Split a full name into first + last the same way the guest-list rows do
// (multi-word last names stay together).
function splitName(full: string): { first: string; last: string } {
  const trimmed = (full || '').trim();
  if (!trimmed) return { first: '', last: '' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

function joinName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(' ');
}

// ─── RSVP summary styling (mirrors the guest-list Status chip tokens) ────

const RSVP_META = {
  attending: { label: 'Attending', fg: COLORS.accent.successText, bg: COLORS.accent.successBg, Icon: CheckCircle },
  not_attending: { label: 'Not attending', fg: COLORS.accent.dangerText, bg: COLORS.accent.dangerBg, Icon: CancelIcon },
  maybe: { label: 'Maybe', fg: COLORS.accent.warningText, bg: COLORS.accent.warningBg, Icon: HelpOutline },
  no_response: { label: 'No response yet', fg: COLORS.text.subtle, bg: COLORS.bg.subtle, Icon: MailOutline },
} as const;

type RsvpStatusKey = keyof typeof RSVP_META;

function latestRsvp(guest: GuestDetailRecord): { status: RsvpStatusKey; guest_count: number | null; plus_one: boolean | null; when: string | null } {
  const rsvps = guest.rsvps ?? [];
  if (rsvps.length === 0) {
    return { status: 'no_response', guest_count: null, plus_one: null, when: null };
  }
  const sorted = [...rsvps].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
  const r = sorted[0];
  const a = r?.attending;
  const status: RsvpStatusKey =
    a === 'yes' ? 'attending' : a === 'no' ? 'not_attending' : a === 'maybe' ? 'maybe' : 'no_response';
  return { status, guest_count: r.guest_count, plus_one: r.plus_one, when: r.created_at };
}

// ─── Component ────────────────────────────────────────────────────

export function GuestDetailDrawer({ open, guest, onClose, onSaved }: GuestDetailDrawerProps) {
  const [tab, setTab] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState<number>(1);
  const [plusOneName, setPlusOneName] = useState('');
  const [plusOnePhone, setPlusOnePhone] = useState('');
  const [additionalGuests, setAdditionalGuests] = useState<AdditionalGuest[]>([]);
  // `showPlusOne` is independent of the stored value so the couple can hide
  // the input on a guest who has no plus one without losing what they'd typed.
  const [showPlusOne, setShowPlusOne] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever a new guest is loaded into the drawer.
  useEffect(() => {
    if (!guest) return;
    const { first, last } = splitName(guest.name);
    setFirstName(first);
    setLastName(last);
    setEmail(guest.email && !guest.email.includes('@phera.io') ? guest.email : '');
    setPhone(guest.phone ?? '');
    const ld = guest.logistics_data;
    setPartySize(ld && typeof ld.party_size === 'number' && ld.party_size > 0 ? ld.party_size : 1);
    const existingPlusOne = ld && typeof ld.plus_one_name === 'string' ? ld.plus_one_name.trim() : '';
    const existingPlusOnePhone = ld && typeof ld.plus_one_phone === 'string' ? ld.plus_one_phone.trim() : '';
    setPlusOneName(existingPlusOne);
    setPlusOnePhone(existingPlusOnePhone);
    setShowPlusOne(!!existingPlusOne || !!existingPlusOnePhone);
    const rawAdditional = ld && Array.isArray(ld.additional_guests) ? ld.additional_guests : [];
    setAdditionalGuests(
      rawAdditional
        .filter((x): x is AdditionalGuest => !!x && typeof x === 'object')
        .map((x) => ({ name: (x.name ?? '').toString(), phone: (x.phone ?? '').toString() })),
    );
    setTab(0);
    setError(null);
  }, [guest]);

  const rsvp = useMemo(() => (guest ? latestRsvp(guest) : null), [guest]);

  const handleSave = async () => {
    if (!guest) return;
    const nextName = joinName(firstName, lastName);
    if (!nextName) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);

    // Merge logistics_data — preserve anything the row already has (tags etc.)
    // and only overwrite plus_one_name + party_size.
    const prevLogistics = (guest.logistics_data ?? {}) as Record<string, unknown>;
    const nextLogistics: Record<string, unknown> = { ...prevLogistics };
    const trimmedPlusOne = showPlusOne ? plusOneName.trim() : '';
    if (trimmedPlusOne) nextLogistics.plus_one_name = trimmedPlusOne;
    else delete nextLogistics.plus_one_name;
    const trimmedPlusOnePhone = showPlusOne ? plusOnePhone.trim() : '';
    if (trimmedPlusOnePhone) nextLogistics.plus_one_phone = trimmedPlusOnePhone;
    else delete nextLogistics.plus_one_phone;

    // Trim + drop empty rows; keep rows with either name or phone present.
    const cleanedAdditional = additionalGuests
      .map((x) => ({ name: x.name.trim(), phone: x.phone.trim() }))
      .filter((x) => x.name.length > 0 || x.phone.length > 0);
    if (cleanedAdditional.length > 0) nextLogistics.additional_guests = cleanedAdditional;
    else delete nextLogistics.additional_guests;

    nextLogistics.party_size = partySize > 0 ? Math.floor(partySize) : 1;

    const updates = {
      name: nextName,
      email: email.trim() ? email.trim().toLowerCase() : null,
      phone: phone.trim() || null,
      logistics_data: nextLogistics,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- guests.update() shape isn't in generated types
    const { error: dbError } = await (supabase as any)
      .from('guests')
      .update(updates)
      .eq('id', guest.id);

    setSaving(false);
    if (dbError) {
      console.error('guest update error:', dbError);
      setError(dbError.message || 'Save failed. Please try again.');
      return;
    }

    onSaved({
      ...guest,
      name: nextName,
      email: updates.email,
      phone: updates.phone,
      logistics_data: nextLogistics as GuestDetailRecord['logistics_data'],
    });
    onClose();
  };

  if (!guest) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      // Keep the portal mounted so subsequent opens avoid the initial-mount
      // cost. The drawer is small and data-light so the memory hit is fine.
      ModalProps={{ keepMounted: true }}
      // Slightly faster slide than the MUI default (225/195) so the drawer
      // feels snappier when triggered from a row click.
      transitionDuration={{ enter: 160, exit: 140 }}
      // Bump the Modal + Backdrop above the AdminTopNav AppBar (which uses
      // `zIndex.drawer + 1 = 1201`). Without this, the navbar stays lit up
      // while the rest of the page is dimmed.
      sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 460 },
          bgcolor: COLORS.bg.white,
          borderLeft: `1px solid ${COLORS.border.faint}`,
          boxShadow: SHADOWS.dialog,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${COLORS.border.faint}` }}
      >
        <Typography
          sx={{
            fontFamily: FONTS.body,
            fontSize: '2rem',
            lineHeight: 1.2,
            color: COLORS.text.strong,
            fontWeight: 'bold'
          }}
        >
          Edit guest
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <Close sx={{ color: COLORS.text.muted }} />
        </IconButton>
      </Stack>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          px: 3,
          borderBottom: `1px solid ${COLORS.border.faint}`,
          '& .MuiTab-root': {
            textTransform: 'none',
            color: COLORS.text.muted,
            fontWeight: 600,
            fontSize: '0.95rem',
            minHeight: 48,
          },
          '& .Mui-selected': { color: COLORS.brand.primary },
          '& .MuiTabs-indicator': { bgcolor: COLORS.brand.primary },
        }}
      >
        <Tab label="Guest info" />
        <Tab label="RSVPs" />
      </Tabs>

      {/* Body — flex:1 so footer sticks to bottom of drawer. */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 3 }}>
        {tab === 0 && (
          <Stack spacing={2.5}>
            <Box>
              <Typography
                variant="subtitleCaps"
                sx={{ color: COLORS.text.muted, mb: 2.5, display: 'block' }}
              >
                Primary guest
              </Typography>
              <Stack direction="row" spacing={1.25}>
                <PheraTextField
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  size="small"
                  fullWidth
                />
                <PheraTextField
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  size="small"
                  fullWidth
                />
              </Stack>
            </Box>

            {/* Email full-width, phone moves next to party size below. */}
            <PheraTextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              size="small"
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
              <PheraTextField
                label="Mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                size="small"
                fullWidth
              />
              <PheraTextField
                label="Party size"
                type="number"
                inputProps={{ min: 1, max: 20 }}
                value={partySize}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setPartySize(Number.isFinite(n) && n > 0 ? n : 1);
                }}
                size="small"
                sx={{ maxWidth: { sm: 140 }, width: { xs: '100%', sm: 140 } }}
              />
            </Stack>

            {/* Additional-guests subsection — mirrors the "PRIMARY GUEST" header
                pattern. First slot is the plus one; extra named rows (with a
                chip-style "+ Add additional guest") are tracked separately and
                surface as their own rows in the guest-list Name/Phone columns. */}
            <Box sx={{ mt: 0.5 }}>
              <Typography
                variant="subtitleCaps"
                sx={{ color: COLORS.text.muted, mb: 2.5, display: 'block' }}
              >
                Additional guests
              </Typography>
              <Stack spacing={1.25}>
                {showPlusOne ? (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                    <PheraTextField
                      label="Plus one name"
                      value={plusOneName}
                      placeholder="e.g. Aisha Mehta"
                      onChange={(e) => setPlusOneName(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <PheraTextField
                      label="Plus one phone"
                      value={plusOnePhone}
                      placeholder="+1 415 555 0199"
                      onChange={(e) => setPlusOnePhone(e.target.value)}
                      size="small"
                      fullWidth
                    />
                  </Stack>
                ) : (
                  <SecondaryActionButton
                    onClick={() => setShowPlusOne(true)}
                    startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                    sx={{ px: 2, py: 0.75, alignSelf: 'flex-start' }}
                  >
                    Add plus one
                  </SecondaryActionButton>
                )}

                {additionalGuests.map((ag, idx) => (
                  <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }}>
                    <PheraTextField
                      label={`Guest ${idx + 2} name`}
                      value={ag.name}
                      onChange={(e) =>
                        setAdditionalGuests((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)),
                        )
                      }
                      placeholder="e.g. Rohan Mehta"
                      size="small"
                      fullWidth
                    />
                    <PheraTextField
                      label={`Guest ${idx + 2} phone`}
                      value={ag.phone}
                      onChange={(e) =>
                        setAdditionalGuests((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, phone: e.target.value } : x)),
                        )
                      }
                      placeholder="+1 415 555 0198"
                      size="small"
                      fullWidth
                    />
                    <IconButton
                      size="small"
                      aria-label={`Remove guest ${idx + 2}`}
                      onClick={() =>
                        setAdditionalGuests((prev) => prev.filter((_, i) => i !== idx))
                      }
                      sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
                    >
                      <Close sx={{ fontSize: 18, color: COLORS.text.muted }} />
                    </IconButton>
                  </Stack>
                ))}

                {/* Chip-style "+ Add additional guest" button. Mirrors the
                    per-row "+ Add tag" picker trigger so the visual language
                    stays consistent across the guest-management surfaces. */}
                <Box>
                  <Button
                    onClick={() =>
                      setAdditionalGuests((prev) => [...prev, { name: '', phone: '' }])
                    }
                    endIcon={<AddIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      height: 32,
                      px: 1.5,
                      py: 0,
                      textTransform: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      borderRadius: RADII.pill,
                      border: `1px dashed ${COLORS.border.default}`,
                      color: COLORS.text.muted,
                      '&:hover': {
                        borderColor: COLORS.brand.primary,
                        color: COLORS.brand.primary,
                        borderStyle: 'solid',
                        bgcolor: COLORS.brand.primarySubtle,
                      },
                      '& .MuiButton-endIcon': { ml: 0.5 },
                    }}
                  >
                    Add additional guest
                  </Button>
                </Box>
              </Stack>
            </Box>

            {error && (
              <Typography variant="body2" sx={{ color: COLORS.accent.dangerText }}>
                {error}
              </Typography>
            )}
          </Stack>
        )}

        {tab === 1 && rsvp && (() => {
          const meta = RSVP_META[rsvp.status];
          const Icon = meta.Icon;
          return (
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: RADII.md,
                  border: `1px solid ${COLORS.border.light}`,
                  bgcolor: meta.bg,
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Icon sx={{ color: meta.fg }} />
                  <Typography sx={{ fontWeight: 700, color: meta.fg }}>
                    {meta.label}
                  </Typography>
                </Stack>
                {rsvp.when && (
                  <Typography variant="body2" sx={{ color: COLORS.text.muted, mt: 0.5 }}>
                    Received {new Date(rsvp.when).toLocaleString()}
                  </Typography>
                )}
              </Box>

              {rsvp.status === 'attending' && (
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: COLORS.text.muted }}>Party size (from RSVP)</Typography>
                    <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                      {rsvp.guest_count ?? 1}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: COLORS.text.muted }}>Bringing a plus one</Typography>
                    <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
                      {rsvp.plus_one ? 'Yes' : 'No'}
                    </Typography>
                  </Box>
                </Stack>
              )}

              {rsvp.status === 'no_response' && (
                <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                  This guest hasn&apos;t responded to their RSVP yet. Send a reminder from the Invites page.
                </Typography>
              )}
            </Stack>
          );
        })()}
      </Box>

      {/* Footer — sticky at bottom of drawer. */}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${COLORS.border.faint}`,
          bgcolor: COLORS.bg.white,
        }}
      >
        <SecondaryActionButton onClick={onClose} disabled={saving} sx={{ px: 2.5 }}>
          Cancel
        </SecondaryActionButton>
        <PrimaryActionButton
          onClick={handleSave}
          disabled={saving || !firstName.trim() && !lastName.trim()}
          sx={{ px: 2.5 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </PrimaryActionButton>
      </Stack>
    </Drawer>
  );
}

export default GuestDetailDrawer;
