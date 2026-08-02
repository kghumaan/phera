'use client';

import { Box, Stack, Typography, CircularProgress, Collapse } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import { PageHeading } from '@/components/shared/PageHeading';
import { PheraCard } from '@/components/shared/Card';
import { PheraChip } from '@/components/shared/Chip';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { AgentChatPanel } from '@/components/agent/AgentChatPanel';
import { COLORS, RADII } from '@/lib/theme/tokens';

type Scenario = 'blank' | 'populated';

interface LabAction {
  tool_name: string;
  input: unknown;
  result: unknown;
  status: string;
  risk: string;
  created_at: string;
}

interface LabStateResponse {
  wedding: Record<string, unknown>;
  guests: unknown[];
  rsvps: unknown[];
  rooms: unknown[];
  events: unknown[];
  schedule: unknown[];
  vendors: unknown[];
  faqs: unknown[];
  tasks: unknown[];
  agent: { conversations: unknown[]; messages: unknown[]; actions: LabAction[] };
}

const SLUG_STORAGE_KEY = 'phera-agent-lab-slug';

function JsonSection({ title, count, value }: { title: string; count: number; value: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ border: `1px solid ${COLORS.border.faint}`, borderRadius: `${RADII.md}px`, overflow: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onClick={() => setOpen((o) => !o)}
        sx={{ px: 1.5, py: 1, cursor: 'pointer', bgcolor: COLORS.bg.subtle }}
      >
        <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
          {title} <Typography component="span" variant="body2" sx={{ color: COLORS.text.subtle }}>({count})</Typography>
        </Typography>
        {open ? (
          <ExpandLessRoundedIcon fontSize="small" sx={{ color: COLORS.text.subtle }} />
        ) : (
          <ExpandMoreRoundedIcon fontSize="small" sx={{ color: COLORS.text.subtle }} />
        )}
      </Stack>
      <Collapse in={open}>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 1.5,
            fontSize: '0.875rem',
            lineHeight: 1.45,
            overflowX: 'auto',
            maxHeight: 320,
            overflowY: 'auto',
            color: COLORS.text.muted,
            bgcolor: COLORS.bg.white,
          }}
        >
          {JSON.stringify(value, null, 2)}
        </Box>
      </Collapse>
    </Box>
  );
}

export default function AgentLabPage() {
  const [scenario, setScenario] = useState<Scenario>('populated');
  const [slug, setSlug] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [tearingDown, setTearingDown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<LabStateResponse | null>(null);
  const [view, setView] = useState<'data' | 'actions'>('data');

  useEffect(() => {
    const saved = window.localStorage.getItem(SLUG_STORAGE_KEY);
    if (saved) setSlug(saved);
  }, []);

  const refreshState = useCallback(async (targetSlug?: string | null) => {
    const s = targetSlug ?? slug;
    if (!s) return;
    try {
      const res = await fetch(`/api/agent/lab/state?weddingSlug=${encodeURIComponent(s)}`);
      if (res.ok) {
        setState(await res.json());
        setError(null);
      } else if (res.status === 404) {
        // Wedding gone (torn down elsewhere) — clear it
        setSlug(null);
        setState(null);
        window.localStorage.removeItem(SLUG_STORAGE_KEY);
      } else {
        setError((await res.json()).error ?? 'Could not load state');
      }
    } catch {
      setError('Could not load lab state');
    }
  }, [slug]);

  useEffect(() => {
    if (slug) void refreshState(slug);
  }, [slug, refreshState]);

  const seed = useCallback(async () => {
    setSeeding(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/lab/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Seed failed');
        return;
      }
      window.localStorage.setItem(SLUG_STORAGE_KEY, data.slug);
      setState(null);
      setSlug(data.slug);
    } finally {
      setSeeding(false);
    }
  }, [scenario]);

  const teardown = useCallback(async () => {
    if (!slug) return;
    if (!window.confirm(`Tear down ${slug} and delete all its data?`)) return;
    setTearingDown(true);
    try {
      const res = await fetch(`/api/agent/lab/seed?weddingSlug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      if (res.ok || res.status === 404) {
        window.localStorage.removeItem(SLUG_STORAGE_KEY);
        setSlug(null);
        setState(null);
      } else {
        setError((await res.json()).error ?? 'Teardown failed');
      }
    } finally {
      setTearingDown(false);
    }
  }, [slug]);

  return (
    <Box sx={{ maxWidth: 1280, mx: 'auto', px: 3, py: 4 }}>
      <PageHeading
        title="Agent Lab"
        subtitle="Disposable mock weddings for end-to-end planner testing. Seed a scenario, talk to the agent, and watch exactly which tools ran and what data changed."
      />

      <PheraCard variant="muted" sx={{ p: 2.5, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <ScienceRoundedIcon sx={{ color: COLORS.brand.primary }} />
          <Stack direction="row" spacing={1}>
            {(['blank', 'populated'] as const).map((s) => (
              <PheraChip
                key={s}
                tone={scenario === s ? 'brand' : 'neutral'}
                label={s === 'blank' ? 'Blank (onboarding)' : 'Populated (24 guests, rooms, schedule)'}
                onClick={() => setScenario(s)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
          <Box sx={{ flex: 1 }} />
          <PrimaryActionButton onClick={seed} loading={seeding} disabled={seeding}>
            {slug ? 'Seed another wedding' : 'Create lab wedding'}
          </PrimaryActionButton>
          {slug && (
            <SecondaryActionButton onClick={teardown} loading={tearingDown} disabled={tearingDown}>
              Tear down
            </SecondaryActionButton>
          )}
        </Stack>
        {slug && (
          <Typography variant="body2" sx={{ color: COLORS.text.subtle, mt: 1.5 }}>
            Active: <Typography component="span" variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>{slug}</Typography>
            {' · '}
            <Typography
              component="a"
              variant="body2"
              href={`/admin/${slug}/assistant`}
              sx={{ color: COLORS.brand.primary, textDecoration: 'none' }}
            >
              open in admin →
            </Typography>
          </Typography>
        )}
        {error && (
          <Typography variant="body2" sx={{ color: COLORS.accent.dangerText, mt: 1.5 }}>
            {error}
          </Typography>
        )}
      </PheraCard>

      {slug ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 560 }}>
            <AgentChatPanel weddingSlug={slug} onTurnComplete={() => refreshState()} minHeight={560} />
          </Box>

          <PheraCard variant="default" sx={{ p: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <PheraChip
                tone={view === 'data' ? 'brand' : 'neutral'}
                label="Data"
                onClick={() => setView('data')}
                sx={{ cursor: 'pointer' }}
              />
              <PheraChip
                tone={view === 'actions' ? 'brand' : 'neutral'}
                label={`Tool actions (${state?.agent.actions.length ?? 0})`}
                onClick={() => setView('actions')}
                sx={{ cursor: 'pointer' }}
              />
              <Box sx={{ flex: 1 }} />
              <SecondaryActionButton onClick={() => refreshState()} size="small">
                Refresh
              </SecondaryActionButton>
            </Stack>

            {!state ? (
              <Stack alignItems="center" py={4}>
                <CircularProgress size={20} sx={{ color: COLORS.brand.primary }} />
              </Stack>
            ) : view === 'data' ? (
              <Stack spacing={1}>
                <JsonSection title="Wedding" count={1} value={state.wedding} />
                <JsonSection title="Guests" count={state.guests.length} value={state.guests} />
                <JsonSection title="RSVPs" count={state.rsvps.length} value={state.rsvps} />
                <JsonSection title="Rooms" count={state.rooms.length} value={state.rooms} />
                <JsonSection title="Events" count={state.events.length} value={state.events} />
                <JsonSection title="Schedule" count={state.schedule.length} value={state.schedule} />
                <JsonSection title="Vendors" count={state.vendors.length} value={state.vendors} />
                <JsonSection title="FAQs" count={state.faqs.length} value={state.faqs} />
                <JsonSection title="Tasks" count={state.tasks.length} value={state.tasks} />
              </Stack>
            ) : state.agent.actions.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                No tool calls yet — send the agent a message.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {[...state.agent.actions].reverse().map((action, i) => (
                  <Box
                    key={i}
                    sx={{ border: `1px solid ${COLORS.border.faint}`, borderRadius: `${RADII.md}px`, p: 1.5 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                      <PheraChip
                        size="small"
                        tone={action.status === 'failed' ? 'danger' : action.risk === 'read' ? 'neutral' : 'success'}
                        label={`${action.tool_name} · ${action.status}`}
                      />
                      <Typography variant="caption" sx={{ color: COLORS.text.faint }}>
                        {new Date(action.created_at).toLocaleTimeString()}
                      </Typography>
                    </Stack>
                    <Box
                      component="pre"
                      sx={{ m: 0, fontSize: '0.875rem', color: COLORS.text.muted, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                    >
                      {`in:  ${JSON.stringify(action.input)}\nout: ${JSON.stringify(action.result)?.slice(0, 400)}`}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </PheraCard>
        </Box>
      ) : (
        <Typography variant="body1" sx={{ color: COLORS.text.subtle }}>
          No active lab wedding — pick a scenario and create one.
        </Typography>
      )}
    </Box>
  );
}
