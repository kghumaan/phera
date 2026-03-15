'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Typography, Stack, Popover, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

// Generate time slots in 15-min intervals
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const period = h < 12 ? 'AM' : 'PM';
      const minute = m.toString().padStart(2, '0');
      slots.push(`${hour12}:${minute} ${period}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

interface TimePickerProps {
  label: string;
  value: string; // e.g. "7:00 PM" or "7:00 PM - 10:00 PM"
  onChange: (value: string) => void;
}

export default function TimePicker({ label, value, onChange }: TimePickerProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Parse value into start and optional end
  const parts = value.split(' - ').map(s => s.trim());
  const startTime = parts[0] || '';
  const endTime = parts[1] || '';

  // Which column is being picked
  const [pickingEnd, setPickingEnd] = useState(false);

  const handleSelectTime = (slot: string) => {
    if (!pickingEnd) {
      // Setting start time
      if (endTime) {
        onChange(`${slot} - ${endTime}`);
      } else {
        onChange(slot);
      }
      setOpen(false);
    } else {
      // Setting end time
      onChange(`${startTime || slot} - ${slot}`);
      setOpen(false);
      setPickingEnd(false);
    }
  };

  const handleAddEndTime = () => {
    setPickingEnd(true);
  };

  const handleRemoveEndTime = () => {
    onChange(startTime);
    setPickingEnd(false);
  };

  const handleOpenStart = () => {
    setPickingEnd(false);
    setOpen(true);
  };

  const handleOpenEnd = () => {
    setPickingEnd(true);
    setOpen(true);
  };

  // Display text
  const displayText = value || label;
  const hasValue = !!value;

  // Scroll to selected time in popover
  const listRef = useRef<HTMLDivElement>(null);
  const activeTime = pickingEnd ? endTime : startTime;

  useEffect(() => {
    if (open && listRef.current && activeTime) {
      const idx = TIME_SLOTS.findIndex(s => s === activeTime);
      if (idx >= 0) {
        // Defer to next frame so the popover has rendered
        requestAnimationFrame(() => {
          listRef.current?.children[idx]?.scrollIntoView({ block: 'center' });
        });
      }
    }
  }, [open, activeTime]);

  return (
    <>
      <Box
        ref={anchorRef}
        onClick={handleOpenStart}
        sx={{
          bgcolor: 'white',
          border: '1px solid #BCBCBC',
          borderRadius: '8px',
          height: 48,
          px: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          position: 'relative',
          '&:hover': { borderColor: '#999' },
          flex: 1,
        }}
      >
        <Typography sx={{ fontSize: '0.875rem', color: '#bcbcbc', flexShrink: 0 }}>{'⏰'}</Typography>

        {/* Start time chip */}
        <Typography
          sx={{
            fontSize: '1rem',
            color: hasValue ? '#1a1a1a' : '#BCBCBC',
            flexShrink: 0,
          }}
        >
          {startTime || 'Start *'}
        </Typography>

        {/* End time area */}
        {endTime ? (
          <>
            <Typography sx={{ color: '#6a6a6a', fontSize: '0.875rem' }}>-</Typography>
            <Typography
              onClick={(e) => { e.stopPropagation(); handleOpenEnd(); }}
              sx={{
                fontSize: '1rem',
                color: '#1a1a1a',
                cursor: 'pointer',
                '&:hover': { color: '#DE3F5E' },
              }}
            >
              {endTime}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleRemoveEndTime(); }}
              sx={{ p: 0.25, color: '#999', ml: 'auto' }}
            >
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </>
        ) : startTime ? (
          <Typography
            onClick={(e) => { e.stopPropagation(); handleAddEndTime(); setOpen(true); }}
            sx={{
              fontSize: '0.8rem',
              color: '#BCBCBC',
              cursor: 'pointer',
              ml: 'auto',
              '&:hover': { color: '#DE3F5E' },
            }}
          >
            + end
          </Typography>
        ) : null}

        {/* Floating label */}
        {hasValue && (
          <Box sx={{
            position: 'absolute',
            top: -9,
            left: 10,
            bgcolor: 'white',
            px: 0.5,
            lineHeight: 1,
          }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#524344', lineHeight: 1 }}>
              {label}
            </Typography>
          </Box>
        )}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => { setOpen(false); setPickingEnd(false); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: { borderRadius: '12px', mt: 0.5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', bgcolor: 'white' },
          },
        }}
      >
        <Box sx={{ p: 1.5, width: 200 }}>
          <Typography variant="caption" sx={{ color: '#6a6a6a', fontWeight: 600, mb: 1, display: 'block' }}>
            {pickingEnd ? 'Select end time' : 'Select start time'}
          </Typography>
          <Box ref={listRef} sx={{ maxHeight: 240, overflowY: 'auto' }}>
            {(pickingEnd && startTime
              ? TIME_SLOTS.slice(TIME_SLOTS.indexOf(startTime) + 1)
              : TIME_SLOTS
            ).map((slot) => (
              <Box
                key={slot}
                onClick={() => handleSelectTime(slot)}
                sx={{
                  px: 1.5, py: 0.75,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  bgcolor: slot === activeTime ? 'rgba(222,63,94,0.08)' : 'transparent',
                  fontWeight: slot === activeTime ? 600 : 400,
                  color: slot === activeTime ? '#DE3F5E' : '#1a1a1a',
                  fontSize: '0.9rem',
                  '&:hover': { bgcolor: 'rgba(222,63,94,0.06)' },
                }}
              >
                {slot}
              </Box>
            ))}
          </Box>
        </Box>
      </Popover>
    </>
  );
}
