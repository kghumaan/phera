'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Box,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import { PheraDialog } from '@/components/shared/Dialog';
import { Close as CloseIcon, Search as SearchIcon, Gif as GifIcon } from '@mui/icons-material';
import { GifData } from '@/lib/supabase/types';
import { COLORS } from '@/lib/theme/tokens';

interface GifPickerProps {
  open: boolean;
  onClose: () => void;
  onSelectGif: (gif: GifData) => void;
}

export default function GifPicker({ open, onClose, onSelectGif }: GifPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchGifs = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/giphy?q=${encodeURIComponent(query)}&limit=20`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setGifs(data.data);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching GIFs:', error);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingGifs = async () => {
    setLoading(true);
    try {
      // Search for Indian marriage related GIFs instead of trending
      const response = await fetch(`/api/giphy?q=${encodeURIComponent('indian wedding')}&limit=20`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setGifs(data.data);
      setHasSearched(true);
    } catch (error) {
      console.error('Error loading indian wedding GIFs:', error);
      // Fallback to celebration GIFs if Indian wedding search fails
      try {
        const fallbackResponse = await fetch(`/api/giphy?q=${encodeURIComponent('celebration')}&limit=20`);
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback API error: ${fallbackResponse.status}`);
        }
        const fallbackData = await fallbackResponse.json();
        setGifs(fallbackData.data);
      } catch (fallbackError) {
        console.error('Error loading fallback GIFs:', fallbackError);
        setGifs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGif = (gif: any) => {
    const gifData: GifData = {
      id: gif.id,
      url: gif.images.original.url,
      title: gif.title,
      preview_url: gif.images.downsized_medium?.url || gif.images.downsized?.url || gif.images.fixed_width.url,
    };
    onSelectGif(gifData);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchGifs(searchTerm);
    }
  };

  // Load trending GIFs when dialog opens
  React.useEffect(() => {
    if (open && !hasSearched) {
      loadTrendingGifs();
    }
  }, [open]);

  return (
    <PheraDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '600px',
          border: '1px solid #000',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'white',
        p: 2,
        py: 1.5,
                fontWeight: 500,
        color: COLORS.text.strong,
        fontSize: '1.1rem'
      }}>
        Choose a GIF
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{
            color: COLORS.text.strong,
            p: 0.5,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {/* Search Section */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: 'white' }}>
          {/* Search Input */}
          <Box sx={{ position: 'relative', mb: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search for GIFs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#808080', mr: 1, fontSize: '1.2rem' }} />,
                endAdornment: searchTerm.trim() && (
                  <IconButton
                    size="small"
                    onClick={() => searchGifs(searchTerm)}
                    disabled={loading}
                    sx={{
                      color: COLORS.brand.primary,
                      p: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(222, 63, 94, 0.1)',
                      },
                      '&:disabled': {
                        color: COLORS.text.faint,
                      },
                    }}
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(248, 248, 248, 1)',
                  height: '40px',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.12)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: COLORS.brand.primary,
                    borderWidth: '1px',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: COLORS.text.strong,
                  fontSize: '0.9rem',
                  py: 0,
                  '&::placeholder': {
                    color: COLORS.text.faint,
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>
          
          {/* Quick Tags */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {['bollywood dance', 'celebration', 'love', 'indian wedding', 'excited', 'happy'].map((tag) => (
              <Box
                key={tag}
                component="button"
                onClick={() => {
                  setSearchTerm(tag);
                  searchGifs(tag);
                }}
                sx={{
                  border: 'none',
                  borderRadius: '12px',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.875rem',
                  backgroundColor: 'rgba(222, 63, 94, 0.08)',
                  color: COLORS.brand.primary,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(222, 63, 94, 0.15)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                {tag}
              </Box>
            ))}
          </Box>
        </Box>

        {/* GIFs Grid */}
        <Box sx={{ p: 2, minHeight: '400px', backgroundColor: 'white' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress sx={{ color: COLORS.brand.primary }} size={32} />
            </Box>
          ) : gifs.length > 0 ? (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: 'repeat(2, 1fr)', 
                sm: 'repeat(3, 1fr)', 
                md: 'repeat(4, 1fr)' 
              }, 
              gap: 1.5
            }}>
              {gifs.map((gif) => (
                <Box
                  key={gif.id}
                  sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '100%', // Square aspect ratio
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                  }}
                  onClick={() => handleSelectGif(gif)}
                >
                  <Image
                    src={gif.images.downsized_medium?.url || gif.images.downsized?.url || gif.images.fixed_width.url}
                    alt={gif.title}
                    fill
                    style={{
                      objectFit: 'cover',
                    }}
                    unoptimized // For external GIF URLs
                  />
                </Box>
              ))}
            </Box>
          ) : hasSearched ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" sx={{ 
                color: 'rgba(0, 0, 0, 0.48)',
                fontSize: '0.9rem'
              }}>
                No GIFs found. Try a different search term.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <GifIcon sx={{ fontSize: 48, color: COLORS.text.faint, mb: 1 }} />
              <Typography variant="body2" sx={{ 
                color: 'rgba(0, 0, 0, 0.48)',
                fontSize: '0.9rem'
              }}>
                Search for GIFs to add to your message!
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: 'white' }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          size="small"
          sx={{
            borderRadius: '12px',
            borderColor: 'rgba(0, 0, 0, 0.23)',
            color: COLORS.text.strong,
            fontWeight: 500,
            textTransform: 'none',
            px: 2,
            fontSize: '0.9rem',
            '&:hover': {
              borderColor: COLORS.text.strong,
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </PheraDialog>
  );
} 