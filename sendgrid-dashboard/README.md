## SendGrid Deliverability & Engagement Dashboard

Next.js 15 dashboard for SendGrid deliverability, engagement, individual contact, and company-domain analytics. The app loads events from Supabase and keeps the UI state client-side.

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase table configured from `../SUPABASE_SETUP.md`

## Installation

```bash
npm install
```

## Environment variables

### Required Variables

Create `.env.local` in the `sendgrid-dashboard` directory:

```bash
# Authentication (Required)
DASHBOARD_USERNAME=your-username
DASHBOARD_PASSWORD=your-secure-password
AUTH_SECRET=random-32-plus-character-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key
```

Never commit `.env.local`.

### Generating Secrets

```bash
# Generate AUTH_SECRET (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or use OpenSSL
openssl rand -base64 32
```

## Data Flow

- `/api/events` loads the recent event window from Supabase for the main dashboard.
- `/api/analytics/engagement` calculates individual-contact lead metrics.
- `/api/analytics/domains` calculates company-domain lead metrics.
- `/api/analytics/insights` derives dashboard insights from recent events.

## Available scripts

```bash
npm run dev        # Start Next.js dev server (Turbopack)
npm run build      # Production build
npm run start      # Start production build locally
npm run lint       # ESLint (required before commit/deploy)
npm run format     # Prettier + Tailwind class sorting
```

## Accessibility & performance guarantees

- WCAG 2.1 AA keyboard & screen reader support throughout filters, tables, charts, and funnel
- High-contrast palette and focus-visible styling defined in `src/app/globals.css`
- Time-series charts and KPI cards memoised for <1 s rendering after filter changes

## Project structure

- `src/app/page.tsx` – main dashboard composition & state wiring
- `src/app/companies/page.tsx` – domain-level lead analytics
- `src/app/individuals/page.tsx` – contact-level lead analytics
- `src/components/**` – filters, metrics, tables, charts, funnel, layout primitives
- `src/lib/**` – aggregations, filters, formatters, CSV export helpers

## Deployment

### Vercel Setup

1. **Import Project**
   ```bash
   # Connect to Vercel
   vercel
   ```

2. **Configure Environment Variables**
   - Go to Project → Settings → Environment Variables
   - Add all required variables from `.env.local`:
     - `DASHBOARD_USERNAME`
     - `DASHBOARD_PASSWORD`
     - `AUTH_SECRET`
     - Optional: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`
   - Set for **Production**, **Preview**, and **Development** environments

3. **Deploy**
   ```bash
   # Production deployment
   vercel --prod
   
   # Or push to main branch (auto-deploys)
   git push origin main
   ```

4. **Verify**
   - Navigate to deployment URL
   - Should redirect to `/login`
   - Sign in with credentials from environment variables
   - Verify the dashboard loads Supabase events

### Security Checklist

- ✅ All secrets stored in Vercel environment variables (not in code)
- ✅ `.env.local` added to `.gitignore`
- ✅ HTTP-only cookies for session tokens
- ✅ Middleware protects all routes except login and public assets
- ✅ JWT tokens expire after 7 days (or 12 hours without "remember me")
- ✅ HTTPS enforced in production (Vercel default)

### Rollback plan

- Use Vercel Deployments page to promote the most recent successful deployment or redeploy a tagged commit
- Ensure `npm run lint` and `npm run build` succeed locally before promoting

## Supabase Configuration

The dashboard loads SendGrid events from a Supabase Postgres database. See **[SUPABASE_SETUP.md](../SUPABASE_SETUP.md)** for:

- Database schema and table structure
- CSV import instructions  
- Index configuration for performance
- Incremental refresh strategy

**Quick Setup**:
1. Create `sendgrid_events` table in Supabase (see schema in docs)
2. Import CSV data via Supabase Table Editor
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE` in environment variables
4. Dashboard auto-loads events after login
