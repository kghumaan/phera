import {
  Landscape,
  Flight,
  StickyNote2,
  Home,
  Luggage,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

export const TRAVEL_ICON_MAP: Record<string, SvgIconComponent> = {
  travel: Landscape,
  flight: Flight,
  travel_note: StickyNote2,
  accommodation: Home,
  hotel: Luggage,
};

export const TRAVEL_TYPE_LABELS: Record<string, string> = {
  travel: 'Travel',
  flight: 'Flight',
  travel_note: 'Travel Note',
  accommodation: 'Accommodation',
  hotel: 'Hotel',
};

export const DEFAULT_SECTIONS = [
  {
    type: 'travel' as const,
    title: 'Travel',
    subtitle: null,
    icon: 'Landscape',
    order_index: 0,
  },
  {
    type: 'flight' as const,
    title: 'Flight',
    subtitle: null,
    icon: 'Flight',
    order_index: 1,
  },
  {
    type: 'travel_note' as const,
    title: 'Travel Note',
    subtitle: null,
    icon: 'StickyNote2',
    order_index: 2,
  },
  {
    type: 'accommodation' as const,
    title: 'Accommodation',
    subtitle: null,
    icon: 'Home',
    order_index: 3,
  },
  {
    type: 'hotel' as const,
    title: 'Hotel',
    subtitle: null,
    icon: 'Luggage',
    order_index: 4,
  },
];
