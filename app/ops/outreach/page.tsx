'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

type UnonboardedUser = {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  provider: string | null;
  firstName: string | null;
  signupRelative: string;
  hasWedding: boolean;
  weddingsOwned: string[];
  guestOfWeddings: string[];
  lastContact: {
    sent_at: string;
    kind: string;
    status: string;
    from_email: string | null;
  } | null;
};

type UnonboardedResponse = {
  total: number;
  totalUsers: number;
  withWedding: number;
  rows: UnonboardedUser[];
  generatedAt: string;
};

type LogEntry = {
  id: string;
  user_id: string;
  user_email: string;
  kind: string;
  channel: string;
  from_email: string | null;
  subject: string | null;
  provider_message_id: string | null;
  status: string;
  error: string | null;
  notes: string | null;
  sent_by: string | null;
  created_at: string;
};

type Preview = {
  user: { id: string; email: string | null; firstName: string | null };
  from: string | null;
  replyTo: string | null;
  subject: string;
  html: string;
  text: string;
};

const C = {
  bg: '#0B0B0E',
  panel: '#14141A',
  panelHi: '#1A1A22',
  border: '#26262E',
  text: '#E7E7EA',
  mute: '#9A9AA5',
  dim: '#6A6A75',
  accent: '#7C9CFF',
  warn: '#F0B060',
  danger: '#FF6B7A',
  ok: '#61D29A',
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
  return `${days}d ago`;
};

export default function OutreachPage() {
  const [rows, setRows] = useState<UnonboardedUser[]>([]);
  const [meta, setMeta] = useState<{
    totalUsers: number;
    withWedding: number;
    generatedAt: string;
  } | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [ageDays, setAgeDays] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showContacted, setShowContacted] = useState(true);
  const [excludeSlug, setExcludeSlug] = useState<string>('simran-karanvir');
  const [nonGuestOnly, setNonGuestOnly] = useState<boolean>(false);
  const [onlySlug, setOnlySlug] = useState<string>('');
  const [ownership, setOwnership] = useState<'any' | 'owns' | 'no-wedding'>('any');

  // compose modal state
  const [openFor, setOpenFor] = useState<UnonboardedUser | null>(null);
  const [testEmail, setTestEmail] = useState<string | null>(null); // non-null = test mode
  const [testEmailInput, setTestEmailInput] = useState('');
  const [previewData, setPreviewData] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [html, setHtml] = useState('');
  const [fromAddr, setFromAddr] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<
    { ok: boolean; msg: string } | null
  >(null);
  const [activeTab, setActiveTab] = useState<'rendered' | 'subject' | 'plain' | 'html'>('rendered');
  const [template, setTemplate] = useState<string>('beta_launch');

  // Delete user state
  const [deleteUser, setDeleteUser] = useState<UnonboardedUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResults, setBulkResults] = useState<
    Array<{ id: string; email: string; ok: boolean; msg: string }>
  >([]);

  // Bulk SEND — compose once, send an individual personalized email per user.
  const [bulkTargets, setBulkTargets] = useState<UnonboardedUser[] | null>(null);
  const [bulkSendResults, setBulkSendResults] = useState<
    Array<{ id: string; email: string; ok: boolean; msg: string }>
  >([]);
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearSelected = () => setSelected(new Set());
  const runBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkRunning(true);
    setBulkResults([]);
    const ids = Array.from(selected);
    const results: typeof bulkResults = [];
    // Run in small concurrent batches so we don't flood the auth admin API.
    const batchSize = 4;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const settled = await Promise.all(
        batch.map(async (id) => {
          const row = rows.find((r) => r.id === id);
          try {
            const res = await fetch(`/api/ops/users/${id}`, {
              method: 'DELETE',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({}),
            });
            const data = await res.json();
            if (!res.ok) {
              return {
                id,
                email: row?.email || '',
                ok: false,
                msg: `${data?.error || res.statusText}${data?.ownedWeddings ? ` — owns: ${data.ownedWeddings.join(', ')}` : ''}`,
              };
            }
            return { id, email: row?.email || '', ok: true, msg: 'deleted' };
          } catch (e) {
            return { id, email: row?.email || '', ok: false, msg: (e as Error).message };
          }
        }),
      );
      results.push(...settled);
      setBulkResults([...results]);
    }
    setBulkRunning(false);
    // Remove successes from selection
    setSelected(new Set(results.filter((r) => !r.ok).map((r) => r.id)));
    loadList();
    loadLog();
  };

  const loadList = async (days = ageDays) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/ops/outreach/unonboarded?ageDays=${days}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d?.error || `HTTP ${res.status}`);
        setLoading(false);
        return;
      }
      const data = (await res.json()) as UnonboardedResponse;
      setRows(data.rows);
      setMeta({
        totalUsers: data.totalUsers,
        withWedding: data.withWedding,
        generatedAt: data.generatedAt,
      });
    } catch (e) {
      setErr((e as Error).message);
    }
    setLoading(false);
  };

  const loadLog = async () => {
    try {
      const res = await fetch('/api/ops/outreach/log', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { rows: LogEntry[] };
      setLog(data.rows);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadList();
    loadLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPreview = async (qs: string) => {
    setSendResult(null);
    setNotes('');
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const res = await fetch(`/api/ops/outreach/preview?${qs}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d?.error || 'Preview failed');
        setOpenFor(null);
        setTestEmail(null);
        return;
      }
      const p = (await res.json()) as Preview;
      setPreviewData(p);
      setSubject(p.subject);
      setText(p.text);
      setHtml(p.html);
      setFromAddr(p.from || '');
    } catch (e) {
      setErr((e as Error).message);
      setOpenFor(null);
      setTestEmail(null);
    }
    setPreviewLoading(false);
  };

  const openModal = async (u: UnonboardedUser) => {
    setOpenFor(u);
    setTestEmail(null);
    await loadPreview(`userId=${encodeURIComponent(u.id)}&template=${template}`);
  };

  const openTestModal = async () => {
    const email = testEmailInput.trim();
    if (!email || !email.includes('@')) return;
    setTestEmail(email);
    setOpenFor(null);
    setTestEmailInput('');
    await loadPreview(`testEmail=${encodeURIComponent(email)}&template=${template}`);
  };

  // Switch template inside an open compose modal — re-fetch the preview for the
  // current recipient so subject/body/HTML all update to the chosen template.
  const changeTemplate = async (t: string) => {
    setTemplate(t);
    if (testEmail) {
      await loadPreview(`testEmail=${encodeURIComponent(testEmail)}&template=${t}`);
    } else if (bulkTargets && bulkTargets[0]) {
      await loadPreview(`userId=${encodeURIComponent(bulkTargets[0].id)}&template=${t}`);
    } else if (openFor) {
      await loadPreview(`userId=${encodeURIComponent(openFor.id)}&template=${t}`);
    }
  };

  // Open the compose modal for every selected user. The preview renders the
  // template for the first recipient (representative); on send, each user gets
  // their OWN personalized email (server re-renders per user), never a shared To.
  const openBulkModal = async () => {
    const targets = rows.filter((r) => selected.has(r.id) && r.email);
    if (targets.length === 0) return;
    setBulkTargets(targets);
    setBulkSendResults([]);
    setOpenFor(null);
    setTestEmail(null);
    setSendResult(null);
    setNotes('');
    setActiveTab('rendered');
    await loadPreview(`userId=${encodeURIComponent(targets[0].id)}&template=${template}`);
  };

  const sendBulk = async () => {
    if (!bulkTargets || bulkTargets.length === 0) return;
    setSending(true);
    setSendResult(null);
    setBulkSendResults([]);
    const results: typeof bulkSendResults = [];
    const batchSize = 4;
    for (let i = 0; i < bulkTargets.length; i += batchSize) {
      const batch = bulkTargets.slice(i, i + batchSize);
      const settled = await Promise.all(
        batch.map(async (u) => {
          try {
            // Only pass subject/from/template — NOT html/text — so the server
            // rebuilds a personalized copy (their own first name) for each user.
            const res = await fetch('/api/ops/outreach/send', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                userId: u.id,
                subject,
                from: fromAddr || undefined,
                notes: notes || undefined,
                template,
              }),
            });
            const data = await res.json();
            return {
              id: u.id,
              email: u.email || '',
              ok: res.ok,
              msg: res.ok ? data.providerMessageId || 'sent' : data.error || 'failed',
            };
          } catch (e) {
            return { id: u.id, email: u.email || '', ok: false, msg: (e as Error).message };
          }
        }),
      );
      results.push(...settled);
      setBulkSendResults([...results]);
    }
    setSending(false);
    const okCount = results.filter((r) => r.ok).length;
    setSendResult({
      ok: okCount === results.length,
      msg: `Sent ${okCount}/${results.length}${okCount === results.length ? '' : ' — see per-recipient results below'}`,
    });
    // Drop the successes from the selection; keep failures selected for retry.
    setSelected(new Set(results.filter((r) => !r.ok).map((r) => r.id)));
    await loadList();
    await loadLog();
  };

  const send = async () => {
    if (bulkTargets) {
      await sendBulk();
      return;
    }
    if (!openFor && !testEmail) return;
    setSending(true);
    setSendResult(null);
    try {
      const isTest = !!testEmail;
      const url = isTest ? '/api/ops/outreach/send-test' : '/api/ops/outreach/send';
      const body = isTest
        ? {
            toEmail: testEmail,
            subject,
            text,
            html,
            from: fromAddr || undefined,
            template,
          }
        : {
            userId: openFor!.id,
            subject,
            text,
            html,
            from: fromAddr || undefined,
            notes: notes || undefined,
            template,
          };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult({
          ok: true,
          msg: isTest
            ? `Test sent to ${testEmail} · ${data.providerMessageId}`
            : `Sent · message id: ${data.providerMessageId}`,
        });
        if (!isTest) {
          await loadList();
          await loadLog();
        }
      } else {
        setSendResult({ ok: false, msg: data.error || 'Send failed' });
      }
    } catch (e) {
      setSendResult({ ok: false, msg: (e as Error).message });
    }
    setSending(false);
  };

  const skip = async () => {
    if (!openFor) return;
    await fetch('/api/ops/outreach/skip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: openFor.id, notes: notes || undefined }),
    });
    setOpenFor(null);
    await loadList();
    await loadLog();
  };

  const runDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    setDeleteMsg(null);
    try {
      const res = await fetch(`/api/ops/users/${deleteUser.id}`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteMsg(
          `Failed: ${data?.error || res.statusText}${data?.ownedWeddings ? ` — owns: ${data.ownedWeddings.join(', ')}` : ''}`,
        );
      } else {
        setDeleteMsg('User deleted.');
        setTimeout(() => {
          setDeleteUser(null);
          setDeleteMsg(null);
          loadList();
          loadLog();
        }, 800);
      }
    } catch (e) {
      setDeleteMsg(`Failed: ${(e as Error).message}`);
    }
    setDeleting(false);
  };

  const visibleRows = useMemo(() => {
    const excludeTokens = excludeSlug
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const onlyToken = onlySlug.trim().toLowerCase();
    return rows.filter((r) => {
      if (!showContacted && r.lastContact) return false;
      if (ownership === 'owns' && !r.hasWedding) return false;
      if (ownership === 'no-wedding' && r.hasWedding) return false;
      if (nonGuestOnly && r.guestOfWeddings.length > 0) return false;
      if (
        excludeTokens.length > 0 &&
        r.guestOfWeddings.some((s) => excludeTokens.includes(s.toLowerCase()))
      ) {
        return false;
      }
      if (onlyToken && !r.guestOfWeddings.some((s) => s.toLowerCase() === onlyToken)) {
        return false;
      }
      return true;
    });
  }, [rows, showContacted, ownership, excludeSlug, nonGuestOnly, onlySlug]);

  return (
    <main style={{ padding: '28px 28px 80px', maxWidth: 1440, margin: '0 auto' }}>
      {/* Top bar */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/ops" style={{ color: C.mute, fontSize: 13, textDecoration: 'none' }}>
          ← Back to ops
        </Link>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: C.dim }}>PHERA · OPS</div>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: '4px 0 0' }}>Onboarding outreach</h1>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>
            {meta
              ? `${rows.length} total · ${meta.withWedding} own weddings · ${rows.length - meta.withWedding} no wedding · ${rows.filter((r) => r.guestOfWeddings.length === 0).length} never a guest`
              : loading
              ? 'Loading…'
              : '—'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: C.mute }}>Min age:</label>
          <select
            value={ageDays}
            onChange={(e) => {
              const v = Number(e.target.value);
              setAgeDays(v);
              loadList(v);
            }}
            style={select}
          >
            <option value={0}>any</option>
            <option value={1}>1+ day</option>
            <option value={3}>3+ days</option>
            <option value={7}>7+ days</option>
            <option value={30}>30+ days</option>
          </select>
          <label style={{ fontSize: 12, color: C.mute, marginLeft: 8 }}>
            <input
              type="checkbox"
              checked={showContacted}
              onChange={(e) => setShowContacted(e.target.checked)}
              style={{ marginRight: 6 }}
            />
            Include contacted
          </label>
          <button onClick={() => { loadList(); loadLog(); }} style={btnGhost}>↻ Refresh</button>
        </div>
      </div>

      {/* Ad-hoc test send — any email, not logged */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          padding: '10px 14px',
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
          Send test email
        </div>
        <input
          value={testEmailInput}
          onChange={(e) => setTestEmailInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') openTestModal();
          }}
          type="email"
          placeholder="friend@example.com"
          style={{
            padding: '6px 10px',
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            color: C.text,
            fontSize: 13,
            outline: 'none',
            width: 280,
            fontFamily: 'ui-monospace, Menlo, monospace',
          }}
        />
        <button
          onClick={openTestModal}
          disabled={!testEmailInput.includes('@')}
          style={{ ...btnPrimary, opacity: testEmailInput.includes('@') ? 1 : 0.5 }}
        >
          Compose test
        </button>
        <span style={{ fontSize: 11, color: C.dim }}>
          Opens compose modal for any email. Not logged.
        </span>
      </div>

      {/* Guest-association filters */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          marginBottom: 16,
          padding: '10px 14px',
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
          Filters
        </div>
        <label style={{ fontSize: 12, color: C.mute, display: 'flex', alignItems: 'center', gap: 6 }}>
          Wedding
          <select
            value={ownership}
            onChange={(e) => setOwnership(e.target.value as 'any' | 'owns' | 'no-wedding')}
            style={select}
          >
            <option value="any">any</option>
            <option value="owns">owns a wedding</option>
            <option value="no-wedding">no wedding</option>
          </select>
        </label>
        <label style={{ fontSize: 12, color: C.mute, display: 'flex', alignItems: 'center', gap: 6 }}>
          Exclude guests of
          <input
            value={excludeSlug}
            onChange={(e) => setExcludeSlug(e.target.value)}
            placeholder="simran-karanvir,other-slug"
            style={{
              padding: '5px 10px',
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              color: C.text,
              fontSize: 12,
              outline: 'none',
              width: 260,
              fontFamily: 'ui-monospace, Menlo, monospace',
            }}
          />
        </label>
        <label style={{ fontSize: 12, color: C.mute, display: 'flex', alignItems: 'center', gap: 6 }}>
          Only guests of
          <input
            value={onlySlug}
            onChange={(e) => setOnlySlug(e.target.value)}
            placeholder="(slug)"
            style={{
              padding: '5px 10px',
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              color: C.text,
              fontSize: 12,
              outline: 'none',
              width: 180,
              fontFamily: 'ui-monospace, Menlo, monospace',
            }}
          />
        </label>
        <label style={{ fontSize: 12, color: C.mute, display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={nonGuestOnly}
            onChange={(e) => setNonGuestOnly(e.target.checked)}
            style={{ accentColor: C.accent }}
          />
          Non-guests only (the real unknowns)
        </label>
      </div>

      {err && (
        <div style={{ background: 'rgba(255,107,122,0.1)', border: `1px solid ${C.danger}55`, color: C.danger, padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          Error: {err}
        </div>
      )}

      {/* Unonboarded users table */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.panelHi, gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Users</h2>
            <span style={{ fontSize: 11, color: C.dim, background: C.bg, padding: '2px 8px', borderRadius: 999, border: `1px solid ${C.border}` }}>
              {visibleRows.length}
            </span>
          </div>
          {selected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: C.warn, fontSize: 12 }}>{selected.size} selected</span>
              <button onClick={clearSelected} style={btnGhost}>Clear</button>
              <button onClick={openBulkModal} style={btnPrimary}>
                Send to {selected.size}
              </button>
              <button onClick={() => { setBulkConfirm(true); setBulkResults([]); }} style={btnDanger}>
                Delete {selected.size}
              </button>
            </div>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 14px', background: C.panel, borderBottom: `1px solid ${C.border}`, width: 36 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all visible"
                    checked={visibleRows.length > 0 && visibleRows.every((r) => selected.has(r.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const next = new Set(selected);
                        for (const r of visibleRows) next.add(r.id);
                        setSelected(next);
                      } else {
                        const next = new Set(selected);
                        for (const r of visibleRows) next.delete(r.id);
                        setSelected(next);
                      }
                    }}
                    style={{ accentColor: C.accent, cursor: 'pointer' }}
                  />
                </th>
                {['Signed up', 'Email', 'First name', 'Owns', 'Guest of', 'Provider', 'Last sign-in', 'Contacted', '', ''].map((h, i) => (
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
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} style={{ padding: 24, textAlign: 'center', color: C.dim }}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && visibleRows.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: 24, textAlign: 'center', color: C.dim }}>
                    No users match the current filters.
                  </td>
                </tr>
              )}
              {visibleRows.map((u) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: selected.has(u.id) ? 'rgba(124,156,255,0.06)' : undefined,
                  }}
                >
                  <td style={td}>
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggleOne(u.id)}
                      style={{ accentColor: C.accent, cursor: 'pointer' }}
                    />
                  </td>
                  <td style={td}>
                    <div style={{ color: C.text }}>{u.signupRelative}</div>
                    <div style={{ color: C.dim, fontSize: 10 }}>{new Date(u.created_at).toLocaleDateString()}</div>
                  </td>
                  <td style={td}>
                    <span style={{ color: C.text }}>{u.email || '—'}</span>
                  </td>
                  <td style={td}>
                    <span style={{ color: C.mute }}>{u.firstName || '—'}</span>
                  </td>
                  <td style={td}>
                    {u.weddingsOwned.length === 0 ? (
                      <span style={{ color: C.dim, fontSize: 11 }}>—</span>
                    ) : (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {u.weddingsOwned.map((s) => (
                          <span
                            key={s}
                            style={{
                              fontFamily: 'ui-monospace, Menlo, monospace',
                              fontSize: 10,
                              color: C.ok,
                              background: 'rgba(97,210,154,0.10)',
                              padding: '2px 6px',
                              borderRadius: 4,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={td}>
                    {u.guestOfWeddings.length === 0 ? (
                      <Chip tone="accent">new</Chip>
                    ) : (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {u.guestOfWeddings.map((s) => (
                          <span
                            key={s}
                            style={{
                              fontFamily: 'ui-monospace, Menlo, monospace',
                              fontSize: 10,
                              color: C.mute,
                              background: '#24242C',
                              padding: '2px 6px',
                              borderRadius: 4,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={td}>
                    <Chip>{u.provider || '—'}</Chip>
                  </td>
                  <td style={td}>
                    <span style={{ color: C.mute }}>{fmtRelative(u.last_sign_in_at)}</span>
                  </td>
                  <td style={td}>
                    {u.lastContact ? (
                      <Chip tone={u.lastContact.status === 'sent' ? 'ok' : u.lastContact.status === 'skipped' ? 'mute' : 'danger'}>
                        {u.lastContact.status} · {fmtRelative(u.lastContact.sent_at)}
                      </Chip>
                    ) : (
                      <span style={{ color: C.dim, fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <button
                      onClick={() => openModal(u)}
                      style={u.lastContact ? btnGhost : btnPrimary}
                    >
                      {u.lastContact ? 'Send again' : 'Send hello'}
                    </button>
                  </td>
                  <td style={{ ...td, textAlign: 'right', width: 44 }}>
                    <button
                      onClick={() => { setDeleteUser(u); setDeleteMsg(null); }}
                      title="Delete user"
                      style={btnTrash}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.panelHi }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Outreach log · 90d retention</h2>
          <span style={{ fontSize: 11, color: C.dim, background: C.bg, padding: '2px 8px', borderRadius: 999, border: `1px solid ${C.border}` }}>
            {log.length}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['When', 'To', 'Kind', 'Status', 'Subject', 'From', 'By'].map((h, i) => (
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
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: C.dim }}>
                    No outreach yet.
                  </td>
                </tr>
              )}
              {log.map((l) => (
                <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={td}>
                    <span style={{ color: C.text }}>{fmtRelative(l.created_at)}</span>
                  </td>
                  <td style={td}>
                    <span style={{ color: C.mute }}>{l.user_email || '—'}</span>
                  </td>
                  <td style={td}>
                    <Chip tone="accent">{l.kind}</Chip>
                  </td>
                  <td style={td}>
                    <Chip
                      tone={
                        l.status === 'sent' ? 'ok' : l.status === 'failed' ? 'danger' : 'mute'
                      }
                    >
                      {l.status}
                    </Chip>
                  </td>
                  <td style={td}>
                    <span style={{ color: C.mute, fontSize: 11 }}>{l.subject || '—'}</span>
                  </td>
                  <td style={td}>
                    <span style={{ color: C.mute, fontSize: 11 }}>{l.from_email || '—'}</span>
                  </td>
                  <td style={td}>
                    <span style={{ color: C.dim, fontSize: 11 }}>{l.sent_by || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk delete confirm */}
      {bulkConfirm && (
        <div
          onClick={() => !bulkRunning && setBulkConfirm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 70 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 560, maxHeight: '88vh', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22, display: 'flex', flexDirection: 'column' }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.danger }}>
              Delete {selected.size} user{selected.size === 1 ? '' : 's'}
            </h3>
            <div style={{ color: C.mute, fontSize: 13, marginTop: 6 }}>
              Permanent. Users owning weddings will be skipped (delete those weddings first).
            </div>

            {/* Selected preview */}
            <div style={{ marginTop: 14, border: `1px solid ${C.border}`, borderRadius: 10, maxHeight: 200, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <tbody>
                  {Array.from(selected).map((id) => {
                    const r = rows.find((x) => x.id === id);
                    return (
                      <tr key={id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '6px 12px', color: C.text }}>
                          {r?.email || id}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Results stream */}
            {bulkResults.length > 0 && (
              <div style={{ marginTop: 14, border: `1px solid ${C.border}`, borderRadius: 10, maxHeight: 200, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {bulkResults.map((r) => (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '6px 12px', color: r.ok ? C.ok : C.danger }}>
                          {r.ok ? '✓' : '✗'}
                        </td>
                        <td style={{ padding: '6px 12px', color: C.text }}>
                          {r.email || r.id}
                        </td>
                        <td style={{ padding: '6px 12px', color: r.ok ? C.mute : C.danger, fontSize: 11 }}>
                          {r.msg}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 18 }}>
              <div style={{ color: C.dim, fontSize: 12 }}>
                {bulkRunning ? `Deleting ${bulkResults.length} / ${selected.size}…` : ''}
                {!bulkRunning && bulkResults.length > 0 && (
                  <>
                    Done. {bulkResults.filter((r) => r.ok).length} ok · {bulkResults.filter((r) => !r.ok).length} failed.
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setBulkConfirm(false)} disabled={bulkRunning} style={btnGhost}>
                  {bulkResults.length > 0 && !bulkRunning ? 'Close' : 'Cancel'}
                </button>
                {bulkResults.length === 0 && (
                  <button onClick={runBulkDelete} disabled={bulkRunning} style={{ ...btnDanger, opacity: bulkRunning ? 0.6 : 1 }}>
                    {bulkRunning ? 'Deleting…' : `Delete ${selected.size} permanently`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete user modal */}
      {deleteUser && (
        <div
          onClick={() => !deleting && setDeleteUser(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 70 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 480, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22 }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.danger }}>Delete auth user</h3>
            <div style={{ color: C.mute, fontSize: 13, marginTop: 6, wordBreak: 'break-all' }}>
              {deleteUser.email || deleteUser.id}
            </div>
            <div style={{ color: C.mute, fontSize: 13, marginTop: 12, padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8 }}>
              Permanently removes the Supabase auth user + any outreach log entries. Blocked if they own a wedding — delete the wedding from <code style={{ color: C.text }}>/ops</code> first.
            </div>
            {deleteMsg && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 8,
                  fontSize: 13,
                  color: deleteMsg.startsWith('Failed') ? C.danger : C.ok,
                  background: deleteMsg.startsWith('Failed') ? 'rgba(255,107,122,0.08)' : 'rgba(97,210,154,0.08)',
                }}
              >
                {deleteMsg}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button onClick={() => setDeleteUser(null)} disabled={deleting} style={btnGhost}>Cancel</button>
              <button onClick={runDeleteUser} disabled={deleting} style={{ ...btnDanger, opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose modal (single user, arbitrary-email test, OR bulk send) */}
      {(openFor || testEmail || bulkTargets) && (
        <div
          onClick={() => !sending && (setOpenFor(null), setTestEmail(null), setBulkTargets(null))}
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
              maxWidth: 920,
              maxHeight: '92vh',
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                  {bulkTargets
                    ? `Send to ${bulkTargets.length} user${bulkTargets.length === 1 ? '' : 's'}`
                    : testEmail
                    ? `Test send to ${testEmail}`
                    : `Send hello to ${openFor?.email}`}
                </h2>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                  {bulkTargets
                    ? 'Each recipient gets their own personalized email — never a shared To. Preview shown for the first recipient.'
                    : testEmail
                    ? 'One-off — not logged, no user record.'
                    : openFor
                    ? `${openFor.firstName ? `→ ${openFor.firstName} · ` : ''}signed up ${openFor.signupRelative}`
                    : ''}
                </div>
              </div>
              <button
                onClick={() => { setOpenFor(null); setTestEmail(null); setBulkTargets(null); }}
                disabled={sending}
                style={btnGhost}
              >
                Close
              </button>
            </div>

            {/* from / reply-to / to — From is editable per send */}
            {previewData && (
              <div style={{ padding: '10px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: 11, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', minWidth: 60 }}>
                    Template
                  </label>
                  <select
                    value={template}
                    onChange={(e) => changeTemplate(e.target.value)}
                    disabled={previewLoading}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      color: C.text,
                      fontSize: 13,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="onboarding_hello">Onboarding hello — dashboard CTA</option>
                    <option value="beta_launch">Beta launch invite — Cal.com booking CTA</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: 11, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', minWidth: 60 }}>
                    From
                  </label>
                  <input
                    value={fromAddr}
                    onChange={(e) => setFromAddr(e.target.value)}
                    placeholder="KV at Phera <kv@phera.io>"
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      color: C.text,
                      fontSize: 13,
                      outline: 'none',
                      fontFamily: 'ui-monospace, Menlo, monospace',
                    }}
                  />
                  <span style={{ fontSize: 10, color: C.dim }}>
                    must use a Resend-verified domain
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: 12, color: C.mute, paddingLeft: 70 }}>
                  <span><strong style={{ color: C.text }}>Reply-To:</strong> {previewData.replyTo || '—'}</span>
                  <span>
                    <strong style={{ color: C.text }}>To:</strong>{' '}
                    {bulkTargets
                      ? `${bulkTargets.length} recipients — ${bulkTargets
                          .slice(0, 3)
                          .map((u) => u.email)
                          .join(', ')}${bulkTargets.length > 3 ? `, +${bulkTargets.length - 3} more` : ''}`
                      : testEmail || openFor?.email}
                  </span>
                </div>

                {/* Subject — always visible, not buried in a tab */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: 11, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', minWidth: 60 }}>
                    Subject
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      color: C.text,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Notes — real sends only (logged, not emailed) */}
                {!testEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{ fontSize: 11, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', minWidth: 60 }}>
                      Notes
                    </label>
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="for log — not sent (e.g. reached via LinkedIn first)"
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        background: C.bg,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        color: C.text,
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, gap: 2, padding: '0 12px' }}>
              {(bulkTargets
                ? ([['rendered', 'Preview']] as const)
                : ([
                    ['rendered', 'Preview'],
                    ['plain', 'Plain text'],
                    ['html', 'Raw HTML'],
                  ] as const)
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setActiveTab(k)}
                  style={{
                    background: activeTab === k ? C.bg : 'transparent',
                    color: activeTab === k ? C.text : C.mute,
                    border: 'none',
                    padding: '10px 16px',
                    fontSize: 12,
                    cursor: 'pointer',
                    borderBottom: activeTab === k ? `2px solid ${C.accent}` : '2px solid transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {previewLoading && (
                <div style={{ color: C.dim, textAlign: 'center', padding: 40 }}>
                  Loading preview…
                </div>
              )}
              {previewData && activeTab === 'rendered' && (
                <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
                  <iframe
                    title="Email preview"
                    srcDoc={html}
                    style={{ width: '100%', height: '560px', border: 'none', background: '#fff' }}
                  />
                </div>
              )}
              {previewData && activeTab === 'plain' && (
                <div>
                  <label style={labelStyle}>Plain-text body</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={18}
                    style={{ ...textFieldStyle, fontFamily: 'ui-monospace, Menlo, monospace' }}
                  />
                </div>
              )}
              {previewData && activeTab === 'html' && (
                <div>
                  <label style={labelStyle}>HTML body (edit carefully)</label>
                  <textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    rows={24}
                    style={{ ...textFieldStyle, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11 }}
                  />
                </div>
              )}
            </div>

            {/* Bulk per-recipient results stream */}
            {bulkTargets && bulkSendResults.length > 0 && (
              <div style={{ borderTop: `1px solid ${C.border}`, maxHeight: 160, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {bulkSendResults.map((r) => (
                      <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '6px 12px', color: r.ok ? C.ok : C.danger, width: 24 }}>
                          {r.ok ? '✓' : '✗'}
                        </td>
                        <td style={{ padding: '6px 12px', color: C.text }}>{r.email || r.id}</td>
                        <td style={{ padding: '6px 12px', color: r.ok ? C.mute : C.danger, fontSize: 11 }}>
                          {r.msg}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* footer */}
            {sendResult && (
              <div
                style={{
                  padding: '10px 20px',
                  borderTop: `1px solid ${C.border}`,
                  fontSize: 13,
                  color: sendResult.ok ? C.ok : C.danger,
                  background: sendResult.ok ? 'rgba(97,210,154,0.06)' : 'rgba(255,107,122,0.06)',
                }}
              >
                {sendResult.msg}
              </div>
            )}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              {bulkTargets ? (
                <span style={{ fontSize: 11, color: C.dim }}>
                  {sending
                    ? `Sending ${bulkSendResults.length} / ${bulkTargets.length}…`
                    : `${bulkTargets.length} individual email${bulkTargets.length === 1 ? '' : 's'} — one per recipient.`}
                </span>
              ) : openFor ? (
                <button onClick={skip} disabled={sending} style={btnGhost}>
                  Skip (mark contacted, no send)
                </button>
              ) : (
                <span style={{ fontSize: 11, color: C.dim }}>
                  Test sends go directly to the address above. Nothing stored.
                </span>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setOpenFor(null); setTestEmail(null); setBulkTargets(null); }}
                  disabled={sending}
                  style={btnGhost}
                >
                  {bulkTargets && bulkSendResults.length > 0 && !sending ? 'Close' : 'Cancel'}
                </button>
                <button
                  onClick={send}
                  disabled={sending || !previewData || (!!bulkTargets && bulkSendResults.length > 0)}
                  style={{ ...btnPrimary, opacity: sending || (!!bulkTargets && bulkSendResults.length > 0) ? 0.6 : 1 }}
                >
                  {sending
                    ? 'Sending…'
                    : bulkTargets
                    ? `Send ${bulkTargets.length} email${bulkTargets.length === 1 ? '' : 's'}`
                    : testEmail
                    ? 'Send test'
                    : 'Send email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
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

const td: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'middle' };

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  color: C.text,
  border: `1px solid ${C.border}`,
  padding: '8px 14px',
  fontSize: 13,
  borderRadius: 8,
  cursor: 'pointer',
};

const btnPrimary: React.CSSProperties = {
  background: C.accent,
  color: '#0B0B0E',
  border: 'none',
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 8,
  cursor: 'pointer',
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

const select: React.CSSProperties = {
  background: C.panel,
  color: C.text,
  border: `1px solid ${C.border}`,
  padding: '6px 10px',
  fontSize: 13,
  borderRadius: 8,
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: C.mute,
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 6,
};

const textFieldStyle: React.CSSProperties = {
  width: '100%',
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.text,
  fontSize: 14,
  padding: '10px 12px',
  outline: 'none',
  resize: 'vertical',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};
