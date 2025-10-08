# Phera - Wedding Platform Desktop Responsive Support

## Project Overview
Phera is a Next.js 15 wedding platform built with:
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **UI:** MUI Material v7 + Tailwind CSS v4
- **Styling:** Mobile-first, currently optimized for mobile only
- **State:** React Context (AuthContext)
- **Animations:** Framer Motion
- **Backend:** Supabase (auth, database)

## Desktop Responsive Strategy

### Core Principle: **Progressive Enhancement**
Mobile-first design remains unchanged. Desktop gets enhanced layouts without breaking mobile.

### Breakpoints (from MUI theme)
- **xs:** 0px (mobile)
- **sm:** 600px (large mobile/small tablet)
- **md:** 900px (tablet/small desktop) - **Primary desktop breakpoint**
- **lg:** 1200px (desktop)
- **xl:** 1536px (large desktop)

### Implementation Approach

#### 1. **Container Sizing Pattern**
```tsx
// Before (mobile-only):
<Container maxWidth="sm">

// After (responsive):
<Container maxWidth={{ xs: 'sm', md: 'md', lg: 'lg' }}>
```

#### 2. **Carousel/Swiper Pattern**
- **Mobile:** Single slide visible, swipe enabled
- **Desktop (md+):** Multiple slides visible (3-5), centered active slide, swipe still works
- Use `slidesPerView` responsive config in Swiper components

#### 3. **Image Sizing**
```tsx
// Update Next Image sizes attribute:
sizes="(max-width: 768px) 320px, (max-width: 1200px) 500px, 600px"
```

#### 4. **Spacing & Padding**
```tsx
sx={{
  px: { xs: 2, md: 4, lg: 6 },
  py: { xs: 3, md: 5, lg: 7 }
}}
```

## Page-by-Page Plan

### Phase 1: Foundation
1. ✅ Create CLAUDE.md
2. Update viewport metadata (allow scaling)
3. Remove DesktopAlert warning component

### Phase 2: Core Pages (Priority Order)
1. **Home page** (`app/(guest)/page.tsx`)
   - Update Container maxWidth to be responsive
   - Adjust couple photo size for desktop
   - Better spacing for desktop

2. **Details page** (`app/(guest)/details/page.tsx`)
   - Center menu better on desktop
   - Adjust spacing

3. **Travel page** - Multi-slide carousel on desktop
4. **Events page** - Multi-slide carousel on desktop
5. **FAQ page** - Responsive layout
6. **Schedule page** - Multi-slide carousel on desktop
7. **Registry page** - Responsive layout
8. **RSVP page** - Better form centering

### Phase 3: Components
- AppHeader - desktop sizing
- FullScreenFormContainer - may need desktop modal behavior

## Files to Modify

### Critical Files
- `app/layout.tsx` - viewport metadata
- `components/ui/DesktopAlert.tsx` - remove or change message
- `app/(guest)/page.tsx` - home page
- `app/(guest)/details/page.tsx` - details menu
- All carousel-based pages under `app/(guest)/`

### Theme Files (already responsive)
- `lib/theme/m3-theme.ts` - ✅ Already has responsive typography
- `tailwind.config.js` - ✅ Standard breakpoints configured

## Testing Strategy
- Use browser DevTools responsive mode
- Test at key breakpoints: 375px (mobile), 768px (tablet), 1024px (small desktop), 1440px (desktop)
- Ensure mobile appearance unchanged
- Check that images load appropriately for viewport

## Key Constraints
- **DO NOT** change mobile appearance
- **DO NOT** add complex desktop-only features
- **KEEP** existing mobile interactions (swipe, touch, etc.)
- **MINIMIZE** code changes - prefer sx prop breakpoints over new components

## Notes
- Typography already scales via `responsiveFontSizes` in theme
- Most components use MUI sx prop - easy to add breakpoint-specific styles
- Carousel pages likely use Swiper or similar - check for `slidesPerView` config
