'use client';

import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { PheraChip } from '@/components/shared/Chip';
import { StatCard } from '@/components/shared/StatCard';
import { SecondaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';
import type { AgentDataPanel } from '@/lib/agent/types';

export interface DataPanelProps {
  panel: AgentDataPanel;
  disabled?: boolean;
  onDismiss: () => void;
}

/** Chip rendering for the special-cased `rsvp_status` column. */
const RSVP_STATUS_CHIPS: Record<string, { tone: 'success' | 'danger' | 'warning' | 'neutral'; label: string }> = {
  attending: { tone: 'success', label: 'Attending' },
  not_attending: { tone: 'danger', label: 'Not attending' },
  maybe: { tone: 'warning', label: 'Maybe' },
  no_response: { tone: 'neutral', label: 'No reply' },
};

/** One table cell's content: RSVP chips, an em-dash for empty, plain text otherwise. */
function CellContent({ columnKey, value }: { columnKey: string; value: string | number | null | undefined }) {
  if (value == null || value === '') {
    return (
      <Typography variant="body2" sx={{ color: COLORS.text.faint }}>
        —
      </Typography>
    );
  }
  if (columnKey === 'rsvp_status') {
    const chip = RSVP_STATUS_CHIPS[String(value)];
    if (chip) return <PheraChip size="small" tone={chip.tone} label={chip.label} />;
  }
  return (
    <Typography variant="body2" sx={{ color: COLORS.text.strong }}>
      {value}
    </Typography>
  );
}

/**
 * Right-pane renderer for the generic `data_panel` directive — server-shaped
 * tables (guest lists, task lists) and stat summaries (RSVP counts, headcounts)
 * a tool attached to its result. Read-only: the only action is dismissing it.
 */
export function DataPanel({ panel, disabled, onDismiss }: DataPanelProps) {
  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Typography variant="body2" sx={{ color: COLORS.text.strong, fontWeight: 600 }}>
        {panel.title}
      </Typography>

      {panel.kind === 'table' ? (
        <Box
          sx={{
            overflowX: 'auto',
            border: `1px solid ${COLORS.border.faint}`,
            borderRadius: RADII.sm,
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                {panel.columns.map((col) => (
                  <TableCell key={col.key} sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" sx={{ color: COLORS.text.muted, fontWeight: 600 }}>
                      {col.label}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {panel.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex} sx={{ '&:last-child td': { border: 0 } }}>
                  {panel.columns.map((col) => (
                    <TableCell key={col.key} sx={{ whiteSpace: 'nowrap' }}>
                      <CellContent columnKey={col.key} value={row[col.key]} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Stack direction="row" flexWrap="wrap" sx={{ gap: 1.25 }}>
          {panel.items.map((item) => (
            <StatCard
              key={item.label}
              value={item.value}
              label={item.label}
              hint={item.hint}
              sx={{ flex: '1 1 140px', minWidth: 140 }}
            />
          ))}
        </Stack>
      )}

      <SecondaryActionButton fullWidth disabled={disabled} onClick={onDismiss}>
        Hide
      </SecondaryActionButton>
    </Stack>
  );
}

export default DataPanel;
