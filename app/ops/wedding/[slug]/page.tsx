'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Detail = {
  slug: string;
  wedding: Record<string, unknown> | null;
  counts: {
    guests: number;
    rsvps: number;
    outreachEvents: number;
    whatsappMessages: number;
  };
  recentGuests: Array<{
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    avatar_color: string | null;
    initials: string | null;
    avatar_svg: string | null;
    outreach_status: string | null;
    contact_type: string | null;
    created_at: string;
  }>;
  recentOutreach: Array<{
    id: string;
    event_type: string | null;
    template_name: string | null;
    channel: string | null;
    created_at: string;
  }>;
};

type Preview = {
  slug: string;
  weddingId: string | null;
  exists: boolean;
  rows: Array<{ table: string; count: number }>;
  total: number;
};

type DeleteResult = {
  ok: boolean;
  slug: string;
  weddingId: string | null;
  totalDeleted: number;
  deleted: Array<{ table: string; deleted: number; error?: string }>;
  errors: Array<{ table: string; error?: string }>;
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

const fmt = (v: unknown) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
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

export default function OpsWeddingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = use(params);

  const [detail, setDetail] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<DeleteResult | null>(null);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ops/wedding/${encodeURIComponent(slug)}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d?.error || `HTTP ${res.status}`);
        setLoading(false);
        return;
      }
      setDetail(await res.json());
    } catch (e) {
      setErr((e as Error).message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const openConfirm = async () => {
    setConfirmOpen(true);
    setPreviewLoading(true);
    setConfirmText('');
    setDeleteResult(null);
    try {
      const res = await fetch(
        `/api/ops/wedding/${encodeURIComponent(slug)}/preview`,
        { cache: 'no-store' },
      );
      const data = await res.json();
      setPreview(data);
    } catch (e) {
      setErr((e as Error).message);
    }
    setPreviewLoading(false);
  };

  const runDelete = async () => {
    if (confirmText !== slug) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/ops/wedding/${encodeURIComponent(slug)}/delete`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ confirmSlug: slug }),
        },
      );
      const data = (await res.json()) as DeleteResult;
      setDeleteResult(data);
      await loadDetail();
    } catch (e) {
      setErr((e as Error).message);
    }
    setDeleting(false);
  };

  const w = detail?.wedding as Record<string, unknown> | null;

  return (
    <main style={{ padding: '28px 28px 80px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/ops" style={{ color: C.mute, fontSize: 13, textDecoration: 'none' }}>
          ← Back to ops
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: C.dim }}>WEDDING</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: '4px 0 4px', fontFamily: 'ui-monospace, Menlo, monospace' }}>
            {slug}
          </h1>
          <div style={{ color: C.mute, fontSize: 14 }}>
            {(w?.couple_name as string) || '—'}
          </div>
        </div>
        <button onClick={openConfirm} style={btnDanger}>
          Delete all data for this wedding
        </button>
      </div>

      {err && (
        <div style={{ background: 'rgba(255,107,122,0.1)', border: `1px solid ${C.danger}55`, color: C.danger, padding: 12, borderRadius: 10, marginBottom: 16 }}>
          {err}
        </div>
      )}

      {loading && <div style={{ color: C.mute }}>Loading…</div>}

      {detail && (
        <>
          {!detail.wedding && (
            <div style={{ background: 'rgba(240,176,96,0.1)', color: C.warn, border: `1px solid ${C.warn}55`, padding: 12, borderRadius: 10, marginBottom: 18 }}>
              No row found in <code>weddings</code> table. Slug may only exist on child tables (orphan data). You can still delete.
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
            <StatCell label="Guests" value={detail.counts.guests} />
            <StatCell label="RSVPs" value={detail.counts.rsvps} />
            <StatCell label="Outreach events" value={detail.counts.outreachEvents} />
            <StatCell label="WhatsApp msgs" value={detail.counts.whatsappMessages} />
          </div>

          {/* Wedding row */}
          {w && (
            <Section title="Wedding row (weddings table)">
              <Panel>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {Object.entries(w)
                      .filter(([k]) => !['published_snapshot', 'couple_images', 'rsvp_confirmation_messages'].includes(k))
                      .map(([k, v]) => (
                        <tr key={k} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: '8px 14px', color: C.dim, width: 220, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>
                            {k}
                          </td>
                          <td style={{ padding: '8px 14px', color: C.text, wordBreak: 'break-all' }}>
                            {fmt(v)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </Panel>
            </Section>
          )}

          {/* Recent guests */}
          <Section title="Latest guests (50)">
            <Panel>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['', 'Name', 'Email', 'Phone', 'Type', 'Outreach', 'Added'].map((h, i) => (
                        <th key={i} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.recentGuests.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: C.dim }}>
                          No guests.
                        </td>
                      </tr>
                    )}
                    {detail.recentGuests.map((g) => (
                      <tr key={g.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '8px 14px' }}>
                          {g.avatar_svg ? (
                            <div
                              aria-hidden
                              dangerouslySetInnerHTML={{ __html: g.avatar_svg }}
                              style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', background: '#fff' }}
                            />
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: g.avatar_color || '#4a4a55', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 600 }}>
                              {g.initials || '?'}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 14px', color: C.text }}>{g.name || '—'}</td>
                        <td style={{ padding: '8px 14px', color: C.mute }}>{g.email || '—'}</td>
                        <td style={{ padding: '8px 14px', color: C.mute }}>{g.phone || '—'}</td>
                        <td style={{ padding: '8px 14px', color: C.mute }}>{g.contact_type || '—'}</td>
                        <td style={{ padding: '8px 14px', color: C.mute }}>{g.outreach_status || '—'}</td>
                        <td style={{ padding: '8px 14px', color: C.mute }}>{fmtRelative(g.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </Section>

          {/* Recent outreach */}
          <Section title="Recent outreach events (15)">
            <Panel>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['When', 'Event', 'Template', 'Channel'].map((h, i) => (
                      <th key={i} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.recentOutreach.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: C.dim }}>
                        No outreach events.
                      </td>
                    </tr>
                  )}
                  {detail.recentOutreach.map((o) => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '8px 14px', color: C.mute }}>{fmtRelative(o.created_at)}</td>
                      <td style={{ padding: '8px 14px', color: C.text }}>{o.event_type || '—'}</td>
                      <td style={{ padding: '8px 14px', color: C.mute }}>{o.template_name || '—'}</td>
                      <td style={{ padding: '8px 14px', color: C.mute }}>{o.channel || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </Section>
        </>
      )}

      {/* Delete modal */}
      {confirmOpen && (
        <div
          onClick={() => !deleting && setConfirmOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 620, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}
          >
            {!deleteResult ? (
              <>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.danger }}>
                  Delete all data for {slug}
                </h2>
                <p style={{ color: C.mute, fontSize: 13, marginTop: 6 }}>
                  This is destructive and cannot be undone. Preview below shows row counts per table that will be deleted.
                </p>

                {previewLoading && <div style={{ color: C.dim, padding: 16 }}>Calculating…</div>}

                {preview && (
                  <>
                    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, margin: '14px 0', maxHeight: 300, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <tbody>
                          {preview.rows
                            .filter((r) => r.count > 0)
                            .map((r) => (
                              <tr key={r.table} style={{ borderBottom: `1px solid ${C.border}` }}>
                                <td style={{ padding: '6px 12px', fontFamily: 'ui-monospace, Menlo, monospace', color: C.text }}>
                                  {r.table}
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'right', color: C.warn, fontVariantNumeric: 'tabular-nums' }}>
                                  {r.count}
                                </td>
                              </tr>
                            ))}
                          {preview.rows.filter((r) => r.count > 0).length === 0 && (
                            <tr>
                              <td style={{ padding: 16, color: C.dim, textAlign: 'center' }}>
                                Nothing to delete.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ color: C.mute, fontSize: 13 }}>
                      Total rows: <strong style={{ color: C.danger }}>{preview.total}</strong>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, color: C.mute, marginBottom: 6 }}>
                        Type <code style={{ color: C.text }}>{slug}</code> to confirm:
                      </label>
                      <input
                        autoFocus
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={slug}
                        style={{ width: '100%', padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', fontFamily: 'ui-monospace, Menlo, monospace' }}
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                  <button onClick={() => setConfirmOpen(false)} disabled={deleting} style={btnGhost}>
                    Cancel
                  </button>
                  <button
                    onClick={runDelete}
                    disabled={deleting || confirmText !== slug || !preview || preview.total === 0}
                    style={{
                      ...btnDanger,
                      opacity: deleting || confirmText !== slug || !preview || preview.total === 0 ? 0.5 : 1,
                      cursor: deleting || confirmText !== slug || !preview || preview.total === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {deleting ? 'Deleting…' : `Delete ${preview?.total ?? 0} rows`}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: deleteResult.ok ? C.ok : C.warn }}>
                  {deleteResult.ok ? 'Deleted.' : 'Deleted with errors.'}
                </h2>
                <p style={{ color: C.mute, fontSize: 13, marginTop: 6 }}>
                  {deleteResult.totalDeleted} rows removed.
                </p>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, margin: '14px 0', maxHeight: 300, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <tbody>
                      {deleteResult.deleted
                        .filter((r) => r.deleted > 0 || r.error)
                        .map((r) => (
                          <tr key={r.table} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: '6px 12px', fontFamily: 'ui-monospace, Menlo, monospace', color: r.error ? C.danger : C.text }}>
                              {r.table}
                            </td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', color: r.error ? C.danger : C.ok, fontVariantNumeric: 'tabular-nums' }}>
                              {r.error ? r.error : r.deleted}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={() => { setConfirmOpen(false); router.push('/ops'); }} style={btnGhost}>
                    Back to ops
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 13, letterSpacing: 1, color: C.mute, fontWeight: 600, margin: '0 0 10px', textTransform: 'uppercase' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {children}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ color: C.dim, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: C.text, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  color: C.dim,
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: 1,
  textTransform: 'uppercase',
  background: C.panelHi,
  borderBottom: `1px solid ${C.border}`,
  whiteSpace: 'nowrap',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  color: C.text,
  border: `1px solid ${C.border}`,
  padding: '8px 14px',
  fontSize: 13,
  borderRadius: 8,
  cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  background: C.danger,
  color: '#1a0508',
  border: 'none',
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 8,
  cursor: 'pointer',
};
