# Phera Wedding Platform - Deployment Guide

## 🎉 Congratulations!

You now have a fully functional multi-tenant wedding platform! This guide will help you deploy and test the system.

## ✅ Pre-Deployment Checklist

### Database Setup
- [x] Created `wedding-images` storage bucket in Supabase
- [x] Ran `create_multi_wedding_system.sql` migration
- [ ] Seed sim-kv wedding data (optional but recommended)

### Environment Variables

Ensure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (for server-side only)
```

### Supabase Storage Configuration

Bucket: `wedding-images`
- ✅ Public bucket: **ON**
- ✅ File size limit: **10-20 MB**
- ✅ Allowed MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`

## 📝 Seeding Sim-KV Data (Recommended)

### Option 1: Manual SQL (Fastest)

1. Get your user ID:
```sql
SELECT id, email FROM auth.users;
```

2. Open `/migrations/seed_sim_kv.sql`

3. Replace `YOUR_USER_ID_HERE` with your actual user ID

4. Run the modified SQL in Supabase SQL Editor

5. Follow the inline instructions to replace `WEDDING_ID_HERE` and `SCHEDULE_IDs`

### Option 2: Use the Admin UI (Easier but slower)

1. Sign up at `http://localhost:3000/auth/signup`
2. Enter "Simran & Karanvir" as couple name
3. Navigate through each admin section and add the data manually
4. Use the event templates for quick setup

## 🚀 Development Testing

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Test Authentication Flow

**Signup:**
1. Go to `http://localhost:3000`
2. Click "Start Planning Free"
3. Enter email, password, and couple names
4. Verify account is created and redirects to overview page

**Login:**
1. Go to `http://localhost:3000/auth/login`
2. Login with your credentials
3. Should redirect to `/admin`

### 3. Test Admin Dashboard

Navigate through all sections:
- ✅ Overview - Add couple info, dates, venue, images
- ✅ Events - Add/edit events using templates
- ✅ Schedule - Build multi-day schedule
- ✅ Travel - Create travel info cards
- ✅ FAQ - Add questions and answers
- ✅ Registry - Set up contribution funds
- ✅ Shopping - Add store recommendations
- ✅ Design - Change background and colors
- ✅ Settings - Generate PINs, publish website

### 4. Test Guest Experience

1. Go to your wedding URL: `http://localhost:3000/[your-wedding-slug]`
2. Navigate through all guest pages:
   - Main wedding page
   - Details/menu
   - Events list and details
   - Schedule
   - Travel info
   - FAQ
   - Registry
   - Shopping guide
   - RSVP form

### 5. Test Preview Mode

1. Go to `http://localhost:3000/preview/[your-wedding-slug]`
2. Verify preview banner shows
3. Check guest experience looks correct

### 6. Test Publishing Workflow

1. Set wedding status to **Draft** - only you can see it
2. Set to **Preview** - shareable preview link
3. Set to **Live** - publicly accessible with PINs

## 🐛 Common Issues & Fixes

### Images Not Uploading

**Issue:** Upload fails or images don't display
**Fix:**
- Check bucket name is exactly `wedding-images`
- Verify bucket is set to Public
- Check MIME types are configured
- Ensure image is under 10MB

### Auth Redirect Loop

**Issue:** Keeps redirecting to login
**Fix:**
- Check middleware.ts is properly configured
- Verify Supabase env variables are set
- Clear browser cookies and try again

### Wedding Not Found

**Issue:** 404 or "Wedding not found" error
**Fix:**
- Verify wedding exists in database: `SELECT * FROM weddings WHERE slug = 'your-slug';`
- Check wedding status (draft vs live)
- Ensure RLS policies are active

### Middleware Blocking Requests

**Issue:** All routes redirect to login
**Fix:**
- Check middleware config paths
- Ensure Supabase client is properly initialized
- Verify session is being set correctly

## 📊 Database Verification Queries

Run these in Supabase SQL Editor to verify your setup:

```sql
-- Check all weddings
SELECT slug, couple_name, status, created_at FROM weddings;

-- Check events count per wedding
SELECT w.slug, COUNT(e.id) as event_count 
FROM weddings w 
LEFT JOIN wedding_events e ON w.id = e.wedding_id 
GROUP BY w.slug;

-- Check complete sim-kv data
SELECT 
  (SELECT COUNT(*) FROM wedding_events WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv')) as events,
  (SELECT COUNT(*) FROM wedding_schedule WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv')) as schedule_days,
  (SELECT COUNT(*) FROM wedding_faqs WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv')) as faqs,
  (SELECT COUNT(*) FROM wedding_registry WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv')) as registry,
  (SELECT COUNT(*) FROM wedding_shops WHERE wedding_id = (SELECT id FROM weddings WHERE slug = 'sim-kv')) as shops;
```

Expected sim-kv counts:
- Events: 5
- Schedule days: 3
- FAQs: 6
- Registry: 3
- Shops: 4

## 🌐 Production Deployment

### Using Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Using Other Platforms

Set these build commands:
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node Version:** 18.x or higher

## 🔒 Security Checklist

Before going live:

- [ ] Enable RLS on all tables
- [ ] Set proper CORS settings in Supabase
- [ ] Configure auth providers (Google OAuth)
- [ ] Set up email templates in Supabase
- [ ] Enable rate limiting (if needed)
- [ ] Review and test all RLS policies
- [ ] Enable Supabase database backups

## 📱 Testing Checklist

- [ ] Test on mobile devices
- [ ] Test on different browsers (Chrome, Safari, Firefox)
- [ ] Test image uploads of various sizes
- [ ] Test with long text content
- [ ] Test PIN authentication
- [ ] Test RSVP form submission
- [ ] Test all external links
- [ ] Test WhatsApp integration
- [ ] Test payment forms (if Stripe configured)

## 🎯 Post-Launch Tasks

1. **Monitor Performance:**
   - Watch Supabase dashboard for API usage
   - Check for any 500 errors
   - Monitor image storage usage

2. **User Feedback:**
   - Test with real users
   - Gather feedback on UX
   - Identify pain points

3. **Optimization:**
   - Add analytics (Google Analytics, Plausible, etc.)
   - Optimize images further if needed
   - Add caching if performance issues

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Material-UI Docs:** https://mui.com/

## 🎊 You're Ready to Go Live!

Once all tests pass and data is seeded, you're ready to:
1. Set sim-kv wedding to "live" status
2. Share the link: `your-domain.com/sim-kv`
3. Create new weddings through the admin interface
4. Start accepting RSVPs!

Happy wedding planning! 💕

