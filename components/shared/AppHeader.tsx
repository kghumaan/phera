'use client';

import {
  Box,
  Container,
  Button,
  Chip,
  Avatar,
  IconButton,
  CircularProgress,
  Typography
} from '@mui/material';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowBack, Logout as LogoutIcon, Edit as EditIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
// WhatsApp community/channel flow temporarily removed; will return later.
// import WhatsAppChannelModal from '@/components/shared/WhatsAppChannelModal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { getCurrentWeddingId } from '@/lib/utils/wedding-id-helpers';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraMenu, PheraMenuItem } from '@/components/shared/Menu';

interface AppHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
  variant?: 'transparent' | 'solid';
  /**
   * Optional content rendered on the right side of the header, just before
   * the user avatar / login button. Use for per-page controls like a nav
   * Menu toggle that should align with the avatar.
   */
  rightSlot?: React.ReactNode;
  /**
   * When true, suppresses the right-side controls (avatar, RSVP status,
   * login button). Used by the desktop vertical-scroll wedding layout where
   * the avatar + status live inside the page's nav drawer instead.
   */
  hideAuthControls?: boolean;
}

export default function AppHeader({
  showBackButton = false,
  backHref = '/',
  title,
  variant = 'transparent',
  rightSlot,
  hideAuthControls = false,
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

  // WhatsApp button temporarily removed; flag preserved for later reinstatement.
  // const shouldShowWhatsApp = !isLandingPage && hasRSVPed && (rsvpResponse === 'yes' || rsvpResponse === 'maybe');
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [rsvpMenuAnchor, setRsvpMenuAnchor] = useState<HTMLElement | null>(null);
  // const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isNavigatingToAdmin, setIsNavigatingToAdmin] = useState(false);
  // True once the landing page has been scrolled past ~80px. Drives the
  // header's smooth padding contraction + cream blur background reveal.
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavigatingToLogin, setIsNavigatingToLogin] = useState(false);

  useEffect(() => {
    if (!isLandingPage) return;
    const onScroll = () => setIsScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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

  const isLandingTransparent = variant !== 'solid' && isLandingPage;

  const headerSx = variant === 'solid' ? {
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'flex-start',
  } : isLandingTransparent ? {
    // Design pattern: header is always fixed on the landing page. At the top
    // of the page the logo + nav sit heavily inset from the edges with a
    // transparent background. As soon as the user scrolls past ~80px the
    // padding contracts to flush with the edges and a cream blur background
    // fades in. Both the slide and the bg fade run on a 350ms cubic-ease so
    // the icons appear to glide outward / inward as you scroll up and down.
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    // Match design's `.site-header` rule:
    //   initial: padding: 18px clamp(180px, 18vw, 260px)
    //   scrolled: padding: 12px clamp(20px, 4vw, 48px)
    //   mobile @max 768: 14px 20px / 10px 20px
    // Single clamp() per axis replaces the prior breakpoint-stepped
    // `{ xs: 1.25, md: 1.5 }` ladder.
    py: isScrolled ? '12px' : '18px',
    px: isScrolled ? 'clamp(20px, 4vw, 48px)' : 'clamp(180px, 18vw, 260px)',
    bgcolor: isScrolled ? 'rgba(247, 241, 232, 0.85)' : 'transparent',
    backdropFilter: isScrolled ? 'blur(16px)' : 'blur(0px)',
    WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'blur(0px)',
    borderBottom: '1px solid',
    borderBottomColor: isScrolled ? 'rgba(0,0,0,0.06)' : 'transparent',
    transition:
      'padding 0.35s ease, background-color 0.35s ease, backdrop-filter 0.35s ease, -webkit-backdrop-filter 0.35s ease, border-bottom-color 0.35s ease',
    '@media (max-width: 768px)': {
      py: isScrolled ? '10px' : '14px',
      px: '20px',
    },
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
            // Landing-transparent: outer Box drives padding via clamp(),
            // so the Container itself stays edge-to-edge here.
            px: isLandingTransparent
              ? 0
              : isLandingPage
                ? 'clamp(180px, 18vw, 260px)'
                : { xs: 2, md: 4 },
            // When the outer header drives its own py, drop the Container's
            // pt so spacing isn't doubled.
            pt: isLandingTransparent ? 0 : { xs: 2, md: 4 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: isLandingPage
                ? { xs: 'center', md: 'space-between' }
                : 'space-between',
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
                    backgroundColor: COLORS.text.strong,
                    color: COLORS.text.inverse,
                    '&:hover': {
                      backgroundColor: COLORS.text.strong,
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

            {/* Right side — on landing page, hide on mobile and render as floating bottom-right element below.
                When `hideAuthControls` is set, the entire right cluster is
                suppressed (the consuming page renders auth controls itself,
                e.g. inside a nav drawer). */}
            {!hideAuthControls && (
            <Box
              sx={{
                display: isLandingPage ? { xs: 'none', md: 'flex' } : 'flex',
                alignItems: 'center',
              }}
            >
            {isLoading ? (
              <Box sx={{ width: 80, height: 40 }} /> // Loading placeholder
            ) : user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {rightSlot}
                {/* WhatsApp Button — temporarily removed; community/channel
                    flow will be re-introduced in a later iteration.
                {shouldShowWhatsApp && (
                  <IconButton
                    onClick={() => setWhatsAppModalOpen(true)}
                    sx={{
                      width: { xs: 32, md: 45 },
                      height: { xs: 32, md: 45 },
                      backgroundColor: COLORS.text.strong,
                      color: COLORS.text.inverse,
                      '&:hover': {
                        backgroundColor: COLORS.text.strong,
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
                */}

                {/* RSVP Status Button - Show when user has RSVPed AND not on landing page */}
                {!isLandingPage && hasRSVPed && rsvpResponse && (
                  <Button
                    variant="contained"
                    onClick={(e) => setRsvpMenuAnchor(e.currentTarget)}
                    sx={{
                      backgroundColor: COLORS.text.strong,
                      color: COLORS.text.inverse,
                      borderRadius: { xs: '20px', md: '28px' },
                      px: { xs: 2.5, md: 3.6 },
                      py: { xs: 0.5, md: 1.2 },
                      fontSize: { xs: '0.875rem', md: '0.9rem' },
                      fontWeight: 400,
                      letterSpacing: '7.142857142857142%',
                      textTransform: 'none',
                      minHeight: { xs: 32, md: 45 },
                      '&:hover': {
                        backgroundColor: COLORS.text.strong,
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
                    color: COLORS.text.inverse,
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
                {rightSlot}
                {/* WhatsApp Button - Hidden for non-authenticated users since they can't have RSVP'd */}

                <Button
                  component={Link}
                  href={`/auth/login?redirect=${encodeURIComponent(pathname || '/')}`}
                  onClick={() => setIsNavigatingToLogin(true)}
                  disabled={isNavigatingToLogin}
                  variant="contained"
                  sx={{
                    backgroundColor: COLORS.text.strong,
                    color: COLORS.text.inverse,
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
                      backgroundColor: COLORS.text.strong,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: COLORS.text.strong,
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box component="span" sx={{ visibility: isNavigatingToLogin ? 'hidden' : 'visible' }}>Login</Box>
                    {isNavigatingToLogin && (
                      <CircularProgress size={20} sx={{ color: COLORS.text.inverse, position: 'absolute' }} />
                    )}
                  </Box>
                </Button>
              </Box>
            )}
            </Box>
            )}
          </Box>
        </Container>
      </Box>

      {/* Landing + mobile: floating auth control at bottom-right, slides in from the right. */}
      {isLandingPage && !isLoading && (
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: 1200,
            alignItems: 'center',
            '@keyframes slideInFromRight': {
              from: { transform: 'translateX(120%)', opacity: 0 },
              to: { transform: 'translateX(0)', opacity: 1 },
            },
            animation: 'slideInFromRight 0.35s ease-out',
          }}
        >
          {user ? (
            <Avatar
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{
                width: 52,
                height: 52,
                backgroundColor: user.avatar_color,
                color: COLORS.text.inverse,
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
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
                    '& svg': { width: '100%', height: '100%' },
                  }}
                />
              ) : (
                user.initials
              )}
            </Avatar>
          ) : (
            <Button
              component={Link}
              href={`/auth/login?redirect=${encodeURIComponent(pathname || '/')}`}
              onClick={() => setIsNavigatingToLogin(true)}
              disabled={isNavigatingToLogin}
              variant="contained"
              sx={{
                backgroundColor: COLORS.text.strong,
                color: COLORS.text.inverse,
                borderRadius: '28px',
                px: 3.5,
                py: 1.25,
                fontSize: '0.95rem',
                fontWeight: 500,
                textTransform: 'none',
                minWidth: 96,
                minHeight: 48,
                boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                '&:hover': {
                  backgroundColor: COLORS.text.strong,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                },
                '&.Mui-disabled': { backgroundColor: COLORS.text.strong },
              }}
            >
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box component="span" sx={{ visibility: isNavigatingToLogin ? 'hidden' : 'visible' }}>Login</Box>
                {isNavigatingToLogin && (
                  <CircularProgress size={20} sx={{ color: COLORS.text.inverse, position: 'absolute' }} />
                )}
              </Box>
            </Button>
          )}
        </Box>
      )}

      {/* User Menu */}
      {user && (
        <PheraMenu
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
          MenuListProps={{ sx: { py: 0 } }}
          PaperProps={{
            sx: {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: 1,
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
              // mb: 0.5,
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'none'
            }}
          >
            {/* <Box
              sx={{
                color: COLORS.text.faint,
                fontSize: '14px',
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
                color: COLORS.text.strong,
                fontSize: '14px',
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
            <PheraMenuItem
              onClick={handleAdminDashboardClick}
              disabled={isNavigatingToAdmin}
              sx={{
                color: COLORS.text.subtle,
                gap: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              {isNavigatingToAdmin ? (
                <CircularProgress size={18} sx={{ color: COLORS.text.subtle }} />
              ) : (
                <DashboardIcon fontSize="small" />
              )}
              <Typography sx={{ fontSize: '0.875rem' }}>Admin Dashboard</Typography>
            </PheraMenuItem>
          )}

          <PheraMenuItem
            onClick={handleSignOut}
            disabled={isSigningOut}
            sx={{
              color: COLORS.text.subtle,
              gap: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            {isSigningOut ? (
              <CircularProgress size={18} sx={{ color: COLORS.text.subtle }} />
            ) : (
              <LogoutIcon fontSize="small" />
            )}
            <Typography sx={{ fontSize: '0.875rem' }}>Sign Out</Typography>
          </PheraMenuItem>
        </PheraMenu>
      )}

      {/* RSVP Menu */}
      {user && hasRSVPed && rsvpResponse && (
        <PheraMenu
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
          <PheraMenuItem
            component={Link}
            href={`/${weddingSlug}/rsvp`}
            onClick={() => setRsvpMenuAnchor(null)}
            sx={{
              color: COLORS.text.subtle,
              gap: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <EditIcon fontSize="small" />
            Change RSVP?
          </PheraMenuItem>
        </PheraMenu>
      )}

      {/* WhatsApp Channel Modal — temporarily removed.
      <WhatsAppChannelModal
        open={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />
      */}
    </>
  );
} 