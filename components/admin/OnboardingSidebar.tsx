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
  VpnKey,
  Menu as MenuIcon,
  Close,
  People,
  Edit,
  Groups,
  AirportShuttle,
  Publish,
  Language,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Wedding } from '@/lib/supabase/wedding-service';
import { Collapse } from '@mui/material';

interface SidebarItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  required?: boolean;
}

interface SidebarGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: SidebarItem[];
  standalone?: boolean;
}

const groups: SidebarGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Home />,
    standalone: true,
    items: [
      { id: 'overview', label: 'Overview', path: '/overview' }
    ]
  },
  {
    id: 'website',
    label: 'Wedding Website',
    icon: <Language />,
    items: [
      { id: 'details', label: 'Wedding Details', path: '/details', required: true },
      { id: 'design', label: 'Look & Feel', path: '/design', required: true },
      { id: 'events', label: 'Events', path: '/events', required: true },
      { id: 'schedule', label: 'Schedule', path: '/schedule', required: true },
      { id: 'travel', label: 'Travel & Stay', path: '/travel' },
      { id: 'faq', label: 'FAQ', path: '/faq' },
      { id: 'registry', label: 'Registry', path: '/registry' },
      { id: 'shopping', label: 'Shopping Guide', path: '/shopping' },
      { id: 'pins', label: 'PIN Management', path: '/pins', required: true },
    ]
  },
  {
    id: 'guest-responses',
    label: 'Guest Responses',
    icon: <People />,
    items: [
      { id: 'guests', label: 'RSVPs', path: '/guests' },
      { id: 'travel-coordination', label: 'Travel Coordination', path: '/travel-coordination' },
    ]
  },
  {
    id: 'team',
    label: 'Team',
    icon: <Groups />,
    standalone: true,
    items: [
      { id: 'team', label: 'Team', path: '/team' }
    ]
  },
];

interface OnboardingSidebarProps {
  weddingSlug: string;
  wedding?: Wedding;
  onNavigating?: (isNavigating: boolean) => void;
  // Publish button props
  weddingStatus?: 'draft' | 'live';
  weddingId?: string;
  onStatusChange?: (status: 'draft' | 'live') => void;
  onSlugChange?: (newSlug: string) => void;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function OnboardingSidebar({
  weddingSlug,
  wedding,
  onNavigating,
  weddingStatus = 'draft',
  weddingId,
  onStatusChange,
  onSlugChange,
  mobileOpen,
  onClose,
}: OnboardingSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const router = useRouter();
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    let foundActive = false;

    // Initialize based on current path
    groups.forEach(g => {
      // Check if any item includes the current path
      const isActive = g.items.some(item => pathname.includes(item.path));

      if (isActive) {
        foundActive = true;
      }

      if (!g.standalone) {
        if (isActive) {
          initialState[g.id] = true;
        } else {
          initialState[g.id] = false;
        }
      }
    });

    // Default to first group if nothing active found
    if (!foundActive && groups.length > 0 && !groups[1]?.standalone) {
      initialState[groups[1].id] = true; // Index 1 is 'website' in the groups array
    }

    return initialState;
  });

  const calculateProgress = (wedding?: Wedding): number => {
    if (!wedding) return 0;

    const requiredFields = [
      wedding.couple_name && wedding.couple_name !== 'TBD' && wedding.couple_name !== 'To be determined',
      wedding.partner1_name,
      wedding.partner2_name,
      wedding.wedding_date_display && wedding.wedding_date_display !== 'TBD' && wedding.wedding_date_display !== 'To be determined',
      wedding.venue_name && wedding.venue_name !== 'TBD' && wedding.venue_name !== 'To be determined',
      wedding.venue_location && wedding.venue_location !== 'TBD' && wedding.venue_location !== 'To be determined',
      wedding.rsvp_deadline && wedding.rsvp_deadline !== 'TBD' && wedding.rsvp_deadline !== 'To be determined',
      wedding.couple_image_url,
    ];

    const completed = requiredFields.filter(Boolean).length;
    return Math.round((completed / requiredFields.length) * 100);
  };

  const handleToggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const isCurrentlyExpanded = prev[groupId] ?? true;
      // Collapse everything else, toggle the current one
      const newState: Record<string, boolean> = {};
      groups.forEach(g => {
        if (!g.standalone) {
          newState[g.id] = g.id === groupId ? !isCurrentlyExpanded : false;
        }
      });
      return newState;
    });
  };

  const handleItemClick = (item: SidebarItem, collapseAll = false, groupId?: string) => {
    onNavigating?.(true);
    router.push(`/admin/${weddingSlug}${item.path}`);

    if (collapseAll) {
      // Collapse all groups
      const newState: Record<string, boolean> = {};
      groups.forEach(g => {
        if (!g.standalone) {
          newState[g.id] = false;
        }
      });
      setExpandedGroups(newState);
    } else if (groupId) {
      // Expand only the clicked group
      const newState: Record<string, boolean> = {};
      groups.forEach(g => {
        if (!g.standalone) {
          newState[g.id] = (g.id === groupId);
        }
      });
      setExpandedGroups(newState);
    }

    if (isMobile) onClose();
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Groups */}
      <Box sx={{ flex: 1, py: 2, overflowY: 'auto' }}>
        {groups.map((group) => {
          // ... existing mapping logic ...
          if (group.standalone) {
            const item = group.items[0];
            const isActive = pathname.endsWith(item.path) || pathname.endsWith(item.path + '/');
            return (
              <ListItemButton
                key={group.id}
                onClick={() => handleItemClick(item, true)}
                selected={isActive}
                sx={{
                  px: 1.5, // Reduced from 2 to align text with parent items
                  py: 1,
                  mx: 0,
                  mb: 0.5,
                  borderRadius: '12px',
                  color: isActive ? 'white' : '#4a4a4a',
                  '&:hover': { bgcolor: alpha('#DE3F5E', 0.08) },
                  '&.Mui-selected': {
                    bgcolor: '#DE3F5E',
                    color: 'white',
                    '&:hover': { bgcolor: '#C8365A' },
                    '& .MuiListItemIcon-root': { color: 'white' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{group.icon}</ListItemIcon>
                <ListItemText
                  primary={group.label}
                  primaryTypographyProps={{ sx: { fontWeight: isActive ? 600 : 600, fontSize: '0.9rem' } }}
                />
              </ListItemButton>
            );
          }

          const isExpanded = expandedGroups[group.id] ?? true;

          return (
            <Box key={group.id} sx={{ mb: 1 }}>
              {/* Parent Item */}
              <ListItemButton
                onClick={() => handleToggleGroup(group.id)}
                sx={{
                  px: 2,
                  py: 1,
                  color: '#1a1a1a',
                  '&:hover': { bgcolor: alpha('#000', 0.02) },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: '#1a1a1a' }}>{group.icon}</ListItemIcon>
                <ListItemText
                  primary={group.label}
                  primaryTypographyProps={{ sx: { fontWeight: 600, fontSize: '0.9rem' } }}
                />
                {isExpanded ? (
                  <ExpandLess sx={{ fontSize: 18, color: '#6a6a6a' }} />
                ) : (
                  <ExpandMore sx={{ fontSize: 18, color: '#6a6a6a' }} />
                )}
              </ListItemButton>

              {/* Subitems with Connecting Lines */}
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ position: 'relative', ml: 4.5 }}>
                  {/* Vertical Line */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 20, // Stop before the last item's text
                      width: '1px',
                      bgcolor: alpha('#000', 0.08),
                    }}
                  />

                  {group.items.map((item) => {
                    const isActive = pathname.endsWith(item.path) || pathname.endsWith(item.path + '/');
                    return (
                      <Box key={item.id} sx={{ position: 'relative' }}>
                        {/* Horizontal Tick */}
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 0,
                            top: 18,
                            width: 12,
                            height: '1px',
                            bgcolor: alpha('#000', 0.08),
                          }}
                        />

                        <ListItemButton
                          onClick={() => handleItemClick(item, false, group.id)}
                          selected={isActive}
                          sx={{
                            ml: 1.5,
                            mr: 2,
                            mb: 0.5,
                            py: 0.75,
                            borderRadius: '8px',
                            color: '#6a6a6a',
                            minHeight: 36,
                            '&:hover': { bgcolor: alpha('#DE3F5E', 0.05) },
                            '&.Mui-selected': {
                              bgcolor: alpha('#DE3F5E', 0.1),
                              color: '#DE3F5E',
                              '&:hover': { bgcolor: alpha('#DE3F5E', 0.15) },
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span>{item.label}</span>
                                {item.required && !isActive && (
                                  <Box
                                    component="span"
                                    sx={{
                                      width: 4,
                                      height: 4,
                                      borderRadius: '50%',
                                      bgcolor: '#DE3F5E',
                                      display: 'inline-block',
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            primaryTypographyProps={{
                              sx: {
                                fontSize: '0.875rem',
                                fontWeight: isActive ? 600 : 400,
                              }
                            }}
                          />
                        </ListItemButton>
                      </Box>
                    );
                  })}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      {/* Footer with Progress */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: alpha('#000', 0.1) }}>
        {/* Progress Circle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            {/* Background circle (track) */}
            <CircularProgress
              variant="determinate"
              value={100}
              size={80}
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
              size={80}
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
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#DE3F5E' }}>
                {calculateProgress(wedding)}%
              </Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#6a6a6a', textAlign: 'center' }}>
          Progress auto-saves
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
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

        {/* Publish Button */}
        <Box sx={{ mt: 2 }}>
          <Box
            component="button"
            onClick={(e) => {
              e.preventDefault();
              console.log('Sidebar Publish button clicked. Current status:', weddingStatus);
              if (weddingStatus === 'live') {
                if (window.confirm('Are you sure you want to unpublish your wedding website?')) {
                  onStatusChange?.('draft');
                }
              } else {
                if (window.confirm('Are you sure you want to publish your wedding website? It will be visible to all guests with PINs.')) {
                  onStatusChange?.('live');
                }
              }
            }}
            sx={{
              width: '100%',
              py: 1.5,
              px: 2,
              border: 'none',
              borderRadius: '12px',
              bgcolor: weddingStatus === 'live' ? '#10B981' : '#DE3F5E',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: weddingStatus === 'live' ? '#059669' : '#C8365A',
                transform: 'scale(1.02)',
              },
            }}
          >
            <Publish sx={{ fontSize: 20 }} />
            {weddingStatus === 'live' ? 'Published' : 'Publish'}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onClose}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              bgcolor: 'white', // Solid white
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
              bgcolor: 'white', // Solid white
              borderRight: `1px solid ${alpha('#000', 0.1)}`,
              top: { xs: 56, md: 64 }, // Offset by Top Nav height
              height: { xs: 'calc(100% - 56px)', md: 'calc(100% - 64px)' },
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

