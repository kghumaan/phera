'use client';

import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Chip,
  Checkbox,
  IconButton,
  CircularProgress,
  alpha,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Collapse,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import React, { useState, use, useEffect, useCallback, useRef } from 'react';
import {
  ArrowBack,
  Refresh,
  CheckCircle,
  RadioButtonUnchecked,
  Assignment,
  AttachMoney,
  Summarize,
  Gavel,
  EventNote,
  Edit,
  Save,
  ExpandMore,
  ExpandLess,
  Delete,
  ViewKanban,
  Upload,
  InfoOutlined,
} from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AskPheraPanel from '@/components/admin/coordinator/AskPheraPanel';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import AskPheraFab from '@/components/admin/coordinator/AskPheraFab';
import MembersTab from '@/components/admin/coordinator/MembersTab';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { weddingService } from '@/lib/supabase/wedding-service';
import { isDemoUser, DEMO_VENDOR_DETAILS, DEMO_MEMBERS, DEMO_BUTTON_TOOLTIPS } from '@/lib/demo/coordinator-mock-data';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';

interface Message {
  id: string;
  sender_name: string;
  sender_type: string;
  content: string;
  message_timestamp: string;
  has_media: boolean;
  media_type: string | null;
}

interface Insight {
  id: string;
  insight_type: string;
  content: string;
  is_completed: boolean;
  priority: string;
  due_date: string | null;
  metadata: any;
  created_at: string;
}

interface VendorDetail {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  notes: string | null;
  vendor_conversations: Array<{
    id: string;
    title: string | null;
    message_count: number;
    last_message_at: string | null;
    status: string;
    source: string;
    vendor_messages: Message[];
  }>;
  vendor_insights: Insight[];
}

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  summary: <Summarize sx={{ fontSize: 16 }} />,
  action_item: <Assignment sx={{ fontSize: 16 }} />,
  decision: <Gavel sx={{ fontSize: 16 }} />,
  price_quote: <AttachMoney sx={{ fontSize: 16 }} />,
  deadline: <EventNote sx={{ fontSize: 16 }} />,
};

const INSIGHT_COLORS: Record<string, string> = {
  summary: COLORS.accent.info,
  action_item: COLORS.accent.warning,
  decision: COLORS.accent.success,
  price_quote: COLORS.side.both,
  deadline: COLORS.accent.danger,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: COLORS.text.faint,
  medium: COLORS.accent.warning,
  high: COLORS.accent.danger,
  urgent: '#D32F2F',
};

const STATUS_OPTIONS = ['active', 'booked', 'declined', 'paid'];

const STATUS_COLORS: Record<string, string> = {
  active: COLORS.accent.info,
  booked: COLORS.accent.success,
  declined: COLORS.text.faint,
  paid: '#8BC34A',
};

const SENDER_COLORS: Record<string, string> = {
  vendor: COLORS.side.both,
  couple: COLORS.brand.primary,
  planner: COLORS.accent.info,
  coordinator: COLORS.accent.success,
  unknown: '#757575',
};

/**
 * Deterministic color palette for per-member message tinting in the
 * conversation view. Hashes the sender name into a stable palette index
 * so each participant keeps the same color across renders and reloads.
 */
const MEMBER_PALETTE = [
  COLORS.brand.primary, COLORS.accent.info, COLORS.side.both, COLORS.accent.success, COLORS.accent.warning,
  '#00BCD4', '#F06292', '#795548', '#5E35B1', '#00897B',
  '#FB8C00', '#3949AB', '#8BC34A', '#E53935', '#546E7A',
];
function memberColor(name: string): string {
  if (!name) return '#757575';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return MEMBER_PALETTE[Math.abs(hash) % MEMBER_PALETTE.length];
}

export default function VendorDetailPage({
  params,
}: {
  params: Promise<{ weddingSlug: string; vendorId: string }>;
}) {
  const { weddingSlug, vendorId } = use(params);
  const { user } = useAuth();
  const { isViewOnly } = useAdminRole();
  const { showStatus } = useAutoSaveStatus();
  const isDemo = isDemoUser();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Ask Phera panel
  const [askPheraOpen, setAskPheraOpen] = useState(true);

  // Delete vendor
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Collapsible insight sections
  const [decisionsOpen, setDecisionsOpen] = useState(false);
  const [priceQuotesOpen, setPriceQuotesOpen] = useState(false);
  const [deadlinesOpen, setDeadlinesOpen] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', category: '', phone: '', email: '', status: '', notes: '' });
  const VENDOR_CATEGORIES = ['Venue', 'Catering', 'Photography', 'Videography', 'Florist', 'DJ/Music', 'Decor', 'Makeup', 'Mehndi', 'Priest', 'Invitations', 'Cake', 'Rental', 'Transportation', 'Planner', 'Other'];
  const [saving, setSaving] = useState(false);

  // Wedding ID for Ask Phera
  const [weddingId, setWeddingId] = useState<string | null>(null);

  // Track which action items have been imported to task manager
  const [importedItems, setImportedItems] = useState<Set<string>>(new Set());
  const [importingItem, setImportingItem] = useState<string | null>(null);

  // Upload older messages (per-vendor chat export import)
  const olderFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingOlder, setUploadingOlder] = useState(false);

  const handleUploadOlderMessages = async (file: File) => {
    if (!weddingId || isDemo) return;
    if (!file.name.endsWith('.txt')) {
      showStatus('error', 'Please upload a .txt WhatsApp export');
      return;
    }
    setUploadingOlder(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('weddingId', weddingId);
      formData.append('vendorId', vendorId);
      const res = await fetch('/api/vendors/import-chat', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      const added = data.message_count ?? 0;
      const skipped = data.skipped_duplicates ?? 0;
      showStatus(
        'saved',
        `Added ${added} older message${added === 1 ? '' : 's'}${skipped > 0 ? ` (${skipped} duplicate${skipped === 1 ? '' : 's'} skipped)` : ''}`,
      );
      // Refresh vendor detail to surface the newly merged messages
      window.location.reload();
    } catch (err: any) {
      console.error('Upload older messages error:', err);
      showStatus('error', err?.message || 'Upload failed');
    } finally {
      setUploadingOlder(false);
      if (olderFileInputRef.current) olderFileInputRef.current.value = '';
    }
  };

  const handleImportToTaskManager = useCallback(async (item: Insight) => {
    if (!weddingId || isDemo) return;
    setImportingItem(item.id);
    try {
      const task = await weddingService.createTask({
        wedding_id: weddingId,
        title: item.content,
        description: item.due_date ? `Due: ${new Date(item.due_date).toLocaleDateString()}` : undefined,
        column: 'todo',
        tags: vendor?.name ? [vendor.name] : undefined,
        order_index: 0,
      });
      if (task) {
        setImportedItems(prev => new Set(prev).add(item.id));
        showStatus('saved', 'Added to Task Manager');
      } else {
        showStatus('error', 'Failed to import');
      }
    } catch {
      showStatus('error', 'Failed to import');
    } finally {
      setImportingItem(null);
    }
  }, [weddingId, vendor, isDemo, showStatus]);

  const loadVendor = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}`);
      const json = await res.json();
      if (json.vendor) {
        setVendor(json.vendor);
        setEditForm({
          name: json.vendor.name || '',
          category: json.vendor.category || '',
          phone: json.vendor.phone || '',
          email: json.vendor.email || '',
          status: json.vendor.status || 'active',
          notes: json.vendor.notes || '',
        });
      }
    } catch (err) {
      console.error('Error loading vendor:', err);
    } finally {
      setLoading(false);
    }
  }, [user, vendorId]);

  useEffect(() => {
    if (isDemo) {
      const demoVendor = DEMO_VENDOR_DETAILS[vendorId];
      if (demoVendor) {
        setVendor(demoVendor as any);
        setEditForm({
          name: demoVendor.name || '',
          category: demoVendor.category || '',
          phone: demoVendor.phone || '',
          email: demoVendor.email || '',
          status: demoVendor.status || 'active',
          notes: demoVendor.notes || '',
        });
      }
      setWeddingId('demo-wedding');
      setLoading(false);
      return;
    }
    loadVendor();
  }, [loadVendor, isDemo, vendorId]);

  // Get wedding ID
  useEffect(() => {
    if (isDemo) return;
    const fetchWeddingId = async () => {
      const { data } = await (supabase as any)
        .from('weddings')
        .select('id')
        .eq('slug', weddingSlug)
        .single();
      if (data) setWeddingId(data.id);
    };
    fetchWeddingId();
  }, [weddingSlug, isDemo]);

  // All messages across conversations, sorted by timestamp
  const allMessages = (vendor?.vendor_conversations || [])
    .flatMap((c) => c.vendor_messages || [])
    .sort(
      (a, b) =>
        new Date(a.message_timestamp).getTime() - new Date(b.message_timestamp).getTime()
    );

  // Group insights by type
  const summaries = vendor?.vendor_insights?.filter((i) => i.insight_type === 'summary') || [];
  const actionItems = vendor?.vendor_insights?.filter((i) => i.insight_type === 'action_item') || [];
  const decisions = vendor?.vendor_insights?.filter((i) => i.insight_type === 'decision') || [];
  const priceQuotes = vendor?.vendor_insights?.filter((i) => i.insight_type === 'price_quote') || [];
  const deadlines = vendor?.vendor_insights?.filter((i) => i.insight_type === 'deadline') || [];

  const conversationId = vendor?.vendor_conversations?.[0]?.id;

  const handleReanalyze = async () => {
    if (isViewOnly) return;
    if (!conversationId) return;
    setReanalyzing(true);
    try {
      const res = await fetch(`/api/vendors/conversations/${conversationId}/reanalyze`, {
        method: 'POST',
      });
      if (res.ok) {
        showStatus('saved', 'Analysis updated');
        loadVendor();
      } else {
        showStatus('error', 'Analysis failed');
      }
    } catch {
      showStatus('error', 'Analysis failed');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleDeleteVendor = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, { method: 'DELETE' });
      if (res.ok) {
        showStatus('saved', 'Vendor removed');
        router.push(`/admin/${weddingSlug}/coordinator`);
      } else {
        showStatus('error', 'Failed to delete vendor');
      }
    } catch {
      showStatus('error', 'Failed to delete vendor');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleToggleInsight = async (insightId: string, currentCompleted: boolean) => {
    if (isViewOnly) return;
    // Demo: local-only toggle, no API call
    if (isDemo) {
      setVendor((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          vendor_insights: prev.vendor_insights.map((i) =>
            i.id === insightId ? { ...i, is_completed: !currentCompleted } : i
          ),
        };
      });
      return;
    }
    try {
      await fetch('/api/vendors/insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId, is_completed: !currentCompleted }),
      });
      // Optimistic update
      setVendor((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          vendor_insights: prev.vendor_insights.map((i) =>
            i.id === insightId ? { ...i, is_completed: !currentCompleted } : i
          ),
        };
      });
    } catch {
      showStatus('error', 'Failed to update');
    }
  };

  const handleSaveVendor = async () => {
    if (isViewOnly) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        showStatus('saved', 'Vendor updated');
        setEditing(false);
        loadVendor();
      } else {
        showStatus('error', 'Failed to save');
      }
    } catch {
      showStatus('error', 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: COLORS.brand.primary }} />
      </Box>
    );
  }

  if (!vendor) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Vendor not found.</Typography>
        <Button onClick={() => router.back()} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 0, mt: { md: 'calc(-56px - 32px)' }, mr: { md: -4 }, mb: { md: -4 } }}>
      {/* Main content */}
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: askPheraOpen ? 'calc(100% - 380px)' : '100%', transition: 'max-width 0.2s', pt: { md: 'calc(56px + 32px)' } }}>
        <Box sx={{ pr: askPheraOpen ? 3 : 0, bgcolor: COLORS.bg.white }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <IconButton size="small" onClick={() => router.push(`/admin/${weddingSlug}/coordinator`)} sx={{ color: COLORS.text.strong }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              {editing ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    placeholder="Vendor name"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    sx={{
                      width: 180,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: RADII.sm,
                        bgcolor: COLORS.bg.white,
                        height: 36,
                        '& fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
                        '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
                      },
                      '& .MuiOutlinedInput-input': { color: COLORS.text.strong, fontSize: '0.875rem', py: 0 },
                    }}
                  />
                  <Select
                    size="small"
                    value={editForm.category}
                    onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                    displayEmpty
                    IconComponent={ExpandMore}
                    sx={{
                      width: 180,
                      height: 36,
                      borderRadius: RADII.sm,
                      fontSize: '0.875rem',
                      color: COLORS.text.strong,
                      bgcolor: COLORS.bg.white,
                      '& fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.3)' },
                      '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
                      '& .MuiSvgIcon-root': { fontSize: 18, color: COLORS.text.subtle },
                    }}
                  >
                    <MenuItem value="">No category</MenuItem>
                    {VENDOR_CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                  <Select
                    size="small"
                    value={editForm.status}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                    IconComponent={ExpandMore}
                    sx={{
                      width: 180,
                      height: 36,
                      borderRadius: RADII.sm,
                      fontSize: '0.875rem',
                      color: COLORS.text.strong,
                      bgcolor: COLORS.bg.white,
                      '& fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.3)' },
                      '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
                      '& .MuiSvgIcon-root': { fontSize: 18, color: COLORS.text.subtle },
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
                    ))}
                  </Select>
                  <IconButton size="small" onClick={handleSaveVendor} disabled={saving} sx={{ color: COLORS.text.strong }}>
                    {saving ? <CircularProgress size={16} /> : <Save sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Stack>
              ) : (
                <Box
                  onClick={() => !isDemo && setEditing(true)}
                  sx={{ cursor: isDemo ? 'default' : 'pointer' }}
                >
                  <Typography sx={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: COLORS.text.strong,
                  }}>
                    {vendor.name}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
                    {vendor.category && (
                      <Chip
                        label={vendor.category}
                        size="small"
                        sx={{ color: COLORS.text.muted, bgcolor: alpha(COLORS.text.strong, 0.06), fontSize: '0.875rem', height: 20, borderRadius: '4px' }}
                      />
                    )}
                    <Chip
                      label={vendor.status}
                      size="small"
                      sx={{
                        fontSize: '0.875rem',
                        height: 20,
                        borderRadius: '4px',
                        textTransform: 'capitalize',
                        bgcolor: alpha(STATUS_COLORS[vendor.status] || COLORS.text.faint, 0.1),
                        color: STATUS_COLORS[vendor.status] || COLORS.text.faint,
                      }}
                    />
                  </Stack>
                </Box>
              )}
            </Box>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {isDemo ? (
                <>
                  <Tooltip title={DEMO_BUTTON_TOOLTIPS.refreshInsights}>
                    <span>
                      <Button size="small" startIcon={<Refresh />} disabled sx={{ textTransform: 'none', borderRadius: RADII.md, color: COLORS.text.subtle, fontSize: '0.875rem' }}>
                        Refresh
                      </Button>
                    </span>
                  </Tooltip>
                  <Tooltip title={DEMO_BUTTON_TOOLTIPS.deleteVendorDetail}>
                    <IconButton size="small" sx={{ color: COLORS.text.faint }}>
                      <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  <input
                    ref={olderFileInputRef}
                    type="file"
                    accept=".txt"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadOlderMessages(f);
                    }}
                  />
                  <Tooltip title="Phera only sees messages sent after it joined the group. Upload a WhatsApp chat export (.txt, no media) to merge older history into this thread.">
                    <Button
                      size="small"
                      startIcon={uploadingOlder ? <CircularProgress size={14} /> : <Upload />}
                      onClick={() => olderFileInputRef.current?.click()}
                      disabled={uploadingOlder}
                      sx={{ textTransform: 'none', borderRadius: RADII.md, color: COLORS.text.subtle, fontSize: '0.875rem' }}
                    >
                      {uploadingOlder ? 'Uploading...' : 'Upload older messages'}
                    </Button>
                  </Tooltip>
                  <Button
                    size="small"
                    startIcon={reanalyzing ? <CircularProgress size={14} /> : <Refresh />}
                    onClick={handleReanalyze}
                    disabled={reanalyzing}
                    sx={{ textTransform: 'none', borderRadius: RADII.md, color: COLORS.text.subtle, fontSize: '0.875rem' }}
                  >
                    Refresh
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteConfirmOpen(true)}
                    sx={{ color: COLORS.brand.primary, '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.08) } }}
                  >
                    <Delete sx={{ fontSize: 18 }} />
                  </IconButton>
                </>
              )}
            </Stack>
          </Stack>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              mb: 2,
              borderBottom: '1px solid rgba(0,0,0,0.07)',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: COLORS.text.subtle,
                minHeight: 40,
                '&.Mui-selected': { color: COLORS.brand.primary },
              },
              '& .MuiTabs-indicator': { backgroundColor: COLORS.brand.primary },
            }}
          >
            <Tab label="Summary & Action Items" />
            <Tab label="Conversation" />
            <Tab label="Members" />
          </Tabs>

          {/* Tab 0: Summary & Action Items */}
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
              {/* Left: Overview + Price Quotes */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {summaries.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong, mb: 1 }}>Overview</Typography>
                    <Stack spacing={1}>
                      {summaries.map((item) => (
                        <Typography key={item.id} sx={{ fontSize: '0.875rem', lineHeight: 1.6, color: COLORS.text.muted }}>
                          {item.content}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}

                {priceQuotes.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {INSIGHT_ICONS.price_quote} Price Quotes
                    </Typography>
                    <Stack spacing={0.5}>
                      {priceQuotes.map((item) => (
                        <Typography key={item.id} sx={{ fontSize: '0.875rem', lineHeight: 1.5, color: COLORS.text.muted }}>
                          {item.content}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>

              {/* Right: Action Items */}
              {actionItems.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{ flex: '0 0 320px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 1, overflow: 'hidden', bgcolor: COLORS.bg.white }}
                >
                  <Box sx={{ px: 1.5, py: 1, bgcolor: COLORS.bg.subtle, borderBottom: '1px solid', borderColor: alpha(COLORS.text.strong, 0.06) }}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Box sx={{ color: COLORS.text.subtle }}>{INSIGHT_ICONS.action_item}</Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong }}>Action Items</Typography>
                    </Stack>
                  </Box>
                  <Stack sx={{ p: 1 }}>
                    {actionItems.map((item) => (
                      <Stack
                        key={item.id}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                          py: 0.75,
                          px: 0.5,
                          borderRadius: 1,
                          '&:hover': { bgcolor: alpha(COLORS.text.strong, 0.02) },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={item.is_completed}
                          onChange={() => handleToggleInsight(item.id, item.is_completed)}
                          icon={<RadioButtonUnchecked sx={{ fontSize: 18 }} />}
                          checkedIcon={<CheckCircle sx={{ fontSize: 18 }} />}
                          sx={{
                            p: 0,
                            color: COLORS.brand.primary,
                            '&.Mui-checked': { color: COLORS.brand.primary },
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography
                              sx={{
                                fontSize: '0.875rem',
                                lineHeight: 1.5,
                                textDecoration: item.is_completed ? 'line-through' : 'none',
                                color: item.is_completed ? '#aaa' : COLORS.text.strong,
                                flex: 1,
                              }}
                            >
                              {item.content}
                            </Typography>
                            {importedItems.has(item.id) ? (
                              <Chip
                                icon={<ViewKanban sx={{ fontSize: 14 }} />}
                                label="In Tasks"
                                size="small"
                                sx={{ height: 20, fontSize: '0.875rem', fontWeight: 600, bgcolor: alpha(COLORS.accent.success, 0.1), color: COLORS.accent.success, '& .MuiChip-icon': { color: COLORS.accent.success } }}
                              />
                            ) : (
                              <Tooltip title="Import to Task Manager">
                                <IconButton
                                  onClick={(e) => { e.stopPropagation(); handleImportToTaskManager(item); }}
                                  disabled={importingItem === item.id}
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    p: 0,
                                    color: COLORS.text.subtle,
                                    borderRadius: 1,
                                    '&:hover': { color: COLORS.brand.primary, bgcolor: alpha(COLORS.brand.primary, 0.08) },
                                  }}
                                >
                                  {importingItem === item.id ? <CircularProgress size={18} /> : <ViewKanban sx={{ fontSize: 20 }} />}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                          {item.due_date && (
                            <Typography sx={{ fontSize: '0.875rem', color: COLORS.accent.danger }}>
                              Due: {new Date(item.due_date).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              )}
            </Box>
          )}

          {/* Remaining sections under the flex layout */}
          {activeTab === 0 && (
            <Stack spacing={2} sx={{ mt: 2 }}>

              {/* Collapsible: Deadlines */}
              {deadlines.length > 0 && (
                <CollapsibleInsightSection
                  title="Deadlines"
                  icon={INSIGHT_ICONS.deadline}
                  color={INSIGHT_COLORS.deadline}
                  items={deadlines}
                  open={deadlinesOpen}
                  onToggle={() => setDeadlinesOpen((p) => !p)}
                />
              )}

              {/* Empty state */}
              {(vendor.vendor_insights?.length || 0) === 0 && (
                <Paper
                  elevation={0}
                  sx={{ p: 3, textAlign: 'center', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 1, bgcolor: COLORS.bg.white }}
                >
                  <Typography sx={{ color: COLORS.text.faint, fontSize: '0.875rem' }}>
                    No insights yet. Click "Re-analyze" to extract insights from the conversation.
                  </Typography>
                </Paper>
              )}
            </Stack>
          )}

          {/* Tab 1: Conversation */}
          {activeTab === 1 && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: 1,
                overflow: 'hidden',
                bgcolor: COLORS.bg.white,
              }}
            >
              <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong }}>
                  Conversation ({allMessages.length} messages)
                </Typography>
              </Box>
              <Box
                sx={{
                  maxHeight: { xs: 500, md: 600 },
                  overflowY: 'auto',
                  p: 1.5,
                }}
              >
                {allMessages.length === 0 ? (
                  <Typography sx={{ color: COLORS.text.faint, textAlign: 'center', py: 4, fontSize: '0.875rem' }}>
                    No messages yet.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {allMessages.map((msg, idx) => {
                      const prevMsg = idx > 0 ? allMessages[idx - 1] : null;
                      const showDate =
                        !prevMsg ||
                        new Date(msg.message_timestamp).toDateString() !==
                        new Date(prevMsg.message_timestamp).toDateString();

                      return (
                        <React.Fragment key={msg.id}>
                          {showDate && (
                            <Typography
                              sx={{ textAlign: 'center', fontSize: '0.875rem', color: COLORS.text.faint, py: 0.5 }}
                            >
                              {new Date(msg.message_timestamp).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Typography>
                          )}
                          <Box
                            sx={{
                              borderLeft: `3px solid ${memberColor(msg.sender_name)}`,
                              bgcolor: alpha(memberColor(msg.sender_name), 0.05),
                              pl: 1.25,
                              pr: 1,
                              py: 0.75,
                              borderRadius: '4px',
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.25 }}>
                              <Typography
                                sx={{
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  color: memberColor(msg.sender_name),
                                }}
                              >
                                {msg.sender_name}
                              </Typography>
                              <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.faint }}>
                                {new Date(msg.message_timestamp).toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                            </Stack>
                            <Typography sx={{ fontSize: '0.875rem', lineHeight: 1.5, pl: 0, color: COLORS.text.strong }}>
                              {msg.content}
                            </Typography>
                          </Box>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </Stack>
                )}
              </Box>
            </Paper>
          )}

          {/* Tab 2: Members */}
          {activeTab === 2 && isDemo && (
            <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 1, overflow: 'hidden', bgcolor: COLORS.bg.white }}>
              <Box sx={{ px: 1.5, py: 1, bgcolor: COLORS.bg.subtle, borderBottom: '1px solid', borderColor: alpha(COLORS.text.strong, 0.06) }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong }}>
                  Members ({DEMO_MEMBERS[vendorId]?.length || 0})
                </Typography>
              </Box>
              <Stack sx={{ p: 1.5 }} spacing={1}>
                {(DEMO_MEMBERS[vendorId] || []).map((member) => (
                  <Stack key={member.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: '50%',
                      bgcolor: member.role === 'vendor' ? alpha(COLORS.side.both, 0.12) : member.role === 'admin' ? alpha(COLORS.brand.primary, 0.12) : alpha(COLORS.accent.info, 0.12),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.875rem', fontWeight: 700,
                      color: member.role === 'vendor' ? COLORS.side.both : member.role === 'admin' ? COLORS.brand.primary : COLORS.accent.info,
                    }}>
                      {member.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.text.strong }}>{member.name}</Typography>
                      {member.phone && <Typography sx={{ fontSize: '0.875rem', color: COLORS.text.subtle }}>{member.phone}</Typography>}
                    </Box>
                    <Chip
                      label={member.role}
                      size="small"
                      sx={{
                        fontSize: '0.875rem', height: 20, borderRadius: '4px', textTransform: 'capitalize',
                        bgcolor: member.role === 'vendor' ? alpha(COLORS.side.both, 0.1) : member.role === 'admin' ? alpha(COLORS.brand.primary, 0.1) : alpha(COLORS.accent.info, 0.1),
                        color: member.role === 'vendor' ? COLORS.side.both : member.role === 'admin' ? COLORS.brand.primary : COLORS.accent.info,
                      }}
                    />
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )}
          {activeTab === 2 && !isDemo && conversationId && weddingId && (
            <MembersTab conversationId={conversationId} weddingId={weddingId} />
          )}
          {activeTab === 2 && !isDemo && !conversationId && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ color: COLORS.text.faint, fontSize: '0.875rem' }}>
                No conversation linked to this vendor yet.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Ask Phera Panel — hidden for demo */}
      {weddingId && !isDemo && (
        <AskPheraPanel
          weddingId={weddingId}
          open={askPheraOpen}
          onClose={() => setAskPheraOpen(false)}
          conversationId={conversationId}
        />
      )}

      {/* Ask Phera FAB — hidden for demo */}
      {weddingId && !isDemo && (
        <AskPheraFab
          onClick={() => setAskPheraOpen(true)}
          visible={!askPheraOpen}
        />
      )}

      {/* Delete confirmation */}
      <PheraDialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { maxWidth: 380 } }}
      >
        <PheraDialogTitle>Remove vendor?</PheraDialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
            This will permanently remove this vendor and all its conversations from your coordinator. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            disabled={deleting}
            sx={{ textTransform: 'none', borderRadius: RADII.md, color: COLORS.text.subtle }}
          >
            Cancel
          </Button>
          <PrimaryActionButton
            onClick={handleDeleteVendor}
            loading={deleting}
            startIcon={<Delete />}
          >
            Remove
          </PrimaryActionButton>
        </DialogActions>
      </PheraDialog>
    </Box>
  );
}

// Collapsible insight section
function CollapsibleInsightSection({
  title,
  icon,
  color,
  items,
  open,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: Insight[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: COLORS.bg.white,
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          px: 1.5,
          py: 1,
          bgcolor: COLORS.bg.subtle,
          borderBottom: open ? '1px solid' : 'none',
          borderColor: alpha(COLORS.text.strong, 0.06),
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          '&:hover': { bgcolor: '#EFEFEF' },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ color: COLORS.text.subtle }}>{icon}</Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: COLORS.text.strong }}>
            {title} ({items.length})
          </Typography>
        </Stack>
        {open ? <ExpandLess sx={{ fontSize: 18, color: COLORS.text.faint }} /> : <ExpandMore sx={{ fontSize: 18, color: COLORS.text.faint }} />}
      </Box>
      <Collapse in={open}>
        <Stack sx={{ p: 1.5 }} spacing={1}>
          {items.map((item) => (
            <Box key={item.id}>
              <Typography sx={{ fontSize: '0.875rem', lineHeight: 1.5, color: COLORS.text.strong }}>
                {item.content}
              </Typography>
              {item.due_date && (
                <Typography sx={{ fontSize: '0.875rem', color: COLORS.accent.danger, mt: 0.25 }}>
                  Due: {new Date(item.due_date).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </Collapse>
    </Paper>
  );
}
