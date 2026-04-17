'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { getOptInStats, getMessageStats, getRecentMessages } from '@/lib/whatsapp/analytics';
import type { OptInStats, MessageStats, RecentMessage } from '@/lib/whatsapp/analytics';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface WhatsAppAnalyticsProps {
  weddingId: string;
}

export default function WhatsAppAnalytics({ weddingId }: WhatsAppAnalyticsProps) {
  const [optInStats, setOptInStats] = useState<OptInStats | null>(null);
  const [messageStats, setMessageStats] = useState<MessageStats | null>(null);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, [weddingId]);

  const loadAnalytics = async () => {
    try {
      const [optIns, messages, recent] = await Promise.all([
        getOptInStats(weddingId),
        getMessageStats(weddingId),
        getRecentMessages(weddingId, 20),
      ]);

      setOptInStats(optIns);
      setMessageStats(messages);
      setRecentMessages(recent);
    } catch (error) {
      console.error('Error loading WhatsApp analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'read':
        return 'success';
      case 'delivered':
        return 'info';
      case 'sent':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Opt-ins */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WhatsAppIcon sx={{ color: COLORS.accent.success, mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Opt-ins
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {optInStats?.total_opted_in || 0}
              </Typography>
              {optInStats && optInStats.total_opted_out > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {optInStats.total_opted_out} opted out ({optInStats.opt_out_rate}%)
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Messages Sent */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SendIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Messages Sent
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {messageStats?.total_sent || 0}
              </Typography>
              {messageStats && messageStats.failed_count > 0 && (
                <Typography variant="caption" color="error">
                  {messageStats.failed_count} failed
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Delivery Rate */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Delivery Rate
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {messageStats?.delivery_rate || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {messageStats?.delivered_count || 0} delivered
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Read Rate */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <VisibilityIcon sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Read Rate
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 600 }}>
                {messageStats?.read_rate || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {messageStats?.read_count || 0} read
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Messages Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Messages
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Guest</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sent</TableCell>
                  <TableCell>Delivered</TableCell>
                  <TableCell>Read</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentMessages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        No messages sent yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentMessages.map((message) => (
                    <TableRow key={message.id} hover>
                      <TableCell>
                        <Typography variant="body2">{message.guest_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {message.phone_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {message.template_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={message.status}
                          size="small"
                          color={getStatusColor(message.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatTimestamp(message.sent_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatTimestamp(message.delivered_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {formatTimestamp(message.read_at)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
