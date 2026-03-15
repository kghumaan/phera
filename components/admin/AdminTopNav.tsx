'use client';

import React from 'react';
import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    Avatar,
    Button,
    IconButton,
    alpha,
    useTheme,
    useMediaQuery,
    Menu,
    MenuItem,
    Divider,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Switch,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
} from '@mui/material';
import {
    Menu as MenuIcon,
    SettingsOutlined,
    ChatBubbleOutline,
    HelpOutline,
    Logout,
    KeyboardArrowDown,
    AutoAwesome,
} from '@mui/icons-material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePlan } from '@/lib/contexts/PlanContext';
import { weddingService } from '@/lib/supabase/wedding-service';
import { toast } from 'sonner';

import { Wedding } from '@/lib/supabase/wedding-service';
import FeatureRequestModal from './FeatureRequestModal';
import UpgradeModal from './UpgradeModal';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import AutoSaveIndicator from './AutoSaveIndicator';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';

interface AdminTopNavProps {
    weddingSlug: string;
    wedding?: Wedding;
    onMenuToggle?: () => void;
}

export default function AdminTopNav({ weddingSlug, wedding, onMenuToggle }: AdminTopNavProps) {
    const theme = useTheme();
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { plan, isPro, togglePlan } = usePlan();
    const { isViewOnly } = useAdminRole();
    const { status: autoSaveStatus } = useAutoSaveStatus();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [featureModalOpen, setFeatureModalOpen] = React.useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
    const [homeModalOpen, setHomeModalOpen] = React.useState(false);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleSignOut = async () => {
        handleMenuClose();
        await signOut();
        router.push('/');
    };

    const handleClearData = async () => {
        if (isViewOnly || !wedding?.id) return;
        const confirmed = window.confirm('Are you sure you want to clear all events, schedule, FAQ and registry data for this wedding? This cannot be undone.');
        if (!confirmed) return;

        const success = await weddingService.clearWeddingContent(wedding.id);
        if (success) {
            toast.success('Test data cleared successfully');
            // Hard refresh to clear state
            window.location.reload();
        } else {
            toast.error('Failed to clear test data');
        }
    };

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: '#ffffff !important',
                color: '#1a1a1a',
                borderBottom: '1px solid',
                borderColor: alpha('#000', 0.08),
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 48, md: 56 }, px: { xs: 1, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Mobile Menu Toggle */}
                    {isMobile && (
                        <IconButton
                            size="small"
                            onClick={onMenuToggle}
                            sx={{
                                color: '#1a1a1a',
                                '&:hover': { bgcolor: alpha('#DE3F5E', 0.05) }
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    {/* Left: Logo */}
                    <Box
                        onClick={() => setHomeModalOpen(true)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            gap: 1.5,
                            ml: { xs: 0, lg: 1 },
                            '&:hover': { opacity: 0.8 },
                        }}
                    >
                        <Box sx={{ position: 'relative', width: { xs: 80, md: 110 }, height: 34 }}>
                            <Image
                                src="/logo.svg"
                                alt="Phera"
                                fill
                                style={{ objectFit: 'contain', filter: 'brightness(0)' }}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Right: Auto-save indicator, Feature Request Button & User Avatar */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Auto-save indicator */}
                    <AutoSaveIndicator status={autoSaveStatus} />

                    {/* Feature Request Button */}
                    {!isMobile && (
                        <Button
                            onClick={() => setFeatureModalOpen(true)}
                            startIcon={<span>👋</span>}
                            sx={{
                                mr: 1,
                                height: 34,
                                px: 1.5,
                                py: 0,
                                minWidth: 0,
                                borderRadius: 1,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                color: '#1a1a1a',
                                bgcolor: alpha('#DE3F5E', 0.05),
                                border: '1px solid',
                                borderColor: alpha('#DE3F5E', 0.1),
                                '&:hover': {
                                    bgcolor: alpha('#DE3F5E', 0.1),
                                    borderColor: alpha('#DE3F5E', 0.2),
                                }
                            }}
                        >
                            Want a feature you don't see?
                        </Button>
                    )}

                    <Box
                        onClick={handleMenuClick}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            height: 34,
                            bgcolor: alpha('#DE3F5E', 0.05),
                            px: 1.5,
                            py: 0,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1px solid',
                            borderColor: alpha('#DE3F5E', 0.1),
                            '&:hover': {
                                bgcolor: alpha('#DE3F5E', 0.1),
                                borderColor: alpha('#DE3F5E', 0.2),
                            },
                        }}
                    >
                        <SettingsOutlined sx={{ fontSize: 20, color: '#1a1a1a' }} />
                        <Avatar
                            sx={{
                                width: 28,
                                height: 28,
                                bgcolor: user?.avatar_color || '#DE3F5E',
                                color: 'white',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                border: '2px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            }}
                        >
                            {user?.avatar_svg ? (
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
                                user?.initials || user?.email?.[0].toUpperCase() || 'U'
                            )}
                        </Avatar>
                        <Typography
                            onClick={(e) => {
                                if (!isPro) {
                                    e.stopPropagation();
                                    setUpgradeModalOpen(true);
                                }
                            }}
                            sx={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: isPro ? '#DE3F5E' : '#666',
                                cursor: isPro ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                            }}
                        >
                            {isPro && <AutoAwesome sx={{ fontSize: 14, color: '#DE3F5E' }} />}
                            {isPro ? 'Pro' : 'Basic'}
                        </Typography>
                    </Box>

                    {/* User Menu */}
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleMenuClose}
                        onClick={handleMenuClose}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                                mt: 1.5,
                                borderRadius: '24px',
                                minWidth: 280,
                                p: 1,
                                bgcolor: 'white',
                                '& .MuiAvatar-root': {
                                    width: 64,
                                    height: 64,
                                    mb: 2,
                                },
                            },
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        {/* Menu Header */}
                        <Box sx={{ p: 2.5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Avatar
                                sx={{
                                    bgcolor: user?.avatar_color || '#DE3F5E',
                                    color: 'white',
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    mb: 1,
                                }}
                            >
                                {user?.avatar_svg ? (
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
                                    user?.initials || user?.email?.[0].toUpperCase() || 'U'
                                )}
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111111', lineHeight: 1.2 }}>
                                {wedding?.couple_name || 'Your Wedding'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#444444', mt: 0.5, fontSize: '0.875rem' }}>
                                {user?.email}
                            </Typography>

                            {/* Plan Display */}
                            <Chip
                                icon={isPro ? <AutoAwesome sx={{ fontSize: 14, color: 'white !important' }} /> : undefined}
                                label={isPro ? 'Pro Plan' : 'Basic Plan'}
                                onClick={() => !isPro && setUpgradeModalOpen(true)}
                                sx={{
                                    mt: 1.5,
                                    bgcolor: isPro ? '#DE3F5E' : '#f0f0f0',
                                    color: isPro ? 'white' : '#666',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    cursor: isPro ? 'default' : 'pointer',
                                    '&:hover': {
                                        bgcolor: isPro ? '#DE3F5E' : '#e5e5e5',
                                    },
                                    '& .MuiChip-icon': {
                                        color: 'white',
                                    },
                                }}
                            />
                        </Box>

                        {/* <Divider sx={{ my: 1, opacity: 0.6 }} /> */}

                        {/* Dev Tools - Only visible to super admins */}
                        {(user?.email === 'kv.s.ghumaan@gmail.com' || user?.email === 'savani.simran@google.com') && (
                            <Box sx={{ px: 2, py: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>
                                            Test Mode
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#999' }}>
                                            Toggle plan for testing
                                        </Typography>
                                    </Box>
                                    <Switch
                                        checked={isPro}
                                        onChange={togglePlan}
                                        size="small"
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: '#DE3F5E',
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: '#DE3F5E',
                                            },
                                        }}
                                    />
                                </Box>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={handleClearData}
                                    sx={{
                                        mt: 1,
                                        borderRadius: '100px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        borderWidth: '2px',
                                        '&:hover': {
                                            borderWidth: '2px',
                                            bgcolor: alpha(theme.palette.error.main, 0.05)
                                        }
                                    }}
                                >
                                    Clear Local Data
                                </Button>
                            </Box>
                        )}

                        {/* <Divider sx={{ my: 1, opacity: 0.6 }} /> */}

                        {/* Menu Items */}
                        <ListItemButton onClick={handleMenuClose} sx={{ borderRadius: '12px', py: 1.2, mx: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <SettingsOutlined sx={{ color: '#111111', fontSize: 22 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Settings"
                                primaryTypographyProps={{ sx: { fontWeight: 500, fontSize: '0.95rem', color: '#111111' } }}
                            />
                        </ListItemButton>

                        <ListItemButton onClick={handleMenuClose} sx={{ borderRadius: '12px', py: 1.2, mx: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <ChatBubbleOutline sx={{ color: '#111111', fontSize: 22 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Contact Us"
                                primaryTypographyProps={{ sx: { fontWeight: 500, fontSize: '0.95rem', color: '#111111' } }}
                            />
                        </ListItemButton>

                        <ListItemButton onClick={handleMenuClose} sx={{ borderRadius: '12px', py: 1.2, mx: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <HelpOutline sx={{ color: '#111111', fontSize: 22 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Help"
                                primaryTypographyProps={{ sx: { fontWeight: 500, fontSize: '0.95rem', color: '#111111' } }}
                            />
                        </ListItemButton>

                        {/* <Divider sx={{ my: 1, opacity: 0.6 }} /> */}

                        {(() => {
                            const isDemoUser = user?.email === 'demo@phera.io';
                            return (
                                <Tooltip
                                    title={isDemoUser ? "You're viewing the demo — sign out is disabled" : ''}
                                    placement="left"
                                    arrow
                                >
                                    <span>
                                        <ListItemButton
                                            onClick={handleSignOut}
                                            disabled={isDemoUser}
                                            sx={{
                                                borderRadius: '12px',
                                                py: 1.2,
                                                mx: 0.5,
                                                color: isDemoUser ? '#aaa' : '#DE3F5E',
                                                '&:hover': {
                                                    bgcolor: isDemoUser ? 'transparent' : alpha('#DE3F5E', 0.05),
                                                },
                                                '&.Mui-disabled': {
                                                    opacity: 0.5,
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                <Logout sx={{ color: isDemoUser ? '#aaa' : '#DE3F5E', fontSize: 22 }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Sign Out"
                                                primaryTypographyProps={{ sx: { fontWeight: 600, fontSize: '0.9rem' } }}
                                            />
                                        </ListItemButton>
                                    </span>
                                </Tooltip>
                            );
                        })()}
                    </Menu>
                </Box>
            </Toolbar>
            <FeatureRequestModal
                open={featureModalOpen}
                onClose={() => setFeatureModalOpen(false)}
                weddingId={wedding?.id}
            />
            <UpgradeModal
                open={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
            />
            <Dialog
                open={homeModalOpen}
                onClose={() => setHomeModalOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                        p: { xs: 2, md: 3 },
                        textAlign: 'center',
                        maxWidth: '400px'
                    }
                }}
            >
                <DialogTitle sx={{
                    fontWeight: 600,
                    fontSize: '1.8rem',
                    color: '#1a1a1a',
                    pb: 1
                }}>
                    Leave Admin Dashboard?
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ color: '#666', fontSize: '1rem', mb: 1 }}>
                        You are about to be taken to the Home page. Any unsaved data may be lost.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 2 }}>
                    <Button
                        onClick={() => {
                            setHomeModalOpen(false);
                            router.push('/');
                        }}
                        variant="contained"
                        sx={{
                            bgcolor: '#DE3F5E',
                            color: 'white',
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            px: 4,
                            py: 1,
                            boxShadow: '0 4px 12px rgba(222, 63, 94, 0.3)',
                            '&:hover': {
                                bgcolor: '#C8365A',
                                boxShadow: '0 6px 16px rgba(222, 63, 94, 0.4)',
                            },
                        }}
                    >
                        Go Home
                    </Button>
                    <Button
                        onClick={() => setHomeModalOpen(false)}
                        sx={{
                            color: '#666',
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            borderRadius: '12px',
                            px: 3,
                            py: 1,
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.08)',
                            }
                        }}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </AppBar>
    );
}
