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
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
} from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', category: '', phone: '', email: '', status: '', notes: '' });
  const [saving, setSaving] = useState(false);

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

  const handleReanalyze = async () => {
    const convo = vendor?.vendor_conversations?.[0];
    if (!convo) return;
    setReanalyzing(true);
    try {
      const res = await fetch(`/api/vendors/conversations/${convo.id}/reanalyze`, {
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
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton size="small" onClick={() => router.push(`/admin/${weddingSlug}/coordinator`)}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          {editing ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                sx={{ width: 200 }}
              />
              <Select
                size="small"
                value={editForm.status}
                onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                sx={{ width: 120 }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
              <IconButton size="small" onClick={handleSaveVendor} disabled={saving}>
                {saving ? <CircularProgress size={16} /> : <Save />}
              </IconButton>
            </Stack>
          ) : (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {vendor.name}
              </Typography>
              {vendor.category && <Chip label={vendor.category} size="small" />}
              <Chip
                label={vendor.status}
                size="small"
                sx={{
                  bgcolor: alpha(
                    vendor.status === 'booked' ? '#4CAF50' : '#2196F3',
                    0.1
                  ),
                }}
              />
              <IconButton size="small" onClick={() => setEditing(true)}>
                <Edit sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          )}
        </Box>
        <Button
          size="small"
          startIcon={reanalyzing ? <CircularProgress size={14} /> : <Refresh />}
          onClick={handleReanalyze}
          disabled={reanalyzing}
          sx={{ textTransform: 'none' }}
        >
          Re-analyze
        </Button>
      </Stack>

      {/* Two-panel layout */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {/* Left: Conversation Timeline */}
        <Paper
          sx={{
            flex: 1,
            border: '1px solid',
            borderColor: alpha('#000', 0.08),
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha('#000', 0.08) }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.88rem' }}>
              Conversation ({allMessages.length} messages)
            </Typography>
          </Box>
          <Box
            sx={{
              maxHeight: { xs: 400, md: 600 },
              overflowY: 'auto',
              p: 1.5,
            }}
          >
            {allMessages.length === 0 ? (
              <Typography sx={{ color: '#888', textAlign: 'center', py: 4, fontSize: '0.85rem' }}>
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
                          sx={{
                            textAlign: 'center',
                            fontSize: '0.72rem',
                            color: '#aaa',
                            py: 0.5,
                          }}
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
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              color: SENDER_COLORS[msg.sender_type] || '#757575',
                            }}
                          >
                            {msg.sender_name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: '#bbb' }}>
                            {new Date(msg.message_timestamp).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </Stack>
                        <Typography sx={{ fontSize: '0.84rem', lineHeight: 1.5, pl: 0 }}>
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

        {/* Right: Insights Panel */}
        <Box sx={{ width: { xs: '100%', md: 340 }, flexShrink: 0 }}>
          <Stack spacing={2}>
            {/* Summary */}
            {summaries.length > 0 && (
              <InsightSection
                title="Summary"
                icon={INSIGHT_ICONS.summary}
                color={INSIGHT_COLORS.summary}
                items={summaries}
              />
            )}

            {/* Action Items */}
            {actionItems.length > 0 && (
              <Paper
                sx={{
                  border: '1px solid',
                  borderColor: alpha('#000', 0.08),
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    bgcolor: alpha(INSIGHT_COLORS.action_item, 0.06),
                    borderBottom: '1px solid',
                    borderColor: alpha('#000', 0.06),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Box sx={{ color: INSIGHT_COLORS.action_item }}>{INSIGHT_ICONS.action_item}</Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      Action Items
                    </Typography>
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
                          '&.Mui-checked': { color: '#4CAF50' },
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: '0.82rem',
                            lineHeight: 1.4,
                            textDecoration: item.is_completed ? 'line-through' : 'none',
                            color: item.is_completed ? '#aaa' : 'inherit',
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

            {/* Decisions */}
            {decisions.length > 0 && (
              <InsightSection
                title="Decisions"
                icon={INSIGHT_ICONS.decision}
                color={INSIGHT_COLORS.decision}
                items={decisions}
              />
            )}

            {/* Price Quotes */}
            {priceQuotes.length > 0 && (
              <InsightSection
                title="Price Quotes"
                icon={INSIGHT_ICONS.price_quote}
                color={INSIGHT_COLORS.price_quote}
                items={priceQuotes}
              />
            )}

            {/* Deadlines */}
            {deadlines.length > 0 && (
              <InsightSection
                title="Deadlines"
                icon={INSIGHT_ICONS.deadline}
                color={INSIGHT_COLORS.deadline}
                items={deadlines}
              />
            )}

            {/* Show empty state if no insights at all */}
            {(vendor.vendor_insights?.length || 0) === 0 && (
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: alpha('#000', 0.08),
                  borderRadius: 2,
                }}
              >
                <Typography sx={{ color: '#888', fontSize: '0.85rem' }}>
                  No insights yet. Click "Re-analyze" to extract insights from the conversation.
                </Typography>
              </Paper>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

// Reusable insight section component
function InsightSection({
  title,
  icon,
  color,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: Insight[];
}) {
  return (
    <Paper
      sx={{
        border: '1px solid',
        borderColor: alpha('#000', 0.08),
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          bgcolor: alpha(color, 0.06),
          borderBottom: '1px solid',
          borderColor: alpha('#000', 0.06),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ color }}>{icon}</Box>
          <Typography sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{title}</Typography>
        </Stack>
      </Box>
      <Stack sx={{ p: 1.5 }} spacing={1}>
        {items.map((item) => (
          <Box key={item.id}>
            <Typography sx={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
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
    </Paper>
  );
}
