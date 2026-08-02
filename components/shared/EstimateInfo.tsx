'use client';

import { Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { COLORS } from '@/lib/theme/tokens';
import { ESTIMATE_NOTE } from '@/lib/vendors/estimates';

/**
 * Small "this is an estimate" info icon. Sits next to any placeholder figure
 * (capacity, ballpark cost) so we never present a guess as a confirmed number —
 * hover or tap reveals the disclaimer. Use everywhere an estimate is shown.
 */
export function EstimateInfo({ note = ESTIMATE_NOTE, size = 15 }: { note?: string; size?: number }) {
  return (
    <Tooltip title={note} arrow enterTouchDelay={0} leaveTouchDelay={4000}>
      <InfoOutlinedIcon
        aria-label="Estimate details"
        sx={{
          fontSize: size,
          color: COLORS.text.faint,
          cursor: 'help',
          verticalAlign: 'middle',
          '&:hover': { color: COLORS.text.muted },
        }}
      />
    </Tooltip>
  );
}

export default EstimateInfo;
