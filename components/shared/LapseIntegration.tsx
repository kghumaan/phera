'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  useTheme,
  Chip,
  QRCode,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ShareIcon from '@mui/icons-material/Share';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

interface LapseEvent {
  id: string;
  name: string;
  code: string;
  qrCode: string;
  revealTime: string;
  isActive: boolean;
  photoCount: number;
}

export default function LapseIntegration() {
  const theme = useTheme();
  const [lapseEvents] = useState<LapseEvent[]>([
    {
      id: '1',
      name: 'Mehendi Ceremony',
      code: 'MEHENDI2024',
      qrCode: 'https://lapse.com/join/MEHENDI2024',
      revealTime: '2024-02-20T18:00:00',
      isActive: true,
      photoCount: 45,
    },
    {
      id: '2',
      name: 'Wedding Ceremony',
      code: 'WEDDING2024',
      qrCode: 'https://lapse.com/join/WEDDING2024',
      revealTime: '2024-02-22T20:00:00',
      isActive: true,
      photoCount: 128,
    },
    {
      id: '3',
      name: 'Reception',
      code: 'RECEPTION2024',
      qrCode: 'https://lapse.com/join/RECEPTION2024',
      revealTime: '2024-02-23T22:00:00',
      isActive: true,
      photoCount: 87,
    },
  ]);

  const handleShareCode = (code: string) => {
    const message = `Join our wedding photo album on Lapse! Use code: ${code} or scan the QR code at the event. 📸✨`;
    navigator.share?.({
      title: 'Wedding Photo Album',
      text: message,
    }) || navigator.clipboard.writeText(message);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
          Lapse Photo Sharing
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage wedding photo albums with timed reveals for each ceremony
        </Typography>
      </Box>

      {/* Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main + '20', color: theme.palette.primary.main, mx: 'auto', mb: 2, width: 56, height: 56 }}>
                <PhotoCameraIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {lapseEvents.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Albums
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: theme.palette.success.main + '20', color: theme.palette.success.main, mx: 'auto', mb: 2, width: 56, height: 56 }}>
                <PhotoLibraryIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {lapseEvents.reduce((sum, event) => sum + event.photoCount, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Photos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Avatar sx={{ bgcolor: theme.palette.warning.main + '20', color: theme.palette.warning.main, mx: 'auto', mb: 2, width: 56, height: 56 }}>
                <AccessTimeIcon />
              </Avatar>
              <Typography variant="h4" fontWeight="bold">
                {lapseEvents.filter(e => new Date(e.revealTime) > new Date()).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Reveals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Event Albums */}
      <Grid container spacing={3}>
        {lapseEvents.map((event, index) => (
          <Grid item xs={12} md={6} lg={4} key={event.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main + '20',
                        color: theme.palette.primary.main,
                        mr: 2,
                        width: 48,
                        height: 48,
                      }}
                    >
                      📸
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {event.name}
                      </Typography>
                      <Chip
                        label={event.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={event.isActive ? 'success' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Event Code
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <TextField
                        value={event.code}
                        size="small"
                        InputProps={{ readOnly: true }}
                        sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '1.1rem' } }}
                      />
                      <Button
                        size="small"
                        onClick={() => navigator.clipboard.writeText(event.code)}
                        sx={{ minWidth: 'auto', px: 1 }}
                      >
                        Copy
                      </Button>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Photo Reveal Time
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {new Date(event.revealTime).toLocaleDateString()} at{' '}
                      {new Date(event.revealTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {event.photoCount} photos captured
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      startIcon={<QrCodeIcon />}
                      variant="outlined"
                      sx={{ borderRadius: 2 }}
                    >
                      QR Code
                    </Button>
                    <Button
                      size="small"
                      startIcon={<ShareIcon />}
                      onClick={() => handleShareCode(event.code)}
                      sx={{ borderRadius: 2 }}
                    >
                      Share
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Instructions */}
      <Card elevation={0} sx={{ mt: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            How Lapse Integration Works
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Typography variant="h6" color="primary">1.</Typography>
              </ListItemIcon>
              <ListItemText
                primary="Create Event Albums"
                secondary="Set up separate Lapse albums for each wedding ceremony"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography variant="h6" color="primary">2.</Typography>
              </ListItemIcon>
              <ListItemText
                primary="Share Event Codes"
                secondary="Display QR codes at venues or share codes with guests digitally"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography variant="h6" color="primary">3.</Typography>
              </ListItemIcon>
              <ListItemText
                primary="Timed Photo Reveals"
                secondary="Photos are revealed to everyone simultaneously at scheduled times"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Typography variant="h6" color="primary">4.</Typography>
              </ListItemIcon>
              <ListItemText
                primary="Collect Memories"
                secondary="All photos are compiled into beautiful wedding albums for sharing"
              />
            </ListItem>
          </List>

          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Pro Tip:</strong> Set reveal times 2-3 hours after each ceremony ends to build excitement 
              and ensure all guests have time to take photos before the reveal!
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
} 