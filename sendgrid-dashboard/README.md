## SendGrid Deliverability & Engagement Dashboard

Single-page Next.js 15 application that ingests SendGrid Excel exports and provides interactive deliverability / engagement analytics. Data is parsed client-side and stored in React state, eliminating the need for a backend service during the MVP phase.

## Prerequisites

- Node.js 20+
- npm 10+
- Sample dataset: `SendGrid Stats.xlsx` in the repository root (used for local testing & E2E automation)

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

# Supabase (Optional - for future database features)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key
```

**Important**: Never commit `.env.local` to version control. Use `.env.example` as a template.

### Generating Secrets

```bash
# Generate AUTH_SECRET (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or use OpenSSL
openssl rand -base64 32
```

## What's new

- **Supabase Integration**: Dashboard now loads data from Supabase Postgres database
- **Auto-load on Login**: Automatically fetches last 365 days of SendGrid events  
- **Manual Refresh**: Click "Refresh Data" to fetch only new events (incremental)
- **No Upload Required**: Removed Excel upload; all data comes from database
- Sticky filter header for quick access to recipient, event type, and date range controls
- Searchable category selector with type-ahead filtering and improved dark-mode contrast
- Recipient email filter now supports instant clearing via keyboard or clear button
- Default dashboard view loads the most recent 7 days (including today)

## Available scripts

```bash
npm run dev        # Start Next.js dev server (Turbopack)
npm run build      # Production build
npm run start      # Start production build locally
npm run lint       # ESLint (required before commit/deploy)
npm run format     # Prettier + Tailwind class sorting
npm run test:e2e   # Playwright E2E suite (requires `npx playwright install` first run)
```

## E2E testing (Playwright)

```bash
npx playwright install
npm run dev        # in one terminal (or deploy preview URL)
npm run test:e2e   # in another terminal
```

The suite in `tests/e2e/dashboard.spec.ts` covers:

- Uploading the sample Excel file and verifying recipient/date filters
- Sorting & exporting Top Categories with filtered CSV download
- Toggling chart metrics and switching figures table granularity

## Accessibility & performance guarantees

- WCAG 2.1 AA keyboard & screen reader support throughout (`UploadDropzone`, `FilterBar`, tables, charts, funnel)
- High-contrast palette and focus-visible styling defined in `src/app/globals.css`
- Activity feed virtualised via `@tanstack/react-virtual` to support 10k+ events with <500 ms interactions
- Time-series charts and KPI cards memoised for <1 s rendering after filter changes

## Project structure

- `src/app/page.tsx` – main dashboard composition & state wiring
- `src/components/**` – upload, filters, metrics, tables, charts, funnel, layout primitives
- `src/lib/**` – Excel parser, aggregations, filters, formatters, CSV export helpers
- `tests/e2e/**` – Playwright scenarios driven by sample dataset

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
   - Upload test Excel file and verify dashboard functionality

### Security Checklist

- ✅ All secrets stored in Vercel environment variables (not in code)
- ✅ `.env.local` added to `.gitignore`
- ✅ HTTP-only cookies for session tokens
- ✅ Middleware protects all routes except login and public assets
- ✅ JWT tokens expire after 7 days (or 12 hours without "remember me")
- ✅ HTTPS enforced in production (Vercel default)

### Rollback plan

- Use Vercel Deployments page to promote the most recent successful deployment or redeploy a tagged commit
- Ensure `npm run lint`, `npm run test:e2e`, and `npm run build` succeed locally before promoting

## Supabase Configuration

The dashboard loads SendGrid events from a Supabase Postgres database. See **[SUPABASE_SETUP.md](../SUPABASE_SETUP.md)** for:

- Database schema and table structure
- CSV import instructions  
- Index configuration for performance
- Incremental refresh strategy

**Quick Setup**:
1. Create `sendgrid_events` table in Supabase (see schema in docs)
2. Import CSV data via Supabase Table Editor
3. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE` in environment variables
4. Dashboard auto-loads 365 days of data on login

## Further reading

- `specs/001-sendgrid-deliverability-engagement/spec.md` – functional requirements & non-functionals
- `specs/001-sendgrid-deliverability-engagement/data-model.md` – in-memory interfaces used across the app
- `specs/001-sendgrid-deliverability-engagement/quickstart.md` – acceptance scenarios mirrored by E2E tests
- `AUTHENTICATION_SETUP.md` – Authentication implementation guide
- `SUPABASE_SETUP.md` – Database schema and configuration
