'use client';

import { useEffect, useState, useMemo, ReactNode, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Totals = {
  generatedAt: string;
  weddings: Array<{
    id: string;
    slug: string;
    couple_name: string | null;
    wedding_date: string | null;
    venue_name: string | null;
    venue_location: string | null;
    status: string | null;
    created_at: string;
    created_by: string | null;
    counts: {
      guests: number;
      rsvps: number;
      outreachEvents: number;
      whatsappMessages: number;
      vendors: number;
    };
  }>;
  totals: {
    guests: number;
    rsvps: number;
    rsvpsAttending: number;
    rsvpsDeclined: number;
    outreachEvents: number;
    outreach24h: number;
    outreach7d: number;
    whatsappMessages: number;
    whatsapp24h: number;
    whatsappOptIns: number;
    vendors: number;
    vendorMessages24h: number;
    vendorMessages: number;
    escalationsOpen: number;
    conciergeBroadcasts24h: number;
    conciergeBroadcasts: number;
  };
};

type UsersData = {
  total: number;
  last24h: number;
  last7d: number;
  last30d: number;
  recent: Array<{
    id: string;
    email: string | null;
    phone: string | null;
    created_at: string;
    last_sign_in_at: string | null;
    provider: string | null;
  }>;
};

type RecentData = {
  recentGuests: Array<{
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    wedding_id: string;
    avatar_color: string | null;
    initials: string | null;
    avatar_svg: string | null;
    contact_type: string | null;
    outreach_status: string | null;
    created_at: string;
  }>;
  recentRsvps: Array<{
    id: string;
    guest_id: string | null;
    wedding_id: string;
    event_id: string | null;
    attending: boolean | null;
    guest_count: number | null;
    plus_one: boolean | null;
    created_at: string;
  }>;
  recentOutreach: Array<{
    id: string;
    wedding_id: string;
    guest_id: string | null;
    event_type: string | null;
    template_name: string | null;
    channel: string | null;
    created_at: string;
  }>;
  recentWhatsapp: Array<{
    id: string;
    wedding_id: string;
    phone_number: string | null;
    template_name: string | null;
    message_type: string | null;
    status: string | null;
    error_message: string | null;
    sent_at: string | null;
    created_at: string;
  }>;
  recentVendorMessages: Array<{
    id: string;
    wedding_id: string;
    sender_name: string | null;
    sender_type: string | null;
    content: string | null;
    created_at: string;
  }>;
  recentEscalations: Array<{
    id: string;
    wedding_id: string;
    guest_id: string | null;
    reason: string | null;
    status: string | null;
    created_at: string;
    resolved_at: string | null;
  }>;
  recentBroadcasts: Array<{
    id: string;
    wedding_id: string;
    message: string | null;
    target_type: string | null;
    status: string | null;
    sent_count: number | null;
    failed_count: number | null;
    sent_at: string | null;
    created_at: string;
  }>;
};

const C = {
  bg: '#0B0B0E',
  panel: '#14141A',
  panelHi: '#1A1A22',
  border: '#26262E',
  borderHi: '#34343E',
  text: '#E7E7EA',
  mute: '#9A9AA5',
  dim: '#6A6A75',
  accent: '#7C9CFF',
  warn: '#F0B060',
  danger: '#FF6B7A',
  ok: '#61D29A',
};

const PREVIEW_COUNT = 5;
const FETCH_TIMEOUT_MS = 30_000;

type LoadState = 'idle' | 'loading' | 'ok' | 'error';

type Section = {
  state: LoadState;
  error?: string;
  ms?: number;
};

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fmtRelative = (iso: string | null) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(iso);
};

const truncate = (s: string | null, n = 60) => {
  if (!s) return '—';
  return s.length > n ? `${s.slice(0, n)}…` : s;
};

async function fetchWithTimeout<T>(url: string, ms: number): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d?.error || `HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export default function OpsDashboard() {
  const router = useRouter();

  const [totals, setTotals] = useState<Totals | null>(null);
  const [users, setUsers] = useState<UsersData | null>(null);
  const [recent, setRecent] = useState<RecentData | null>(null);

  const [totalsState, setTotalsState] = useState<Section>({ state: 'idle' });
  const [usersState, setUsersState] = useState<Section>({ state: 'idle' });
  const [recentState, setRecentState] = useState<Section>({ state: 'idle' });

  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const [filter, setFilter] = useState('');

  // Delete modal state — shared for guests + auth.users.
  type DeleteTarget =
    | { kind: 'guest'; id: string; label: string }
    | { kind: 'user'; id: string; label: string };
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deletePreview, setDeletePreview] = useState<{
    rows: Array<{ table: string; count: number }>;
    total: number;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

  const openDeleteGuest = async (id: string, label: string) => {
    setDeleteTarget({ kind: 'guest', id, label });
    setDeleteResult(null);
    setDeletePreview(null);
    try {
      const res = await fetch(`/api/ops/guests/${id}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDeletePreview({ rows: data.rows, total: data.total });
      }
    } catch {
      /* ignore */
    }
  };
  const openDeleteUser = (id: string, label: string) => {
    setDeleteTarget({ kind: 'user', id, label });
    setDeleteResult(null);
    setDeletePreview(null);
  };

  // Bulk selection state
  const [guestSel, setGuestSel] = useState<Set<string>>(new Set());
  const [userSel, setUserSel] = useState<Set<string>>(new Set());
  const [bulkKind, setBulkKind] = useState<null | 'guest' | 'user'>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResults, setBulkResults] = useState<
    Array<{ id: string; label: string; ok: boolean; msg: string }>
  >([]);

  const setSelMany = (
    current: Set<string>,
    setter: (s: Set<string>) => void,
    ids: string[],
    on: boolean,
  ) => {
    const next = new Set(current);
    if (on) for (const id of ids) next.add(id);
    else for (const id of ids) next.delete(id);
    setter(next);
  };
  const toggleSel = (
    current: Set<string>,
    setter: (s: Set<string>) => void,
    id: string,
  ) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  const runBulk = async () => {
    if (!bulkKind) return;
    setBulkRunning(true);
    setBulkResults([]);
    const ids = Array.from(bulkKind === 'guest' ? guestSel : userSel);
    const results: typeof bulkResults = [];
    const pathFor = (id: string) =>
      bulkKind === 'guest' ? `/api/ops/guests/${id}` : `/api/ops/users/${id}`;
    const labelFor = (id: string): string => {
      if (bulkKind === 'guest') {
        const g = recent?.recentGuests.find((x) => x.id === id);
        return g?.name || g?.email || id;
      }
      const u = users?.recent.find((x) => x.id === id);
      return u?.email || id;
    };
    const batchSize = 4;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const settled = await Promise.all(
        batch.map(async (id) => {
          try {
            const res = await fetch(pathFor(id), {
              method: 'DELETE',
              headers: { 'content-type': 'application/json' },
              body: bulkKind === 'user' ? JSON.stringify({}) : undefined,
            });
            const data = await res.json();
            if (!res.ok) {
              return {
                id,
                label: labelFor(id),
                ok: false,
                msg: `${data?.error || res.statusText}${data?.ownedWeddings ? ` — owns: ${data.ownedWeddings.join(', ')}` : ''}`,
              };
            }
            return {
              id,
              label: labelFor(id),
              ok: true,
              msg:
                bulkKind === 'guest'
                  ? `deleted · ${data.totalDeleted} rows`
                  : 'deleted',
            };
          } catch (e) {
            return { id, label: labelFor(id), ok: false, msg: (e as Error).message };
          }
        }),
      );
      results.push(...settled);
      setBulkResults([...results]);
    }
    setBulkRunning(false);
    // Keep failures selected, drop successes.
    const survivors = new Set(results.filter((r) => !r.ok).map((r) => r.id));
    if (bulkKind === 'guest') setGuestSel(survivors);
    else setUserSel(survivors);
    loadAll();
  };

  const runDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteResult(null);
    try {
      const url =
        deleteTarget.kind === 'guest'
          ? `/api/ops/guests/${deleteTarget.id}`
          : `/api/ops/users/${deleteTarget.id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: deleteTarget.kind === 'user' ? JSON.stringify({}) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteResult(
          `Failed: ${data?.error || res.statusText}${data?.ownedWeddings ? ` — owns: ${data.ownedWeddings.join(', ')}` : ''}`,
        );
      } else {
        setDeleteResult(
          deleteTarget.kind === 'guest'
            ? `Deleted. ${data.totalDeleted} rows across ${data.deleted.length} tables.`
            : 'User deleted.',
        );
        setTimeout(() => {
          setDeleteTarget(null);
          setDeleteResult(null);
          loadAll();
        }, 900);
      }
    } catch (e) {
      setDeleteResult(`Failed: ${(e as Error).message}`);
    }
    setDeleteLoading(false);
  };

  const appendLog = (line: string) => {
    const ts = new Date().toLocaleTimeString();
    setLog((l) => [...l, `${ts}  ${line}`].slice(-50));
  };

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const loadSection = async <T,>(
    label: string,
    url: string,
    setData: (v: T) => void,
    setState: (s: Section) => void,
  ) => {
    appendLog(`→ ${label}: GET ${url}`);
    setState({ state: 'loading' });
    const t0 = performance.now();
    try {
      const data = await fetchWithTimeout<T>(url, FETCH_TIMEOUT_MS);
      const ms = Math.round(performance.now() - t0);
      setData(data);
      setState({ state: 'ok', ms });
      appendLog(`✓ ${label}: ok in ${ms}ms`);
    } catch (e) {
      const ms = Math.round(performance.now() - t0);
      const msg = (e as Error).message || String(e);
      setState({ state: 'error', error: msg, ms });
      appendLog(`✗ ${label}: ${msg} (after ${ms}ms)`);
    }
  };

  const loadAll = () => {
    setLog([]);
    appendLog('Starting dashboard load…');
    loadSection<Totals>('totals + weddings', '/api/ops/stats/totals', setTotals, setTotalsState);
    loadSection<UsersData>('auth.users', '/api/ops/stats/users', setUsers, setUsersState);
    loadSection<RecentData>('recent activity', '/api/ops/stats/recent', setRecent, setRecentState);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await fetch('/api/ops/logout', { method: 'POST' });
    router.replace('/ops/enter');
    router.refresh();
  };

  const filteredWeddings = useMemo(() => {
    if (!totals) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return totals.weddings;
    return totals.weddings.filter(
      (w) =>
        w.slug.toLowerCase().includes(q) ||
        (w.couple_name || '').toLowerCase().includes(q),
    );
  }, [totals, filter]);

  const allLoaded =
    totalsState.state === 'ok' && usersState.state === 'ok' && recentState.state === 'ok';
  const anyLoading =
    totalsState.state === 'loading' ||
    usersState.state === 'loading' ||
    recentState.state === 'loading';
  const loadedCount = [totalsState, usersState, recentState].filter((s) => s.state === 'ok').length;
  const errorCount = [totalsState, usersState, recentState].filter((s) => s.state === 'error').length;

  return (
    <main style={{ padding: '28px 28px 80px', maxWidth: 1440, margin: '0 auto' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: C.dim }}>PHERA · OPS</div>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: '4px 0 0' }}>Observability</h1>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
            {allLoaded
              ? `All 3 sections loaded · updated ${fmtRelative(totals?.generatedAt ?? null)}`
              : anyLoading
              ? `Loading ${loadedCount}/3 · ${errorCount ? `${errorCount} failed` : 'fetching…'}`
              : errorCount > 0
              ? `${errorCount}/3 sections failed`
              : '—'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/ops/outreach" style={{ ...btnGhost, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Outreach →
          </Link>
          <button onClick={loadAll} style={btnGhost}>↻ Refresh all</button>
          <button onClick={logout} style={btnGhost}>Sign out</button>
        </div>
      </div>

      {/* Progress strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <SectionPill label="Totals + weddings" state={totalsState} onRetry={() => loadSection<Totals>('totals + weddings', '/api/ops/stats/totals', setTotals, setTotalsState)} />
        <SectionPill label="auth.users" state={usersState} onRetry={() => loadSection<UsersData>('auth.users', '/api/ops/stats/users', setUsers, setUsersState)} />
        <SectionPill label="Recent activity" state={recentState} onRetry={() => loadSection<RecentData>('recent activity', '/api/ops/stats/recent', setRecent, setRecentState)} />
      </div>

      {/* Live log */}
      <details open={!allLoaded} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 20 }}>
        <summary style={{ padding: '10px 14px', fontSize: 12, color: C.mute, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Activity log ({log.length})</span>
          <span style={{ color: C.dim, fontSize: 11 }}>click to toggle</span>
        </summary>
        <div
          ref={logRef}
          style={{
            maxHeight: 160,
            overflowY: 'auto',
            padding: '8px 14px 12px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            borderTop: `1px solid ${C.border}`,
          }}
        >
          {log.length === 0 && <div style={{ color: C.dim }}>No activity.</div>}
          {log.map((line, i) => (
            <div
              key={i}
              style={{
                color: line.includes('✗') ? C.danger : line.includes('✓') ? C.ok : line.includes('→') ? C.accent : C.mute,
                lineHeight: 1.6,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </details>

      {/* Top stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 10,
          marginBottom: 24,
        }}
      >
        <Stat label="Users" value={users?.total ?? '…'} sub={users ? `+${users.last24h} · 24h` : 'loading'} loading={usersState.state === 'loading'} />
        <Stat label="Weddings" value={totals?.weddings.length ?? '…'} sub={users ? `${users.last7d} new users · 7d` : ''} loading={totalsState.state === 'loading'} />
        <Stat label="Guests" value={totals?.totals.guests ?? '…'} loading={totalsState.state === 'loading'} />
        <Stat
          label="RSVPs"
          value={totals?.totals.rsvps ?? '…'}
          sub={totals ? `${totals.totals.rsvpsAttending} yes / ${totals.totals.rsvpsDeclined} no` : ''}
          loading={totalsState.state === 'loading'}
        />
        <Stat label="Outreach · 24h" value={totals?.totals.outreach24h ?? '…'} sub={totals ? `${totals.totals.outreach7d} · 7d` : ''} accent loading={totalsState.state === 'loading'} />
        <Stat label="WhatsApp · 24h" value={totals?.totals.whatsapp24h ?? '…'} sub={totals ? `${totals.totals.whatsappMessages} total` : ''} loading={totalsState.state === 'loading'} />
        <Stat label="Vendor msgs · 24h" value={totals?.totals.vendorMessages24h ?? '…'} sub={totals ? `${totals.totals.vendorMessages} total` : ''} loading={totalsState.state === 'loading'} />
        <Stat
          label="Escalations OPEN"
          value={totals?.totals.escalationsOpen ?? '…'}
          accent={totals && totals.totals.escalationsOpen > 0 ? 'warn' : undefined}
          loading={totalsState.state === 'loading'}
        />
      </div>

      {/* Jira-style 2-col widget grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(540px, 1fr))',
          gap: 16,
        }}
      >
        <Widget
          title="Weddings"
          source={totalsState}
          total={totals?.weddings.length ?? 0}
          rows={filteredWeddings}
          head={['Slug', 'Couple', 'Guests', 'RSVPs', 'WhatsApp', 'Created']}
          toolbar={
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              style={inlineInput}
            />
          }
          renderRow={(w) => [
            <Link key="s" href={`/ops/wedding/${encodeURIComponent(w.slug)}`} style={slugLink}>
              {w.slug}
            </Link>,
            <span key="c" style={{ color: C.text }}>{w.couple_name || '—'}</span>,
            <span key="g" style={numCell}>{w.counts.guests}</span>,
            <span key="r" style={numCell}>{w.counts.rsvps}</span>,
            <span key="wa" style={numCell}>{w.counts.whatsappMessages}</span>,
            <span key="ca" style={{ color: C.mute }}>{fmtRelative(w.created_at)}</span>,
          ]}
        />

        <Widget
          title="Latest signups · auth.users"
          source={usersState}
          total={users?.recent.length ?? 0}
          rows={users?.recent ?? []}
          head={['When', 'Email', 'Phone', 'Provider', 'Last sign-in', '']}
          selection={{
            selected: userSel,
            getId: (u) => u.id,
            toggle: (id) => toggleSel(userSel, setUserSel, id),
            setMany: (ids, on) => setSelMany(userSel, setUserSel, ids, on),
            onBulk: () => { setBulkKind('user'); setBulkResults([]); },
          }}
          renderRow={(u) => [
            <span key="t" style={{ color: C.text }}>{fmtRelative(u.created_at)}</span>,
            <span key="e" style={{ color: C.text }}>{u.email || '—'}</span>,
            <span key="p" style={{ color: C.mute }}>{u.phone || '—'}</span>,
            <Chip key="pr">{u.provider || '—'}</Chip>,
            <span key="l" style={{ color: C.mute }}>{fmtRelative(u.last_sign_in_at)}</span>,
            <button
              key="del"
              onClick={() => openDeleteUser(u.id, u.email || u.id)}
              title="Delete user"
              style={btnTrash}
            >
              ✕
            </button>,
          ]}
        />

        <Widget
          title="Latest guests"
          source={recentState}
          total={recent?.recentGuests.length ?? 0}
          rows={recent?.recentGuests ?? []}
          head={['', 'Name', 'Wedding', 'Outreach', 'Added', '']}
          selection={{
            selected: guestSel,
            getId: (g) => g.id,
            toggle: (id) => toggleSel(guestSel, setGuestSel, id),
            setMany: (ids, on) => setSelMany(guestSel, setGuestSel, ids, on),
            onBulk: () => { setBulkKind('guest'); setBulkResults([]); },
          }}
          renderRow={(g) => [
            <GuestAvatar key="a" g={g} />,
            <div key="n">
              <div style={{ color: C.text, fontWeight: 500 }}>{g.name || '—'}</div>
              <div style={{ color: C.dim, fontSize: 11 }}>{g.email || g.phone || ''}</div>
            </div>,
            <Link key="w" href={`/ops/wedding/${encodeURIComponent(g.wedding_id)}`} style={slugLink}>
              {g.wedding_id}
            </Link>,
            <Chip key="o" tone={outreachTone(g.outreach_status)}>
              {g.outreach_status || 'not_contacted'}
            </Chip>,
            <span key="t" style={{ color: C.mute }}>{fmtRelative(g.created_at)}</span>,
            <button
              key="del"
              onClick={() => openDeleteGuest(g.id, g.name || g.email || g.id)}
              title="Delete guest"
              style={btnTrash}
            >
              ✕
            </button>,
          ]}
        />

        <Widget
          title="Latest RSVPs"
          source={recentState}
          total={recent?.recentRsvps.length ?? 0}
          rows={recent?.recentRsvps ?? []}
          head={['When', 'Attending', 'Guests', '+1', 'Wedding']}
          renderRow={(r) => [
            <span key="t" style={{ color: C.text }}>{fmtRelative(r.created_at)}</span>,
            <Chip key="a" tone={r.attending ? 'ok' : r.attending === false ? 'danger' : 'mute'}>
              {r.attending === null ? '—' : r.attending ? 'yes' : 'no'}
            </Chip>,
            <span key="g" style={numCell}>{r.guest_count ?? '—'}</span>,
            <span key="p" style={{ color: C.mute }}>{r.plus_one ? 'yes' : '—'}</span>,
            <Link key="w" href={`/ops/wedding/${encodeURIComponent(r.wedding_id)}`} style={slugLink}>
              {r.wedding_id}
            </Link>,
          ]}
        />

        <Widget
          title="Recent outreach events"
          source={recentState}
          total={recent?.recentOutreach.length ?? 0}
          rows={recent?.recentOutreach ?? []}
          head={['When', 'Event', 'Template', 'Channel', 'Wedding']}
          renderRow={(o) => [
            <span key="t" style={{ color: C.text }}>{fmtRelative(o.created_at)}</span>,
            <Chip key="e" tone="accent">{o.event_type || '—'}</Chip>,
            <span key="tp" style={{ color: C.mute }}>{o.template_name || '—'}</span>,
            <span key="c" style={{ color: C.mute }}>{o.channel || '—'}</span>,
            <Link key="w" href={`/ops/wedding/${encodeURIComponent(o.wedding_id)}`} style={slugLink}>
              {o.wedding_id}
            </Link>,
          ]}
        />

        <Widget
          title="Recent WhatsApp sends"
          source={recentState}
          total={recent?.recentWhatsapp.length ?? 0}
          rows={recent?.recentWhatsapp ?? []}
          head={['When', 'Phone', 'Template', 'Type', 'Status']}
          renderRow={(w) => [
            <span key="t" style={{ color: C.text }}>{fmtRelative(w.sent_at || w.created_at)}</span>,
            <span key="p" style={{ color: C.mute, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>
              {w.phone_number || '—'}
            </span>,
            <span key="tp" style={{ color: C.mute }}>{w.template_name || '—'}</span>,
            <span key="mt" style={{ color: C.mute }}>{w.message_type || '—'}</span>,
            <Chip key="st" tone={whatsappTone(w.status)}>{w.status || '—'}</Chip>,
          ]}
        />

        <Widget
          title="Recent vendor messages"
          source={recentState}
          total={recent?.recentVendorMessages.length ?? 0}
          rows={recent?.recentVendorMessages ?? []}
          head={['When', 'Sender', 'Content', 'Wedding']}
          renderRow={(v) => [
            <span key="t" style={{ color: C.text }}>{fmtRelative(v.created_at)}</span>,
            <div key="s">
              <div style={{ color: C.text, fontSize: 12 }}>{v.sender_name || '—'}</div>
              <div style={{ color: C.dim, fontSize: 11 }}>{v.sender_type || ''}</div>
            </div>,
            <span key="c" style={{ color: C.mute, fontSize: 12 }}>{truncate(v.content, 70)}</span>,
            <Link key="w" href={`/ops/wedding/${encodeURIComponent(v.wedding_id)}`} style={slugLink}>
              {v.wedding_id}
            </Link>,
          ]}
        />

        <Widget
          title="Open escalations"
          source={recentState}
          total={recent?.recentEscalations.length ?? 0}
          rows={recent?.recentEscalations ?? []}
          head={['When', 'Reason', 'Status', 'Wedding']}
          renderRow={(es) => [
            <span key="t" style={{ color: C.text }}>{fmtRelative(es.created_at)}</span>,
            <span key="r" style={{ color: C.mute }}>{truncate(es.reason, 50)}</span>,
            <Chip key="st" tone={es.status === 'open' ? 'warn' : es.status === 'resolved' ? 'ok' : 'mute'}>
              {es.status || '—'}
            </Chip>,
            <Link key="w" href={`/ops/wedding/${encodeURIComponent(es.wedding_id)}`} style={slugLink}>
              {es.wedding_id}
            </Link>,
          ]}
        />

        <Widget
          title="Recent concierge broadcasts"
          source={recentState}
          total={recent?.recentBroadcasts.length ?? 0}
          rows={recent?.recentBroadcasts ?? []}
          head={['When', 'Message', 'Sent/Failed', 'Status', 'Wedding']}
          renderRow={(b) => [
            <span key="t" style={{ color: C.text }}>{fmtRelative(b.sent_at || b.created_at)}</span>,
            <span key="m" style={{ color: C.mute, fontSize: 12 }}>{truncate(b.message, 50)}</span>,
            <span key="sf" style={numCell}>{b.sent_count ?? 0}/{b.failed_count ?? 0}</span>,
            <Chip key="st" tone={b.status === 'sent' ? 'ok' : 'mute'}>{b.status || '—'}</Chip>,
            <Link key="w" href={`/ops/wedding/${encodeURIComponent(b.wedding_id)}`} style={slugLink}>
              {b.wedding_id}
            </Link>,
          ]}
        />
      </div>

      {bulkKind && (
        <div
          onClick={() => !bulkRunning && setBulkKind(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 65 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 580, maxHeight: '88vh', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, display: 'flex', flexDirection: 'column' }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.danger }}>
              Delete {bulkKind === 'guest' ? (guestSel.size) : (userSel.size)} {bulkKind}{(bulkKind === 'guest' ? guestSel.size : userSel.size) === 1 ? '' : 's'}
            </h3>
            <div style={{ color: C.mute, fontSize: 13, marginTop: 6 }}>
              {bulkKind === 'guest'
                ? 'Each guest cascades across up to 15 related tables (rsvps, whatsapp_*, outreach_*, etc.).'
                : 'Permanent. Users owning weddings will be skipped (delete those weddings first).'}
            </div>

            <div style={{ marginTop: 14, border: `1px solid ${C.border}`, borderRadius: 10, maxHeight: 200, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <tbody>
                  {Array.from(bulkKind === 'guest' ? guestSel : userSel).map((id) => {
                    let label = id;
                    if (bulkKind === 'guest') {
                      const g = recent?.recentGuests.find((x) => x.id === id);
                      label = g?.name || g?.email || id;
                    } else {
                      const u = users?.recent.find((x) => x.id === id);
                      label = u?.email || id;
                    }
                    return (
                      <tr key={id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '6px 12px', color: C.text }}>{label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {bulkResults.length > 0 && (
              <div style={{ marginTop: 14, border: `1px solid ${C.border}`, borderRadius: 10, maxHeight: 200, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {bulkResults.map((r) => (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '6px 12px', color: r.ok ? C.ok : C.danger }}>{r.ok ? '✓' : '✗'}</td>
                        <td style={{ padding: '6px 12px', color: C.text }}>{r.label}</td>
                        <td style={{ padding: '6px 12px', color: r.ok ? C.mute : C.danger, fontSize: 11 }}>{r.msg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 18 }}>
              <div style={{ color: C.dim, fontSize: 12 }}>
                {bulkRunning ? `Deleting ${bulkResults.length} / ${bulkKind === 'guest' ? guestSel.size : userSel.size}…` : ''}
                {!bulkRunning && bulkResults.length > 0 && (
                  <>Done. {bulkResults.filter((r) => r.ok).length} ok · {bulkResults.filter((r) => !r.ok).length} failed.</>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setBulkKind(null)} disabled={bulkRunning} style={btnGhost}>
                  {bulkResults.length > 0 && !bulkRunning ? 'Close' : 'Cancel'}
                </button>
                {bulkResults.length === 0 && (
                  <button onClick={runBulk} disabled={bulkRunning} style={{ ...btnDanger, opacity: bulkRunning ? 0.6 : 1 }}>
                    {bulkRunning ? 'Deleting…' : `Delete ${bulkKind === 'guest' ? guestSel.size : userSel.size} permanently`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          onClick={() => !deleteLoading && setDeleteTarget(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 60,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: 22,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.danger }}>
              Delete {deleteTarget.kind === 'guest' ? 'guest' : 'auth user'}
            </h3>
            <div style={{ color: C.mute, fontSize: 13, marginTop: 6, wordBreak: 'break-all' }}>
              {deleteTarget.label}
            </div>

            {deleteTarget.kind === 'guest' && deletePreview && (
              <div style={{ marginTop: 16, border: `1px solid ${C.border}`, borderRadius: 10, maxHeight: 240, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {deletePreview.rows.filter((r) => r.count > 0).map((r) => (
                      <tr key={r.table} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '6px 12px', color: C.text, fontFamily: 'ui-monospace, Menlo, monospace' }}>
                          {r.table}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', color: C.warn, fontVariantNumeric: 'tabular-nums' }}>
                          {r.count}
                        </td>
                      </tr>
                    ))}
                    {deletePreview.rows.filter((r) => r.count > 0).length === 0 && (
                      <tr>
                        <td style={{ padding: 16, color: C.dim, textAlign: 'center' }}>
                          Only the guest row itself.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {deleteTarget.kind === 'guest' && deletePreview && (
              <div style={{ color: C.dim, fontSize: 12, marginTop: 8 }}>
                Total rows to delete: <strong style={{ color: C.danger }}>{deletePreview.total}</strong>
              </div>
            )}

            {deleteTarget.kind === 'user' && (
              <div style={{ color: C.mute, fontSize: 13, marginTop: 12, padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                Deletes the auth user + any outreach log entries. Refuses if they own a wedding — delete the wedding first.
              </div>
            )}

            {deleteResult && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 13,
                  color: deleteResult.startsWith('Failed') ? C.danger : C.ok,
                  background: deleteResult.startsWith('Failed') ? 'rgba(255,107,122,0.08)' : 'rgba(97,210,154,0.08)',
                }}
              >
                {deleteResult}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading} style={btnGhost}>
                Cancel
              </button>
              <button
                onClick={runDelete}
                disabled={deleteLoading}
                style={{ ...btnDanger, opacity: deleteLoading ? 0.6 : 1 }}
              >
                {deleteLoading ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ——— primitives ———

function SectionPill({
  label,
  state,
  onRetry,
}: {
  label: string;
  state: Section;
  onRetry: () => void;
}) {
  const color =
    state.state === 'ok' ? C.ok : state.state === 'error' ? C.danger : state.state === 'loading' ? C.accent : C.dim;
  const icon =
    state.state === 'ok' ? '✓' : state.state === 'error' ? '✗' : state.state === 'loading' ? '⟳' : '○';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 999,
        fontSize: 12,
      }}
    >
      <span
        style={{
          color,
          fontSize: 14,
          display: 'inline-block',
          animation: state.state === 'loading' ? 'ops-spin 1s linear infinite' : undefined,
        }}
      >
        {icon}
      </span>
      <span style={{ color: C.text }}>{label}</span>
      {state.ms !== undefined && (
        <span style={{ color: C.dim, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{state.ms}ms</span>
      )}
      {state.state === 'error' && (
        <>
          <span style={{ color: C.danger, fontSize: 11 }}>{truncate(state.error ?? '', 40)}</span>
          <button onClick={onRetry} style={{ ...btnChip, padding: '2px 8px', fontSize: 10 }}>Retry</button>
        </>
      )}
      <style>{`@keyframes ops-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Widget<T>({
  title,
  total,
  rows,
  head,
  renderRow,
  toolbar,
  source,
  selection,
}: {
  title: string;
  total: number;
  rows: T[];
  head: string[];
  renderRow: (row: T) => ReactNode[];
  toolbar?: ReactNode;
  source: Section;
  selection?: {
    selected: Set<string>;
    getId: (row: T) => string;
    toggle: (id: string) => void;
    setMany: (ids: string[], on: boolean) => void;
    onBulk: () => void;
    bulkLabel?: string;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, PREVIEW_COUNT);
  const hasMore = rows.length > PREVIEW_COUNT;
  const visibleIds = selection ? shown.map(selection.getId) : [];
  const allShownChecked =
    selection && visibleIds.length > 0 && visibleIds.every((id) => selection.selected.has(id));
  const selectedInWidget = selection
    ? rows.filter((r) => selection.selected.has(selection.getId(r))).length
    : 0;
  const colSpan = head.length + (selection ? 1 : 0);

  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: C.panelHi,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{title}</h3>
          <span
            style={{
              fontSize: 11,
              color: C.dim,
              background: C.bg,
              padding: '2px 8px',
              borderRadius: 999,
              border: `1px solid ${C.border}`,
            }}
          >
            {source.state === 'loading' ? '…' : total}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {selection && selectedInWidget > 0 && (
            <>
              <span style={{ color: C.warn, fontSize: 11 }}>{selectedInWidget} sel</span>
              <button onClick={selection.onBulk} style={{ ...btnChip, color: C.danger, borderColor: `${C.danger}55` }}>
                {selection.bulkLabel || `Delete ${selectedInWidget}`}
              </button>
            </>
          )}
          {toolbar}
          {hasMore && (
            <button onClick={() => setExpanded((v) => !v)} style={btnChip}>
              {expanded ? 'Collapse' : `Show all (${rows.length})`}
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          overflowX: 'auto',
          maxHeight: expanded ? 'min(70vh, 720px)' : 'none',
          overflowY: expanded ? 'auto' : 'visible',
        }}
      >
        {source.state === 'loading' && rows.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: C.dim, fontSize: 12 }}>
            <span style={{ display: 'inline-block', animation: 'ops-spin 1s linear infinite' }}>⟳</span>{' '}
            Loading…
          </div>
        ) : source.state === 'error' ? (
          <div style={{ padding: 20, textAlign: 'center', color: C.danger, fontSize: 12 }}>
            Failed: {source.error}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {selection && (
                  <th
                    style={{
                      padding: '8px 10px',
                      background: C.panel,
                      borderBottom: `1px solid ${C.border}`,
                      width: 30,
                      position: expanded ? 'sticky' : 'static',
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      aria-label="Select all visible"
                      checked={!!allShownChecked}
                      onChange={(e) => selection.setMany(visibleIds, e.target.checked)}
                      style={{ accentColor: C.accent, cursor: 'pointer' }}
                    />
                  </th>
                )}
                {head.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign: 'left',
                      padding: '8px 14px',
                      color: C.dim,
                      fontWeight: 500,
                      fontSize: 10,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      background: C.panel,
                      borderBottom: `1px solid ${C.border}`,
                      whiteSpace: 'nowrap',
                      position: expanded ? 'sticky' : 'static',
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td
                    colSpan={colSpan}
                    style={{ padding: 24, textAlign: 'center', color: C.dim, fontSize: 12 }}
                  >
                    No rows.
                  </td>
                </tr>
              )}
              {shown.map((row, i) => {
                const cells = renderRow(row);
                const id = selection ? selection.getId(row) : '';
                const isChecked = selection ? selection.selected.has(id) : false;
                return (
                  <tr
                    key={i}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: isChecked ? 'rgba(124,156,255,0.06)' : undefined,
                    }}
                  >
                    {selection && (
                      <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => selection.toggle(id)}
                          style={{ accentColor: C.accent, cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    {cells.map((c, j) => (
                      <td key={j} style={{ padding: '8px 14px', verticalAlign: 'middle' }}>
                        {c}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
  loading,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean | 'warn' | 'danger';
  loading?: boolean;
}) {
  const color =
    accent === 'warn' ? C.warn : accent === 'danger' ? C.danger : accent ? C.accent : C.text;
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '12px 14px',
        opacity: loading ? 0.75 : 1,
      }}
    >
      <div style={{ color: C.dim, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Chip({
  children,
  tone = 'mute',
}: {
  children: React.ReactNode;
  tone?: 'mute' | 'ok' | 'warn' | 'danger' | 'accent';
}) {
  const map: Record<string, { bg: string; fg: string }> = {
    mute: { bg: '#24242C', fg: C.mute },
    ok: { bg: 'rgba(97,210,154,0.14)', fg: C.ok },
    warn: { bg: 'rgba(240,176,96,0.14)', fg: C.warn },
    danger: { bg: 'rgba(255,107,122,0.14)', fg: C.danger },
    accent: { bg: 'rgba(124,156,255,0.14)', fg: C.accent },
  };
  const { bg, fg } = map[tone];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: 10,
        fontWeight: 500,
        borderRadius: 999,
        background: bg,
        color: fg,
        textTransform: 'lowercase',
        letterSpacing: 0.3,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function GuestAvatar({
  g,
}: {
  g: { avatar_color: string | null; initials: string | null; avatar_svg: string | null };
}) {
  if (g.avatar_svg) {
    return (
      <div
        aria-hidden
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          overflow: 'hidden',
          background: '#fff',
          display: 'inline-block',
        }}
        dangerouslySetInnerHTML={{ __html: g.avatar_svg }}
      />
    );
  }
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        background: g.avatar_color || '#4a4a55',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.3,
      }}
    >
      {g.initials || '?'}
    </div>
  );
}

function outreachTone(
  s: string | null,
): 'ok' | 'warn' | 'accent' | 'danger' | 'mute' {
  switch (s) {
    case 'rsvp_confirmed':
    case 'travel_collected':
    case 'logistics_complete':
      return 'ok';
    case 'rsvp_requested':
    case 'save_the_date_sent':
      return 'accent';
    case 'unresponsive':
      return 'warn';
    default:
      return 'mute';
  }
}

function whatsappTone(
  s: string | null,
): 'ok' | 'warn' | 'accent' | 'danger' | 'mute' {
  if (!s) return 'mute';
  if (['delivered', 'read', 'sent'].includes(s)) return 'ok';
  if (['failed', 'undelivered', 'error'].includes(s)) return 'danger';
  if (s === 'queued' || s === 'pending') return 'accent';
  return 'mute';
}

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  color: C.text,
  border: `1px solid ${C.border}`,
  padding: '8px 14px',
  fontSize: 13,
  borderRadius: 8,
  cursor: 'pointer',
};

const btnTrash: React.CSSProperties = {
  background: 'transparent',
  color: C.dim,
  border: `1px solid ${C.border}`,
  width: 26,
  height: 26,
  padding: 0,
  fontSize: 12,
  lineHeight: 1,
  borderRadius: 6,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const btnDanger: React.CSSProperties = {
  background: C.danger,
  color: '#1a0508',
  border: 'none',
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 8,
  cursor: 'pointer',
};

const btnChip: React.CSSProperties = {
  background: C.bg,
  color: C.mute,
  border: `1px solid ${C.border}`,
  padding: '4px 10px',
  fontSize: 11,
  borderRadius: 6,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const slugLink: React.CSSProperties = {
  color: C.accent,
  textDecoration: 'none',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11,
};

const numCell: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  color: C.text,
};

const inlineInput: React.CSSProperties = {
  padding: '5px 10px',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  color: C.text,
  fontSize: 12,
  outline: 'none',
  width: 160,
};
