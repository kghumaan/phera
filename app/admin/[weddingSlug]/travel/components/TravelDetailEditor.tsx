'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  IconButton,
  Box,
  TextField,
  Typography,
  Popover,
} from '@mui/material';
import { PrimaryActionButton } from '@/components/admin/ActionButton';
import {
  FormatBold,
  FormatListBulleted,
  Link as LinkIcon,
  SmartButton,
  Delete,
} from '@mui/icons-material';
import { useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import { COLORS, RADII } from '@/lib/theme/tokens';

// Parse CTA from HTML — stored as <div class="phera-cta" data-text="..." data-url="..."></div>
function parseCta(html: string): { body: string; ctaText: string; ctaUrl: string } {
  const ctaRegex = /<div class="phera-cta" data-text="([^"]*)" data-url="([^"]*)"><\/div>/;
  const match = html.match(ctaRegex);
  if (match) {
    return {
      body: html.replace(ctaRegex, '').trim(),
      ctaText: match[1],
      ctaUrl: match[2],
    };
  }
  return { body: html, ctaText: '', ctaUrl: '' };
}

function buildHtml(body: string, ctaText: string, ctaUrl: string): string {
  let html = body;
  if (ctaText.trim() && ctaUrl.trim()) {
    html += `<div class="phera-cta" data-text="${ctaText.replace(/"/g, '&quot;')}" data-url="${ctaUrl.replace(/"/g, '&quot;')}"></div>`;
  }
  return html;
}

interface TravelDetailEditorProps {
  open: boolean;
  initialContent: string;
  onClose: () => void;
  onSave: (html: string) => Promise<void>;
}

export default function TravelDetailEditor({
  open,
  initialContent,
  onClose,
  onSave,
}: TravelDetailEditorProps) {
  const [saving, setSaving] = useState(false);

  // Parse CTA from initial content
  const parsed = parseCta(initialContent || '');
  const [ctaText, setCtaText] = useState(parsed.ctaText);
  const [ctaUrl, setCtaUrl] = useState(parsed.ctaUrl);
  const [showCtaFields, setShowCtaFields] = useState(!!(parsed.ctaText || parsed.ctaUrl));

  // Inline link popover state
  const [linkAnchorEl, setLinkAnchorEl] = useState<HTMLElement | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
    ],
    immediatelyRender: false,
    content: parsed.body || '',
    editorProps: {
      attributes: {
        style: 'min-height: 200px; outline: none; padding: 12px; font-size: 0.925rem; line-height: 1.6; color: #1a1a1a;',
      },
    },
  }, [open, initialContent]);

  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const html = buildHtml(editor.getHTML(), ctaText, ctaUrl);
      await onSave(html);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Inline link: open popover
  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setLinkAnchorEl(e.currentTarget);
    setTimeout(() => linkInputRef.current?.focus(), 100);
  }, [editor]);

  const handleLinkApply = useCallback(() => {
    if (!editor) return;
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
    }
    setLinkAnchorEl(null);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const handleLinkRemove = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkAnchorEl(null);
    setLinkUrl('');
  }, [editor]);

  if (!editor) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: RADII.dialog, bgcolor: COLORS.bg.white } }}
    >
      <DialogTitle sx={{ color: COLORS.text.strong, fontWeight: 600, pb: 0 }}>
        More Details
      </DialogTitle>
      <DialogContent sx={{ bgcolor: COLORS.bg.white }}>
        <Typography variant="body2" sx={{ color: COLORS.text.subtle, mb: 2 }}>
          Add additional notes that you&apos;d like to share with your guests
        </Typography>
        <Stack spacing={1}>
          {/* Toolbar */}
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              pb: 1,
            }}
          >
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleBold().run()}
              sx={{
                bgcolor: editor.isActive('bold') ? 'rgba(222,63,94,0.1)' : 'transparent',
                color: editor.isActive('bold') ? COLORS.brand.primary : COLORS.text.muted,
              }}
            >
              <FormatBold fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              sx={{
                bgcolor: editor.isActive('bulletList') ? 'rgba(222,63,94,0.1)' : 'transparent',
                color: editor.isActive('bulletList') ? COLORS.brand.primary : COLORS.text.muted,
              }}
            >
              <FormatListBulleted fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleLinkClick}
              sx={{
                bgcolor: editor.isActive('link') ? 'rgba(222,63,94,0.1)' : 'transparent',
                color: editor.isActive('link') ? COLORS.brand.primary : COLORS.text.muted,
              }}
            >
              <LinkIcon fontSize="small" />
            </IconButton>

            {/* Link URL popover */}
            <Popover
              open={Boolean(linkAnchorEl)}
              anchorEl={linkAnchorEl}
              onClose={() => setLinkAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              PaperProps={{ sx: { borderRadius: RADII.md, p: 1.5, minWidth: 320, bgcolor: COLORS.bg.white } }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  inputRef={linkInputRef}
                  size="small"
                  label="Link URL"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleLinkApply(); }
                    if (e.key === 'Escape') setLinkAnchorEl(null);
                  }}
                  sx={{
                    flex: 1,
                    mt: 0,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: RADII.md,
                      bgcolor: COLORS.bg.white,
                      '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.23)' },
                      '&:hover fieldset': { borderColor: COLORS.brand.primary },
                      '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary, borderWidth: '2px' },
                    },
                    '& .MuiInputLabel-root': {
                      color: COLORS.text.muted,
                      fontWeight: 500,
                      transform: 'translate(14px, 9px) scale(1)',
                      '&.MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)' },
                      '&.Mui-focused': { color: COLORS.brand.primary },
                    },
                    '& .MuiInputBase-input': { fontSize: '0.875rem' },
                  }}
                />
                <PrimaryActionButton
                  size="small"
                  onClick={handleLinkApply}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                  }}
                >
                  Apply
                </PrimaryActionButton>
                {editor.isActive('link') && (
                  <IconButton size="small" onClick={handleLinkRemove} sx={{ color: COLORS.text.subtle }}>
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Popover>
          </Box>

          {/* Editor */}
          <Box
            sx={{
              border: '1px solid rgba(0,0,0,0.23)',
              borderRadius: RADII.md,
              overflow: 'hidden',
              bgcolor: COLORS.bg.white,
              '& .ProseMirror': {
                minHeight: 200,
                p: 1.5,
                bgcolor: COLORS.bg.white,
                '& p': { margin: '0 0 8px 0' },
                '& ul': { paddingLeft: '20px', margin: '0 0 8px 0', listStyleType: 'disc' },
                '& li': { display: 'list-item', marginBottom: '4px' },
                '& li p': { margin: 0 },
                '& a': { color: COLORS.brand.primary, textDecoration: 'underline' },
              },
              '& .ProseMirror:focus': {
                outline: 'none',
              },
              '& .ProseMirror-focused': {
                borderColor: COLORS.brand.primary,
              },
            }}
          >
            <EditorContent editor={editor} />
          </Box>

          {/* CTA Button section */}
          <Box sx={{ pt: 1 }}>
            {!showCtaFields ? (
              <Button
                startIcon={<SmartButton />}
                onClick={() => setShowCtaFields(true)}
                sx={{
                  color: COLORS.text.subtle,
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: RADII.md,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                }}
              >
                Add a button
              </Button>
            ) : (
              <Box sx={{
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: RADII.md,
                p: 2,
              }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text.strong }}>
                    CTA Button
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setShowCtaFields(false);
                      setCtaText('');
                      setCtaUrl('');
                    }}
                    sx={{ color: COLORS.text.subtle }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Stack>
                <Stack direction="row" spacing={1.5}>
                  <TextField
                    size="small"
                    label="Button Text"
                    placeholder="Book Now"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: RADII.sm,
                        '& fieldset': { borderColor: COLORS.text.faint },
                        '&:hover fieldset': { borderColor: COLORS.brand.primary },
                        '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
                      },
                      '& .MuiInputLabel-root': { color: '#524344', fontSize: '0.875rem', '&.Mui-focused': { color: COLORS.brand.primary } },
                      '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    }}
                  />
                  <TextField
                    size="small"
                    label="Link URL"
                    placeholder="https://..."
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    sx={{
                      flex: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: RADII.sm,
                        '& fieldset': { borderColor: COLORS.text.faint },
                        '&:hover fieldset': { borderColor: COLORS.brand.primary },
                        '&.Mui-focused fieldset': { borderColor: COLORS.brand.primary },
                      },
                      '& .MuiInputLabel-root': { color: '#524344', fontSize: '0.875rem', '&.Mui-focused': { color: COLORS.brand.primary } },
                      '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    }}
                  />
                </Stack>
                {ctaText && ctaUrl && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" sx={{ color: COLORS.text.subtle, mb: 0.5, display: 'block' }}>
                      Preview
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: COLORS.brand.primary,
                        borderRadius: '32px',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        pointerEvents: 'none',
                        '&:hover': { bgcolor: COLORS.brand.primary },
                      }}
                    >
                      {ctaText}
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ bgcolor: COLORS.bg.white, px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: COLORS.text.subtle, borderRadius: RADII.md, textTransform: 'none' }}>Cancel</Button>
        <PrimaryActionButton
          onClick={handleSave}
          loading={saving}
        >
          Save Details
        </PrimaryActionButton>
      </DialogActions>
    </Dialog>
  );
}
