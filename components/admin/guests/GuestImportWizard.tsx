'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
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
  Collapse,
} from '@mui/material';
import {
  UploadFile as UploadFileIcon,
  Edit as EditIcon,
  CloudUpload,
  CheckCircle,
  Close,
  Celebration,
  PhoneIphone,
  Android,
  ExpandMore,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { PrimaryActionButton, SecondaryActionButton } from '@/components/admin/ActionButton';
import { ErrorAlert, InfoAlert } from '@/components/shared/Alert';
import { PheraChip } from '@/components/shared/Chip';
import { PheraDialog } from '@/components/shared/Dialog';
import { COLORS, RADII } from '@/lib/theme/tokens';
import {
  parseCsv,
  parseXlsx,
  parseVCard,
  autoMapColumns,
  applyColumnMapping,
  type ParsedRow,
} from '@/lib/admin/guest-import-parsers';

// ─── Types ──────────────────────────────────────────────────────────

interface GuestImportWizardProps {
  open: boolean;
  onClose: () => void;
  weddingId: string;
  weddingSlug: string;
  onImportComplete?: (count: number) => void;
}

interface ImportResult {
  imported: number;
  duplicates: number;
  errors: Array<{ row: number; reason: string }>;
}

type Step = 'select' | 'confirm' | 'importing' | 'done';

// ─── Shared styles ──────────────────────────────────────────────────

// FormControl sx that matches ENHANCED_TEXT_FIELD_SX height & label placement.
// Tokens resolve all colors and the input radius.
const ENHANCED_FORM_CONTROL_SX = {
  mt: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: RADII.md,
    bgcolor: COLORS.bg.white,
    fontSize: { xs: '0.875rem', md: '0.925rem', lg: '0.975rem' },
    '& .MuiSelect-select': {
      py: { xs: 1.5, md: 1.75, lg: 2 },
      fontSize: { xs: '0.875rem', md: '0.925rem', lg: '0.975rem' },
      color: COLORS.text.strong,
    },
    '& fieldset': { borderColor: COLORS.border.strong },
    '&:hover fieldset': { borderColor: COLORS.brand.primary },
    '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary, borderWidth: '2px' },
  },
  '& .MuiInputLabel-root': {
    color: COLORS.text.muted,
    fontSize: { xs: '0.95rem', md: '1rem', lg: '1.05rem' },
    fontWeight: 500,
    lineHeight: 1.5,
    transform: 'translate(14px, 14px) scale(1)',
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
    },
    '&.Mui-focused': { color: COLORS.brand.primary, fontWeight: 600 },
  },
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
  const [manualGuests, setManualGuests] = useState<Array<{ name: string; email: string; phone: string; country_code: string; wedding_side: string; tag: string }>>([]);
  const [manualForm, setManualForm] = useState({ name: '', email: '', phone: '', country_code: '+1', wedding_side: '', tag: '' });
  const [exportHelpOpen, setExportHelpOpen] = useState(false);
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
    setManualForm({ name: '', email: '', phone: '', country_code: '+1', wedding_side: '', tag: '' });
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ─── File Parsing ────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    setParseError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
        const text = await file.text();
        const { headers: h, rows: r } = parseCsv(text);
        handleParsedData(h, r);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const { headers: h, rows: r } = parseXlsx(buffer);
        handleParsedData(h, r);
      } else if (ext === 'vcf' || ext === 'vcard') {
        const text = await file.text();
        const parsed = parseVCard(text);
        if (parsed.length === 0) {
          setParseError('No contacts found in vCard file');
          return;
        }
        handleParsedData(['Name', 'Email', 'Phone'], parsed);
      } else {
        setParseError('Unsupported file type. Use .csv, .xlsx, .xls, or .vcf');
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file');
    }
  }, []);

  const handleParsedData = (fields: string[], data: ParsedRow[]) => {
    const mapping = autoMapColumns(fields);
    const mapped = applyColumnMapping(data, mapping);
    if (mapped.length === 0) {
      setParseError("We couldn't find any names in this file. Make sure there's a column with guest names.");
      return;
    }
    setHeaders(fields);
    setRows(data);
    setColumnMap(mapping);
    setStep('confirm');
  };

  // ─── Manual Guest Helpers ─────────────────────────────────────

  const handleAddManual = () => {
    if (!manualForm.name.trim()) return;
    setManualGuests((prev) => [...prev, { ...manualForm }]);
    setManualForm({ ...manualForm, name: '', email: '', phone: '', tag: '' });
  };

  const handleRemoveManual = (index: number) => {
    setManualGuests((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Build Guest Array ───────────────────────────────────────

  function buildGuestsFromMapping(): ParsedRow[] {
    return applyColumnMapping(rows, columnMap);
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
          group: g.tag || undefined,
        }))
      : buildGuestsFromMapping();

    try {
      const res = await fetch('/api/guests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wedding_id: weddingSlug, guests: guestsToImport }),
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

  // ─── Render ──────────────────────────────────────────────────

  return (
    <PheraDialog open={open} onClose={handleClose} maxWidth={step === 'done' ? 'sm' : 'md'} fullWidth>
      <DialogTitle sx={{ color: COLORS.text.strong, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        {step === 'done' ? '' : step === 'confirm' ? 'Confirm Import' : 'Import Guests'}
        <IconButton onClick={handleClose} size="small" sx={{ ml: 'auto' }}>
          <Close sx={{ color: COLORS.text.subtle }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ minHeight: step === 'done' ? 0 : 380 }}>
        {/* ═══ Step: Select Method ════════════════════════════ */}
        {step === 'select' && (
          <>
            <Tabs
              value={tab}
              onChange={(_, v) => { setTab(v); setParseError(null); }}
              sx={{
                mb: 2,
                '& .MuiTab-root': { textTransform: 'none', color: COLORS.text.muted, fontWeight: 500 },
                '& .Mui-selected': { color: COLORS.brand.primary },
                '& .MuiTabs-indicator': { bgcolor: COLORS.brand.primary },
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
                    border: `2px dashed ${dragOver ? COLORS.brand.primary : 'rgba(0,0,0,0.15)'}`,
                    borderRadius: RADII.lg,
                    p: 5,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: dragOver ? 'rgba(222,63,94,0.04)' : COLORS.bg.muted,
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: COLORS.brand.primary, bgcolor: 'rgba(222,63,94,0.02)' },
                  }}
                >
                  <CloudUpload sx={{ fontSize: 48, color: dragOver ? COLORS.brand.primary : COLORS.text.faint, mb: 1 }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORS.text.strong, mb: 0.5 }}>
                    Drag & drop your guest list here
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: COLORS.text.subtle }}>
                    or click to browse — .csv, .xlsx, .xls, .vcf supported
                  </Typography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept=".csv,.xlsx,.xls,.tsv,.txt,.vcf,.vcard"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
                  />
                </Box>

                {/* Format guide */}
                <Paper elevation={0} sx={{ mt: 2.5, p: 2, bgcolor: COLORS.bg.muted, border: '1px solid rgba(0,0,0,0.07)', borderRadius: RADII.md }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.text.strong, mb: 1 }}>
                    How to format your file
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: COLORS.text.muted, mb: 1.5, lineHeight: 1.7 }}>
                    Upload any schema — we'll match columns automatically. Names are required. Email and phone unlock RSVPs, WhatsApp, and concierge, so include them when you can. Works best with headers like below.
                  </Typography>

                  {/* Example table */}
                  <TableContainer sx={{ borderRadius: RADII.sm, border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: COLORS.bg.white }}>
                          <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 11, py: 0.75 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 11, py: 0.75 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 11, py: 0.75 }}>Phone</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 11, py: 0.75 }}>Side</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 11, py: 0.75 }}>Tag</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>Priya Sharma</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>priya@email.com</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>+919876543210</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>Bride</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>Priya's Friends</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>Arjun Mehta</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>arjun@email.com</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>+14155551234</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>Groom</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>Arjun's Family</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>Neha Patel</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>neha@email.com</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>+14085559876</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>Bride</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 11, py: 0.5 }}>Priya's US Friends</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography sx={{ fontSize: 11, color: COLORS.text.subtle, mt: 1 }}>
                    Side and tag are optional.
                  </Typography>
                </Paper>

                {/* Export from phone — sibling info card, collapsed by default */}
                <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: COLORS.bg.muted, border: '1px solid rgba(0,0,0,0.07)', borderRadius: RADII.md }}>
                  <Box
                    onClick={() => setExportHelpOpen((v) => !v)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none',
                      mx: -0.5,
                      px: 0.5,
                      py: 0.25,
                      borderRadius: '6px',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                    }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.text.strong }}>
                      📱 How to export contacts from your phone
                    </Typography>
                    <ExpandMore
                      sx={{
                        fontSize: 18,
                        color: COLORS.text.subtle,
                        transform: exportHelpOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </Box>

                  <Collapse in={exportHelpOpen} timeout="auto" unmountOnExit>
                    <Typography sx={{ fontSize: 12, color: COLORS.text.muted, mt: 1.5, mb: 1.5, lineHeight: 1.7 }}>
                      Export your phone&apos;s address book as a .vcf file, then upload it here. Easiest from a desktop browser after emailing the file to yourself.
                    </Typography>

                    <Stack spacing={1.5}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                          <PhoneIphone sx={{ fontSize: 16, color: COLORS.text.strong }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.text.strong }}>
                            iPhone (via iCloud)
                          </Typography>
                        </Box>
                        <Stack component="ol" spacing={0.25} sx={{ pl: 2.5, m: 0 }}>
                          {[
                            'On a desktop browser, go to icloud.com → Contacts.',
                            'Press ⌘/Ctrl + A to select all contacts (or pick a group).',
                            'Click the share icon at the bottom-left → Export vCard.',
                            'Upload the downloaded .vcf file above.',
                          ].map((step, i) => (
                            <Typography key={i} component="li" sx={{ fontSize: 11, color: COLORS.text.muted, lineHeight: 1.6 }}>
                              {step}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                          <Android sx={{ fontSize: 16, color: COLORS.text.strong }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.text.strong }}>
                            Android
                          </Typography>
                        </Box>
                        <Stack component="ol" spacing={0.25} sx={{ pl: 2.5, m: 0 }}>
                          {[
                            'Open the Contacts app → tap the menu (⋮ or ☰) → Settings.',
                            'Tap Export → choose .vcf format.',
                            'Email or AirDrop the file to your computer.',
                            'Upload the .vcf file above.',
                          ].map((step, i) => (
                            <Typography key={i} component="li" sx={{ fontSize: 11, color: COLORS.text.muted, lineHeight: 1.6 }}>
                              {step}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  </Collapse>
                </Paper>
              </Box>
            )}

            {/* ── Tab 1: Add Manually ─────────────────────── */}
            {tab === 1 && (
              <Box>
                {/* Input rows — 3 input rows, all same height */}
                <Stack spacing={1.5}>
                  {/* Row 1: Full Name | Email */}
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Full Name"
                      value={manualForm.name}
                      onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                      fullWidth
                      required
                      sx={ENHANCED_TEXT_FIELD_SX}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                    />
                    <TextField
                      label="Email"
                      value={manualForm.email}
                      onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                      fullWidth
                      sx={ENHANCED_TEXT_FIELD_SX}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                    />
                  </Stack>

                  {/* Row 2: Country Code | Phone */}
                  <Stack direction="row" spacing={1}>
                    <FormControl sx={{ ...ENHANCED_FORM_CONTROL_SX, minWidth: 110, flexShrink: 0 }}>
                      <InputLabel>Code</InputLabel>
                      <Select
                        label="Code"
                        value={manualForm.country_code}
                        onChange={(e) => setManualForm({ ...manualForm, country_code: e.target.value })}
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
                      sx={ENHANCED_TEXT_FIELD_SX}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                    />
                  </Stack>

                  {/* Row 3: Side | Tag (equal width) */}
                  <Stack direction="row" spacing={1}>
                    <FormControl sx={{ ...ENHANCED_FORM_CONTROL_SX, flex: 1 }}>
                      <InputLabel>Side (optional)</InputLabel>
                      <Select
                        label="Side (optional)"
                        value={manualForm.wedding_side}
                        onChange={(e) => setManualForm({ ...manualForm, wedding_side: e.target.value })}
                      >
                        <MenuItem value="">—</MenuItem>
                        <MenuItem value="bride">Bride</MenuItem>
                        <MenuItem value="groom">Groom</MenuItem>
                        <MenuItem value="both">Both</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label="Tag (optional)"
                      placeholder="e.g. Priya's Friends"
                      value={manualForm.tag}
                      onChange={(e) => setManualForm({ ...manualForm, tag: e.target.value })}
                      sx={{ ...ENHANCED_TEXT_FIELD_SX, flex: 1 }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                    />
                  </Stack>

                  {/* Button row: Cancel | Add — right-aligned */}
                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
                    <SecondaryActionButton
                      onClick={handleClose}
                      sx={{ minWidth: 100, height: 40 }}
                    >
                      Cancel
                    </SecondaryActionButton>
                    <PrimaryActionButton
                      onClick={handleAddManual}
                      disabled={!manualForm.name.trim() || (!manualForm.email.trim() && !manualForm.phone.trim())}
                      sx={{
                        minWidth: 100,
                        height: 40,
                        '&.Mui-disabled': {
                          bgcolor: COLORS.brand.primaryDisabled,
                          color: COLORS.text.inverse,
                        },
                      }}
                    >
                      Add
                    </PrimaryActionButton>
                  </Stack>
                </Stack>

                {/* Added guests table */}
                {manualGuests.length > 0 && (
                  <Paper elevation={0} sx={{ mt: 2, border: '1px solid rgba(0,0,0,0.07)', borderRadius: RADII.md, overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 220 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: COLORS.bg.muted }}>
                            <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 12 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 12 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 12 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 12 }}>Side</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 12 }}>Tag</TableCell>
                            <TableCell sx={{ width: 40 }} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {manualGuests.map((g, i) => (
                            <TableRow key={i}>
                              <TableCell sx={{ color: COLORS.text.strong, fontSize: 12 }}>{g.name}</TableCell>
                              <TableCell sx={{ color: COLORS.text.muted, fontSize: 12 }}>{g.email || '—'}</TableCell>
                              <TableCell sx={{ color: COLORS.text.muted, fontSize: 12 }}>{g.phone ? `${g.country_code}${g.phone}` : '—'}</TableCell>
                              <TableCell sx={{ color: COLORS.text.muted, fontSize: 12 }}>{g.wedding_side || '—'}</TableCell>
                              <TableCell sx={{ color: COLORS.text.muted, fontSize: 12 }}>{g.tag || '—'}</TableCell>
                              <TableCell>
                                <IconButton size="small" onClick={() => handleRemoveManual(i)}>
                                  <Close sx={{ fontSize: 14, color: COLORS.text.faint }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ p: 1.5, bgcolor: COLORS.bg.muted, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <Typography sx={{ fontSize: 12, color: COLORS.text.muted, fontWeight: 500 }}>
                        {manualGuests.length} guest{manualGuests.length !== 1 ? 's' : ''} ready to import
                      </Typography>
                    </Box>
                  </Paper>
                )}
              </Box>
            )}

            {parseError && <Box sx={{ mt: 2 }}><ErrorAlert>{parseError}</ErrorAlert></Box>}
          </>
        )}

        {/* ═══ Step: Confirm ═══════════════════════════════════ */}
        {step === 'confirm' && (() => {
          const mapped = buildGuestsFromMapping();
          const stats = {
            total: mapped.length,
            withEmail: mapped.filter((g) => g.email).length,
            withPhone: mapped.filter((g) => g.phone).length,
          };
          const preview = mapped.slice(0, 5);
          return (
            <Box>
              <Typography sx={{ fontSize: 13, color: COLORS.text.muted, mb: 2 }}>
                Found <strong>{stats.total}</strong> guest{stats.total !== 1 ? 's' : ''} in your file.
                {' '}<span style={{ color: COLORS.text.subtle }}>{stats.withEmail} with email · {stats.withPhone} with phone</span>
              </Typography>

              <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.text.strong, mb: 1 }}>
                Preview (first {preview.length})
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: RADII.md,
                  overflow: 'hidden',
                  bgcolor: COLORS.bg.white,
                }}
              >
                <TableContainer sx={{ maxHeight: 260, bgcolor: COLORS.bg.white }}>
                  <Table size="small" sx={{ bgcolor: COLORS.bg.white }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: COLORS.bg.muted }}>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 11, bgcolor: COLORS.bg.muted }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 11, bgcolor: COLORS.bg.muted }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 11, bgcolor: COLORS.bg.muted }}>Phone</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 11, bgcolor: COLORS.bg.muted }}>Side</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 11, bgcolor: COLORS.bg.muted }}>Tag</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ bgcolor: COLORS.bg.white }}>
                      {preview.map((row, i) => (
                        <TableRow key={i} sx={{ bgcolor: i % 2 === 0 ? COLORS.bg.white : COLORS.bg.muted }}>
                          <TableCell sx={{ color: COLORS.text.strong, fontSize: 12, fontWeight: 500 }}>{row.name || '—'}</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 12 }}>{row.email || '—'}</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 12 }}>{row.phone || '—'}</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 12 }}>{row.wedding_side || '—'}</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 12 }}>{row.group || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {stats.withEmail === 0 && stats.withPhone === 0 && (
                <Box sx={{ mt: 2 }}>
                  <InfoAlert>
                    No email or phone detected. You can still import names — add contacts later to unlock WhatsApp broadcasting, RSVPs, travel and logistics collection, and the guest concierge.
                  </InfoAlert>
                </Box>
              )}
            </Box>
          );
        })()}

        {/* ═══ Step: Importing ════════════════════════════════ */}
        {step === 'importing' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, py: 4 }}>
            <CircularProgress size={40} sx={{ color: COLORS.brand.primary, mb: 2 }} />
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: COLORS.text.strong }}>
              Importing guests...
            </Typography>
            <LinearProgress sx={{ width: '50%', mt: 2, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: COLORS.brand.primary } }} />
          </Box>
        )}

        {/* ═══ Step: Done ═════════════════════════════════════ */}
        {step === 'done' && result && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 3 }}>
            {result.imported > 0 ? (
              <>
                <Celebration sx={{ fontSize: 48, color: COLORS.brand.primary, mb: 1.5 }} />
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: COLORS.text.strong, mb: 1.5 }}>
                  {result.imported} guest{result.imported !== 1 ? 's' : ''} imported
                </Typography>
              </>
            ) : (
              <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: COLORS.text.strong, mb: 1.5 }}>
                No new guests imported
              </Typography>
            )}

            <Stack direction="row" justifyContent="center" spacing={1} sx={{ mb: result.errors.length > 0 ? 2 : 3, flexWrap: 'wrap', rowGap: 1 }}>
              {result.imported > 0 && (
                <PheraChip tone="success" size="small" icon={<CheckCircle sx={{ fontSize: 14 }} />} label={`${result.imported} imported`} />
              )}
              {result.duplicates > 0 && (
                <PheraChip tone="warning" size="small" label={`${result.duplicates} duplicates skipped`} />
              )}
              {result.errors.length > 0 && (
                <PheraChip tone="danger" size="small" label={`${result.errors.length} errors`} />
              )}
            </Stack>

            {result.errors.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  bgcolor: 'rgba(222, 63, 94, 0.05)',
                  border: '1px solid rgba(222, 63, 94, 0.2)',
                  borderRadius: RADII.md,
                  p: 2,
                  mb: 3,
                  maxHeight: 150,
                  overflow: 'auto',
                  textAlign: 'left',
                  width: '100%',
                  maxWidth: 500,
                }}
              >
                {result.errors.map((e, i) => (
                  <Typography key={i} sx={{ fontSize: 12, color: COLORS.brand.primary, fontWeight: 500, mb: 0.3 }}>
                    {e.row > 0 ? `Row ${e.row}: ` : ''}{e.reason}
                  </Typography>
                ))}
              </Paper>
            )}

            <PrimaryActionButton onClick={handleClose} sx={{ minWidth: 140, height: 40 }}>
              Done
            </PrimaryActionButton>
          </Box>
        )}
      </DialogContent>

      {/* ═══ Footer Actions ══════════════════════════════════ */}
      {step !== 'done' && step !== 'importing' && (
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          {step === 'confirm' || tab !== 1 ? (
            <Button
              onClick={step === 'confirm' ? () => setStep('select') : handleClose}
              sx={{ textTransform: 'none', color: COLORS.text.subtle, fontWeight: 500 }}
            >
              {step === 'confirm' ? 'Back' : 'Cancel'}
            </Button>
          ) : (
            <Box />
          )}

          {step === 'confirm' && (
            <PrimaryActionButton
              onClick={handleImport}
              loading={importing}
              disabled={buildGuestsFromMapping().length === 0}
            >
              Import {buildGuestsFromMapping().length} Guest{buildGuestsFromMapping().length !== 1 ? 's' : ''}
            </PrimaryActionButton>
          )}

          {step === 'select' && tab === 1 && manualGuests.length > 0 && (
            <PrimaryActionButton
              onClick={handleImport}
              loading={importing}
            >
              Import {manualGuests.length} Guest{manualGuests.length !== 1 ? 's' : ''}
            </PrimaryActionButton>
          )}
        </DialogActions>
      )}

    </PheraDialog>
  );
}
