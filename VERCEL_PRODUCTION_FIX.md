# 🔧 Fix Production Login Issues

## Problem
Login works locally but fails on Vercel production with "Login failed" or "Invalid credentials" error.

## Root Cause
**Environment variables are not configured in Vercel.** The production deployment needs the same credentials that work locally.

---

## ✅ Solution: Configure Vercel Environment Variables

### Step 1: Check Current Configuration

Visit your health check endpoint to see what's missing:
```
https://rosebank-dialer.vercel.app/api/health
```

This will show which environment variables are configured/missing.

### Step 2: Add Environment Variables to Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: **rosebank-dialer**
3. Go to **Settings** → **Environment Variables**
4. Add the following variables (get values from your local `.env.local` file):

#### Required Variables:

| Variable Name | Where to Get Value | Priority |
|--------------|-------------------|----------|
| `JWT_SECRET` | From local `.env.local` | 🔴 CRITICAL |
| `NEXT_PUBLIC_SUPABASE_URL` | From local `.env.local` | 🔴 CRITICAL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From local `.env.local` | 🔴 CRITICAL |
| `SUPABASE_SERVICE_ROLE_KEY` | From local `.env.local` | 🔴 CRITICAL |

#### Optional but Recommended:

| Variable Name | Value | Purpose |
|--------------|-------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://rosebank-dialer.vercel.app` | CORS configuration |
| `NODE_ENV` | `production` | Environment detection |

### Step 3: Get Your Local Environment Variables

Run this command in PowerShell to see your local config:

```powershell
Get-Content .env.local
```

Or open the file manually:
```
C:\Users\PC\OneDrive\Documents\IBV\DialerSystem\Rosebank\.env.local
```

### Step 4: Add Variables to Vercel

For each variable:

1. Click **"Add New"** in Vercel Environment Variables
2. **Key**: Enter the variable name (e.g., `JWT_SECRET`)
3. **Value**: Paste the value from your `.env.local` file
4. **Environments**: Select **Production**, **Preview**, and **Development**
5. Click **"Save"**

### Step 5: Redeploy

After adding all variables:

1. Go to **Deployments** tab in Vercel
2. Click the **"⋮"** menu on the latest deployment
3. Select **"Redeploy"**
4. Wait for deployment to complete (usually 1-2 minutes)

### Step 6: Verify

1. Check health endpoint again: `https://rosebank-dialer.vercel.app/api/health`
   - Should show `"status": "healthy"`
   - All checks should show `"configured": true`

2. Test login:
   - Go to: `https://rosebank-dialer.vercel.app/login`
   - Email: `admin@dialersystem.com`
   - Password: `admin123`
   - Should now work!

---

## 🔍 Troubleshooting

### Issue: Still getting "Login failed"

**Check 1: Verify environment variables are set**
```bash
# Visit this URL in browser:
https://rosebank-dialer.vercel.app/api/health
```

**Check 2: Browser console errors**
1. Press F12 in browser
2. Go to Console tab
3. Try logging in
4. Look for red error messages
5. Share the error with administrator

**Check 3: Supabase database access**
- Make sure your Supabase project is active (not paused)
- Verify the Supabase URL is correct
- Check that RLS policies allow admin login

### Issue: "Server configuration error"

This means JWT_SECRET is missing or too short.

**Fix:**
1. In Vercel, add `JWT_SECRET` with a long random string (50+ characters)
2. Generate one: Use online tool or your local value
3. Redeploy

### Issue: "Database connection error"

This means Supabase credentials are missing.

**Fix:**
1. Verify all three Supabase variables are set in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Make sure values exactly match your Supabase project
3. Redeploy

---

## 📋 Quick Checklist

- [ ] Opened local `.env.local` file
- [ ] Logged into Vercel dashboard
- [ ] Found rosebank-dialer project
- [ ] Went to Settings → Environment Variables
- [ ] Added `JWT_SECRET`
- [ ] Added `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Clicked Save
- [ ] Redeployed the project
- [ ] Checked `/api/health` endpoint shows "healthy"
- [ ] Tested login - works!

---

## 🆘 Still Having Issues?

1. Check the health endpoint: `https://rosebank-dialer.vercel.app/api/health`
2. Open browser console (F12) and try logging in
3. Take a screenshot of any error messages
4. Share with your development team

## 📞 Emergency Access

If you need immediate access while fixing production:

1. Use the local version: `http://localhost:3000`
2. Or use Vercel preview deployment if available
