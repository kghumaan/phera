'use client';

import { useState } from 'react';
import { Box, Typography, ListItemIcon, ListItemText } from '@mui/material';
import { PheraMenu, PheraMenuItem } from '@/components/shared/Menu';
import { TRAVEL_ICON_MAP, TRAVEL_TYPE_LABELS } from './travel-utils';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface AddSectionMenuProps {
  onAdd: (type: string) => void;
}

const SECTION_TYPES = ['travel', 'flight', 'travel_note', 'accommodation', 'hotel'] as const;

export default function AddSectionMenu({ onAdd }: AddSectionMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          width: '100%',
          bgcolor: COLORS.border.light,
          border: '1px dashed #BCBCBC',
          borderRadius: RADII.sm,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          '&:hover': { bgcolor: COLORS.border.default },
        }}
      >
        <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '0.95rem' }}>
          + Add Section
        </Typography>
        <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
          Travel, flight, hotel, and more
        </Typography>
      </Box>
      <PheraMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { borderRadius: RADII.md, minWidth: 200 },
        }}
      >
        {SECTION_TYPES.map((type) => {
          const Icon = TRAVEL_ICON_MAP[type];
          return (
            <PheraMenuItem
              key={type}
              onClick={() => {
                onAdd(type);
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>{Icon && <Icon fontSize="small" />}</ListItemIcon>
              <ListItemText>{TRAVEL_TYPE_LABELS[type]}</ListItemText>
            </PheraMenuItem>
          );
        })}
      </PheraMenu>
    </>
  );
}
