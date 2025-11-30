# Multi-Environment OAuth Setup (Localhost + Production)

## 🎯 Goal
Support OAuth in both localhost and production **without** manually changing Supabase settings.

---

## ✅ The Solution: Supabase Redirect URLs Allowlist

Your code already uses `window.location.origin` (perfect!), but Supabase needs to **allow both localhost and production** in its redirect URL allowlist.

### **In Supabase Dashboard:**

1. Go to: **Authentication → URL Configuration**

2. **Site URL**: Keep this as your **primary production URL**
   ```
   https://www.phera.io/
   ```

3. **Redirect URLs** (scroll down): Add BOTH environments
   ```
   http://localhost:3000/**
   https://www.phera.io/**
   ```

   The `**` wildcard allows all paths under each domain.

4. Click **Save**

---

## 📋 Complete Configuration

### Supabase Settings:

**Site URL:**
```
https://www.phera.io/
```

**Redirect URLs (Allowlist):**
```
http://localhost:3000/**
https://www.phera.io/**
```

**Important**: The redirect allowlist tells Supabase which URLs are safe to redirect to after OAuth. By including both, you support both environments!

---

## 🔍 How It Works

### Your Code (Already Perfect):
```typescript
// login/signup pages
const callbackUrl = new URL('/auth/callback', window.location.origin);
//                                            ^^^^^^^^^^^^^^^^^^^^^^
//                                            Automatically:
//                                            - localhost:3000 in dev
//                                            - www.phera.io in prod
```

### Supabase Flow:
1. User clicks "Sign in with Google"
2. Your app sends: `redirectTo: http://localhost:3000/auth/callback?redirect=/admin`
3. Supabase checks: "Is `http://localhost:3000/**` in my allowlist?"
4. ✅ Yes! Redirects to localhost
5. Your callback handler processes and routes to `/admin`

### Production Flow:
1. User clicks "Sign in with Google"  
2. Your app sends: `redirectTo: https://www.phera.io/auth/callback?redirect=/admin`
3. Supabase checks: "Is `https://www.phera.io/**` in my allowlist?"
4. ✅ Yes! Redirects to production
5. Your callback handler processes and routes to `/admin`

---

## 🧪 Test Both Environments

### Test Localhost:
1. Go to `http://localhost:3000/auth/signup`
2. Click "Continue with Google"
3. **Should redirect to**: `http://localhost:3000/admin` ✅

### Test Production (when deployed):
1. Go to `https://www.phera.io/auth/signup`
2. Click "Continue with Google"
3. **Should redirect to**: `https://www.phera.io/admin` ✅

---

## 🔧 Google Cloud Console Setup

You also need to add both to Google's authorized redirect URIs:

### In Google Cloud Console:

1. Go to: **Credentials → OAuth 2.0 Client IDs → Your Client**

2. **Authorized redirect URIs**: Add BOTH
   ```
   http://localhost:54321/auth/v1/callback
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```

   These are **Supabase's** callback URLs (not your app's). Supabase handles the OAuth flow, then redirects to your app.

3. Click **Save**

---

## 📝 Environment Variables (Optional)

You can keep `NEXT_PUBLIC_SITE_URL` in your `.env.local` for other purposes:

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# .env.production (or Vercel env vars)
NEXT_PUBLIC_SITE_URL=https://www.phera.io
```

But for OAuth, `window.location.origin` is better because it's automatically correct!

---

## ❌ Common Mistakes

### ❌ Don't do this:
```typescript
// Hardcoded URLs - requires changing for each environment
redirectTo: 'http://localhost:3000/auth/callback'
redirectTo: 'https://www.phera.io/auth/callback'
```

### ✅ Do this instead:
```typescript
// Dynamic - works in all environments
redirectTo: `${window.location.origin}/auth/callback`
```

---

## 🐛 Troubleshooting

### Still redirecting to wrong environment?

**Check 1**: Supabase Redirect URLs allowlist
- Go to Authentication → URL Configuration
- Verify BOTH URLs are listed
- Make sure you clicked "Save"

**Check 2**: Browser cache
- Clear cookies and localStorage
- Try incognito mode

**Check 3**: Google Console
- Verify both Supabase callback URLs are authorized
- Both localhost and production Supabase URLs

### "Redirect URL not allowed" error?

This means the URL is not in Supabase's allowlist. Add it:
```
http://localhost:3000/**
```

---

## ✅ Summary

### What You Already Have (Good!):
✅ Code uses `window.location.origin` (environment-aware)
✅ `.env.local` has `NEXT_PUBLIC_SITE_URL` set

### What You Need to Do:
1. ⚠️ Add `http://localhost:3000/**` to Supabase Redirect URLs allowlist
2. ✅ Keep `https://www.phera.io/` as Site URL
3. ✅ Both environments will work automatically!

---

**No more manual changes needed!** 🎉

Your code will automatically use the correct URL based on where it's running, and Supabase will allow both.

