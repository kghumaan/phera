# Supabase Connection & Rate Limiting Debug Guide

## Issue: Pages stuck at "Loading..."

### Step 1: Check Browser Console (MOST IMPORTANT)

1. Open your app in browser
2. Open Developer Tools (F12 or Cmd+Option+I on Mac)
3. Go to **Console** tab
4. Navigate to the stuck page
5. Look for red error messages

**Common errors to look for:**
- `Failed to fetch` - Network/connection issue
- `JWT expired` - Session expired, need to re-login
- `Row Level Security policy violation` - RLS blocking access
- `429 Too Many Requests` - Rate limiting (rare with Supabase free tier)

### Step 2: Check Network Tab

1. Open Developer Tools
2. Go to **Network** tab
3. Filter by "Fetch/XHR"
4. Reload the stuck page
5. Look for requests to Supabase:
   - Status 200 = Success
   - Status 401 = Unauthorized (auth issue)
   - Status 403 = Forbidden (RLS issue)
   - Status 429 = Rate limited
   - Status 500+ = Server error

### Step 3: Test Direct Supabase Connection

Open browser console and run:

```javascript
// Get the Supabase client
const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
const supabase = createClientComponentClient();

// 1. Check auth session
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
console.log('Session:', sessionData, sessionError);

// 2. Test wedding query
const { data: weddingData, error: weddingError } = await supabase
  .from('weddings')
  .select('*')
  .limit(1);
console.log('Wedding Query:', weddingData, weddingError);
```

### Step 4: Check Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Database** → **Tables** → Check if `weddings` table exists
4. Click **Authentication** → **Users** → Verify your user exists
5. Click **Logs** → **Postgres Logs** → Look for recent errors
6. Click **Database** → **Replication** → Check connection pooler status

### Step 5: Check RLS Policies

Stuck at "Loading..." is often caused by **Row Level Security (RLS)** blocking reads:

```sql
-- Run this in Supabase SQL Editor to check policies:
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'weddings';
```

**If no policies show up**, you need to create them. See `migrations/fix_rls_policies.sql`

### Step 6: Quick Fix - Temporarily Disable RLS (TESTING ONLY)

**⚠️ Only for local testing, NOT production:**

```sql
-- In Supabase SQL Editor
ALTER TABLE weddings DISABLE ROW LEVEL SECURITY;
```

Reload your page. If it works now, RLS policies are the issue.

**Don't forget to re-enable:**
```sql
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
```

## Common Issues & Solutions

### Issue: "JWT expired" or "Invalid JWT"
**Solution**: Clear browser storage and re-login
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
// Then reload and login again
```

### Issue: No errors but still stuck
**Solution**: The query might be hanging. Check for:
- Circular dependencies in foreign keys
- Missing indexes causing slow queries
- Connection pool exhausted

### Issue: Rate Limiting (429)
**Supabase Free Tier Limits:**
- 500 MB database
- 50,000 monthly active users
- 2 GB bandwidth
- 1 GB file storage

**Check usage:**
1. Supabase Dashboard → Settings → Usage
2. If near limits, upgrade plan or wait for reset

### Issue: "relation 'weddings' does not exist"
**Solution**: Run migrations
```bash
# Check if tables exist in Supabase SQL Editor:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

If `weddings` table is missing, run:
```bash
# Apply migrations (in Supabase SQL Editor)
# Copy content from: migrations/create_multi_wedding_system.sql
```

## Supabase Service Role Key (Last Resort)

If auth is completely broken, you can test with service role key (NEVER commit this):

```typescript
// TEMPORARY TEST ONLY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role temporarily
);
```

## Enable Debug Logging

Add this to your page to see what's happening:

```typescript
const loadWeddingData = async () => {
  console.log('🔍 Starting loadWeddingData for:', weddingSlug);
  try {
    console.log('📡 Calling getWeddingBySlug...');
    const wedding = await weddingService.getWeddingBySlug(weddingSlug);
    console.log('✅ Wedding data received:', wedding);
    
    if (wedding) {
      setWeddingId(wedding.id);
      setFormData({...});
    } else {
      console.warn('⚠️ No wedding found for slug:', weddingSlug);
    }
  } catch (err) {
    console.error('❌ Error loading wedding:', err);
    setError('Failed to load wedding data: ' + (err as Error).message);
  } finally {
    console.log('✅ Setting loading to false');
    setLoading(false);
  }
};
```

## My Recommendation

Based on the symptoms, this is most likely **RLS policies blocking access**. Here's what to do:

1. **Open browser console** - Check for errors
2. **Check Supabase Dashboard Logs** - See what queries are failing
3. **Verify RLS policies exist** - Run the SQL query above
4. **Add debug logging** - See where it's getting stuck

Let me know what you find in the console and I can help you fix it! 🔧

