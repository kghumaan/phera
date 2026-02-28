'use client';

import { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Card, 
  CardContent,
} from '@mui/material';
import LapseIntegration from '@/components/shared/LapseIntegration';
import SettingsIcon from '@mui/icons-material/Settings';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <SettingsIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Settings & Integrations
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Configure your wedding platform integrations and settings
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            sx={{ px: 2 }}
          >
            <Tab 
              icon={<WhatsAppIcon />} 
              label="WhatsApp Groups" 
              sx={{ minHeight: 64 }}
            />
            <Tab 
              icon={<PhotoCameraIcon />} 
              label="Lapse Photo Sharing" 
              sx={{ minHeight: 64 }}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{  }}>
              WhatsApp Community Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Create and manage WhatsApp groups for different wedding guest categories. 
              Share invite links and QR codes to build your wedding community.
            </Typography>
            
            <Box sx={{ 
              p: 4, 
              textAlign: 'center', 
              border: '2px dashed', 
              borderColor: 'divider', 
              borderRadius: 3,
              bgcolor: 'action.hover' 
            }}>
              <WhatsAppIcon sx={{ fontSize: 64, color: '#25D366', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                WhatsApp Integration Coming Soon
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This feature will allow you to manage wedding WhatsApp groups, 
                generate invite links, and create QR codes for easy sharing.
              </Typography>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <LapseIntegration />
          </Box>
        </TabPanel>
      </Card>
    </Container>
  );
} 