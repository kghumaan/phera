'use client';

import { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Fab,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Chip,
  Avatar,
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AddIcon from '@mui/icons-material/Add';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import Link from 'next/link';
import WhatsAppAnalytics from '@/components/admin/WhatsAppAnalytics';
import BroadcastForm from '@/components/admin/BroadcastForm';

export default function AdminDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);

  // Mock data - replace with real data from Google Sheets API
  const dashboardData = {
    totalGuests: 250,
    confirmedRSVPs: 180,
    pendingRSVPs: 70,
    totalEvents: 5,
    upcomingEvent: 'Mehendi Ceremony',
    daysUntilWedding: 45,
    completedTasks: 12,
    totalTasks: 20,
  };

  const quickStats = [
    {
      title: 'Total Guests',
      value: dashboardData.totalGuests,
      icon: <PeopleIcon />,
      color: theme.palette.primary.main,
      change: '+12 this week',
    },
    {
      title: 'Confirmed RSVPs',
      value: dashboardData.confirmedRSVPs,
      icon: <CheckCircleIcon />,
      color: theme.palette.success.main,
      change: `${Math.round((dashboardData.confirmedRSVPs / dashboardData.totalGuests) * 100)}% response rate`,
    },
    {
      title: 'Pending RSVPs',
      value: dashboardData.pendingRSVPs,
      icon: <PendingIcon />,
      color: theme.palette.warning.main,
      change: 'Follow up needed',
    },
    {
      title: 'Wedding Events',
      value: dashboardData.totalEvents,
      icon: <EventIcon />,
      color: theme.palette.secondary.main,
      change: 'All planned',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Events',
      description: 'Add, edit, or organize your wedding ceremonies',
      icon: <EventIcon />,
      href: '/events',
      color: theme.palette.primary.main,
    },
    {
      title: 'Guest Management',
      description: 'View RSVPs and manage your guest list',
      icon: <PeopleIcon />,
      href: '/guests',
      color: theme.palette.secondary.main,
    },
    {
      title: 'WhatsApp Groups',
      description: 'Create and manage family WhatsApp communities',
      icon: <WhatsAppIcon />,
      href: '/settings#whatsapp',
      color: '#25D366',
    },
    {
      title: 'Photo Sharing',
      description: 'Set up Lapse cameras for event photos',
      icon: <PhotoCameraIcon />,
      href: '/settings#lapse',
      color: theme.palette.info.main,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DashboardIcon
                sx={{
                  fontSize: 40,
                  color: 'primary.main',
                  mr: 2
                }}
              />
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  fontSize: { xs: '2rem', md: '3rem' }
                }}
              >
                Wedding Dashboard
              </Typography>
            </Box>

            <Typography variant="h6" color="text.secondary">
              Welcome back! Here's what's happening with your wedding planning.
            </Typography>

            {/* Countdown */}
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`${dashboardData.daysUntilWedding} days until your special day! 💍`}
                color="primary"
                variant="filled"
                sx={{
                  fontSize: '1rem',
                  py: 2,
                  px: 1,
                  borderRadius: 3
                }}
              />
            </Box>
          </Box>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {quickStats.map((stat, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title}>

                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: `${stat.color}20`,
                          color: stat.color,
                          mr: 2,
                          width: 48,
                          height: 48,
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h4" fontWeight="bold">
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.title}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="caption" color={stat.color}>
                      {stat.change}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Progress Section */}
        <motion.div variants={itemVariants}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>

              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  height: '100%'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Planning Progress
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {dashboardData.completedTasks} of {dashboardData.totalTasks} tasks completed
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {Math.round((dashboardData.completedTasks / dashboardData.totalTasks) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(dashboardData.completedTasks / dashboardData.totalTasks) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: `${theme.palette.primary.main}20`,
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>

              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  height: '100%'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Next Event
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <EventIcon sx={{ color: 'secondary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {dashboardData.upcomingEvent}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Coming up next in your celebration timeline
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>

        {/* WhatsApp Analytics */}
        <motion.div variants={itemVariants}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={600}>
              WhatsApp Engagement
            </Typography>
            <Button
              variant="contained"
              startIcon={<WhatsAppIcon />}
              onClick={() => setBroadcastDialogOpen(true)}
              sx={{
                bgcolor: '#25D366',
                '&:hover': {
                  bgcolor: '#128C7E',
                },
              }}
            >
              Send Broadcast
            </Button>
          </Box>
          <WhatsAppAnalytics weddingId="simran-karanvir"
          />
        </motion.div>

        {/* Broadcast Dialog */}
        <BroadcastForm
          open={broadcastDialogOpen}
          onClose={() => setBroadcastDialogOpen(false)}
          weddingId="simran-karanvir"

        />

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, mt: 6, fontWeight: 600 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={action.title}>

                <Card
                  component={Link}
                  href={action.href}
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                      '& .action-icon': {
                        transform: 'scale(1.1)',
                      }
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Avatar
                      className="action-icon"
                      sx={{
                        bgcolor: `${action.color}20`,
                        color: action.color,
                        width: 56,
                        height: 56,
                        mx: 'auto',
                        mb: 2,
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      {action.icon}
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          component={Link}
          href="/events"
        >
          <AddIcon />
        </Fab>
      </motion.div>
    </Container>
  );
} 