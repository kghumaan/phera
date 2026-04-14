'use client';

import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, useTheme, useMediaQuery, IconButton, alpha, CircularProgress } from '@mui/material';
import Image from 'next/image';
import {
  Home,
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
  WhatsApp,
  ViewKanban,
  ArrowBack,
  SupportAgent,
  Radar,
  ChatBubbleOutline,
  Settings,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Wedding } from '@/lib/supabase/wedding-service';
import { Collapse } from '@mui/material';
import { usePlan } from '@/lib/contexts/PlanContext';
import { useNavigationGuard } from '@/lib/contexts/NavigationGuardContext';
import ProBadge from './ProBadge';
import { CheckCircle } from '@mui/icons-material';
import { supabase } from '@/lib/supabase/client';

interface SidebarItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  required?: boolean;
  isPro?: boolean;
}

export interface SidebarGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: SidebarItem[];
  standalone?: boolean;
  isPro?: boolean;
}

export const groups: SidebarGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Home />,
    standalone: true,
    items: [
      { id: 'overview', label: 'Overview', path: '/overview' },
    ],
  },
  {
    id: 'control-tower',
    label: 'Control Tower',
    icon: <Radar />,
    standalone: true,
    items: [
      { id: 'control-tower', label: 'Control Tower', path: '/control-tower' },
    ],
  },
  {
    id: 'guests-group',
    label: 'Guests',
    icon: <People />,
    items: [
      { id: 'guests', label: 'Guest Responses', path: '/guests' },
      { id: 'transportation', label: 'Transportation', path: '/transportation', isPro: true },
      { id: 'concierge', label: 'Guest Concierge', path: '/concierge', isPro: true },
    ],
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: <ViewKanban />,
    items: [
      { id: 'task-manager', label: 'Task Manager', path: '/task-manager', isPro: true },
      { id: 'coordinator', label: 'Vendor Management', path: '/coordinator', isPro: true },
    ],
  },
  {
    id: 'wedding-website',
    label: 'Wedding Website',
    icon: <Language />,
    items: [
      { id: 'details', label: 'Wedding Details', path: '/details', required: true },
      { id: 'design', label: 'Look & Feel', path: '/design', required: true },
      { id: 'schedule', label: 'Schedule & Events', path: '/schedule', required: true },
      { id: 'travel', label: 'Travel & Stay', path: '/travel' },
      { id: 'rsvp-form', label: 'RSVP Form', path: '/rsvp-form' },
      { id: 'faq', label: 'FAQ', path: '/faq' },
      { id: 'registry', label: 'Registry', path: '/registry' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings />,
    items: [
      { id: 'pins', label: 'PIN Management', path: '/pins', required: true },
      { id: 'team', label: 'Collaborators', path: '/team' },
    ],
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
  isPlanner?: boolean;
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
  isPlanner,
}: OnboardingSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const router = useRouter();
  const pathname = usePathname();
  const { isPro } = usePlan();
  const { checkGuard } = useNavigationGuard();
  const [arrowPositions, setArrowPositions] = useState<Record<string, number>>({});
  const [sectionComplete, setSectionComplete] = useState<Record<string, boolean>>({});

  // Check which sections have content
  useEffect(() => {
    if (!wedding?.id) return;
    const wId = wedding.id;
    const slug = wedding.slug;

    // Check wedding-level fields (only for Wedding Website sections)
    const completion: Record<string, boolean> = {
      details: !!(wedding.couple_name && wedding.venue_name && wedding.wedding_date),
      design: !!(wedding.primary_color || wedding.background_image),
      'rsvp-form': true, // Always complete — has default steps
    };

    // Check child tables for content (only Wedding Website sections)
    const checks = [
      { key: 'schedule', query: supabase.from('wedding_schedule').select('id', { count: 'exact', head: true }).eq('wedding_id', wId) },
      { key: 'travel', query: supabase.from('travel_sections' as any).select('id', { count: 'exact', head: true }).eq('wedding_id', wId) },
      { key: 'faq', query: supabase.from('wedding_faqs').select('id', { count: 'exact', head: true }).eq('wedding_id', wId) },
      { key: 'registry', query: supabase.from('wedding_registry').select('id', { count: 'exact', head: true }).eq('wedding_id', wId) },
      { key: 'shopping', query: supabase.from('wedding_shops').select('id', { count: 'exact', head: true }).eq('wedding_id', wId) },
      { key: 'pins', query: (supabase as any).from('guests').select('id', { count: 'exact', head: true }).eq('wedding_id', slug) },
    ];

    Promise.all(checks.map(c => c.query)).then(results => {
      results.forEach((res: any, i) => {
        completion[checks[i].key] = (res.count ?? 0) > 0;
      });
      setSectionComplete(completion);
    });
  }, [wedding?.id, wedding?.slug, wedding?.couple_name, wedding?.venue_name, wedding?.wedding_date, wedding?.primary_color, wedding?.background_image]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    let foundActive = false;

    // Initialize based on current path
    groups.forEach(g => {
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

    // Default: Operations expanded, others collapsed
    if (!foundActive) {
      initialState['coordination'] = true;
      initialState['wedding-website'] = false;
      initialState['settings'] = false;
    }

    return initialState;
  });

  // Expand the correct sidebar group when route changes (e.g. via quick links)
  useEffect(() => {
    groups.forEach(g => {
      if (g.standalone) return;
      const isActive = g.items.some(item => pathname.includes(item.path));
      if (isActive && !expandedGroups[g.id]) {
        setExpandedGroups(prev => ({ ...prev, [g.id]: true }));
      }
    });
  }, [pathname]);

  // Measure active item positions for arrow alignment
  useEffect(() => {
    const timer = setTimeout(() => {
      const newPositions: Record<string, number> = {};
      groups.forEach(group => {
        if (group.standalone) return;
        if (!expandedGroups[group.id]) return;
        const container = document.getElementById(`sidebar-items-${group.id}`);
        if (!container) return;
        const activeItem = container.querySelector('[data-active="true"]') as HTMLElement | null;
        if (activeItem) {
          newPositions[group.id] = activeItem.offsetTop + activeItem.offsetHeight / 2;
        }
      });
      setArrowPositions(newPositions);
    }, 50);
    return () => clearTimeout(timer);
  }, [pathname, expandedGroups]);

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
    if (!checkGuard()) return;
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
        {/* Planner context: couple name + All Weddings button */}
        {isPlanner && (
          <>
            {wedding?.couple_name && (
              <Typography
                variant="body2"
                sx={{
                  px: 2.25,
                  py: 0.5,
                  color: '#1a1a1a',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                {wedding.couple_name}
              </Typography>
            )}
            <ListItemButton
              onClick={() => { if (!checkGuard()) return; router.push('/admin'); }}
              sx={{
                px: 1.5,
                py: 0.75,
                mx: 0.75,
                mb: 0.25,
                borderRadius: '10px',
                color: '#1a1a1a',
                '&:hover': { bgcolor: alpha('#DE3F5E', 0.08) },
              }}
            >
              <ListItemIcon sx={{ minWidth: 28, color: 'inherit', '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}>
                <ArrowBack />
              </ListItemIcon>
              <ListItemText
                primary="All Weddings"
                slotProps={{ primary: { variant: 'body3', sx: { fontWeight: 600, color: 'inherit' } } }}
              />
            </ListItemButton>
          </>
        )}
        {groups.map((group) => {
          // ... existing mapping logic ...
          if (group.standalone) {
            const item = group.items[0];
            const isActive = pathname.endsWith(item.path) || pathname.endsWith(item.path + '/') || pathname.includes(item.path + '/');
            return (
              <ListItemButton
                key={group.id}
                data-tour={`tour-${group.id}`}
                onClick={() => {
                  handleItemClick(item, true);
                }}
                selected={isActive}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  mx: 0.75,
                  mb: 0.25,
                  borderRadius: '10px',
                  color: isActive ? 'white' : '#1a1a1a',
                  '&:hover': { bgcolor: alpha('#DE3F5E', 0.08) },
                  '&.Mui-selected': {
                    bgcolor: '#DE3F5E',
                    color: 'white',
                    '&:hover': { bgcolor: '#C8365A' },
                    '& .MuiListItemIcon-root': { color: 'white' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 28, color: 'inherit', '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}>{group.icon}</ListItemIcon>
                <ListItemText
                  primary={group.label}
                  slotProps={{ primary: { variant: 'body3', sx: { fontWeight: 600, color: 'inherit' } } }}
                />
                {group.isPro && !isPro && <ProBadge size="small" />}
              </ListItemButton>
            );
          }

          const isExpanded = expandedGroups[group.id] ?? true;
          const isGroupActive = group.items.some(item => pathname.endsWith(item.path) || pathname.endsWith(item.path + '/') || pathname.includes(item.path + '/'));

          return (
            <Box key={group.id} data-tour-group={group.id} sx={{ mb: 1 }}>
              {/* Parent Item */}
              <ListItemButton
                data-tour={`tour-${group.id}`}
                onClick={() => handleToggleGroup(group.id)}
                selected={isGroupActive}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  mx: 0.75,
                  mb: 0.25,
                  borderRadius: '10px',
                  color: isGroupActive ? 'white' : '#1a1a1a',
                  '&:hover': { bgcolor: isGroupActive ? '#C8365A' : alpha('#000', 0.02) },
                  '&.Mui-selected': {
                    bgcolor: '#DE3F5E',
                    color: 'white',
                    '&:hover': { bgcolor: '#C8365A' },
                    '& .MuiListItemIcon-root': { color: 'white' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 28, color: 'inherit', '& .MuiSvgIcon-root': { fontSize: '1.1rem' } }}>{group.icon}</ListItemIcon>
                <ListItemText
                  primary={group.label}
                  slotProps={{ primary: { variant: 'body3', sx: { fontWeight: 600, color: 'inherit' } } }}
                />
                {isExpanded ? (
                  <ExpandLess sx={{ fontSize: 14, color: 'inherit' }} />
                ) : (
                  <ExpandMore sx={{ fontSize: 14, color: 'inherit' }} />
                )}
              </ListItemButton>

              {/* Subitems with Curved Connector */}
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box id={`sidebar-items-${group.id}`} sx={{ position: 'relative', ml: 3.5 }}>
                  {/* SVG Curved Connector */}
                  {(() => {
                    const curveEndY = arrowPositions[group.id];
                    const hasActive = curveEndY !== undefined && curveEndY > 0;

                    return (
                      <Box
                        component="svg"
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: 20,
                          height: '100%',
                          overflow: 'visible',
                        }}
                      >
                        {hasActive && (
                          <path
                            d={`M 0 0 L 0 ${curveEndY - 8} Q 0 ${curveEndY} 8 ${curveEndY} L 14 ${curveEndY}`}
                            fill="none"
                            stroke={alpha('#000', 0.15)}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        )}
                        {/* Arrow head */}
                        {hasActive && (
                          <path
                            d={`M 10 ${curveEndY - 3} L 14 ${curveEndY} L 10 ${curveEndY + 3}`}
                            fill="none"
                            stroke={alpha('#000', 0.15)}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                      </Box>
                    );
                  })()}

                  {group.items.map((item) => {
                    const isActive = pathname.endsWith(item.path) || pathname.endsWith(item.path + '/') || pathname.includes(item.path + '/');
                    return (
                      <Box key={item.id} data-active={isActive ? 'true' : undefined} sx={{ position: 'relative' }}>
                        <ListItemButton
                          {...(['build-ai', 'pins', 'guests'].includes(item.id) ? { 'data-tour': `tour-${item.id}` } : {})}
                          onClick={() => {
                            handleItemClick(item, false, group.id);
                          }}
                          selected={isActive}
                          sx={{
                            ml: 1.25,
                            mr: 0.75,
                            mb: 0.5,
                            py: 0.5,
                            pr: 1,
                            borderRadius: '6px',
                            color: '#6a6a6a',
                            minHeight: 30,
                            '&:hover': { bgcolor: alpha('#DE3F5E', 0.05) },
                            '&.Mui-selected': {
                              bgcolor: 'transparent',
                              color: '#DE3F5E',
                              '&:hover': { bgcolor: alpha('#DE3F5E', 0.05) },
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              item.required && !isActive && !item.isPro ? (
                                <Box component="span" sx={{ display: 'inline' }}>
                                  {item.label}<Box component="span" sx={{ color: 'inherit' }}>*</Box>
                                </Box>
                              ) : item.label
                            }
                            slotProps={{
                              primary: {
                                variant: 'body3',
                                sx: {
                                  fontWeight: isActive ? 600 : 400,
                                  color: 'inherit',
                                }
                              }
                            }}
                          />
                          {group.id === 'wedding-website' && sectionComplete[item.id] && (
                            <CheckCircle sx={{ fontSize: 14, color: '#DE3F5E', ml: 0.5, flexShrink: 0 }} />
                          )}
                          {item.isPro && !isPro && <ProBadge size="small" />}
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
              width: 220,
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
            width: 220,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 220,
              boxSizing: 'border-box',
              bgcolor: 'white', // Solid white
              borderRight: `1px solid ${alpha('#000', 0.1)}`,
              top: { xs: 48, md: 56 }, // Offset by Top Nav height
              height: { xs: 'calc(100% - 48px)', md: 'calc(100% - 56px)' },
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

