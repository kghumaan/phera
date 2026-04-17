'use client';

import { useState, useEffect, use } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Paper,
  Card,
  CardContent,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  AirportShuttle,
  ArrowForward,
  CheckCircle,
  LockOutlined,
} from '@mui/icons-material';
import { usePlan } from '@/lib/contexts/PlanContext';
import UpgradeModal from '@/components/admin/UpgradeModal';
import { weddingService } from '@/lib/supabase/wedding-service';
import {
  getTransportationSettings,
  createTransportationSettings,
  updateTransportationSettings,
} from '@/lib/supabase/transportation-service';
import { TransportationSettings, TransportationMode } from '@/lib/supabase/types';
import TransportationSetupWizard from '@/components/admin/transportation/TransportationSetupWizard';
import TransportationDashboard from '@/components/admin/transportation/TransportationDashboard';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import EarlyBetaGate from '@/components/admin/EarlyBetaGate';
import { isBetaUser as checkBetaAccess } from '@/lib/utils/beta-access';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import { COLORS, RADII } from '@/lib/theme/tokens';

type WizardStep =
  | 'initial'
  | 'mode-select'
  | 'setup-arrival'
  | 'setup-departure'
  | 'complete'
  | 'dashboard';

export default function TransportationPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isPro } = usePlan();
  const { isViewOnly } = useAdminRole();
  const { user } = useAuth();
  const isBetaUser = checkBetaAccess(user?.email);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<TransportationSettings | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>('initial');

  // Early beta gate: non-beta users (including demo) see the request screen.
  if (!isBetaUser) {
    return (
      <EarlyBetaGate
        featureName="Transportation"
        description="Airport shuttles, venue transfers, and pickup coordination for every guest."
        when={true}
      >
        <></>
      </EarlyBetaGate>
    );
  }

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const loadData = async () => {
    try {
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);
        const transportSettings = await getTransportationSettings(wedding.id);
        setSettings(transportSettings);

        // Determine initial wizard step based on settings
        if (transportSettings?.setup_complete) {
          setWizardStep('dashboard');
        } else if (transportSettings?.mode) {
          // Has started setup but not complete
          if (!transportSettings.arrival_configured) {
            setWizardStep('setup-arrival');
          } else if (!transportSettings.departure_configured) {
            setWizardStep('setup-departure');
          } else {
            setWizardStep('complete');
          }
        } else if (transportSettings) {
          setWizardStep('mode-select');
        } else {
          setWizardStep('initial');
        }
      }
    } catch (err) {
      console.error('Error loading transportation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    if (isViewOnly) return;
    if (!weddingId) return;

    // Create settings if they don't exist
    if (!settings) {
      const newSettings = await createTransportationSettings(weddingId);
      setSettings(newSettings);
    }
    setWizardStep('mode-select');
  };

  const handleModeSelect = async (mode: TransportationMode) => {
    if (isViewOnly) return;
    if (!weddingId) return;

    const updated = await updateTransportationSettings(weddingId, { mode });
    setSettings(updated);
    setWizardStep('setup-arrival');
  };

  const handleArrivalComplete = async () => {
    if (isViewOnly) return;
    if (!weddingId) return;

    const updated = await updateTransportationSettings(weddingId, { arrival_configured: true });
    setSettings(updated);
    setWizardStep('setup-departure');
  };

  const handleDepartureComplete = async () => {
    if (isViewOnly) return;
    if (!weddingId) return;

    const updated = await updateTransportationSettings(weddingId, {
      departure_configured: true,
      setup_complete: true,
    });
    setSettings(updated);
    setWizardStep('complete');
  };

  const handleGoToDashboard = () => {
    setWizardStep('dashboard');
  };

  const handleEditSetup = async () => {
    setWizardStep('setup-arrival');
  };

  const handleRestartSetup = async () => {
    if (isViewOnly) return;
    if (!weddingId) return;
    const updated = await updateTransportationSettings(weddingId, {
      setup_complete: false,
      arrival_configured: false,
      departure_configured: false,
      mode: null,
    });
    setSettings(updated);
    setWizardStep('mode-select');
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress sx={{ color: COLORS.brand.primary }} />
        </Box>
      </Box>
    );
  }

  // Non-Pro users see locked preview (unless it's a demo wedding)
  if (!isPro && !weddingSlug.startsWith('demo-')) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
                Transportation
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                Coordinate shuttles and buses for your guests
              </Typography>
            </Box>
            <PrimaryActionButton
              onClick={() => setUpgradeModalOpen(true)}
              sx={{ px: 3, py: 1, borderRadius: 2, fontSize: '0.875rem', whiteSpace: 'nowrap' }}
            >
              Upgrade to Pro
            </PrimaryActionButton>
          </Box>

          <Typography variant="body2" sx={{ color: COLORS.text.subtle, lineHeight: 1.8, maxWidth: 680 }}>
            Help your guests get to and from your wedding with ease. Set up prescheduled shuttles or collect pickup preferences — we'll help you organize everything and notify your guests when their spot is confirmed.
          </Typography>

          {/* Locked Preview */}
          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden' }}>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                backdropFilter: 'blur(6px)',
                bgcolor: 'rgba(255,255,255,0.45)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <LockOutlined sx={{ fontSize: 32, color: COLORS.brand.primary }} />
              <Typography sx={{ fontWeight: 600, color: COLORS.text.strong, fontSize: '1rem' }}>
                Upgrade to unlock Transportation
              </Typography>
              <PrimaryActionButton
                onClick={() => setUpgradeModalOpen(true)}
                sx={{ px: 3, py: 1, borderRadius: 2 }}
              >
                Upgrade to Pro
              </PrimaryActionButton>
            </Box>

            {/* Mock Preview */}
            <Box sx={{ pointerEvents: 'none', userSelect: 'none', p: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: alpha(COLORS.text.strong, 0.1),
                  borderRadius: 3,
                  bgcolor: COLORS.bg.white,
                }}
              >
                <AirportShuttle sx={{ fontSize: 64, color: alpha(COLORS.brand.primary, 0.3), mb: 2 }} />
                <Typography variant="h6" sx={{ color: COLORS.text.strong, mb: 1 }}>
                  Need help coordinating rides?
                </Typography>
                <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 3, maxWidth: 400, mx: 'auto' }}>
                  We'll help organize shuttles and buses for your guests arriving and departing from your wedding.
                </Typography>
                <PrimaryActionButton
                  disabled
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    '&.Mui-disabled': { bgcolor: alpha(COLORS.brand.primary, 0.5), color: COLORS.text.inverse },
                  }}
                >
                  Yes, let's get started
                </PrimaryActionButton>
              </Paper>
            </Box>
          </Box>
        </Stack>

        <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      </Box>
    );
  }

  // Pro users - show appropriate view based on wizard step
  return (
    <Box sx={{ maxWidth: 1000 }}>
      {wizardStep === 'initial' && (
        <InitialPrompt onStart={handleStartSetup} />
      )}

      {wizardStep === 'mode-select' && (
        <ModeSelector onSelect={handleModeSelect} />
      )}

      {(wizardStep === 'setup-arrival' || wizardStep === 'setup-departure') && weddingId && settings && (
        <TransportationSetupWizard
          weddingId={weddingId}
          mode={settings.mode!}
          direction={wizardStep === 'setup-arrival' ? 'arrival' : 'departure'}
          onComplete={wizardStep === 'setup-arrival' ? handleArrivalComplete : handleDepartureComplete}
          onRestart={handleRestartSetup}
          showRestart={settings.setup_complete ?? false}
          onBack={() => {
            if (wizardStep === 'setup-arrival') {
              // If editing an already complete setup, go back to dashboard
              if (settings.setup_complete) {
                setWizardStep('dashboard');
              } else {
                setWizardStep('mode-select');
              }
            } else {
              setWizardStep('setup-arrival');
            }
          }}
        />
      )}

      {wizardStep === 'complete' && (
        <SetupComplete onViewResponses={handleGoToDashboard} />
      )}

      {wizardStep === 'dashboard' && weddingId && settings && (
        <TransportationDashboard
          weddingId={weddingId}
          weddingSlug={weddingSlug}
          mode={settings.mode!}
          onEditSetup={handleEditSetup}
        />
      )}
    </Box>
  );
}

// Initial Prompt Component
function InitialPrompt({ onStart }: { onStart: () => void }) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
          Transportation
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
          Coordinate shuttles and buses for your guests
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: alpha(COLORS.brand.primary, 0.3),
          borderRadius: 3,
          bgcolor: alpha(COLORS.brand.primary, 0.02),
        }}
      >
        <AirportShuttle sx={{ fontSize: 64, color: COLORS.brand.primary, mb: 2 }} />
        <Typography variant="h6" sx={{ color: COLORS.text.strong, mb: 1 }}>
          Need help coordinating rides to your event?
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 3, maxWidth: 480, mx: 'auto' }}>
          We'll help organize shuttles and buses for your guests arriving and departing from your wedding. Set up in minutes!
        </Typography>
        <PrimaryActionButton
          onClick={onStart}
          endIcon={<ArrowForward />}
          sx={{ px: 4, py: 1.5, borderRadius: 2, fontSize: '1rem' }}
        >
          Yes, let's get started
        </PrimaryActionButton>
      </Paper>
    </Stack>
  );
}

// Mode Selector Component
function ModeSelector({ onSelect }: { onSelect: (mode: TransportationMode) => void }) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
          Transportation Setup
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
          Let's figure out the best way to organize rides for your guests
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          pt: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          bgcolor: COLORS.bg.white,
        }}
      >
        <Typography variant="h6" sx={{ color: COLORS.text.strong, mb: 3, textAlign: 'left', fontWeight: 400 }}>
          Do you already have shuttles or buses booked?
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {/* Prescheduled Option */}
          <Card
            onClick={() => onSelect('prescheduled')}
            elevation={0}
            sx={{
              flex: 1,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: alpha(COLORS.text.strong, 0.15),
              borderRadius: 2,
              bgcolor: COLORS.bg.white,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: COLORS.brand.primary,
                bgcolor: COLORS.bg.white,
              },
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong, mb: 1 }}>
                Yes, I have vehicles booked
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                I've already arranged shuttles or buses with specific departure times. I want guests to reserve spots on these vehicles.
              </Typography>
            </CardContent>
          </Card>

          {/* Flexible Option */}
          <Card
            onClick={() => onSelect('flexible')}
            elevation={0}
            sx={{
              flex: 1,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: alpha(COLORS.text.strong, 0.15),
              borderRadius: 2,
              bgcolor: COLORS.bg.white,
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: COLORS.brand.primary,
                bgcolor: COLORS.bg.white,
              },
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.text.strong, mb: 1 }}>
                No, I need help organizing
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
                I want to collect guest preferences first, then figure out the best way to group them into vehicles based on their pickup times and locations.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Paper>
    </Stack>
  );
}

// Setup Complete Component
function SetupComplete({ onViewResponses }: { onViewResponses: () => void }) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: COLORS.text.strong }}>
          Transportation
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
          Coordinate shuttles and buses for your guests
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          border: '2px solid',
          borderColor: COLORS.accent.success,
          borderRadius: 2,
          bgcolor: alpha(COLORS.accent.success, 0.02),
        }}
      >
        <CheckCircle sx={{ fontSize: 64, color: COLORS.accent.success, mb: 2 }} />
        <Typography variant="h4" sx={{ color: COLORS.text.strong, mb: 1 }}>
          You're all set!
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 3, maxWidth: 580, mx: 'auto' }}>
          Your guests can now reserve transportation from your wedding website. You can view and manage their reservations from the dashboard.
        </Typography>
        <PrimaryActionButton
          onClick={onViewResponses}
          endIcon={<ArrowForward />}
          sx={{ px: 4, py: 1.5, borderRadius: 1, fontSize: '1rem' }}
        >
          View Reservations
        </PrimaryActionButton>
      </Paper>
    </Stack>
  );
}
