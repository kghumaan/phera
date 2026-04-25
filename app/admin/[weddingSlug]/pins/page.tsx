'use client';

import {
  Box,
  Typography,
  Button,
  Stack,
  Grid,
  TextField,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useState, useEffect, use, useCallback, useMemo } from 'react';
import { weddingService } from '@/lib/supabase/wedding-service';
import { supabase } from '@/lib/supabase/client';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';
import { BACKGROUNDS, BACKGROUND_UI_OPTIONS } from '@/lib/constants/images';
import { usePlan } from '@/lib/contexts/PlanContext';
import ProBadge from '@/components/admin/ProBadge';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import { useNavigationGuard } from '@/lib/contexts/NavigationGuardContext';
import ProSelectionsModal, { ProSelection } from '@/components/admin/ProSelectionsModal';
import ContinueButton from '@/components/admin/ContinueButton';
import { COLORS, RADII, FONTS } from '@/lib/theme/tokens';
import { PageHeading } from '@/components/shared/PageHeading';
import { PheraCard } from '@/components/shared/Card';
import { PheraPasswordField } from '@/components/shared/PasswordField';
import { EmptyState } from '@/components/shared/EmptyState';
import { SecondaryActionButton } from '@/components/admin/ActionButton';
import { EventBusy } from '@mui/icons-material';

const textFieldSx = ENHANCED_TEXT_FIELD_SX;
const BACKGROUND_OPTIONS = BACKGROUND_UI_OPTIONS;
const FREE_BACKGROUND_COUNT = 4;

// ── Types ────────────────────────────────────────────────────────────────

interface MatrixGuest {
  id: string;
  name: string;
  logistics_data: { plus_one_name?: string | null; party_size?: number } & Record<string, unknown> | null;
}

interface MatrixEvent {
  id: string;
  name: string;
  date: string | null;
  order_index: number | null;
}

function getPlusOneName(g: MatrixGuest): string | null {
  const ld = g.logistics_data;
  const raw = ld && typeof ld.plus_one_name === 'string' ? ld.plus_one_name.trim() : '';
  return raw || null;
}

function getPartySize(g: MatrixGuest): number {
  const ld = g.logistics_data;
  const n = ld && typeof ld.party_size === 'number' ? ld.party_size : 0;
  return n > 0 ? n : 1;
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function EventAccessPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const { user: authUser } = useAuth();
  const { isViewOnly } = useAdminRole();
  const { showStatus } = useAutoSaveStatus();
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);

  // Password state
  const [password, setPassword] = useState('');
  const [initialPassword, setInitialPassword] = useState('');

  // Matrix state
  const [guests, setGuests] = useState<MatrixGuest[]>([]);
  const [events, setEvents] = useState<MatrixEvent[]>([]);
  const [uninvited, setUninvited] = useState<Set<string>>(new Set()); // keys: `${guestId}|${eventId}`
  const [matrixSearch, setMatrixSearch] = useState('');

  // Lock screen design state
  const [pinEntryText, setPinEntryText] = useState('');
  const [pinEntrySubtitleText, setPinEntrySubtitleText] = useState('');
  const [pinEntryBackground, setPinEntryBackground] = useState<string>(BACKGROUNDS.BLUE_CLOUDS);
  const [customPinEntryBackground, setCustomPinEntryBackground] = useState<string | null>(null);
  const [visiblePinBgs, setVisiblePinBgs] = useState(8);
  const [initialLockScreenData, setInitialLockScreenData] = useState<Record<string, unknown> | null>(null);
  const [isLockScreenDirty, setIsLockScreenDirty] = useState(false);

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [proSelections, setProSelections] = useState<ProSelection[]>([]);
  const { registerGuard, unregisterGuard } = useNavigationGuard();

  // ── Save: wedding password ──────────────────────────────────────────────
  const savePassword = useCallback(async () => {
    if (isViewOnly || !weddingId) return;
    const trimmed = password.trim();
    if (trimmed === initialPassword) return;
    const ok = await weddingService.setWeddingPassword(weddingId, trimmed);
    if (!ok) throw new Error('Save failed');
    setInitialPassword(trimmed);
  }, [weddingId, password, initialPassword, isViewOnly]);

  const { saveStatus: passwordSaveStatus, debouncedSave: debouncedPasswordSave } = useAutoSave({
    onSave: savePassword,
    enabled: !!authUser,
  });

  useEffect(() => {
    if (password !== initialPassword) debouncedPasswordSave();
  }, [password, initialPassword, debouncedPasswordSave]);

  // ── Save: lock screen ───────────────────────────────────────────────────
  const saveLockScreenDesign = useCallback(async () => {
    if (isViewOnly || !weddingId) return;
    if (!isPro) {
      const pinBgIndex = BACKGROUND_OPTIONS.findIndex(bg => bg.url === pinEntryBackground);
      if (pinBgIndex >= FREE_BACKGROUND_COUNT && !customPinEntryBackground) return;
    }
    const pinBackgroundToUse = customPinEntryBackground || pinEntryBackground;
    const result = await weddingService.updateWedding(weddingId, {
      pin_entry_text: pinEntryText,
      pin_entry_subtitle_text: pinEntrySubtitleText,
      pin_entry_background: pinBackgroundToUse,
    });
    if (!result) throw new Error('Save failed');
    await weddingService.markUnpublishedChanges(weddingId);
    setInitialLockScreenData({
      pin_entry_text: pinEntryText,
      pin_entry_subtitle_text: pinEntrySubtitleText,
      pin_entry_background: pinBackgroundToUse,
    });
    setIsLockScreenDirty(false);
  }, [weddingId, isPro, pinEntryText, pinEntrySubtitleText, pinEntryBackground, customPinEntryBackground, isViewOnly]);

  const { debouncedSave: debouncedLockScreenSave } = useAutoSave({
    onSave: saveLockScreenDesign,
    enabled: !!authUser,
  });

  useEffect(() => {
    if (initialLockScreenData) {
      const currentData = {
        pin_entry_text: pinEntryText,
        pin_entry_subtitle_text: pinEntrySubtitleText,
        pin_entry_background: pinEntryBackground,
      };
      const dirty = JSON.stringify(currentData) !== JSON.stringify(initialLockScreenData);
      setIsLockScreenDirty(dirty);
      if (dirty) debouncedLockScreenSave();
    }
  }, [pinEntryText, pinEntrySubtitleText, pinEntryBackground, initialLockScreenData, debouncedLockScreenSave]);

  // Real-time preview sync
  useEffect(() => {
    if (!weddingId) return;
    const timer = setTimeout(() => {
      const channel = new BroadcastChannel('phera-design-sync');
      channel.postMessage({
        type: 'DESIGN_UPDATE',
        weddingId,
        updates: {
          pin_entry_text: pinEntryText,
          pin_entry_subtitle_text: pinEntrySubtitleText,
          pin_entry_background: customPinEntryBackground || pinEntryBackground,
        },
      });
      channel.close();
    }, 300);
    return () => clearTimeout(timer);
  }, [weddingId, pinEntryText, pinEntrySubtitleText, pinEntryBackground, customPinEntryBackground]);

  // Pro-gate navigation guard for premium backgrounds
  useEffect(() => {
    if (isPro) return;
    const getProSelections = () => {
      const sels: ProSelection[] = [];
      const bgIndex = BACKGROUND_OPTIONS.findIndex(bg => bg.url === pinEntryBackground);
      if (bgIndex >= FREE_BACKGROUND_COUNT && !customPinEntryBackground) {
        sels.push({ category: 'Pin Entry Background', name: BACKGROUND_OPTIONS[bgIndex].name });
      }
      return sels;
    };
    registerGuard(() => {
      const sels = getProSelections();
      if (sels.length > 0) {
        setProSelections(sels);
        setProModalOpen(true);
        return false;
      }
      return true;
    });
    return () => unregisterGuard();
  }, [isPro, pinEntryBackground, customPinEntryBackground, registerGuard, unregisterGuard]);

  useEffect(() => {
    if (isPro) return;
    const handler = (e: BeforeUnloadEvent) => {
      const bgIndex = BACKGROUND_OPTIONS.findIndex(bg => bg.url === pinEntryBackground);
      if (bgIndex >= FREE_BACKGROUND_COUNT && !customPinEntryBackground) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isPro, pinEntryBackground, customPinEntryBackground]);

  // ── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const wedding = await weddingService.getWeddingBySlug(weddingSlug);
        if (!wedding) return;
        setWeddingId(wedding.id);

        // Wedding password
        const existingPw = await weddingService.getWeddingPassword(wedding.id);
        setPassword(existingPw || '');
        setInitialPassword(existingPw || '');

        // Events
        const weddingEvents = await weddingService.getWeddingEvents(wedding.id);
        setEvents(
          weddingEvents.map((e: { id: string; name: string; date?: string | null; order_index?: number | null }) => ({
            id: e.id,
            name: e.name,
            date: e.date ?? null,
            order_index: e.order_index ?? null,
          })),
        );

        // Guests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- guests fields here aren't captured by generated supabase types
        const { data: guestsData, error: guestsErr } = await (supabase as any)
          .from('guests')
          .select('id, name, logistics_data, created_at')
          .eq('wedding_id', weddingSlug)
          .order('name', { ascending: true });
        if (guestsErr) console.error('guests load error:', guestsErr);
        setGuests((guestsData || []) as MatrixGuest[]);

        // Existing uninvited rows
        const accessRows = await weddingService.listGuestEventAccess(wedding.id);
        const next = new Set<string>();
        for (const row of accessRows) {
          if (row.invited === false) next.add(`${row.guest_id}|${row.event_id}`);
        }
        setUninvited(next);

        // Lock screen design
        const defaultText = "You're invited!";
        const defaultSubtitle = 'Enter your invitation code to see all the details and RSVP for our celebration';
        setPinEntryText(wedding.pin_entry_text || defaultText);
        setPinEntrySubtitleText(wedding.pin_entry_subtitle_text || defaultSubtitle);
        setPinEntryBackground(wedding.pin_entry_background || BACKGROUNDS.BLUE_CLOUDS);
        setInitialLockScreenData({
          pin_entry_text: wedding.pin_entry_text || defaultText,
          pin_entry_subtitle_text: wedding.pin_entry_subtitle_text || defaultSubtitle,
          pin_entry_background: wedding.pin_entry_background || BACKGROUNDS.BLUE_CLOUDS,
        });
      } catch (err) {
        console.error('Error loading event access page:', err);
        showStatus('error');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingSlug]);

  // ── Matrix interactions ─────────────────────────────────────────────────
  const isInvited = useCallback(
    (guestId: string, eventId: string) => !uninvited.has(`${guestId}|${eventId}`),
    [uninvited],
  );

  const persistInvite = async (guestId: string, eventId: string, nextInvited: boolean) => {
    if (!weddingId) return;
    const ok = await weddingService.setGuestEventInvited(weddingId, guestId, eventId, nextInvited);
    if (!ok) {
      showStatus('error');
      // Revert on failure
      setUninvited(prev => {
        const copy = new Set(prev);
        const key = `${guestId}|${eventId}`;
        if (nextInvited) copy.add(key);
        else copy.delete(key);
        return copy;
      });
    } else {
      showStatus('saved');
    }
  };

  const toggleCell = (guestId: string, eventId: string) => {
    if (isViewOnly) return;
    const key = `${guestId}|${eventId}`;
    const currentlyInvited = !uninvited.has(key);
    const next = !currentlyInvited;
    setUninvited(prev => {
      const copy = new Set(prev);
      if (next) copy.delete(key);
      else copy.add(key);
      return copy;
    });
    persistInvite(guestId, eventId, next);
  };

  const toggleColumn = (eventId: string, nextInvited: boolean) => {
    if (isViewOnly || !weddingId) return;
    const targets = filteredGuests.map(g => g.id);
    setUninvited(prev => {
      const copy = new Set(prev);
      for (const gid of targets) {
        const key = `${gid}|${eventId}`;
        if (nextInvited) copy.delete(key);
        else copy.add(key);
      }
      return copy;
    });
    (async () => {
      for (const gid of targets) {
        await weddingService.setGuestEventInvited(weddingId, gid, eventId, nextInvited);
      }
      showStatus('saved');
    })();
  };

  const filteredGuests = useMemo(() => {
    const q = matrixSearch.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(g => {
      if (g.name?.toLowerCase().includes(q)) return true;
      const pon = getPlusOneName(g);
      if (pon && pon.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [guests, matrixSearch]);

  const columnAllInvited = (eventId: string) =>
    filteredGuests.every(g => isInvited(g.id, eventId));

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200 }}>
        <LoadingSpinner message="Loading event access..." />
      </Box>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <PageHeading
          title="Event Access"
          subtitle="Set a single password for your wedding website, then pick which events each guest is invited to."
        />

        {/* ── Wedding Password ────────────────────────────────────────── */}
        <PheraCard variant="default" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong, mb: 0.5 }}>
            Wedding Password
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2.5 }}>
            Guests enter this password to access your wedding website. Share it via WhatsApp or the invitation you send.
          </Typography>
          <PheraPasswordField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="e.g., lotus2026"
            fullWidth
            size="small"
            showCopy
            adminStyle
            disabled={isViewOnly}
            helperText={
              passwordSaveStatus === 'saving'
                ? 'Saving…'
                : passwordSaveStatus === 'saved'
                  ? 'Saved'
                  : passwordSaveStatus === 'error'
                    ? 'Save failed — try again'
                    : 'Letters + numbers only. Keep it short and memorable.'
            }
          />
        </PheraCard>

        {/* ── Event Invitations Matrix ───────────────────────────────── */}
        <PheraCard variant="default" sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong, mb: 0.5 }}>
                Event Invitations
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                By default, everyone is invited to every event. Uncheck to exclude a guest from a specific event.
              </Typography>
            </Box>
            {guests.length > 0 && events.length > 0 && (
              <TextField
                size="small"
                placeholder="Search by name"
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                sx={{ ...textFieldSx, minWidth: 240 }}
              />
            )}
          </Stack>

          {guests.length === 0 ? (
            <EmptyState
              icon={<EventBusy sx={{ fontSize: 40 }} />}
              title="No guests yet"
              subtitle="Add guests from the Guest List page to start assigning event invitations."
              action={
                <SecondaryActionButton href={`/admin/${weddingSlug}/guest-list`}>
                  Go to Guest List
                </SecondaryActionButton>
              }
            />
          ) : events.length === 0 ? (
            <EmptyState
              icon={<EventBusy sx={{ fontSize: 40 }} />}
              title="No events yet"
              subtitle="Add events in the Schedule page before assigning invitations."
              action={
                <SecondaryActionButton href={`/admin/${weddingSlug}/schedule`}>
                  Go to Schedule
                </SecondaryActionButton>
              }
            />
          ) : (
            <TableContainer sx={{ border: `1px solid ${COLORS.border.faint}`, borderRadius: RADII.md, overflowX: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: COLORS.bg.white, fontWeight: 600, color: COLORS.text.strong, minWidth: 240 }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ bgcolor: COLORS.bg.white, fontWeight: 600, color: COLORS.text.strong, width: 72, textAlign: 'center' }}>
                      Party
                    </TableCell>
                    {events.map(ev => {
                      const allInvited = columnAllInvited(ev.id);
                      return (
                        <TableCell
                          key={ev.id}
                          sx={{ bgcolor: COLORS.bg.white, textAlign: 'center', minWidth: 160, px: 1.5 }}
                        >
                          <Stack alignItems="center" spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '0.875rem' }}>
                              {ev.name}
                            </Typography>
                            {ev.date && (
                              <Typography variant="caption" sx={{ color: COLORS.text.subtle, fontSize: '0.875rem' }}>
                                {ev.date}
                              </Typography>
                            )}
                            <Checkbox
                              checked={allInvited}
                              onChange={() => toggleColumn(ev.id, !allInvited)}
                              size="small"
                              disabled={isViewOnly}
                              sx={{
                                p: 0.25,
                                color: COLORS.text.faint,
                                '&.Mui-checked': { color: COLORS.brand.primary },
                              }}
                            />
                          </Stack>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredGuests.map(g => {
                    const plusOne = getPlusOneName(g);
                    const party = getPartySize(g);
                    return (
                      <TableRow key={g.id} hover sx={{ '&:hover': { bgcolor: COLORS.bg.subtle } }}>
                        <TableCell sx={{ py: 1.25 }}>
                          <Typography sx={{ fontFamily: FONTS.body, fontWeight: 600, color: COLORS.text.strong, fontSize: '0.9375rem' }}>
                            {g.name}
                          </Typography>
                          {plusOne && (
                            <Typography variant="body2" sx={{ color: COLORS.text.subtle, fontSize: '0.8125rem' }}>
                              {plusOne}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', color: COLORS.text.subtle }}>
                          {party}
                        </TableCell>
                        {events.map(ev => {
                          const checked = isInvited(g.id, ev.id);
                          return (
                            <TableCell key={ev.id} sx={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={checked}
                                onChange={() => toggleCell(g.id, ev.id)}
                                size="small"
                                disabled={isViewOnly}
                                sx={{
                                  p: 0.25,
                                  color: COLORS.text.faint,
                                  '&.Mui-checked': { color: COLORS.brand.primary },
                                }}
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </PheraCard>

        {/* ── Lock Screen Design ─────────────────────────────────────── */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
            Lock Screen Design
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2 }}>
            Customize the appearance of the password entry screen your guests see.
          </Typography>
        </Box>

        {/* Welcome Text */}
        <PheraCard variant="muted" sx={{ p: 3, border: '1px solid rgba(0,0,0,0.07)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: COLORS.text.strong }}>
            Welcome Text
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Main Heading"
              value={pinEntryText}
              onChange={(e) => setPinEntryText(e.target.value)}
              placeholder="You're invited!"
              fullWidth
              multiline
              rows={2}
              helperText="Use {couple_name} as a placeholder for the couple's name"
              sx={textFieldSx}
            />
            <TextField
              label="Subtitle Text"
              value={pinEntrySubtitleText}
              onChange={(e) => setPinEntrySubtitleText(e.target.value)}
              placeholder="Enter your invitation code to see all the details and RSVP for our celebration"
              fullWidth
              multiline
              rows={2}
              helperText="This appears below the main heading"
              sx={textFieldSx}
            />
          </Stack>
        </PheraCard>

        {/* Background Selection */}
        <PheraCard variant="muted" sx={{ p: 3, border: '1px solid rgba(0,0,0,0.07)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: COLORS.text.strong }}>
            Background Image
          </Typography>
          <Grid container spacing={2} mb={3}>
            {BACKGROUND_OPTIONS.slice(0, visiblePinBgs).map((bg, index) => {
              const isProOption = index >= FREE_BACKGROUND_COUNT;
              return (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={`pin-bg-${bg.url}`}>
                  <Box
                    onClick={() => {
                      setPinEntryBackground(bg.url);
                      setCustomPinEntryBackground(null);
                    }}
                    sx={{
                      width: '100%',
                      aspectRatio: '1/1',
                      backgroundImage: `url(${bg.url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: 3,
                      borderColor: pinEntryBackground === bg.url && !customPinEntryBackground ? COLORS.brand.primary : 'transparent',
                      transition: 'all 0.2s',
                      position: 'relative',
                      '&:hover': {
                        borderColor: COLORS.brand.primary,
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    {isProOption && !isPro && <ProBadge position="corner" />}
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    {bg.name}
                  </Typography>
                </Grid>
              );
            })}
          </Grid>
          <Stack direction="row" spacing={2} mb={3} justifyContent="center">
            {visiblePinBgs < BACKGROUND_OPTIONS.length && (
              <Button
                onClick={() => setVisiblePinBgs((prev: number) => Math.min(prev + 8, BACKGROUND_OPTIONS.length))}
                variant="outlined"
                sx={{ color: COLORS.brand.primary, borderColor: COLORS.brand.primary, '&:hover': { borderColor: COLORS.brand.primary, bgcolor: 'rgba(222, 63, 94, 0.04)' } }}
              >
                Show More
              </Button>
            )}
            {visiblePinBgs > 8 && (
              <Button
                onClick={() => setVisiblePinBgs(8)}
                variant="text"
                sx={{ color: COLORS.text.subtle }}
              >
                Show Less
              </Button>
            )}
          </Stack>
          {weddingId && (
            <ImageUpload
              label="Upload Custom Background"
              value={customPinEntryBackground}
              onChange={(url) => {
                setCustomPinEntryBackground(url);
                if (url) setPinEntryBackground('');
              }}
              path={getWeddingImagePath(weddingId, 'backgrounds')}
              helperText="Upload your own background image (recommended: 1920x1080px)"
              aspectRatio="16/9"
              maxWidth={600}
            />
          )}
        </PheraCard>

        {/* Pro Selections Modal */}
        <ProSelectionsModal
          open={proModalOpen}
          selections={proSelections}
          onCancel={() => setProModalOpen(false)}
          onUpgrade={() => {
            setProModalOpen(false);
            setUpgradeModalOpen(true);
          }}
        />

        {/* Upgrade Modal */}
        <UpgradeModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
        />
      </Stack>
      <ContinueButton weddingSlug={weddingSlug} currentSection="pins" weddingId={weddingId} />
    </Box>
  );
}
