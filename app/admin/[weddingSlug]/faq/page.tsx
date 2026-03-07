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
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useState, useEffect, use } from 'react';
import { Add, Edit, Delete, ExpandMore, Check } from '@mui/icons-material';
import { weddingService } from '@/lib/supabase/wedding-service';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

import { ENHANCED_TEXT_FIELD_SX, ENHANCED_CONTAINER_MAX_WIDTH, ENHANCED_SECTION_SPACING, SECONDARY_BUTTON_SX } from '@/lib/constants/form-styles';
import { useAdminRole } from '@/lib/contexts/AdminRoleContext';
import ContinueButton from '@/components/admin/ContinueButton';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

// Use the enhanced TextField styling
const textFieldSx = ENHANCED_TEXT_FIELD_SX;

const FAQ_TEMPLATES = [
  { question: 'What is the dress code?', answer: 'Please refer to the event details for the dress code for each function.' },
  { question: 'Can I bring a plus one?', answer: 'Please check your invitation for plus one details. If you have any questions, feel free to reach out to us.' },
  { question: 'Is there parking available?', answer: 'Yes, complimentary parking is available at the venue. Details will be shared closer to the date.' },
  { question: 'What time should I arrive?', answer: 'We recommend arriving 15-30 minutes before the ceremony start time.' },
  { question: 'Are children welcome?', answer: 'We love your little ones! Please check your invitation for details about children at the event.' },
  { question: 'Will there be vegetarian/dietary options?', answer: 'Yes, we will have a variety of dietary options available. Please let us know of any allergies or restrictions in your RSVP.' },
  { question: 'Can I take photos during the ceremony?', answer: 'We kindly request an unplugged ceremony. Our photographer will capture every moment. Please feel free to take photos during the reception!' },
  { question: 'Where is the gift registry?', answer: 'Your presence is our greatest gift! If you would like to contribute, please check our registry page.' },
  { question: 'Will transportation be provided?', answer: 'Shuttle service will be available between the hotel and venue. Please check the transportation page for details.' },
  { question: 'What if I have dietary restrictions?', answer: 'Please mention any dietary restrictions or allergies when you RSVP, and we will do our best to accommodate them.' },
];

export default function FAQPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const { isViewOnly } = useAdminRole();
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
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [showLinkFields, setShowLinkFields] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

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
    if (isViewOnly) return;
    setCurrentFaq({
      wedding_id: weddingId,
      question: '',
      answer: '',
      button_text: '',
      button_link: '',
      order_index: faqs.length,
    });
    setShowLinkFields(false);
    setEditDialogOpen(true);
  };

  const handleEdit = (faq: any) => {
    setCurrentFaq(faq);
    setShowLinkFields(!!faq.button_text);
    setEditDialogOpen(true);
  };

  const handleSelectTemplate = (template: typeof FAQ_TEMPLATES[0]) => {
    if (isViewOnly) return;
    setCurrentFaq({
      wedding_id: weddingId,
      question: template.question,
      answer: template.answer,
      button_text: '',
      button_link: '',
      order_index: faqs.length,
    });
    setShowLinkFields(false);
    setTemplateDialogOpen(false);
    setEditDialogOpen(true);
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (isViewOnly) return;
    if (!currentFaq?.question || !currentFaq?.answer) {
      const errorMessage = 'Please fill in question and answer';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return;
    }

    setSaving(true);
    try {
      if (currentFaq.id) {
        await weddingService.updateFAQ(currentFaq.id, currentFaq);
      } else {
        await weddingService.createFAQ(currentFaq);
      }
      await loadData();
      if (weddingId) {
        await weddingService.markUnpublishedChanges(weddingId);
        const channel = new BroadcastChannel('phera-design-sync');
        channel.postMessage({ type: 'PREVIEW_REFRESH' });
        channel.close();
      }
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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faqId: string) => {
    if (isViewOnly) return;
    setConfirmDialog({
      open: true,
      message: 'Delete this FAQ?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          await weddingService.deleteFAQ(faqId);
          await loadData();
          if (weddingId) {
            await weddingService.markUnpublishedChanges(weddingId);
            const channel = new BroadcastChannel('phera-design-sync');
            channel.postMessage({ type: 'PREVIEW_REFRESH' });
            channel.close();
          }
          setSuccess(true);
          showToast('FAQ deleted successfully', 'success');
        } catch (err) {
          const errorMessage = 'Failed to delete FAQ';
          setError(errorMessage);
          showToast(errorMessage, 'error');
        }
      },
    });
  };

  const isTemplateAlreadyAdded = (templateQuestion: string) => {
    return faqs.some(faq => faq.question.trim().toLowerCase() === templateQuestion.trim().toLowerCase());
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 700 }}>
        <LoadingSpinner message="Loading FAQs..." />
      </Box>
    );
  }



  return (
    <Box sx={{ maxWidth: 700 }}>
      <Stack spacing={ENHANCED_SECTION_SPACING}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
            Frequently Asked Questions
          </Typography>
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            Add common questions and answers for your guests
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setTemplateDialogOpen(true)}
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
            Add from Template
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAdd}
            sx={SECONDARY_BUTTON_SX}
          >
            Add Custom FAQ
          </Button>
        </Stack>

        <Stack spacing={2}>
          {faqs.map((faq, index) => (
            <Paper key={faq.id} sx={{
              p: 3,
              borderRadius: '16px',
              bgcolor: '#fafafa',
              boxShadow: 'none',
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
              boxShadow: 'none',
            }}>
              <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
                No FAQs yet. Add your first question.
              </Typography>
            </Paper>
          )}
        </Stack>

        {/* Template Selection Dialog */}
        <Dialog
          open={templateDialogOpen}
          onClose={() => setTemplateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '24px',
              bgcolor: 'white',
            }
          }}
        >
          <DialogTitle sx={{ color: '#1a1a1a', fontWeight: 600 }}>Choose a Template</DialogTitle>
          <DialogContent sx={{ bgcolor: 'white' }}>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {FAQ_TEMPLATES.map((template) => {
                const alreadyAdded = isTemplateAlreadyAdded(template.question);
                return (
                  <Paper
                    key={template.question}
                    sx={{
                      p: 2,
                      cursor: alreadyAdded ? 'default' : 'pointer',
                      borderRadius: '12px',
                      bgcolor: alreadyAdded ? '#f5f5f5' : 'white',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      opacity: alreadyAdded ? 0.6 : 1,
                      '&:hover': alreadyAdded ? {} : {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                    onClick={() => !alreadyAdded && handleSelectTemplate(template)}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      {alreadyAdded && <Check sx={{ color: '#10B981', fontSize: 20 }} />}
                      <Typography variant="body1" sx={{ fontWeight: 500, color: alreadyAdded ? '#6a6a6a' : '#1a1a1a' }}>
                        {template.question}
                      </Typography>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 2 }}>
            <Button onClick={() => setTemplateDialogOpen(false)} sx={{ color: '#6a6a6a' }}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Edit FAQ Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
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
              <FormControlLabel
                control={
                  <Switch
                    checked={showLinkFields}
                    onChange={(e) => {
                      setShowLinkFields(e.target.checked);
                      if (!e.target.checked) {
                        setCurrentFaq({ ...currentFaq, button_text: '', button_link: '' });
                      }
                    }}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#DE3F5E',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        bgcolor: '#DE3F5E',
                      },
                    }}
                  />
                }
                label="Add a link?"
                sx={{ '& .MuiFormControlLabel-label': { color: '#1a1a1a', fontWeight: 500 } }}
              />
              {showLinkFields && (
                <>
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
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 2 }}>
            <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#6a6a6a' }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
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
              {saving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmDialog
          open={confirmDialog.open}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        />

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
      <ContinueButton weddingSlug={weddingSlug} currentSection="faq" weddingId={weddingId} />
    </Box>
  );
}
