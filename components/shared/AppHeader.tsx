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
import { ArrowBack, Logout as LogoutIcon, Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '@/lib/contexts/AuthContext';

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
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [rsvpMenuAnchor, setRsvpMenuAnchor] = useState<HTMLElement | null>(null);

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
        <Container maxWidth="sm">
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
                <Box
                  component="img"
                  src="/logo.svg"
                  alt="Phera Logo"
                  sx={{
                    height: { xs: 32, sm: 40 },
                    width: 'auto',
                    filter: 'brightness(0)',
                  }}
                />
              </Link>
            </Box>
            
            {/* Right side - RSVP Status / User Avatar / Login Button */}
            {isLoading ? (
              <Box sx={{ width: 80, height: 40 }} /> // Loading placeholder
            ) : user ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    width: 30,
                    height: 30,
                    backgroundColor: user.avatar_color,
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
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
    </>
  );
} 