'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  IconButton,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Tabs,
  Tab,
  Badge,
  Collapse,
} from '@mui/material';
import { PrimaryActionButton } from './ActionButton';
import { motion, AnimatePresence } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import FamilyIcon from '@mui/icons-material/FamilyRestroom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraDialog, PheraDialogTitle } from '@/components/shared/Dialog';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  side: 'bride' | 'groom' | 'mutual';
  tier: 'immediate' | 'extended' | 'friends' | 'colleagues';
  rsvpStatus: 'confirmed' | 'pending' | 'declined';
  familyGroup?: string;
  plusOne: boolean;
  events: string[];
  notes: string;
}

interface FamilyGroup {
  id: string;
  name: string;
  members: Guest[];
  color: string;
}

const guestTiers = [
  { value: 'immediate', label: 'Immediate Family', color: COLORS.cultural.maroon },
  { value: 'extended', label: 'Extended Family', color: '#D4AF37' },
  { value: 'friends', label: 'Friends', color: '#FF6B6B' },
  { value: 'colleagues', label: 'Colleagues', color: '#20C997' },
];

const relationships = [
  'Parent', 'Sibling', 'Grandparent', 'Uncle/Aunt', 'Cousin',
  'Best Friend', 'College Friend', 'Colleague', 'Neighbor', 'Other'
];

export default function GuestHierarchy() {
  const theme = useTheme();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    side: 'mutual' as 'bride' | 'groom' | 'mutual',
    tier: 'friends' as 'immediate' | 'extended' | 'friends' | 'colleagues',
    familyGroup: '',
    plusOne: false,
    events: [] as string[],
    notes: '',
  });

  const handleAddGuest = () => {
    setEditingGuest(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      relationship: '',
      side: 'mutual',
      tier: 'friends',
      familyGroup: '',
      plusOne: false,
      events: [],
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      relationship: guest.relationship,
      side: guest.side,
      tier: guest.tier,
      familyGroup: guest.familyGroup || '',
      plusOne: guest.plusOne,
      events: guest.events,
      notes: guest.notes,
    });
    setIsDialogOpen(true);
  };

  const handleSaveGuest = () => {
    if (editingGuest) {
      setGuests(guests.map(g => 
        g.id === editingGuest.id 
          ? { 
              ...editingGuest, 
              ...formData,
              rsvpStatus: editingGuest.rsvpStatus 
            }
          : g
      ));
    } else {
      const newGuest: Guest = {
        ...formData,
        id: Date.now().toString(),
        rsvpStatus: 'pending',
      };
      setGuests([...guests, newGuest]);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteGuest = (guestId: string) => {
    setGuests(guests.filter(g => g.id !== guestId));
  };

  const toggleFamilyGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getGuestsByTier = (tier: string) => {
    return guests.filter(guest => guest.tier === tier);
  };

  const getGuestsBySide = (side: string) => {
    return guests.filter(guest => guest.side === side);
  };

  const getRSVPStats = () => {
    const confirmed = guests.filter(g => g.rsvpStatus === 'confirmed').length;
    const pending = guests.filter(g => g.rsvpStatus === 'pending').length;
    const declined = guests.filter(g => g.rsvpStatus === 'declined').length;
    return { confirmed, pending, declined, total: guests.length };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'declined': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircleIcon />;
      case 'pending': return <PendingIcon />;
      case 'declined': return <CancelIcon />;
      default: return <PendingIcon />;
    }
  };

  const stats = getRSVPStats();

  const tabContent = [
    { label: 'All Guests', content: guests },
    { label: 'By Tier', content: null },
    { label: 'By Side', content: null },
    { label: 'By Family', content: null },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            Guest Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organize your wedding guests with family grouping and tier management
          </Typography>
        </Box>
        <PrimaryActionButton
          startIcon={<AddIcon />}
          onClick={handleAddGuest}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1.5,
          }}
        >
          Add Guest
        </PrimaryActionButton>
      </Box>

      {/* RSVP Stats */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.success.main + '20', color: theme.palette.success.main, mr: 2 }}>
                <CheckCircleIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{stats.confirmed}</Typography>
                <Typography variant="body2" color="text.secondary">Confirmed</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.warning.main + '20', color: theme.palette.warning.main, mr: 2 }}>
                <PendingIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{stats.pending}</Typography>
                <Typography variant="body2" color="text.secondary">Pending</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.error.main + '20', color: theme.palette.error.main, mr: 2 }}>
                <CancelIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{stats.declined}</Typography>
                <Typography variant="body2" color="text.secondary">Declined</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main + '20', color: theme.palette.primary.main, mr: 2 }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{stats.total}</Typography>
                <Typography variant="body2" color="text.secondary">Total Guests</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        >
          {tabContent.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>

        <CardContent sx={{ p: 0 }}>
          {/* All Guests Tab */}
          {activeTab === 0 && (
            <List>
              {guests.map((guest) => (
                <ListItem key={guest.id} divider>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getStatusColor(guest.rsvpStatus) + '20', color: getStatusColor(guest.rsvpStatus) }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={guest.name}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">
                          {guest.email}
                        </Typography>
                        <Chip
                          label={guest.tier}
                          size="small"
                          sx={{ height: 20, fontSize: '0.875rem' }}
                        />
                        <Chip
                          label={guest.side}
                          size="small"
                          sx={{ height: 20, fontSize: '0.875rem' }}
                        />
                        <Chip
                          icon={getStatusIcon(guest.rsvpStatus)}
                          label={guest.rsvpStatus}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.875rem',
                            bgcolor: getStatusColor(guest.rsvpStatus) + '20',
                            color: getStatusColor(guest.rsvpStatus),
                          }}
                        />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleEditGuest(guest)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDeleteGuest(guest.id)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {guests.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Guests Added Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Start building your guest list by adding your first guest
                  </Typography>
                  <PrimaryActionButton startIcon={<AddIcon />} onClick={handleAddGuest}>
                    Add First Guest
                  </PrimaryActionButton>
                </Box>
              )}
            </List>
          )}

          {/* By Tier Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 2 }}>
              {guestTiers.map((tier) => {
                const tierGuests = getGuestsByTier(tier.value);
                return (
                  <Card key={tier.value} elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: tier.color + '20', color: tier.color, mr: 2 }}>
                          <Badge badgeContent={tierGuests.length} color="primary">
                            <FamilyIcon />
                          </Badge>
                        </Avatar>
                        <Typography variant="h6">{tier.label}</Typography>
                      </Box>
                      {tierGuests.map((guest) => (
                        <Box key={guest.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                          <Typography variant="body2">{guest.name}</Typography>
                          <Chip
                            icon={getStatusIcon(guest.rsvpStatus)}
                            label={guest.rsvpStatus}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(guest.rsvpStatus) + '20',
                              color: getStatusColor(guest.rsvpStatus),
                            }}
                          />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Guest Dialog */}
      <PheraDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <PheraDialogTitle onClose={() => setIsDialogOpen(false)}>
          {editingGuest ? 'Edit Guest' : 'Add New Guest'}
        </PheraDialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
              />
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Relationship</InputLabel>
                <Select
                  value={formData.relationship}
                  label="Relationship"
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                >
                  {relationships.map((rel) => (
                    <MenuItem key={rel} value={rel}>{rel}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Side</InputLabel>
                <Select
                  value={formData.side}
                  label="Side"
                  onChange={(e) => setFormData({ ...formData, side: e.target.value as any })}
                >
                  <MenuItem value="bride">Bride's Side</MenuItem>
                  <MenuItem value="groom">Groom's Side</MenuItem>
                  <MenuItem value="mutual">Mutual</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Tier</InputLabel>
              <Select
                value={formData.tier}
                label="Tier"
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
              >
                {guestTiers.map((tier) => (
                  <MenuItem key={tier.value} value={tier.value}>{tier.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              multiline
              rows={2}
              fullWidth
              placeholder="Any special notes about this guest..."
              sx={{
                '& textarea::placeholder': {
                  color: '#C2C2C2 !important',
                },
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <PrimaryActionButton
            onClick={handleSaveGuest}
            disabled={!formData.name}
          >
            {editingGuest ? 'Update Guest' : 'Add Guest'}
          </PrimaryActionButton>
        </DialogActions>
      </PheraDialog>
    </Box>
  );
} 