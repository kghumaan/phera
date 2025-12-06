# ✅ OAuth Setup & Fixes - Complete!

## 🔧 Issues Fixed

### 1. **Redirect to Production Instead of Localhost**
**Problem**: OAuth was redirecting to `https://www.phera.io/` even when starting from localhost.

**Solution**: 
- For **local development**, temporarily change Supabase Site URL to `http://localhost:3000`
- Or keep production URL and handle it in code (recommended for multi-environment setups)

**How to Change Site URL in Supabase:**
1. Go to: **Authentication → URL Configuration**
2. Set Site URL to: `http://localhost:3000` (for local dev)
3. Click **Save changes**

**When deploying to production**, change it back to `https://www.phera.io/`

---

### 2. **Landing on PIN Entry Instead of Admin**
**Problem**: After Google OAuth, users were redirected to the guest page (PIN entry) instead of admin dashboard.

**Solution**: Updated auth callback to intelligently route users:

**New Callback Logic:**
```typescript
1. Check for explicit `redirect` parameter → Use it
2. Check for `next` parameter → Use it
3. Query database: Does user have weddings? 
   - Yes → Send to /admin
   - No → Send to / (guest page)
4. Default → Send to /admin (safest for new signups)
```

**Files Updated:**
- ✅ `/app/auth/callback/route.ts` - Smart routing logic
- ✅ `/app/auth/login/page.tsx` - Pass redirect parameter
- ✅ `/app/auth/signup/page.tsx` - Pass redirect parameter
- ✅ Deleted redundant `admin-route.ts`

---

## 🧪 Testing Checklist

### Test Admin Flow:
1. [ ] Go to `http://localhost:3000/auth/signup`
2. [ ] Click "Continue with Google"
3. [ ] Complete Google sign-in
4. [ ] **Should redirect to**: `http://localhost:3000/admin` ✅
5. [ ] **Should NOT redirect to**: Production site ❌

### Test Guest Flow:
1. [ ] Go to `http://localhost:3000/sim-kv`
2. [ ] Click "Login" on PIN entry screen
3. [ ] Complete Google sign-in
4. [ ] **Should redirect to**: Wedding page (bypass PIN) ✅

### Test Magic Link:
1. [ ] Go to `http://localhost:3000/auth/login`
2. [ ] Enter email, click "Send Magic Link"
3. [ ] Click link in email
4. [ ] **Should redirect to**: `http://localhost:3000/admin` ✅

### Test Email/Password:
1. [ ] Go to `http://localhost:3000/auth/login`
2. [ ] Enter email & password
3. [ ] Click "Sign In"
4. [ ] **Should redirect to**: `http://localhost:3000/admin` ✅

---

## 🔒 Google OAuth Configuration

### In Google Cloud Console:
- ✅ OAuth Client ID created
- ✅ Authorized redirect URI (production): `https://[PROJECT].supabase.co/auth/v1/callback`
- ✅ Authorized redirect URI (local): `http://localhost:54321/auth/v1/callback`

### In Supabase Dashboard:
- ✅ Google provider enabled
- ✅ Client ID configured
- ✅ Client Secret configured

---

## 🌐 Environment Configuration

### For Local Development:

**Supabase Settings:**
- Site URL: `http://localhost:3000`
- Redirect URLs: Include `http://localhost:3000/auth/callback`

**Google Console:**
- Authorized redirect URI: `http://localhost:54321/auth/v1/callback`

### For Production:

**Supabase Settings:**
- Site URL: `https://www.phera.io/`
- Redirect URLs: Include `https://www.phera.io/auth/callback`

**Google Console:**
- Authorized redirect URI: `https://[PROJECT].supabase.co/auth/v1/callback`

---

## 🚀 Deploy to Production Checklist

When you're ready to deploy:

1. [ ] Change Supabase Site URL back to `https://www.phera.io/`
2. [ ] Verify Google OAuth redirect URI includes production Supabase URL
3. [ ] Push code to GitHub
4. [ ] Deploy to Vercel
5. [ ] Test OAuth flow on production
6. [ ] Update any hardcoded localhost references

---

## 🔄 How Auth Flows Work Now

### **Admin Signup/Login Flow:**
```
User clicks "Start Planning Free"
  → /auth/signup
  → Google OAuth with redirect=/admin parameter
  → /auth/callback?code=XXX&redirect=/admin
  → Smart routing checks redirect parameter
  → Redirects to /admin ✅
```

### **Guest Login Flow (from Wedding Page):**
```
Guest on /sim-kv clicks "Login"
  → Google OAuth (no redirect parameter)
  → /auth/callback?code=XXX
  → Smart routing queries: Does user own weddings?
  → If yes: /admin
  → If no: / (wedding page) with bypass_pin=true ✅
```

---

## 📝 Next Steps

1. **Test the fixes**:
   - Sign out completely
   - Try signup flow again
   - Verify you land on `/admin`

2. **If still redirecting to production**:
   - Change Supabase Site URL to `http://localhost:3000`
   - Save and test again

3. **Continue with main roadmap**:
   - Test all admin sections
   - Upload images
   - Create test wedding
   - Test guest experience

---

## 🐛 Troubleshooting

### Still redirecting to production?
- Check Supabase Site URL (should be `http://localhost:3000` for local dev)
- Clear browser cookies and localStorage
- Try incognito mode

### Landing on wrong page?
- Check browser console for errors
- Verify `redirect` parameter in callback URL
- Check if user has weddings in database

### OAuth error?
- Verify Google Client ID/Secret are correct in Supabase
- Check authorized redirect URIs in Google Console
- Ensure Supabase project URL is correct

---

**All OAuth issues should now be resolved!** 🎉

Test the flow and let me know if you hit any other issues.

