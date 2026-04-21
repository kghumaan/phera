'use client';

import { Box, Stack, Typography, TextField, CircularProgress, alpha } from '@mui/material';
import { useState, use, useEffect } from 'react';
import { Send } from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import { PageHeading } from '@/components/shared/PageHeading';
import { PheraCard } from '@/components/shared/Card';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { SuccessAlert, ErrorAlert } from '@/components/shared/Alert';
import { PheraTextField } from '@/components/shared/TextField';
import { COLORS } from '@/lib/theme/tokens';

export default function SupportPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { user } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill name/email from auth so the couple doesn't have to retype
  // what we already know. They can still edit if needed.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || (user.user_metadata?.full_name as string) || '',
      email: prev.email || user.email || '',
    }));
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prefix the message so our inbox knows which admin + wedding it came from.
      const payload = {
        ...form,
        message: `[Admin support request — wedding: ${weddingSlug}]\n\n${form.message}`,
      };
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Failed to submit');
      setSuccess(true);
      setForm((prev) => ({ ...prev, message: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Stack spacing={3}>
        <PageHeading
          title="Support"
          subtitle="Stuck on something, seeing a bug, or have a feature idea? Drop us a note — we read every message."
        />

        {success && (
          <SuccessAlert onClose={() => setSuccess(false)}>
            Thanks — we got your message and will reply to {form.email || 'your email'} shortly.
          </SuccessAlert>
        )}
        {error && <ErrorAlert onClose={() => setError(null)}>{error}</ErrorAlert>}

        <PheraCard variant="default" sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <PheraTextField
                label="Your name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                fullWidth
              />
              <PheraTextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                fullWidth
              />
              <PheraTextField
                label="Phone (optional)"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                fullWidth
              />
              <PheraTextField
                label="What's going on?"
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                multiline
                minRows={5}
                fullWidth
                placeholder="Tell us what you ran into, or what you'd love to see added."
              />

              {/* On mobile: stack button + "typical response" text so the
                  button gets full width and the caption sits below it,
                  centered. Desktop keeps them on the same row. */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  gap: { xs: 1, sm: 2 },
                  pt: 1,
                }}
              >
                <PrimaryActionButton
                  type="submit"
                  startIcon={loading ? <CircularProgress size={16} sx={{ color: COLORS.bg.white }} /> : <Send />}
                  disabled={loading || !form.name || !form.email || !form.message}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {loading ? 'Sending…' : 'Send message'}
                </PrimaryActionButton>
                <Typography
                  variant="caption"
                  sx={{
                    color: COLORS.text.subtle,
                    textAlign: { xs: 'center', sm: 'left' },
                    width: { xs: '100%', sm: 'auto' },
                  }}
                >
                  Typical response: within a business day.
                </Typography>
              </Box>
            </Stack>
          </form>
        </PheraCard>

        <PheraCard variant="muted" sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: COLORS.text.strong, mb: 1 }}>
            Locked out of your account?
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
            Phera signs you in with a one-time code sent to your email or phone. If you&apos;ve lost access to
            both, send us the wedding URL + any email or phone you&apos;ve used with us above and we&apos;ll
            reset your sign-in method manually.
          </Typography>
        </PheraCard>
      </Stack>
    </Box>
  );
}
