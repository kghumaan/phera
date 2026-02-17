'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  CircularProgress,
  alpha,
} from '@mui/material';
import { LocationOn, Search } from '@mui/icons-material';
import { Coordinates } from '@/lib/supabase/types';

interface LocationPickerProps {
  value?: {
    name: string;
    address: string;
    coordinates: Coordinates;
  } | null;
  onChange: (location: {
    name: string;
    address: string;
    coordinates: Coordinates;
  } | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
  properties: {
    address?: string;
  };
}

export default function LocationPicker({
  value,
  onChange,
  placeholder = 'Search for a location...',
  disabled = false,
}: LocationPickerProps) {
  const [query, setQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2 || !mapboxToken) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${mapboxToken}&types=place,poi,address,locality,neighborhood&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [mapboxToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowSuggestions(true);

    // Clear any existing selection if user is typing
    if (value && newQuery !== value.name) {
      onChange(null);
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchLocations(newQuery);
    }, 300);
  };

  const handleSelectLocation = (feature: MapboxFeature) => {
    const location = {
      name: feature.text,
      address: feature.place_name,
      coordinates: {
        lng: feature.center[0],
        lat: feature.center[1],
      },
    };
    setQuery(feature.text);
    onChange(location);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <Box ref={containerRef} sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        size="small"
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <Search sx={{ color: '#1a1a1a', mr: 1, fontSize: 20 }} />
          ),
          endAdornment: loading ? (
            <CircularProgress size={20} sx={{ color: '#DE3F5E' }} />
          ) : null,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'white',
            borderRadius: 1,
            '& .MuiInputBase-input': {
              color: '#1a1a1a',
              fontWeight: 500,
              '&::placeholder': {
                color: '#6a6a6a',
                opacity: 1,
              },
            },
            '& fieldset': {
              borderColor: '#797979',
            },
            '&:hover fieldset': {
              borderColor: '#DE3F5E',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#DE3F5E',
            },
          },
        }}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            mt: 0.5,
            borderRadius: 2,
            bgcolor: 'white',
            overflow: 'hidden',
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          <List sx={{ py: 0 }}>
            {suggestions.map((feature) => (
              <ListItemButton
                key={feature.id}
                onClick={() => handleSelectLocation(feature)}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    bgcolor: alpha('#DE3F5E', 0.05),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LocationOn sx={{ color: '#DE3F5E' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: 500, color: '#1a1a1a', fontSize: '0.9rem' }}>
                      {feature.text}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{ color: '#6a6a6a', display: 'block', mt: 0.25 }}
                    >
                      {feature.place_name}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {/* No results message */}
      {showSuggestions && !loading && query.length >= 2 && suggestions.length === 0 && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            mt: 0.5,
            borderRadius: 1,
            p: 2,
            textAlign: 'center',
            bgcolor: 'white'
          }}
        >
          <Typography variant="body2" sx={{ color: '#6a6a6a' }}>
            No locations found. Try a different search.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
