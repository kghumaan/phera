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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Checkbox,
  Switch,
  Tooltip,
  Tabs,
  Tab,
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
  Close,
  WhatsApp,
  Sync,
  CloudSync,
} from '@mui/icons-material';
import { usePlan } from '@/lib/contexts/PlanContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import UpgradeModal from '@/components/admin/UpgradeModal';
import AskPheraPanel from '@/components/admin/coordinator/AskPheraPanel';
import AskPheraFab from '@/components/admin/coordinator/AskPheraFab';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';

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
  active: '#2196F3',
  booked: '#4CAF50',
  declined: '#9E9E9E',
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

  // Testing toggle
  const isSuperAdmin = user?.email === 'kv.s.ghumaan@gmail.com' || user?.email === 'savani.simran@google.com' || user?.email === 'demo@phera.io';
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
    if (isPro) loadData();
    else setLoading(false);
  }, [isPro, loadData]);

  // Fetch coordinator phone info (Pro users only)
  useEffect(() => {
    if (!isPro) return;
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

  // Copy phone number
  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(coordinatorPhone);
      setPhoneCopied(true);
      toast.success('Number copied');
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
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
        toast.success(`Imported ${data.message_count} messages`);
        setImportDialogOpen(false);
        setImportFile(null);
        setImportVendorId('');
        await loadData();
      } else {
        const err = await res.json();
        console.error('Import failed:', err);
        toast.error(err.error || 'Import failed');
      }
    } catch (err) {
      console.error('Import chat error:', err);
      toast.error('Import failed');
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
        toast.error(data.error || 'Failed to discover chats');
        setSyncDialogOpen(false);
      }
    } catch (err) {
      console.error('Discover chats error:', err);
      toast.error('Failed to discover chats');
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
          toast.error(data.message || `Sync issues: ${data.errors.map((e: any) => e.error).join('; ')}`);
        } else {
          toast.success(data.message || 'Sync complete');
        }
        if (data.synced > 0) {
          await loadData();
          setSyncDialogOpen(false);
          setSyncing(false);
          return;
        }
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch {
      toast.error('Sync failed');
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
          toast.error(`Sync finished with errors: ${data.errors.join('; ')}`);
        } else {
          toast.success(data.message || 'Sync complete');
        }
        await loadData();
      } else {
        console.error('Sync-all failed:', data);
        toast.error(data.error || 'Sync failed');
      }
    } catch (err) {
      console.error('Sync-all error:', err);
      toast.error('Sync failed');
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
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Coordinator
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Track vendor conversations, get AI-powered insights, and keep everything organized
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<SupportAgent />}
              onClick={() => setUpgradeModalOpen(true)}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                px: 3,
                py: 1.25,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                flexShrink: 0,
                '&:hover': { bgcolor: '#c73552' },
              }}
            >
              Upgrade to Pro
            </Button>
          </Box>

          {/* Description + bullet points */}
          <Box sx={{ maxWidth: 640 }}>
            <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.75, mb: 1.25 }}>
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
                  <Typography variant="body2" sx={{ color: '#DE3F5E', lineHeight: 1.65, flexShrink: 0, fontWeight: 700 }}>•</Typography>
                  <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.65 }}>{content}</Typography>
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
                  <Paper key={stat.label} elevation={0} sx={{ flex: 1, minWidth: 120, p: 2.5, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', bgcolor: 'white' }}>
                    <Box sx={{ color: '#DE3F5E', mb: 0.5 }}>{stat.icon}</Box>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>{stat.value}</Typography>
                    <Typography variant="body2" sx={{ color: '#6a6a6a', mt: 0.5 }}>{stat.label}</Typography>
                  </Paper>
                ))}
              </Box>

              {/* Two-column: vendor list + Ask Phera */}
              <Box sx={{ display: 'flex', gap: 2.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

                {/* Vendor list */}
                <Paper elevation={0} sx={{ flex: 1.4, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden', bgcolor: 'white' }}>
                  <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a' }}>Your Vendors</Typography>
                  </Box>
                  <Stack divider={<Divider />}>
                    {mockVendors.map((v) => (
                      <Box key={v.name} sx={{ px: 2.5, py: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a1a' }}>{v.name}</Typography>
                            <Chip label={v.category} size="small" sx={{ fontSize: '0.7rem', height: 20, borderRadius: '4px' }} />
                          </Stack>
                          <Typography sx={{ fontSize: '0.75rem', color: '#6a6a6a' }}>{v.messages} messages</Typography>
                        </Box>
                        <Chip
                          label={v.status}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            height: 20,
                            borderRadius: '4px',
                            bgcolor: alpha(STATUS_COLORS[v.status] || '#9E9E9E', 0.1),
                            color: STATUS_COLORS[v.status] || '#9E9E9E',
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Paper>

                {/* Ask Phera mock */}
                <Paper elevation={0} sx={{ flex: 1, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', bgcolor: 'white', alignSelf: 'flex-start' }}>
                  <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a' }}>Ask Phera</Typography>
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#6a6a6a', mb: 1.5 }}>
                      Ask a question across all your vendor conversations
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Box sx={{ flex: 1, height: 36, borderRadius: 1, border: '1px solid rgba(0,0,0,0.15)', bgcolor: '#fafafa' }} />
                      <Box sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: alpha('#DE3F5E', 0.1) }} />
                    </Box>
                    <Paper elevation={0} sx={{ mt: 1.5, p: 2, bgcolor: alpha('#DE3F5E', 0.03), borderRadius: 1 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: '#4a4a4a', lineHeight: 1.6 }}>
                        Based on your conversations, Priya Catering quoted ₹1,200 per plate for 300 guests. The venue confirmed availability for Dec 15.
                      </Typography>
                    </Paper>
                  </Box>
                </Paper>

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
                  bgcolor: 'white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LockOutlined sx={{ fontSize: 26, color: '#DE3F5E' }} />
              </Box>
              <Button
                variant="contained"
                startIcon={<SupportAgent />}
                onClick={() => setUpgradeModalOpen(true)}
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  px: 3.5,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 20px rgba(222,63,94,0.35)',
                  '&:hover': { bgcolor: '#c73552' },
                }}
              >
                Unlock Coordinator
              </Button>
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
        <CircularProgress sx={{ color: '#DE3F5E' }} />
      </Box>
    );
  }

  // ─── STATE B: Pro user, no vendors (onboarding) ─────────────────────
  if (vendors.length === 0 || forceOnboarding) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Coordinator
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Track vendor conversations and get AI-powered insights
              </Typography>
            </Box>
          </Box>

          {/* Getting Started card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 1,
              border: '1px solid rgba(0,0,0,0.07)',
              bgcolor: 'white',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: '#1a1a1a' }}>
              Get Started
            </Typography>
            <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 3 }}>
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
                    bgcolor: '#DE3F5E',
                    color: 'white',
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                    Save the Coordinator Number
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4a4a4a', mb: 1.5, lineHeight: 1.6 }}>
                    Save this number to your contacts so you can easily add it to vendor group chats.
                  </Typography>
                  {phoneConfigured ? (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                      <Paper
                        elevation={0}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 2,
                          py: 1,
                          bgcolor: '#F8F8F8',
                          borderRadius: 1,
                          border: '1px solid rgba(0,0,0,0.07)',
                        }}
                      >
                        <PhoneAndroid sx={{ fontSize: 18, color: '#6a6a6a' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a', letterSpacing: 0.5 }}>
                          {coordinatorPhone}
                        </Typography>
                      </Paper>
                      <IconButton
                        size="small"
                        onClick={handleCopyPhone}
                        sx={{ color: phoneCopied ? '#4CAF50' : '#6a6a6a' }}
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
                          borderRadius: '12px',
                          color: '#25D366',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}
                      >
                        Open in WhatsApp
                      </Button>
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#9a9a9a', fontStyle: 'italic' }}>
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
                    bgcolor: '#DE3F5E',
                    color: 'white',
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                    Add to a Vendor Group Chat
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.6 }}>
                    Open any vendor WhatsApp group chat, tap the group name at the top, select <strong>Add Participant</strong>, and add the Coordinator number. Phera will automatically start tracking messages and extracting insights.
                  </Typography>
                  <Button
                    size="small"
                    startIcon={discoveringGroups ? <CircularProgress size={14} sx={{ color: '#DE3F5E' }} /> : <Sync />}
                    onClick={handleDiscoverGroups}
                    disabled={!phoneConfigured || discoveringGroups}
                    sx={{
                      mt: 1.5,
                      textTransform: 'none',
                      borderRadius: '12px',
                      color: '#DE3F5E',
                      border: '1px solid',
                      borderColor: alpha('#DE3F5E', 0.3),
                      fontSize: '0.8rem',
                      '&:hover': { bgcolor: alpha('#DE3F5E', 0.04) },
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
                    bgcolor: '#DE3F5E',
                    color: 'white',
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                    Or Import Existing Chats
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4a4a4a', mb: 1.5, lineHeight: 1.6 }}>
                    Already have vendor conversations going? Import a WhatsApp chat export or add a vendor manually.
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      startIcon={<Upload />}
                      onClick={() => setImportDialogOpen(true)}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '12px',
                        color: '#1a1a1a',
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
          </Paper>

        </Stack>

        {/* Super admin toggle */}
        {isSuperAdmin && forceOnboarding && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, px: 1 }}>
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>
                Test Mode
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
                Force onboarding view
              </Typography>
            </Box>
            <Switch
              checked={forceOnboarding}
              onChange={() => setForceOnboarding((p) => !p)}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#DE3F5E' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#DE3F5E' },
              }}
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
    <Box sx={{ display: 'flex', gap: 0 }}>
      {/* Main content — shrinks when panel is open */}
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: askPheraOpen ? 'calc(100% - 380px)' : '100%', transition: 'max-width 0.2s' }}>
        <Box sx={{ maxWidth: 1000, pr: askPheraOpen ? 3 : 0 }}>
          <Stack spacing={3}>

            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  Coordinator
                </Typography>
                {phoneConfigured && (
                  <Tooltip title="Add this number to vendor conversations. Click to copy.">
                    <Chip
                      icon={<PhoneAndroid sx={{ fontSize: '14px !important' }} />}
                      label={coordinatorPhone}
                      size="small"
                      onClick={handleCopyPhone}
                      sx={{
                        bgcolor: alpha('#DE3F5E', 0.08),
                        color: '#DE3F5E',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        '& .MuiChip-icon': { color: '#DE3F5E' },
                        '&:hover': { bgcolor: alpha('#DE3F5E', 0.14) },
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={syncingAll ? <CircularProgress size={14} /> : <CloudSync />}
                  onClick={handleSyncAll}
                  disabled={syncingAll}
                  sx={{ textTransform: 'none', borderRadius: '12px', color: '#6a6a6a' }}
                >
                  {syncingAll && syncAllLabel ? syncAllLabel : 'Refresh all Chats'}
                </Button>
                <Button
                  size="small"
                  startIcon={discoveringGroups ? <CircularProgress size={14} /> : <Sync />}
                  onClick={handleDiscoverGroups}
                  disabled={discoveringGroups}
                  sx={{ textTransform: 'none', borderRadius: '12px', color: '#6a6a6a' }}
                >
                  {discoveringGroups ? 'Discovering...' : 'Connect new Chat'}
                </Button>
                <Button
                  size="small"
                  startIcon={importing ? <CircularProgress size={14} /> : <Upload />}
                  onClick={() => setImportDialogOpen(true)}
                  disabled={importing}
                  sx={{ textTransform: 'none', borderRadius: '12px', color: '#1a1a1a' }}
                >
                  Upload Chat Manually
                </Button>
              </Stack>
            </Box>

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
                  <Paper
                    key={vendor.id}
                    elevation={0}
                    onClick={() =>
                      router.push(`/admin/${weddingSlug}/coordinator/${vendor.id}`)
                    }
                    sx={{
                      p: 1.75,
                      cursor: 'pointer',
                      borderRadius: 1,
                      border: '1px solid rgba(0,0,0,0.07)',
                      bgcolor: 'white',
                      transition: 'all 0.15s',
                      display: 'flex',
                      flexDirection: 'column',
                      width: { xs: '100%', sm: 'calc(50% - 6px)', md: 'calc(33.333% - 8px)' },
                      minWidth: 0,
                      '&:hover': {
                        borderColor: alpha('#DE3F5E', 0.3),
                        bgcolor: alpha('#DE3F5E', 0.02),
                      },
                    }}
                  >
                    {/* Vendor name + category */}
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.75 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#1a1a1a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {vendor.name}
                      </Typography>
                      {vendor.category && (
                        <Chip
                          label={vendor.category}
                          size="small"
                          sx={{ color: '#4a4a4a', bgcolor: alpha('#000', 0.06), fontSize: '0.6rem', height: 16, borderRadius: '4px' }}
                        />
                      )}
                    </Stack>

                    {/* Summary snippet */}
                    <Typography
                      sx={{
                        fontSize: '0.72rem',
                        color: '#6a6a6a',
                        lineHeight: 1.45,
                        mb: 1.25,
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {summary?.content || 'No summary yet'}
                    </Typography>

                    {/* Footer: message count + status + action items */}
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>
                        {totalMessages} msgs
                      </Typography>
                      <Chip
                        label={vendor.status}
                        size="small"
                        sx={{
                          fontSize: '0.6rem',
                          height: 16,
                          borderRadius: '4px',
                          bgcolor: alpha(STATUS_COLORS[vendor.status] || '#9E9E9E', 0.1),
                          color: STATUS_COLORS[vendor.status] || '#9E9E9E',
                        }}
                      />
                      {actionItems.length > 0 && (
                        <Chip
                          icon={<Assignment sx={{ fontSize: '0.65rem !important' }} />}
                          label={actionItems.length}
                          size="small"
                          sx={{
                            fontSize: '0.6rem',
                            height: 16,
                            borderRadius: '4px',
                            bgcolor: alpha('#FF9800', 0.1),
                            color: '#E65100',
                            '& .MuiChip-icon': { color: '#E65100' },
                          }}
                        />
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Box>

          </Stack>

          {/* Super admin toggle */}
          {isSuperAdmin && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, px: 1 }}>
              <Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>
                  Test Mode
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
                  Force onboarding view
                </Typography>
              </Box>
              <Switch
                checked={forceOnboarding}
                onChange={() => setForceOnboarding((p) => !p)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#DE3F5E' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#DE3F5E' },
                }}
              />
            </Box>
          )}

          {/* Dialogs */}
          {renderImportChatDialog()}
          {renderSyncDialog()}
        </Box>
      </Box>

      {/* Ask Phera Panel */}
      {weddingId && (
        <AskPheraPanel
          weddingId={weddingId}
          open={askPheraOpen}
          onClose={() => setAskPheraOpen(false)}
        />
      )}

      {/* Ask Phera FAB — shown when panel is closed */}
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
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#ffffff', color: '#1a1a1a', borderRadius: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1a1a1a' }}>Import WhatsApp Chat</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#4a4a4a', mb: 2 }}>
            Export a WhatsApp chat as .txt (without media) and upload it here.
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload />}
              sx={{ textTransform: 'none', color: '#1a1a1a', borderColor: 'rgba(0,0,0,0.23)', borderRadius: 1 }}
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
              <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' } }, '& .MuiInputLabel-root': { color: '#6a6a6a' } }}>
                <InputLabel>Link to vendor (optional)</InputLabel>
                <Select
                  value={importVendorId}
                  label="Link to vendor (optional)"
                  onChange={(e) => setImportVendorId(e.target.value)}
                  sx={{ color: '#1a1a1a' }}
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
          <Button onClick={() => setImportDialogOpen(false)} sx={{ color: '#1a1a1a' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleImportChat}
            disabled={importing || !importFile}
            sx={{ bgcolor: '#DE3F5E', '&:hover': { bgcolor: '#C8365A' } }}
          >
            {importing ? <CircularProgress size={20} /> : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  function renderSyncDialog() {
    const currentTabChats = syncDialogTab === 0 ? discoveredGroups : discoveredDirectChats;
    const currentTabLoading = discoveringGroups;
    const currentTabChatIds = currentTabChats.map(c => c.id);

    return (
      <Dialog
        open={syncDialogOpen}
        onClose={() => !syncing && setSyncDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#ffffff', color: '#1a1a1a', borderRadius: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1a1a1a', pb: 0 }}>
          Connect WhatsApp Chat
        </DialogTitle>
        <DialogContent sx={{ px: 0 }}>
          {discoveringGroups ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress sx={{ color: '#DE3F5E' }} size={32} />
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Discovering your WhatsApp chats...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: '#4a4a4a', mb: 1.5, px: 3 }}>
                Select the chats you want to import. We&apos;ll pull in message history and run AI analysis.
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
                    color: '#6a6a6a',
                    '&.Mui-selected': { color: '#DE3F5E' },
                  },
                  '& .MuiTabs-indicator': { backgroundColor: '#DE3F5E' },
                }}
              >
                <Tab label={`Group Chats (${discoveredGroups.length})`} />
                <Tab label={`Direct Chats (${discoveredDirectChats.length})`} />
              </Tabs>

              <Box sx={{ px: 3 }}>
                {currentTabLoading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, gap: 1.5 }}>
                    <CircularProgress sx={{ color: '#DE3F5E' }} size={24} />
                    <Typography variant="body2" sx={{ color: '#6a6a6a', fontSize: '0.8rem' }}>
                      {syncDialogTab === 0 ? 'Loading group chats...' : 'Loading direct chats...'}
                    </Typography>
                  </Box>
                ) : currentTabChats.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#6a6a6a', py: 2 }}>
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
                          sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#6a6a6a' }}
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
                          sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#6a6a6a' }}
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
            sx={{ color: '#1a1a1a' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSyncSelected}
            disabled={syncing || selectedChatIds.size === 0}
            startIcon={syncing ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Sync />}
            sx={{ bgcolor: '#DE3F5E', '&:hover': { bgcolor: '#C8365A' }, textTransform: 'none', borderRadius: '12px' }}
          >
            {syncing
              ? `Connecting ${selectedChatIds.size} chat${selectedChatIds.size !== 1 ? 's' : ''}...`
              : `Connect ${selectedChatIds.size} chat${selectedChatIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>
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
        borderColor: selected ? alpha('#DE3F5E', 0.4) : 'rgba(0,0,0,0.07)',
        bgcolor: selected ? alpha('#DE3F5E', 0.03) : 'white',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s',
        '&:hover': disabled ? {} : { borderColor: alpha('#DE3F5E', 0.3) },
      }}
    >
      <Checkbox
        checked={selected}
        disabled={disabled}
        size="small"
        sx={{
          color: '#ccc',
          '&.Mui-checked': { color: '#DE3F5E' },
          p: 0.5,
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: '#1a1a1a',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {chat.name}
        </Typography>
        {chat.participantCount > 0 && (
          <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
            {chat.participantCount} participants
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
