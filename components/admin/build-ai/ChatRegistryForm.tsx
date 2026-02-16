'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    alpha,
} from '@mui/material';

interface ChatRegistryFormProps {
    onSave: (registry: { fund_name: string; external_url: string; emoji: string }) => void;
    onCancel?: () => void;
    initialData?: any;
}

export default function ChatRegistryForm({ onSave, onCancel, initialData }: ChatRegistryFormProps) {
    const [formData, setFormData] = useState({
        fund_name: initialData?.fund_name || '',
        external_url: initialData?.external_url || '',
        emoji: initialData?.emoji || '🎁',
    });

    const handleSave = () => {
        if (!formData.fund_name || !formData.external_url) return;
        onSave(formData);
    };

    const commonFieldSx = {
        '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            fontSize: '1rem',
            bgcolor: '#f5f5f5',
            fontWeight: 600,
            '& input': {
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
                Add Registry Link
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                    <Typography variant="caption" sx={labelSx}>
                        Registry Name *
                    </Typography>
                    <TextField
                        value={formData.fund_name}
                        onChange={(e) => setFormData({ ...formData, fund_name: e.target.value })}
                        fullWidth
                        required
                        placeholder="e.g., Amazon Wishlist, Honeyfund"
                        sx={commonFieldSx}
                    />
                </Box>

                <Box>
                    <Typography variant="caption" sx={labelSx}>
                        Link (URL) *
                    </Typography>
                    <TextField
                        value={formData.external_url}
                        onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                        fullWidth
                        required
                        placeholder="e.g., https://www.amazon.com/wedding/..."
                        sx={commonFieldSx}
                    />
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
                        disabled={!formData.fund_name || !formData.external_url}
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
                        Add Registry
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
