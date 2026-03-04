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
  DirectionsBus,
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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<TransportationSettings | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>('initial');

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
          <CircularProgress sx={{ color: '#DE3F5E' }} />
        </Box>
      </Box>
    );
  }

  // Non-Pro users see locked preview
  if (!isPro) {
    return (
      <Box sx={{ maxWidth: 1000 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Transportation
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Coordinate shuttles and buses for your guests
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => setUpgradeModalOpen(true)}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#c73552' },
              }}
            >
              Upgrade to Pro
            </Button>
          </Box>

          <Typography variant="body2" sx={{ color: '#6a6a6a', lineHeight: 1.8, maxWidth: 680 }}>
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
              <LockOutlined sx={{ fontSize: 32, color: '#DE3F5E' }} />
              <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1rem' }}>
                Upgrade to unlock Transportation
              </Typography>
              <Button
                variant="contained"
                onClick={() => setUpgradeModalOpen(true)}
                sx={{
                  bgcolor: '#DE3F5E',
                  color: 'white',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#c73552' },
                }}
              >
                Upgrade to Pro
              </Button>
            </Box>

            {/* Mock Preview */}
            <Box sx={{ pointerEvents: 'none', userSelect: 'none', p: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '2px dashed',
                  borderColor: alpha('#000', 0.1),
                  borderRadius: 3,
                  bgcolor: 'white',
                }}
              >
                <AirportShuttle sx={{ fontSize: 64, color: alpha('#DE3F5E', 0.3), mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#1a1a1a', mb: 1 }}>
                  Need help coordinating rides?
                </Typography>
                <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 3, maxWidth: 400, mx: 'auto' }}>
                  We'll help organize shuttles and buses for your guests arriving and departing from your wedding.
                </Typography>
                <Button
                  variant="contained"
                  disabled
                  sx={{
                    bgcolor: '#DE3F5E',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&.Mui-disabled': {
                      bgcolor: alpha('#DE3F5E', 0.5),
                      color: 'white',
                    },
                  }}
                >
                  Yes, let's get started
                </Button>
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
          showRestart={settings.setup_complete}
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
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
          Transportation
        </Typography>
        <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
          Coordinate shuttles and buses for your guests
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: alpha('#DE3F5E', 0.3),
          borderRadius: 3,
          bgcolor: alpha('#DE3F5E', 0.02),
        }}
      >
        <AirportShuttle sx={{ fontSize: 64, color: '#DE3F5E', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#1a1a1a', mb: 1 }}>
          Need help coordinating rides to your event?
        </Typography>
        <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 3, maxWidth: 480, mx: 'auto' }}>
          We'll help organize shuttles and buses for your guests arriving and departing from your wedding. Set up in minutes!
        </Typography>
        <Button
          variant="contained"
          onClick={onStart}
          endIcon={<ArrowForward />}
          sx={{
            bgcolor: '#DE3F5E',
            color: 'white',
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            '&:hover': { bgcolor: '#c73552' },
          }}
        >
          Yes, let's get started
        </Button>
      </Paper>
    </Stack>
  );
}

// Mode Selector Component
function ModeSelector({ onSelect }: { onSelect: (mode: TransportationMode) => void }) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
          Transportation Setup
        </Typography>
        <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
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
          bgcolor: 'white',
        }}
      >
        <Typography variant="h6" sx={{ color: '#1a1a1a', mb: 3, textAlign: 'left', fontWeight: 400 }}>
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
              borderColor: alpha('#000', 0.15),
              borderRadius: 2,
              bgcolor: 'white',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#DE3F5E',
                bgcolor: 'white',
              },
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <DirectionsBus sx={{ fontSize: 48, color: '#DE3F5E', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
                Yes, I have vehicles booked
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
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
              borderColor: alpha('#000', 0.15),
              borderRadius: 2,
              bgcolor: 'white',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: '#DE3F5E',
                bgcolor: 'white',
              },
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <AirportShuttle sx={{ fontSize: 48, color: '#4CAF50', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
                No, I need help organizing
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
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
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
          Transportation
        </Typography>
        <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
          Coordinate shuttles and buses for your guests
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          border: '2px solid',
          borderColor: '#4CAF50',
          borderRadius: 2,
          bgcolor: alpha('#4CAF50', 0.02),
        }}
      >
        <CheckCircle sx={{ fontSize: 64, color: '#4CAF50', mb: 2 }} />
        <Typography variant="h4" sx={{ color: '#1a1a1a', mb: 1 }}>
          You're all set!
        </Typography>
        <Typography variant="body2" sx={{ color: '#6a6a6a', mb: 3, maxWidth: 580, mx: 'auto' }}>
          Your guests can now reserve transportation from your wedding website. You can view and manage their reservations from the dashboard.
        </Typography>
        <Button
          variant="contained"
          onClick={onViewResponses}
          endIcon={<ArrowForward />}
          sx={{
            bgcolor: '#DE3F5E',
            color: 'white',
            px: 4,
            py: 1.5,
            borderRadius: 1,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
            '&:hover': { bgcolor: '#c73552' },
          }}
        >
          View Reservations
        </Button>
      </Paper>
    </Stack>
  );
}
