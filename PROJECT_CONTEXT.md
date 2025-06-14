# Pheras - Indian Wedding Platform Setup

## Project Overview
A dual-experience wedding platform: Admin dashboard for couples to manage their Indian wedding + Mobile-first guest website with Google Forms/Sheets integration, WhatsApp community, and Lapse photo sharing.

## Initial Setup Commands
```bash
# Create Next.js project with TypeScript
npx create-next-app@latest pheras --typescript --tailwind --app
cd pheras

# Core dependencies
npm install @mui/material @mui/material-nextjs @emotion/react @emotion/styled
npm install framer-motion
npm install googleapis @types/googleapis
npm install react-intersection-observer clsx date-fns
npm install @mui/icons-material
npm install react-hook-form zod @hookform/resolvers
```

## Project Structure
```
pheras/
├── app/
│   ├── (admin)/              # Admin dashboard routes
│   │   ├── dashboard/
│   │   ├── events/
│   │   ├── guests/
│   │   └── settings/
│   ├── (guest)/              # Guest-facing routes
│   │   ├── page.tsx          # Home
│   │   ├── rsvp/
│   │   ├── events/
│   │   ├── travel/
│   │   └── memories/
│   ├── api/
│   │   ├── forms/            # Google Forms API
│   │   ├── sheets/           # Google Sheets API
│   │   └── whatsapp/         # WhatsApp integration
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── admin/                # Admin-specific components
│   ├── guest/                # Guest-specific components
│   ├── shared/               # Shared components
│   └── ui/                   # M3 customized components
├── lib/
│   ├── theme/                # M3 theme configuration
│   ├── google/               # Google APIs
│   ├── animations/           # Framer Motion
│   └── constants/
└── public/
    └── cultural-assets/      # Patterns, icons
```

## Material Design 3 Theme Setup

### theme/m3-theme.ts
```typescript
import { createTheme } from '@mui/material/styles';

// Cultural color tokens
const culturalColors = {
  // Traditional
  gold: '#D4AF37',
  maroon: '#800020',
  saffron: '#FF9933',
  
  // Modern accent
  coral: '#FF6B6B',
  teal: '#20C997',
  purple: '#6C5CE7'
};

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-mui-color-scheme'
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: culturalColors.maroon,
        },
        secondary: {
          main: culturalColors.gold,
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: culturalColors.gold,
        },
        secondary: {
          main: culturalColors.coral,
        },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h1: {
      fontFamily: '"Playfair Display", serif',
    },
  },
  shape: {
    borderRadius: 16, // M3 larger radius
  },
  components: {
    // M3 component customizations
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          textTransform: 'none',
        },
      },
    },
  },
});
```

## Core Features Implementation

### 1. Google Forms/Sheets Integration
```typescript
// lib/google/forms-api.ts
export class GoogleFormsService {
  // Embed Google Form
  // Track submissions
  // Sync with Sheets
  // Real-time updates
}

// lib/google/sheets-api.ts
export class GoogleSheetsService {
  // Read RSVP data
  // Guest list management
  // Analytics generation
  // Export capabilities
}
```

### 2. Admin Dashboard Components
```typescript
// components/admin/EventBuilder.tsx
- Drag-and-drop ceremony creation
- M3 cards for events
- Cultural templates
- Guest assignment

// components/admin/GuestHierarchy.tsx
- Tiered guest management
- Bulk import from Sheets
- Event-specific invites
- Family grouping
```

### 3. Guest Experience Components
```typescript
// components/guest/RSVPForm.tsx
- Embedded Google Form
- M3 form styling
- Multi-event selection
- Success animations

// components/guest/CulturalGuide.tsx
- Ceremony explanations
- Interactive timeline
- Dress code visuals
- Participation cues
```

### 4. Integration Features
```typescript
// lib/integrations/whatsapp.ts
- Community link generation
- QR codes for joining
- Update notifications

// lib/integrations/lapse.ts
- Event-specific QR codes
- Camera links
- Photo reveal timers
```

## Development Timeline (56 hours)

### Week 1 (14 hours)
```
Day 1-2: Project setup + M3 theme
Day 3-4: Google APIs authentication
Day 5-7: Basic routing + responsive layout
```

### Week 2 (14 hours)
```
Day 8-10: Google Forms embed + styling
Day 11-12: Guest RSVP flow
Day 13-14: Admin dashboard skeleton
```

### Week 3 (14 hours)
```
Day 15-17: Event management (admin)
Day 18-19: WhatsApp integration
Day 20-21: Lapse integration
```

### Week 4 (14 hours)
```
Day 22-23: Cultural animations
Day 24-25: Mobile optimization
Day 26-27: Testing + deployment
Day 28: Launch preparation
```

## Key Implementation Files

### 1. Layout with M3 Theme
```typescript
// app/layout.tsx
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '@/lib/theme/m3-theme';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

### 2. Environment Variables
```env
# .env.local
GOOGLE_SERVICE_ACCOUNT_KEY=path-to-key.json
GOOGLE_FORMS_ID=your-form-id
GOOGLE_SHEETS_ID=your-sheets-id
NEXT_PUBLIC_WHATSAPP_GROUP_LINK=https://chat.whatsapp.com/...
NEXT_PUBLIC_WEDDING_DATE=2024-MM-DD
NEXT_PUBLIC_LAPSE_EVENT_CODES=mehendi:ABC123,sangeet:DEF456
```

### 3. Mobile-First Breakpoints
```typescript
// lib/constants/breakpoints.ts
export const breakpoints = {
  mobile: 0,     // Mobile-first base
  tablet: 768,   // iPad portrait
  desktop: 1024, // Desktop
};

// Usage with MUI
theme.breakpoints.values = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};
```

## Animation Strategy

### Cultural Magic Moments
```typescript
// lib/animations/cultural.ts
export const animations = {
  // Floating petals
  petalFloat: {
    animate: {
      y: [0, -20, 0],
      x: [0, 10, -10, 0],
      rotate: [0, 180, 360],
    },
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  
  // RSVP success
  celebration: {
    initial: { scale: 0 },
    animate: { 
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
    },
  },
};
```

## Testing Checklist
- [ ] Google Forms embed works on all devices
- [ ] RSVP data flows to Google Sheets
- [ ] WhatsApp links generate correctly
- [ ] Lapse QR codes display properly
- [ ] M3 theme renders correctly
- [ ] Animations perform at 60fps
- [ ] Admin/guest routes separate properly
- [ ] Mobile responsiveness (90%+ traffic)

## Deployment
```bash
# Build and deploy to Vercel
npm run build
vercel --prod

# Domain setup
# pheras.app → production
# admin.pheras.app → admin subdomain (optional)
```

## Development Tips for Cursor
1. Use `@/lib/theme/m3-theme.ts` for all styling decisions
2. Reference Google API docs when implementing forms/sheets
3. Test mobile-first (use device mode constantly)
4. Keep animations light for performance
5. Use M3 components before custom ones

## MVP Success Criteria
- [ ] Couples can create multi-event weddings
- [ ] Guests can RSVP via Google Forms
- [ ] Data syncs to Google Sheets automatically
- [ ] WhatsApp community links work
- [ ] Lapse integration shows QR codes
- [ ] Mobile experience is smooth
- [ ] Cultural elements are prominent
- [ ] Launch ready in 4 weeks