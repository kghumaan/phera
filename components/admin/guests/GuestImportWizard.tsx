'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { ParsedGuest, parseCSV, deduplicateGuests } from '@/lib/utils/guest-parser';

interface GuestImportWizardProps {
  open: boolean;
  onClose: () => void;
  weddingId: string;
  existingGuests: Array<{ phone?: string | null; email?: string | null }>;
  onImport: (guests: ParsedGuest[]) => Promise<void>;
}

export default function GuestImportWizard({
  open,
  onClose,
  weddingId,
  existingGuests,
  onImport,
}: GuestImportWizardProps) {
  const [tab, setTab] = useState(0);
  const [csvText, setCsvText] = useState('');
  const [smartPasteText, setSmartPasteText] = useState('');
  const [parsedGuests, setParsedGuests] = useState<ParsedGuest[]>([]);
  const [manualGuest, setManualGuest] = useState<ParsedGuest>({ name: '' });
  const [manualCount, setManualCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);

      // Auto-parse with default column mapping
      const guests = parseCSV(text, {
        name: 'name',
        phone: 'phone',
        email: 'email',
        wedding_side: 'side',
      });

      const { unique, duplicates } = deduplicateGuests(guests, existingGuests);
      setParsedGuests(unique);
      setDuplicateCount(duplicates.length);
    };
    reader.readAsText(file);
  };

  const handleSmartParse = async () => {
    try {
      const res = await fetch('/api/guests/smart-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: smartPasteText, weddingId }),
      });
      const data = await res.json();
      if (data.guests) {
        const { unique, duplicates } = deduplicateGuests(data.guests, existingGuests);
        setParsedGuests(unique);
        setDuplicateCount(duplicates.length);
      }
    } catch (err) {
      console.error('Smart parse error:', err);
    }
  };

  const handleAddManual = () => {
    if (!manualGuest.name) return;
    setParsedGuests((prev) => [...prev, { ...manualGuest }]);
    setManualGuest({ name: '' });
    setManualCount((c) => c + 1);
  };

  const handleImport = async () => {
    if (parsedGuests.length === 0) return;
    setImporting(true);
    try {
      await onImport(parsedGuests);
      onClose();
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>Import Guests</DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab icon={<UploadFileIcon />} label="Upload Spreadsheet" sx={{ textTransform: 'none' }} />
          <Tab icon={<PersonAddIcon />} label="Add Manually" sx={{ textTransform: 'none' }} />
          <Tab icon={<AutoFixHighIcon />} label="Smart Paste" sx={{ textTransform: 'none' }} />
        </Tabs>

        {/* Tab 1: Upload CSV */}
        {tab === 0 && (
          <Box>
            <Button
              variant="outlined"
              component="label"
              sx={{ borderRadius: '12px', textTransform: 'none', mb: 2, borderColor: '#DE3F5E', color: '#DE3F5E' }}
            >
              Choose CSV/XLSX file
              <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleCSVUpload} />
            </Button>
            {csvText && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Found {parsedGuests.length} guests
                {duplicateCount > 0 && ` (${duplicateCount} duplicates skipped)`}
              </Alert>
            )}
          </Box>
        )}

        {/* Tab 2: Manual Add */}
        {tab === 1 && (
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={manualGuest.name}
              onChange={(e) => setManualGuest({ ...manualGuest, name: e.target.value })}
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }}
            />
            <TextField
              label="Phone (with country code)"
              value={manualGuest.phone || ''}
              onChange={(e) => setManualGuest({ ...manualGuest, phone: e.target.value })}
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }}
            />
            <TextField
              label="Email (optional)"
              value={manualGuest.email || ''}
              onChange={(e) => setManualGuest({ ...manualGuest, email: e.target.value })}
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Wedding Side</InputLabel>
              <Select
                value={manualGuest.wedding_side || ''}
                label="Wedding Side"
                onChange={(e) => setManualGuest({ ...manualGuest, wedding_side: e.target.value as any })}
                sx={{ borderRadius: '12px', bgcolor: 'white' }}
              >
                <MenuItem value="bride">Bride</MenuItem>
                <MenuItem value="groom">Groom</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                onClick={handleAddManual}
                disabled={!manualGuest.name}
                sx={{ borderRadius: '12px', textTransform: 'none', bgcolor: '#DE3F5E', '&:hover': { bgcolor: '#c13550' } }}
              >
                Add Another
              </Button>
              {manualCount > 0 && (
                <Chip label={`${manualCount + parsedGuests.length} guests added`} color="success" size="small" />
              )}
            </Stack>
          </Stack>
        )}

        {/* Tab 3: Smart Paste */}
        {tab === 2 && (
          <Box>
            <TextField
              multiline
              rows={6}
              fullWidth
              value={smartPasteText}
              onChange={(e) => setSmartPasteText(e.target.value)}
              placeholder="Paste names and contact info in any format...&#10;&#10;Examples:&#10;Raj Sharma - 9876543210&#10;Priya Singh priya@email.com +1-416-555-1234&#10;Mr and Mrs Gupta, 9871234567, bride side"
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'white' } }}
            />
            <Button
              variant="contained"
              onClick={handleSmartParse}
              disabled={!smartPasteText.trim()}
              sx={{ borderRadius: '12px', textTransform: 'none', bgcolor: '#DE3F5E', '&:hover': { bgcolor: '#c13550' } }}
            >
              Parse
            </Button>
            {parsedGuests.length > 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Parsed {parsedGuests.length} guests
                {duplicateCount > 0 && ` (${duplicateCount} duplicates skipped)`}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleImport}
          disabled={parsedGuests.length === 0 || importing}
          sx={{ borderRadius: '12px', textTransform: 'none', bgcolor: '#DE3F5E', '&:hover': { bgcolor: '#c13550' } }}
        >
          {importing ? 'Importing...' : `Import ${parsedGuests.length} guests`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
