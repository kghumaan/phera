'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Checkbox,
  FormControlLabel,
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
  Add as AddIcon,
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
import { getTagColor } from '@/lib/utils/tag-color';
import { TagPicker } from './TagPicker';
import {
  parseCsv,
  parseXlsx,
  parseVCard,
  autoMapColumns,
  applyColumnMapping,
  type ParsedRow,
  type MappedGuest,
} from '@/lib/admin/guest-import-parsers';
import { smartMapColumns } from '@/lib/admin/smart-column-mapping';

// ─── Types ──────────────────────────────────────────────────────────

interface GuestImportWizardProps {
  open: boolean;
  onClose: () => void;
  weddingId: string;
  weddingSlug: string;
  onImportComplete?: (count: number) => void;
  /** 0 = Upload file, 1 = Add manually. Defaults to 0. */
  initialTab?: number;
  /** Tags already in use across the wedding — powers the tag-picker suggestions. */
  existingTags?: string[];
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
  initialTab = 0,
  existingTags = [],
}: GuestImportWizardProps) {
  const [tab, setTab] = useState(initialTab);
  const [step, setStep] = useState<Step>('select');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  // True while the LLM column analyzer is refining the heuristic mapping in
  // the background. The preview updates in place when it lands.
  const [smartChecking, setSmartChecking] = useState(false);
  const analyzeRunId = useRef(0);
  // Required attestation before any import — host warrants lawful basis to
  // upload guest contact info per Terms § 5 (host indemnification clause).
  const [consentGiven, setConsentGiven] = useState(false);
  interface ManualAdditionalGuest { name: string; phone: string }
  interface ManualGuestForm {
    name: string;
    email: string;
    phone: string;
    tags: string[];
    plus_one_name: string;
    plus_one_phone: string;
    additional_guests: ManualAdditionalGuest[];
    party_size: number;
  }
  const [manualGuests, setManualGuests] = useState<ManualGuestForm[]>([]);
  const [manualForm, setManualForm] = useState<ManualGuestForm>({
    name: '',
    email: '',
    phone: '',
    tags: [],
    plus_one_name: '',
    plus_one_phone: '',
    additional_guests: [],
    party_size: 1,
  });
  // Tag picker popover state (shared with guest-list per-row picker UX).
  const [tagDraft, setTagDraft] = useState('');
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const tagAddBtnRef = useRef<HTMLButtonElement | null>(null);
  const [exportHelpOpen, setExportHelpOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Reset ───────────────────────────────────────────────────

  const resetState = useCallback(() => {
    setTab(initialTab);
    setStep('select');
    setHeaders([]);
    setRows([]);
    setColumnMap({});
    setImporting(false);
    setResult(null);
    setDragOver(false);
    setParseError(null);
    analyzeRunId.current += 1;
    setSmartChecking(false);
    setManualGuests([]);
    setManualForm({ name: '', email: '', phone: '', tags: [], plus_one_name: '', plus_one_phone: '', additional_guests: [], party_size: 1 });
    setTagDraft('');
    setTagPickerOpen(false);
    setConsentGiven(false);
  }, [initialTab]);

  // Sync local `tab` with `initialTab` whenever the dialog is (re)opened or the
  // caller asks for a different tab. Without this, consecutive opens from
  // different buttons would stick on the last tab the user left.
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file';
      setParseError(msg);
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

    // Refine the heuristic mapping with the LLM column analyzer in the
    // background — catches plus-one / additional-guest columns the
    // dictionary misses. The preview re-renders in place when it lands;
    // on any failure the heuristic mapping stands.
    const runId = ++analyzeRunId.current;
    setSmartChecking(true);
    smartMapColumns(fields, data)
      .then(({ mapping: smart, source }) => {
        if (analyzeRunId.current !== runId) return;
        setSmartChecking(false);
        if (source === 'llm') setColumnMap(smart);
      })
      .catch(() => {
        if (analyzeRunId.current === runId) setSmartChecking(false);
      });
  };

  // ─── Manual Guest Helpers ─────────────────────────────────────

  const handleAddManual = () => {
    if (!manualForm.name.trim()) return;
    setManualGuests((prev) => [
      ...prev,
      {
        ...manualForm,
        tags: [...manualForm.tags],
        additional_guests: manualForm.additional_guests.map((x) => ({ ...x })),
      },
    ]);
    setManualForm({ ...manualForm, name: '', email: '', phone: '', tags: [], plus_one_name: '', plus_one_phone: '', additional_guests: [], party_size: 1 });
    setTagDraft('');
    setTagPickerOpen(false);
  };

  const handleRemoveManual = (index: number) => {
    setManualGuests((prev) => prev.filter((_, i) => i !== index));
  };

  const addManualAdditionalGuest = () => {
    setManualForm((prev) => ({
      ...prev,
      additional_guests: [...prev.additional_guests, { name: '', phone: '' }],
      // Bump party size if the new row pushes the floor up.
      party_size: Math.max(prev.party_size, 1 + (prev.plus_one_name || prev.plus_one_phone ? 1 : 0) + prev.additional_guests.length + 1),
    }));
  };

  const updateManualAdditionalGuest = (idx: number, patch: Partial<ManualAdditionalGuest>) => {
    setManualForm((prev) => ({
      ...prev,
      additional_guests: prev.additional_guests.map((x, i) => (i === idx ? { ...x, ...patch } : x)),
    }));
  };

  const removeManualAdditionalGuest = (idx: number) => {
    setManualForm((prev) => ({
      ...prev,
      additional_guests: prev.additional_guests.filter((_, i) => i !== idx),
    }));
  };

  const stageManualTag = (tag: string) => {
    const t = tag.trim();
    if (!t) return;
    setManualForm((prev) =>
      prev.tags.includes(t) ? prev : { ...prev, tags: [...prev.tags, t] },
    );
  };

  const unstageManualTag = (tag: string) => {
    setManualForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  // ─── Template download ───────────────────────────────────────
  // Generate a sample .csv with our expected schema + 2 pre-filled rows so
  // couples can open the template and see exactly what columns to fill.
  const handleDownloadTemplate = () => {
    const csv = [
      'Name,Email,Phone,Plus One,Plus One Phone,Party Size,Tags',
      'Priya Sharma,priya@example.com,+1 415 555 0100,,,1,"bride-side,family"',
      'Arjun Mehta,arjun@example.com,+1 415 555 0200,Aisha Mehta,+1 415 555 0199,2,"groom-side,family"',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'phera-guest-list-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── Build Guest Array ───────────────────────────────────────

  function buildGuestsFromMapping(): MappedGuest[] {
    return applyColumnMapping(rows, columnMap);
  }

  // ─── Import ──────────────────────────────────────────────────

  const handleImport = async () => {
    if (!consentGiven || (tab === 0 && smartChecking)) return;
    setImporting(true);
    setStep('importing');

    // Manual tab sends guests directly; file upload uses column mapping
    const guestsToImport = tab === 1
      ? manualGuests.map((g) => ({
          name: g.name,
          email: g.email || undefined,
          phone: g.phone.trim() || undefined,
          tags: g.tags.length > 0 ? g.tags : undefined,
          plus_one_name: g.plus_one_name.trim() || undefined,
          plus_one_phone: g.plus_one_phone.trim() || undefined,
          additional_guests:
            g.additional_guests.length > 0
              ? g.additional_guests
                  .map((x) => ({ name: x.name.trim(), phone: x.phone.trim() }))
                  .filter((x) => x.name.length > 0 || x.phone.length > 0)
              : undefined,
          party_size: g.party_size > 0 ? g.party_size : undefined,
        }))
      : // CSV path: applyColumnMapping already emits the API payload shape
        // (typed party_size, additional_guests, derived tags).
        buildGuestsFromMapping();

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setResult({ imported: 0, duplicates: 0, errors: [{ row: -1, reason: msg }] });
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
                  <Typography sx={{ fontSize: 14, color: COLORS.text.subtle }}>
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

                {/* Guidelines — mirrors Zola-style import flow: template link,
                    bullet checklist, and a sample row. Keeps our exact schema. */}
                <Box sx={{ mt: 2.5 }}>
                  <Typography
                    variant="body1"
                    sx={{ color: COLORS.text.strong, lineHeight: 1.6, mb: 1.5 }}
                  >
                    <Box
                      component="button"
                      type="button"
                      onClick={handleDownloadTemplate}
                      sx={{
                        background: 'none',
                        border: 'none',
                        p: 0,
                        cursor: 'pointer',
                        fontWeight: 700,
                        color: COLORS.text.strong,
                        textDecoration: 'underline',
                        textUnderlineOffset: 2,
                        font: 'inherit',
                        '&:hover': { color: COLORS.brand.primary },
                      }}
                    >
                      Use our template
                    </Box>
                    <Box component="span" sx={{ color: COLORS.text.muted }}>
                      , or follow the guidelines below to adapt an existing spreadsheet.
                    </Box>
                  </Typography>

                  <Stack spacing={1.25} sx={{ mb: 2 }}>
                    {[
                      'Enter column headers (e.g. Name, Email, Phone, Plus One, Plus One Phone, Party Size, Tags) in the first row.',
                      'One guest per row. Include email and/or phone so they can RSVP and get WhatsApp updates. Plus One Phone is optional but useful for direct follow-up.',
                      'Tags: separate multiple tags in a single cell with commas (e.g. bride-side, family) — they’ll import as distinct pills.',
                      'Party Size is optional. Leave blank or set to 1 for a single guest; bump it to 2+ to track expected attendees per household.',
                      'Save your spreadsheet as a .csv, .xlsx, or .vcf file.',
                    ].map((line, i) => (
                      <Stack key={i} direction="row" spacing={1.25} alignItems="flex-start">
                        <CheckCircle
                          sx={{
                            fontSize: 20,
                            color: COLORS.brand.primary,
                            mt: '1px',
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: COLORS.text.strong, lineHeight: 1.55 }}
                        >
                          {line}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  {/* Example row — single guest showing the schema. */}
                  <TableContainer
                    sx={{
                      borderRadius: RADII.sm,
                      border: `1px solid ${COLORS.border.light}`,
                      overflow: 'hidden',
                      bgcolor: COLORS.bg.white,
                    }}
                  >
                    <Table size="small" sx={{ bgcolor: COLORS.bg.white }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: COLORS.bg.muted }}>
                          <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, py: 0.9 }}>
                            Name
                            <Box component="span" sx={{ color: COLORS.brand.primary, ml: 0.5 }}>*</Box>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, py: 0.9 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, py: 0.9 }}>Phone</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, py: 0.9 }}>Plus One</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, py: 0.9 }}>Plus One Phone</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, py: 0.9 }}>Party Size</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, py: 0.9 }}>Tags</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody sx={{ bgcolor: COLORS.bg.white }}>
                        <TableRow sx={{ bgcolor: COLORS.bg.white }}>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 14, py: 0.75 }}>Arjun Mehta</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 14, py: 0.75 }}>arjun@example.com</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 14, py: 0.75 }}>+1 415 555 0200</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 14, py: 0.75 }}>Aisha Mehta</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 14, py: 0.75 }}>+1 415 555 0199</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 14, py: 0.75 }}>2</TableCell>
                          <TableCell sx={{ color: COLORS.text.muted, fontSize: 14, py: 0.75 }}>groom-side, family</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

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
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORS.text.strong }}>
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
                    <Typography sx={{ fontSize: 14, color: COLORS.text.muted, mt: 1.5, mb: 1.5, lineHeight: 1.7 }}>
                      Export your phone&apos;s address book as a .vcf file, then upload it here. Easiest from a desktop browser after emailing the file to yourself.
                    </Typography>

                    <Stack spacing={1.5}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                          <PhoneIphone sx={{ fontSize: 16, color: COLORS.text.strong }} />
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORS.text.strong }}>
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
                            <Typography key={i} component="li" sx={{ fontSize: 14, color: COLORS.text.muted, lineHeight: 1.6 }}>
                              {step}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                          <Android sx={{ fontSize: 16, color: COLORS.text.strong }} />
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORS.text.strong }}>
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
                            <Typography key={i} component="li" sx={{ fontSize: 14, color: COLORS.text.muted, lineHeight: 1.6 }}>
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
                {/* Stack spacing controls the gap between rows AND the gap
                    between section headers and adjacent rows so the header
                    margins above + below match. */}
                <Stack spacing={2.5}>
                  <Typography
                    variant="subtitleCaps"
                    sx={{ color: COLORS.text.muted, display: 'block', m: 0 }}
                  >
                    Primary guest
                  </Typography>
                  {/* Row 1: Full Name | Email */}
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Full Name"
                      value={manualForm.name}
                      onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                      fullWidth
                      required
                      sx={{
                        ...ENHANCED_TEXT_FIELD_SX,
                        // Brand-pink asterisk instead of the default MUI red
                        // (CLAUDE.md: no red; required markers use brand pink).
                        '& .MuiFormLabel-asterisk': { color: COLORS.brand.primary },
                      }}
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

                  {/* Row 2: Phone | Party Size — Party size lives with the
                      primary guest so the Plus One row below stays at two
                      columns and lines up with the additional-guest rows. */}
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Phone"
                      placeholder="Include country code, e.g. +1 415 555 0100"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                      sx={{ ...ENHANCED_TEXT_FIELD_SX, flex: 1 }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                    />
                    <TextField
                      label="Party Size"
                      type="number"
                      inputProps={{ min: 1, max: 20 }}
                      value={manualForm.party_size}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        setManualForm({ ...manualForm, party_size: Number.isFinite(n) && n > 0 ? n : 1 });
                      }}
                      sx={{ ...ENHANCED_TEXT_FIELD_SX, width: 140, flexShrink: 0 }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                    />
                  </Stack>

                  <Typography
                    variant="subtitleCaps"
                    sx={{ color: COLORS.text.muted, display: 'block', m: 0 }}
                  >
                    Additional guests
                  </Typography>
                  {/* Row 3: Plus One name | Plus One Phone — two columns,
                      same shape as each additional-guest row below. */}
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Plus One"
                      placeholder="e.g. Aisha Patel"
                      value={manualForm.plus_one_name}
                      onChange={(e) => setManualForm({ ...manualForm, plus_one_name: e.target.value })}
                      fullWidth
                      sx={ENHANCED_TEXT_FIELD_SX}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                    />
                    <TextField
                      label="Plus One Phone"
                      placeholder="+1 415 555 0199"
                      value={manualForm.plus_one_phone}
                      onChange={(e) => setManualForm({ ...manualForm, plus_one_phone: e.target.value })}
                      fullWidth
                      sx={ENHANCED_TEXT_FIELD_SX}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                    />
                  </Stack>

                  {/* Additional named guests — same pattern as the detail-drawer
                      "Additional guests" section. Each row has name + phone +
                      remove icon, with a chip-style "+ Add additional guest"
                      to append more. */}
                  {manualForm.additional_guests.map((ag, idx) => (
                    <Stack key={idx} direction="row" spacing={1} alignItems="center">
                      <TextField
                        label={`Guest ${idx + 2} name`}
                        placeholder="e.g. Rohan Mehta"
                        value={ag.name}
                        onChange={(e) => updateManualAdditionalGuest(idx, { name: e.target.value })}
                        fullWidth
                        sx={ENHANCED_TEXT_FIELD_SX}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                      />
                      <TextField
                        label={`Guest ${idx + 2} phone`}
                        placeholder="+1 415 555 0198"
                        value={ag.phone}
                        onChange={(e) => updateManualAdditionalGuest(idx, { phone: e.target.value })}
                        fullWidth
                        sx={ENHANCED_TEXT_FIELD_SX}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManual(); } }}
                      />
                      <IconButton
                        size="small"
                        aria-label={`Remove guest ${idx + 2}`}
                        onClick={() => removeManualAdditionalGuest(idx)}
                      >
                        <Close sx={{ fontSize: 18, color: COLORS.text.muted }} />
                      </IconButton>
                    </Stack>
                  ))}
                  <Box>
                    <Button
                      onClick={addManualAdditionalGuest}
                      endIcon={<AddIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        height: 32,
                        px: 1.5,
                        py: 0,
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        borderRadius: RADII.pill,
                        border: `1px dashed ${COLORS.border.default}`,
                        color: COLORS.text.muted,
                        '&:hover': {
                          borderColor: COLORS.brand.primary,
                          color: COLORS.brand.primary,
                          borderStyle: 'solid',
                          bgcolor: COLORS.brand.primarySubtle,
                        },
                        '& .MuiButton-endIcon': { ml: 0.5 },
                      }}
                    >
                      Add additional guest
                    </Button>
                  </Box>

                  {/* Row 5: Tags — multi-select with suggestion popover that
                      mirrors the per-row tag picker on the guest list. */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: COLORS.text.muted, fontWeight: 500, mb: 0.75 }}
                    >
                      Tags
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 0.75,
                        p: 1,
                        border: `1px solid ${COLORS.border.default}`,
                        borderRadius: RADII.md,
                        bgcolor: COLORS.bg.white,
                        minHeight: 44,
                      }}
                    >
                      {manualForm.tags.map((t) => {
                        const c = getTagColor(t);
                        return (
                          <Chip
                            key={t}
                            label={t}
                            size="small"
                            onDelete={() => unstageManualTag(t)}
                            deleteIcon={<Close sx={{ fontSize: 14 }} />}
                            sx={{
                              height: 28,
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              bgcolor: c.bg,
                              color: c.fg,
                              borderRadius: RADII.pill,
                              '& .MuiChip-deleteIcon': {
                                color: c.fg,
                                opacity: 0.6,
                                '&:hover': { opacity: 1, color: c.fg },
                              },
                            }}
                          />
                        );
                      })}
                      <Button
                        ref={tagAddBtnRef}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTagPickerOpen((o) => !o);
                        }}
                        endIcon={<AddIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          height: 28,
                          px: 1.25,
                          py: 0,
                          textTransform: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          borderRadius: RADII.pill,
                          border: `1px dashed ${tagPickerOpen ? COLORS.brand.primary : COLORS.border.default}`,
                          color: tagPickerOpen ? COLORS.brand.primary : COLORS.text.muted,
                          ...(tagPickerOpen && { borderStyle: 'solid', bgcolor: COLORS.brand.primarySubtle }),
                          '&:hover': {
                            borderColor: COLORS.brand.primary,
                            color: COLORS.brand.primary,
                            borderStyle: 'solid',
                            bgcolor: COLORS.brand.primarySubtle,
                          },
                          '& .MuiButton-endIcon': { ml: 0.5 },
                        }}
                      >
                        {manualForm.tags.length ? 'Add another' : 'Add tag'}
                      </Button>
                    </Box>
                    <TagPicker
                      open={tagPickerOpen}
                      anchorEl={tagAddBtnRef.current}
                      draft={tagDraft}
                      onSetDraft={setTagDraft}
                      existingTags={existingTags}
                      currentTags={manualForm.tags}
                      onAdd={stageManualTag}
                      onClose={() => {
                        setTagPickerOpen(false);
                        setTagDraft('');
                      }}
                    />
                  </Box>

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
                  <Paper elevation={0} sx={{ mt: 2, border: '1px solid rgba(0,0,0,0.07)', borderRadius: RADII.md, overflow: 'hidden', bgcolor: COLORS.bg.white }}>
                    <TableContainer sx={{ maxHeight: 220, bgcolor: COLORS.bg.white }}>
                      <Table size="small" sx={{ bgcolor: COLORS.bg.white }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: COLORS.bg.muted }}>
                            <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14 }}>No.</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14 }}>Plus One</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14 }}>Plus One Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14 }}>Tags</TableCell>
                            <TableCell sx={{ width: 40 }} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {manualGuests.map((g, i) => (
                            <TableRow key={i} sx={{ bgcolor: COLORS.bg.white, '&:hover': { bgcolor: COLORS.bg.muted } }}>
                              <TableCell sx={{ color: COLORS.text.strong, fontSize: 14 }}>{g.name}</TableCell>
                              <TableCell sx={{ color: COLORS.text.muted, fontSize: 14 }}>{g.party_size || 1}</TableCell>
                              <TableCell sx={{ color: COLORS.text.muted, fontSize: 14 }}>{g.plus_one_name || '—'}</TableCell>
                              <TableCell sx={{ color: COLORS.text.muted, fontSize: 14 }}>{g.plus_one_phone || '—'}</TableCell>
                              <TableCell sx={{ color: COLORS.text.muted, fontSize: 14 }}>{g.email || '—'}</TableCell>
                              <TableCell sx={{ color: COLORS.text.muted, fontSize: 14 }}>{g.phone || '—'}</TableCell>
                              <TableCell>
                                {g.tags.length > 0 ? (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {g.tags.map((t) => {
                                      const c = getTagColor(t);
                                      return (
                                        <Chip
                                          key={t}
                                          label={t}
                                          size="small"
                                          sx={{
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            bgcolor: c.bg,
                                            color: c.fg,
                                            borderRadius: RADII.pill,
                                          }}
                                        />
                                      );
                                    })}
                                  </Box>
                                ) : (
                                  <Typography sx={{ color: COLORS.text.faint, fontSize: 14 }}>—</Typography>
                                )}
                              </TableCell>
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
                      <Typography sx={{ fontSize: 14, color: COLORS.text.muted, fontWeight: 500 }}>
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
            plusOnes: mapped.filter((g) => g.plus_one_name || g.tags?.includes('plus-one-allowed')).length,
            companions: mapped.reduce((sum, g) => sum + (g.additional_guests?.length ?? 0), 0),
            headcount: mapped.reduce((sum, g) => sum + (g.party_size ?? 1), 0),
          };
          const preview = mapped.slice(0, 5);
          return (
            <Box>
              <Typography sx={{ fontSize: 14, color: COLORS.text.muted, mb: smartChecking ? 1 : 2 }}>
                Found <strong>{stats.total}</strong> guest{stats.total !== 1 ? 's' : ''} in your file
                {stats.headcount > stats.total ? (
                  <>
                    {' '}— <strong>{stats.headcount}</strong> expected attendees
                    {stats.plusOnes > 0 && <> incl. {stats.plusOnes} plus-one{stats.plusOnes !== 1 ? 's' : ''}</>}
                    {stats.companions > 0 && <> and {stats.companions} additional guest{stats.companions !== 1 ? 's' : ''}</>}
                  </>
                ) : null}
                .{' '}<span style={{ color: COLORS.text.subtle }}>{stats.withEmail} with email · {stats.withPhone} with phone</span>
              </Typography>

              {smartChecking && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <CircularProgress size={13} sx={{ color: COLORS.brand.primary }} />
                  <Typography sx={{ fontSize: 14, color: COLORS.text.subtle }}>
                    Double-checking your columns with AI — plus-ones and extra guests will appear here if found…
                  </Typography>
                </Stack>
              )}

              <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORS.text.strong, mb: 1 }}>
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
                        <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, bgcolor: COLORS.bg.muted }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, bgcolor: COLORS.bg.muted }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, bgcolor: COLORS.bg.muted }}>Phone</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, bgcolor: COLORS.bg.muted }}>Side</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, bgcolor: COLORS.bg.muted }}>Tag</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, bgcolor: COLORS.bg.muted }}>Plus One</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: 14, bgcolor: COLORS.bg.muted }}>No.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ bgcolor: COLORS.bg.white }}>
                      {preview.map((row, i) => {
                        const extraCount = row.additional_guests?.length ?? 0;
                        const plusOneLabel = row.plus_one_name
                          || (row.tags?.includes('plus-one-allowed') ? 'Yes' : '');
                        return (
                          <TableRow key={i} sx={{ bgcolor: i % 2 === 0 ? COLORS.bg.white : COLORS.bg.muted }}>
                            <TableCell sx={{ color: COLORS.text.strong, fontSize: 14, fontWeight: 500 }}>{row.name || '—'}</TableCell>
                            <TableCell sx={{ color: COLORS.text.muted, fontSize: 14 }}>{row.email || '—'}</TableCell>
                            <TableCell sx={{ color: COLORS.text.muted, fontSize: 14 }}>{row.phone || '—'}</TableCell>
                            <TableCell sx={{ color: COLORS.text.muted, fontSize: 14 }}>{row.wedding_side || '—'}</TableCell>
                            <TableCell sx={{ color: COLORS.text.muted, fontSize: 14 }}>{row.tags?.length ? row.tags.join(', ') : row.group || '—'}</TableCell>
                            <TableCell sx={{ color: COLORS.text.muted, fontSize: 14 }}>
                              {plusOneLabel || (extraCount > 0 ? '' : '—')}
                              {extraCount > 0 && (
                                <Box component="span" sx={{ color: COLORS.text.subtle }}>
                                  {plusOneLabel ? ' ' : ''}+{extraCount} more
                                </Box>
                              )}
                            </TableCell>
                            <TableCell sx={{ color: COLORS.text.muted, fontSize: 14 }}>{row.party_size ?? 1}</TableCell>
                          </TableRow>
                        );
                      })}
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
                  <Typography key={i} sx={{ fontSize: 14, color: COLORS.brand.primary, fontWeight: 500, mb: 0.3 }}>
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

      {/* ═══ Consent attestation — required for any import. Couples
              warrant under Terms § 5 they have a lawful basis to upload
              and have notified guests where required by law. */}
      {step !== 'done' && step !== 'importing' && (
        ((step === 'confirm') || (step === 'select' && tab === 1 && manualGuests.length > 0)) && (
          <Box sx={{ px: 3, pt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  size="small"
                  sx={{
                    color: COLORS.border.default,
                    '&.Mui-checked': { color: COLORS.brand.primary },
                    py: 0.5,
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: COLORS.text.muted, fontSize: '0.875rem', lineHeight: 1.5 }}>
                  I have a lawful basis to upload these contacts and have notified them of how their data will be used, where required by law (TCPA, GDPR, DPDPA, and similar). See our{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#DE3F5E] hover:underline">Terms § 5</a>.
                </Typography>
              }
              sx={{ alignItems: 'flex-start', m: 0 }}
            />
          </Box>
        )
      )}

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
              // Block import while the column analyzer is in flight — importing
              // with the stale heuristic mapping would silently drop the very
              // plus-one/companion columns the analyzer exists to catch.
              disabled={buildGuestsFromMapping().length === 0 || !consentGiven || smartChecking}
            >
              {smartChecking
                ? 'Checking columns…'
                : `Import ${buildGuestsFromMapping().length} Guest${buildGuestsFromMapping().length !== 1 ? 's' : ''}`}
            </PrimaryActionButton>
          )}

          {step === 'select' && tab === 1 && manualGuests.length > 0 && (
            <PrimaryActionButton
              onClick={handleImport}
              loading={importing}
              disabled={!consentGiven}
            >
              Import {manualGuests.length} Guest{manualGuests.length !== 1 ? 's' : ''}
            </PrimaryActionButton>
          )}
        </DialogActions>
      )}

    </PheraDialog>
  );
}
