'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  TextField,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
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
  CircularProgress,
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
import { supabase } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ENHANCED_TEXT_FIELD_SX } from '@/lib/constants/form-styles';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import { useAutoSaveStatus } from '@/lib/contexts/AutoSaveContext';

// Use enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

const selectSx = {
  mt: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
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
    fontWeight: 500,
    '&.Mui-focused': {
      color: '#DE3F5E',
    },
  },
  '& .MuiSelect-select': {
    color: '#1a1a1a',
    fontSize: { xs: '0.875rem', md: '0.925rem', lg: '0.975rem' },
    py: { xs: 1.5, md: 1.75, lg: 2 },
  },
};

export default function TeamPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isViewOnly } = useAdminRole();
  const { showStatus } = useAutoSaveStatus();
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
  
  useEffect(() => {
    loadData();
  }, [weddingSlug]);

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
      showStatus('error', 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSendInvite = async () => {
    if (isViewOnly) return;
    if (!weddingId || !currentUserId) {
      showStatus('error', 'Missing required information. Please refresh the page.');
      return;
    }

    const email = inviteEmail.trim().toLowerCase();

    if (!email) {
      showStatus('error', 'Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      showStatus('error', 'Please enter a valid email address');
      return;
    }

    // Check if invite already exists
    try {
      const inviteExists = await weddingService.checkInviteExists(weddingId, email);
      if (inviteExists) {
        showStatus('error', 'An invite has already been sent to this email');
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
      showStatus('error', 'This person is already a team member');
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
          showStatus('saved', `Invite sent to ${email}`);
        } else {
          showStatus('saved', `Invite created for ${email}, but email notification failed. They can still sign up with this email.`);
        }
      } else {
        showStatus('error', 'Failed to send invite. Please check console for details.');
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
      
      showStatus('error', errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteClick = (type: 'member' | 'invite', id: string, email: string) => {
    if (isViewOnly) return;
    setItemToDelete({ type, id, email });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (isViewOnly) return;
    if (!itemToDelete) return;

    setDeleting(true);

    try {
      if (itemToDelete.type === 'invite') {
        const success = await weddingService.deleteWeddingInvite(itemToDelete.id);
        if (success) {
          setPendingInvites(pendingInvites.filter(inv => inv.id !== itemToDelete.id));
          showStatus('saved', 'Invite cancelled');
        } else {
          showStatus('error', 'Failed to cancel invite');
        }
      } else if (itemToDelete.type === 'member') {
        const success = await weddingService.removeWeddingAdmin(itemToDelete.id);
        if (success) {
          setTeamMembers(teamMembers.filter(m => m.id !== itemToDelete.id));
          showStatus('saved', 'Team member removed');
        } else {
          showStatus('error', 'Failed to remove team member');
        }
      }
    } catch (err) {
      console.error('Error deleting:', err);
      showStatus('error', 'An error occurred');
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
      <Box sx={{ maxWidth: 1000 }}>
        <LoadingSpinner message="Loading team..." />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Stack spacing={3} sx={{ pt: { xs: 6, lg: 0 } }}>
        {/* Header */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Collaborators
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            Manage who can access and edit your wedding website
          </Typography>
        </Box>

        {/* Single combined section */}
        <Paper sx={{ borderRadius: '16px', bgcolor: '#fafafa', p: 3, boxShadow: 'none' }}>
          <Stack spacing={3}>
            {/* Invite form */}
            {isOwner && (
              <>
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
                    startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <Send />}
                    onClick={handleSendInvite}
                    disabled={sending || !inviteEmail.trim()}
                    sx={{
                      bgcolor: '#DE3F5E',
                      color: 'white',
                      borderRadius: '12px',
                      fontWeight: 600,
                      textTransform: 'none',
                      px: 3,
                      py: 1.75,
                      '&:hover': { bgcolor: '#C8365A' },
                      '&:disabled': { bgcolor: alpha('#DE3F5E', 0.5), color: 'white' },
                    }}
                  >
                    {sending ? 'Sending...' : 'Send Invite'}
                  </Button>
                </Stack>

                <Divider />
              </>
            )}

            {/* Members list */}
            <List sx={{ p: 0 }}>
              {teamMembers.map((member, index) => (
                <Box key={member.id}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ py: 2, px: 0 }}>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: member.is_owner ? alpha('#FFB800', 0.15) : alpha('#DE3F5E', 0.1),
                          color: member.is_owner ? '#B38600' : '#DE3F5E',
                          fontWeight: 600,
                          width: 40,
                          height: 40,
                        }}
                      >
                        {getInitials(member.email)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={member.email}
                      secondary={member.is_owner ? 'Wedding creator' : `Added ${new Date(member.created_at).toLocaleDateString()}`}
                      primaryTypographyProps={{ fontWeight: 600, color: '#1a1a1a' }}
                      secondaryTypographyProps={{ color: '#6a6a6a' }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {getRoleChip(member.role, member.is_owner)}
                      {!member.is_owner && isOwner && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick('member', member.id, member.email)}
                          sx={{ color: '#1a1a1a', '&:hover': { color: '#DE3F5E' } }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItem>
                </Box>
              ))}

              {pendingInvites.map((invite, index) => (
                <Box key={`invite-${invite.id}`}>
                  {(teamMembers.length > 0 || index > 0) && <Divider />}
                  <ListItem sx={{ py: 2, px: 0 }}>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: alpha('#FFB800', 0.15),
                          color: '#B38600',
                          width: 40,
                          height: 40,
                        }}
                      >
                        <HourglassEmpty sx={{ fontSize: 20 }} />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={invite.email}
                      secondary="Invite pending — waiting for them to sign up or log in"
                      primaryTypographyProps={{ fontWeight: 600, color: '#1a1a1a' }}
                      secondaryTypographyProps={{ color: '#B38600', fontStyle: 'italic' }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {getRoleChip(invite.role, false)}
                      {isOwner && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick('invite', invite.id, invite.email)}
                          sx={{ color: '#1a1a1a', '&:hover': { color: '#DE3F5E' } }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItem>
                </Box>
              ))}
            </List>

            {/* About access */}
            <Divider />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              About Team Access
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, color: '#4a4a4a' }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Owner</strong> — The person who created the wedding. Has full control including deleting the wedding.
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                <strong>Can Edit</strong> — Can make changes to all wedding details, events, and settings.
              </Typography>
              <Typography component="li" variant="body2">
                <strong>View Only</strong> — Can view the admin dashboard but cannot make changes.
              </Typography>
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
              {deleting ? <CircularProgress size={20} color="inherit" /> : (itemToDelete?.type === 'invite' ? 'Cancel Invite' : 'Remove')}
            </Button>
          </DialogActions>
        </Dialog>

      </Stack>
    </Box>
  );
}

