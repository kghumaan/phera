'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface ChatFAQFormProps {
    onSave: (faq: any) => void;
    onCancel?: () => void;
    initialData?: any;
}

export default function ChatFAQForm({ onSave, onCancel, initialData }: ChatFAQFormProps) {
    const theme = useTheme();
    const [formData, setFormData] = useState({
        question: initialData?.question || '',
        answer: initialData?.answer || '',
        button_text: initialData?.button_text || '',
        button_link: initialData?.button_link || '',
    });

    const handleSave = () => {
        if (!formData.question || !formData.answer) return;
        onSave(formData);
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
            '& fieldset': { border: 'none' },
            '&.Mui-focused fieldset': { border: 'none' },
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
                New FAQ Item
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                    <Typography variant="caption" sx={labelSx}>
                        Question *
                    </Typography>
                    <TextField
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        fullWidth
                        required
                        placeholder="e.g., What's the dress code?"
                        sx={commonFieldSx}
                    />
                </Box>

                <Box>
                    <Typography variant="caption" sx={labelSx}>
                        Answer *
                    </Typography>
                    <TextField
                        value={formData.answer}
                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                        multiline
                        rows={3}
                        fullWidth
                        required
                        placeholder="e.g., Smart casual. Please wear comfortable shoes for the lawn."
                        sx={commonFieldSx}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={labelSx}>
                            Button Text (Optional)
                        </Typography>
                        <TextField
                            value={formData.button_text}
                            onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                            fullWidth
                            placeholder="e.g., View Map"
                            sx={commonFieldSx}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={labelSx}>
                            Button Link (Optional)
                        </Typography>
                        <TextField
                            value={formData.button_link}
                            onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                            fullWidth
                            placeholder="e.g., https://maps..."
                            sx={commonFieldSx}
                        />
                    </Box>
                </Box>

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
                        disabled={!formData.question || !formData.answer}
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
                        Add FAQ
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
