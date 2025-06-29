# GIF Feature Setup Guide

## Overview
The RSVP form now supports GIF attachments in the "Share your excitement" section. Users can search GIPHY for GIFs and attach them to their special messages, which will then be displayed in the comments section on the homepage.

## Database Migration Required

**⚠️ IMPORTANT: You must run the database migration before this feature will work properly.**

### Step 1: Run the Migration
Execute the SQL migration file to add GIF support to the comments table:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f migrations/add_gif_support_to_comments.sql
```

**Or manually run these SQL commands in your Supabase SQL Editor:**

```sql
-- Add GIF-related columns to comments table
ALTER TABLE comments ADD COLUMN gif_id TEXT;
ALTER TABLE comments ADD COLUMN gif_url TEXT;
ALTER TABLE comments ADD COLUMN gif_title TEXT;
ALTER TABLE comments ADD COLUMN gif_preview_url TEXT;

-- Add constraint to ensure GIF data consistency
ALTER TABLE comments ADD CONSTRAINT comments_gif_consistency_check 
CHECK (
  (gif_id IS NULL AND gif_url IS NULL AND gif_title IS NULL AND gif_preview_url IS NULL) OR
  (gif_id IS NOT NULL AND gif_url IS NOT NULL)
);

-- Allow message to be optional when GIF is present
ALTER TABLE comments ALTER COLUMN message DROP NOT NULL;

-- Ensure either message or gif is present
ALTER TABLE comments ADD CONSTRAINT comments_content_check 
CHECK (
  (message IS NOT NULL AND message != '') OR 
  (gif_id IS NOT NULL AND gif_url IS NOT NULL)
);

-- Add index for performance
CREATE INDEX idx_comments_gif_id ON comments(gif_id) WHERE gif_id IS NOT NULL;
```

### Step 2: Verify Migration
After running the migration, verify the new columns exist:

```sql
\d comments
```

You should see the new columns:
- `gif_id` (text)
- `gif_url` (text) 
- `gif_title` (text)
- `gif_preview_url` (text)

## Features Implemented

### 1. RSVP Form GIF Picker
- **Location**: "Share your excitement" section (step 6 of RSVP form)
- **Button**: GIF icon button in bottom right of text area
- **Styling**: 16px border radius, black border, matching form theme

### 2. GIF Picker Modal
- **Design**: White modal with 16px border radius matching RSVP form
- **Search**: GIPHY API integration with Indian wedding-focused defaults
- **Default GIFs**: Shows Indian wedding/celebration GIFs on open
- **Quick Tags**: "bollywood dance", "celebration", "love", "indian wedding", "excited", "happy"
- **Preview**: Square grid layout with hover effects

### 3. Comments Display
- **Homepage Integration**: GIFs display in comments section below text messages
- **Styling**: 16px border radius, max-width 280px, responsive design
- **Fallback**: Uses preview URL for performance, falls back to full URL
- **Accessibility**: Proper alt text using GIF title

## Data Flow

### 1. Form Submission
When a user submits an RSVP with a GIF:
```typescript
// Form data includes selectedGif
const formData = {
  specialMessage: "Can't wait to celebrate!",
  selectedGif: {
    id: "gif123",
    url: "https://media.giphy.com/...",
    title: "Excited Dance",
    preview_url: "https://media.giphy.com/preview/..."
  }
}
```

### 2. Database Storage
The GIF data is stored in the comments table:
```sql
INSERT INTO comments (
  guest_id, wedding_id, message,
  gif_id, gif_url, gif_title, gif_preview_url
) VALUES (
  'guest123', 'sim-kv', 'Can\'t wait to celebrate!',
  'gif123', 'https://media.giphy.com/...', 'Excited Dance', 'https://media.giphy.com/preview/...'
);
```

### 3. Display
Comments are retrieved and displayed with both text and GIF:
```typescript
// Comment object includes GIF data
const comment = {
  message: "Can't wait to celebrate!",
  gif_url: "https://media.giphy.com/...",
  gif_title: "Excited Dance",
  gif_preview_url: "https://media.giphy.com/preview/..."
}
```

## Configuration

### GIPHY API Key
Make sure your `.env.local` includes:
```
NEXT_PUBLIC_GIPHY_API_KEY=your-actual-giphy-api-key
```

### Environment Setup
The feature will gracefully degrade if:
- GIPHY API key is missing (shows empty state)
- Network issues (shows error message)
- Database migration not run (GIF data won't save)

## Testing

### 1. RSVP Form
1. Navigate to `/rsvp`
2. Fill out form to step 6 "Fun & Messages"
3. Click GIF button in "Share your excitement" section
4. Search for GIFs or use quick tags
5. Select a GIF and verify it appears below text area
6. Submit form

### 2. Comments Display
1. Navigate to homepage
2. Check comments section
3. Verify GIFs display properly with rounded corners
4. Test responsive behavior on mobile

### 3. Database Verification
```sql
-- Check if GIF data is being saved
SELECT message, gif_id, gif_title FROM comments WHERE gif_id IS NOT NULL;
```

## Troubleshooting

### Common Issues

1. **GIF picker shows no GIFs**
   - Check GIPHY API key in `.env.local`
   - Verify API key is valid at developers.giphy.com
   - Check browser console for API errors

2. **GIFs not saving to database**
   - Ensure database migration was run
   - Check browser console for database errors
   - Verify Supabase connection

3. **GIFs not displaying in comments**
   - Check if `gif_url` column has data
   - Verify migration added all required columns
   - Check browser console for image loading errors

### Debug SQL Queries
```sql
-- Check migration status
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'comments' AND column_name LIKE 'gif_%';

-- Check GIF data
SELECT id, message, gif_id, gif_title, created_at 
FROM comments 
WHERE gif_id IS NOT NULL 
ORDER BY created_at DESC;
```

## Theme Consistency

All GIF-related UI elements use:
- **Border Radius**: 16px (consistent with form theme)
- **Colors**: Pink buttons (#DE3F5E), black borders
- **Font**: Outfit family
- **Spacing**: Consistent with existing components

The feature seamlessly integrates with the existing design system and cultural theme of the Indian wedding platform. 