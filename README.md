# SendGrid Reports

Monorepo for the SendGrid analytics tooling featuring a Next.js dashboard with **lead generation analytics** and B2B insights powered by Supabase.

## Key Features

- Deliverability analytics for opens, clicks, bounces, and engagement rates
- Lead scoring using opens, clicks, and recency
- Domain-level B2B company analytics
- Bounce warnings for contacts with repeated failures
- Supabase-backed event loading and incremental refresh

## Repository layout

- `sendgrid-dashboard/` – Next.js 15 dashboard with lead generation analytics
- `SUPABASE_SETUP.md` – database setup notes
- `CHANGELOG.md` – cleanup and release notes

## Getting started

```bash
# install dependencies and start the dashboard
cd sendgrid-dashboard
npm install
npm run dev
```

Create `sendgrid-dashboard/.env.local` with the dashboard credentials and Supabase connection:

```bash
DASHBOARD_USERNAME=your-username
DASHBOARD_PASSWORD=your-secure-password
AUTH_SECRET=random-32-plus-character-secret
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key
```

Navigate to:
- `http://localhost:3000` - Main dashboard with engagement analytics
- `http://localhost:3000/companies` - B2B company analytics and domain insights
- `http://localhost:3000/individuals` - Individual contact analytics

## Deployment

The dashboard is designed for Vercel (Next.js app directory). Ensure the GitHub repo is connected to Vercel; CI should run `npm run lint` and `npm run build` before deployment. Preview deployments provide quick verification of UI changes.

## Contributing

1. Fork or branch from `main`
2. Implement changes inside `sendgrid-dashboard/`
3. Run `npm run lint` and `npm run build`
4. Open a PR with screenshots of key flows

Refer to `sendgrid-dashboard/README.md` for detailed architecture notes.
