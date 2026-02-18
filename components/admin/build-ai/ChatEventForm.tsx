'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    FormControl,
    Select,
    MenuItem,
    Typography,
    alpha,
    Switch,
    FormControlLabel,
    Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Stack from '@mui/material/Stack';
import { EVENT_TEMPLATES } from '@/components/admin/EventTemplates';

interface ChatEventFormProps {
    onSave: (event: any) => void;
    onCancel?: () => void;
    initialData?: any;
}

// Template chips for quick event creation
const TEMPLATE_CHIPS = EVENT_TEMPLATES.map(t => ({
  name: t.name,
  time: t.time,
}));

// Custom Digital Time Picker Component (from Schedule & Events)
function DigitalTimePicker({
    value,
    onChange,
}: {
    value: { hour: string; minute: string; period: 'AM' | 'PM' };
    onChange: (newValue: { hour: string; minute: string; period: 'AM' | 'PM' }) => void;
}) {
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const minutes = ['00', '15', '30', '45'];

    const handleChange = (field: keyof typeof value, newVal: string) => {
        onChange({ ...value, [field]: newVal });
    };

    return (
        <Box>
            <Stack direction="row" spacing={1} alignItems="center">
                <FormControl size="small" sx={{ width: 80 }}>
                    <Select
                        value={value.hour}
                        onChange={(e) => handleChange('hour', e.target.value)}
                        sx={{
                            bgcolor: '#f5f5f5',
                            '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            textAlign: 'center'
                        }}
                        MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                    >
                        {hours.map((h) => (
                            <MenuItem key={h} value={h}>{h}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Typography sx={{ fontWeight: 600, color: '#999' }}>:</Typography>

                <FormControl size="small" sx={{ width: 80 }}>
                    <Select
                        value={value.minute}
                        onChange={(e) => handleChange('minute', e.target.value)}
                        sx={{
                            bgcolor: '#f5f5f5',
                            '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '1.1rem'
                        }}
                        MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                    >
                        {minutes.map((m) => (
                            <MenuItem key={m} value={m}>{m}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <ToggleButtonGroup
                    value={value.period}
                    exclusive
                    onChange={(_, newPeriod) => {
                        if (newPeriod) handleChange('period', newPeriod);
                    }}
                    size="small"
                    sx={{
                        height: 40,
                        '& .MuiToggleButton-root': {
                            border: 'none',
                            bgcolor: '#f5f5f5',
                            color: '#999',
                            px: 2,
                            '&.Mui-selected': {
                                bgcolor: '#DE3F5E',
                                color: 'white',
                                '&:hover': { bgcolor: '#C8365A' }
                            }
                        },
                        '& .MuiToggleButtonGroup-grouped': {
                            margin: 0,
                            '&:first-of-type': { borderRadius: '8px 0 0 8px' },
                            '&:last-of-type': { borderRadius: '0 8px 8px 0' },
                            border: 'none',
                        }
                    }}
                >
                    <ToggleButton value="AM">AM</ToggleButton>
                    <ToggleButton value="PM">PM</ToggleButton>
                </ToggleButtonGroup>
            </Stack>
        </Box>
    );
}

export default function ChatEventForm({ onSave, onCancel, initialData }: ChatEventFormProps) {
    const theme = useTheme();

    const parseInitialTime = (timeStr: string) => {
        if (!timeStr) return { hour: '11', minute: '00', period: 'AM' as const };
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
            return {
                hour: match[1],
                minute: match[2],
                period: match[3].toUpperCase() as 'AM' | 'PM'
            };
        }
        return { hour: '11', minute: '00', period: 'AM' as const };
    };

    const [timeField, setTimeField] = useState(parseInitialTime(initialData && 'time' in initialData ? initialData.time as string : ''));
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        location: initialData?.location || '',
        description: initialData?.description || '',
        guestCount: initialData?.guestCount || 0,
        color: initialData?.color || theme.palette.primary.main,
        icon: initialData?.icon || '🎉',
        is_major_event: initialData?.is_major_event ?? true,
    });
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    const handleTemplateSelect = (templateName: string) => {
        if (templateName === 'Custom') {
            setSelectedTemplate('Custom');
            setFormData(prev => ({ ...prev, name: '', is_major_event: true }));
            setTimeField({ hour: '11', minute: '00', period: 'AM' });
            return;
        }
        const template = TEMPLATE_CHIPS.find(t => t.name === templateName);
        if (template) {
            setSelectedTemplate(templateName);
            setFormData(prev => ({ ...prev, name: template.name, is_major_event: true }));
            setTimeField(parseInitialTime(template.time));
        }
    };

    const handleSave = () => {
        if (!formData.name) return;
        const timeStr = `${timeField.hour}:${timeField.minute} ${timeField.period}`;
        onSave({ ...formData, time: timeStr });
    };

    const commonFieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            fontSize: '1rem',
            bgcolor: '#f5f5f5',
            fontWeight: 600,
            '& input, & textarea': {
                py: 1.5,
                px: 2,
                color: '#1a1a1a !important',
                WebkitTextFillColor: '#1a1a1a !important',
            },
            '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
            '&.Mui-focused fieldset': { borderColor: '#DE3F5E' },
        },
    };

    const labelSx = {
        color: '#666',
        mb: 1,
        display: 'block',
        fontWeight: 500,
        fontSize: '0.75rem'
    };

    return (
        <Box sx={{
            bgcolor: 'white',
            p: 4,
            borderRadius: '16px',
            border: '2px solid',
            borderColor: alpha('#000', 0.12),
            width: '100%',
            maxWidth: 640,
            mt: 1,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#000000' }}>
                New Event Details
            </Typography>

            {/* Template Chips */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={labelSx}>
                    Quick Templates
                </Typography>
                <Box sx={{
                    display: 'flex',
                    gap: 1,
                    overflowX: 'auto',
                    pb: 1,
                    WebkitOverflowScrolling: 'touch',
                    '&::-webkit-scrollbar': { height: 3 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#000', 0.15), borderRadius: 2 },
                }}>
                    {[...TEMPLATE_CHIPS.map(t => t.name), 'Custom'].map((name) => (
                        <Box
                            key={name}
                            onClick={() => handleTemplateSelect(name)}
                            sx={{
                                flexShrink: 0,
                                px: 2,
                                py: 0.75,
                                borderRadius: '20px',
                                border: '2px solid',
                                borderColor: selectedTemplate === name ? '#DE3F5E' : alpha('#000', 0.12),
                                bgcolor: selectedTemplate === name ? alpha('#DE3F5E', 0.06) : 'white',
                                color: selectedTemplate === name ? '#DE3F5E' : '#555',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s',
                                '&:hover': {
                                    borderColor: selectedTemplate === name ? '#DE3F5E' : alpha('#000', 0.25),
                                    bgcolor: selectedTemplate === name ? alpha('#DE3F5E', 0.08) : alpha('#000', 0.02),
                                },
                            }}
                        >
                            {name}
                        </Box>
                    ))}
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                    <Typography variant="caption" sx={labelSx}>
                        Event Name *
                    </Typography>
                    <TextField
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        required
                        placeholder="e.g., Sangeet & Reception"
                        sx={commonFieldSx}
                    />
                </Box>

                {/* Time Picker Section */}
                <Box>
                    <Typography variant="caption" sx={labelSx}>
                        Event Time
                    </Typography>
                    <DigitalTimePicker
                        value={timeField}
                        onChange={setTimeField}
                    />
                </Box>

                <Box>
                    <Typography variant="caption" sx={labelSx}>
                        Location (Optional)
                    </Typography>
                    <TextField
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        fullWidth
                        size="small"
                        InputProps={{
                            startAdornment: <LocationOnIcon sx={{ color: '#666', mr: 1, fontSize: 20 }} />,
                        }}
                        sx={commonFieldSx}
                    />
                </Box>

                <Box>
                    <Typography variant="caption" sx={labelSx}>
                        Description (Optional)
                    </Typography>
                    <TextField
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        multiline
                        rows={2}
                        fullWidth
                        size="small"
                        placeholder="What's happening?"
                        sx={commonFieldSx}
                    />
                </Box>

                {/* Major Event Toggle */}
                <FormControlLabel
                    control={
                        <Switch
                            checked={formData.is_major_event}
                            onChange={(e) => setFormData({ ...formData, is_major_event: e.target.checked })}
                            sx={{ '& .Mui-checked': { color: '#DE3F5E' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#DE3F5E' } }}
                        />
                    }
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a' }}>Major Event</Typography>
                            <Tooltip title="Major events are highlighted more prominently on your wedding timeline and schedule. Use this for key moments like the ceremony or reception." arrow>
                                <InfoOutlinedIcon sx={{ fontSize: 16, color: '#999', cursor: 'help' }} />
                            </Tooltip>
                        </Box>
                    }
                />

                <Box sx={{ display: 'flex', gap: 1.5, mt: 1, width: '100%' }}>
                    {onCancel && (
                        <Button
                            onClick={onCancel}
                            size="small"
                            variant="outlined"
                            fullWidth
                            sx={{
                                color: '#666',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                py: 1,
                                textTransform: 'none',
                                borderRadius: '16px',
                                flex: 1,
                                border: '2px solid',
                                borderColor: 'rgba(0,0,0,0.1)',
                                '&:hover': {
                                    border: '2px solid',
                                    borderColor: 'rgba(0,0,0,0.2)',
                                    bgcolor: 'rgba(0,0,0,0.02)'
                                }
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={!formData.name}
                        size="small"
                        fullWidth
                        sx={{
                            bgcolor: '#DE3F5E',
                            borderRadius: '16px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            py: 1,
                            textTransform: 'none',
                            flex: 1,
                            '&:hover': { bgcolor: '#c73552' }
                        }}
                    >
                        Add Event
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
