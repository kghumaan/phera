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
    Divider,
    ListItemButton,
    ListItemIcon,
    ListItemText,
        Chip,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { PrimaryActionButton, ActionButton } from './ActionButton';
import { PheraMenu, PheraMenuItem } from '@/components/shared/Menu';
import {
    Menu as MenuIcon,
    SettingsOutlined,
    ChatBubbleOutline,
    Logout,
    KeyboardArrowDown,
    AutoAwesome,
} from '@mui/icons-material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePlan } from '@/lib/contexts/PlanContext';
import { weddingService } from '@/lib/supabase/wedding-service';
import { generateAvatar } from '@/lib/utils/avatar-generator';
import { isDemoUser } from '@/lib/demo/coordinator-mock-data';
import { isSuperAdminEmail } from '@/lib/constants/super-admins';

import { Wedding } from '@/lib/supabase/wedding-service';
import FeatureRequestModal from './FeatureRequestModal';
import HopOnCallModal from './HopOnCallModal';
import UpgradeModal from './UpgradeModal';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import AutoSaveIndicator from './AutoSaveIndicator';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';
import { PheraSwitch } from '@/components/shared/Switch';

interface AdminTopNavProps {
    weddingSlug: string;
    wedding?: Wedding;
    onMenuToggle?: () => void;
}

export default function AdminTopNav({ weddingSlug, wedding, onMenuToggle }: AdminTopNavProps) {
    const theme = useTheme();
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { isPro, isPlanner, togglePlan, setAccountType } = usePlan();
    const { isViewOnly } = useAdminRole();
    const { status: autoSaveStatus, message: autoSaveMessage, showStatus } = useAutoSaveStatus();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [featureModalOpen, setFeatureModalOpen] = React.useState(false);
    const [hopOnCallModalOpen, setHopOnCallModalOpen] = React.useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
    const [homeModalOpen, setHomeModalOpen] = React.useState(false);
    const [signOutModalOpen, setSignOutModalOpen] = React.useState(false);
    const [deleteAccountModalOpen, setDeleteAccountModalOpen] = React.useState(false);
    const [deletingAccount, setDeletingAccount] = React.useState(false);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const isDemo = isDemoUser();

    // Always show the shapes avatar — for accounts with no stored avatar yet
    // (fresh signups, anonymous planner sessions) generate one from the stable
    // user id instead of falling back to a letter initial.
    const avatarSvg = React.useMemo(() => {
        if (user?.avatar_svg) return user.avatar_svg;
        if (user?.id) return generateAvatar({ seed: user.id }).svg;
        return null;
    }, [user?.avatar_svg, user?.id]);

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

    const handleTogglePlanner = async () => {
        await setAccountType(isPlanner ? 'couple' : 'planner');
        // Layout + planner nav read account_type on mount — hard reload keeps them in sync.
        window.location.reload();
    };

    const confirmDeleteAccount = async () => {
        setDeletingAccount(true);
        try {
            const res = await fetch('/api/account/delete', { method: 'DELETE' });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.error || 'Failed to delete account');
            signOut();
            router.push('/auth/signup');
        } catch (e) {
            setDeletingAccount(false);
            setDeleteAccountModalOpen(false);
            showStatus('error', e instanceof Error ? e.message : 'Failed to delete account');
        }
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

                    {/* Hop-on-a-call + Feature Request buttons. Both are
                        desktop-only — mobile already has the menu drawer. */}
                    {!isMobile && (
                        <Button
                            onClick={() => setHopOnCallModalOpen(true)}
                            startIcon={<span>📞</span>}
                            sx={{
                                height: 34,
                                px: 1.5,
                                py: 0,
                                minWidth: 0,
                                borderRadius: 1,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                color: COLORS.text.strong,
                                bgcolor: alpha(COLORS.brand.primary, 0.05),
                                border: '1px solid',
                                borderColor: alpha(COLORS.brand.primary, 0.1),
                                '&:hover': {
                                    bgcolor: alpha(COLORS.brand.primary, 0.1),
                                    borderColor: alpha(COLORS.brand.primary, 0.2),
                                },
                            }}
                        >
                            Let&apos;s hop on a call
                        </Button>
                    )}

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
                                fontSize: '0.875rem',
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
                            Want a feature you don&apos;t see?
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
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                border: '2px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            }}
                        >
                            {avatarSvg ? (
                                <Box
                                    dangerouslySetInnerHTML={{ __html: avatarSvg }}
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
                            sx={{
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: isPro ? COLORS.brand.primary : COLORS.text.subtle,
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
                    <PheraMenu
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
                                {avatarSvg ? (
                                    <Box
                                        dangerouslySetInnerHTML={{ __html: avatarSvg }}
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
                            {/* No wedding name / email until they have a real
                                account — anonymous planner sessions only get
                                the guest-preview hint. */}
                            {!user?.is_anonymous && (
                                <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.text.strong, lineHeight: 1.2 }}>
                                    {wedding?.couple_name || 'Your Wedding'}
                                </Typography>
                            )}
                            <Typography variant="body2" sx={{ color: COLORS.text.muted, mt: 0.5, fontSize: '0.875rem' }}>
                                {isDemo ? 'Demo Mode' : user?.is_anonymous ? 'Guest preview — not saved yet' : user?.email}
                            </Typography>

                            {/* Plan Display */}
                            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                                <Chip
                                    icon={isPro ? <AutoAwesome sx={{ fontSize: 14, color: 'white !important' }} /> : undefined}
                                    label={isPro ? 'Pro Plan' : 'Basic Plan'}
                                    sx={{
                                        bgcolor: isPro ? COLORS.brand.primary : COLORS.border.faint,
                                        color: isPro ? COLORS.bg.white : COLORS.text.subtle,
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        cursor: 'default',
                                        '& .MuiChip-icon': { color: COLORS.text.inverse },
                                    }}
                                />
                                {!isPro && (
                                    <Typography
                                        component="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMenuClose();
                                            setUpgradeModalOpen(true);
                                        }}
                                        sx={{
                                            border: 'none',
                                            background: 'none',
                                            p: 0,
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: COLORS.brand.primary,
                                            '&:hover': { color: COLORS.brand.primaryHover },
                                        }}
                                    >
                                        Upgrade?
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* <Divider sx={{ my: 1, opacity: 0.6 }} /> */}

                        {/* Dev Tools - Only visible to super admins */}
                        {isSuperAdminEmail(user?.email) && (
                            <Box sx={{ px: 2, py: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.text.subtle }}>
                                            Pro Plan
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.875rem', color: COLORS.text.faint }}>
                                            Toggle free/pro for testing
                                        </Typography>
                                    </Box>
                                    <PheraSwitch
                                        checked={isPro}
                                        onChange={(e) => { e.stopPropagation(); togglePlan(); }}
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: COLORS.text.subtle }}>
                                            Planner Mode
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.875rem', color: COLORS.text.faint }}>
                                            Switch couple/planner account
                                        </Typography>
                                    </Box>
                                    <PheraSwitch
                                        checked={isPlanner}
                                        onChange={(e) => { e.stopPropagation(); handleTogglePlanner(); }}
                                        size="small"
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
                                        fontSize: '0.875rem',
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
                                <ActionButton
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        handleMenuClose();
                                        setDeleteAccountModalOpen(true);
                                    }}
                                    sx={{
                                        mt: 1,
                                        borderRadius: '100px',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        borderWidth: '1.5px',
                                        borderColor: alpha(COLORS.brand.primary, 0.4),
                                        color: COLORS.brand.primary,
                                        '&:hover': {
                                            borderWidth: '1.5px',
                                            borderColor: COLORS.brand.primary,
                                            bgcolor: alpha(COLORS.brand.primary, 0.05),
                                        },
                                    }}
                                >
                                    Delete Account & Restart
                                </ActionButton>
                            </Box>
                        )}

                        {/* <Divider sx={{ my: 1, opacity: 0.6 }} /> */}

                        {/* Menu Items — Settings + Help removed; Contact Us
                            now routes to the dedicated /support page. */}
                        <ListItemButton
                            onClick={() => {
                                handleMenuClose();
                                router.push(`/admin/${weddingSlug}/support`);
                            }}
                            sx={{ borderRadius: RADII.md, py: 1.2, mx: 0.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <ChatBubbleOutline sx={{ color: COLORS.text.strong, fontSize: 22 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Contact us"
                                primaryTypographyProps={{ sx: { fontWeight: 500, fontSize: '0.95rem', color: COLORS.text.strong } }}
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
                                    primary={user?.is_anonymous ? 'Discard preview & start over' : 'Sign Out'}
                                    primaryTypographyProps={{ sx: { fontWeight: 600, fontSize: '0.9rem' } }}
                                />
                            </ListItemButton>
                        )}
                    </PheraMenu>
                </Box>
            </Toolbar>
            <FeatureRequestModal
                open={featureModalOpen}
                onClose={() => setFeatureModalOpen(false)}
                weddingId={wedding?.id}
            />
            <HopOnCallModal
                open={hopOnCallModalOpen}
                onClose={() => setHopOnCallModalOpen(false)}
            />
            <UpgradeModal
                open={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
            />
            <PheraDialog
                open={homeModalOpen}
                onClose={() => setHomeModalOpen(false)}
                PaperProps={{ sx: { p: { xs: 2, md: 3 }, textAlign: 'center', maxWidth: '400px' } }}
            >
                <PheraDialogTitle
                    onClose={() => setHomeModalOpen(false)}
                    sx={{ justifyContent: 'center', pb: 1 }}
                >
                    Leave Admin Dashboard?
                </PheraDialogTitle>
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
            </PheraDialog>

            {/* Sign Out confirmation */}
            <PheraDialog
                open={signOutModalOpen}
                onClose={() => setSignOutModalOpen(false)}
                PaperProps={{ sx: { p: { xs: 2, md: 3 }, textAlign: 'center', maxWidth: '400px' } }}
            >
                <PheraDialogTitle
                    onClose={() => setSignOutModalOpen(false)}
                    sx={{ justifyContent: 'center', pb: 1 }}
                >
                    {user?.is_anonymous ? 'Discard this preview?' : 'Sign Out?'}
                </PheraDialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ color: COLORS.text.subtle, fontSize: '1rem', mb: 1 }}>
                        {user?.is_anonymous
                            ? "This wedding isn't saved to an account yet — signing out discards it for good. To keep everything, create your free account from the Planner chat instead."
                            : 'You will be signed out and taken to the home page.'}
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
                        {user?.is_anonymous ? 'Discard preview' : 'Sign Out'}
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
            </PheraDialog>

            {/* Delete Account confirmation (super-admin dev tool) */}
            <PheraDialog
                open={deleteAccountModalOpen}
                onClose={() => { if (!deletingAccount) setDeleteAccountModalOpen(false); }}
                PaperProps={{ sx: { p: { xs: 2, md: 3 }, textAlign: 'center', maxWidth: '440px' } }}
            >
                <PheraDialogTitle
                    onClose={() => { if (!deletingAccount) setDeleteAccountModalOpen(false); }}
                    sx={{ justifyContent: 'center', pb: 1 }}
                >
                    Delete Account & Restart?
                </PheraDialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ color: COLORS.text.subtle, fontSize: '1rem', mb: 1 }}>
                        This permanently deletes your account ({user?.email}), every wedding you own and all its data.
                        You&apos;ll be signed out and can sign up again to go through onboarding fresh. This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 2 }}>
                    <PrimaryActionButton
                        onClick={confirmDeleteAccount}
                        disabled={deletingAccount}
                        sx={{
                            fontSize: '0.95rem',
                            px: 4,
                            py: 1,
                            boxShadow: '0 4px 12px rgba(222, 63, 94, 0.3)',
                        }}
                    >
                        {deletingAccount ? 'Deleting…' : 'Delete Everything'}
                    </PrimaryActionButton>
                    <Button
                        onClick={() => setDeleteAccountModalOpen(false)}
                        disabled={deletingAccount}
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
            </PheraDialog>
        </AppBar>
    );
}
