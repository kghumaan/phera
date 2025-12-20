'use client';

import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, useTheme, useMediaQuery, IconButton, alpha, CircularProgress } from '@mui/material';
import Image from 'next/image';
import {
  Home,
  Event,
  Schedule,
  Flight,
  HelpOutline,
  CardGiftcard,
  ShoppingBag,
  Palette,
  Settings,
  VpnKey,
  Menu as MenuIcon,
  Close,
  People,
  Edit,
  Groups,
  AirportShuttle,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Wedding } from '@/lib/supabase/wedding-service';

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  required?: boolean;
}

const sections: SidebarSection[] = [
  { id: 'overview', label: 'Overview', icon: <Home />, path: '/overview', required: true },
  { id: 'guests', label: 'Guest Responses', icon: <People />, path: '/guests' },
  { id: 'details', label: 'Wedding Details', icon: <Edit />, path: '/details', required: true },
  { id: 'events', label: 'Events', icon: <Event />, path: '/events', required: true },
  { id: 'schedule', label: 'Schedule', icon: <Schedule />, path: '/schedule', required: true },
  { id: 'design', label: 'Look & Feel', icon: <Palette />, path: '/design', required: true },
  { id: 'travel', label: 'Travel & Stay', icon: <Flight />, path: '/travel' },
  { id: 'travel-coordination', label: 'Travel Coordination', icon: <AirportShuttle />, path: '/travel-coordination' },
  { id: 'faq', label: 'FAQ', icon: <HelpOutline />, path: '/faq' },
  { id: 'registry', label: 'Registry', icon: <CardGiftcard />, path: '/registry' },
  { id: 'shopping', label: 'Shopping Guide', icon: <ShoppingBag />, path: '/shopping' },
  { id: 'pins', label: 'PIN Management', icon: <VpnKey />, path: '/pins', required: true },
  { id: 'team', label: 'Team', icon: <Groups />, path: '/team' },
  { id: 'settings', label: 'Publish', icon: <Settings />, path: '/settings', required: true },
];

interface OnboardingSidebarProps {
  weddingSlug: string;
  wedding?: Wedding;
  onNavigating?: (isNavigating: boolean) => void;
}

export default function OnboardingSidebar({ weddingSlug, wedding, onNavigating }: OnboardingSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const calculateProgress = (wedding?: Wedding): number => {
    if (!wedding) return 0;
    
    const requiredFields = [
      wedding.couple_name && wedding.couple_name !== 'To be determined',
      wedding.bride_name,
      wedding.groom_name,
      wedding.wedding_date_display && wedding.wedding_date_display !== 'To be determined',
      wedding.venue_name && wedding.venue_name !== 'To be determined',
      wedding.venue_location && wedding.venue_location !== 'To be determined',
      wedding.rsvp_deadline && wedding.rsvp_deadline !== 'To be determined',
      wedding.couple_image_url,
    ];
    
    const completed = requiredFields.filter(Boolean).length;
    return Math.round((completed / requiredFields.length) * 100);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSectionClick = (section: SidebarSection) => {
    // Immediately show loading state
    onNavigating?.(true);
    
    router.push(`/admin/onboarding/${weddingSlug}${section.path}`);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo and Progress Indicator Section */}
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderBottom: 1, borderColor: alpha('#000', 0.05) }}>
        {/* Phera Logo */}
        <Box
          sx={{
            position: 'relative',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            src="/logo.svg"
            alt="Phera"
            fill
            priority
            style={{
              objectFit: 'contain',
            }}
          />
        </Box>

        {/* Progress Circle */}
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          {/* Background circle (track) */}
          <CircularProgress
            variant="determinate"
            value={100}
            size={96}
            thickness={5}
            sx={{
              color: 'rgba(222, 63, 94, 0.15)',
              position: 'absolute',
            }}
          />
          {/* Progress circle */}
          <CircularProgress
            variant="determinate"
            value={calculateProgress(wedding)}
            size={96}
            thickness={5}
            sx={{
              color: '#DE3F5E',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#DE3F5E' }}>
              {calculateProgress(wedding)}%
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
            }}
          >
            <Close />
          </IconButton>
        )}
      </Box>

      {/* Navigation List */}
      <List sx={{ flex: 1, py: 2 }}>
        {sections
          .filter((section) => {
            // Only show Guest Responses if wedding status is 'live'
            if (section.id === 'guests') {
              return wedding?.status === 'live';
            }
            return true;
          })
          .map((section) => {
            const isActive = pathname.endsWith(section.path) || pathname.endsWith(section.path + '/');

            return (
              <ListItemButton
                key={section.id}
                onClick={() => handleSectionClick(section)}
                selected={isActive}
                sx={{
                  mx: 1,
                  mb: 0.5,
                  borderRadius: '12px',
                  color: '#4a4a4a',
                  '&:hover': {
                    bgcolor: alpha('#DE3F5E', 0.08),
                  },
                  '&.Mui-selected': {
                    bgcolor: '#DE3F5E',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#C8365A',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'inherit' : '#DE3F5E',
                  }}
                >
                  {section.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>{section.label}</span>
                      {section.required && (
                        <Box
                          component="span"
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: isActive ? 'white' : '#DE3F5E',
                            display: 'inline-block',
                          }}
                        />
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{
                    sx: {
                      fontWeight: isActive ? 600 : 500,
                    }
                  }}
                />
              </ListItemButton>
            );
          })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: alpha('#000', 0.1) }}>
        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#6a6a6a' }}>
          Progress auto-saves
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
            }}
          />
          <Typography variant="caption" sx={{ color: '#6a6a6a' }}>
            All changes saved
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1200,
            bgcolor: alpha('#fff', 0.95),
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              bgcolor: alpha('#fff', 0.98),
            },
          }}
        >
          <MenuIcon sx={{ color: '#1a1a1a' }} />
        </IconButton>
      )}

      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              bgcolor: alpha('#fff', 0.98),
              backdropFilter: 'blur(20px)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        // Desktop Drawer
        <Drawer
          variant="permanent"
          sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              bgcolor: alpha('#fff', 0.7),
              backdropFilter: 'blur(20px)',
              borderRight: `1px solid ${alpha('#000', 0.1)}`,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}

function Stack(props: any) {
  return <Box sx={{ display: 'flex', ...props.sx }} {...props} />;
}

