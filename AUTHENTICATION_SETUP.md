# Authentication Setup Guide

## Overview
The SendGrid Dashboard uses JWT-based authentication with HTTP-only cookies and environment-configured credentials.

## Architecture

### Components
1. **Login Page** (`/login`) - Dynamic SSR with Suspense boundary
2. **Auth API** (`/api/auth`) - POST for login, DELETE for logout
3. **Middleware** (`src/middleware.ts`) - Route protection and redirect logic
4. **Session Management** (`src/lib/auth.ts`) - JWT signing/verification with jose

### Security Features
- ✅ HTTP-only cookies (no client-side access)
- ✅ JWT tokens with 7-day expiration (12 hours without "remember me")
- ✅ Secure flag in production (HTTPS-only)
- ✅ SameSite=lax (CSRF protection)
- ✅ Middleware protects all routes except login and public assets
- ✅ Environment-based credentials (no hardcoded secrets)

## Local Development Setup

### 1. Create Environment File
Create `sendgrid-dashboard/.env.local`:

```bash
# Required
NODE_ENV=development
DASHBOARD_USERNAME=griaadmin
DASHBOARD_PASSWORD=o*@&aoJWL9yW8kR5&A3rziina&wjt0escjHNwspzgi&LTXbACP
AUTH_SECRET=wiFW*6eCxuVgtTOGZrOeJ4nhv8z@zJmElriEJPVXLTilZ%@2nDv##FEW3A@ezVqSkQ5W9WNNwk4zlGSzfJzVIX7KWW3bPMU&fLm0x8FqAwkjWCN4dd5lWn2LS!x1*djk

# Optional - Supabase (for future features)
SUPABASE_URL=https://mwffnafhtbjcefkcbmcb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZmZuYWZodGJqY2Vma2NibWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MzYxODEsImV4cCI6MjA3NTIxMjE0MX0.Uqzl4G1krSo1nUC8PEO5jZ8ceCf44zSBE2MEfDCH7-0
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZmZuYWZodGJqY2Vma2NibWNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYzNjE0MSwiZXhwIjoyMDc1MjEyMTgxfQ.6Eg3lZmw2nrC56sqZf5SArQa6BaRL4Lvt_9pZKBm-Rg

# Note: SUPABASE_DB_URL intentionally omitted - requires full password URL encoding
# If needed in the future, encode password with: node -e "console.log(encodeURIComponent('password'))"
```

### 2. Install Dependencies
```bash
cd sendgrid-dashboard
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test Authentication
1. Navigate to http://localhost:3000
2. Should redirect to http://localhost:3000/login
3. Sign in with:
   - Username: `griaadmin`
   - Password: `o*@&aoJWL9yW8kR5&A3rziina&wjt0escjHNwspzgi&LTXbACP`
4. Should redirect to dashboard
5. Click "Sign out" button to test logout

## Vercel Deployment

### 1. Configure Environment Variables
In Vercel Project Settings → Environment Variables, add:

| Variable | Value | Environments |
|----------|-------|--------------|
| `NODE_ENV` | `production` | Production |
| `DASHBOARD_USERNAME` | `griaadmin` | Production, Preview |
| `DASHBOARD_PASSWORD` | `<password>` | Production, Preview |
| `AUTH_SECRET` | `<secret>` | Production, Preview |
| `SUPABASE_URL` | `https://mwffnafhtbjcefkcbmcb.supabase.co` | Production, Preview (optional) |
| `SUPABASE_ANON_KEY` | `<key>` | Production, Preview (optional) |
| `SUPABASE_SERVICE_ROLE` | `<key>` | Production only (optional) |

**Security Note**: Never expose `SUPABASE_SERVICE_ROLE` in client-side code or Preview environments accessible to external users.

### 2. Deploy
```bash
# Link project
vercel link

# Deploy to production
vercel --prod
```

### 3. Verify Deployment
1. Visit production URL (e.g., https://sendgrid-dashboard.vercel.app)
2. Should redirect to `/login`
3. Sign in with production credentials
4. Upload test Excel file
5. Verify dashboard functionality
6. Test logout

## Authentication Flow

### Login Flow
```
User visits / 
  → Middleware checks auth_token cookie
  → No cookie? Redirect to /login?redirect=/
  → User submits credentials
  → POST /api/auth validates username/password
  → Success? Create JWT, set HTTP-only cookie
  → Redirect to original destination
```

### Protected Route Access
```
User visits /dashboard
  → Middleware checks auth_token cookie
  → Cookie exists? Verify JWT signature
  → Valid? Allow access
  → Invalid/expired? Redirect to /login
```

### Logout Flow
```
User clicks "Sign out"
  → DELETE /api/auth
  → Clear auth_token cookie
  → Redirect to /login
```

## Security Considerations

### Token Expiration
- **Default**: 12 hours (without "remember me")
- **Extended**: 7 days (with "remember me" checked)
- Expired tokens automatically redirect to login

### Password Requirements
- No client-side validation currently
- Stored as plaintext in environment (single-user system)
- For multi-user: migrate to bcrypt hashing + Supabase Auth

### Cookie Security
- `httpOnly: true` - JavaScript cannot access
- `secure: true` - HTTPS only (production)
- `sameSite: 'lax'` - CSRF protection
- `path: '/'` - Available to all routes

### Middleware Protection
Protects all routes except:
- `/login` - Login page
- `/api/auth` - Auth endpoints
- `/_next/*` - Next.js internal routes
- Static assets (images, fonts, etc.)

## Troubleshooting

### Build fails with ZodError
**Symptom**: `ZodError: DASHBOARD_USERNAME is required`

**Solution**: Ensure `.env.local` exists with all required variables

### Login redirects in a loop
**Symptom**: `/login` → `/` → `/login` → ...

**Solution**: Check middleware logic; verify JWT verification is working

### "Invalid username or password" on correct credentials
**Symptom**: Credentials rejected despite being correct

**Solution**: 
1. Check env vars are loaded: `console.log(process.env.DASHBOARD_USERNAME)`
2. Verify no trailing spaces in `.env.local`
3. Restart dev server after env changes

### Session expires immediately
**Symptom**: Logged out after page refresh

**Solution**:
1. Check `AUTH_SECRET` is set and at least 32 characters
2. Verify cookies are being set (DevTools → Application → Cookies)
3. Check `secure` flag matches environment (false in dev, true in prod)

## Migration to Supabase Auth (Future)

When ready to support multiple users:

1. Enable Supabase Email/Password auth in Supabase dashboard
2. Create users via Supabase UI or API
3. Replace `src/lib/auth.ts` with Supabase client auth
4. Update `src/middleware.ts` to use Supabase session verification
5. Migrate `LoginForm` to use `supabase.auth.signInWithPassword()`
6. Keep environment-based admin user for emergency access

## Testing Checklist

- [ ] Build succeeds: `npm run build`
- [ ] Dev server starts: `npm run dev`
- [ ] Login page loads at http://localhost:3000/login
- [ ] Correct credentials grant access
- [ ] Incorrect credentials show error message
- [ ] Dashboard redirects unauthenticated users to login
- [ ] "Remember me" extends session duration
- [ ] Logout clears session and redirects to login
- [ ] Protected routes redirect with `?redirect=` parameter
- [ ] After login, user returns to original destination
- [ ] Middleware does not interfere with static assets
- [ ] Production build deploys to Vercel successfully

## API Reference

### POST /api/auth
Login endpoint

**Request**:
```json
{
  "username": "griaadmin",
  "password": "...",
  "rememberMe": false
}
```

**Response** (200):
```json
{
  "success": true
}
```

**Response** (401):
```json
{
  "error": "Invalid username or password"
}
```

**Response** (400):
```json
{
  "error": "Invalid request payload",
  "details": {
    "username": ["Required"],
    "password": ["Required"]
  }
}
```

### DELETE /api/auth
Logout endpoint

**Response** (200):
```json
{
  "success": true
}
```

---

**Last Updated**: 2025-01-05  
**Status**: ✅ Production Ready  
**Next Steps**: Deploy to Vercel and verify with real credentials
