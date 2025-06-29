'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon, Gif as GifIcon } from '@mui/icons-material';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { GifData } from '@/lib/supabase/types';

// You'll need to get a GIPHY API key from https://developers.giphy.com/
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'your-giphy-api-key-here';
const gf = new GiphyFetch(GIPHY_API_KEY);

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
      const { data } = await gf.search(query, { limit: 20 });
      setGifs(data);
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
      const { data } = await gf.search('indian wedding', { limit: 20 });
      setGifs(data);
      setHasSearched(true);
    } catch (error) {
      console.error('Error loading indian wedding GIFs:', error);
      // Fallback to trending if Indian wedding search fails
      try {
        const { data: fallbackData } = await gf.trending({ limit: 20 });
        setGifs(fallbackData);
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
      preview_url: gif.images.preview_gif.url,
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          minHeight: '600px',
          border: '1px solid #000',
          backgroundColor: 'white',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'white',
        p: 3,
        fontFamily: 'Outfit', 
        fontWeight: 400,
        color: '#000',
        fontSize: '1.25rem'
      }}>
        Choose a GIF
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{
            color: '#000',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {/* Search Section */}
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: 'white' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Search for GIFs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#808080', mr: 1 }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '& fieldset': {
                    borderColor: '#808080',
                  },
                  '&:hover fieldset': {
                    borderColor: '#808080',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#DAA520',
                    borderWidth: '2px',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: '#000',
                  fontFamily: 'Outfit',
                  '&::placeholder': {
                    color: '#C2C2C2',
                    opacity: 1,
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => searchGifs(searchTerm)}
              disabled={loading || !searchTerm.trim()}
              sx={{
                borderRadius: '16px',
                minWidth: 'auto',
                px: 3,
                backgroundColor: '#DE3F5E',
                color: 'white',
                fontFamily: 'Outfit',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#C8365A',
                },
                '&:disabled': {
                  backgroundColor: '#ccc',
                  color: '#999',
                },
              }}
            >
              Search
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            {['bollywood dance', 'celebration', 'love', 'indian wedding', 'excited', 'happy'].map((tag) => (
              <Button
                key={tag}
                size="small"
                variant="outlined"
                onClick={() => {
                  setSearchTerm(tag);
                  searchGifs(tag);
                }}
                sx={{
                  borderRadius: '16px',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  fontFamily: 'Outfit',
                  borderColor: '#808080',
                  color: '#000',
                  '&:hover': {
                    borderColor: '#DE3F5E',
                    backgroundColor: 'rgba(222, 63, 94, 0.04)',
                    color: '#DE3F5E',
                  },
                }}
              >
                {tag}
              </Button>
            ))}
          </Box>
        </Box>

        {/* GIFs Grid */}
        <Box sx={{ p: 3, minHeight: '400px', backgroundColor: 'white' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress sx={{ color: '#DE3F5E' }} />
            </Box>
          ) : gifs.length > 0 ? (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: 'repeat(2, 1fr)', 
                sm: 'repeat(3, 1fr)', 
                md: 'repeat(4, 1fr)' 
              }, 
              gap: 2
            }}>
              {gifs.map((gif) => (
                <Box
                  key={gif.id}
                  sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '100%', // Square aspect ratio
                    borderRadius: '16px',
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
                  <img
                    src={gif.images.fixed_width.url}
                    alt={gif.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ))}
            </Box>
          ) : hasSearched ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" sx={{ 
                color: 'rgba(0, 0, 0, 0.48)',
                fontFamily: 'Outfit',
                fontSize: '1rem'
              }}>
                No GIFs found. Try a different search term.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <GifIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
              <Typography variant="body1" sx={{ 
                color: 'rgba(0, 0, 0, 0.48)',
                fontFamily: 'Outfit',
                fontSize: '1rem'
              }}>
                Search for GIFs to add to your message!
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(0, 0, 0, 0.08)', backgroundColor: 'white' }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{
            borderRadius: '16px',
            borderColor: '#808080',
            color: '#000',
            fontFamily: 'Outfit',
            fontWeight: 600,
            textTransform: 'none',
            px: 3,
            '&:hover': {
              borderColor: '#000',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
} 