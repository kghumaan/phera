'use client';

/**
 * Admin tab for the WhatsApp Bot page. Captures the phone numbers the bot
 * accepts requests from (the bride, groom, planner, family liaison, etc.)
 * and renders the bot's recent activity log underneath.
 *
 * Storage: wedding_bot_admins (the phone list) + bot_admin_log (the
 * activity feed) — both keyed by wedding slug, RLS-locked. See
 * supabase/migrations/20260501_whatsapp_bot_admins.sql.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Delete, AdminPanelSettings, History } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { toast } from 'sonner';
import { PheraCard } from '@/components/shared/Card';
import { PheraTextField } from '@/components/shared/TextField';
import { PheraChip } from '@/components/shared/Chip';
import { EmptyState } from '@/components/shared/EmptyState';
import { SectionHeading } from '@/components/shared/PageHeading';
import {
  PrimaryActionButton,
  SecondaryActionButton,
} from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface BotAdmin {
  id: string;
  name: string;
  phone: string;
  created_at: string;
}

interface BotLogEntry {
  id: string;
  admin_phone: string | null;
  admin_name: string | null;
  action_type: string;
  summary: string;
  status: 'pending' | 'success' | 'failed';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function statusTone(s: BotLogEntry['status']): 'success' | 'warning' | 'danger' {
  if (s === 'success') return 'success';
  if (s === 'failed') return 'danger';
  return 'warning';
}

export default function AdminTab({ weddingSlug }: { weddingSlug: string }) {
  const [admins, setAdmins] = useState<BotAdmin[]>([]);
  const [log, setLog] = useState<BotLogEntry[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingLog, setLoadingLog] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAdmins = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp-bot/admins?weddingSlug=${encodeURIComponent(weddingSlug)}`);
      const data = await res.json();
      if (res.ok) setAdmins(data.admins || []);
    } catch (err) {
      console.error('admin tab: load admins failed', err);
    } finally {
      setLoadingAdmins(false);
    }
  }, [weddingSlug]);

  const loadLog = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp-bot/log?weddingSlug=${encodeURIComponent(weddingSlug)}`);
      const data = await res.json();
      if (res.ok) setLog(data.entries || []);
    } catch (err) {
      console.error('admin tab: load log failed', err);
    } finally {
      setLoadingLog(false);
    }
  }, [weddingSlug]);

  useEffect(() => {
    loadAdmins();
    loadLog();
  }, [loadAdmins, loadLog]);

  const handleAdd = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/whatsapp-bot/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingSlug,
          name: newName.trim(),
          phone: newPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || 'Could not add admin');
        return;
      }
      setAdmins((prev) => [...prev, data.admin]);
      setNewName('');
      setNewPhone('');
      setShowForm(false);
      toast.success(`Added ${data.admin.name} as a bot admin`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = admins;
    // Optimistic — drop the row immediately, restore on failure.
    setAdmins((prev) => prev.filter((a) => a.id !== id));
    try {
      const res = await fetch(
        `/api/whatsapp-bot/admins?id=${id}&weddingSlug=${encodeURIComponent(weddingSlug)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Could not remove admin');
        setAdmins(previous);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Network error');
      setAdmins(previous);
    }
  };

  return (
    <Stack spacing={4}>
      {/* ─── Admins list ─── */}
      <Box>
        <SectionHeading title="Bot Admins" />
        <Typography variant="body2" sx={{ mt: 0.5, color: COLORS.text.muted, lineHeight: 1.6 }}>
          These are the WhatsApp numbers the Bot accepts requests from. The bride, groom, planner, or anyone you trust to update the website, task manager, or knowledge bank by texting the bot.
        </Typography>

        <Box sx={{ mt: 2 }}>
          {loadingAdmins ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: COLORS.brand.primary }} />
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {admins.map((a) => (
                <PheraCard
                  key={a.id}
                  variant="default"
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: alpha(COLORS.brand.primary, 0.1),
                      color: COLORS.brand.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AdminPanelSettings sx={{ fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
                      {a.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                      {a.phone}
                    </Typography>
                  </Box>
                  <Tooltip title="Remove admin">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(a.id)}
                      sx={{ color: COLORS.text.subtle, '&:hover': { color: COLORS.brand.primary } }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </PheraCard>
              ))}

              {/* Inline add tile — same dashed pattern as Add Minor Event in Schedule.
                  Capped at 400px so it doesn't sprawl across a full-width tab. */}
              {!showForm ? (
                <Box
                  onClick={() => setShowForm(true)}
                  sx={{
                    maxWidth: 400,
                    bgcolor: COLORS.border.light,
                    border: '1px dashed #BCBCBC',
                    borderRadius: RADII.sm,
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                    textAlign: 'center',
                    '&:hover': { bgcolor: COLORS.border.default, borderColor: COLORS.text.faint },
                  }}
                >
                  <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1rem', lineHeight: 1.5 }}>
                    Add Admin
                  </Typography>
                  <Typography sx={{ color: COLORS.text.subtle, fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Authorize a phone number to drive the bot
                  </Typography>
                </Box>
              ) : (
                <PheraCard variant="default" sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      alignItems="stretch"
                    >
                      <PheraTextField
                        label="Name"
                        placeholder="e.g. Priya Sharma"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        size="small"
                        fullWidth
                        autoFocus
                      />
                      <PheraTextField
                        label="Phone"
                        placeholder="+1 555 123 4567"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        size="small"
                        fullWidth
                        type="tel"
                        inputMode="tel"
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <SecondaryActionButton
                        onClick={() => {
                          setShowForm(false);
                          setNewName('');
                          setNewPhone('');
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </SecondaryActionButton>
                      <PrimaryActionButton
                        onClick={handleAdd}
                        disabled={!newName.trim() || !newPhone.trim() || saving}
                        loading={saving}
                      >
                        Save
                      </PrimaryActionButton>
                    </Stack>
                  </Stack>
                </PheraCard>
              )}
            </Stack>
          )}
        </Box>
      </Box>

      {/* ─── Activity log ─── */}
      <Box>
        <SectionHeading
          title="Bot Activity"
          actions={
            <Stack direction="row" alignItems="center" spacing={1}>
              <History sx={{ fontSize: 18, color: COLORS.text.faint }} />
              <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
                Last 100 actions
              </Typography>
            </Stack>
          }
        />
        <Box sx={{ mt: 1.5 }}>
          {loadingLog ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: COLORS.brand.primary }} />
            </Box>
          ) : log.length === 0 ? (
            <EmptyState
              icon={<History sx={{ fontSize: 40 }} />}
              title="No bot activity yet"
              subtitle="Once an admin texts the bot to make a change, you'll see it here with a status."
            />
          ) : (
            <Stack spacing={1}>
              {log.map((entry) => (
                <PheraCard key={entry.id} variant="default" sx={{ p: 1.5 }}>
                  <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
                          {entry.summary}
                        </Typography>
                        <PheraChip
                          label={entry.status}
                          size="small"
                          tone={statusTone(entry.status)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 0.25, color: COLORS.text.faint, fontSize: '0.8125rem' }}>
                        {entry.admin_name || entry.admin_phone || 'Unknown admin'} · {entry.action_type} · {formatRelative(entry.created_at)}
                      </Typography>
                      {entry.error_message && (
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.5, color: COLORS.accent.dangerText, fontSize: '0.8125rem' }}
                        >
                          {entry.error_message}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </PheraCard>
              ))}
            </Stack>
          )}
        </Box>
      </Box>
    </Stack>
  );
}
