'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import LogoutIcon from '@mui/icons-material/Logout';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import ChatIcon from '@mui/icons-material/Chat';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import OptimizedBackground from '@/components/ui/OptimizedBackground';

interface TableStats {
  guests: number;
  rsvps: number;
  comments: number;
  whatsapp_clicks: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<TableStats>({ guests: 0, rsvps: 0, comments: 0, whatsapp_clicks: 0 });
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch counts from all tables
      const [guestsRes, rsvpsRes, commentsRes, whatsappRes] = await Promise.all([
        supabase.from('guests').select('id', { count: 'exact', head: true }),
        supabase.from('rsvps').select('id', { count: 'exact', head: true }),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('whatsapp_channel_clicks').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        guests: guestsRes.count || 0,
        rsvps: rsvpsRes.count || 0,
        comments: commentsRes.count || 0,
        whatsapp_clicks: whatsappRes.count || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const exportTableToCSV = async (tableName: string, displayName: string) => {
    try {
      setExportLoading(tableName);
      setError(null);

      let data: any[] = [];

      // Fetch data based on table name
      if (tableName === 'rsvps_complete') {
        // Use the view for complete RSVP data
        const { data: viewData, error } = await supabase
          .from('rsvps_complete')
          .select('*');

        if (error) throw error;
        data = viewData || [];
      } else if (tableName === 'rsvps_with_names') {
        // Use the view for RSVPs with names
        const { data: viewData, error } = await supabase
          .from('rsvps_with_names')
          .select('*');

        if (error) throw error;
        data = viewData || [];
      } else {
        // Regular table export
        const { data: tableData, error } = await supabase
          .from(tableName)
          .select('*');

        if (error) throw error;
        data = tableData || [];
      }

      if (data.length === 0) {
        setError(`No data found in ${displayName}`);
        return;
      }

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
          headers.map(header => {
            const value = row[header];
            // Handle arrays and objects
            if (Array.isArray(value)) {
              return `"${value.join('; ')}"`;
            } else if (typeof value === 'object' && value !== null) {
              return `"${JSON.stringify(value)}"`;
            } else if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${tableName}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error(`Error exporting ${tableName}:`, err);
      setError(`Failed to export ${displayName}`);
    } finally {
      setExportLoading(null);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('phera_admin_authenticated');
      localStorage.removeItem('phera_admin_timestamp');
      window.location.reload();
    }
  };

  const exportOptions = [
    {
      key: 'guests',
      name: 'All Guests',
      description: 'Complete guest information including contact details',
      icon: <PeopleIcon />,
      color: '#2196F3'
    },
    {
      key: 'rsvps',
      name: 'Raw RSVPs',
      description: 'Raw RSVP data with guest IDs',
      icon: <EventIcon />,
      color: '#4CAF50'
    },
    {
      key: 'rsvps_complete',
      name: 'Complete RSVPs',
      description: 'RSVPs with guest names and all details (recommended)',
      icon: <EventIcon />,
      color: '#FF9800'
    },
    {
      key: 'rsvps_with_names',
      name: 'RSVPs with Names',
      description: 'Simple RSVPs with guest names',
      icon: <EventIcon />,
      color: '#9C27B0'
    },
    {
      key: 'comments',
      name: 'Guest Comments',
      description: 'All comments and messages from guests',
      icon: <ChatIcon />,
      color: '#FF5722'
    },
    {
      key: 'whatsapp_channel_clicks',
      name: 'WhatsApp Clicks',
      description: 'WhatsApp channel engagement tracking',
      icon: <WhatsAppIcon />,
      color: '#25D366'
    },
  ];

  return (
    <OptimizedBackground useAppDefault={true} className="min-h-screen flex flex-col">
      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
        {/* Header */}
        <AppBar position="static" sx={{ bgcolor: alpha('#1a1a1a', 0.95), backdropFilter: 'blur(10px)', boxShadow: 'none' }}>
          <Toolbar>
            <Box
              component="img"
              src="/logo-stacked.svg"
              alt="Phera Logo"
              sx={{
                height: 40,
                width: 'auto',
                filter: 'brightness(0) invert(1)',
                mr: 2,
              }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontFamily: 'var(--font-instrument-serif), serif',
                fontStyle: 'italic',
              }}
            >
              Admin Dashboard
            </Typography>
            <IconButton
              color="inherit"
              onClick={handleLogout}
              sx={{ ml: 2 }}
            >
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'var(--font-instrument-serif), serif',
                fontWeight: 700,
                color: '#1a1a1a',
                mb: 1,
              }}
            >
              Wedding Data Management
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'var(--font-outfit), sans-serif',
                color: '#4a4a4a',
                mb: 4,
              }}
            >
              Export and manage all wedding-related data from your Supabase database
            </Typography>
          </motion.div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            </motion.div>
          )}

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { label: 'Total Guests', value: stats.guests, color: '#2196F3', icon: <PeopleIcon /> },
                { label: 'RSVPs Received', value: stats.rsvps, color: '#4CAF50', icon: <EventIcon /> },
                { label: 'Comments Posted', value: stats.comments, color: '#FF5722', icon: <ChatIcon /> },
                { label: 'WhatsApp Clicks', value: stats.whatsapp_clicks, color: '#25D366', icon: <WhatsAppIcon /> },
              ].map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={stat.label}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '24px',
                      bgcolor: alpha('#fff', 0.95),
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                      border: `2px solid ${alpha(stat.color, 0.2)}`,
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ color: stat.color, mb: 1 }}>
                        {stat.icon}
                      </Box>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 700,
                          color: stat.color,
                          fontFamily: 'var(--font-outfit), sans-serif',
                          mb: 0.5,
                        }}
                      >
                        {loading ? <CircularProgress size={24} /> : stat.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#4a4a4a',
                          fontFamily: 'var(--font-outfit), sans-serif',
                          fontWeight: 500,
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </motion.div>

          {/* Export Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: 'var(--font-instrument-serif), serif',
                fontWeight: 700,
                color: '#1a1a1a',
                mb: 3,
              }}
            >
              Data Export Options
            </Typography>

            <Grid container spacing={3}>
              {exportOptions.map((option, index) => (
                <Grid item xs={12} md={6} key={option.key}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: '24px',
                        bgcolor: alpha('#fff', 0.95),
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" alignItems="flex-start" spacing={2}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: '12px',
                              backgroundColor: `${option.color}15`,
                              color: option.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {option.icon}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontFamily: 'var(--font-outfit), sans-serif',
                                  fontWeight: 600,
                                  color: '#1a1a1a',
                                }}
                              >
                                {option.name}
                              </Typography>
                              {option.key === 'rsvps_complete' && (
                                <Chip
                                  label="Recommended"
                                  size="small"
                                  sx={{
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 20,
                                  }}
                                />
                              )}
                            </Stack>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#4a4a4a',
                                fontFamily: 'var(--font-outfit), sans-serif',
                                mb: 2,
                              }}
                            >
                              {option.description}
                            </Typography>
                            <Button
                              variant="contained"
                              startIcon={exportLoading === option.key ? <CircularProgress size={16} /> : <DownloadIcon />}
                              onClick={() => exportTableToCSV(option.key, option.name)}
                              disabled={exportLoading === option.key || loading}
                              sx={{
                                bgcolor: option.color === '#DE3F5E' ? option.color : '#DE3F5E',
                                color: 'white',
                                py: 1.2,
                                borderRadius: '32px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                fontFamily: 'var(--font-outfit), sans-serif',
                                boxShadow: '0 4px 12px rgba(222, 63, 94, 0.3)',
                                '&:hover': {
                                  bgcolor: '#C8365A',
                                  boxShadow: '0 6px 16px rgba(222, 63, 94, 0.4)',
                                },
                                '&:disabled': {
                                  bgcolor: alpha('#DE3F5E', 0.5),
                                },
                              }}
                            >
                              {exportLoading === option.key ? 'Exporting...' : 'Export CSV'}
                            </Button>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>

          {/* Footer */}
          <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                color: '#6a6a6a',
                fontFamily: 'var(--font-outfit), sans-serif',
              }}
            >
              Phera Wedding Platform - Admin Dashboard
            </Typography>
          </Box>
        </Container>
      </Box>
    </OptimizedBackground>
  );
};

export default AdminDashboard;
