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
  TextareaAutosize,
} from '@mui/material';
import { PrimaryActionButton } from './ActionButton';
import { motion, AnimatePresence } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { PheraDialog } from '@/components/shared/Dialog';

interface WeddingEvent {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  location: string;
  description: string;
  guestCount: number;
  color: string;
  icon: string;
}

const eventTemplates = [
  {
    name: 'Mehendi Ceremony',
    type: 'pre-wedding',
    color: '#FF9933', // Saffron
    icon: '🎨',
    description: 'Traditional henna ceremony with music and celebration',
  },
  {
    name: 'Sangeet Night',
    type: 'pre-wedding',
    color: '#D4AF37', // Gold
    icon: '🎵',
    description: 'Musical evening with dance performances and entertainment',
  },
  {
    name: 'Haldi Ceremony',
    type: 'pre-wedding',
    color: '#FFC107', // Yellow
    icon: '✨',
    description: 'Turmeric blessing ceremony for prosperity and purity',
  },
  {
    name: 'Wedding Ceremony',
    type: 'main',
    color: COLORS.cultural.maroon, // Maroon
    icon: '💍',
    description: 'Sacred wedding rituals and exchange of vows',
  },
  {
    name: 'Reception',
    type: 'post-wedding',
    color: '#FF6B6B', // Coral
    icon: '🎉',
    description: 'Grand celebration dinner with family and friends',
  },
];

export default function EventBuilder() {
  const theme = useTheme();
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    date: '',
    time: '',
    location: '',
    description: '',
    guestCount: 0,
    color: theme.palette.primary.main,
    icon: '🎉',
  });

  const handleAddEvent = () => {
    setEditingEvent(null);
    setFormData({
      name: '',
      type: '',
      date: '',
      time: '',
      location: '',
      description: '',
      guestCount: 0,
      color: theme.palette.primary.main,
      icon: '🎉',
    });
    setIsDialogOpen(true);
  };

  const handleEditEvent = (event: WeddingEvent) => {
    setEditingEvent(event);
    setFormData(event);
    setIsDialogOpen(true);
  };

  const handleSaveEvent = () => {
    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent.id ? { ...formData, id: editingEvent.id } : e));
    } else {
      const newEvent: WeddingEvent = {
        ...formData,
        id: Date.now().toString(),
      };
      setEvents([...events, newEvent]);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const handleTemplateSelect = (template: any) => {
    setFormData({
      ...formData,
      name: template.name,
      type: template.type,
      color: template.color,
      icon: template.icon,
      description: template.description,
    });
    setSelectedTemplate(template.name);
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            Wedding Events
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage your wedding celebration timeline
          </Typography>
        </Box>
        <PrimaryActionButton
          startIcon={<AddIcon />}
          onClick={handleAddEvent}
          sx={{
            borderRadius: 3,
            px: 3,
            py: 1.5,
          }}
        >
          Add Event
        </PrimaryActionButton>
      </Box>

      {/* Events Grid */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <AnimatePresence>
          {events.map((event) => (
            <motion.div
              key={event.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
            >
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: `${event.color}20`,
                          color: event.color,
                          mr: 2,
                          width: 56,
                          height: 56,
                          fontSize: '1.5rem',
                        }}
                      >
                        {event.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                          {event.name}
                        </Typography>
                        <Chip
                          label={event.type.replace('-', ' ').toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: `${event.color}20`,
                            color: event.color,
                            fontWeight: 'medium',
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton onClick={() => handleEditEvent(event)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteEvent(event.id)} size="small" sx={{ color: COLORS.text.subtle, '&:hover': { color: COLORS.brand.primary } }}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {event.description}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventAvailableIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2">{event.date}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2">{event.time}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOnIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2">{event.location}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2">{event.guestCount} guests</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {events.length === 0 && (
          <Card
            elevation={0}
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 3,
              textAlign: 'center',
              py: 6,
            }}
          >
            <CardContent>
              <EventAvailableIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Events Created Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start building your wedding timeline by adding your first event
              </Typography>
              <PrimaryActionButton startIcon={<AddIcon />} onClick={handleAddEvent}>
                Create First Event
              </PrimaryActionButton>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Event Dialog */}
      <PheraDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ px: 3, pt: 3, pb: 1 }}>
          <Typography variant="h5" component="div">
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {editingEvent ? 'Update your event details' : 'Add a new celebration to your wedding timeline'}
          </Typography>
        </Box>
        
        <DialogContent>
          {/* Template Selection */}
          {!editingEvent && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitleCaps" gutterBottom>
                Choose a Template (Optional)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {eventTemplates.map((template) => (
                  <Button
                    key={template.name}
                    variant={selectedTemplate === template.name ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={<span>{template.icon}</span>}
                    onClick={() => handleTemplateSelect(template)}
                    sx={{ borderRadius: 2 }}
                  >
                    {template.name}
                  </Button>
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Event Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.type}
                label="Event Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="pre-wedding">Pre-Wedding</MenuItem>
                <MenuItem value="main">Main Wedding</MenuItem>
                <MenuItem value="post-wedding">Post-Wedding</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>

            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Expected Guest Count"
              type="number"
              value={formData.guestCount}
              onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) || 0 })}
              fullWidth
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <PrimaryActionButton
            onClick={handleSaveEvent}
            disabled={!formData.name || !formData.type}
          >
            {editingEvent ? 'Update Event' : 'Create Event'}
          </PrimaryActionButton>
        </DialogActions>
      </PheraDialog>
    </Box>
  );
} 