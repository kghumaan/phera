'use client';

import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Add, Edit, Delete, Save, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import ImageUpload from '@/components/admin/ImageUpload';
import { getWeddingImagePath } from '@/lib/utils/image-upload';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MobilePreviewFrame from '@/components/admin/MobilePreviewFrame';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_CONTAINER_MAX_WIDTH, ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';

// Use the enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

export default function TravelPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('info');
  const [previewSlide, setPreviewSlide] = useState(0);

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
      const wedding = await weddingService.getWeddingBySlug(weddingSlug);
      if (wedding) {
        setWeddingId(wedding.id);
        const data = await weddingService.getTravelCards(wedding.id);
        setCards(data);
      }
    } catch (err) {
      console.error('Error loading travel cards:', err);
      const errorMessage = 'Failed to load travel cards';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setCurrentCard({
      wedding_id: weddingId,
      title: '',
      content: [],
      image_url: '',
      button_text: '',
      button_action: '',
      is_whatsapp_button: false,
      is_disabled: false,
      order_index: cards.length,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = (card: any) => {
    setCurrentCard({
      ...card,
      content: Array.isArray(card.content) ? card.content.join('\n\n') : card.content,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentCard?.title || !currentCard?.image_url) {
      const errorMessage = 'Please fill in title and image';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return;
    }

    try {
      const contentArray = currentCard.content
        .split('\n\n')
        .filter((p: string) => p.trim());

      const saveData = {
        ...currentCard,
        content: contentArray,
      };

      if (currentCard.id) {
        await weddingService.updateTravelCard(currentCard.id, saveData);
      } else {
        await weddingService.createTravelCard(saveData);
      }
      await loadData();
      setEditDialogOpen(false);
      setCurrentCard(null);
      setSuccess(true);
      showToast('Changes saved!', 'success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving travel card:', err);
      const errorMessage = 'Failed to save travel card';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('Delete this card?')) return;
    try {
      await weddingService.deleteTravelCard(cardId);
      await loadData();
      setSuccess(true);
      showToast('Card deleted successfully', 'success');
    } catch (err) {
      const errorMessage = 'Failed to delete card';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
        <LoadingSpinner message="Loading travel cards..." />
      </Container>
    );
  }

  // Mobile Preview Component
  const MobilePreview = () => {
    const currentPreviewCard = cards[previewSlide];

    return (
      <MobilePreviewFrame
        title="Travel & Stay"
        backgroundImage="/images/backgrounds/rose-quartz.png"
        overlay={
          cards.length > 1 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 32,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1.5,
                zIndex: 10,
              }}
            >
              <IconButton
                size="small"
                onClick={() => setPreviewSlide((prev) => (prev - 1 + cards.length) % cards.length)}
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    backgroundColor: '#fff',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <ChevronLeft fontSize="medium" sx={{ color: '#1a1a1a' }} />
              </IconButton>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2.5,
                  py: 1,
                  backgroundColor: '#DE3F5E',
                  borderRadius: '20px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(222, 63, 94, 0.3)',
                }}
              >
                {previewSlide + 1} / {cards.length}
              </Box>
              <IconButton
                size="small"
                onClick={() => setPreviewSlide((prev) => (prev + 1) % cards.length)}
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    backgroundColor: '#fff',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <ChevronRight fontSize="medium" sx={{ color: '#1a1a1a' }} />
              </IconButton>
            </Box>
          )
        }
      >
        {cards.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Box sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '12px',
              p: 3,
              boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.12)',
            }}>
              <Typography sx={{ color: '#6a6a6a', textAlign: 'center', fontSize: 14, fontWeight: 500 }}>
                Add a card to see preview
              </Typography>
            </Box>
          </Box>
        ) : currentPreviewCard ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', pb: 6 }}>
            <Card
              sx={{
                width: '100%',
                maxWidth: '90%',
                height: '85%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.12)',
                border: 'none',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent
                sx={{
                  p: { xs: 2.5, lg: 3 },
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  overflow: 'auto',
                }}
              >
                <Stack spacing={1.5}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'Outfit',
                      fontWeight: 400,
                      fontSize: { xs: 24, lg: 22 },
                      lineHeight: 1.3,
                      color: '#141414',
                      textAlign: 'left',
                    }}
                  >
                    {currentPreviewCard.title || 'Untitled Card'}
                  </Typography>
                  {currentPreviewCard.content && Array.isArray(currentPreviewCard.content) && (
                    <Stack spacing={1}>
                      {currentPreviewCard.content.slice(0, 2).map((paragraph: string, index: number) => (
                        <Typography
                          key={index}
                          variant="body2"
                          sx={{
                            fontFamily: 'Outfit',
                            fontWeight: 400,
                            fontSize: { xs: 16, lg: 15 },
                            lineHeight: 1.5,
                            color: '#474747',
                            textAlign: 'left',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {paragraph}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </Stack>
                <Box sx={{ flex: 1 }} />
                {currentPreviewCard.button_text && (
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Button
                      variant={currentPreviewCard.is_whatsapp_button ? "contained" : "outlined"}
                      disabled={currentPreviewCard.is_disabled}
                      fullWidth
                      sx={{
                        borderRadius: '80px',
                        padding: { xs: '12px 20px', lg: '11px 18px' },
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        fontSize: { xs: 15, lg: 14 },
                        letterSpacing: '6.25%',
                        ...(currentPreviewCard.is_whatsapp_button ? {
                          backgroundColor: currentPreviewCard.is_disabled ? '#BCBCBC' : '#000',
                          color: '#fff',
                        } : {
                          color: currentPreviewCard.is_disabled ? '#BCBCBC' : '#DE3F5E',
                          borderColor: currentPreviewCard.is_disabled ? '#BCBCBC' : '#DE3F5E',
                        })
                      }}
                    >
                      {currentPreviewCard.button_text}
                    </Button>
                  </Box>
                )}
              </CardContent>

              {currentPreviewCard.image_url && (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '45%',
                    minHeight: 160,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="img"
                    src={currentPreviewCard.image_url}
                    alt={currentPreviewCard.title}
                    sx={{
                      width: '120%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                    }}
                  />
                </Box>
              )}
            </Card>
          </Box>
        ) : null}
      </MobilePreviewFrame>
    );
  };

  return (
    <Container maxWidth="xl">
      <Grid container spacing={{ xs: 4, lg: 8 }}>
        {/* Left Column - Form Controls */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={ENHANCED_SECTION_SPACING}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                Travel & Stay Information
              </Typography>
              <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
                Create carousel cards with travel and accommodation details
              </Typography>
            </Box>

            <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleAdd}
          sx={{
            bgcolor: '#DE3F5E',
            color: 'white',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              bgcolor: '#C8365A',
            },
          }}
        >
          Add Card
        </Button>

        <Stack spacing={2}>
          {cards.map((card) => (
            <Paper key={card.id} sx={{ 
              p: 3,
              borderRadius: '16px',
              bgcolor: '#fafafa',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }
            }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                    {card.title}
                  </Typography>
                  {card.image_url && (
                    <Box
                      component="img"
                      src={card.image_url}
                      alt={card.title}
                      sx={{ width: 200, height: 120, objectFit: 'cover', borderRadius: 1, mb: 1 }}
                    />
                  )}
                  {card.content && Array.isArray(card.content) && card.content.length > 0 ? (
                    <Stack spacing={0.5} sx={{ mb: 1 }}>
                      {card.content.slice(0, 2).map((paragraph: string, index: number) => (
                        <Typography 
                          key={index}
                          variant="body2" 
                          sx={{ 
                            color: '#6a6a6a',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {paragraph}
                        </Typography>
                      ))}
                      {card.content.length > 2 && (
                        <Typography variant="caption" sx={{ color: '#6a6a6a', fontStyle: 'italic' }}>
                          +{card.content.length - 2} more paragraph{card.content.length - 2 > 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                      No content yet
                    </Typography>
                  )}
                  {card.button_text && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#DE3F5E' }}>
                      Button: {card.button_text}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" onClick={() => handleEdit(card)} color="error">
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(card.id)} color="error">
                    <Delete />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))}

          {cards.length === 0 && (
            <Paper sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: '16px',
              bgcolor: 'white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}>
              <Typography sx={{ color: '#6a6a6a' }}>
                No travel cards yet. Add your first card.
              </Typography>
            </Paper>
          )}
        </Stack>

        <Dialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '24px',
              bgcolor: 'white',
            }
          }}
        >
          <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>{currentCard?.id ? 'Edit Card' : 'New Card'}</DialogTitle>
          <DialogContent sx={{ bgcolor: 'white' }}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Card Title *"
                fullWidth
                value={currentCard?.title || ''}
                onChange={(e) => setCurrentCard({ ...currentCard, title: e.target.value })}
                sx={textFieldSx}
              />

              <TextField
                label="Content *"
                fullWidth
                multiline
                rows={6}
                value={currentCard?.content || ''}
                onChange={(e) => setCurrentCard({ ...currentCard, content: e.target.value })}
                helperText="Separate paragraphs with double line breaks"
                sx={textFieldSx}
              />

              {weddingId && (
                <ImageUpload
                  label="Card Image *"
                  value={currentCard?.image_url}
                  onChange={(url) => setCurrentCard({ ...currentCard, image_url: url })}
                  path={getWeddingImagePath(weddingId, 'carousel')}
                  aspectRatio="16/9"
                  maxWidth={600}
                />
              )}

              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1rem' }}>Optional Button</Typography>
              
              <TextField
                label="Button Text"
                fullWidth
                value={currentCard?.button_text || ''}
                onChange={(e) => setCurrentCard({ ...currentCard, button_text: e.target.value })}
                sx={textFieldSx}
              />

              <TextField
                label="Button Action (URL or route)"
                fullWidth
                value={currentCard?.button_action || ''}
                onChange={(e) => setCurrentCard({ ...currentCard, button_action: e.target.value })}
                helperText="e.g., /events or https://booking.com"
                sx={textFieldSx}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentCard?.is_whatsapp_button || false}
                    onChange={(e) => setCurrentCard({ ...currentCard, is_whatsapp_button: e.target.checked })}
                  />
                }
                label="WhatsApp Button"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentCard?.is_disabled || false}
                    onChange={(e) => setCurrentCard({ ...currentCard, is_disabled: e.target.checked })}
                  />
                }
                label="Disable Button"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#6a6a6a' }}>Cancel</Button>
            <Button 
              variant="contained" 
              startIcon={<Save />} 
              onClick={handleSave}
              sx={{
                bgcolor: '#DE3F5E',
                color: 'white',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#C8365A',
                },
              }}
            >
              Save
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
        </Grid>

        {/* Right Column - Sticky Mobile Preview (Desktop only) */}
        <Grid size={{ xs: 12, lg: 5 }} sx={{ display: { xs: 'none', lg: 'block' } }}>
          <MobilePreview />
        </Grid>

        {/* Mobile Preview at Bottom (Mobile only) */}
        <Grid size={{ xs: 12 }} sx={{ display: { xs: 'block', lg: 'none' }, mt: 4 }}>
          <MobilePreview />
        </Grid>
      </Grid>
    </Container>
  );
}

