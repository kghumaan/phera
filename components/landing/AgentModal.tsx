'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, Close as CloseIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import { trackAgentModalOpen, trackWaitlistSignup, trackPreorderSignup } from '@/lib/utils/analytics';

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
    } catch (err) {
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
      <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.6 }}>
        Be the first to know when <strong>{agent?.name} {agent?.persona}</strong> launches!
        Join our waitlist and get <strong>exclusive early access</strong> with special pricing.
      </Typography>

      <Box
        sx={{
          p: 3,
          bgcolor: 'rgba(222, 63, 94, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(222, 63, 94, 0.1)',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: '#1a1a1a' }}>
          What you'll get:
        </Typography>
        <List dense>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: '#DE3F5E', fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Early access notification"
              primaryTypographyProps={{ sx: { color: '#1a1a1a' } }}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: '#DE3F5E', fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Launch discount (save 30%)"
              primaryTypographyProps={{ sx: { color: '#1a1a1a' } }}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: '#DE3F5E', fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Extended free trial period"
              primaryTypographyProps={{ sx: { color: '#1a1a1a' } }}
            />
          </ListItem>
        </List>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success">
          🎉 You're on the list! Check your email for confirmation.
        </Alert>
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
            borderRadius: '12px',
          },
        }}
      />
    </Stack>
  );

  const renderPreOrderContent = () => (
    <Stack spacing={3}>
      <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.6 }}>
        Reserve your spot for <strong>{agent?.name} {agent?.persona}</strong> and save
        <strong> 50%</strong> at launch! Limited early bird pricing available.
      </Typography>

      <Box
        sx={{
          p: 3,
          bgcolor: '#FFF3E0',
          borderRadius: '16px',
          border: '1px solid #FFB74D',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Regular Price
            </Typography>
            <Typography
              variant="h5"
              sx={{ textDecoration: 'line-through', color: '#999' }}
            >
              {getPriceDisplay()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Early Bird Price
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#DE3F5E' }}>
              ${agent ? Math.round(agent.pricing / 2) : 15}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          p: 3,
          bgcolor: 'rgba(222, 63, 94, 0.05)',
          borderRadius: '16px',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: '#1a1a1a' }}>
          Pre-Order Benefits:
        </Typography>
        <List dense>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: '#DE3F5E', fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Save 50% - lock in early bird pricing"
              primaryTypographyProps={{ sx: { color: '#1a1a1a' } }}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: '#DE3F5E', fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="First access when agent launches"
              primaryTypographyProps={{ sx: { color: '#1a1a1a' } }}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: '#DE3F5E', fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Extended trial period (30 days)"
              primaryTypographyProps={{ sx: { color: '#1a1a1a' } }}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <CheckCircle sx={{ color: '#DE3F5E', fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary="Influence feature development"
              primaryTypographyProps={{ sx: { color: '#1a1a1a' } }}
            />
          </ListItem>
        </List>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success">
          🎉 Pre-order confirmed! Check your email for next steps.
        </Alert>
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
            borderRadius: '12px',
          },
        }}
      />

      <Typography variant="caption" sx={{ color: '#666', textAlign: 'center' }}>
        No payment required now. We'll contact you before launch to complete purchase.
      </Typography>
    </Stack>
  );

  const renderLearnMoreContent = () => (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ mb: 1, color: '#1a1a1a' }}>
          The Problem
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#666',
            fontStyle: 'italic',
            p: 2,
            bgcolor: '#FAFAFA',
            borderRadius: '12px',
            lineHeight: 1.6,
          }}
        >
          "{agent?.problem}"
        </Typography>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 1, color: '#1a1a1a' }}>
          How {agent?.persona} Helps
        </Typography>
        <Typography variant="body2" sx={{ color: '#4a4a4a', lineHeight: 1.6 }}>
          {agent?.solution}
        </Typography>
      </Box>

      <Box
        sx={{
          p: 3,
          bgcolor: 'rgba(222, 63, 94, 0.05)',
          borderRadius: '16px',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: '#1a1a1a' }}>
          Key Features
        </Typography>
        <List dense>
          {getFeaturesByAgent(agent?.id || '').map((feature, idx) => (
            <ListItem key={idx} disableGutters>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckCircle sx={{ color: '#DE3F5E', fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText 
                primary={feature}
                primaryTypographyProps={{ sx: { color: '#1a1a1a' } }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Box
        sx={{
          p: 2,
          bgcolor: '#FFF3E0',
          borderRadius: '12px',
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
          {getPriceDisplay()}/wedding
        </Typography>
        <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
          One-time payment • No subscription required
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ color: '#4a4a4a', textAlign: 'center' }}>
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: 'white',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#1a1a1a',
          pb: 1,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ fontSize: '2rem' }}>{agent?.emoji}</Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {getModalTitle()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#DE3F5E', fontWeight: 500 }}>
              {agent?.tagline}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: '#666' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

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
                color: '#666',
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
                bgcolor: '#DE3F5E',
                color: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                '&:hover': {
                  bgcolor: '#C8365A',
                },
                '&:disabled': {
                  bgcolor: '#ccc',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
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
              bgcolor: '#DE3F5E',
              color: 'white',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              py: 1.5,
              '&:hover': {
                bgcolor: '#C8365A',
              },
            }}
          >
            Join Waitlist
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

