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
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Add, Edit, Delete, Save, ExpandMore } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MobilePreviewFrame from '@/components/admin/MobilePreviewFrame';
import { ENHANCED_TEXT_FIELD_SX, ENHANCED_CONTAINER_MAX_WIDTH, ENHANCED_SECTION_SPACING } from '@/lib/constants/form-styles';

// Use the enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

export default function FAQPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentFaq, setCurrentFaq] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'info' | 'warning'>('info');
  const [expandedPreview, setExpandedPreview] = useState<number | false>(0);

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
        const data = await weddingService.getFAQs(wedding.id);
        setFaqs(data);
      }
    } catch (err) {
      console.error('Error loading FAQs:', err);
      const errorMessage = 'Failed to load FAQs';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setCurrentFaq({
      wedding_id: weddingId,
      question: '',
      answer: '',
      button_text: '',
      button_link: '',
      order_index: faqs.length,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = (faq: any) => {
    setCurrentFaq(faq);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentFaq?.question || !currentFaq?.answer) {
      const errorMessage = 'Please fill in question and answer';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return;
    }

    try {
      if (currentFaq.id) {
        await weddingService.updateFAQ(currentFaq.id, currentFaq);
      } else {
        await weddingService.createFAQ(currentFaq);
      }
      await loadData();
      setEditDialogOpen(false);
      setCurrentFaq(null);
      setSuccess(true);
      showToast('Changes saved!', 'success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving FAQ:', err);
      const errorMessage = 'Failed to save FAQ';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await weddingService.deleteFAQ(faqId);
      await loadData();
      setSuccess(true);
      showToast('FAQ deleted successfully', 'success');
    } catch (err) {
      const errorMessage = 'Failed to delete FAQ';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth={ENHANCED_CONTAINER_MAX_WIDTH}>
        <LoadingSpinner message="Loading FAQs..." />
      </Container>
    );
  }

  // Mobile Preview Component
  const MobilePreview = () => (
    <MobilePreviewFrame title="Q + A">
      {faqs.length === 0 ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Box sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '12px',
            p: 3,
            boxShadow: '0px 0px 32px 0px rgba(0, 0, 0, 0.12)',
          }}>
            <Typography sx={{ color: '#6a6a6a', textAlign: 'center', fontSize: 14, fontWeight: 500 }}>
              Add an FAQ to see preview
            </Typography>
          </Box>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {faqs.map((faq, index) => (
            <Accordion
              key={faq.id}
              expanded={expandedPreview === index}
              onChange={() => setExpandedPreview(expandedPreview === index ? false : index)}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px !important',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: '0 !important',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: '#000', fontSize: 20 }} />}
                sx={{
                  minHeight: '48px !important',
                  '& .MuiAccordionSummary-content': {
                    margin: '8px 0 !important',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Outfit',
                    fontWeight: 600,
                    color: '#141414',
                    fontSize: 14,
                  }}
                >
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                <Typography
                  sx={{
                    color: '#666',
                    lineHeight: 1.6,
                    fontSize: 12,
                    fontFamily: 'Outfit',
                  }}
                >
                  {faq.answer}
                </Typography>
                {faq.button_text && (
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      mt: 1.5,
                      borderRadius: '12px',
                      borderColor: '#DE3F5E',
                      color: '#DE3F5E',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '6.25%',
                      fontFamily: 'Outfit',
                      fontSize: 10,
                      py: 0.75,
                    }}
                  >
                    {faq.button_text}
                  </Button>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </MobilePreviewFrame>
  );

  return (
    <Container maxWidth="xl">
      <Grid container spacing={4}>
        {/* Left Column - Form Controls */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={ENHANCED_SECTION_SPACING}>
            <Box>
              <Typography variant="h4" sx={{ fontFamily: 'var(--font-instrument-serif)', fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                Frequently Asked Questions
              </Typography>
              <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
                Add common questions and answers for your guests
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
          Add FAQ
        </Button>

        <Stack spacing={2}>
          {faqs.map((faq, index) => (
            <Paper key={faq.id} sx={{ 
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
                    {faq.question}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                    {faq.answer}
                  </Typography>
                  {faq.button_text && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#DE3F5E' }}>
                      Button: {faq.button_text} → {faq.button_link}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" onClick={() => handleEdit(faq)} color="error">
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(faq.id)} color="error">
                    <Delete />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          ))}

          {faqs.length === 0 && (
            <Paper sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: '16px',
              bgcolor: 'white',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}>
              <Typography sx={{ color: '#6a6a6a' }}>
                No FAQs yet. Add your first question.
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
          <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>{currentFaq?.id ? 'Edit FAQ' : 'New FAQ'}</DialogTitle>
          <DialogContent sx={{ bgcolor: 'white' }}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Question *"
                fullWidth
                value={currentFaq?.question || ''}
                onChange={(e) => setCurrentFaq({ ...currentFaq, question: e.target.value })}
                sx={textFieldSx}
              />
              <TextField
                label="Answer *"
                fullWidth
                multiline
                rows={4}
                value={currentFaq?.answer || ''}
                onChange={(e) => setCurrentFaq({ ...currentFaq, answer: e.target.value })}
                sx={textFieldSx}
              />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '1rem' }}>Optional Button</Typography>
              <TextField
                label="Button Text"
                fullWidth
                value={currentFaq?.button_text || ''}
                onChange={(e) => setCurrentFaq({ ...currentFaq, button_text: e.target.value })}
                placeholder="e.g., View Registry"
                sx={textFieldSx}
              />
              <TextField
                label="Button Link"
                fullWidth
                value={currentFaq?.button_link || ''}
                onChange={(e) => setCurrentFaq({ ...currentFaq, button_link: e.target.value })}
                placeholder="e.g., /registry"
                sx={textFieldSx}
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

