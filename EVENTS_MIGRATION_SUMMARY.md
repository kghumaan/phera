# Events Carousel Migration Summary

**Date**: December 17, 2025
**Branch**: `develop`
**Goal**: Migrate events from hardcoded main branch to dynamic database-driven approach

---

## ✅ Completed Tasks

### 1. **Schema Updates**
Added two new columns to `wedding_events` table:

```sql
ALTER TABLE wedding_events
ADD COLUMN carousel_slides JSONB DEFAULT '[]'::jsonb,
ADD COLUMN text_color TEXT DEFAULT '#141414';
```

**Status**: ✅ Completed (you ran this SQL)

---

### 2. **TypeScript Types Updated**
**File**: `lib/supabase/wedding-service.ts`

Added new interfaces and fields:
- `CarouselSlide` interface with types: `dress_code`, `image`, `outfit_ideas`, `ritual`
- `WeddingEvent.carousel_slides`: CarouselSlide[]
- `WeddingEvent.text_color`: string

**Status**: ✅ Completed

---

### 3. **SQL Seed Script Created**
**File**: `migrations/seed_wedding_events_carousel.sql`

Contains complete data for all 5 events:
1. **Welcome Lunch & Haldi** (8 carousel slides, 4 images)
2. **Baraat, Varmala, & Jaggo** (10 carousel slides, 5 images)
3. **Anand Karaj** (6 carousel slides, 3 images)
4. **Pool Party** (6 carousel slides, 3 images)
5. **Sangeet & Reception** (7 carousel slides, 3 images)

**Total**: 37 carousel slides, 18 unique images

**Status**: ✅ Created, ready to run

---

### 4. **Image Strategy Decision**
**Decision**: Keep images in codebase (`public/images/carousel/`)

**Rationale**:
- Better performance (CDN, Next.js optimization)
- Images already exist and are optimized
- Simpler deployment
- Faster load times

**Images Location**:
- `/public/images/carousel/haldi/` (4 images)
- `/public/images/carousel/jaggo/` (5 images)
- `/public/images/carousel/anand_karaj/` (3 images)
- `/public/images/carousel/pool_party/` (3 images)
- `/public/images/carousel/reception/` (3 images)
- `/public/images/backgrounds/Gradient*.png` (5 gradients)

**Status**: ✅ Images already in codebase

---

## 🚧 Next Steps (To Do)

### Step 1: Run the SQL Seed Script

**In Supabase SQL Editor**, run:

```bash
migrations/seed_wedding_events_carousel.sql
```

This will:
- Find the `sim-kv` wedding
- Delete any existing events (safe to re-run)
- Insert all 5 events with complete carousel data
- Show verification query

**Expected Output**:
```
Successfully seeded 5 wedding events with carousel data for sim-kv wedding
```

---

### Step 2: Update Event List Page

**File**: `app/(guest)/[weddingSlug]/events/page.tsx` (lines 16-62)

**Current**: Hardcoded events array

**Change to**: Fetch from database

```typescript
'use client';

import { useEffect, useState } from 'react';
import { weddingService } from '@/lib/supabase/wedding-service';

export default function GuestEventsPage() {
  const params = useParams();
  const weddingSlug = params.weddingSlug as string;
  const [weddingEvents, setWeddingEvents] = useState<WeddingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Get wedding ID from slug
        const wedding = await weddingService.getWeddingBySlug(weddingSlug);
        if (wedding) {
          const events = await weddingService.getWeddingEvents(wedding.id);
          setWeddingEvents(events.sort((a, b) => a.order_index - b.order_index));
        }
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [weddingSlug]);

  if (loading) {
    return <LoadingSpinner />; // Or skeleton UI
  }

  // Rest of component stays the same, just uses `weddingEvents` state
  // ...
}
```

---

### Step 3: Create Dynamic Event Detail Page

**File**: `app/(guest)/[weddingSlug]/events/[slug]/page.tsx`

This is the **most complex change**. You need to create a carousel-based event detail page similar to the main branch but pulling from database.

**Key Components Needed**:

1. **Fetch event data**:
```typescript
const event = await weddingService.getEventBySlug(weddingId, eventSlug);
```

2. **Carousel State**:
```typescript
const [currentSlide, setCurrentSlide] = useState(0);
const slides = event.carousel_slides;
```

3. **Render slides based on type**:
```typescript
{slides.map((slide, index) => {
  if (slide.type === 'image') {
    return <ImageSlide src={slide.src} />;
  } else if (slide.type === 'dress_code') {
    return <DressCodeSlide {...slide} textColor={event.text_color} />;
  } else if (slide.type === 'outfit_ideas') {
    return <OutfitIdeasSlide {...slide} textColor={event.text_color} />;
  } else if (slide.type === 'ritual') {
    return <RitualSlide {...slide} textColor={event.text_color} />;
  }
})}
```

4. **Navigation**:
- Left/right arrows or swipe gestures
- Diamond indicators showing current slide
- Disable body scrolling (fullscreen carousel)

5. **Background**:
```typescript
<Card sx={{
  backgroundImage: index % 2 === 0
    ? `url(/images/backgrounds/${event.gradient_background})`
    : 'none',
  backgroundColor: index % 2 === 0 ? 'transparent' : '#FFFFFF',
}}>
```

**Reference**: Look at main branch `app/(guest)/events/[slug]/page.tsx` (lines 1-1997) for the complete implementation pattern.

---

### Step 4: Testing Checklist

After implementation, test the following:

- [ ] Events list page loads 5 events from database
- [ ] Each event card shows correct gradient stripe
- [ ] Clicking an event opens carousel detail page
- [ ] Carousel slides are in correct order
- [ ] Image slides display correctly
- [ ] Text slides have correct color (white for Baraat/Reception, black for others)
- [ ] Outfit ideas show separate women/men sections
- [ ] Left/right navigation works
- [ ] Diamond indicators show current position
- [ ] Swipe gestures work on mobile
- [ ] Back button returns to events list
- [ ] Gradient backgrounds display correctly
- [ ] Responsive design works on mobile, tablet, desktop

---

## 📊 Data Structure Reference

### CarouselSlide Types

#### 1. **Dress Code Slide**
```json
{
  "type": "dress_code",
  "title": "Dress code",
  "subtitle": "Dress code",
  "heading": "Shades of yellow",
  "description": "Sunlit hues of yellow → light linens, cotton kurtas..."
}
```

#### 2. **Image Slide**
```json
{
  "type": "image",
  "src": "/images/carousel/haldi/1.png"
}
```

#### 3. **Outfit Ideas Slide**
```json
{
  "type": "outfit_ideas",
  "title": "Outfit Ideas",
  "women": ["Kaftans", "Salwar Kameez", "Sundresses"],
  "men": ["Linen Shirts", "Cotton Kurtas"]
}
```

#### 4. **Ritual Slide**
```json
{
  "type": "ritual",
  "title": "What It Is",
  "subtitle": "The Ritual",
  "heading": "Haldi",
  "description": "A joyful ceremony where family and friends..."
}
```

---

## 🎨 Text Color Reference

Events use two text color schemes:

**Dark Text (`#141414`)**:
- Welcome Lunch & Haldi
- Anand Karaj
- Pool Party

**White Text (`#FFFFFF`)**:
- Baraat, Varmala, & Jaggo
- Sangeet & Reception

This is stored in `event.text_color` and should be applied to all Typography components in text slides.

---

## 🔍 Gradient Background Reference

Each event has a specific gradient:

| Event | Gradient File |
|-------|--------------|
| Haldi | `GradientYellow.png` |
| Baraat/Jaggo | `GradientJaggo.png` |
| Anand Karaj | `GradientCottonCandy.png` |
| Pool Party | `GradientPoolParty.png` |
| Reception | `GradientReception.png` |

**Usage Pattern**:
- Odd-numbered slides (0, 2, 4, 6, 8, 10) use gradient background
- Even-numbered slides use white background or image

---

## 📁 Files Modified/Created

### Created:
1. ✅ `migrations/seed_wedding_events_carousel.sql` - SQL seed script
2. ✅ `EVENTS_MIGRATION_SUMMARY.md` - This document

### Modified:
1. ✅ `lib/supabase/wedding-service.ts` - Added CarouselSlide interface and updated WeddingEvent type

### To Modify:
1. ⏳ `app/(guest)/[weddingSlug]/events/page.tsx` - Make events list dynamic
2. ⏳ `app/(guest)/[weddingSlug]/events/[slug]/page.tsx` - Create carousel detail page

---

## 🚀 Quick Start Guide

```bash
# 1. Run the SQL seed script in Supabase SQL Editor
# Copy contents of migrations/seed_wedding_events_carousel.sql

# 2. Test in development
npm run dev

# 3. Navigate to: http://localhost:3000/sim-kv/events

# 4. Verify all 5 events load from database

# 5. Click an event to test carousel (after implementing Step 3)
```

---

## 🐛 Common Issues & Solutions

### Issue: Events not loading
**Solution**: Check that sim-kv wedding exists in database and has correct UUID

### Issue: TypeScript errors on carousel_slides
**Solution**: Restart TypeScript server or VS Code

### Issue: Images not displaying
**Solution**: Verify image paths in `public/images/carousel/` match database paths exactly

### Issue: Text color not applied
**Solution**: Ensure event.text_color is passed to all Typography components with `sx={{ color: event.text_color }}`

### Issue: Carousel slides out of order
**Solution**: Verify carousel_slides array order in database matches expected sequence

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify database seed script ran successfully
3. Check Supabase logs for query errors
4. Compare with main branch implementation for reference

---

**Status**: 8/9 tasks complete. Ready for Step 1 (run SQL seed) and Step 2-3 (frontend implementation).
