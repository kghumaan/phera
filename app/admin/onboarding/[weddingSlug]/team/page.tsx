'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Alert,
  TextField,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Snackbar,
  alpha,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import {
  PersonAdd,
  Delete,
  Send,
  Star,
  Visibility,
  Edit as EditIcon,
  HourglassEmpty,
  CheckCircle,
} from '@mui/icons-material';
import { weddingService, WeddingInvite, TeamMember } from '@/lib/supabase/wedding-service';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';

// Use enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

const selectSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    bgcolor: 'white',
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: '#DE3F5E',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#DE3F5E',
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#4a4a4a',
    fontSize: '1rem',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#DE3F5E',
  },
  '& .MuiSelect-select': {
    color: '#1a1a1a',
    fontSize: '1.1rem',
  },
  '& .MuiOutlinedInput-input': {
    color: '#1a1a1a',
  },
};

export default function TeamPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<WeddingInvite[]>([]);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'viewer'>('admin');
  const [sending, setSending] = useState(false);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'member' | 'invite'; id: string; email: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Toast notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('info');

  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
  }, [weddingSlug]);

  const showToast = (message: string, severity: 'error' | 'success' | 'info' | 'warning' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const loadData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Get wedding
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);
        setIsOwner(user?.id === wedding.created_by);

        // Load team members and invites
        const [members, invites] = await Promise.all([
          weddingService.getTeamMembers(wedding.id),
          weddingService.getWeddingInvites(wedding.id),
        ]);

        setTeamMembers(members);
        setPendingInvites(invites);
      }
    } catch (err) {
      console.error('Error loading team data:', err);
      showToast('Failed to load team data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSendInvite = async () => {
    if (!weddingId || !currentUserId) {
      showToast('Missing required information. Please refresh the page.', 'error');
      return;
    }

    const email = inviteEmail.trim().toLowerCase();

    if (!email) {
      showToast('Please enter an email address', 'warning');
      return;
    }

    if (!validateEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Check if invite already exists
    try {
      const inviteExists = await weddingService.checkInviteExists(weddingId, email);
      if (inviteExists) {
        showToast('An invite has already been sent to this email', 'warning');
        return;
      }
    } catch (err) {
      console.error('Error checking invite existence:', err);
      // Continue anyway - might be a transient error
    }

    // Check if user is already a team member
    const isAlreadyMember = teamMembers.some(
      member => member.email.toLowerCase() === email
    );
    if (isAlreadyMember) {
      showToast('This person is already a team member', 'warning');
      return;
    }

    setSending(true);

    try {
      const invite = await weddingService.createWeddingInvite({
        wedding_id: weddingId,
        email: email,
        role: inviteRole,
        invited_by: currentUserId,
      });

      if (invite) {
        // Send email notification
        let emailSent = false;
        let emailErrorMessage = null;
        
        try {
          const emailResponse = await fetch('/api/invites/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inviteId: invite.id,
              weddingId: weddingId,
            }),
          });

          if (emailResponse.ok) {
            const result = await emailResponse.json();
            emailSent = result.success === true;
          } else {
            const errorData = await emailResponse.json().catch(() => ({ error: 'Unknown error' }));
            emailErrorMessage = errorData.error || 'Failed to send email';
            console.warn('Invite created but email failed to send:', errorData);
          }
        } catch (err) {
          console.error('Error sending invite email:', err);
          emailErrorMessage = 'Network error while sending email';
        }

        setPendingInvites([invite, ...pendingInvites]);
        setInviteEmail('');
        setInviteRole('admin');
        
        // Show appropriate message based on email status
        if (emailSent) {
          showToast(`Invite sent to ${email}`, 'success');
        } else {
          showToast(
            `Invite created for ${email}, but email notification failed. They can still sign up with this email.`,
            'warning'
          );
        }
      } else {
        showToast('Failed to send invite. Please check console for details.', 'error');
      }
    } catch (err: any) {
      console.error('Error sending invite:', err);
      let errorMessage = 'Failed to send invite';
      
      // Check for specific error messages
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error?.message) {
        errorMessage = err.error.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.originalError) {
        // Check the original error from the service
        const origErr = err.originalError;
        if (origErr?.message) {
          errorMessage = origErr.message;
        } else if (origErr?.code === '42P01') {
          errorMessage = 'Database table not found. Please run the migration: create_wedding_invites.sql';
        } else if (origErr?.code === '42501') {
          errorMessage = 'Permission denied. Check your database permissions.';
        }
      }
      
      // Check if error message mentions table doesn't exist
      if (errorMessage.includes('does not exist') || errorMessage.includes('table')) {
        errorMessage = 'The wedding_invites table does not exist. Please run the migration file: migrations/create_wedding_invites.sql in your Supabase SQL editor.';
      }
      
      console.error('Full error details:', {
        error: err,
        errorType: typeof err,
        errorKeys: err ? Object.keys(err) : [],
        errorStringified: JSON.stringify(err, Object.getOwnPropertyNames(err || {}), 2),
        weddingId,
        email,
        role: inviteRole,
        currentUserId,
      });
      
      showToast(errorMessage, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteClick = (type: 'member' | 'invite', id: string, email: string) => {
    setItemToDelete({ type, id, email });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setDeleting(true);

    try {
      if (itemToDelete.type === 'invite') {
        const success = await weddingService.deleteWeddingInvite(itemToDelete.id);
        if (success) {
          setPendingInvites(pendingInvites.filter(inv => inv.id !== itemToDelete.id));
          showToast('Invite cancelled', 'success');
        } else {
          showToast('Failed to cancel invite', 'error');
        }
      } else if (itemToDelete.type === 'member') {
        const success = await weddingService.removeWeddingAdmin(itemToDelete.id);
        if (success) {
          setTeamMembers(teamMembers.filter(m => m.id !== itemToDelete.id));
          showToast('Team member removed', 'success');
        } else {
          showToast('Failed to remove team member', 'error');
        }
      }
    } catch (err) {
      console.error('Error deleting:', err);
      showToast('An error occurred', 'error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const getRoleChip = (role: string, isOwner: boolean) => {
    if (isOwner) {
      return (
        <Chip
          icon={<Star sx={{ fontSize: 24 }} />}
          label="Owner"
          size="medium"
          sx={{
            bgcolor: alpha('#FFB800', 0.15),
            color: '#B38600',
            fontWeight: 700,
            fontSize: '1rem',
            height: 36,
            px: 1.5,
            '& .MuiChip-icon': { color: '#FFB800', fontSize: 24 },
            '& .MuiChip-label': { px: 1.5, fontSize: '1rem', fontWeight: 700 },
          }}
        />
      );
    }

    const roleConfig = {
      admin: {
        icon: <EditIcon sx={{ fontSize: 16 }} />,
        label: 'Can Edit',
        bgcolor: alpha('#DE3F5E', 0.1),
        color: '#DE3F5E',
      },
      viewer: {
        icon: <Visibility sx={{ fontSize: 16 }} />,
        label: 'View Only',
        bgcolor: alpha('#6a6a6a', 0.1),
        color: '#6a6a6a',
      },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;

    return (
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        sx={{
          bgcolor: config.bgcolor,
          color: config.color,
          fontWeight: 600,
          '& .MuiChip-icon': { color: config.color },
        }}
      />
    );
  };

  const getInitials = (email: string): string => {
    if (email === 'Wedding Owner' || email === 'Team Member') {
      return email.charAt(0).toUpperCase();
    }
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <LoadingSpinner message="Loading team..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'var(--font-instrument-serif)',
              fontWeight: 700,
              mb: 1,
              color: '#1a1a1a',
            }}
          >
            Team
          </Typography>
          <Typography variant="body1" sx={{ color: '#4a4a4a', fontSize: '1.1rem' }}>
            Manage who can access and edit your wedding website
          </Typography>
        </Box>

        {/* Invite New Member Card */}
        {isOwner && (
          <Paper
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: '24px',
              bgcolor: 'white',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Stack spacing={3}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <PersonAdd sx={{ color: '#DE3F5E', fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                  Invite Team Member
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                Invite your partner or wedding planner to help manage your wedding website.
                They&apos;ll get access when they sign up or log in with this email.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="partner@example.com"
                  fullWidth
                  sx={{ ...textFieldSx, flex: 2 }}
                />

                <FormControl sx={{ ...selectSx, minWidth: 160 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={inviteRole}
                    label="Role"
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'viewer')}
                  >
                    <MenuItem value="admin">
                      <Box display="flex" alignItems="center" gap={1}>
                        <EditIcon sx={{ fontSize: 18, color: '#DE3F5E' }} />
                        Can Edit
                      </Box>
                    </MenuItem>
                    <MenuItem value="viewer">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Visibility sx={{ fontSize: 18, color: '#6a6a6a' }} />
                        View Only
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleSendInvite}
                  disabled={sending || !inviteEmail.trim()}
                  sx={{
                    bgcolor: '#DE3F5E',
                    color: 'white',
                    py: 2,
                    px: 4,
                    borderRadius: '16px',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    minWidth: 140,
                    boxShadow: '0 4px 12px rgba(222, 63, 94, 0.3)',
                    '&:hover': {
                      bgcolor: '#C8365A',
                      boxShadow: '0 6px 16px rgba(222, 63, 94, 0.4)',
                    },
                    '&:disabled': {
                      bgcolor: alpha('#DE3F5E', 0.5),
                      color: 'white',
                    },
                  }}
                >
                  {sending ? 'Sending...' : 'Send Invite'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* Team Members (including pending invites) */}
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: '24px',
            bgcolor: 'white',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Stack spacing={3}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <CheckCircle sx={{ color: '#10B981', fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                Team Members
              </Typography>
              <Chip
                label={teamMembers.length + pendingInvites.length}
                size="small"
                sx={{
                  bgcolor: alpha('#10B981', 0.1),
                  color: '#10B981',
                  fontWeight: 700,
                }}
              />
            </Box>

            <List sx={{ p: 0 }}>
              {/* Active team members */}
              {teamMembers.map((member, index) => (
                <Box key={member.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      py: 2,
                      px: 0,
                    }}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: member.is_owner
                            ? alpha('#FFB800', 0.15)
                            : alpha('#DE3F5E', 0.1),
                          color: member.is_owner ? '#B38600' : '#DE3F5E',
                          fontWeight: 600,
                        }}
                      >
                        {getInitials(member.email)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={member.email}
                      secondary={member.is_owner ? 'Wedding creator' : `Added ${new Date(member.created_at).toLocaleDateString()}`}
                      primaryTypographyProps={{
                        fontWeight: 600,
                        color: '#1a1a1a',
                        fontSize: '1.05rem',
                      }}
                      secondaryTypographyProps={{
                        color: '#6a6a6a',
                      }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {getRoleChip(member.role, member.is_owner)}
                      {!member.is_owner && isOwner && (
                        <IconButton
                          onClick={() => handleDeleteClick('member', member.id, member.email)}
                          sx={{
                            color: '#EF4444',
                            '&:hover': {
                              bgcolor: alpha('#EF4444', 0.1),
                            },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                  </ListItem>
                </Box>
              ))}
              
              {/* Pending invites */}
              {pendingInvites.map((invite, index) => (
                <Box key={`invite-${invite.id}`}>
                  {(teamMembers.length > 0 || index > 0) && <Divider />}
                  <ListItem
                    sx={{
                      py: 2,
                      px: 0,
                    }}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: alpha('#FFB800', 0.15),
                          color: '#B38600',
                        }}
                      >
                        <HourglassEmpty sx={{ fontSize: 20 }} />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={invite.email}
                      secondary="Invite pending — waiting for them to sign up or log in"
                      primaryTypographyProps={{
                        fontWeight: 600,
                        color: '#1a1a1a',
                        fontSize: '1.05rem',
                      }}
                      secondaryTypographyProps={{
                        color: '#B38600',
                        fontStyle: 'italic',
                      }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {getRoleChip(invite.role, false)}
                      {isOwner && (
                        <IconButton
                          onClick={() => handleDeleteClick('invite', invite.id, invite.email)}
                          sx={{
                            color: '#EF4444',
                            '&:hover': {
                              bgcolor: alpha('#EF4444', 0.1),
                            },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                  </ListItem>
                </Box>
              ))}
            </List>
          </Stack>
        </Paper>

        {/* Info Card */}
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: '24px',
            bgcolor: alpha('#f5f5f5', 0.5),
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              About Team Access
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, color: '#4a4a4a' }}>
              <Box component="li" sx={{ mb: 1 }}>
                <strong>Owner</strong> - The person who created the wedding. Has full control including deleting the wedding.
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <strong>Can Edit</strong> - Can make changes to all wedding details, events, and settings.
              </Box>
              <Box component="li">
                <strong>View Only</strong> - Can view the admin dashboard but cannot make changes.
              </Box>
            </Box>
          </Stack>
        </Paper>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: '24px',
              p: 2,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            {itemToDelete?.type === 'invite' ? 'Cancel Invite?' : 'Remove Team Member?'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {itemToDelete?.type === 'invite'
                ? `Are you sure you want to cancel the invite sent to ${itemToDelete?.email}?`
                : `Are you sure you want to remove ${itemToDelete?.email} from your team? They will no longer have access to this wedding.`}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              sx={{
                color: '#6a6a6a',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '12px',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleting}
              variant="contained"
              sx={{
                bgcolor: '#EF4444',
                color: 'white',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '12px',
                '&:hover': {
                  bgcolor: '#DC2626',
                },
              }}
            >
              {deleting ? 'Removing...' : itemToDelete?.type === 'invite' ? 'Cancel Invite' : 'Remove'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast Notification */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Stack>
    </Container>
  );
}

