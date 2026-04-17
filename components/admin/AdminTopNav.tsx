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
} from '@mui/material';
import { PrimaryActionButton, ActionButton } from './ActionButton';
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
import { isDemoUser } from '@/lib/demo/coordinator-mock-data';

import { Wedding } from '@/lib/supabase/wedding-service';
import FeatureRequestModal from './FeatureRequestModal';
import UpgradeModal from './UpgradeModal';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import AutoSaveIndicator from './AutoSaveIndicator';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import { COLORS, RADII } from '@/lib/theme/tokens';

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
    const { status: autoSaveStatus, message: autoSaveMessage, showStatus } = useAutoSaveStatus();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [featureModalOpen, setFeatureModalOpen] = React.useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
    const [homeModalOpen, setHomeModalOpen] = React.useState(false);
    const [signOutModalOpen, setSignOutModalOpen] = React.useState(false);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const isDemo = isDemoUser();

    const handleSignOut = () => {
        handleMenuClose();
        setSignOutModalOpen(true);
    };

    const confirmSignOut = () => {
        setSignOutModalOpen(false);
        signOut();
        router.push('/');
    };

    const handleExitDemo = () => {
        handleMenuClose();
        sessionStorage.removeItem('phera_demo_mode');
        sessionStorage.removeItem('demo-wedding-slug');
        sessionStorage.removeItem('demo-tour-step');
        // Fire signOut without awaiting — AuthContext updates user state
        // synchronously, the supabase network call finishes in background.
        // Awaiting here was blocking the router.push long enough that the
        // first attempt appeared to do nothing.
        signOut();
        router.push('/');
    };

    const handleClearData = async () => {
        if (isViewOnly || !wedding?.id) return;
        const confirmed = window.confirm('Are you sure you want to clear all events, schedule, FAQ and registry data for this wedding? This cannot be undone.');
        if (!confirmed) return;

        const success = await weddingService.clearWeddingContent(wedding.id);
        if (success) {
            showStatus('saved', 'Test data cleared successfully');
            // Hard refresh to clear state
            window.location.reload();
        } else {
            showStatus('error', 'Failed to clear test data');
        }
    };

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: '#ffffff !important',
                color: COLORS.text.strong,
                borderBottom: '1px solid',
                borderColor: alpha(COLORS.text.strong, 0.08),
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
                                color: COLORS.text.strong,
                                '&:hover': { bgcolor: alpha(COLORS.brand.primary, 0.05) }
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
                    <AutoSaveIndicator status={autoSaveStatus} message={autoSaveMessage} />

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
                                color: COLORS.text.strong,
                                bgcolor: alpha(COLORS.brand.primary, 0.05),
                                border: '1px solid',
                                borderColor: alpha(COLORS.brand.primary, 0.1),
                                '&:hover': {
                                    bgcolor: alpha(COLORS.brand.primary, 0.1),
                                    borderColor: alpha(COLORS.brand.primary, 0.2),
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
                            bgcolor: alpha(COLORS.brand.primary, 0.05),
                            px: 1.5,
                            py: 0,
                            borderRadius: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1px solid',
                            borderColor: alpha(COLORS.brand.primary, 0.1),
                            '&:hover': {
                                bgcolor: alpha(COLORS.brand.primary, 0.1),
                                borderColor: alpha(COLORS.brand.primary, 0.2),
                            },
                        }}
                    >
                        <SettingsOutlined sx={{ fontSize: 20, color: COLORS.text.strong }} />
                        <Avatar
                            sx={{
                                width: 28,
                                height: 28,
                                bgcolor: user?.avatar_color || COLORS.brand.primary,
                                color: COLORS.text.inverse,
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
                                color: isPro ? COLORS.brand.primary : COLORS.text.subtle,
                                cursor: isPro ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                            }}
                        >
                            {isPro && <AutoAwesome sx={{ fontSize: 14, color: COLORS.brand.primary }} />}
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
                                borderRadius: RADII.dialog,
                                minWidth: 280,
                                p: 1,
                                bgcolor: COLORS.bg.white,
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
                                    bgcolor: user?.avatar_color || COLORS.brand.primary,
                                    color: COLORS.text.inverse,
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
                                {isDemo ? 'Demo Mode' : user?.email}
                            </Typography>

                            {/* Plan Display */}
                            <Chip
                                icon={isPro ? <AutoAwesome sx={{ fontSize: 14, color: 'white !important' }} /> : undefined}
                                label={isPro ? 'Pro Plan' : 'Basic Plan'}
                                onClick={() => !isPro && setUpgradeModalOpen(true)}
                                sx={{
                                    mt: 1.5,
                                    bgcolor: isPro ? COLORS.brand.primary : '#f0f0f0',
                                    color: isPro ? COLORS.bg.white : COLORS.text.subtle,
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    cursor: isPro ? 'default' : 'pointer',
                                    '&:hover': {
                                        bgcolor: isPro ? COLORS.brand.primary : '#e5e5e5',
                                    },
                                    '& .MuiChip-icon': {
                                        color: COLORS.text.inverse,
                                    },
                                }}
                            />
                        </Box>

                        {/* <Divider sx={{ my: 1, opacity: 0.6 }} /> */}

                        {/* Dev Tools - Only visible to super admins */}
                        {(user?.email === 'kv.s.ghumaan@gmail.com' || user?.email === 'simran@simmetrystudios.com') && (
                            <Box sx={{ px: 2, py: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.text.subtle }}>
                                            Test Mode
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.75rem', color: COLORS.text.faint }}>
                                            Toggle plan for testing
                                        </Typography>
                                    </Box>
                                    <Switch
                                        checked={isPro}
                                        onChange={(e) => { e.stopPropagation(); togglePlan(); }}
                                        size="small"
                                        sx={{
                                            '& .MuiSwitch-switchBase': { color: COLORS.text.faint },
                                            '& .MuiSwitch-track': { bgcolor: COLORS.text.faint },
                                            '& .MuiSwitch-switchBase.Mui-checked': {
                                                color: COLORS.brand.primary,
                                            },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                backgroundColor: COLORS.brand.primary,
                                            },
                                        }}
                                    />
                                </Box>
                                <ActionButton
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    onClick={handleClearData}
                                    sx={{
                                        mt: 1,
                                        borderRadius: '100px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        borderWidth: '1.5px',
                                        borderColor: 'rgba(0, 0, 0, 0.3)',
                                        color: COLORS.text.muted,
                                        '&:hover': {
                                            borderWidth: '1.5px',
                                            borderColor: COLORS.text.strong,
                                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                                        },
                                    }}
                                >
                                    Clear Local Data
                                </ActionButton>
                            </Box>
                        )}

                        {/* <Divider sx={{ my: 1, opacity: 0.6 }} /> */}

                        {/* Menu Items */}
                        <ListItemButton onClick={handleMenuClose} sx={{ borderRadius: RADII.md, py: 1.2, mx: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <SettingsOutlined sx={{ color: '#111111', fontSize: 22 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Settings"
                                primaryTypographyProps={{ sx: { fontWeight: 500, fontSize: '0.95rem', color: '#111111' } }}
                            />
                        </ListItemButton>

                        <ListItemButton onClick={handleMenuClose} sx={{ borderRadius: RADII.md, py: 1.2, mx: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <ChatBubbleOutline sx={{ color: '#111111', fontSize: 22 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Contact Us"
                                primaryTypographyProps={{ sx: { fontWeight: 500, fontSize: '0.95rem', color: '#111111' } }}
                            />
                        </ListItemButton>

                        <ListItemButton onClick={handleMenuClose} sx={{ borderRadius: RADII.md, py: 1.2, mx: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <HelpOutline sx={{ color: '#111111', fontSize: 22 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Help"
                                primaryTypographyProps={{ sx: { fontWeight: 500, fontSize: '0.95rem', color: '#111111' } }}
                            />
                        </ListItemButton>

                        {/* <Divider sx={{ my: 1, opacity: 0.6 }} /> */}

                        {isDemo ? (
                            <ListItemButton
                                onClick={handleExitDemo}
                                sx={{
                                    borderRadius: RADII.md,
                                    py: 1.2,
                                    mx: 0.5,
                                    color: COLORS.brand.primary,
                                    '&:hover': {
                                        bgcolor: alpha(COLORS.brand.primary, 0.05),
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Logout sx={{ color: COLORS.brand.primary, fontSize: 22 }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Exit Demo"
                                    primaryTypographyProps={{ sx: { fontWeight: 600, fontSize: '0.9rem' } }}
                                />
                            </ListItemButton>
                        ) : (
                            <ListItemButton
                                onClick={handleSignOut}
                                sx={{
                                    borderRadius: RADII.md,
                                    py: 1.2,
                                    mx: 0.5,
                                    color: COLORS.brand.primary,
                                    '&:hover': {
                                        bgcolor: alpha(COLORS.brand.primary, 0.05),
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Logout sx={{ color: COLORS.brand.primary, fontSize: 22 }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Sign Out"
                                    primaryTypographyProps={{ sx: { fontWeight: 600, fontSize: '0.9rem' } }}
                                />
                            </ListItemButton>
                        )}
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
                        borderRadius: RADII.dialog,
                        p: { xs: 2, md: 3 },
                        textAlign: 'center',
                        maxWidth: '400px'
                    }
                }}
            >
                <DialogTitle sx={{
                    fontWeight: 600,
                    fontSize: '1.8rem',
                    color: COLORS.text.strong,
                    pb: 1
                }}>
                    Leave Admin Dashboard?
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ color: COLORS.text.subtle, fontSize: '1rem', mb: 1 }}>
                        You are about to be taken to the Home page. Any unsaved data may be lost.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 2 }}>
                    <PrimaryActionButton
                        onClick={() => {
                            setHomeModalOpen(false);
                            if (isDemo) {
                                sessionStorage.removeItem('phera_demo_mode');
                                sessionStorage.removeItem('demo-wedding-slug');
                                sessionStorage.removeItem('demo-tour-step');
                                signOut();
                            }
                            router.push('/');
                        }}
                        sx={{
                            fontSize: '0.95rem',
                            px: 4,
                            py: 1,
                            boxShadow: '0 4px 12px rgba(222, 63, 94, 0.3)',
                        }}
                    >
                        Go Home
                    </PrimaryActionButton>
                    <Button
                        onClick={() => setHomeModalOpen(false)}
                        sx={{
                            color: COLORS.text.subtle,
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            borderRadius: RADII.md,
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

            {/* Sign Out confirmation */}
            <Dialog
                open={signOutModalOpen}
                onClose={() => setSignOutModalOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: RADII.dialog,
                        p: { xs: 2, md: 3 },
                        textAlign: 'center',
                        maxWidth: '400px'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600, fontSize: '1.8rem', color: COLORS.text.strong, pb: 1 }}>
                    Sign Out?
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ color: COLORS.text.subtle, fontSize: '1rem', mb: 1 }}>
                        You will be signed out and taken to the home page.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 2 }}>
                    <PrimaryActionButton
                        onClick={confirmSignOut}
                        sx={{
                            fontSize: '0.95rem',
                            px: 4,
                            py: 1,
                            boxShadow: '0 4px 12px rgba(222, 63, 94, 0.3)',
                        }}
                    >
                        Sign Out
                    </PrimaryActionButton>
                    <Button
                        onClick={() => setSignOutModalOpen(false)}
                        sx={{
                            color: COLORS.text.subtle,
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            borderRadius: RADII.md,
                            px: 3,
                            py: 1,
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.08)' },
                        }}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </AppBar>
    );
}
