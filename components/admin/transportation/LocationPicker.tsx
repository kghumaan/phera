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
  IconButton,
} from '@mui/material';
import { LocationOn, Search, Edit, Clear } from '@mui/icons-material';
import { Coordinates } from '@/lib/supabase/types';
import { COLORS, RADII } from '@/lib/theme/tokens';

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
  label?: string;
  disabled?: boolean;
  proximity?: Coordinates;
}

// Mapbox Search Box API suggestion shape
interface MapboxSuggestion {
  mapbox_id: string;
  name: string;
  full_address?: string;
  place_formatted?: string;
  feature_type: string;
}

// Mapbox Retrieve API response shape
interface MapboxRetrieveFeature {
  properties: {
    mapbox_id: string;
    name: string;
    full_address?: string;
    coordinates: {
      longitude: number;
      latitude: number;
    };
  };
}

// Internal unified shape used by the component
interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
}

export default function LocationPicker({
  value,
  onChange,
  placeholder = 'Search for a location...',
  label,
  disabled = false,
  proximity,
}: LocationPickerProps) {
  const [query, setQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Session token groups suggest+retrieve calls for billing purposes
  const sessionTokenRef = useRef<string>(crypto.randomUUID());

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Sync internal query state with the value prop if it changes from outside
  useEffect(() => {
    if (value) {
      setQuery(value.name);
    } else {
      setQuery('');
    }
  }, [value]);

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
      // Use the Mapbox Search Box API — much better hotel/POI coverage than the old geocoding v5 API
      let url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(
        searchQuery
      )}&access_token=${mapboxToken}&session_token=${sessionTokenRef.current}&types=poi,address,place,locality,neighborhood&limit=10`;

      if (proximity) {
        url += `&proximity=${proximity.lng},${proximity.lat}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      const rawSuggestions: MapboxSuggestion[] = data.suggestions || [];

      // Map to our internal shape (center is filled in when user selects)
      const mapped: MapboxFeature[] = rawSuggestions.map((s) => ({
        id: s.mapbox_id,
        place_name: s.full_address || s.place_formatted || s.name,
        text: s.name,
        center: [0, 0], // placeholder — resolved on selection via retrieve call
      }));

      setSuggestions(mapped);
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

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onChange(null);
  };

  const handleSelectLocation = async (feature: MapboxFeature) => {
    if (!mapboxToken) return;

    setLoading(true);
    try {
      // Retrieve the full details (including coordinates) for the selected suggestion
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${feature.id}?access_token=${mapboxToken}&session_token=${sessionTokenRef.current}`
      );
      const data = await response.json();
      const retrieved: MapboxRetrieveFeature = data.features?.[0];

      if (retrieved) {
        const displayName = feature.text || retrieved.properties.name || retrieved.properties.full_address || feature.place_name || 'Generic Location';
        const displayAddress = retrieved.properties.full_address || feature.place_name || displayName || 'Address unknown';

        const location = {
          name: displayName,
          address: displayAddress,
          coordinates: {
            lng: retrieved.properties.coordinates.longitude,
            lat: retrieved.properties.coordinates.latitude,
          },
        };

        setQuery(displayName);
        onChange(location);
      }
    } catch (error) {
      console.error('Error retrieving location details:', error);
    } finally {
      setLoading(false);
    }

    setShowSuggestions(false);
    setSuggestions([]);
    // Reset session token so the next search is a fresh session
    sessionTokenRef.current = crypto.randomUUID();
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <Box ref={containerRef} sx={{ position: 'relative' }}>
      {value && !showSuggestions ? (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            bgcolor: alpha(COLORS.brand.primary, 0.03),
            border: '1px solid',
            borderColor: alpha(COLORS.brand.primary, 0.2),
            borderRadius: 1,
            minHeight: 40,
            width: '100%',
          }}
        >
          <LocationOn sx={{ color: COLORS.brand.primary, mr: 1, fontSize: 20, flexShrink: 0 }} />
          <Box sx={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 600,
                color: COLORS.text.strong,
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {value.name || value.address || 'Selected Location'}
            </Typography>
            {(value.address && value.address !== value.name) && (
              <Typography
                variant="caption"
                sx={{
                  color: COLORS.text.subtle,
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {value.address}
              </Typography>
            )}
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setShowSuggestions(true);
            }}
            sx={{
              ml: 1,
              flexShrink: 0,
              color: COLORS.text.subtle,
              '&:hover': { color: COLORS.brand.primary, bgcolor: alpha(COLORS.brand.primary, 0.05) },
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            sx={{
              flexShrink: 0,
              color: COLORS.text.subtle,
              '&:hover': { color: COLORS.brand.primary, bgcolor: alpha(COLORS.brand.primary, 0.05) },
            }}
          >
            <Clear fontSize="small" />
          </IconButton>
        </Paper>
      ) : (
        <TextField
          fullWidth
          autoFocus={showSuggestions && !!value}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          label={label}
          placeholder={label ? undefined : placeholder}
          disabled={disabled}
          InputProps={{
            startAdornment: <Search sx={{ color: COLORS.text.subtle, mr: 1, fontSize: 20 }} />,
            endAdornment: loading ? (
              <CircularProgress size={20} sx={{ color: COLORS.brand.primary }} />
            ) : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: COLORS.bg.white,
              borderRadius: RADII.md,
              '& .MuiInputBase-input': {
                color: COLORS.text.strong,
                py: { xs: 1.5, md: 1.75, lg: 2 },
              },
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: COLORS.brand.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: COLORS.brand.primary,
                borderWidth: '2px',
              },
            },
            '& .MuiInputLabel-root': {
              color: COLORS.text.muted,
              fontWeight: 500,
              '&.Mui-focused': {
                color: COLORS.brand.primary,
              },
            },
          }}
        />
      )}

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
            bgcolor: COLORS.bg.white,
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
                    bgcolor: alpha(COLORS.brand.primary, 0.05),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LocationOn sx={{ color: COLORS.brand.primary }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontWeight: 500, color: COLORS.text.strong, fontSize: '0.9rem' }}>
                      {feature.text}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{ color: COLORS.text.subtle, display: 'block', mt: 0.25 }}
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
            bgcolor: COLORS.bg.white
          }}
        >
          <Typography variant="body2" sx={{ color: COLORS.text.subtle }}>
            No locations found. Try a different search.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
