'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { supabase } from '@/lib/supabase/client';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { SuccessAlert, ErrorAlert } from '@/components/shared/Alert';
import { FONTS, COLORS, RADII } from '@/lib/theme/tokens';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';

interface BroadcastFormProps {
  open: boolean;
  onClose: () => void;
  weddingId: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
  parameters: any;
  status: string | null;
}

export default function BroadcastForm({ open, onClose, weddingId }: BroadcastFormProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({
    rsvpStatus: '',
    weddingSide: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (open) {
      loadTemplates();
      // Reset form
      setSelectedTemplate('');
      setParameters({});
      setFilters({ rsvpStatus: '', weddingSide: '' });
      setError('');
      setSuccess(false);
      setResult(null);
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('status', 'approved')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates');
    }
  };

  const getTemplateParams = (templateName: string) => {
    const template = templates.find(t => t.name === templateName);
    if (!template || !template.parameters) return [];
    
    try {
      if (Array.isArray(template.parameters)) {
        return template.parameters;
      }
      return [];
    } catch {
      return [];
    }
  };

  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplate(templateName);
    // Initialize parameters for selected template
    const params = getTemplateParams(templateName);
    const initialParams: Record<string, string> = {};
    params.forEach((param: any) => {
      initialParams[param.name] = '';
    });
    setParameters(initialParams);
  };

  const handleSend = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Validate parameters
      const params = getTemplateParams(selectedTemplate);
      for (const param of params) {
        if (!parameters[param.name]) {
          throw new Error(`Please fill in all parameters`);
        }
      }

      const response = await fetch('/api/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId,
          templateName: selectedTemplate,
          parameters,
          filters: {
            rsvpStatus: filters.rsvpStatus || undefined,
            weddingSide: filters.weddingSide || undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send broadcast');
      }

      setSuccess(true);
      setResult(data);
    } catch (err) {
      console.error('Error sending broadcast:', err);
      setError(err instanceof Error ? err.message : 'Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.name === selectedTemplate);

  return (
    <PheraDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <PheraDialogTitle onClose={onClose}>Send WhatsApp Broadcast</PheraDialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <ErrorAlert>{error}</ErrorAlert>}
          {success && result && (
            <SuccessAlert>
              Broadcast sent successfully! {result.successfulSends} sent, {result.failedSends} failed.
            </SuccessAlert>
          )}

          {/* Template Selector */}
          <FormControl fullWidth>
            <InputLabel>Message Template</InputLabel>
            <Select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              label="Message Template"
            >
              {templates.length === 0 ? (
                <MenuItem disabled>No approved templates available</MenuItem>
              ) : (
                templates.map((template) => (
                  <MenuItem key={template.id} value={template.name}>
                    {template.name.replace(/_/g, ' ').toUpperCase()}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Template Preview */}
          {selectedTemplateData && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'rgba(37, 211, 102, 0.06)',
                borderRadius: 1,
                border: '1px solid rgba(37, 211, 102, 0.2)',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Template Preview:
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontFamily: FONTS.body }}>
                {selectedTemplateData.content}
              </Typography>
            </Box>
          )}

          {/* Dynamic Parameter Inputs */}
          {selectedTemplate && getTemplateParams(selectedTemplate).map((param: any) => (
            <TextField
              key={param.name}
              label={param.name.replace(/_/g, ' ').toUpperCase()}
              value={parameters[param.name] || ''}
              onChange={(e) =>
                setParameters({ ...parameters, [param.name]: e.target.value })
              }
              fullWidth
              placeholder={`Enter ${param.name.replace(/_/g, ' ')}`}
            />
          ))}

          {/* Guest Filters */}
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Recipient Filters (Optional)
          </Typography>

          <FormControl fullWidth>
            <InputLabel>RSVP Status</InputLabel>
            <Select
              value={filters.rsvpStatus}
              onChange={(e) => setFilters({ ...filters, rsvpStatus: e.target.value })}
              label="RSVP Status"
            >
              <MenuItem value="">All Guests</MenuItem>
              <MenuItem value="yes">Attending</MenuItem>
              <MenuItem value="no">Not Attending</MenuItem>
              <MenuItem value="maybe">Maybe</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Wedding Side</InputLabel>
            <Select
              value={filters.weddingSide}
              onChange={(e) => setFilters({ ...filters, weddingSide: e.target.value })}
              label="Wedding Side"
            >
              <MenuItem value="">All Sides</MenuItem>
              <MenuItem value="bride">Bride</MenuItem>
              <MenuItem value="groom">Groom</MenuItem>
              <MenuItem value="both">Both</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <PrimaryActionButton
          onClick={handleSend}
          loading={loading}
          disabled={!selectedTemplate}
          startIcon={<SendIcon />}
        >
          Send Broadcast
        </PrimaryActionButton>
      </DialogActions>
    </PheraDialog>
  );
}
