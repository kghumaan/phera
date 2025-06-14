# Pheras - Indian Wedding Platform Setup

## Project Overview
A dual-experience wedding platform: Admin dashboard for couples to manage their Indian wedding + Mobile-first guest website with custom RSVP forms, real-time comments, attendee visualization, WhatsApp community, and Lapse photo sharing.

## Initial Setup Commands
```bash
# Create Next.js project with TypeScript
npx create-next-app@latest pheras --typescript --tailwind --app
cd pheras

# Core dependencies
npm install @mui/material @mui/material-nextjs @emotion/react @emotion/styled
npm install framer-motion
npm install react-intersection-observer clsx date-fns
npm install @mui/icons-material
npm install react-hook-form zod @hookform/resolvers

# Supabase
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
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
│   │   ├── rsvp/             # RSVP endpoints
│   │   ├── comments/         # Comments API
│   │   └── whatsapp/         # WhatsApp integration
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── admin/                # Admin-specific components
│   ├── guest/                # Guest-specific components
│   │   ├── RSVPForm.tsx      # Custom form
│   │   ├── CommentSection.tsx # Real-time comments
│   │   └── AttendeeList.tsx  # Who's coming visualization
│   ├── shared/               # Shared components
│   └── ui/                   # M3 customized components
├── lib/
│   ├── supabase/             # Supabase client & types
│   ├── theme/                # M3 theme configuration
│   ├── animations/           # Framer Motion
│   └── constants/
└── public/
    └── cultural-assets/      # Patterns, icons
```

## Supabase Database Schema

### Tables
```sql
-- Guests table
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  initials TEXT GENERATED ALWAYS AS (
    UPPER(SUBSTRING(SPLIT_PART(name, ' ', 1) FROM 1 FOR 1) || 
    SUBSTRING(SPLIT_PART(name, ' ', -1) FROM 1 FOR 1))
  ) STORED,
  avatar_color TEXT DEFAULT '#' || SUBSTRING(MD5(name::text), 1, 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RSVP responses
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id),
  event_id TEXT NOT NULL, -- 'mehendi', 'sangeet', 'ceremony', 'reception'
  attending BOOLEAN NOT NULL,
  guest_count INTEGER DEFAULT 1,
  dietary_restrictions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_id, event_id)
);

-- Comments/Messages
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time subscriptions
ALTER TABLE comments REPLICA IDENTITY FULL;
```

### Row Level Security
```sql
-- Enable RLS
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Guests can view all attendees" ON guests
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Guests can insert own RSVP" ON rsvps
  FOR INSERT TO authenticated, anon 
  WITH CHECK (auth.uid()::text = guest_id::text);
```

## Supabase Client Setup

### lib/supabase/client.ts
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### lib/supabase/types.ts
```typescript
export interface Guest {
  id: string
  name: string
  email: string
  phone?: string
  initials: string
  avatar_color: string
}

export interface RSVP {
  id: string
  guest_id: string
  event_id: string
  attending: boolean
  guest_count: number
  dietary_restrictions?: string
  guest?: Guest
}

export interface Comment {
  id: string
  guest_id: string
  message: string
  created_at: string
  guest?: Guest
}
```

## Core Features Implementation

### 1. Custom RSVP Form
```typescript
// components/guest/RSVPForm.tsx
- React Hook Form with Zod validation
- Multi-event selection (Mehendi, Sangeet, etc.)
- Guest information collection
- Real-time validation
- Success animations
- Supabase data submission
```

### 2. Attendee Visualization
```typescript
// components/guest/AttendeeList.tsx
- Circle avatars with initials overlay
- Color-coded by guest category
- Animated entrance
- Click to view full list
- Real-time updates via Supabase
- "X people are attending" counter
```

### 3. Comment Section
```typescript
// components/guest/CommentSection.tsx
- Real-time comments using Supabase subscriptions
- Guest name and timestamp
- Auto-scroll to new comments
- Profanity filter
- Character limit
- Mobile-optimized input
```

### 4. Admin Dashboard Features
```typescript
// components/admin/GuestManager.tsx
- View all RSVPs in data grid
- Export to CSV functionality
- Filter by event
- Bulk actions
- Real-time updates
```

## TODO List (Priority Order)

### 🔴 Critical Path
- [ ] Set up Supabase project and database schema
- [ ] Create environment variables for Supabase
- [ ] Implement custom RSVP form with validation
- [ ] Build attendee visualization component
- [ ] Add real-time comment section
- [ ] Test mobile responsiveness thoroughly

### 🟡 Core Features
- [ ] Complete cultural animations (floating petals)
- [ ] Implement WhatsApp QR code generation
- [ ] Add ceremony guide component
- [ ] Create admin RSVP data viewer
- [ ] Build CSV export functionality
- [ ] Add loading states and error handling

### 🟢 Polish & Launch
- [ ] Optimize images and animations for performance
- [ ] Add PWA capabilities for offline access
- [ ] Implement analytics tracking
- [ ] Set up error monitoring (Sentry)
- [ ] Create deployment pipeline
- [ ] Configure custom domain

### ✅ Completed
- [x] Project setup with Material UI
- [x] Basic routing structure
- [x] Guest homepage with countdown
- [x] Admin dashboard skeleton
- [x] Event management system
- [x] Lapse integration for photos
- [x] Theme configuration

## Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_WEDDING_DATE=2024-12-15
NEXT_PUBLIC_WHATSAPP_GROUP_LINK=https://chat.whatsapp.com/...
NEXT_PUBLIC_LAPSE_EVENT_CODES=mehendi:ABC123,sangeet:DEF456
```

## Key Implementation Examples

### RSVP Form with Supabase
```typescript
const onSubmit = async (data: FormData) => {
  // Insert guest
  const { data: guest } = await supabase
    .from('guests')
    .upsert({ 
      email: data.email,
      name: data.name,
      phone: data.phone 
    })
    .select()
    .single()

  // Insert RSVPs for each event
  const rsvpPromises = data.events.map(event => 
    supabase.from('rsvps').insert({
      guest_id: guest.id,
      event_id: event,
      attending: true,
      guest_count: data.guestCount,
      dietary_restrictions: data.dietary
    })
  )
  
  await Promise.all(rsvpPromises)
}
```

### Real-time Comments
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('comments')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'comments' },
      (payload) => {
        addComment(payload.new as Comment)
      }
    )
    .subscribe()

  return () => subscription.unsubscribe()
}, [])
```

### Attendee Avatars
```typescript
<div className="flex -space-x-2">
  {attendees.slice(0, 5).map((guest) => (
    <div
      key={guest.id}
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
      style={{ backgroundColor: guest.avatar_color }}
    >
      {guest.initials}
    </div>
  ))}
  {attendees.length > 5 && (
    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
      +{attendees.length - 5}
    </div>
  )}
</div>
```

## Testing Checklist
- [ ] RSVP form submission works
- [ ] Attendee list updates in real-time
- [ ] Comments appear instantly
- [ ] Mobile responsiveness (all breakpoints)
- [ ] Supabase RLS policies work correctly
- [ ] Export to CSV functions properly
- [ ] Performance on slow connections

## Deployment
```bash
# Build and deploy to Vercel
npm run build
vercel --prod

# Set up Supabase environment variables in Vercel
# Enable Vercel/Supabase integration for automatic env vars
```

## Development Tips
1. Use Supabase Studio for database management
2. Test real-time features with multiple browser tabs
3. Monitor Supabase dashboard for API usage
4. Use React Query for caching Supabase data
5. Implement optimistic updates for better UX