# Email Validation Error - Troubleshooting Guide

## Issue
When attempting to sign up with email `kv.s.ghumaan2@gmail.com`, Supabase Auth returns the error: **"Email address 'kv.s.ghumaan2@gmail.com' is invalid"**

## Root Cause Analysis

This error typically comes from **Supabase Auth configuration**, not from frontend validation. The email format itself is valid, so the issue is likely one of the following:

## Solution Steps

### 1. Check Supabase Email Provider Configuration

**Navigate to:** Supabase Dashboard → Authentication → Email

#### Issue: Email Provider Not Configured
If you haven't set up an email provider, Supabase may block signups.

**Fix:**
- **Option A (Development):** Use Supabase's built-in email provider
  - Go to **Authentication → Email Templates**
  - Ensure "Enable Email Confirmations" is toggled appropriately
  - For development, you can disable email confirmations temporarily

- **Option B (Production):** Configure a custom SMTP provider
  ```
  Settings → Authentication → Email → SMTP Settings
  - Enable Custom SMTP
  - Add your SMTP credentials (SendGrid, Mailgun, etc.)
  ```

### 2. Check Email Confirmation Settings

**Navigate to:** Supabase Dashboard → Authentication → Email

#### Issue: Email Confirmation Required
If email confirmation is enabled, users must verify their email before the account is fully created.

**Current Status Check:**
- Look for "Enable Email Confirmations" toggle
- If enabled, users need to click the link in their email

**Fixes:**
- **For Development:** Temporarily disable email confirmations
  ```
  Authentication → Email → Disable "Confirm email"
  ```
  
- **For Production:** Keep enabled, but:
  1. Check your email templates are configured correctly
  2. Verify SMTP settings are working
  3. Check spam folder for confirmation emails
  4. Add better user feedback in the UI (see below)

### 3. Check Email Domain Restrictions

**Navigate to:** Supabase Dashboard → Authentication → Settings

#### Issue: Domain Restrictions Enabled
Some projects have domain allowlists/blocklists.

**Fix:**
- Scroll to "Email Domain Restrictions"
- Ensure `gmail.com` is not blocked
- If using allowlist, add `gmail.com` to allowed domains

### 4. Check Rate Limiting

**Navigate to:** Supabase Dashboard → Authentication → Rate Limits

#### Issue: Too Many Requests
Supabase has rate limits on signup attempts.

**Fix:**
- Wait a few minutes before trying again
- Check if you've exceeded signup limits
- Increase rate limits if needed (paid plans)

### 5. Verify Authentication Providers

**Navigate to:** Supabase Dashboard → Authentication → Providers

#### Issue: Email Provider Disabled
The Email provider might be disabled entirely.

**Fix:**
- Find "Email" in the providers list
- Ensure it's **Enabled**
- Verify any required configuration is complete

## Code Improvements (Already Implemented)

### Better Error Handling
The signup page now shows clear error messages. To further improve, you could add:

```typescript
// In signup page, enhance error handling
if (authError) {
  let errorMessage = authError.message;
  
  // Provide helpful hints for common errors
  if (errorMessage.includes('invalid')) {
    errorMessage += '\n\nThis may be due to email provider configuration. Please check your Supabase Auth settings or try signing up with Google instead.';
  }
  
  setError(errorMessage);
  setLoading(false);
  return;
}
```

### Frontend Email Validation
Add immediate feedback for email format:

```typescript
const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// In the email TextField
onChange={(e) => {
  const newEmail = e.target.value;
  setEmail(newEmail);
  if (newEmail && !validateEmail(newEmail)) {
    // Show inline error
  }
}}
```

## Recommended Configuration for Development

For smooth development experience:

1. **Go to Supabase Dashboard:**
   - Authentication → Email
   - **Disable** "Confirm email" (development only)
   - **Enable** "Enable Email Signups"
   
2. **Set Site URL:**
   - Authentication → URL Configuration
   - Site URL: `http://localhost:3000`
   - Redirect URLs: Add `http://localhost:3000/**`

3. **Check Email Templates:**
   - Authentication → Email Templates
   - Ensure templates are configured (even if confirmation is disabled)

## Recommended Configuration for Production

1. **Enable Email Confirmation:**
   - Authentication → Email
   - **Enable** "Confirm email"
   
2. **Set Up Custom SMTP:**
   - Authentication → Email → SMTP Settings
   - Configure with SendGrid, Mailgun, or similar
   
3. **Configure Email Templates:**
   - Customize confirmation email template
   - Add your branding and clear CTAs
   
4. **Set Redirect URLs:**
   - Authentication → URL Configuration
   - Add production domain: `https://www.phera.io/**`

## Immediate Workaround

If you need to test immediately while fixing the email configuration:

### Use Google Sign-In Instead
The "Continue with Google" button bypasses email/password signup:
- Click "Continue with Google"
- Select your Google account
- This will create your account and wedding instance

### Manual Account Creation (Admin)
As a temporary measure, you can create accounts directly in Supabase:
1. Go to Authentication → Users
2. Click "Add User"
3. Enter email and temporary password
4. User can then log in directly

## Testing the Fix

After making configuration changes:

1. Clear browser cache and cookies
2. Try signing up again
3. Check browser console for any errors
4. Check Supabase Dashboard → Authentication → Logs for detailed error info

## Common Error Messages & Solutions

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| "Email address is invalid" | Email provider not configured | Set up SMTP or disable confirmations |
| "Email not confirmed" | Confirmation required but not clicked | Click link in email or disable confirmations |
| "User already registered" | Account exists | Use "Sign in" instead or reset password |
| "Too many requests" | Rate limiting | Wait 5-10 minutes before trying again |

## Getting More Information

To see the exact error from Supabase:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try signing up again
4. Look for failed requests to Supabase
5. Check the response body for detailed error

**Or check Supabase Dashboard:**
- Authentication → Logs
- Look for recent failed signup attempts
- Detailed error messages will be shown

## Need Help?

If none of these solutions work:
1. Check Supabase status page: https://status.supabase.com
2. Review Supabase Auth logs in dashboard
3. Contact Supabase support with the specific error message
4. Consider using Google OAuth as primary auth method (already implemented)

