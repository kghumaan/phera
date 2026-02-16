'use client';

import {
    Box,
    Select,
    MenuItem,
    Typography,
    alpha,
    FormControl
} from '@mui/material';

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
            borderRadius: '12px',
            fontSize: '1.1rem',
            bgcolor: '#f5f5f5',
            fontWeight: 700,
            transition: 'all 0.2s',
            '& .MuiSelect-select': {
                py: 1.5,
                px: 2,
                textAlign: 'center',
                color: '#1a1a1a !important',
                WebkitTextFillColor: '#1a1a1a !important',
            },
            '& fieldset': { border: 'none' },
            '&.Mui-focused fieldset': { border: 'none' },
            '&:hover': {
                bgcolor: '#eeeeee',
            }
        },
    };

    return (
        <Box sx={{
            bgcolor: 'white',
            p: 3,
            borderRadius: '16px',
            border: '2px solid',
            borderColor: alpha('#000', 0.12),
            width: '100%',
            maxWidth: 240,
            mt: 1,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
            <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block', fontWeight: 500, fontSize: '0.75rem' }}>
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
                                borderRadius: '12px',
                                mt: 1,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                '& .MuiMenuItem-root': {
                                    fontWeight: 600,
                                    py: 1,
                                    justifyContent: 'center',
                                    '&.Mui-selected': {
                                        bgcolor: alpha('#DE3F5E', 0.1),
                                        color: '#DE3F5E',
                                        '&:hover': { bgcolor: alpha('#DE3F5E', 0.15) }
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
