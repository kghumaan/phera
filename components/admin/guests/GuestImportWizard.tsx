'use client';

import React, { useState, useCallback, useRef } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  UploadFile as UploadFileIcon,
  Edit as EditIcon,
  CloudUpload,
  CheckCircle,
  Close,
  Celebration,
} from '@mui/icons-material';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';

// ─── Types ──────────────────────────────────────────────────────────

interface GuestImportWizardProps {
  open: boolean;
  onClose: () => void;
  weddingId: string;
  weddingSlug: string;
  onImportComplete?: (count: number) => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface ImportResult {
  imported: number;
  duplicates: number;
  errors: Array<{ row: number; reason: string }>;
}

type Step = 'select' | 'mapping' | 'importing' | 'done';

// ─── Shared styles ──────────────────────────────────────────────────

const PRIMARY_BTN = {
  borderRadius: '12px',
  textTransform: 'none' as const,
  bgcolor: '#DE3F5E',
  fontWeight: 600,
  '&:hover': { bgcolor: '#c13550' },
};

const SELECT_SX = {
  borderRadius: '12px',
  bgcolor: 'white',
  color: '#1a1a1a',
  '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
  '&:hover fieldset': { borderColor: '#DE3F5E' },
  '&.Mui-focused fieldset': { borderColor: '#DE3F5E', borderWidth: '2px' },
};

// ─── Column mapping ─────────────────────────────────────────────────

const FIELD_OPTIONS = [
  { value: '', label: '— Skip —' },
  { value: 'name', label: 'Full Name' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'wedding_side', label: 'Wedding Side' },
  { value: 'group', label: 'Group / Family' },
];

const AUTO_MAP: Record<string, string> = {
  name: 'name', 'full name': 'name', full_name: 'name', guest: 'name', 'guest name': 'name',
  'first name': 'first_name', first_name: 'first_name', firstname: 'first_name', first: 'first_name',
  'last name': 'last_name', last_name: 'last_name', lastname: 'last_name', last: 'last_name', surname: 'last_name',
  email: 'email', 'email address': 'email', 'e-mail': 'email',
  phone: 'phone', 'phone number': 'phone', mobile: 'phone', cell: 'phone', telephone: 'phone', 'contact number': 'phone', 'phone no': 'phone',
  side: 'wedding_side', 'wedding side': 'wedding_side', wedding_side: 'wedding_side',
  group: 'group', family: 'group', 'group name': 'group', 'family name': 'group', team: 'group',
};

// ─── Component ──────────────────────────────────────────────────────

export default function GuestImportWizard({
  open,
  onClose,
  weddingId,
  weddingSlug,
  onImportComplete,
}: GuestImportWizardProps) {
  const [tab, setTab] = useState(0);
  const [step, setStep] = useState<Step>('select');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [manualGuests, setManualGuests] = useState<Array<{ name: string; email: string; phone: string; country_code: string; wedding_side: string }>>([]);
  const [manualForm, setManualForm] = useState({ name: '', email: '', phone: '', country_code: '+1', wedding_side: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Reset ───────────────────────────────────────────────────

  const resetState = () => {
    setTab(0);
    setStep('select');
    setHeaders([]);
    setRows([]);
    setColumnMap({});
    setImporting(false);
    setResult(null);
    setDragOver(false);
    setParseError(null);
    setManualGuests([]);
    setManualForm({ name: '', email: '', phone: '', country_code: '+1', wedding_side: '' });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ─── File Parsing ────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    setParseError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0 && results.data.length === 0) {
            setParseError(`Parse error: ${results.errors[0].message}`);
            return;
          }
          handleParsedData(results.meta.fields || [], results.data as ParsedRow[]);
        },
        error: (err: any) => setParseError(`Failed to parse: ${err.message}`),
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: '' });
          if (json.length === 0) {
            setParseError('Spreadsheet is empty');
            return;
          }
          handleParsedData(Object.keys(json[0]), json);
        } catch (err: any) {
          setParseError(`Failed to parse Excel: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setParseError('Unsupported file type. Use .csv, .xlsx, or .xls');
    }
  }, []);

  const handleParsedData = (fields: string[], data: ParsedRow[]) => {
    setHeaders(fields);
    setRows(data);

    // Auto-detect column mapping
    const mapping: Record<string, string> = {};
    for (const header of fields) {
      const key = header.trim().toLowerCase();
      if (AUTO_MAP[key]) {
        mapping[header] = AUTO_MAP[key];
      }
    }
    setColumnMap(mapping);
    setStep('mapping');
  };

  // ─── Manual Guest Helpers ─────────────────────────────────────

  const handleAddManual = () => {
    if (!manualForm.name.trim()) return;
    setManualGuests((prev) => [...prev, { ...manualForm }]);
    setManualForm({ ...manualForm, name: '', email: '', phone: '' });
  };

  const handleRemoveManual = (index: number) => {
    setManualGuests((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Build Guest Array ───────────────────────────────────────

  function buildGuestsFromMapping(): Array<Record<string, string>> {
    return rows.map((row) => {
      const guest: Record<string, string> = {};
      for (const [header, field] of Object.entries(columnMap)) {
        if (field && row[header]) {
          guest[field] = row[header].trim();
        }
      }
      // Combine first + last if no name mapped
      if (!guest.name && (guest.first_name || guest.last_name)) {
        guest.name = [guest.first_name, guest.last_name].filter(Boolean).join(' ');
      }
      delete guest.first_name;
      delete guest.last_name;
      return guest;
    }).filter((g) => g.name);
  }

  function getPreviewStats() {
    const guests = buildGuestsFromMapping();
    return {
      total: guests.length,
      withEmail: guests.filter((g) => g.email).length,
      withPhone: guests.filter((g) => g.phone).length,
    };
  }

  // ─── Import ──────────────────────────────────────────────────

  const handleImport = async () => {
    setImporting(true);
    setStep('importing');

    // Manual tab sends guests directly; file upload uses column mapping
    const guestsToImport = tab === 1
      ? manualGuests.map((g) => ({
          name: g.name,
          email: g.email || undefined,
          phone: g.phone ? `${g.country_code}${g.phone}` : undefined,
          wedding_side: g.wedding_side || undefined,
        }))
      : buildGuestsFromMapping();

    try {
      const res = await fetch('/api/guests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wedding_id: weddingId, guests: guestsToImport }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResult({
        imported: data.imported,
        duplicates: data.duplicates,
        errors: data.errors || [],
      });
      setStep('done');
      onImportComplete?.(data.imported);
    } catch (err: any) {
      setResult({ imported: 0, duplicates: 0, errors: [{ row: -1, reason: err.message }] });
      setStep('done');
    } finally {
      setImporting(false);
    }
  };

  // ─── Drag & Drop ─────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const hasNameMapped = Object.values(columnMap).some((v) => v === 'name' || v === 'first_name');

  // ─── Render ──────────────────────────────────────────────────

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        {step === 'done' ? 'Import Complete' : step === 'mapping' ? 'Map Columns' : 'Import Guests'}
        <IconButton onClick={handleClose} size="small">
          <Close sx={{ color: '#6a6a6a' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ minHeight: 380 }}>
        {/* ═══ Step: Select Method ════════════════════════════ */}
        {step === 'select' && (
          <>
            <Tabs
              value={tab}
              onChange={(_, v) => { setTab(v); setParseError(null); }}
              sx={{
                mb: 2,
                '& .MuiTab-root': { textTransform: 'none', color: '#4a4a4a', fontWeight: 500 },
                '& .Mui-selected': { color: '#DE3F5E' },
                '& .MuiTabs-indicator': { bgcolor: '#DE3F5E' },
              }}
            >
              <Tab icon={<UploadFileIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Upload File" />
              <Tab icon={<EditIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Add Manually" />
            </Tabs>

            {/* ── Tab 0: File Upload ───────────────────────── */}
            {tab === 0 && (
              <Box>
                {/* Drop zone */}
                <Box
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    border: `2px dashed ${dragOver ? '#DE3F5E' : 'rgba(0,0,0,0.15)'}`,
                    borderRadius: '16px',
                    p: 5,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: dragOver ? 'rgba(222,63,94,0.04)' : '#FAFAFA',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#DE3F5E', bgcolor: 'rgba(222,63,94,0.02)' },
                  }}
                >
                  <CloudUpload sx={{ fontSize: 48, color: dragOver ? '#DE3F5E' : '#9a9a9a', mb: 1 }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                    Drag & drop your guest list here
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#6a6a6a' }}>
                    or click to browse — .csv, .xlsx, .xls supported
                  </Typography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept=".csv,.xlsx,.xls,.tsv,.txt"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
                  />
                </Box>

                {/* Format guide */}
                <Paper elevation={0} sx={{ mt: 2.5, p: 2, bgcolor: '#FAFAFA', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '12px' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
                    How to format your file
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#4a4a4a', mb: 1.5, lineHeight: 1.7 }}>
                    Your spreadsheet should have column headers in the first row. We'll auto-detect common column names. At minimum, include a <strong>Name</strong> column.
                  </Typography>

                  {/* Example table */}
                  <TableContainer sx={{ borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'white' }}>
                          <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: 11, py: 0.75 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: 11, py: 0.75 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: 11, py: 0.75 }}>Phone</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: 11, py: 0.75 }}>Side</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ color: '#4a4a4a', fontSize: 11, py: 0.5 }}>Priya Sharma</TableCell>
                          <TableCell sx={{ color: '#4a4a4a', fontSize: 11, py: 0.5 }}>priya@email.com</TableCell>
                          <TableCell sx={{ color: '#4a4a4a', fontSize: 11, py: 0.5 }}>+919876543210</TableCell>
                          <TableCell sx={{ color: '#4a4a4a', fontSize: 11, py: 0.5 }}>bride</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ color: '#4a4a4a', fontSize: 11, py: 0.5 }}>Arjun Mehta</TableCell>
                          <TableCell sx={{ color: '#4a4a4a', fontSize: 11, py: 0.5 }}>arjun@email.com</TableCell>
                          <TableCell sx={{ color: '#4a4a4a', fontSize: 11, py: 0.5 }}>+14155551234</TableCell>
                          <TableCell sx={{ color: '#4a4a4a', fontSize: 11, py: 0.5 }}>groom</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography sx={{ fontSize: 11, color: '#6a6a6a', mt: 1 }}>
                    Recognized columns: Name, First Name, Last Name, Email, Phone, Mobile, Side, Group, Family
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* ── Tab 1: Add Manually ─────────────────────── */}
            {tab === 1 && (
              <Box>
                {/* Input row */}
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Full Name"
                      value={manualForm.name}
                      onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                      fullWidth
                      size="small"
                      required
                      sx={ENHANCED_TEXT_FIELD_SX}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                    />
                    <TextField
                      label="Email"
                      value={manualForm.email}
                      onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                      fullWidth
                      size="small"
                      sx={ENHANCED_TEXT_FIELD_SX}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <FormControl size="small" sx={{ minWidth: 90, mt: 1 }}>
                      <Select
                        value={manualForm.country_code}
                        onChange={(e) => setManualForm({ ...manualForm, country_code: e.target.value })}
                        sx={SELECT_SX}
                      >
                        <MenuItem value="+1">+1</MenuItem>
                        <MenuItem value="+91">+91</MenuItem>
                        <MenuItem value="+44">+44</MenuItem>
                        <MenuItem value="+61">+61</MenuItem>
                        <MenuItem value="+971">+971</MenuItem>
                        <MenuItem value="+81">+81</MenuItem>
                        <MenuItem value="+65">+65</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Phone"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                      fullWidth
                      size="small"
                      sx={ENHANCED_TEXT_FIELD_SX}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                    />
                    <FormControl size="small" sx={{ minWidth: 130, mt: 1 }}>
                      <InputLabel sx={{ color: '#4a4a4a', fontWeight: 500 }}>Side</InputLabel>
                      <Select
                        value={manualForm.wedding_side}
                        label="Side"
                        onChange={(e) => setManualForm({ ...manualForm, wedding_side: e.target.value })}
                        sx={SELECT_SX}
                      >
                        <MenuItem value="">—</MenuItem>
                        <MenuItem value="bride">Bride</MenuItem>
                        <MenuItem value="groom">Groom</MenuItem>
                        <MenuItem value="both">Both</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      onClick={handleAddManual}
                      disabled={!manualForm.name.trim()}
                      sx={{ ...PRIMARY_BTN, minWidth: 80, mt: 1, height: 42 }}
                    >
                      Add
                    </Button>
                  </Stack>
                </Stack>

                {/* Added guests table */}
                {manualGuests.length > 0 && (
                  <Paper elevation={0} sx={{ mt: 2, border: '1px solid rgba(0,0,0,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 220 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: 12 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: 12 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: 12 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: 12 }}>Side</TableCell>
                            <TableCell sx={{ width: 40 }} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {manualGuests.map((g, i) => (
                            <TableRow key={i}>
                              <TableCell sx={{ color: '#1a1a1a', fontSize: 12 }}>{g.name}</TableCell>
                              <TableCell sx={{ color: '#4a4a4a', fontSize: 12 }}>{g.email || '—'}</TableCell>
                              <TableCell sx={{ color: '#4a4a4a', fontSize: 12 }}>{g.phone ? `${g.country_code}${g.phone}` : '—'}</TableCell>
                              <TableCell sx={{ color: '#4a4a4a', fontSize: 12 }}>{g.wedding_side || '—'}</TableCell>
                              <TableCell>
                                <IconButton size="small" onClick={() => handleRemoveManual(i)}>
                                  <Close sx={{ fontSize: 14, color: '#9a9a9a' }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ p: 1.5, bgcolor: '#FAFAFA', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <Typography sx={{ fontSize: 12, color: '#4a4a4a', fontWeight: 500 }}>
                        {manualGuests.length} guest{manualGuests.length !== 1 ? 's' : ''} ready to import
                      </Typography>
                    </Box>
                  </Paper>
                )}
              </Box>
            )}

            {parseError && <Alert severity="error" sx={{ mt: 2 }}>{parseError}</Alert>}
          </>
        )}

        {/* ═══ Step: Column Mapping ═══════════════════════════ */}
        {step === 'mapping' && (
          <Box>
            <Typography sx={{ fontSize: 13, color: '#4a4a4a', mb: 2 }}>
              We auto-detected some columns. Adjust the mapping if needed — at minimum, map a <strong>Name</strong> column.
            </Typography>

            {/* Column mapping rows */}
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {headers.map((header) => (
                <Stack key={header} direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ minWidth: 150, maxWidth: 180, overflow: 'hidden' }}>
                    <Typography sx={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {header}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, color: '#9a9a9a' }}>→</Typography>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <Select
                      value={columnMap[header] || ''}
                      onChange={(e) => setColumnMap((prev) => ({ ...prev, [header]: e.target.value }))}
                      displayEmpty
                      sx={SELECT_SX}
                    >
                      {FIELD_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13, color: '#1a1a1a' }}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography sx={{ fontSize: 11, color: '#9a9a9a', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                    e.g. "{rows[0]?.[header] || ''}"
                  </Typography>
                </Stack>
              ))}
            </Stack>

            {!hasNameMapped && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Please map at least a <strong>Name</strong> or <strong>First Name</strong> column to continue.
              </Alert>
            )}

            {/* Preview table */}
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
              Preview ({Math.min(rows.length, 5)} of {rows.length} rows)
            </Typography>
            <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
              <TableContainer sx={{ maxHeight: 200 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                      {headers.filter((h) => columnMap[h]).map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: 11 }}>
                          {FIELD_OPTIONS.find((o) => o.value === columnMap[h])?.label || h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {headers.filter((h) => columnMap[h]).map((h) => (
                          <TableCell key={h} sx={{ color: '#4a4a4a', fontSize: 12 }}>
                            {row[h] || '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}

        {/* ═══ Step: Importing ════════════════════════════════ */}
        {step === 'importing' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={40} sx={{ color: '#DE3F5E', mb: 2 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
              Importing guests...
            </Typography>
            <LinearProgress sx={{ width: '50%', mt: 2, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: '#DE3F5E' } }} />
          </Box>
        )}

        {/* ═══ Step: Done ═════════════════════════════════════ */}
        {step === 'done' && result && (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            {result.imported > 0 ? (
              <>
                <Celebration sx={{ fontSize: 56, color: '#DE3F5E', mb: 1 }} />
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
                  {result.imported} guest{result.imported !== 1 ? 's' : ''} imported!
                </Typography>
              </>
            ) : (
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
                No new guests imported
              </Typography>
            )}

            <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 1, mb: 3 }}>
              {result.imported > 0 && (
                <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label={`${result.imported} imported`} size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 500 }} />
              )}
              {result.duplicates > 0 && (
                <Chip label={`${result.duplicates} duplicates skipped`} size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 500 }} />
              )}
              {result.errors.length > 0 && (
                <Chip label={`${result.errors.length} errors`} size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 500 }} />
              )}
            </Stack>

            {result.errors.length > 0 && (
              <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: '12px', p: 2, mb: 2, maxHeight: 150, overflow: 'auto', textAlign: 'left', mx: 'auto', maxWidth: 500 }}>
                {result.errors.map((e, i) => (
                  <Typography key={i} sx={{ fontSize: 11, color: '#C62828', mb: 0.3 }}>
                    {e.row > 0 ? `Row ${e.row}: ` : ''}{e.reason}
                  </Typography>
                ))}
              </Paper>
            )}

            {result.imported > 0 && (
              <Stack direction="row" justifyContent="center" spacing={1.5} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    handleClose();
                    window.location.href = `/admin/${weddingSlug}/communication`;
                  }}
                  sx={PRIMARY_BTN}
                >
                  Send RSVP Invites
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClose}
                  sx={{ borderRadius: '12px', textTransform: 'none', borderColor: 'rgba(0,0,0,0.2)', color: '#1a1a1a', fontWeight: 600 }}
                >
                  Review Guest List
                </Button>
              </Stack>
            )}
          </Box>
        )}
      </DialogContent>

      {/* ═══ Footer Actions ══════════════════════════════════ */}
      {step !== 'done' && step !== 'importing' && (
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Button onClick={step === 'mapping' ? () => setStep('select') : handleClose} sx={{ textTransform: 'none', color: '#6a6a6a', fontWeight: 500 }}>
            {step === 'mapping' ? 'Back' : 'Cancel'}
          </Button>

          {step === 'mapping' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {(() => {
                const stats = getPreviewStats();
                return (
                  <Typography sx={{ fontSize: 12, color: '#4a4a4a' }}>
                    {stats.total} guests{stats.withEmail > 0 ? ` · ${stats.withEmail} with email` : ''}{stats.withPhone > 0 ? ` · ${stats.withPhone} with phone` : ''}
                  </Typography>
                );
              })()}
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={!hasNameMapped || buildGuestsFromMapping().length === 0}
                sx={PRIMARY_BTN}
              >
                Import {buildGuestsFromMapping().length} Guests
              </Button>
            </Box>
          )}

          {step === 'select' && tab === 1 && manualGuests.length > 0 && (
            <Button
              variant="contained"
              onClick={handleImport}
              sx={PRIMARY_BTN}
            >
              Import {manualGuests.length} Guest{manualGuests.length !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogActions>
      )}

      {step === 'done' && (
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'center' }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none', color: '#6a6a6a' }}>
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
