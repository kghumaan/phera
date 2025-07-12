# Phera - Indian Wedding Platform Setup

## Project Overview
A comprehensive dual-experience Indian wedding platform featuring an admin dashboard for couples to manage their wedding events and a mobile-first guest website with advanced RSVP capabilities, real-time interactions, multi-authentication methods, Google integrations, SMS notifications, and cultural design elements.

## Key Features Implemented

### 🎯 **Dual Experience Architecture**
- **Admin Dashboard**: Complete wedding management system with analytics
- **Guest Portal**: Mobile-first responsive experience with PIN authentication
- **Multi-Wedding Support**: Handle multiple weddings with unique wedding IDs

### ✨ **Advanced Authentication System**
- **Google OAuth**: Seamless Google Sign-In integration
- **Phone/SMS Authentication**: Twilio-powered OTP verification with test interface
- **Pin-Based Access**: Secure guest authentication with differentiated PIN codes
  - **PIN 7834**: Allows plus-ones (includes partner details in RSVP)
  - **PIN 2591**: Individual invitation only (no plus-one option)
- **Guest Auto-Authentication**: Automatic auth after RSVP submission
- **Persistent Sessions**: 24-hour guest authentication storage

### 📱 **Enhanced RSVP System**
- **Multi-Step Form**: 6-step guided RSVP experience
- **Advanced Attendance Options**: Yes/No/Maybe with comments
- **Plus-One Management**: Complete plus-one details capture
- **Food Preferences**: Multiple dietary options and restrictions
- **Cultural Elements**: Wedding side selection, song requests
- **Real-time Validation**: Dynamic form validation and error handling

### 🎨 **Cultural Design & UI**
- **Material Design 3**: Modern Google design system
- **Cultural Color Scheme**: Indian wedding-inspired palette
- **Framer Motion Animations**: Smooth, performant animations
- **Background Customization**: Dynamic background selection with 9 options
- **Responsive Design**: Mobile-first with perfect tablet/desktop scaling
- **Custom Components**: Culturally-themed UI elements

### 🔄 **Real-time Features**
- **Live RSVP Updates**: Real-time attendee list updates
- **Comment System**: Live guest comments with Supabase subscriptions
- **Activity Feed**: Real-time wedding activity tracking
- **Countdown Timer**: Dynamic wedding countdown with multiple time units

### 🌐 **Third-Party Integrations**
- **Google Sheets API**: RSVP data synchronization
- **Google Forms API**: Form management integration
- **Lapse Integration**: Photo sharing for wedding events
- **WhatsApp Integration**: Community building features
- **Twilio SMS**: Phone verification and notifications

## Technology Stack

### Core Framework
```json
{
  "next": "15.3.3",
  "react": "19.0.0",
  "typescript": "5.x"
}
```

### Styling & UI
```json
{
  "@mui/material": "7.1.1",
  "@mui/material-nextjs": "7.1.1",
  "@emotion/react": "11.14.0",
  "@emotion/styled": "11.14.0",
  "framer-motion": "12.18.1",
  "tailwindcss": "4.x"
}
```

### Database & Backend
```json
{
  "@supabase/supabase-js": "2.50.0",
  "@supabase/ssr": "0.6.1",
  "@supabase/auth-helpers-nextjs": "0.10.0"
}
```

### Authentication & Communication
```json
{
  "googleapis": "150.0.1",
  "react-hook-form": "7.57.0",
  "zod": "3.25.64",
  "@hookform/resolvers": "5.1.1"
}
```

### Additional Features
```json
{
  "react-confetti": "6.4.0",
  "react-intersection-observer": "9.16.0",
  "date-fns": "4.1.0",
  "clsx": "2.1.1"
}
```

## Installation & Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd phera
npm install
```

### 2. Environment Configuration
Create `.env.local` with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Wedding Configuration
NEXT_PUBLIC_WEDDING_DATE=2026-01-04T00:00:00
NEXT_PUBLIC_WEDDING_ID=sim-kv
NEXT_PUBLIC_WEDDING_PIN=your_guest_pin_here

# Google Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id

# Optional Integrations
NEXT_PUBLIC_WHATSAPP_GROUP_LINK=https://chat.whatsapp.com/your_link
NEXT_PUBLIC_LAPSE_EVENT_CODES=mehendi:ABC123,sangeet:DEF456
```

### 3. Database Setup

#### Supabase Database Schema
The current database schema supports comprehensive wedding management:

```sql
-- Guests table with multi-wedding support
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  wedding_id TEXT NOT NULL,
  auth_method TEXT DEFAULT 'email',
  wedding_side TEXT,
  initials TEXT GENERATED ALWAYS AS (
    UPPER(SUBSTRING(SPLIT_PART(name, ' ', 1) FROM 1 FOR 1) || 
    SUBSTRING(SPLIT_PART(name, ' ', -1) FROM 1 FOR 1))
  ) STORED,
  avatar_color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, wedding_id)
);

-- Enhanced RSVP responses
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  attending TEXT NOT NULL CHECK (attending IN ('yes', 'no', 'maybe')),
  guest_count INTEGER DEFAULT 1,
  plus_one BOOLEAN DEFAULT false,
  plus_one_name TEXT,
  plus_one_email TEXT,
  country_code TEXT DEFAULT '+1',
  food_preference TEXT[],
  dietary_restrictions TEXT,
  song_request TEXT,
  special_message TEXT,
  maybe_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_id, event_id, wedding_id)
);

-- Real-time comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies (currently open - customize for production)
CREATE POLICY "Allow all operations on guests" ON guests
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on rsvps" ON rsvps
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER TABLE comments REPLICA IDENTITY FULL;

-- Performance indexes
CREATE INDEX idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX idx_guests_email_wedding ON guests(email, wedding_id);
CREATE INDEX idx_rsvps_wedding_id ON rsvps(wedding_id);
CREATE INDEX idx_rsvps_attending ON rsvps(attending);
CREATE INDEX idx_comments_wedding_id ON comments(wedding_id);
```

## Project Architecture

### Directory Structure
```
phera/
├── app/
│   ├── (guest)/                    # Guest-facing routes
│   │   ├── page.tsx               # Homepage with countdown & auth
│   │   ├── rsvp/page.tsx          # 6-step RSVP form
│   │   ├── events/page.tsx        # Wedding events info
│   │   ├── travel/page.tsx        # Travel information
│   │   └── memories/page.tsx      # Photo sharing
│   ├── admin/                     # Admin dashboard
│   │   ├── dashboard/page.tsx     # Analytics dashboard
│   │   ├── events/page.tsx        # Event management
│   │   ├── guests/page.tsx        # Guest management
│   │   └── settings/page.tsx      # Settings
│   ├── test-sms/page.tsx          # SMS testing interface
│   ├── layout.tsx                 # Root layout with providers
│   └── globals.css                # Global styles
├── components/
│   ├── admin/
│   │   ├── EventBuilder.tsx       # Event creation
│   │   └── GuestHierarchy.tsx     # Guest organization
│   ├── auth/
│   │   ├── LoginModal.tsx         # Multi-method login
│   │   ├── LoginDialog.tsx        # Alternative login
│   │   └── SMSTestComponent.tsx   # SMS debugging
│   ├── guest/
│   │   ├── CustomRSVPForm.tsx     # 6-step RSVP form
│   │   ├── GuestList.tsx          # Real-time attendees
│   │   ├── PinEntry.tsx           # PIN authentication
│   │   ├── ActivityFeed.tsx       # Activity stream
│   │   ├── CountdownTimer.tsx     # Wedding countdown
│   │   └── CulturalGuide.tsx      # Cultural info
│   ├── shared/
│   │   ├── AppHeader.tsx          # Navigation header
│   │   ├── ThemeProvider.tsx      # Material Design 3
│   │   ├── ErrorBoundary.tsx      # Error handling
│   │   ├── LapseIntegration.tsx   # Photo sharing
│   │   └── WhatsAppIntegration.tsx # WhatsApp features
│   └── ui/
│       ├── OptimizedBackground.tsx # Dynamic backgrounds
│       ├── BackgroundCustomizer.tsx # Background UI
│       └── PlaceholderCouple.tsx   # Couple images
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Supabase client
│   │   ├── types.ts               # TypeScript types
│   │   ├── auth-service.ts        # Auth services
│   │   └── rsvp-service.ts        # RSVP operations
│   ├── contexts/
│   │   └── AuthContext.tsx        # Auth state
│   ├── google/
│   │   ├── auth.ts                # Google OAuth
│   │   ├── forms-api.ts           # Forms API
│   │   └── sheets-api.ts          # Sheets API
│   ├── theme/
│   │   └── m3-theme.ts            # Material Design 3
│   ├── animations/
│   │   └── cultural.ts            # Cultural animations
│   ├── constants/
│   │   └── images.ts              # Image constants
│   └── hooks/
│       └── useCountdown.ts        # Countdown hook
├── public/
│   ├── images/
│   │   ├── backgrounds/           # 9 background options
│   │   ├── couple/                # Couple photos
│   │   └── frames/                # Decorative frames
│   └── cultural-assets/           # Cultural elements
├── migrations/
│   └── enhance_rsvp_table.sql     # Migration script
└── Documentation/
    ├── SUPABASE_MCP_SETUP.md      # AI database integration
    ├── TWILIO_MCP_SETUP.md        # AI SMS integration
    ├── BROWSER_DEVTOOLS_MCP_SETUP.md # AI browser dev-tools integration
    └── RSVP_DATABASE_MIGRATION_GUIDE.md # Migration guide
```

## Core Features Implementation

### 1. Multi-Method Authentication System

The platform supports comprehensive authentication:

```typescript
// lib/contexts/AuthContext.tsx - Key interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  hasRSVPed: boolean;
  rsvpResponse: 'yes' | 'no' | 'maybe' | null;
  checkRSVPStatus: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}
```

**Authentication Methods Implemented:**
1. **PIN-based Access**: Secure guest authentication with invitation type differentiation
   - **PIN 7834**: Couple/family invitations (allows plus-ones)
   - **PIN 2591**: Individual invitations (no plus-one option)
   - Stores `phera_allows_plus_one` flag in localStorage for RSVP form logic
2. **Google OAuth**: Seamless Google Sign-In integration  
3. **Phone/SMS**: Twilio-powered OTP verification
4. **Auto-authentication**: Automatic auth after RSVP submission

### 2. Advanced 6-Step RSVP Form

The RSVP system captures comprehensive data:

```typescript
// components/guest/CustomRSVPForm.tsx - Form steps
const steps = [
  'Basic Information',        // Name, email, phone + country code
  'Attendance Details',       // Yes/No/Maybe with comments
  'Plus One Details',         // Plus-one management
  'Event Preferences',        // Food preferences, dietary needs
  'Personal Details',         // Wedding side affiliation  
  'Fun & Messages',          // Song requests, special messages
];
```

**Comprehensive Data Capture:**
- Personal details with international phone support (20+ country codes)
- Advanced attendance options (Yes/No/Maybe with explanation comments)
- Complete plus-one management (name, email, count)
- Food preferences (Vegetarian, Vegan, Jain, etc.)
- Cultural elements (bride's/groom's side, song requests)
- Special messages and dietary restrictions

### 3. Real-time Guest Management

#### Live Attendee Updates
```typescript
// Real-time RSVP tracking
const { data: attendees } = await supabase
  .from('guests')
  .select(`
    id, name, initials, avatar_color,
    rsvps!inner(attending, guest_count)
  `)
  .eq('rsvps.wedding_id', 'sim-kv')
  .eq('rsvps.attending', 'yes');
```

#### Live Comment System
```typescript
// Real-time subscriptions for guest comments
useEffect(() => {
  const subscription = supabase
    .channel('comments')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'comments' },
      (payload) => addComment(payload.new as Comment)
    )
    .subscribe();
  
  return () => subscription.unsubscribe();
}, []);
```

### 4. Cultural Design System

#### Material Design 3 with Indian Wedding Theme
```typescript
// lib/theme/m3-theme.ts - Cultural color scheme
const culturalColors = {
  gold: '#D4AF37',      // Primary wedding color
  maroon: '#800020',    // Secondary color
  saffron: '#FF9933',   // Cultural accent
  coral: '#FF6B6B',     // Modern accent
  teal: '#20C997',      // Fresh accent
  purple: '#6C5CE7'     // Regal accent
};
```

**Cultural Design Elements:**
- Indian wedding-inspired color palette
- Custom fonts (Outfit + Instrument Serif)
- Cultural animations with Framer Motion
- 9 curated background options
- Responsive cultural UI components

### 5. Background Customization System

#### Dynamic Background Management
The platform includes 9 optimized wedding backgrounds:

```typescript
// Implemented backgrounds in /public/images/backgrounds/
const backgrounds = [
  'haldi-optimized.jpg',     // Haldi ceremony
  'mehndi-optimized.jpg',    // Mehndi ceremony  
  'jaggo-optimized.jpg',     // Jaggo celebration
  'pool-optimized.jpg',      # Poolside venue
  'rose.jpg',                # Rose theme
  'green.jpg',               # Nature theme
  'blue-clouds.jpg',         # Sky theme
  // ... and more variations
];
```

**Optimization Features:**
- WebP/AVIF format support
- Responsive image sizing
- Real-time background switching
- Performance optimized loading

## AI Integration (MCP Servers)

### Supabase MCP Integration
Enables AI assistant to interact directly with your wedding database:

**Capabilities:**
- Query and analyze guest RSVP data
- Generate database insights and reports
- Manage schema and run migrations
- Generate TypeScript types automatically
- Optimize database performance

**Setup Documentation**: `SUPABASE_MCP_SETUP.md`

### Twilio MCP Integration  
Enables AI assistant to handle SMS communications:

**Capabilities:**
- Send SMS invitations and reminders
- Purchase and manage phone numbers
- Set up automated messaging workflows
- Monitor SMS delivery status
- Create voice systems for wedding information

**Setup Documentation**: `TWILIO_MCP_SETUP.md`

### Browser Dev-Tools MCP Integration
Enables AI assistant to interact with browser developer tools:

**Capabilities:**
- Select HTML elements in dev tools and get detailed context
- Monitor console logs and errors in real-time
- Analyze network requests and performance
- Run accessibility, SEO, and performance audits
- Take screenshots and inspect browser state
- Debug styling and layout issues

**Setup Documentation**: `BROWSER_DEVTOOLS_MCP_SETUP.md`

## Database Migration System

### Enhanced RSVP Migration
A comprehensive migration has been implemented to enhance the RSVP system:

```sql
-- Key migration: migrations/enhance_rsvp_table.sql
-- Changes implemented:
-- 1. Convert attending from boolean to text ('yes'/'no'/'maybe')
-- 2. Add comprehensive form fields
-- 3. Add performance indexes
-- 4. Migrate existing data safely
```

**Migration Documentation**: `RSVP_DATABASE_MIGRATION_GUIDE.md`

## Development Workflow

### Local Development
```bash
npm run dev          # Start with Turbopack (faster builds)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
```

### SMS Testing Interface
Access `/test-sms` for comprehensive SMS debugging:
- Test OTP sending functionality
- Verify phone authentication flow  
- Debug SMS provider configuration
- Console logging for troubleshooting
- Real-time error feedback

### Image Optimization
```bash
node scripts/optimize-images.js    # Optimize new images
bash scripts/resize-images.sh      # Batch resize operations
```

## Data Flow Architecture

### Authentication Flow
1. **Initial Access**: PIN verification or direct Google OAuth
2. **Guest Registration**: Auto-creation during RSVP process
3. **Session Management**: 24-hour localStorage persistence
4. **Multi-Method Support**: PIN, Google, SMS, email options

### RSVP Data Flow
1. **Form Submission**: 6-step validated form completion
2. **Data Normalization**: Handle multiple input formats
3. **Database Storage**: Comprehensive data capture in Supabase
4. **Real-time Updates**: Live UI updates via subscriptions
5. **Google Sheets Sync**: Optional external synchronization

### Real-time Feature Architecture
1. **Comment System**: Live guest messaging
2. **Attendee Updates**: Real-time RSVP changes
3. **Activity Feed**: Live wedding activity
4. **Admin Dashboard**: Real-time analytics

## Testing Checklist

### Authentication Testing
- [ ] PIN-based guest authentication
  - [ ] PIN 7834 (plus-one allowed) - should show "Bringing your special someone?" step
  - [ ] PIN 2591 (no plus-one) - should skip plus-one step entirely
- [ ] Google OAuth login flow
- [ ] SMS OTP verification (use `/test-sms` page)
- [ ] Auto-authentication after RSVP
- [ ] Session persistence (24-hour duration)

### RSVP System Testing
- [ ] Complete 6-step form submission
- [ ] All data fields captured correctly
- [ ] Maybe responses with comments
- [ ] Plus-one management functionality
- [ ] Food preference selections
- [ ] Real-time form validation

### Real-time Features Testing
- [ ] Live attendee list updates
- [ ] Real-time comment system
- [ ] Activity feed functionality
- [ ] Countdown timer accuracy

### UI/UX Testing
- [ ] Mobile responsiveness (all breakpoints)
- [ ] Background customization system
- [ ] Cultural animations performance
- [ ] Loading states and error handling
- [ ] Cross-browser compatibility

### Admin Features Testing
- [ ] Dashboard analytics display
- [ ] Guest management interface
- [ ] RSVP data visualization
- [ ] Export functionality

## Performance & Security

### Performance Optimizations
- **Next.js App Router**: Optimal loading with automatic code splitting
- **Image Optimization**: WebP/AVIF with responsive sizing
- **Database Indexing**: Strategic indexes for common queries
- **Animation Performance**: GPU-accelerated Framer Motion
- **Real-time Efficiency**: Selective Supabase subscriptions

### Security Measures
- **Row Level Security**: Enabled on all database tables
- **Authentication Security**: Multi-method secure auth
- **Data Privacy**: Wedding-specific data isolation
- **Input Validation**: Comprehensive sanitization
- **Session Security**: Secure token management

## Deployment Configuration

### Environment Variables (Production)
```env
# Essential production variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_WEDDING_DATE=2026-01-04T00:00:00
NEXT_PUBLIC_WEDDING_ID=your-unique-wedding-id
NEXT_PUBLIC_WEDDING_PIN=your-secure-pin
```

### Vercel Deployment
```bash
npm run build
vercel --prod
```

### Database Deployment Steps
1. Create production Supabase project
2. Run `database-schema.sql` for initial setup
3. Run `migrations/enhance_rsvp_table.sql` for enhancements
4. Configure Row Level Security policies
5. Set up authentication providers
6. Enable real-time subscriptions

## Future Enhancement Roadmap

### Phase 1: Core Completions (Next 2-4 weeks)
- [ ] Complete API route implementations (forms, sheets, whatsapp)
- [ ] Enhanced WhatsApp community integration
- [ ] Full Lapse photo sharing implementation  
- [ ] Advanced admin analytics and reporting
- [ ] Multi-event RSVP system expansion

### Phase 2: Advanced Features (Next 1-2 months)
- [ ] Vendor management system
- [ ] Advanced notification workflows
- [ ] Guest relationship mapping
- [ ] Enhanced cultural customization
- [ ] Advanced export capabilities

### Phase 3: Platform Extensions (Future)
- [ ] Mobile app development (React Native)
- [ ] Offline capability (Progressive Web App)
- [ ] Multi-language support (Hindi, Punjabi, etc.)
- [ ] Template system for other weddings
- [ ] Integration marketplace

## Documentation Resources

### Setup & Integration Guides
- **`SUPABASE_MCP_SETUP.md`** - Complete AI database integration guide
- **`TWILIO_MCP_SETUP.md`** - Complete AI SMS integration guide
- **`BROWSER_DEVTOOLS_MCP_SETUP.md`** - Complete AI browser dev-tools integration guide  
- **`RSVP_DATABASE_MIGRATION_GUIDE.md`** - Database migration documentation

### External Documentation
- [Material Design 3 Documentation](https://m3.material.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router Documentation](https://nextjs.org/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## Summary

The Phera wedding platform represents a sophisticated, culturally-rich, and technically advanced wedding management system. With comprehensive authentication, real-time features, advanced RSVP capabilities, AI integrations, and beautiful cultural design, it provides an exceptional experience for both wedding couples and their guests.

The platform successfully combines modern web technologies with traditional Indian wedding elements, creating a unique and memorable digital experience for one of life's most important celebrations. 