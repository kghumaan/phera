'use client';

import {
  Box,
  Container,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowBack, Logout as LogoutIcon, Edit as EditIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import WhatsAppChannelModal from '@/components/shared/WhatsAppChannelModal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { getCurrentWeddingId } from '@/lib/utils/wedding-id-helpers';

interface AppHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
  variant?: 'transparent' | 'solid';
}

export default function AppHeader({
  showBackButton = false,
  backHref = '/',
  title,
  variant = 'transparent',
}: AppHeaderProps) {
  const { user, isLoading, hasRSVPed, rsvpResponse, signOut, isAdmin, adminWeddingSlug } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Check if we're on the landing page
  const isLandingPage = pathname === '/';
  // Check if we're on a wedding page (desktop layout needs full width header)
  const isWeddingPage = pathname?.includes('/') && pathname !== '/' && !pathname.includes('/admin');

  // Get the current wedding slug for RSVP link
  const weddingSlug = getCurrentWeddingId();

  // Only show WhatsApp button if user has RSVP'd "yes" or "maybe" AND not on landing page
  const shouldShowWhatsApp = !isLandingPage && hasRSVPed && (rsvpResponse === 'yes' || rsvpResponse === 'maybe');
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [rsvpMenuAnchor, setRsvpMenuAnchor] = useState<HTMLElement | null>(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isNavigatingToAdmin, setIsNavigatingToAdmin] = useState(false);
  const [showScrolledNav, setShowScrolledNav] = useState(false);

  useEffect(() => {
    if (!isLandingPage) return;
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingUp = currentScrollY < lastScrollY;
      if (currentScrollY < 80) {
        setShowScrolledNav(false);
      } else if (scrollingUp) {
        setShowScrolledNav(true);
      } else {
        setShowScrolledNav(false);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLandingPage]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setUserMenuAnchor(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleAdminDashboardClick = () => {
    setIsNavigatingToAdmin(true);
    setUserMenuAnchor(null);
    router.push(`/admin/${adminWeddingSlug}/overview`);
  };

  const formatRSVPResponse = (response: 'yes' | 'no' | 'maybe' | null): string => {
    switch (response) {
      case 'yes': return 'Going';
      case 'no': return 'Not Going';
      case 'maybe': return 'Maybe';
      default: return 'RSVP';
    }
  };

  const headerSx = variant === 'solid' ? {
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'flex-start',
  } : isLandingPage && showScrolledNav ? {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    height: { xs: 64, md: 96 },
    display: 'flex',
    alignItems: 'center',
    background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 100%)',
    '@keyframes slideDown': {
      from: { transform: 'translateY(-100%)' },
      to: { transform: 'translateY(0)' },
    },
    animation: 'slideDown 0.3s ease forwards',
  } : {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    display: 'flex',
    alignItems: 'flex-start',
  };

  return (
    <>
      {/* Full Screen Loading Overlay for Admin Navigation */}
      {isNavigatingToAdmin && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <LoadingSpinner message="Heading to your dashboard..." />
        </Box>
      )}

      <Box sx={headerSx}>
        <Container
          maxWidth={false}
          sx={{
            maxWidth: isLandingPage || isWeddingPage ? '100%' : { xs: '100%', sm: 361, md: 600, lg: 700 },
            width: '100%',
            px: { xs: 2, md: 4 },
            pt: { xs: 2, md: 4 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              gap: { xs: 2, md: 3 },
            }}
          >
            {/* Left side - Back button + Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {showBackButton && (
                <IconButton
                  component={Link}
                  href={backHref}
                  sx={{
                    backgroundColor: '#000',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#333',
                    },
                  }}
                >
                  <ArrowBack />
                </IconButton>
              )}

              {/* Logo */}
              <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    width: { xs: 100, sm: 120, md: 128 },
                    height: { xs: 40, sm: 48, md: 48 },
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    src="/logo.svg"
                    alt="Phera Logo"
                    fill
                    priority
                    style={{
                      objectFit: 'contain',
                      filter: 'brightness(0)',
                    }}
                  />
                </Box>
              </Link>
            </Box>

            {/* Right side - WhatsApp + RSVP Status / User Avatar / Login Button */}
            {isLoading ? (
              <Box sx={{ width: 80, height: 40 }} /> // Loading placeholder
            ) : user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* WhatsApp Button - Only show if user RSVP'd yes or maybe */}
                {shouldShowWhatsApp && (
                  <IconButton
                    onClick={() => setWhatsAppModalOpen(true)}
                    sx={{
                      width: { xs: 32, md: 45 },
                      height: { xs: 32, md: 45 },
                      backgroundColor: '#000',
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: '#333',
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Box
                      component="svg"
                      sx={{
                        width: { xs: 16, md: 22 },
                        height: { xs: 16, md: 22 },
                      }}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516" />
                    </Box>
                  </IconButton>
                )}

                {/* RSVP Status Button - Show when user has RSVPed AND not on landing page */}
                {!isLandingPage && hasRSVPed && rsvpResponse && (
                  <Button
                    variant="contained"
                    onClick={(e) => setRsvpMenuAnchor(e.currentTarget)}
                    sx={{
                      backgroundColor: '#000',
                      color: '#fff',
                      borderRadius: { xs: '20px', md: '28px' },
                      px: { xs: 2.5, md: 3.6 },
                      py: { xs: 0.5, md: 1.2 },
                      fontSize: { xs: '0.875rem', md: '0.9rem' },
                      fontWeight: 400,
                      letterSpacing: '7.142857142857142%',
                      textTransform: 'none',
                      minHeight: { xs: 32, md: 45 },
                      '&:hover': {
                        backgroundColor: '#333',
                      },
                    }}
                  >
                    {formatRSVPResponse(rsvpResponse)}
                  </Button>
                )}

                {/* User Avatar - Circular only */}
                <Avatar
                  onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  sx={{
                    width: { xs: 32, md: 45 },
                    height: { xs: 32, md: 45 },
                    backgroundColor: user.avatar_color,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', md: '1.04rem' },
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {user.avatar_svg ? (
                    <Box
                      dangerouslySetInnerHTML={{ __html: user.avatar_svg }}
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '& svg': {
                          width: '100%',
                          height: '100%',
                        },
                      }}
                    />
                  ) : (
                    user.initials
                  )}
                </Avatar>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* WhatsApp Button - Hidden for non-authenticated users since they can't have RSVP'd */}

                <Button
                  component={Link}
                  href={`/auth/login?redirect=${encodeURIComponent(pathname || '/')}`}
                  variant="contained"
                  sx={{
                    backgroundColor: '#000',
                    color: '#fff',
                    borderRadius: { xs: '24px', md: '28px' },
                    px: { xs: 3, md: 4 },
                    py: { xs: 1, md: 1.2 },
                    fontSize: { xs: '0.9rem', md: '0.9rem' },
                    fontWeight: 500,
                    textTransform: 'none',
                    minWidth: { xs: 80, md: 96 },
                    minHeight: { xs: 40, md: 45 },
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    '&:hover': {
                      backgroundColor: '#333',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    },
                  }}
                >
                  Login
                </Button>
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      {/* User Menu */}
      {user && (
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={() => setUserMenuAnchor(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              mt: 1,
            },
          }}
        >
          {/* User Email Info */}
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              mb: 0.5,
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'none'
            }}
          >
            {/* <Box
              sx={{
                color: '#999',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 0.5
              }}
            >
              Signed in as
            </Box> */}
            <Box
              sx={{
                color: '#333',
                fontSize: '13px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '200px'
              }}
            >
              {user.email}
            </Box>
          </Box>

          {/* Admin Dashboard - Show if user is admin */}
          {isAdmin && adminWeddingSlug && (
            <MenuItem
              onClick={handleAdminDashboardClick}
              disabled={isNavigatingToAdmin}
              sx={{
                color: '#666',
                gap: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              {isNavigatingToAdmin ? (
                <CircularProgress size={18} sx={{ color: '#666' }} />
              ) : (
                <DashboardIcon fontSize="small" />
              )}
              Admin Dashboard
            </MenuItem>
          )}

          <MenuItem
            onClick={handleSignOut}
            disabled={isSigningOut}
            sx={{
              color: '#666',
              gap: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            {isSigningOut ? (
              <CircularProgress size={18} sx={{ color: '#666' }} />
            ) : (
              <LogoutIcon fontSize="small" />
            )}
            Sign Out
          </MenuItem>
        </Menu>
      )}

      {/* RSVP Menu */}
      {user && hasRSVPed && rsvpResponse && (
        <Menu
          anchorEl={rsvpMenuAnchor}
          open={Boolean(rsvpMenuAnchor)}
          onClose={() => setRsvpMenuAnchor(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              mt: 1,
            },
          }}
        >
          <MenuItem
            component={Link}
            href={`/${weddingSlug}/rsvp`}
            onClick={() => setRsvpMenuAnchor(null)}
            sx={{
              color: '#666',
              gap: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <EditIcon fontSize="small" />
            Change RSVP?
          </MenuItem>
        </Menu>
      )}

      {/* WhatsApp Channel Modal */}
      <WhatsAppChannelModal
        open={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />
    </>
  );
} 