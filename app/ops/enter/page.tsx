'use client';

import { useState, FormEvent } from 'react';

export default function OpsEnterPage() {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/ops/verify-pin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data?.error || 'Invalid PIN');
        setLoading(false);
        return;
      }
      // Hard nav so middleware reads the freshly-set cookie and the RSC cache
      // for /ops/enter is discarded.
      window.location.href = '/ops';
    } catch {
      setErr('Network error');
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#14141A',
          border: '1px solid #26262E',
          borderRadius: 14,
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.55, marginBottom: 10 }}>
          PHERA · INTERNAL
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px' }}>Ops console</h1>
        <p style={{ fontSize: 13, opacity: 0.6, margin: '0 0 20px' }}>
          Enter PIN to continue.
        </p>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••••"
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: 16,
            letterSpacing: 6,
            textAlign: 'center',
            background: '#0B0B0E',
            border: `1px solid ${err ? '#B83C4A' : '#2C2C36'}`,
            borderRadius: 10,
            color: '#E7E7EA',
            outline: 'none',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        />
        {err && (
          <div style={{ color: '#FF6B7A', fontSize: 13, marginTop: 10 }}>{err}</div>
        )}
        <button
          type="submit"
          disabled={loading || !pin}
          style={{
            width: '100%',
            marginTop: 16,
            padding: '12px 16px',
            background: loading || !pin ? '#2C2C36' : '#E7E7EA',
            color: loading || !pin ? '#6A6A75' : '#0B0B0E',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading || !pin ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Verifying…' : 'Enter'}
        </button>
      </form>
    </main>
  );
}
