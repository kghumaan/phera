# Phera - Indian Wedding Platform - Comprehensive Context

> **Last Updated**: December 2025
> **Version**: 2.0
> **Purpose**: Complete technical reference for AI assistants and developers

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Authentication System](#authentication-system)
5. [Core Features](#core-features)
6. [Project Structure](#project-structure)
7. [API Routes](#api-routes)
8. [Key Services](#key-services)
9. [Pain Points Solved](#pain-points-solved)
10. [Environment Configuration](#environment-configuration)
11. [Development Workflow](#development-workflow)
12. [Deployment](#deployment)

---

## Project Overview

**Phera** is a sophisticated, multi-wedding platform designed specifically for modern Indian weddings. It combines traditional cultural elements with cutting-edge web technologies to solve the complex challenges of wedding planning and guest management.

### Platform Philosophy
- **Dual Experience**: Separate admin dashboard for couples and mobile-first guest portal
- **Cultural First**: Designed specifically for Indian wedding customs and multi-day events
- **Multi-Wedding**: Platform hosts multiple weddings simultaneously with complete data isolation
- **Mobile-First**: Progressive enhancement approach (mobile perfect, desktop enhanced)

### What Makes Phera Unique
1. **Flexible Authentication**: 6 different auth methods (PIN, Email OTP, Phone OTP, Google OAuth, Plus-One, Auto-auth)
2. **Comprehensive RSVP**: 6-step form capturing detailed guest information
3. **Travel Coordination**: Flight tracking, shuttle coordination, checklists for destination weddings
4. **Real-Time Features**: Live comments, attendee updates, activity feeds
5. **Cultural Context**: Ritual explanations, dress codes, outfit ideas for non-Indian guests
6. **Team Collaboration**: Multi-admin support with role-based access
7. **Design Customization**: Extensive theming with cultural color palettes
8. **Gift Registry**: Modern Stripe-integrated honeymoon funds

---

## Technology Stack

### Core Framework
```json
{
  "next": "15.3.6",
  "react": "19.2.1",
  "typescript": "5.x",
  "node": "Turbopack (dev builds)"
}
```

### Frontend UI/UX
```json
{
  "@mui/material": "7.1.1",
  "@mui/material-nextjs": "7.1.1",
  "@mui/icons-material": "latest",
  "@mui/x-date-pickers": "8.21.0",
  "@emotion/react": "11.14.0",
  "@emotion/styled": "11.14.0",
  "framer-motion": "12.18.1",
  "tailwindcss": "4.x"
}
```

### Backend & Database
```json
{
  "@supabase/supabase-js": "2.50.0",
  "@supabase/ssr": "0.6.1",
  "@supabase/auth-helpers-nextjs": "0.10.0"
}
```

### Authentication & Payments
```json
{
  "googleapis": "150.0.1",
  "stripe": "18.3.0",
  "@stripe/stripe-js": "7.5.0",
  "resend": "6.5.2"
}
```

### Forms & Validation
```json
{
  "react-hook-form": "7.57.0",
  "zod": "3.25.67",
  "@hookform/resolvers": "5.1.1"
}
```

### Additional Libraries
```json
{
  "react-confetti": "6.4.0",
  "canvas-confetti": "1.9.3",
  "@giphy/react-components": "10.0.1",
  "@dicebear/core": "9.2.3",
  "qrcode.react": "4.2.0",
  "xlsx": "0.18.5",
  "date-fns": "4.1.0",
  "react-intersection-observer": "9.16.0",
  "clsx": "2.1.1"
}
```

---

## Database Schema

### Overview
Supabase PostgreSQL with 15+ tables, Row Level Security (RLS), real-time subscriptions, and strategic indexing.

### Core Tables

#### 1. **weddings** (Wedding Configuration)
Primary table for wedding instances.

```sql
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                    -- URL identifier (e.g., 'sim-kv')
  couple_name TEXT NOT NULL,
  bride_name TEXT,
  groom_name TEXT,
  wedding_date TIMESTAMPTZ NOT NULL,
  wedding_date_end TIMESTAMPTZ,                 -- For multi-day events
  wedding_date_display TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_location TEXT NOT NULL,
  venue_flag TEXT,
  rsvp_deadline TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'preview', 'live')) DEFAULT 'draft',

  -- Visual customization
  couple_image_url TEXT,
  couple_images JSONB,                          -- Array of up to 6 photos
  frame_image_url TEXT,
  background_image TEXT DEFAULT '/images/backgrounds/pearl.png',
  primary_color TEXT DEFAULT '#DE3F5E',
  font_color TEXT,
  button_font_color TEXT,

  -- PIN entry customization
  pin_entry_text TEXT,
  pin_entry_background TEXT,
  pin_entry_primary_color TEXT,
  pin_entry_font_color TEXT,
  pin_entry_button_font_color TEXT,
  pin_entry_subtitle_text TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weddings_slug ON weddings(slug);
CREATE INDEX idx_weddings_created_by ON weddings(created_by);
```

#### 2. **wedding_admins** (Multi-Admin Support)
Enables team collaboration on wedding management.

```sql
CREATE TABLE wedding_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'viewer')) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(wedding_id, user_id)
);

CREATE INDEX idx_wedding_admins_wedding ON wedding_admins(wedding_id);
CREATE INDEX idx_wedding_admins_user ON wedding_admins(user_id);
```

#### 3. **wedding_invites** (Pending Team Invitations)
Tracks sent but not yet accepted team invitations.

```sql
CREATE TABLE wedding_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'viewer')) NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(wedding_id, email)
);
```

#### 4. **guests** (Guest Information)
Stores all guest data with auto-generated avatars.

```sql
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  wedding_id TEXT NOT NULL,
  auth_method TEXT DEFAULT 'email',
  wedding_side TEXT CHECK (wedding_side IN ('bride', 'groom', 'both')),

  -- Auto-generated avatar
  initials TEXT GENERATED ALWAYS AS (
    UPPER(SUBSTRING(SPLIT_PART(name, ' ', 1) FROM 1 FOR 1) ||
    SUBSTRING(SPLIT_PART(name, ' ', -1) FROM 1 FOR 1))
  ) STORED,
  avatar_color TEXT NOT NULL,
  avatar_style TEXT,                           -- DiceBear style
  avatar_seed TEXT,                            -- DiceBear seed
  avatar_svg TEXT,                             -- Cached SVG

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email, wedding_id)
);

CREATE INDEX idx_guests_wedding_id ON guests(wedding_id);
CREATE INDEX idx_guests_email_wedding ON guests(email, wedding_id);
```

#### 5. **rsvps** (RSVP Responses)
Comprehensive RSVP data with plus-one support.

```sql
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  event_id TEXT NOT NULL,

  -- Attendance
  attending TEXT CHECK (attending IN ('yes', 'no', 'maybe')) NOT NULL,
  guest_count INTEGER DEFAULT 1,
  maybe_comment TEXT,

  -- Plus-one details
  plus_one BOOLEAN DEFAULT FALSE,
  plus_one_name TEXT,
  plus_one_email TEXT,
  plus_one_country_code TEXT,
  plus_one_phone TEXT,

  -- Contact info
  country_code TEXT DEFAULT '+1',

  -- Food preferences
  food_preference TEXT[],                      -- Array: ['Vegetarian', 'Vegan', etc.]
  dietary_restrictions TEXT,

  -- Personal touches
  song_request TEXT,
  special_message TEXT,

  -- Travel
  arrival_option TEXT,
  arrival_date TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(guest_id, event_id, wedding_id)
);

CREATE INDEX idx_rsvps_wedding_id ON rsvps(wedding_id);
CREATE INDEX idx_rsvps_attending ON rsvps(attending);
CREATE INDEX idx_rsvps_guest_id ON rsvps(guest_id);
```

#### 6. **comments** (Guest Comments)
Real-time guest wall with GIF support.

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  message TEXT NOT NULL,

  -- GIF support (Giphy integration)
  gif_id TEXT,
  gif_url TEXT,
  gif_title TEXT,
  gif_preview_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable real-time
ALTER TABLE comments REPLICA IDENTITY FULL;

CREATE INDEX idx_comments_wedding_id ON comments(wedding_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
```

#### 7. **guest_flights** (Flight Information)
Track guest travel for shuttle coordination.

```sql
CREATE TABLE guest_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,

  airline TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  departure_airport TEXT NOT NULL,
  arrival_airport TEXT NOT NULL,
  departure_datetime TIMESTAMPTZ NOT NULL,
  arrival_datetime TIMESTAMPTZ NOT NULL,

  -- Shuttle coordination
  shuttle_preference_time TEXT,
  shuttle_preference_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guest_flights_wedding ON guest_flights(wedding_id);
CREATE INDEX idx_guest_flights_arrival ON guest_flights(arrival_datetime);
```

#### 8. **guest_checklist_items** (Travel Checklist)
Track guest progress on travel preparation.

```sql
CREATE TABLE guest_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  wedding_id TEXT NOT NULL,
  item_key TEXT NOT NULL,                      -- e.g., 'evisa', 'book_flights'
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(guest_id, wedding_id, item_key)
);
```

#### 9. **wedding_events** (Event Details)
Individual events within a wedding.

```sql
CREATE TABLE wedding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,

  -- Dress code
  dress_code TEXT,
  dress_code_emoji TEXT,
  dress_code_description TEXT,
  outfit_ideas_women JSONB,                    -- Array of outfit suggestions
  outfit_ideas_men JSONB,

  -- Cultural context
  ritual_name TEXT,
  ritual_description TEXT,

  -- Visual
  carousel_images JSONB,                       -- Array of image URLs
  gradient_background TEXT,

  -- Organization
  order_index INTEGER NOT NULL,
  is_template BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(wedding_id, slug)
);

CREATE INDEX idx_wedding_events_wedding ON wedding_events(wedding_id);
CREATE INDEX idx_wedding_events_order ON wedding_events(order_index);
```

#### 10. **wedding_schedule** (Schedule Days)
Day-by-day wedding schedule.

```sql
CREATE TABLE wedding_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL,
  date TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 11. **schedule_items** (Schedule Events)
Individual events within a schedule day.

```sql
CREATE TABLE schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES wedding_schedule(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 12. **wedding_travel_cards** (Travel Information)
Customizable travel information cards.

```sql
CREATE TABLE wedding_travel_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB NOT NULL,                      -- Array of content strings
  image_url TEXT,
  button_text TEXT,
  button_action TEXT,
  is_whatsapp_button BOOLEAN DEFAULT FALSE,
  is_disabled BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 13. **wedding_faqs**
Frequently asked questions.

```sql
CREATE TABLE wedding_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  button_text TEXT,
  button_link TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 14. **wedding_registry** (Gift Registry)
Honeymoon fund and gift registry items.

```sql
CREATE TABLE wedding_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  fund_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT,
  stripe_product_id TEXT,                      -- Stripe integration
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 15. **wedding_shops** (Shopping Recommendations)
Vendor and shopping links.

```sql
CREATE TABLE wedding_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  details TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 16. **wedding_settings** (Wedding Settings)
Advanced wedding configuration.

```sql
CREATE TABLE wedding_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE UNIQUE,

  -- PIN codes configuration
  pin_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [{"pin": "7834", "type": "family", "allows_plus_one": true, "skip_rsvp": false}]

  -- Integrations
  whatsapp_group_link TEXT,
  lapse_event_codes JSONB,                     -- {"mehendi": "ABC123", "sangeet": "DEF456"}
  google_sheets_id TEXT,
  custom_domain TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Database Features
- **Row Level Security (RLS)**: Enabled on all tables with wedding-specific policies
- **Real-time**: Enabled on `comments` table for live updates
- **Indexes**: Strategic indexing on `wedding_id`, `email`, `attending`, etc.
- **Triggers**: Auto-update `updated_at` timestamps
- **Constraints**: Unique constraints, check constraints for enums
- **Generated Columns**: `guests.initials` auto-generated from name

---

## Authentication System

### Overview
Phera implements 6 different authentication methods to support various guest scenarios and admin access needs.

### Authentication Methods

#### 1. **PIN-Based Authentication** (Primary for Guests)
Secure, simple guest access without account creation.

**How it Works**:
1. Guest enters 4-digit PIN on wedding site
2. System validates against `wedding_settings.pin_codes`
3. PIN type determines permissions (plus-one, RSVP bypass)
4. Stores verification in localStorage for 24 hours

**PIN Types**:
```typescript
{
  pin: "7834",
  type: "family",                              // Allows plus-ones
  allows_plus_one: true,
  skip_rsvp: false
}

{
  pin: "2591",
  type: "individual",                          // No plus-one
  allows_plus_one: false,
  skip_rsvp: false
}

{
  pin: "9876",
  type: "bypass",                              // Skip RSVP entirely
  allows_plus_one: false,
  skip_rsvp: true                              // Goes directly to home page
}
```

**Storage**:
- `localStorage.phera_pin_verified`: PIN validation state
- `localStorage.phera_allows_plus_one`: Plus-one permission flag
- `localStorage.phera_bypass_rsvp`: RSVP bypass flag

**Key Files**:
- `components/guest/PinEntry.tsx`
- `lib/contexts/AuthContext.tsx` (lines 92-101)

#### 2. **Email OTP Authentication**
Email-based one-time password for verified access.

**Flow**:
1. Guest enters email
2. System validates email exists in `guests` table
3. 6-digit OTP sent to email
4. Guest enters OTP to verify
5. Creates/links Supabase auth account

**Supports Plus-One**:
- Checks `rsvps.plus_one_email` for plus-one guests
- Creates virtual guest ID: `plus-one-{mainGuestId}`

**Key Files**:
- `lib/supabase/auth-service.ts` (lines 144-231)
- `components/auth/LoginModal.tsx`

#### 3. **Phone/SMS OTP Authentication**
Twilio-powered SMS verification.

**Flow**:
1. Guest selects country code (20+ supported)
2. Enters phone number
3. Receives SMS with OTP code
4. Verifies code to authenticate

**Features**:
- International phone support
- Country code selector
- Test interface at `/test-sms`

**Key Files**:
- `lib/supabase/auth-service.ts` (lines 98-143)
- `app/test-sms/page.tsx`
- `components/auth/SMSTestComponent.tsx`

#### 4. **Google OAuth**
One-click sign-in for admin and guest use.

**Flow**:
1. Click "Continue with Google"
2. OAuth redirect to Google
3. Callback to `/auth/callback`
4. Auto-links to guest record by email
5. Processes pending wedding invites

**Used For**:
- Admin sign-in
- Guest convenience
- Team member access

**Key Files**:
- `app/auth/callback/route.ts`
- `lib/google/auth.ts`

#### 5. **Plus-One Authentication**
Special authentication for plus-one guests.

**How It Works**:
1. Main guest RSVPs with plus-one email
2. Plus-one logs in with their email
3. System checks `rsvps.plus_one_email`
4. Creates virtual guest: `{id: "plus-one-{guestId}", email, name}`
5. Plus-one authenticated without `guests` table entry

**Key Files**:
- `lib/contexts/AuthContext.tsx` (lines 244-304, 359-362)
- `lib/supabase/auth-service.ts`

#### 6. **Auto-Authentication**
Automatic login after RSVP submission.

**Flow**:
1. Guest completes RSVP form
2. System creates/updates guest record
3. Auto-stores auth in localStorage
4. Guest authenticated without additional login

**Storage**:
```typescript
localStorage.phera_guest_auth = {
  id: "guest-uuid",
  email: "guest@email.com",
  name: "Guest Name",
  phone: "+1234567890",
  weddingId: "sim-kv",
  avatar_style: "avataaars",
  avatar_seed: "guest-uuid",
  avatar_svg: "<svg>...</svg>",
  timestamp: Date.now()
}
```

**Expiration**: 24 hours

**Key Files**:
- `components/guest/CustomRSVPForm.tsx`
- `lib/contexts/AuthContext.tsx` (lines 349-425)

### Session Management

#### Supabase Session
Standard OAuth/OTP sessions managed by Supabase Auth.

#### Guest Session
- Stored in `localStorage.phera_guest_auth`
- 24-hour expiration
- Cross-tab synchronization
- Includes cached avatar data

#### PIN Verification
- Stored in `localStorage.phera_pin_verified`
- Persists across page reloads
- Includes permission flags

### AuthContext

Central authentication state management via React Context.

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  hasRSVPed: boolean;
  rsvpResponse: 'yes' | 'no' | 'maybe' | null;
  isCheckingRSVP: boolean;
  checkRSVPStatus: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  handlePlusOneAuth: (email: string) => Promise<boolean>;
}
```

**Features**:
- Multi-method auth detection
- RSVP status tracking
- Loading states
- Session synchronization
- 5-second safety timeout
- Retry logic for auth checks
- Cross-tab storage events

**Key File**: `lib/contexts/AuthContext.tsx` (675 lines)

---

## Core Features

### 1. Multi-Wedding Platform
**Problem Solved**: Host multiple weddings on one platform with complete data isolation.

**Features**:
- Unique slug per wedding (e.g., `/sim-kv`, `/john-jane`)
- Complete data isolation using `wedding_id`
- Multi-admin support with roles (owner, admin, viewer)
- Team collaboration with email invitations
- Independent theming per wedding

**Key Files**:
- `lib/supabase/wedding-service.ts`
- `middleware.ts` (wedding access control)

### 2. Comprehensive 6-Step RSVP Form
**Problem Solved**: Capture detailed guest information beyond simple yes/no.

**Form Steps**:
1. **Basic Information**
   - Name, email, phone
   - International phone support (20+ country codes)

2. **Attendance Details**
   - Yes/No/Maybe selection
   - Maybe comment field for explanation

3. **Plus-One Details** (conditional on PIN type)
   - Plus-one name
   - Plus-one email
   - Plus-one phone with country code

4. **Event Preferences**
   - Food preferences (multi-select)
     - Vegetarian
     - Vegan
     - Jain
     - Gluten-free
     - Halal
     - Kosher
     - No restrictions
   - Dietary restrictions/allergies (free text)

5. **Personal Details**
   - Wedding side (Bride/Groom/Both)

6. **Fun & Messages**
   - Song request for DJ/playlist
   - Special message for couple
   - GIF selection (Giphy integration)

**Features**:
- Form validation with Zod schemas
- Multi-step progress indicator
- Auto-save to prevent data loss
- Edit existing RSVPs
- Confetti celebration on submission
- Auto-authentication after RSVP

**Key Files**:
- `components/guest/CustomRSVPForm.tsx` (600+ lines)
- `lib/supabase/rsvp-service.ts`

### 3. Travel Coordination System
**Problem Solved**: Coordinate guest travel for destination weddings.

**Flight Tracking**:
- Airline, flight number, airports
- Departure and arrival datetime
- Shuttle preference time slots
- Special notes/requests
- Admin dashboard showing all flights
- Grouped by arrival time for coordination

**Travel Checklist**:
- Pre-defined checklist items
  - "Apply for e-visa"
  - "Book flights"
  - "Book accommodation"
  - "Pack traditional outfits"
  - etc.
- Track completion status per guest
- Auto-check items when data submitted
- Admin view of all guest progress

**Travel Cards**:
- Customizable information cards
- Support for images, content, buttons
- WhatsApp group links
- Disabled state for future cards

**Key Files**:
- `lib/supabase/travel-service.ts`
- `app/(guest)/[weddingSlug]/travel-details/page.tsx`
- `app/admin/onboarding/[weddingSlug]/travel-coordination/page.tsx`

### 4. Event Management & Schedule
**Problem Solved**: Display detailed event information with cultural context.

**Event System**:
- Multiple events per wedding
- Rich event details:
  - Date, time, location
  - Dress code with emoji and description
  - Outfit ideas (separate for women/men)
  - Cultural ritual explanations
  - Image carousels (3-5 photos per event)
  - Gradient backgrounds
  - Event-specific slugs
- Template events for easy setup
- Drag-and-drop ordering

**Schedule System**:
- Multi-day support
- Day-by-day breakdown
- Time-based event listing
- Location information
- Descriptions

**Key Files**:
- `components/admin/EventBuilder.tsx`
- `app/admin/onboarding/[weddingSlug]/events/page.tsx`
- `app/admin/onboarding/[weddingSlug]/schedule/page.tsx`

### 5. Real-Time Guest Interaction
**Problem Solved**: Create engagement before/during wedding.

**Live Comments System**:
- Guest wall with messages
- GIF support via Giphy API
- Real-time updates via Supabase subscriptions
- Avatar display with DiceBear integration
- Delete own comments
- Moderation capabilities

**Guest List**:
- Live attendee count
- Avatar display with initials/colors
- Wedding side visualization
- RSVP status tracking
- Plus-one visibility

**Activity Feed**:
- Recent RSVP activity
- Comment activity
- Real-time updates

**Real-Time Implementation**:
```typescript
// Supabase real-time subscription
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

**Key Files**:
- `components/guest/GuestList.tsx`
- `lib/supabase/rsvp-service.ts` (lines 344-406)
- `app/api/giphy/route.ts`

### 6. Gift Registry with Stripe Integration
**Problem Solved**: Modern honeymoon fund and cash gift collection.

**Features**:
- Multiple fund types (Honeymoon, New Home, etc.)
- Stripe payment processing
- Custom contribution amounts (min $0.50)
- Donor name and message capture
- Secure payment intents
- Product linking

**Payment Flow**:
1. Guest selects fund and amount
2. Enters name and optional message
3. Server creates Stripe payment intent
4. Client handles payment with Stripe Elements
5. Metadata stored in Stripe for tracking

**Key Files**:
- `app/api/stripe/create-payment-intent/route.ts`
- `components/registry/` directory
- `app/(guest)/[weddingSlug]/registry/page.tsx`

### 7. Design Customization System
**Problem Solved**: Let couples personalize their wedding website.

**Customization Options**:

1. **Colors**
   - Primary color
   - Font color
   - Button font color
   - Separate PIN entry colors

2. **Images**
   - Up to 6 couple photos
   - Decorative frame
   - Background image (9 pre-optimized options)
   - Custom PIN entry background

3. **Text**
   - Custom PIN entry messaging
   - Couple names
   - Venue details
   - All content sections

4. **Layouts**
   - Event card styles
   - Schedule formats
   - FAQ layouts

**Background Options** (`/public/images/backgrounds/`):
1. `haldi-optimized.jpg` (Haldi ceremony)
2. `mehndi-optimized.jpg` (Mehndi ceremony)
3. `jaggo-optimized.jpg` (Jaggo celebration)
4. `pool-optimized.jpg` (Poolside venue)
5. `rose.jpg` (Rose theme)
6. `green.jpg` (Nature theme)
7. `blue-clouds.jpg` (Sky theme)
8. `pearl.png` (Default)
9. Additional variations

**Theme System** (`lib/theme/m3-theme.ts`):

**1. Typography & Fonts**
```typescript
// Primary Font: Outfit (Google Fonts)
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
});

// Display/Serif Font: Instrument Serif (Google Fonts)
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});
```

**Font Usage**:
- **Outfit**: Primary UI font (body text, buttons, forms, all interactive elements)
- **Instrument Serif**: Display font (headings, hero text, elegant titles)
- Font stack fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

**Typography Scale** (Responsive):
```typescript
// All typography variants scale across breakpoints
h1: {
  fontFamily: 'var(--font-outfit)',
  fontWeight: 300,
  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem', lg: '4.5rem' }
}

h2: {
  fontFamily: 'var(--font-outfit)',
  fontWeight: 400,
  fontSize: { xs: '2rem', sm: '2.75rem', md: '3rem', lg: '3.25rem' }
}

h3: {
  fontFamily: 'var(--font-outfit)',
  fontWeight: 500,
  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem', lg: '2.75rem' }
}

h4: {
  fontFamily: 'var(--font-outfit)',
  fontWeight: 400,
  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '1.75rem', lg: '2rem' }
}

body1: {
  fontFamily: 'var(--font-outfit)',
  fontWeight: 400,
  fontSize: { xs: '1rem', md: '1.125rem', lg: '1.25rem' },
  lineHeight: 1.5
}

button: {
  fontFamily: 'var(--font-outfit)',
  fontWeight: 500,
  textTransform: 'none',  // No uppercase transformation
  fontSize: { xs: '1rem', md: '1.125rem', lg: '1.25rem' }
}
```

**2. Color Palette**

**Cultural Colors** (`lib/theme/m3-theme.ts`):
```typescript
const culturalColors = {
  // Traditional
  gold: '#D4AF37',      // Traditional wedding gold (secondary)
  maroon: '#800020',    // Primary brand color
  saffron: '#FF9933',   // Cultural accent

  // Modern accents
  coral: '#FF6B6B',     // Modern warm accent
  teal: '#20C997',      // Fresh cool accent
  purple: '#6C5CE7'     // Regal accent
};
```

**Primary Brand Color**: `#DE3F5E` (Coral Pink)
- Used throughout landing page, CTAs, buttons, links
- Primary accent for guest-facing pages
- Hover state: `#C8365A` (darker coral)

**Light Mode Palette**:
```typescript
primary: { main: '#800020' },      // Maroon
secondary: { main: '#D4AF37' }     // Gold
```

**Dark Mode Palette**:
```typescript
primary: { main: '#D4AF37' },      // Gold
secondary: { main: '#FF6B6B' }     // Coral
```

**Neutral Colors**:
- Text primary: `#1a1a1a` (near black)
- Text secondary: `#4a4a4a` (medium gray)
- Text disabled: `#999` (light gray)
- Backgrounds: `#FAFAFA`, `#F5F5F5`, `alpha('#fff', 0.95)`

**3. Material Design 3 Components**
```typescript
shape: {
  borderRadius: 16  // M3 larger radius for cards/papers
}

// Button styling
MuiButton: {
  borderRadius: 24,        // Pill-shaped buttons
  textTransform: 'none'    // Natural case text
}

// TextField styling
MuiTextField: {
  borderRadius: 12,
  focusBorderColor: '#800020',  // Maroon focus
  borderWidth: '2px'
}
```

**4. Landing Page Specific Styles**

**Key Gradients**:
```typescript
// Hero gradient background
'linear-gradient(135deg, rgba(222, 63, 94, 0.05) 0%, rgba(255, 142, 83, 0.05) 100%)'

// CTA sections
bgcolor: alpha('#DE3F5E', 0.03)
bgcolor: alpha('#DE3F5E', 0.02)
```

**Card Styles**:
```typescript
Paper: {
  borderRadius: '24px',
  bgcolor: alpha('#fff', 0.9),
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
}
```

**Button Variants**:
```typescript
// Primary CTA
bgcolor: '#DE3F5E',
color: 'white',
borderRadius: '32px',
'&:hover': { bgcolor: '#C8365A' }

// Secondary CTA
borderColor: '#DE3F5E',
color: '#DE3F5E',
borderRadius: '32px',
'&:hover': {
  borderColor: '#C8365A',
  bgcolor: alpha('#DE3F5E', 0.05)
}
```

**5. Wedding Website Customization**

Per-wedding customizable colors (stored in `weddings` table):
- `primary_color` (default: `#DE3F5E`)
- `font_color`
- `button_font_color`
- `background_image`
- PIN entry page has separate color scheme options

**Key Files**:
- `app/admin/onboarding/[weddingSlug]/design/page.tsx` - Design customization
- `lib/theme/m3-theme.ts` - Global theme configuration (312 lines)
- `components/ui/OptimizedBackground.tsx` - Background management
- `app/layout.tsx` - Font loading and configuration
- `app/page.tsx` - Landing page styling patterns

### 8. Admin Dashboard & Onboarding
**Problem Solved**: Non-technical wedding planning.

**Onboarding Wizard** (13-step setup):
1. **Overview** - Basic wedding info (names, date, venue)
2. **Design** - Colors, images, styling
3. **Events** - Event builder
4. **Schedule** - Timeline creation
5. **Travel** - Travel cards
6. **Travel Coordination** - Flight tracking setup
7. **FAQ** - Question management
8. **Registry** - Fund setup
9. **Shopping** - Vendor links
10. **Details** - Menu/details page
11. **PIN Entry** - Access code setup
12. **Pins** - PIN management
13. **Team** - Collaborator management
14. **Guests** - Guest list upload
15. **Settings** - Advanced options

**Admin Features**:
- Guest management
- RSVP analytics
- Flight coordination dashboard
- Export capabilities (Excel via xlsx)
- Google Sheets sync
- Real-time previews
- Multi-wedding dashboard

**Key Files**:
- `app/admin/onboarding/[weddingSlug]/` directory (15 pages)
- `components/admin/` components

### 9. Team Collaboration
**Problem Solved**: Allow multiple people to manage wedding.

**Features**:
- Role-based access (Owner, Admin, Viewer)
- Email invitations
- Pending invite management
- Auto-process invites on login
- Permission controls per role

**Workflow**:
1. Owner sends email invite
2. Invite stored in `wedding_invites`
3. Recipient creates account / logs in
4. System auto-processes invite
5. Added to `wedding_admins`
6. Access granted

**Key Files**:
- `lib/supabase/wedding-service.ts` (lines 801-932)
- `app/admin/onboarding/[weddingSlug]/team/page.tsx`
- `app/api/invites/send/route.ts`

---

## Project Structure

```
phera/
├── app/                                    # Next.js App Router
│   ├── (guest)/                           # Guest-facing routes
│   │   └── [weddingSlug]/                # Dynamic routing per wedding
│   │       ├── page.tsx                  # Home page with countdown
│   │       ├── rsvp/                     # RSVP form
│   │       ├── events/                   # Event details & carousel
│   │       ├── schedule/                 # Wedding schedule
│   │       ├── details/                  # Wedding menu/details
│   │       ├── travel/                   # Travel information
│   │       ├── travel-details/           # Flight details & checklist
│   │       ├── faq/                      # FAQ page
│   │       ├── registry/                 # Gift registry
│   │       └── where-to-shop/           # Shopping recommendations
│   ├── admin/                            # Admin dashboard
│   │   ├── page.tsx                      # Wedding selection
│   │   └── onboarding/[weddingSlug]/    # Wedding management
│   │       ├── overview/                 # Basic info & stats
│   │       ├── design/                   # Colors & styling
│   │       ├── events/                   # Event builder
│   │       ├── schedule/                 # Schedule builder
│   │       ├── travel/                   # Travel cards
│   │       ├── travel-coordination/      # Flight tracking
│   │       ├── faq/                      # FAQ management
│   │       ├── registry/                 # Registry setup
│   │       ├── shopping/                 # Shopping links
│   │       ├── details/                  # Details page config
│   │       ├── pins/                     # PIN management
│   │       ├── pin-entry/                # PIN entry customization
│   │       ├── team/                     # Team collaboration
│   │       ├── guests/                   # Guest list
│   │       └── settings/                 # Wedding settings
│   ├── auth/                             # Authentication
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts             # OAuth callback
│   ├── api/                              # API routes
│   │   ├── stripe/create-payment-intent/ # Stripe payments
│   │   ├── giphy/                        # GIF search
│   │   ├── whatsapp/track-click/         # WhatsApp analytics
│   │   ├── invites/send/                 # Team invites
│   │   └── agents/                       # Waitlist (future)
│   ├── test-sms/page.tsx                 # SMS testing interface
│   ├── test-magic-link/page.tsx          # Magic link testing
│   └── layout.tsx                        # Root layout with providers
├── components/
│   ├── admin/                            # Admin components
│   │   ├── EventBuilder.tsx
│   │   ├── ScheduleBuilder.tsx
│   │   ├── TravelCardManager.tsx
│   │   └── GuestManager.tsx
│   ├── auth/                             # Auth components
│   │   ├── LoginModal.tsx
│   │   ├── LoginDialog.tsx
│   │   └── SMSTestComponent.tsx
│   ├── guest/                            # Guest components
│   │   ├── CustomRSVPForm.tsx
│   │   ├── GuestList.tsx
│   │   ├── PinEntry.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── CountdownTimer.tsx
│   │   └── EventCard.tsx
│   ├── registry/                         # Registry components
│   ├── shared/                           # Shared components
│   │   ├── AppHeader.tsx
│   │   ├── WhatsAppChannelModal.tsx
│   │   └── LoadingSpinner.tsx
│   ├── ui/                               # UI components
│   │   ├── OptimizedBackground.tsx
│   │   └── PlaceholderCouple.tsx
│   └── landing/                          # Landing page components
│       ├── AgentCard.tsx
│       └── AgentModal.tsx
├── lib/
│   ├── supabase/                         # Supabase services
│   │   ├── client.ts                     # Supabase client singleton
│   │   ├── types.ts                      # TypeScript types
│   │   ├── auth-service.ts               # Authentication (353 lines)
│   │   ├── rsvp-service.ts               # RSVP operations (416 lines)
│   │   ├── wedding-service.ts            # Wedding CRUD (1146 lines)
│   │   └── travel-service.ts             # Travel/flights (300 lines)
│   ├── contexts/                         # React contexts
│   │   ├── AuthContext.tsx               # Auth state (675 lines)
│   │   └── WeddingContext.tsx            # Wedding state
│   ├── google/                           # Google APIs
│   │   ├── auth.ts                       # OAuth
│   │   ├── sheets-api.ts                 # Sheets integration
│   │   └── forms-api.ts                  # Forms integration
│   ├── email/                            # Email services
│   │   └── resend.ts                     # Resend integration
│   ├── theme/                            # MUI theme
│   │   └── m3-theme.ts                   # Material Design 3
│   ├── constants/                        # Constants
│   │   ├── form-styles.ts
│   │   ├── images.ts
│   │   └── country-codes.ts
│   ├── utils/                            # Utilities
│   │   ├── wedding-id-helpers.ts
│   │   └── date-utils.ts
│   ├── hooks/                            # Custom hooks
│   │   └── useCountdown.ts
│   └── animations/                       # Animation configs
│       └── cultural.ts
├── migrations/                           # Database migrations
│   ├── create_multi_wedding_system.sql
│   ├── enhance_rsvp_table.sql
│   ├── seed_kv_admin.sql
│   ├── backfill_wedding_admins.sql
│   └── ... (24 total migration files)
├── public/                               # Static assets
│   ├── images/
│   │   ├── backgrounds/                  # 9 background options
│   │   ├── couple/                       # Couple photos
│   │   └── frames/                       # Decorative frames
│   └── logo.svg
├── middleware.ts                         # Next.js middleware (auth protection)
├── context.md                            # This file (AI context)
├── qwen.md                               # Qwen-optimized context
├── claude.md                             # Claude-optimized context
├── PROJECT_SETUP.md                      # Legacy setup guide
├── ADMIN_FLOW_FIXES.md                   # Admin flow documentation
├── SUPABASE_MCP_SETUP.md                 # MCP integration guide
├── TWILIO_MCP_SETUP.md                   # Twilio MCP guide
├── CLAUDE.md                             # Desktop responsive notes
└── package.json                          # Dependencies
```

---

## API Routes

### `/api/stripe/create-payment-intent` (POST)
**Purpose**: Create Stripe payment intent for registry contributions.

**Request Body**:
```typescript
{
  amount: number;        // In cents, minimum 50 ($0.50)
  fundName: string;      // Registry fund name
  donorName: string;     // Contributor name
  message?: string;      // Optional message
}
```

**Response**:
```typescript
{
  clientSecret: string;  // For Stripe Elements
}
```

**Features**:
- Amount validation
- Metadata storage
- Fund tracking
- Error handling

**File**: `app/api/stripe/create-payment-intent/route.ts`

### `/api/giphy` (GET)
**Purpose**: Search GIFs for guest comments.

**Query Parameters**:
- `q`: Search query string
- `limit`: Results limit (default 20)
- `offset`: Pagination offset

**Response**:
```typescript
{
  data: Array<{
    id: string;
    url: string;
    title: string;
    images: {
      preview_gif: { url: string };
      fixed_height: { url: string };
    };
  }>;
}
```

**Features**:
- Giphy API proxy
- Rating filter (PG-13)
- Pagination support

**File**: `app/api/giphy/route.ts`

### `/api/whatsapp/track-click` (POST)
**Purpose**: Track WhatsApp link clicks.

**Request Body**:
```typescript
{
  weddingId: string;
  guestId?: string;
}
```

**Status**: Implementation pending

**File**: `app/api/whatsapp/track-click/route.ts`

### `/api/invites/send` (POST)
**Purpose**: Send team member invitation emails.

**Request Body**:
```typescript
{
  email: string;
  role: 'admin' | 'viewer';
  weddingId: string;
}
```

**Features**:
- Email via Resend
- Auth check
- Invite validation
- Duplicate prevention

**File**: `app/api/invites/send/route.ts`

### `/api/agents/waitlist` (POST)
**Purpose**: General waitlist signup.

**Request Body**:
```typescript
{
  email: string;
  agent_id: string;
  cta_type: string;
}
```

**Status**: Future feature for paid plans

**File**: `app/api/agents/waitlist/route.ts`

### `/auth/callback` (GET)
**Purpose**: OAuth callback handler.

**Query Parameters**:
- `code`: OAuth authorization code
- `error`: Error message if any
- `redirect`: Custom redirect path
- `pin_verified`: PIN state preservation

**Features**:
- Google OAuth redirect
- Session creation
- Redirect to app
- Process pending invites
- PIN state preservation

**File**: `app/auth/callback/route.ts` (203 lines)

---

## Key Services

### 1. **Authentication Service** (`lib/supabase/auth-service.ts`)
353 lines of multi-method authentication management.

**Key Methods**:

```typescript
// Google OAuth
signInWithGoogle(redirectUrl?: string): Promise<AuthError | null>

// Phone/SMS OTP
signInWithPhone(phoneNumber: string): Promise<{success: boolean; error?: string}>
verifyOTP(phone: string, code: string): Promise<{success: boolean; error?: string}>

// Email OTP
sendEmailOTP(email: string, weddingId: string): Promise<{success: boolean; error?: string}>
verifyEmailOTP(email: string, code: string, weddingId: string): Promise<{success: boolean; user?: User}>

// Session management
getCurrentUser(): Promise<{success: boolean; user?: User}>
signOut(): Promise<void>

// Validation
validateEmailExists(email: string, weddingId: string): Promise<boolean>
```

**Features**:
- Multi-method support
- Plus-one authentication
- Guest record linking
- Error handling
- Session management

### 2. **RSVP Service** (`lib/supabase/rsvp-service.ts`)
416 lines of comprehensive RSVP lifecycle management.

**Key Methods**:

```typescript
// RSVP operations
submitRSVP(rsvpData: RSVPFormData): Promise<{success: boolean; error?: string}>
getExistingRSVP(guestId: string, weddingId: string): Promise<RSVP | null>
deleteRSVP(guestId: string, weddingId: string): Promise<void>

// Guest queries
getAttendees(weddingId: string): Promise<Guest[]>
getAllRSVPs(weddingId: string): Promise<RSVP[]>
getMaybeAttendees(weddingId: string): Promise<Guest[]>

// Comments
getComments(weddingId: string): Promise<Comment[]>
addComment(comment: CommentData): Promise<Comment>
deleteComment(commentId: string): Promise<void>
```

**Features**:
- Handles old boolean and new string `attending` formats
- Auto-generates avatars with DiceBear
- Stores localStorage auth after submission
- Food preference array normalization
- Plus-one management
- Real-time comment support

### 3. **Wedding Service** (`lib/supabase/wedding-service.ts`)
1146 lines of comprehensive wedding data management.

**Key Methods**:

```typescript
// Wedding CRUD
getWeddingBySlug(slug: string): Promise<Wedding | null>
getUserWeddings(userId: string): Promise<Wedding[]>
createWedding(wedding: Partial<Wedding>): Promise<Wedding | null>
updateWedding(id: string, updates: Partial<Wedding>): Promise<Wedding | null>
deleteWedding(id: string): Promise<boolean>

// Events
getWeddingEvents(weddingId: string): Promise<WeddingEvent[]>
createEvent(event: Partial<WeddingEvent>): Promise<WeddingEvent | null>
updateEvent(id: string, updates: Partial<WeddingEvent>): Promise<WeddingEvent | null>
deleteEvent(id: string): Promise<boolean>

// Schedule
getWeddingSchedule(weddingId: string): Promise<ScheduleWithItems[]>
createSchedule(schedule: Partial<WeddingSchedule>): Promise<WeddingSchedule | null>
createScheduleItem(item: Partial<ScheduleItem>): Promise<ScheduleItem | null>

// Travel
getTravelCards(weddingId: string): Promise<WeddingTravelCard[]>
createTravelCard(card: Partial<WeddingTravelCard>): Promise<WeddingTravelCard | null>

// FAQs
getFAQs(weddingId: string): Promise<WeddingFAQ[]>
createFAQ(faq: Partial<WeddingFAQ>): Promise<WeddingFAQ | null>

// Registry
getRegistry(weddingId: string): Promise<WeddingRegistry[]>
createRegistryItem(item: Partial<WeddingRegistry>): Promise<WeddingRegistry | null>

// Shops
getShops(weddingId: string): Promise<WeddingShop[]>
createShop(shop: Partial<WeddingShop>): Promise<WeddingShop | null>

// Settings
getSettings(weddingId: string): Promise<WeddingSettings | null>
updateSettings(weddingId: string, settings: Partial<WeddingSettings>): Promise<WeddingSettings | null>

// Team management
getWeddingAdmins(weddingId: string): Promise<WeddingAdmin[]>
addWeddingAdmin(admin: Partial<WeddingAdmin>): Promise<WeddingAdmin | null>
removeWeddingAdmin(id: string): Promise<boolean>
isUserWeddingAdmin(weddingId: string, userId: string): Promise<boolean>

// Team invites
createWeddingInvite(invite: Partial<WeddingInvite>): Promise<WeddingInvite | null>
deleteWeddingInvite(id: string): Promise<boolean>
getTeamMembers(weddingId: string): Promise<TeamMember[]>
processInvitesForUser(userId: string, userEmail: string): Promise<number>
```

**Features**:
- Singleton service instance
- Automatic `wedding_admins` creation
- RLS policy error handling
- Team invite processing on login
- Comprehensive CRUD operations

### 4. **Travel Service** (`lib/supabase/travel-service.ts`)
300 lines of destination wedding coordination.

**Key Methods**:

```typescript
// Flights
getGuestFlight(guestId: string, weddingId: string): Promise<GuestFlight | null>
upsertGuestFlight(flight: GuestFlightData): Promise<{success: boolean; error?: string}>
getAllGuestFlights(weddingId: string): Promise<GuestFlight[]>

// Checklist
getGuestChecklist(guestId: string, weddingId: string): Promise<ChecklistItem[]>
updateChecklistItem(item: ChecklistItemData): Promise<void>
getAllGuestChecklists(weddingId: string): Promise<Array<{guest: Guest; checklist: ChecklistItem[]}>>

// Shuttle coordination
getShuttlePreferencesSummary(weddingId: string): Promise<ShuttleGroup[]>
```

**Features**:
- Thailand-specific checklist (extendable)
- Auto-check checklist when data submitted
- Shuttle grouping by time
- Admin coordination view

---

## Pain Points Solved

### 1. **Information Overload**
**Problem**: Guests confused about multiple events, times, locations.

**Solution**:
- Clear event cards with ritual explanations
- Schedule breakdown by day
- FAQ section
- Cultural context for each event

### 2. **RSVP Collection Chaos**
**Problem**: Tracking RSVPs via email/text is messy and error-prone.

**Solution**:
- Structured digital RSVP with validation
- Central admin dashboard
- Export to Excel/Google Sheets
- Real-time updates
- Maybe option for uncertain guests

### 3. **Dietary Restrictions**
**Problem**: Hard to track and communicate to caterers.

**Solution**:
- Dedicated food preference fields (multi-select)
- Dietary restriction notes
- Exportable data for vendors
- Centralized tracking

### 4. **Plus-One Confusion**
**Problem**: Unclear who can bring guests, how to capture plus-one info.

**Solution**:
- PIN-based permissions
- Dedicated plus-one form step
- Explicit allowance per guest
- Plus-one contact information

### 5. **Travel Coordination**
**Problem**: Destination weddings need flight/shuttle coordination.

**Solution**:
- Flight information capture
- Shuttle preferences
- Admin coordination dashboard
- Arrival time grouping

### 6. **Cultural Context**
**Problem**: Non-Indian guests unfamiliar with rituals and customs.

**Solution**:
- Ritual descriptions per event
- Dress code explanations
- Outfit ideas for women and men
- Cultural guide section

### 7. **Guest Engagement**
**Problem**: Limited interaction before/during wedding.

**Solution**:
- Comment wall with GIFs
- Song requests
- Special messages
- Real-time updates
- Activity feed

### 8. **Gift Registry**
**Problem**: Cash gifts awkward to request/collect.

**Solution**:
- Modern honeymoon fund
- Stripe integration
- Custom contribution amounts
- Donor messages
- Multiple fund types

### 9. **Mobile Experience**
**Problem**: Most wedding sites desktop-only, poor mobile UX.

**Solution**:
- Mobile-first design
- Touch-optimized interactions
- Responsive layouts
- Progressive enhancement for desktop
- Fast load times

### 10. **Multi-Event Management**
**Problem**: Indian weddings have 3-5+ events to coordinate.

**Solution**:
- Event builder
- Separate event pages
- Schedule integration
- Event-specific RSVPs (future)
- Template events

### 11. **Vendor Communication**
**Problem**: Sharing guest lists, dietary needs with vendors.

**Solution**:
- Excel export
- Google Sheets sync
- Comprehensive data capture
- Vendor-ready formats

### 12. **Team Collaboration**
**Problem**: Only one person can manage website.

**Solution**:
- Multi-admin system
- Role-based access
- Team invites via email
- Permission levels

### 13. **Late RSVPs**
**Problem**: Guests forget to RSVP, miss deadline.

**Solution**:
- Countdown timer on site
- Clear deadline display
- Maybe option for unsure guests
- RSVP reminders (future)

### 14. **International Guests**
**Problem**: Different phone formats, time zones, languages.

**Solution**:
- Country code selector (20+ countries)
- International phone support
- Flexible date formats
- Timezone handling

### 15. **Website Customization**
**Problem**: Template sites all look the same.

**Solution**:
- Color customization
- Image upload (6 couple photos)
- Text editing
- Cultural themes
- 9 background options

---

## Environment Configuration

### Required Environment Variables

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Wedding Config (Legacy - being phased out for multi-wedding)
NEXT_PUBLIC_WEDDING_DATE=2026-01-04T00:00:00
NEXT_PUBLIC_WEDDING_ID=sim-kv
NEXT_PUBLIC_WEDDING_PIN=7834

# Google OAuth (Required for admin access)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Sheets (Optional)
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id

# Email (Required for invites)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Stripe (Required for registry)
STRIPE_SECRET_KEY=sk_test_or_live_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key

# Giphy (Optional - for GIF search)
GIPHY_API_KEY=your_giphy_api_key

# WhatsApp (Optional)
NEXT_PUBLIC_WHATSAPP_GROUP_LINK=https://chat.whatsapp.com/your_link

# Lapse (Optional - photo sharing)
NEXT_PUBLIC_LAPSE_EVENT_CODES=mehendi:ABC123,sangeet:DEF456
```

### MCP Integration

#### Supabase MCP (Recommended)
Enables AI to query database directly.

**Setup**: See `SUPABASE_MCP_SETUP.md`

**Configuration** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=YOUR_PROJECT_REF"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

**Capabilities**:
- Query guest data
- Generate database insights
- Manage schema
- Generate TypeScript types
- Optimize performance

#### Twilio MCP (Optional)
Enables AI to send SMS.

**Setup**: See `TWILIO_MCP_SETUP.md`

**Configuration** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "twilio": {
      "command": "npx",
      "args": [
        "-y",
        "@twilio-alpha/mcp",
        "YOUR_ACCOUNT_SID/YOUR_API_KEY:YOUR_API_SECRET",
        "--services",
        "twilio_api_v2010",
        "--tags",
        "Api20100401IncomingPhoneNumber,Api20100401Message"
      ]
    }
  }
}
```

**Capabilities**:
- Send SMS invitations
- Purchase phone numbers
- Set up automated messaging
- Monitor SMS delivery

---

## Development Workflow

### Installation

```bash
# Clone and install
git clone <repository-url>
cd phera
npm install
```

### Local Development

```bash
# Start dev server (with Turbopack)
npm run dev

# Production build
npm run build

# Production server
npm run start

# Linting
npm run lint
```

### Testing Interfaces

#### SMS Testing
Access `/test-sms` for comprehensive SMS debugging:
- Test OTP sending
- Verify phone auth flow
- Debug SMS provider
- Console logging
- Real-time error feedback

**File**: `app/test-sms/page.tsx`

#### Magic Link Testing
Access `/test-magic-link` for email link testing (deprecated in favor of OTP).

**File**: `app/test-magic-link/page.tsx`

### Database Migrations

**Run migrations in order**:
1. `migrations/create_multi_wedding_system.sql` - Base multi-wedding schema
2. `migrations/enhance_rsvp_table.sql` - Enhanced RSVP fields
3. `migrations/seed_kv_admin.sql` - Seed admin for testing
4. `migrations/backfill_wedding_admins.sql` - Backfill existing data

### Using Supabase MCP for Queries

**Instead of manual SQL**, use Supabase MCP:

```
# ❌ DON'T: Manually write SQL
Run this SQL: SELECT * FROM guests WHERE wedding_id = 'sim-kv'

# ✅ DO: Use MCP
Can you show me all guests for the sim-kv wedding?
```

**AI will use MCP to**:
- Execute SELECT queries safely
- Format results clearly
- Generate insights
- Create visualizations

### Code Organization

**Service Layer Pattern**:
- All database operations in `lib/supabase/*-service.ts`
- Components call services, not direct Supabase
- Centralized error handling
- Type safety throughout

**Component Pattern**:
- Client components use `'use client'`
- Server components default
- Shared components in `components/shared/`
- Feature-specific in `components/admin/` or `components/guest/`

**Context Pattern**:
- AuthContext for global auth state
- WeddingContext for wedding data (optional)
- Provider setup in `app/layout.tsx`

---

## Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables Setup

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all required environment variables
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is added (not in `.env.local`)

### Database Setup (Production)

1. **Create Supabase Project**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Create new project
   - Note project URL and keys

2. **Run Migrations**
   - Execute migrations in SQL Editor
   - Run in order (see Database Migrations section)

3. **Configure RLS Policies**
   - Policies already in migration files
   - Verify policies are active
   - Test with different user roles

4. **Enable Real-Time**
   - Go to Database → Replication
   - Enable for `comments` table
   - Verify subscriptions work

5. **Set Up Authentication**
   - Go to Authentication → Providers
   - Enable Google OAuth
   - Add authorized redirect URLs
   - Configure email templates

6. **Performance Optimization**
   - Verify indexes exist
   - Check query performance
   - Enable connection pooling

### Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] RLS policies active
- [ ] Google OAuth configured
- [ ] Stripe webhooks set up (if using)
- [ ] Email provider configured (Resend)
- [ ] Real-time enabled on comments
- [ ] Test all auth flows
- [ ] Test RSVP submission
- [ ] Test admin dashboard
- [ ] Test team invites
- [ ] Verify mobile responsiveness
- [ ] Check production logs

---

## Best Practices for AI Assistants

### When Working with This Codebase

1. **Use Supabase MCP for Database Queries**
   - Prefer MCP over manual SQL
   - SELECT queries only (read-only mode)
   - Let MCP handle formatting

2. **Follow Existing Patterns**
   - Use service layer for database operations
   - Client components for interactivity
   - Server components for data fetching

3. **Type Safety**
   - Use types from `lib/supabase/types.ts`
   - Don't use `any` unless absolutely necessary
   - Generate types from Supabase schema

4. **Error Handling**
   - Always handle Supabase errors
   - Provide user-friendly error messages
   - Log errors for debugging

5. **Authentication**
   - Check auth in middleware first
   - Use AuthContext for client-side
   - Respect RLS policies

6. **Responsive Design**
   - Mobile-first approach
   - Use MUI breakpoints: `{ xs, sm, md, lg, xl }`
   - Test at all breakpoints

7. **Performance**
   - Lazy load components where possible
   - Optimize images with Next.js Image
   - Use Supabase indexes
   - Minimize re-renders

### When Adding Features

1. **Database Changes**
   - Create migration file
   - Update `lib/supabase/types.ts`
   - Add service methods
   - Update RLS policies

2. **New Routes**
   - Follow App Router conventions
   - Add to appropriate directory structure
   - Protect with middleware if needed
   - Add to navigation if user-facing

3. **API Endpoints**
   - Server-side validation
   - Proper error responses
   - Type-safe request/response
   - Rate limiting (future)

4. **UI Components**
   - Use MUI components
   - Follow Material Design 3
   - Responsive by default
   - Accessible (ARIA labels)

---

## Quick Reference

### Common File Locations

| Feature | File Path |
|---------|-----------|
| Auth logic | `lib/supabase/auth-service.ts` |
| Auth state | `lib/contexts/AuthContext.tsx` |
| RSVP form | `components/guest/CustomRSVPForm.tsx` |
| Wedding CRUD | `lib/supabase/wedding-service.ts` |
| Travel coordination | `lib/supabase/travel-service.ts` |
| Database types | `lib/supabase/types.ts` |
| Theme | `lib/theme/m3-theme.ts` |
| Middleware | `middleware.ts` |
| Admin onboarding | `app/admin/onboarding/[weddingSlug]/` |
| Guest pages | `app/(guest)/[weddingSlug]/` |
| API routes | `app/api/` |

### Common Commands

```bash
# Development
npm run dev                              # Start dev server

# Database
# Use Supabase MCP instead of manual SQL queries

# Testing
open http://localhost:3000/test-sms      # SMS testing
open http://localhost:3000/sim-kv        # Guest view
open http://localhost:3000/admin         # Admin view

# Deployment
vercel                                   # Deploy to Vercel
```

### Key Concepts

- **Wedding Slug**: Unique identifier (e.g., `sim-kv`)
- **PIN Types**: `family` (plus-one), `individual` (no plus-one), `bypass` (skip RSVP)
- **Auth Methods**: PIN, Email OTP, Phone OTP, Google OAuth, Plus-One, Auto-auth
- **RSVP Status**: `yes`, `no`, `maybe`
- **Admin Roles**: `owner`, `admin`, `viewer`
- **MUI Breakpoints**: `xs` (0px), `sm` (600px), `md` (900px), `lg` (1200px), `xl` (1536px)

---

## Conclusion

Phera is a production-ready, feature-complete Indian wedding platform that combines modern web technologies with traditional cultural elements. This comprehensive context document serves as the definitive reference for AI assistants and developers working on the platform.

**Key Strengths**:
- Multi-wedding architecture
- Flexible authentication
- Comprehensive RSVP system
- Real-time features
- Cultural customization
- Team collaboration
- Mobile-first design
- Production security

**For AI Assistants**:
- Use Supabase MCP for database queries
- Follow existing patterns
- Maintain type safety
- Respect authentication flows
- Test responsively

**Last Updated**: December 2025
**Version**: 2.0
**Maintainer**: Phera Development Team
