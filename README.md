# SendGrid Reports

Monorepo for the SendGrid analytics tooling. It currently contains the `sendgrid-dashboard/` Next.js application alongside specifications and supporting assets.

## Repository layout

- `sendgrid-dashboard/` – Next.js 15 single-page dashboard for SendGrid deliverability & engagement analytics
- `specs/` – product specification, data model, and quickstart documentation
- `SendGrid Stats.xlsx` – sample dataset for local testing (do not share publicly)

## Getting started

```bash
# install dependencies and start the dashboard
cd sendgrid-dashboard
npm install
npm run dev
```

The in-app uploader expects the example spreadsheet at `sendgrid-dashboard/SendGrid Stats.xlsx`. Use the Filters panel to slice by recipient, category, event type, and date range.

## Deployment

The dashboard is designed for Vercel (Next.js app directory). Ensure the GitHub repo is connected to Vercel; CI should run `npm run lint` and `npm run build` before deployment. Preview deployments provide quick verification of UI changes.

## Contributing

1. Fork or branch from `main`
2. Implement changes inside `sendgrid-dashboard/`
3. Run `npm run lint` and `npm run build`
4. Open a PR with screenshots of key flows

Refer to `sendgrid-dashboard/README.md` for detailed architecture notes.
