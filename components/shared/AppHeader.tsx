'use client';

import { 
  Box, 
  Container, 
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowBack, Logout as LogoutIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';
import WhatsAppChannelModal from '@/components/shared/WhatsAppChannelModal';

interface AppHeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  title?: string;
  variant?: 'transparent' | 'solid';
  onLoginClick?: () => void;
}

export default function AppHeader({ 
  showBackButton = false, 
  backHref = '/',
  title,
  variant = 'transparent',
  onLoginClick
}: AppHeaderProps) {
  const { user, isLoading, hasRSVPed, rsvpResponse, signOut } = useAuth();
  
  // Only show WhatsApp button if user has RSVP'd "yes" or "maybe"
  const shouldShowWhatsApp = hasRSVPed && (rsvpResponse === 'yes' || rsvpResponse === 'maybe');
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [rsvpMenuAnchor, setRsvpMenuAnchor] = useState<HTMLElement | null>(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserMenuAnchor(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
    py: 2,
  } : {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    pt: 2,
  };

  return (
    <>
      <Box sx={headerSx}>
        <Container 
          maxWidth={false}
          sx={{
            maxWidth: { xs: 361, md: 600, lg: 700 },
            px: { xs: 2, md: 3 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              gap: 2,
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
                <Image
                  src="/logo.svg"
                  alt="Phera Logo"
                  width={40}
                  height={40}
                  priority
                  style={{
                    height: 'auto',
                    maxHeight: '40px',
                    width: 'auto',
                    filter: 'brightness(0)',
                  }}
                />
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
                      width: 32,
                      height: 32,
                      backgroundColor: '#000',
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: '#333',
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
                    </svg>
                  </IconButton>
                )}

                {/* RSVP Status Button - Show when user has RSVPed */}
                {hasRSVPed && rsvpResponse && (
                  <Button
                    variant="contained"
                    onClick={(e) => setRsvpMenuAnchor(e.currentTarget)}
                    sx={{
                      backgroundColor: '#000',
                      color: '#fff',
                      borderRadius: '20px',
                      px: 2.5,
                      py: 0.5,
                      fontSize: '0.875rem',
                      fontWeight: 400,
                      letterSpacing: '7.142857142857142%',
                      textTransform: 'none',
                      minHeight: 32,
                      fontFamily: 'Outfit',
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
                    width: 32,
                    height: 32,
                    backgroundColor: user.avatar_color,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem',
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
                  variant="contained"
                  onClick={onLoginClick}
                  sx={{
                    backgroundColor: '#000',
                    color: '#fff',
                    borderRadius: '24px',
                    px: 3,
                    py: 1,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    minWidth: 80,
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
          <MenuItem 
            onClick={handleSignOut}
            sx={{
              color: '#666',
              gap: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <LogoutIcon fontSize="small" />
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
            href="/rsvp"
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