'use client';

import { useState } from 'react';
import { Box, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { TRAVEL_ICON_MAP, TRAVEL_TYPE_LABELS } from './travel-utils';

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
          bgcolor: '#EBEBEB',
          border: '1px dashed #BCBCBC',
          borderRadius: '8px',
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
          '&:hover': { bgcolor: '#E0E0E0' },
        }}
      >
        <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '0.95rem' }}>
          + Add Section
        </Typography>
        <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
          Travel, flight, hotel, and more
        </Typography>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { borderRadius: '12px', minWidth: 200 },
        }}
      >
        {SECTION_TYPES.map((type) => {
          const Icon = TRAVEL_ICON_MAP[type];
          return (
            <MenuItem
              key={type}
              onClick={() => {
                onAdd(type);
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>{Icon && <Icon fontSize="small" />}</ListItemIcon>
              <ListItemText>{TRAVEL_TYPE_LABELS[type]}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
