# SendGrid Reports

Monorepo for the SendGrid analytics tooling featuring a Next.js dashboard with **lead generation analytics** and B2B insights powered by Supabase.

## ✨ Key Features

- **📊 Deliverability Analytics** - Track opens, clicks, bounces, and engagement rates
- **🎯 Lead Generation** - Identify hot leads with engagement scoring (opens × 2 + clicks × 5)
- **🏢 B2B Company Analytics** - Domain-level insights for corporate lead qualification
- **⚠️ Bounce Detection** - Auto-flag problematic emails (3+ bounces) to protect sender reputation
- **💡 Smart Insights** - Automated recommendations with actionable next steps
- **📈 Real-time Filtering** - Multi-select categories, event types, and date ranges
- **💾 Supabase Backend** - Auto-loading data with computed columns and indexes
- **🔗 URL Sharing** - Shareable filter states for team collaboration

## Repository layout

- `sendgrid-dashboard/` – Next.js 15 dashboard with lead generation analytics
- `specs/` – product specifications, API contracts, and data models
- `SendGrid Stats.xlsx` – sample dataset for local testing (do not share publicly)

## Getting started

```bash
# install dependencies and start the dashboard
cd sendgrid-dashboard
npm install
npm run dev
```

**Environment Setup**: Copy `.env.local.example` to `.env.local` and configure your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key
```

Navigate to:
- `http://localhost:3000` - Main dashboard with engagement analytics
- `http://localhost:3000/companies` - B2B company analytics and domain insights

## Deployment

The dashboard is designed for Vercel (Next.js app directory). Ensure the GitHub repo is connected to Vercel; CI should run `npm run lint` and `npm run build` before deployment. Preview deployments provide quick verification of UI changes.

## Contributing

1. Fork or branch from `main`
2. Implement changes inside `sendgrid-dashboard/`
3. Run `npm run lint` and `npm run build`
4. Open a PR with screenshots of key flows

Refer to `sendgrid-dashboard/README.md` for detailed architecture notes.
