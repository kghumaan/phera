'use client';

import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  DialogContent,
  DialogActions,
  alpha,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Checkbox,
    Tooltip,
  Tabs,
  Tab,
  Collapse,
} from '@mui/material';
import React, { useState, use, useEffect, useCallback, useRef } from 'react';
import {
  SupportAgent,
  Upload,
  CheckCircleOutline,
  Chat,
  Assignment,
  ContentCopy,
  PhoneAndroid,
  LockOutlined,
  WhatsApp,
  Sync,
  CloudSync,
  Delete,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { usePlan } from '@/lib/contexts/PlanContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import UpgradeModal from '@/components/admin/UpgradeModal';
import AskPheraPanel from '@/components/admin/coordinator/AskPheraPanel';
import AskPheraFab from '@/components/admin/coordinator/AskPheraFab';
import { useRouter } from 'next/navigation';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import { InfoOutlined } from '@mui/icons-material';
import { isDemoUser, DEMO_VENDORS, DEMO_COORDINATOR_PHONE, DEMO_COORDINATOR_TOOLTIP, DEMO_BUTTON_TOOLTIPS } from '@/lib/demo/coordinator-mock-data';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraSwitch } from '@/components/shared/Switch';
import { PheraCard } from '@/components/shared/Card';
import { PageHeading } from '@/components/shared/PageHeading';
import { StatCard } from '@/components/shared/StatCard';
import { PheraChip } from '@/components/shared/Chip';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';

interface Vendor {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  vendor_conversations: Array<{
    id: string;
    title: string | null;
    message_count: number;
    last_message_at: string | null;
    status: string;
  }>;
  vendor_insights: Array<{
    id: string;
    insight_type: string;
    content: string;
    is_completed: boolean;
    priority: string;
    due_date: string | null;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  active: COLORS.accent.info,
  booked: COLORS.accent.success,
  declined: COLORS.text.faint,
  paid: '#8BC34A',
};

// Mock data for Basic user blurred teaser
const mockVendors = [
  { name: 'Lakeside Manor', category: 'Venue', status: 'booked', messages: 42 },
  { name: 'Priya Catering Co.', category: 'Catering', status: 'active', messages: 28 },
  { name: 'Golden Lens Studio', category: 'Photography', status: 'active', messages: 15 },
  { name: 'Bloom & Petal', category: 'Florist', status: 'booked', messages: 9 },
  { name: 'DJ Rhythm', category: 'DJ/Music', status: 'active', messages: 6 },
];

const mockStats = [
  { label: 'Vendors', value: '5', icon: <SupportAgent fontSize="small" /> },
  { label: 'Conversations', value: '4', icon: <Chat fontSize="small" /> },
  { label: 'Open Items', value: '6', icon: <Assignment fontSize="small" /> },
];

export default function CoordinatorPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const { user } = useAuth();
  const { isViewOnly } = useAdminRole();
  const { showStatus } = useAutoSaveStatus();
  const router = useRouter();

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Coordinator phone
  const [coordinatorPhone, setCoordinatorPhone] = useState('');
  const [coordinatorLink, setCoordinatorLink] = useState('');
  const [phoneConfigured, setPhoneConfigured] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);

  // Import chat dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importVendorId, setImportVendorId] = useState('');
  const [importing, setImporting] = useState(false);

  // Sync groups
  const [syncing, setSyncing] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [discoveringGroups, setDiscoveringGroups] = useState(false);
  const [discoveredGroups, setDiscoveredGroups] = useState<Array<{ id: string; name: string; participantCount: number }>>([]);
  const [discoveredDirectChats, setDiscoveredDirectChats] = useState<Array<{ id: string; name: string; participantCount: number }>>([]);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [syncDialogTab, setSyncDialogTab] = useState(0);

  // Sync All
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncAllLabel, setSyncAllLabel] = useState('');

  // Ref guards to prevent duplicate API calls
  const discoverGuardRef = useRef(false);
  const syncAllGuardRef = useRef(false);
  const importGuardRef = useRef(false);

  // Ask Phera panel
  const [askPheraOpen, setAskPheraOpen] = useState(true);

  // Delete vendor
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isDemo = isDemoUser();

  // Testing toggle
  const isSuperAdmin = user?.email === 'kv.s.ghumaan@gmail.com' || user?.email === 'simran@simmetrystudios.com';
  const [forceOnboarding, setForceOnboarding] = useState(false);

  // Load wedding ID and vendors
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: wedding } = await (supabase as any)
        .from('weddings')
        .select('id')
        .eq('slug', weddingSlug)
        .single();

      if (!wedding) return;
      setWeddingId(wedding.id);

      const res = await fetch(`/api/vendors?weddingId=${wedding.id}`);
      const json = await res.json();
      if (json.vendors) setVendors(json.vendors);
    } catch (err) {
      console.error('Error loading coordinator data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, weddingSlug]);

  useEffect(() => {
    if (isDemo) {
      setVendors(DEMO_VENDORS as any);
      setPhoneConfigured(true);
      setCoordinatorPhone(DEMO_COORDINATOR_PHONE);
      setLoading(false);
      return;
    }
    if (isPro) loadData();
    else setLoading(false);
  }, [isPro, loadData, isDemo]);

  // Fetch coordinator phone info (Pro users only)
  useEffect(() => {
    if (!isPro || isDemo) return;
    const fetchCoordinatorInfo = async () => {
      try {
        const res = await fetch('/api/vendors/coordinator-info');
        if (!res.ok) return;
        const data = await res.json();
        setPhoneConfigured(data.isConfigured);
        setCoordinatorPhone(data.phoneNumber || '');
        setCoordinatorLink(data.whatsappLink || '');
      } catch (err) {
        console.error('Failed to fetch coordinator info:', err);
      }
    };
    fetchCoordinatorInfo();
  }, [isPro]);


  // Delete vendor
  const handleDeleteVendor = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vendors/${deleteConfirmId}`, { method: 'DELETE' });
      if (res.ok) {
        setVendors((prev) => prev.filter((v) => v.id !== deleteConfirmId));
        showStatus('saved', 'Vendor removed');
      } else {
        showStatus('error', 'Failed to delete vendor');
      }
    } catch {
      showStatus('error', 'Failed to delete vendor');
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  // Copy phone number
  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(coordinatorPhone);
      setPhoneCopied(true);
      showStatus('saved', 'Number copied');
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {
      showStatus('error', 'Failed to copy');
    }
  };

  // Import chat
  const handleImportChat = async () => {
    if (isViewOnly) return;
    if (!weddingId || !importFile || importGuardRef.current) return;
    importGuardRef.current = true;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('weddingId', weddingId);
      if (importVendorId) formData.append('vendorId', importVendorId);

      const res = await fetch('/api/vendors/import-chat', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        showStatus('saved', `Imported ${data.message_count} messages`);
        setImportDialogOpen(false);
        setImportFile(null);
        setImportVendorId('');
        await loadData();
      } else {
        const err = await res.json();
        console.error('Import failed:', err);
        showStatus('error', err.error || 'Import failed');
      }
    } catch (err) {
      console.error('Import chat error:', err);
      showStatus('error', 'Import failed');
    } finally {
      setImporting(false);
      importGuardRef.current = false;
    }
  };

  // Discover WhatsApp chats (step 1 — opens picker)
  const handleDiscoverGroups = async () => {
    if (isViewOnly) return;
    if (discoverGuardRef.current) return;
    discoverGuardRef.current = true;
    setDiscoveringGroups(true);
    setDiscoveredGroups([]);
    setDiscoveredDirectChats([]);
    setSelectedChatIds(new Set());
    setSyncDialogTab(0);
    setSyncDialogOpen(true);

    try {
      const res = await fetch('/api/vendors/sync-groups');
      const data = await res.json();
      if (res.ok) {
        setDiscoveredGroups(data.groups || []);
        setDiscoveredDirectChats(data.directChats || []);
      } else {
        console.error('Failed to discover chats:', data);
        showStatus('error', data.error || 'Failed to discover chats');
        setSyncDialogOpen(false);
      }
    } catch (err) {
      console.error('Discover chats error:', err);
      showStatus('error', 'Failed to discover chats');
      setSyncDialogOpen(false);
    } finally {
      setDiscoveringGroups(false);
      discoverGuardRef.current = false;
    }
  };

  // Sync selected chats (step 2 — imports messages)
  const handleSyncSelected = async () => {
    if (isViewOnly) return;
    if (!weddingId || selectedChatIds.size === 0) return;
    setSyncing(true);
    try {
      const groupIds = Array.from(selectedChatIds).filter(id => id.endsWith('@g.us'));
      const chatIds = Array.from(selectedChatIds).filter(id => id.endsWith('@s.whatsapp.net'));

      const res = await fetch('/api/vendors/sync-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId, groupIds, chatIds }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.errors?.length) {
          showStatus('error', data.message || `Sync issues: ${data.errors.map((e: any) => e.error).join('; ')}`);
        } else {
          showStatus('saved', data.message || 'Sync complete');
        }
        if (data.synced > 0) {
          await loadData();
          setSyncDialogOpen(false);
          setSyncing(false);
          return;
        }
      } else {
        showStatus('error', data.error || 'Sync failed');
      }
    } catch {
      showStatus('error', 'Sync failed');
    }
    setSyncing(false);
  };

  // Sync All — re-fetch all tracked conversations
  const handleSyncAll = async () => {
    if (isViewOnly) return;
    if (!weddingId || syncAllGuardRef.current) return;
    syncAllGuardRef.current = true;
    setSyncingAll(true);

    // Count tracked conversations for progress label
    const trackedCount = vendors.reduce(
      (n, v) => n + (v.vendor_conversations?.length || 0), 0
    );
    setSyncAllLabel(`Refreshing ${trackedCount} conversation${trackedCount !== 1 ? 's' : ''}...`);

    try {
      const res = await fetch('/api/vendors/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.errors?.length) {
          console.error('Sync-all partial errors:', data.errors);
          showStatus('error', `Sync finished with errors: ${data.errors.join('; ')}`);
        } else {
          showStatus('saved', data.message || 'Sync complete');
        }
        await loadData();
      } else {
        console.error('Sync-all failed:', data);
        showStatus('error', data.error || 'Sync failed');
      }
    } catch (err) {
      console.error('Sync-all error:', err);
      showStatus('error', 'Sync failed');
    } finally {
      setSyncingAll(false);
      setSyncAllLabel('');
      syncAllGuardRef.current = false;
    }
  };

  const toggleChatSelection = (chatId: string) => {
    setSelectedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId);
      else next.add(chatId);
      return next;
    });
  };

  // ─── STATE A: Basic user teaser ─────────────────────────────────────
  if (!isPro) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>

          {/* Header */}
          <PageHeading
            title="Vendor Management"
            subtitle="Track vendor conversations, get AI-powered insights, and manage all your wedding vendors in one place"
            actions={
              <PrimaryActionButton
                startIcon={<SupportAgent />}
                onClick={() => setUpgradeModalOpen(true)}
                sx={{ px: 3, py: 1.25, fontSize: '0.9rem' }}
              >
                Upgrade to Pro
              </PrimaryActionButton>
            }
          />

          {/* Description + bullet points */}
          <Box sx={{ maxWidth: 640 }}>
            <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.75, mb: 1.25 }}>
              Add your Phera Coordinator number to vendor WhatsApp group chats. Messages flow in
              automatically and Phera extracts key decisions, action items, and quotes. <strong>Your vendor management on autopilot.</strong>
            </Typography>
            <Stack spacing={0.6}>
              {([
                <><strong>Automatic message tracking</strong> from every vendor group chat</>,
                <><strong>AI-extracted action items</strong>, decisions, and price quotes</>,
                <><strong>Ask Phera anything</strong> across all your vendor conversations</>,
                <><strong>Import existing chats</strong> from WhatsApp exports (.txt files)</>,
                <><strong>At-a-glance dashboard</strong> with statuses, deadlines, and open items</>,
              ] as React.ReactNode[]).map((content, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: COLORS.brand.primary, lineHeight: 1.65, flexShrink: 0, fontWeight: 700 }}>•</Typography>
                  <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.65 }}>{content}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Blurred mock view */}
          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>

            {/* Mock UI */}
            <Box sx={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>

              {/* Stats row */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
                {mockStats.map((stat) => (
                  <StatCard key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} />
                ))}
              </Box>

              {/* Two-column: vendor list + Ask Phera */}
              <Box sx={{ display: 'flex', gap: 2.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

                {/* Vendor list */}
                <PheraCard variant="default" sx={{ flex: 1.4, overflow: 'hidden' }}>
                  <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${COLORS.border.faint}` }}>
                    <Typography variant="subtitle2" sx={{ color: COLORS.text.strong }}>Your Vendors</Typography>
                  </Box>
                  <Stack divider={<Divider />}>
                    {mockVendors.map((v) => (
                      <Box key={v.name} sx={{ px: 2.5, py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong }}>{v.name}</Typography>
                            <PheraChip label={v.category} size="small" tone="neutral" />
                          </Stack>
                          <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>{v.messages} messages</Typography>
                        </Box>
                        <PheraChip
                          label={v.status}
                          size="small"
                          tone={v.status === 'booked' ? 'success' : v.status === 'declined' ? 'neutral' : 'info'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </PheraCard>

                {/* Ask Phera mock */}
                <PheraCard variant="default" sx={{ flex: 1, alignSelf: 'flex-start' }}>
                  <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${COLORS.border.faint}` }}>
                    <Typography variant="subtitle2" sx={{ color: COLORS.text.strong }}>Ask Phera</Typography>
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 1.5 }}>
                      Ask a question across all your vendor conversations
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Box sx={{ flex: 1, height: 36, borderRadius: RADII.md, border: `1px solid ${COLORS.border.default}`, bgcolor: COLORS.bg.muted }} />
                      <Box sx={{ width: 36, height: 36, borderRadius: RADII.md, bgcolor: alpha(COLORS.brand.primary, 0.1) }} />
                    </Box>
                    <PheraCard variant="muted" sx={{ mt: 1.5, p: 2, bgcolor: alpha(COLORS.brand.primary, 0.03) }}>
                      <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
                        Based on your conversations, Priya Catering quoted ₹1,200 per plate for 300 guests. The venue confirmed availability for Dec 15.
                      </Typography>
                    </PheraCard>
                  </Box>
                </PheraCard>

              </Box>
            </Box>

            {/* Lock overlay */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                bgcolor: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(2px)',
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: COLORS.bg.white,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LockOutlined sx={{ fontSize: 26, color: COLORS.brand.primary }} />
              </Box>
              <PrimaryActionButton
                startIcon={<SupportAgent />}
                onClick={() => setUpgradeModalOpen(true)}
                sx={{
                  px: 3.5,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 20px rgba(222,63,94,0.35)',
                }}
              >
                Unlock Vendor Management
              </PrimaryActionButton>
            </Box>

          </Box>
        </Stack>

        <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </Box>
    );
  }

  // ─── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: COLORS.brand.primary }} />
      </Box>
    );
  }

  // ─── STATE B: Pro user, no vendors (onboarding) ─────────────────────
  if (vendors.length === 0 || forceOnboarding) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>

          <PageHeading
            title="Vendor Management"
            subtitle="Track vendor conversations, get AI-powered insights, and manage all your wedding vendors in one place"
          />

          {/* Getting Started card */}
          <PheraCard variant="default" sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: COLORS.text.strong }}>
              Get Started
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 3 }}>
              Three steps to start tracking your vendor conversations automatically.
            </Typography>

            <Stack spacing={3}>

              {/* Step 1: Save the Coordinator Number */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: COLORS.brand.primary,
                    color: COLORS.text.inverse,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  1
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: COLORS.text.strong, mb: 0.5 }}>
                    Save the Coordinator Number
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 1.5, lineHeight: 1.6 }}>
                    Save this number to your contacts so you can easily add it to vendor group chats.
                  </Typography>
                  {phoneConfigured ? (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                      <Tooltip
                        title="This is the WhatsApp number you add to your vendor group chats. Phera reads messages from this line and helps coordinate with vendors."
                        arrow
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1,
                            bgcolor: COLORS.bg.subtle,
                            borderRadius: 1,
                            border: '1px solid rgba(0,0,0,0.07)',
                            cursor: 'help',
                          }}
                        >
                          <PhoneAndroid sx={{ fontSize: 18, color: COLORS.text.subtle }} />
                          <Typography variant="subtitle2" sx={{ color: COLORS.text.strong, letterSpacing: 0.5 }}>
                            {coordinatorPhone}
                          </Typography>
                        </Paper>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={handleCopyPhone}
                        sx={{ color: phoneCopied ? COLORS.accent.success : COLORS.text.subtle }}
                      >
                        {phoneCopied ? <CheckCircleOutline fontSize="small" /> : <ContentCopy fontSize="small" />}
                      </IconButton>
                      <Button
                        size="small"
                        startIcon={<WhatsApp />}
                        href={coordinatorLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          textTransform: 'none',
                          borderRadius: RADII.md,
                          color: COLORS.accent.success,
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}
                      >
                        Open in WhatsApp
                      </Button>
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ color: COLORS.text.faint, fontStyle: 'italic' }}>
                      Coordinator number not yet configured
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider />

              {/* Step 2: Add to a Vendor Group Chat */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: COLORS.brand.primary,
                    color: COLORS.text.inverse,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  2
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: COLORS.text.strong, mb: 0.5 }}>
                    Add to Vendor Group Chats
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
                    Add the Coordinator number to each vendor group <strong style={{ color: COLORS.text.strong }}>before you start messaging</strong> so Phera captures everything from day one. Already chatting? Use Step 3 to import the history.
                  </Typography>
                  <Button
                    size="small"
                    startIcon={discoveringGroups ? <CircularProgress size={14} sx={{ color: COLORS.brand.primary }} /> : <Sync />}
                    onClick={handleDiscoverGroups}
                    disabled={!phoneConfigured || discoveringGroups}
                    sx={{
                      mt: 1.5,
                      textTransform: 'none',
                      borderRadius: RADII.md,
                      color: COLORS.brand.primary,
                      border: '1px solid',
                      borderColor: alpha(COLORS.brand.primary, 0.3),
                      fontSize: '0.8rem',
                      '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.04) },
                    }}
                  >
                    {discoveringGroups ? 'Discovering...' : 'Connect WhatsApp Chats'}
                  </Button>
                </Box>
              </Box>

              <Divider />

              {/* Step 3: Or Import Existing Chats */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: COLORS.brand.primary,
                    color: COLORS.text.inverse,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  3
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: COLORS.text.strong, mb: 0.5 }}>
                    Or Import Existing Chats
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 1.5, lineHeight: 1.6 }}>
                    Already have vendor conversations going? Import a WhatsApp chat export or add a vendor manually.
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      startIcon={<Upload />}
                      onClick={() => setImportDialogOpen(true)}
                      sx={{
                        textTransform: 'none',
                        borderRadius: RADII.md,
                        color: COLORS.text.strong,
                        border: '1px solid rgba(0,0,0,0.15)',
                        fontSize: '0.8rem',
                      }}
                    >
                      Upload Chat Manually
                    </Button>
                  </Stack>
                </Box>
              </Box>

            </Stack>
          </PheraCard>

        </Stack>

        {/* Super admin toggle */}
        {isSuperAdmin && forceOnboarding && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, px: 1 }}>
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.text.subtle }}>
                Test Mode
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: COLORS.text.faint }}>
                Force onboarding view
              </Typography>
            </Box>
            <PheraSwitch
              checked={forceOnboarding}
              onChange={() => setForceOnboarding((p) => !p)}
              size="small"
            />
          </Box>
        )}

        {/* Dialogs */}
        {renderImportChatDialog()}
        {renderSyncDialog()}
      </Box>
    );
  }

  // ─── STATE C: Pro user, has vendors (dashboard) ─────────────────────
  return (
    <Box sx={{ display: 'flex', gap: 0, mt: { md: 'calc(-56px - 32px)' }, mr: { md: -4 }, mb: { md: -4 } }}>
      {/* Main content — Ask Phera panel is now a floating overlay, no layout reservation needed */}
      <Box sx={{ flex: 1, minWidth: 0, pt: { md: 'calc(56px + 32px)' } }}>
        <Box>

          <Stack spacing={3}>

            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
                  Coordinator
                </Typography>
                {phoneConfigured && (
                  <>
                    <Tooltip
                      title="This is the WhatsApp number you add to your vendor group chats. Phera reads messages from this line and helps coordinate with vendors."
                      arrow
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 2,
                          py: 0.75,
                          bgcolor: COLORS.bg.subtle,
                          borderRadius: 1,
                          border: '1px solid rgba(0,0,0,0.07)',
                          cursor: 'help',
                        }}
                      >
                        <PhoneAndroid sx={{ fontSize: 18, color: COLORS.text.subtle }} />
                        <Typography variant="subtitle2" sx={{ color: COLORS.text.strong, letterSpacing: 0.5 }}>
                          {coordinatorPhone}
                        </Typography>
                      </Paper>
                    </Tooltip>
                    <Tooltip title={isDemo ? DEMO_COORDINATOR_TOOLTIP : (phoneCopied ? 'Copied!' : 'Copy coordinator number')} arrow>
                      <IconButton
                        size="small"
                        onClick={isDemo ? undefined : handleCopyPhone}
                        sx={{ color: phoneCopied ? COLORS.accent.success : COLORS.text.subtle }}
                      >
                        {phoneCopied ? <CheckCircleOutline fontSize="small" /> : <ContentCopy fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                {isDemo ? (
                  <>
                    <Tooltip title={DEMO_BUTTON_TOOLTIPS.connectChat}>
                      <span>
                        <Button size="small" startIcon={<Sync />} disabled sx={{ textTransform: 'none', borderRadius: RADII.md, color: COLORS.text.strong }}>
                          Connect new Chat
                        </Button>
                      </span>
                    </Tooltip>
                    <Tooltip title={DEMO_BUTTON_TOOLTIPS.uploadChat}>
                      <span>
                        <Button size="small" startIcon={<Upload />} disabled sx={{ textTransform: 'none', borderRadius: RADII.md, color: COLORS.text.strong }}>
                          Upload Chat Manually
                        </Button>
                      </span>
                    </Tooltip>
                    <Tooltip title={DEMO_BUTTON_TOOLTIPS.refreshAll}>
                      <span>
                        <Button size="small" startIcon={<CloudSync />} disabled sx={{ textTransform: 'none', borderRadius: RADII.md, color: COLORS.text.strong }}>
                          Refresh all Chats
                        </Button>
                      </span>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <Button
                      size="small"
                      startIcon={discoveringGroups ? <CircularProgress size={14} /> : <Sync />}
                      onClick={handleDiscoverGroups}
                      disabled={discoveringGroups}
                      sx={{ textTransform: 'none', borderRadius: RADII.md, color: COLORS.text.strong }}
                    >
                      {discoveringGroups ? 'Discovering...' : 'Connect new Chat'}
                    </Button>
                    <Button
                      size="small"
                      startIcon={importing ? <CircularProgress size={14} /> : <Upload />}
                      onClick={() => setImportDialogOpen(true)}
                      disabled={importing}
                      sx={{ textTransform: 'none', borderRadius: RADII.md, color: COLORS.text.strong }}
                    >
                      Upload Chat Manually
                    </Button>
                    <Button
                      size="small"
                      startIcon={syncingAll ? <CircularProgress size={14} /> : <CloudSync />}
                      onClick={handleSyncAll}
                      disabled={syncingAll}
                      sx={{ textTransform: 'none', borderRadius: RADII.md, color: COLORS.text.strong }}
                    >
                      {syncingAll && syncAllLabel ? syncAllLabel : 'Refresh all Chats'}
                    </Button>
                  </>
                )}
              </Stack>
            </Box>

            {/* Collapsible instructions — stays visible after vendors exist */}
            <HowToAddChatsPanel coordinatorPhone={coordinatorPhone} />

            {/* Conversation Tile Grid */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              {vendors.map((vendor) => {
                const summary = vendor.vendor_insights?.find(i => i.insight_type === 'summary');
                const actionItems = vendor.vendor_insights?.filter(
                  (i) => i.insight_type === 'action_item' && !i.is_completed
                ) || [];
                const totalMessages = vendor.vendor_conversations?.reduce((s, c) => s + (c.message_count || 0), 0) || 0;

                return (
                  <PheraCard
                    key={vendor.id}
                    variant="default"
                    onClick={() =>
                      router.push(`/admin/${weddingSlug}/coordinator/${vendor.id}`)
                    }
                    sx={{
                      p: 2.5,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      width: { xs: '100%', sm: 'calc(50% - 6px)', md: 'calc(33.333% - 8px)' },
                      minHeight: 260,
                      minWidth: 0,
                      '&:hover': {
                        borderColor: alpha(COLORS.brand.primary, 0.3),
                        bgcolor: alpha(COLORS.brand.primary, 0.02),
                      },
                    }}
                  >
                    {/* Top: Vendor name + delete */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: COLORS.text.strong, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {vendor.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); if (!isDemo) setDeleteConfirmId(vendor.id); }}
                          sx={{ ml: 0.5, color: COLORS.text.subtle, p: 0.5, '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.08), color: COLORS.brand.primary } }}
                        >
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>

                      {/* Summary snippet */}
                      <Typography
                        sx={{
                          fontSize: '0.5rem',
                          color: COLORS.text.subtle,
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 5,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {summary?.content || 'No summary yet'}
                      </Typography>
                    </Box>

                    {/* Bottom: badges row */}
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 2 }}>
                      <Chip
                        label={`${totalMessages} msgs`}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 22, borderRadius: '6px', bgcolor: alpha(COLORS.text.strong, 0.06), color: COLORS.text.muted }}
                      />
                      {vendor.category && (
                        <Chip
                          label={vendor.category}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 22, borderRadius: '6px', bgcolor: alpha(COLORS.text.strong, 0.06), color: COLORS.text.muted }}
                        />
                      )}
                      <Chip
                        label={vendor.status}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          height: 22,
                          borderRadius: '6px',
                          textTransform: 'capitalize',
                          bgcolor: alpha(COLORS.text.strong, 0.06),
                          color: COLORS.text.muted,
                        }}
                      />
                      {actionItems.length > 0 && (
                        <Chip
                          icon={<Assignment sx={{ fontSize: '0.7rem !important' }} />}
                          label={`${actionItems.length} action`}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            height: 22,
                            borderRadius: '6px',
                            bgcolor: alpha(COLORS.text.strong, 0.06),
                            color: COLORS.text.muted,
                            '& .MuiChip-icon': { color: COLORS.text.muted },
                          }}
                        />
                      )}
                    </Stack>
                  </PheraCard>
                );
              })}
            </Box>

          </Stack>

          {/* Super admin toggle */}
          {isSuperAdmin && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, px: 1 }}>
              <Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.text.subtle }}>
                  Test Mode
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: COLORS.text.faint }}>
                  Force onboarding view
                </Typography>
              </Box>
              <PheraSwitch
                checked={forceOnboarding}
                onChange={() => setForceOnboarding((p) => !p)}
                size="small"
              />
            </Box>
          )}

          {/* Dialogs */}
          {renderImportChatDialog()}
          {renderSyncDialog()}

          {/* Delete confirmation */}
          <PheraDialog
            open={!!deleteConfirmId}
            onClose={() => !deleting && setDeleteConfirmId(null)}
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
                onClick={() => setDeleteConfirmId(null)}
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
      </Box>

      {/* Ask Phera Panel */}
      {weddingId && (
        <AskPheraPanel
          weddingId={weddingId}
          open={askPheraOpen}
          onClose={() => setAskPheraOpen(false)}
          disabled={isDemo}
        />
      )}

      {/* Ask Phera FAB */}
      {weddingId && (
        <AskPheraFab
          onClick={() => setAskPheraOpen(true)}
          visible={!askPheraOpen}
        />
      )}
    </Box>
  );

  // ─── Shared dialog renderers ────────────────────────────────────────

  function renderImportChatDialog() {
    return (
      <PheraDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <PheraDialogTitle onClose={() => setImportDialogOpen(false)}>
          Import WhatsApp Chat
        </PheraDialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 2 }}>
            Export a WhatsApp chat as .txt (without media) and upload it here. Only this file&apos;s messages are imported — add the Coordinator to the group to keep tracking new ones.
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload />}
              sx={{ textTransform: 'none', color: COLORS.text.strong, borderColor: 'rgba(0,0,0,0.23)', borderRadius: 1 }}
            >
              {importFile ? importFile.name : 'Choose .txt file'}
              <input
                type="file"
                hidden
                accept=".txt"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </Button>
            {vendors.length > 0 && (
              <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' }, '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.4)' } }, '& .MuiInputLabel-root': { color: COLORS.text.subtle, '&.Mui-focused': { color: COLORS.brand.primary } } }}>
                <InputLabel>Link to vendor (optional)</InputLabel>
                <Select
                  value={importVendorId}
                  label="Link to vendor (optional)"
                  onChange={(e) => setImportVendorId(e.target.value)}
                  sx={{ color: COLORS.text.strong }}
                >
                  <MenuItem value="">None — auto-detect</MenuItem>
                  {vendors.map((v) => (
                    <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setImportDialogOpen(false)} sx={{ color: COLORS.text.strong }}>Cancel</Button>
          <PrimaryActionButton
            onClick={handleImportChat}
            loading={importing}
            disabled={!importFile}
          >
            Import
          </PrimaryActionButton>
        </DialogActions>
      </PheraDialog>
    );
  }

  function renderSyncDialog() {
    const currentTabChats = syncDialogTab === 0 ? discoveredGroups : discoveredDirectChats;
    const currentTabLoading = discoveringGroups;
    const currentTabChatIds = currentTabChats.map(c => c.id);

    return (
      <PheraDialog
        open={syncDialogOpen}
        onClose={() => !syncing && setSyncDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <PheraDialogTitle onClose={syncing ? undefined : () => setSyncDialogOpen(false)}>
          Connect WhatsApp Chat
        </PheraDialogTitle>
        <DialogContent sx={{ px: 0 }}>
          {discoveringGroups ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress sx={{ color: COLORS.brand.primary }} size={32} />
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                Discovering your WhatsApp chats...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: COLORS.text.muted, mb: 1.5, px: 3 }}>
                Select the chats you want to connect. Only messages from now on will be tracked — upload a WhatsApp export to pull in older history.
              </Typography>

              <Tabs
                value={syncDialogTab}
                onChange={(_, v) => setSyncDialogTab(v)}
                sx={{
                  px: 3,
                  mb: 1.5,
                  minHeight: 36,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    minHeight: 36,
                    color: COLORS.text.subtle,
                    '&.Mui-selected': { color: COLORS.brand.primary },
                  },
                  '& .MuiTabs-indicator': { backgroundColor: COLORS.brand.primary },
                }}
              >
                <Tab label={`Group Chats (${discoveredGroups.length})`} />
                <Tab label={`Direct Chats (${discoveredDirectChats.length})`} />
              </Tabs>

              <Box sx={{ px: 3 }}>
                {currentTabLoading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, gap: 1.5 }}>
                    <CircularProgress sx={{ color: COLORS.brand.primary }} size={24} />
                    <Typography variant="body2" sx={{ color: COLORS.text.subtle, fontSize: '0.8rem' }}>
                      {syncDialogTab === 0 ? 'Loading group chats...' : 'Loading direct chats...'}
                    </Typography>
                  </Box>
                ) : currentTabChats.length === 0 ? (
                  <Typography variant="body2" sx={{ color: COLORS.text.subtle, py: 2 }}>
                    {syncDialogTab === 0
                      ? 'No group chats found. Make sure the Coordinator number has been added to at least one WhatsApp group.'
                      : 'No direct chats found.'}
                  </Typography>
                ) : (
                  <>
                    <Stack spacing={0.5}>
                      {currentTabChats.map((chat) => (
                        <ChatPickerItem
                          key={chat.id}
                          chat={chat}
                          selected={selectedChatIds.has(chat.id)}
                          disabled={syncing}
                          onToggle={() => toggleChatSelection(chat.id)}
                        />
                      ))}
                    </Stack>

                    {currentTabChats.length > 2 && (
                      <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() => setSelectedChatIds(prev => {
                            const next = new Set(prev);
                            currentTabChatIds.forEach(id => next.add(id));
                            return next;
                          })}
                          disabled={syncing}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', color: COLORS.text.subtle }}
                        >
                          Select all
                        </Button>
                        <Button
                          size="small"
                          onClick={() => setSelectedChatIds(prev => {
                            const next = new Set(prev);
                            currentTabChatIds.forEach(id => next.delete(id));
                            return next;
                          })}
                          disabled={syncing}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', color: COLORS.text.subtle }}
                        >
                          Clear
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setSyncDialogOpen(false)}
            disabled={syncing}
            sx={{ color: COLORS.text.strong }}
          >
            Cancel
          </Button>
          <PrimaryActionButton
            onClick={handleSyncSelected}
            loading={syncing}
            disabled={selectedChatIds.size === 0}
            startIcon={<Sync />}
          >
            Connect {selectedChatIds.size} chat{selectedChatIds.size !== 1 ? 's' : ''}
          </PrimaryActionButton>
        </DialogActions>
      </PheraDialog>
    );
  }
}

// Chat picker item used in sync dialog
function ChatPickerItem({
  chat,
  selected,
  disabled,
  onToggle,
}: {
  chat: { id: string; name: string; participantCount: number };
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Paper
      elevation={0}
      onClick={() => !disabled && onToggle()}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: selected ? alpha(COLORS.brand.primary, 0.4) : 'rgba(0,0,0,0.07)',
        bgcolor: selected ? alpha(COLORS.brand.primary, 0.03) : COLORS.bg.white,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s',
        '&:hover': disabled ? {} : { borderColor: alpha(COLORS.brand.primary, 0.3) },
      }}
    >
      <Checkbox
        checked={selected}
        disabled={disabled}
        size="small"
        sx={{
          color: COLORS.border.default,
          '&.Mui-checked': { color: COLORS.brand.primary },
          p: 0.5,
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: COLORS.text.strong,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {chat.name}
        </Typography>
        {chat.participantCount > 0 && (
          <Typography variant="caption" sx={{ color: COLORS.text.subtle }}>
            {chat.participantCount} participants
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

/**
 * Persistent, collapsible "How to add vendor chats" panel. Rendered above
 * the vendor grid so admins can always re-read the add-the-number flow
 * without hunting through onboarding.
 */
function HowToAddChatsPanel({ coordinatorPhone }: { coordinatorPhone: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,0.07)',
        bgcolor: '#FFFBF6',
        overflow: 'hidden',
      }}
    >
      <Box
        onClick={() => setOpen((p) => !p)}
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          '&:hover': { bgcolor: '#FFF6EB' },
        }}
      >
        <InfoOutlined sx={{ fontSize: 18, color: '#B35D00' }} />
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.text.strong, flex: 1 }}>
          How to add a new vendor chat
        </Typography>
        {open ? <ExpandLess sx={{ fontSize: 20, color: COLORS.text.subtle }} /> : <ExpandMore sx={{ fontSize: 20, color: COLORS.text.subtle }} />}
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2.5, pb: 2, pt: 0.5 }}>
          <Stack spacing={1} sx={{ color: COLORS.text.muted, fontSize: '0.85rem', lineHeight: 1.6 }}>
            <Typography sx={{ fontSize: '0.85rem' }}>
              <strong>1.</strong> Open WhatsApp on your phone, pick a vendor group chat, tap the group name, and add
              <strong> {coordinatorPhone || '+66 98 048 2140'} </strong>
              as a participant (saved as &quot;Phera&quot; in your contacts makes it obvious).
            </Typography>
            <Typography sx={{ fontSize: '0.85rem' }}>
              <strong>2.</strong> Repeat for every vendor you want Phera to track — caterer, florist, photographer, etc.
            </Typography>
            <Typography sx={{ fontSize: '0.85rem' }}>
              <strong>3.</strong> Click <strong>Connect new Chat</strong> above. Phera will list every group it&apos;s
              a member of — pick the ones that belong to this wedding and confirm.
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', mt: 1, color: COLORS.text.subtle }}>
              Phera can only see messages sent <em>after</em> it joined a group. To pull older history, open that
              vendor and use the <strong>Upload older messages</strong> button with a WhatsApp chat export (
              Chat → ⋯ → Export chat → Without Media).
            </Typography>
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}
