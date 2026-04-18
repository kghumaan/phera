'use client';

import {
    Box,
    Select,
    MenuItem,
    Typography,
    alpha,
    FormControl
} from '@mui/material';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface ChatCountPickerProps {
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
    label?: string;
}

export default function ChatCountPicker({
    value,
    onChange,
    min = 1,
    max = 10,
    label = "Number of Days"
}: ChatCountPickerProps) {
    const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

    const commonFieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: RADII.md,
            fontSize: '1.1rem',
            bgcolor: COLORS.bg.subtle,
            fontWeight: 700,
            transition: 'all 0.2s',
            '& .MuiSelect-select': {
                py: 1.5,
                px: 2,
                textAlign: 'center',
                color: '#1a1a1a !important',
                WebkitTextFillColor: '#1a1a1a !important',
            },
            '& fieldset': { borderColor: COLORS.brand.primary, borderWidth: '2px' },
            '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary, borderWidth: '2px' },
            '&:hover fieldset': { borderColor: '#c73552', borderWidth: '2px' },
            '&:hover': {
                bgcolor: '#eeeeee',
            }
        },
    };

    return (
        <Box sx={{
            bgcolor: COLORS.bg.white,
            p: 3,
            borderRadius: RADII.lg,
            border: '2px solid',
            borderColor: alpha(COLORS.text.strong, 0.12),
            width: '100%',
            maxWidth: 360,
            mt: 1,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
            <Typography variant="caption" sx={{ color: COLORS.text.subtle, mb: 1, display: 'block', fontWeight: 500, fontSize: '0.875rem' }}>
                {label}
            </Typography>
            <FormControl fullWidth size="small">
                <Select
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    sx={commonFieldSx}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                borderRadius: RADII.md,
                                mt: 1,
                                border: '2px solid',
                                borderColor: alpha(COLORS.text.strong, 0.12),
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                '& .MuiMenuItem-root': {
                                    fontWeight: 600,
                                    py: 1,
                                    justifyContent: 'center',
                                    '&.Mui-selected': {
                                        bgcolor: alpha(COLORS.brand.primary, 0.1),
                                        color: COLORS.brand.primary,
                                        '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.15) }
                                    }
                                }
                            }
                        }
                    }}
                >
                    {options.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                            {opt} {opt === 1 ? 'Day' : 'Days'}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}
