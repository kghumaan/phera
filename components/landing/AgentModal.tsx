'use client';

import {
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { CheckCircle, Close as CloseIcon } from '@mui/icons-material';
import { PheraDialog } from '@/components/shared/Dialog';
import { useState, useEffect } from 'react';
import { SuccessAlert, ErrorAlert } from '@/components/shared/Alert';
import { trackAgentModalOpen, trackWaitlistSignup, trackPreorderSignup } from '@/lib/utils/analytics';
import { COLORS, RADII } from '@/lib/theme/tokens';

interface AgentModalProps {
  open: boolean;
  onClose: () => void;
  agent: {
    id: string;
    name: string;
    persona: string;
    emoji: string;
    tagline: string;
    problem: string;
    solution: string;
    keyPoints: string[];
    pricing: number;
  } | null;
  modalType: 'waitlist' | 'pre-order' | 'learn-more';
}

export default function AgentModal({
  open,
  onClose,
  agent,
  modalType,
}: AgentModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Track modal opens
  useEffect(() => {
    if (open && agent) {
      trackAgentModalOpen(agent.id, modalType);
    }
  }, [open, agent, modalType]);

  const handleSubmit = async () => {
    if (!email || !agent) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint =
        modalType === 'pre-order'
          ? '/api/agents/preorder'
          : '/api/agents/waitlist';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          agent_id: agent.id,
          cta_type: modalType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSuccess(true);
      setEmail('');

      // Track conversion
      if (modalType === 'pre-order') {
        trackPreorderSignup(agent.id);
      } else {
        trackWaitlistSignup(agent.id);
      }

      // Close modal after 2 seconds on success
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPriceDisplay = () => {
    if (!agent) return '';
    return `$${agent.pricing}`;
  };

  const renderWaitlistContent = () => (
    <Stack spacing={3}>
      <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
        Be the first to know when <strong>{agent?.name} {agent?.persona}</strong> launches!
        Join our waitlist and get <strong>exclusive early access</strong> with special pricing.
      </Typography>

      <Box
        sx={{
          p: 3,
          bgcolor: COLORS.brand.primaryWash,
          borderRadius: RADII.lg,
          border: `1px solid ${COLORS.brand.primarySubtle}`,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: COLORS.text.strong }}>
          What you'll get:
        </Typography>
        <List dense>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Early access notification"
              primaryTypographyProps={{ sx: { color: COLORS.text.strong } }}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Launch discount (save 30%)"
              primaryTypographyProps={{ sx: { color: COLORS.text.strong } }}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Extended free trial period"
              primaryTypographyProps={{ sx: { color: COLORS.text.strong } }}
            />
          </ListItem>
        </List>
      </Box>

      {error && (
        <ErrorAlert onClose={() => setError('')}>{error}</ErrorAlert>
      )}

      {success && (
        <SuccessAlert>🎉 You're on the list! Check your email for confirmation.</SuccessAlert>
      )}

      <TextField
        fullWidth
        type="email"
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        disabled={loading || success}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: RADII.md,
          },
        }}
      />
    </Stack>
  );

  const renderPreOrderContent = () => (
    <Stack spacing={3}>
      <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
        Reserve your spot for <strong>{agent?.name} {agent?.persona}</strong> and save
        <strong> 50%</strong> at launch! Limited early bird pricing available.
      </Typography>

      <Box
        sx={{
          p: 3,
          bgcolor: COLORS.accent.warningBg,
          borderRadius: RADII.lg,
          border: `1px solid ${COLORS.accent.warning}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
              Regular Price
            </Typography>
            <Typography
              variant="h5"
              sx={{ textDecoration: 'line-through', color: COLORS.text.faint }}
            >
              {getPriceDisplay()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
              Early Bird Price
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: COLORS.brand.primary }}>
              ${agent ? Math.round(agent.pricing / 2) : 15}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          p: 3,
          bgcolor: COLORS.brand.primaryWash,
          borderRadius: RADII.lg,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: COLORS.text.strong }}>
          Pre-Order Benefits:
        </Typography>
        <List dense>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Save 50% - lock in early bird pricing"
              primaryTypographyProps={{ sx: { color: COLORS.text.strong } }}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="First access when agent launches"
              primaryTypographyProps={{ sx: { color: COLORS.text.strong } }}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Extended trial period (30 days)"
              primaryTypographyProps={{ sx: { color: COLORS.text.strong } }}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Influence feature development"
              primaryTypographyProps={{ sx: { color: COLORS.text.strong } }}
            />
          </ListItem>
        </List>
      </Box>

      {error && (
        <ErrorAlert onClose={() => setError('')}>{error}</ErrorAlert>
      )}

      {success && (
        <SuccessAlert>🎉 Pre-order confirmed! Check your email for next steps.</SuccessAlert>
      )}

      <TextField
        fullWidth
        type="email"
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        disabled={loading || success}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: RADII.md,
          },
        }}
      />

      <Typography variant="caption" sx={{ color: COLORS.text.subtle, textAlign: 'center' }}>
        No payment required now. We'll contact you before launch to complete purchase.
      </Typography>
    </Stack>
  );

  const renderLearnMoreContent = () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ mb: 1, color: COLORS.text.strong }}>
          The Problem
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: COLORS.text.subtle,
            fontStyle: 'italic',
            p: 2,
            bgcolor: COLORS.bg.muted,
            borderRadius: RADII.md,
            lineHeight: 1.6,
          }}
        >
          "{agent?.problem}"
        </Typography>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 1, color: COLORS.text.strong }}>
          How {agent?.persona} Helps
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.text.muted, lineHeight: 1.6 }}>
          {agent?.solution}
        </Typography>
      </Box>

      <Box
        sx={{
          p: 3,
          bgcolor: COLORS.brand.primaryWash,
          borderRadius: RADII.lg,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: COLORS.text.strong }}>
          Key Features
        </Typography>
        <List dense>
          {getFeaturesByAgent(agent?.id || '').map((feature, idx) => (
            <ListItem key={idx} disableGutters>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckCircle sx={{ color: COLORS.brand.primary, fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText 
                primary={feature}
                primaryTypographyProps={{ sx: { color: COLORS.text.strong } }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Box
        sx={{
          p: 2,
          bgcolor: COLORS.accent.warningBg,
          borderRadius: RADII.md,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.text.strong }}>
          {getPriceDisplay()}/wedding
        </Typography>
        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mt: 0.5 }}>
          One-time payment • No subscription required
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ color: COLORS.text.muted, textAlign: 'center' }}>
        Interested? Join the waitlist to get notified when {agent?.persona} launches!
      </Typography>
    </Stack>
  );

  const getFeaturesByAgent = (agentId: string): string[] => {
    const features: Record<string, string[]> = {
      'travel-expert': [
        'Collect flight details via WhatsApp',
        'Group guests by arrival time',
        'Coordinate shuttle schedules',
        'Hotel booking assistance',
        'Destination guide generation',
      ],
      emcee: [
        'Scheduled WhatsApp broadcasts',
        'Real-time event updates',
        'Multi-language support',
        'Guest response tracking',
        'Emergency notifications',
      ],
      chef: [
        'Dietary restriction analysis',
        'AI-powered menu suggestions',
        'Allergen matrix generation',
        'Local restaurant recommendations',
        'Ingredient substitutions',
      ],
      dj: [
        'Spotify/Apple Music integration',
        'Cultural music balancing',
        'Playlist generation by event',
        'Explicit content filtering',
        'BPM analysis for dancing',
      ],
      concierge: [
        'AI chatbot via WhatsApp/SMS',
        'Local recommendations',
        'Cultural tradition explanations',
        'Dress code clarifications',
        'Multi-language support',
      ],
      'vendor-liaison': [
        'Contract tracking',
        'Payment reminders',
        'Timeline distribution',
        'Day-of check-ins',
        'Vendor directory',
      ],
      photographer: [
        'Shot list templates',
        'Lapse integration',
        'Guest photo collection',
        'Family grouping organizer',
        'Golden hour alerts',
      ],
      timeline: [
        'Drag-and-drop timeline builder',
        'Buffer time calculations',
        'Real-time delay notifications',
        'Vendor sync',
        'Wedding party alerts',
      ],
      stylist: [
        'Event-specific outfit suggestions',
        'Color palette coordination',
        'Cultural attire guidance',
        'Shopping links',
        'Weather-appropriate recommendations',
      ],
      budget: [
        'Expense tracking',
        'Budget vs. actual reporting',
        'Cost comparison',
        'Payment schedules',
        'Tipping calculator',
      ],
      'cultural-guide': [
        'Ritual explanation library',
        'Video guides',
        'Pronunciation audio',
        'Participation etiquette',
        'Multi-faith guidance',
      ],
      registry: [
        'Stripe integration',
        'Group gift coordination',
        'Thank-you reminders',
        'Gift suggestions',
        'Contribution tracking',
      ],
    };

    return features[agentId] || [
      'Smart automation',
      'Real-time updates',
      'Mobile-friendly',
      'Easy to use',
      'Reliable support',
    ];
  };

  const getModalTitle = () => {
    if (!agent) return '';
    if (modalType === 'pre-order') {
      return `Pre-Order ${agent.name} ${agent.persona}`;
    } else if (modalType === 'waitlist') {
      return `Join Waitlist for ${agent.name} ${agent.persona}`;
    }
    return `About ${agent.name} ${agent.persona}`;
  };

  const getButtonText = () => {
    if (modalType === 'learn-more') {
      return 'Join Waitlist';
    } else if (modalType === 'pre-order') {
      return 'Reserve My Spot';
    }
    return 'Join Waitlist';
  };

  return (
    <PheraDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: COLORS.text.strong,
          px: 3,
          pt: 3,
          pb: 1,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ fontSize: '2rem' }}>{agent?.emoji}</Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {getModalTitle()}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.brand.primary, fontWeight: 500 }}>
              {agent?.tagline}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: COLORS.text.subtle }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 2 }}>
        {modalType === 'waitlist' && renderWaitlistContent()}
        {modalType === 'pre-order' && renderPreOrderContent()}
        {modalType === 'learn-more' && renderLearnMoreContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {modalType !== 'learn-more' ? (
          <>
            <Button
              onClick={onClose}
              sx={{
                color: COLORS.text.subtle,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || success || !email}
              sx={{
                bgcolor: COLORS.brand.primary,
                color: COLORS.text.inverse,
                borderRadius: RADII.md,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                '&:hover': {
                  bgcolor: COLORS.brand.primaryHover,
                },
                '&:disabled': {
                  bgcolor: COLORS.brand.primary,
                  color: COLORS.text.inverse,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: COLORS.text.inverse }} />
              ) : (
                getButtonText()
              )}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              // Switch to waitlist modal
              onClose();
              // Trigger waitlist modal (parent component will handle this)
            }}
            sx={{
              bgcolor: COLORS.brand.primary,
              color: COLORS.text.inverse,
              borderRadius: RADII.md,
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5,
              '&:hover': {
                bgcolor: COLORS.brand.primaryHover,
              },
            }}
          >
            Join Waitlist
          </Button>
        )}
      </DialogActions>
    </PheraDialog>
  );
}
