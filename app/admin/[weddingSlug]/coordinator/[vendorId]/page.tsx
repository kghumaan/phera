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
} from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AskPheraPanel from '@/components/admin/coordinator/AskPheraPanel';
import AskPheraFab from '@/components/admin/coordinator/AskPheraFab';
import MembersTab from '@/components/admin/coordinator/MembersTab';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';

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
  summary: '#2196F3',
  action_item: '#FF9800',
  decision: '#4CAF50',
  price_quote: '#9C27B0',
  deadline: '#F44336',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#9E9E9E',
  medium: '#FF9800',
  high: '#F44336',
  urgent: '#D32F2F',
};

const STATUS_OPTIONS = ['active', 'booked', 'declined', 'paid'];

const STATUS_COLORS: Record<string, string> = {
  active: '#2196F3',
  booked: '#4CAF50',
  declined: '#9E9E9E',
  paid: '#8BC34A',
};

const SENDER_COLORS: Record<string, string> = {
  vendor: '#9C27B0',
  couple: '#DE3F5E',
  planner: '#2196F3',
  coordinator: '#4CAF50',
  unknown: '#757575',
};

export default function VendorDetailPage({
  params,
}: {
  params: Promise<{ weddingSlug: string; vendorId: string }>;
}) {
  const { weddingSlug, vendorId } = use(params);
  const { user } = useAuth();
  const { isViewOnly } = useAdminRole();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Ask Phera panel
  const [askPheraOpen, setAskPheraOpen] = useState(true);

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
    loadVendor();
  }, [loadVendor]);

  // Get wedding ID
  useEffect(() => {
    const fetchWeddingId = async () => {
      const { data } = await (supabase as any)
        .from('weddings')
        .select('id')
        .eq('slug', weddingSlug)
        .single();
      if (data) setWeddingId(data.id);
    };
    fetchWeddingId();
  }, [weddingSlug]);

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
        toast.success('Analysis updated');
        loadVendor();
      } else {
        toast.error('Analysis failed');
      }
    } catch {
      toast.error('Analysis failed');
    } finally {
      setReanalyzing(false);
    }
  };

  const handleToggleInsight = async (insightId: string, currentCompleted: boolean) => {
    if (isViewOnly) return;
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
      toast.error('Failed to update');
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
        toast.success('Vendor updated');
        setEditing(false);
        loadVendor();
      } else {
        toast.error('Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#DE3F5E' }} />
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
    <Box sx={{ display: 'flex', gap: 0 }}>
      {/* Main content */}
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: askPheraOpen ? 'calc(100% - 380px)' : '100%', transition: 'max-width 0.2s' }}>
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, bgcolor: 'white' }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <IconButton size="small" onClick={() => router.push(`/admin/${weddingSlug}/coordinator`)} sx={{ color: '#1a1a1a' }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              {editing ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    sx={{
                      width: 200,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' },
                      },
                      '& .MuiOutlinedInput-input': { color: '#1a1a1a', fontSize: '0.85rem' },
                    }}
                  />
                  <Select
                    size="small"
                    value={editForm.category}
                    onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                    displayEmpty
                    sx={{ width: 140, fontSize: '0.85rem', color: '#1a1a1a', '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' } }}
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
                    sx={{ width: 120, fontSize: '0.85rem', color: '#1a1a1a', '& fieldset': { borderColor: 'rgba(0,0,0,0.23)' } }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                  <IconButton size="small" onClick={handleSaveVendor} disabled={saving} sx={{ color: '#1a1a1a' }}>
                    {saving ? <CircularProgress size={16} /> : <Save sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Stack>
              ) : (
                <Box
                  onClick={vendor.name.toLowerCase().includes('unknown') ? () => setEditing(true) : undefined}
                  sx={vendor.name.toLowerCase().includes('unknown') ? { cursor: 'pointer' } : undefined}
                >
                  <Typography sx={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: vendor.name.toLowerCase().includes('unknown') ? '#9a9a9a' : '#1a1a1a',
                    fontStyle: vendor.name.toLowerCase().includes('unknown') ? 'italic' : 'normal',
                  }}>
                    {vendor.name}
                    {vendor.name.toLowerCase().includes('unknown') && (
                      <Typography component="span" sx={{ fontSize: '0.75rem', color: '#bbb', ml: 1, fontStyle: 'italic' }}>
                        (click to rename)
                      </Typography>
                    )}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
                    {vendor.category && (
                      <Chip
                        label={vendor.category}
                        size="small"
                        sx={{ color: '#4a4a4a', bgcolor: alpha('#000', 0.06), fontSize: '0.7rem', height: 20, borderRadius: '4px' }}
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
                    {!vendor.name.toLowerCase().includes('unknown') && (
                      <IconButton size="small" onClick={() => setEditing(true)} sx={{ ml: 0.5 }}>
                        <Edit sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </Stack>
                </Box>
              )}
            </Box>
            <Button
              size="small"
              startIcon={reanalyzing ? <CircularProgress size={14} /> : <Refresh />}
              onClick={handleReanalyze}
              disabled={reanalyzing}
              sx={{ textTransform: 'none', borderRadius: '12px', color: '#6a6a6a', fontSize: '0.78rem' }}
            >
              Re-analyze
            </Button>
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
                fontSize: '0.82rem',
                color: '#6a6a6a',
                minHeight: 40,
                '&.Mui-selected': { color: '#DE3F5E' },
              },
              '& .MuiTabs-indicator': { backgroundColor: '#DE3F5E' },
            }}
          >
            <Tab label="Summary & Action Items" />
            <Tab label="Conversation" />
            <Tab label="Members" />
          </Tabs>

          {/* Tab 0: Summary & Action Items */}
          {activeTab === 0 && (
            <Stack spacing={2}>
              {/* Summary */}
              {summaries.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 1, overflow: 'hidden', bgcolor: 'white' }}
                >
                  <Box sx={{ px: 1.5, py: 1, bgcolor: '#F5F5F5', borderBottom: '1px solid', borderColor: alpha('#000', 0.06) }}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Box sx={{ color: '#6a6a6a' }}>{INSIGHT_ICONS.summary}</Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#1a1a1a' }}>Overview</Typography>
                    </Stack>
                  </Box>
                  <Stack sx={{ p: 1.5 }} spacing={1}>
                    {summaries.map((item) => (
                      <Typography key={item.id} sx={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#1a1a1a' }}>
                        {item.content}
                      </Typography>
                    ))}
                  </Stack>
                </Paper>
              )}

              {/* Action Items */}
              {actionItems.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: 1, overflow: 'hidden', bgcolor: 'white' }}
                >
                  <Box sx={{ px: 1.5, py: 1, bgcolor: '#F5F5F5', borderBottom: '1px solid', borderColor: alpha('#000', 0.06) }}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Box sx={{ color: '#6a6a6a' }}>{INSIGHT_ICONS.action_item}</Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#1a1a1a' }}>Action Items</Typography>
                    </Stack>
                  </Box>
                  <Stack sx={{ p: 1 }}>
                    {actionItems.map((item) => (
                      <Stack
                        key={item.id}
                        direction="row"
                        alignItems="flex-start"
                        spacing={0.5}
                        sx={{
                          py: 0.75,
                          px: 0.5,
                          borderRadius: 1,
                          '&:hover': { bgcolor: alpha('#000', 0.02) },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={item.is_completed}
                          onChange={() => handleToggleInsight(item.id, item.is_completed)}
                          icon={<RadioButtonUnchecked sx={{ fontSize: 18 }} />}
                          checkedIcon={<CheckCircle sx={{ fontSize: 18 }} />}
                          sx={{
                            p: 0.25,
                            color: PRIORITY_COLORS[item.priority],
                            '&.Mui-checked': { color: '#DE3F5E' },
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            sx={{
                              fontSize: '0.78rem',
                              lineHeight: 1.4,
                              textDecoration: item.is_completed ? 'line-through' : 'none',
                              color: item.is_completed ? '#aaa' : '#1a1a1a',
                            }}
                          >
                            {item.content}
                          </Typography>
                          {item.due_date && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#F44336' }}>
                              Due: {new Date(item.due_date).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              )}

              {/* Collapsible: Decisions */}
              {decisions.length > 0 && (
                <CollapsibleInsightSection
                  title="Decisions"
                  icon={INSIGHT_ICONS.decision}
                  color={INSIGHT_COLORS.decision}
                  items={decisions}
                  open={decisionsOpen}
                  onToggle={() => setDecisionsOpen((p) => !p)}
                />
              )}

              {/* Collapsible: Price Quotes */}
              {priceQuotes.length > 0 && (
                <CollapsibleInsightSection
                  title="Price Quotes"
                  icon={INSIGHT_ICONS.price_quote}
                  color={INSIGHT_COLORS.price_quote}
                  items={priceQuotes}
                  open={priceQuotesOpen}
                  onToggle={() => setPriceQuotesOpen((p) => !p)}
                />
              )}

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
                  sx={{ p: 3, textAlign: 'center', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 1, bgcolor: 'white' }}
                >
                  <Typography sx={{ color: '#888', fontSize: '0.78rem' }}>
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
                bgcolor: 'white',
              }}
            >
              <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#1a1a1a' }}>
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
                  <Typography sx={{ color: '#888', textAlign: 'center', py: 4, fontSize: '0.78rem' }}>
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
                              sx={{ textAlign: 'center', fontSize: '0.66rem', color: '#999', py: 0.5 }}
                            >
                              {new Date(msg.message_timestamp).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Typography>
                          )}
                          <Box>
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.25 }}>
                              <Typography
                                sx={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  color: SENDER_COLORS[msg.sender_type] || '#757575',
                                }}
                              >
                                {msg.sender_name}
                              </Typography>
                              <Typography sx={{ fontSize: '0.64rem', color: '#999' }}>
                                {new Date(msg.message_timestamp).toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Typography>
                            </Stack>
                            <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.5, pl: 0, color: '#1a1a1a' }}>
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
          {activeTab === 2 && conversationId && weddingId && (
            <MembersTab conversationId={conversationId} weddingId={weddingId} />
          )}
          {activeTab === 2 && !conversationId && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ color: '#888', fontSize: '0.85rem' }}>
                No conversation linked to this vendor yet.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Ask Phera Panel */}
      {weddingId && (
        <AskPheraPanel
          weddingId={weddingId}
          open={askPheraOpen}
          onClose={() => setAskPheraOpen(false)}
          conversationId={conversationId}
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
        bgcolor: 'white',
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          px: 1.5,
          py: 1,
          bgcolor: '#F5F5F5',
          borderBottom: open ? '1px solid' : 'none',
          borderColor: alpha('#000', 0.06),
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          '&:hover': { bgcolor: '#EFEFEF' },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ color: '#6a6a6a' }}>{icon}</Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#1a1a1a' }}>
            {title} ({items.length})
          </Typography>
        </Stack>
        {open ? <ExpandLess sx={{ fontSize: 18, color: '#999' }} /> : <ExpandMore sx={{ fontSize: 18, color: '#999' }} />}
      </Box>
      <Collapse in={open}>
        <Stack sx={{ p: 1.5 }} spacing={1}>
          {items.map((item) => (
            <Box key={item.id}>
              <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.5, color: '#1a1a1a' }}>
                {item.content}
              </Typography>
              {item.due_date && (
                <Typography sx={{ fontSize: '0.7rem', color: '#F44336', mt: 0.25 }}>
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
