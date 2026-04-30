'use client';

/**
 * Derived campaign list — aggregated from outreach_events rows. A "campaign"
 * here is a cluster of events that share template_name + creation day. Cheap
 * to compute, no new tables, lets us ship a useful history without a
 * migration.
 */

import { Box, Stack, Typography } from '@mui/material';
import { History } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { PheraCard } from '@/components/shared/Card';
import { PheraChip } from '@/components/shared/Chip';
import { EmptyState } from '@/components/shared/EmptyState';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { getInviteTemplate } from '@/lib/invites/templates';

export interface CampaignHistoryRow {
  bucketKey: string;
  templateId: string;
  templateTitle: string;
  sentAt: string;
  recipientCount: number;
  kind?: 'sent' | 'failed';
  sampleError?: string;
}

export interface CampaignHistoryProps {
  rows: CampaignHistoryRow[];
  loading: boolean;
}

function relativeDay(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function CampaignHistory({ rows, loading }: CampaignHistoryProps) {
  if (loading) {
    return (
      <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
        Loading history…
      </Typography>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<History sx={{ fontSize: 40 }} />}
        title="No campaigns yet"
        subtitle="Pick a template above to send your first round of invites."
      />
    );
  }

  return (
    <Stack spacing={1}>
      {rows.map((row) => {
        const tmpl = getInviteTemplate(row.templateId);
        const Icon = tmpl?.icon ?? History;
        const isFailed = row.kind === 'failed';
        return (
          <PheraCard key={row.bucketKey} variant="default" sx={{ p: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: RADII.md,
                  bgcolor: isFailed
                    ? alpha(COLORS.accent.dangerText, 0.1)
                    : alpha(COLORS.brand.primary, 0.1),
                  color: isFailed ? COLORS.accent.dangerText : COLORS.brand.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ color: COLORS.text.strong }}>
                  {row.templateTitle}
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                  {isFailed ? 'Failed' : 'Sent'} {relativeDay(row.sentAt)}
                  {isFailed && row.sampleError ? ` · ${row.sampleError}` : ''}
                </Typography>
              </Box>
              <PheraChip
                tone={isFailed ? 'danger' : 'success'}
                label={`${row.recipientCount} ${isFailed ? 'failed' : 'sent'}`}
                size="small"
              />
            </Stack>
          </PheraCard>
        );
      })}
    </Stack>
  );
}

export default CampaignHistory;
