'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
} from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { format } from 'date-fns';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';

interface ChatDateFormProps {
    label: string;
    onSave: (date: Date | null, formatted: string) => void;
    onSkip?: () => void;
    skipLabel?: string;
    initialDate?: Date | null;
    minDate?: Date;
}

export default function ChatDateForm({
    label,
    onSave,
    onSkip,
    skipLabel = 'Skip',
    initialDate = null,
    minDate
}: ChatDateFormProps) {
    const [date, setDate] = useState<Date | null>(initialDate);

    const handleSave = () => {
        if (!date) return;
        // Format as YYYY-MM-DD for consistency with backend
        const formatted = format(date, 'yyyy-MM-dd');
        onSave(date, formatted);
    };

    return (
        <Box sx={{
            bgcolor: 'white',
            p: 2.5,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            width: '100%',
            maxWidth: 480,
            mt: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <MobileDatePicker
                        label={label}
                        value={date}
                        onChange={(newValue) => setDate(newValue)}
                        minDate={minDate}
                        enableAccessibleFieldDOMStructure={false}
                        slots={{
                            textField: TextField,
                        }}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                size: 'small',
                                required: true,
                                sx: {
                                    ...ENHANCED_TEXT_FIELD_SX,
                                    '& .MuiOutlinedInput-root': {
                                        ...ENHANCED_TEXT_FIELD_SX['& .MuiOutlinedInput-root'],
                                        borderRadius: '12px',
                                        fontSize: '0.9rem',
                                        bgcolor: 'white',
                                        '& input': {
                                            py: 1.5,
                                            fontSize: '0.9rem',
                                            color: '#000000 !important',
                                            WebkitTextFillColor: '#000000 !important',
                                        },
                                        '& fieldset': { borderColor: 'rgba(0,0,0,0.3) !important' },
                                        '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.4) !important' },
                                    },
                                    '& .MuiInputLabel-root': {
                                        ...ENHANCED_TEXT_FIELD_SX['& .MuiInputLabel-root'],
                                        fontSize: '0.9rem',
                                        color: '#000000 !important',
                                    },
                                    '& .MuiInputAdornment-root .MuiSvgIcon-root': { color: '#DE3F5E' },
                                }
                            },
                            actionBar: {
                                actions: ['cancel', 'accept'],
                                sx: {
                                    '& .MuiButton-root': {
                                        color: '#DE3F5E',
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                    }
                                }
                            },
                            calendarHeader: {
                                sx: {
                                    '& .MuiPickersCalendarHeader-label': { color: '#000000', fontWeight: 700 },
                                    '& .MuiSvgIcon-root': { color: '#000000' }
                                }
                            },
                            day: {
                                sx: {
                                    color: '#000000 !important',
                                    fontWeight: 500,
                                    '&.Mui-selected': {
                                        backgroundColor: '#DE3F5E !important',
                                        color: '#ffffff !important',
                                    },
                                    '&.Mui-selected:hover': {
                                        backgroundColor: '#DE3F5E !important',
                                        opacity: 0.9,
                                    },
                                    '&.MuiPickersDay-today': {
                                        borderColor: '#DE3F5E !important',
                                        color: '#DE3F5E',
                                    }
                                }
                            }
                        }}
                    />

                    <Box sx={{ display: 'flex', gap: 1.5, mt: 1, width: '100%' }}>
                        {onSkip && (
                            <Button
                                onClick={onSkip}
                                size="small"
                                variant="contained"
                                fullWidth
                                sx={{
                                    bgcolor: '#DE3F5E',
                                    color: 'white',
                                    borderRadius: '16px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    py: 1,
                                    textTransform: 'none',
                                    flex: 1,
                                    '&:hover': { bgcolor: '#c73552' }
                                }}
                            >
                                {skipLabel}
                            </Button>
                        )}
                        <Button
                            variant="outlined"
                            onClick={handleSave}
                            disabled={!date}
                            size="small"
                            fullWidth
                            sx={{
                                borderRadius: '16px',
                                borderColor: '#DE3F5E',
                                color: '#DE3F5E',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                py: 1,
                                textTransform: 'none',
                                flex: 1,
                                border: '2px solid',
                                '&:hover': {
                                    border: '2px solid',
                                    borderColor: '#c73552',
                                    bgcolor: 'rgba(222, 63, 94, 0.04)'
                                },
                                '&.Mui-disabled': {
                                    border: '2px solid',
                                    borderColor: 'rgba(0,0,0,0.1)',
                                    color: 'rgba(0,0,0,0.1)'
                                }
                            }}
                        >
                            Confirm Date
                        </Button>
                    </Box>
                </Box>
            </LocalizationProvider>
        </Box>
    );
}
