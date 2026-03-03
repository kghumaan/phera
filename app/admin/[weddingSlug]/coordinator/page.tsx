'use client';

import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Chip,
  TextField,
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
  FormControlLabel,
} from '@mui/material';
import React, { useState, use, useEffect, useCallback } from 'react';
import {
  SupportAgent,
  Upload,
  Send,
  Add,
  CheckCircleOutline,
  Chat,
  Assignment,
  ContentCopy,
  PhoneAndroid,
  LockOutlined,
  Close,
  WhatsApp,
  Sync,
} from '@mui/icons-material';
import { usePlan } from '@/lib/contexts/PlanContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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

const VENDOR_CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Videography', 'Florist',
  'DJ/Music', 'Decor', 'Makeup', 'Mehndi', 'Priest',
  'Invitations', 'Cake', 'Rental', 'Transportation', 'Planner', 'Other',
];

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
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Add vendor dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', category: '', phone: '', email: '' });
  const [addingVendor, setAddingVendor] = useState(false);

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
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  // Ask Phera
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [asking, setAsking] = useState(false);

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
      } catch {
        // silently fail
      }
    };
    fetchCoordinatorInfo();
  }, [isPro]);

  // Stats
  const totalVendors = vendors.length;
  const activeConversations = vendors.filter(
    (v) => v.vendor_conversations?.some((c) => c.status === 'ready')
  ).length;
  const openActionItems = vendors.reduce(
    (sum, v) =>
      sum +
      (v.vendor_insights?.filter(
        (i) => i.insight_type === 'action_item' && !i.is_completed
      ).length || 0),
    0
  );

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

  // Add vendor
  const handleAddVendor = async () => {
    if (!weddingId || !newVendor.name) return;
    setAddingVendor(true);
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId, ...newVendor }),
      });
      if (res.ok) {
        toast.success('Vendor added');
        setAddDialogOpen(false);
        setNewVendor({ name: '', category: '', phone: '', email: '' });
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to add vendor');
      }
    } catch {
      toast.error('Failed to add vendor');
    } finally {
      setAddingVendor(false);
    }
  };

  // Import chat
  const handleImportChat = async () => {
    if (!weddingId || !importFile) return;
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
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Import failed');
      }
    } catch {
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  // Ask Phera
  const handleAskPhera = async () => {
    if (!weddingId || !askQuestion.trim()) return;
    setAsking(true);
    setAskAnswer('');
    try {
      const res = await fetch('/api/vendors/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId, question: askQuestion }),
      });
      const data = await res.json();
      setAskAnswer(data.answer || 'No answer available.');
    } catch {
      setAskAnswer('Something went wrong. Try again.');
    } finally {
      setAsking(false);
    }
  };

  // Discover WhatsApp groups (step 1 — opens picker)
  const handleDiscoverGroups = async () => {
    setDiscoveringGroups(true);
    setDiscoveredGroups([]);
    setSelectedGroupIds(new Set());
    setSyncDialogOpen(true);
    try {
      const res = await fetch('/api/vendors/sync-groups');
      const data = await res.json();
      if (res.ok && data.groups) {
        setDiscoveredGroups(data.groups);
      } else {
        toast.error(data.error || 'Failed to discover groups');
        setSyncDialogOpen(false);
      }
    } catch {
      toast.error('Failed to discover groups');
      setSyncDialogOpen(false);
    } finally {
      setDiscoveringGroups(false);
    }
  };

  // Sync selected groups (step 2 — imports messages)
  const handleSyncSelected = async () => {
    if (!weddingId || selectedGroupIds.size === 0) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/vendors/sync-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weddingId, groupIds: Array.from(selectedGroupIds) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Sync complete');
        setSyncDialogOpen(false);
        loadData();
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
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
  if (vendors.length === 0) {
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
                    startIcon={<Sync />}
                    onClick={handleDiscoverGroups}
                    disabled={!phoneConfigured}
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
                    Sync WhatsApp Groups
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
                      Import Chat
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setAddDialogOpen(true)}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '12px',
                        bgcolor: '#DE3F5E',
                        fontSize: '0.8rem',
                        '&:hover': { bgcolor: '#C8365A' },
                      }}
                    >
                      Add Vendor Manually
                    </Button>
                  </Stack>
                </Box>
              </Box>

            </Stack>
          </Paper>

        </Stack>

        {/* Dialogs */}
        {renderAddVendorDialog()}
        {renderImportChatDialog()}
        {renderSyncGroupsDialog()}
      </Box>
    );
  }

  // ─── STATE C: Pro user, has vendors (dashboard) ─────────────────────
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
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<Sync />}
              onClick={handleDiscoverGroups}
              sx={{ textTransform: 'none', borderRadius: '12px', color: '#6a6a6a' }}
            >
              Sync
            </Button>
            <Button
              size="small"
              startIcon={<Upload />}
              onClick={() => setImportDialogOpen(true)}
              sx={{ textTransform: 'none', borderRadius: '12px', color: '#1a1a1a' }}
            >
              Import Chat
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddDialogOpen(true)}
              sx={{ textTransform: 'none', borderRadius: '12px', bgcolor: '#DE3F5E', '&:hover': { bgcolor: '#C8365A' } }}
            >
              Add Vendor
            </Button>
          </Stack>
        </Box>

        {/* Compact coordinator number banner */}
        {phoneConfigured && !bannerDismissed && (
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.25,
              borderRadius: 1,
              border: '1px solid rgba(0,0,0,0.07)',
              bgcolor: '#F8F8F8',
            }}
          >
            <PhoneAndroid sx={{ fontSize: 18, color: '#DE3F5E' }} />
            <Typography variant="body2" sx={{ color: '#4a4a4a', flex: 1 }}>
              Coordinator number: <strong>{coordinatorPhone}</strong>
            </Typography>
            <IconButton
              size="small"
              onClick={handleCopyPhone}
              sx={{ color: phoneCopied ? '#4CAF50' : '#6a6a6a' }}
            >
              {phoneCopied ? <CheckCircleOutline sx={{ fontSize: 16 }} /> : <ContentCopy sx={{ fontSize: 16 }} />}
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setBannerDismissed(true)}
              sx={{ color: '#9a9a9a' }}
            >
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </Paper>
        )}

        {/* Stats */}
        <Stack direction="row" spacing={2}>
          {[
            { label: 'Vendors', value: totalVendors, icon: <SupportAgent fontSize="small" /> },
            { label: 'Conversations', value: activeConversations, icon: <Chat fontSize="small" /> },
            { label: 'Open Items', value: openActionItems, icon: <Assignment fontSize="small" /> },
          ].map((stat) => (
            <Paper
              key={stat.label}
              elevation={0}
              sx={{
                flex: 1,
                p: 2,
                textAlign: 'center',
                borderRadius: 1,
                border: '1px solid rgba(0,0,0,0.07)',
                bgcolor: '#F8F8F8',
              }}
            >
              <Box sx={{ color: '#DE3F5E', mb: 0.5 }}>{stat.icon}</Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{stat.value}</Typography>
              <Typography variant="caption" sx={{ color: '#1a1a1a' }}>{stat.label}</Typography>
            </Paper>
          ))}
        </Stack>

        {/* Vendor List */}
        <Stack spacing={1.5}>
          {vendors.map((vendor) => {
            const lastConvo = vendor.vendor_conversations?.[0];
            const actionItems = vendor.vendor_insights?.filter(
              (i) => i.insight_type === 'action_item' && !i.is_completed
            ) || [];

            return (
              <Paper
                key={vendor.id}
                elevation={0}
                onClick={() =>
                  router.push(`/admin/${weddingSlug}/coordinator/${vendor.id}`)
                }
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  borderRadius: 1,
                  border: '1px solid rgba(0,0,0,0.07)',
                  bgcolor: 'white',
                  transition: 'all 0.15s',
                  '&:hover': {
                    borderColor: alpha('#DE3F5E', 0.3),
                    bgcolor: alpha('#DE3F5E', 0.02),
                  },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                        {vendor.name}
                      </Typography>
                      {vendor.category && (
                        <Chip
                          label={vendor.category}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20, borderRadius: '4px' }}
                        />
                      )}
                      <Chip
                        label={vendor.status}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          height: 20,
                          borderRadius: '4px',
                          bgcolor: alpha(STATUS_COLORS[vendor.status] || '#9E9E9E', 0.1),
                          color: STATUS_COLORS[vendor.status] || '#9E9E9E',
                        }}
                      />
                    </Stack>
                    {lastConvo && (
                      <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                        {lastConvo.message_count} messages
                        {lastConvo.last_message_at &&
                          ` · Last: ${new Date(lastConvo.last_message_at).toLocaleDateString()}`}
                      </Typography>
                    )}
                  </Box>
                  {actionItems.length > 0 && (
                    <Chip
                      icon={<Assignment sx={{ fontSize: '0.85rem !important' }} />}
                      label={`${actionItems.length} action item${actionItems.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                        bgcolor: alpha('#FF9800', 0.1),
                        color: '#E65100',
                      }}
                    />
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        {/* Ask Phera */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 1,
            border: '1px solid rgba(0,0,0,0.07)',
            bgcolor: '#F8F8F8',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
            Ask Phera
          </Typography>
          <Typography variant="body4" sx={{ color: '#4a4a4a', mb: 1.5 }}>
            Ask a question across all your vendor conversations
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. What's the latest on catering pricing?"
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskPhera()}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
            />
            <IconButton
              onClick={handleAskPhera}
              disabled={asking || !askQuestion.trim()}
              sx={{ color: '#DE3F5E' }}
            >
              {asking ? <CircularProgress size={20} /> : <Send />}
            </IconButton>
          </Stack>
          {askAnswer && (
            <Paper
              elevation={0}
              sx={{
                mt: 1.5,
                p: 2,
                bgcolor: alpha('#DE3F5E', 0.03),
                borderRadius: 1,
                color: '#1a1a1a',
              }}
            >
              <Typography variant="body3" sx={{ lineHeight: 1.7, color: '#1a1a1a' }}>
                {askAnswer}
              </Typography>
            </Paper>
          )}
        </Paper>

      </Stack>

      {/* Dialogs */}
      {renderAddVendorDialog()}
      {renderImportChatDialog()}
      {renderSyncGroupsDialog()}
    </Box>
  );

  // ─── Shared dialog renderers ────────────────────────────────────────

  function renderAddVendorDialog() {
    return (
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#ffffff', color: '#1a1a1a', borderRadius: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1a1a1a' }}>Add Vendor</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Vendor Name"
              fullWidth
              required
              value={newVendor.name}
              onChange={(e) => setNewVendor((p) => ({ ...p, name: e.target.value }))}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 1, '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' } },
                '& .MuiInputLabel-root': { color: '#6a6a6a' },
                '& .MuiOutlinedInput-input': { color: '#1a1a1a' },
              }}
            />
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' } }, '& .MuiInputLabel-root': { color: '#6a6a6a' } }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={newVendor.category}
                label="Category"
                onChange={(e) => setNewVendor((p) => ({ ...p, category: e.target.value }))}
                sx={{ color: '#1a1a1a' }}
              >
                {VENDOR_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Phone"
              fullWidth
              value={newVendor.phone}
              onChange={(e) => setNewVendor((p) => ({ ...p, phone: e.target.value }))}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 1, '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' } },
                '& .MuiInputLabel-root': { color: '#6a6a6a' },
                '& .MuiOutlinedInput-input': { color: '#1a1a1a' },
              }}
            />
            <TextField
              label="Email"
              fullWidth
              value={newVendor.email}
              onChange={(e) => setNewVendor((p) => ({ ...p, email: e.target.value }))}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 1, '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' } },
                '& .MuiInputLabel-root': { color: '#6a6a6a' },
                '& .MuiOutlinedInput-input': { color: '#1a1a1a' },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)} sx={{ color: '#1a1a1a' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddVendor}
            disabled={addingVendor || !newVendor.name}
            sx={{ bgcolor: '#DE3F5E', '&:hover': { bgcolor: '#C8365A' } }}
          >
            {addingVendor ? <CircularProgress size={20} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

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
          <Typography variant="body4" sx={{ color: '#4a4a4a', mb: 2 }}>
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

  function renderSyncGroupsDialog() {
    return (
      <Dialog
        open={syncDialogOpen}
        onClose={() => !syncing && setSyncDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#ffffff', color: '#1a1a1a', borderRadius: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1a1a1a' }}>
          Sync WhatsApp Groups
        </DialogTitle>
        <DialogContent>
          {discoveringGroups ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress sx={{ color: '#DE3F5E' }} size={32} />
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Discovering your WhatsApp groups...
              </Typography>
            </Box>
          ) : discoveredGroups.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#6a6a6a', py: 2 }}>
              No groups found. Make sure the Coordinator number has been added to at least one WhatsApp group.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: '#4a4a4a', mb: 2 }}>
                Select the vendor group chats you want to import. We&apos;ll pull in message history and run AI analysis.
              </Typography>
              <Stack spacing={0.5}>
                {discoveredGroups.map((group) => (
                  <Paper
                    key={group.id}
                    elevation={0}
                    onClick={() => !syncing && toggleGroupSelection(group.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: selectedGroupIds.has(group.id)
                        ? alpha('#DE3F5E', 0.4)
                        : 'rgba(0,0,0,0.07)',
                      bgcolor: selectedGroupIds.has(group.id)
                        ? alpha('#DE3F5E', 0.03)
                        : 'white',
                      cursor: syncing ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                      '&:hover': syncing ? {} : {
                        borderColor: alpha('#DE3F5E', 0.3),
                      },
                    }}
                  >
                    <Checkbox
                      checked={selectedGroupIds.has(group.id)}
                      disabled={syncing}
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
                        {group.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
                        {group.participantCount} participants
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Stack>
              {discoveredGroups.length > 2 && (
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setSelectedGroupIds(new Set(discoveredGroups.map((g) => g.id)))}
                    disabled={syncing}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#6a6a6a' }}
                  >
                    Select all
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setSelectedGroupIds(new Set())}
                    disabled={syncing}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#6a6a6a' }}
                  >
                    Clear
                  </Button>
                </Box>
              )}
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
            disabled={syncing || selectedGroupIds.size === 0}
            startIcon={syncing ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Sync />}
            sx={{ bgcolor: '#DE3F5E', '&:hover': { bgcolor: '#C8365A' }, textTransform: 'none', borderRadius: '12px' }}
          >
            {syncing
              ? `Syncing ${selectedGroupIds.size} group${selectedGroupIds.size !== 1 ? 's' : ''}...`
              : `Sync ${selectedGroupIds.size} group${selectedGroupIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}
