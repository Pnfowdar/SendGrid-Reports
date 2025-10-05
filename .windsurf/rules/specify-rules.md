# SendGrid Deliverability & Engagement Analytics Dashboard - Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-03

## Project Context

This dashboard visualizes SendGrid email deliverability and engagement metrics. All features must align with the **Constitution v1.0.0** (see `.specify/memory/constitution.md`).

**Key Design References:**
- SendGrid screenshot examples in `/SendGrid Example Screenshots/`
- SendGrid Event Types: https://docs.sendgrid.com/for-developers/tracking-events/event
- Historical data: `SendGrid Stats.xlsx`

## Active Technologies
- TypeScript 5.x / Node.js 18+ (backend), TypeScript 5.x / React 18+ (frontend) + Next.js 14+, React 18+, Tailwind CSS, shadcn/ui components, Recharts/Chart.js, ExcelJS (parser), Vercel (hosting) (001-sendgrid-deliverability-engagement)
- TypeScript 5.x with React 19.1.0, Next.js 15.5.4 (App Router) (main)
- localStorage (client-side persistence, 10MB quota management) (main)

## Project Structure
```
backend/
frontend/
tests/
```

## SendGrid-Specific Guidelines

**Event Data Handling:**
- Event types: `processed`, `delivered`, `bounce`, `deferred`, `dropped`, `open`, `click`, `spamreport`, `unsubscribe`
- Always validate event timestamps in ISO 8601 format
- Preserve original SendGrid event payload for auditability (Principle I)

**Metrics Calculations:**
- Deliverability Rate = (delivered / (delivered + bounced + dropped)) × 100
- Open Rate = (unique opens / delivered) × 100
- Click Rate = (unique clicks / delivered) × 100
- Click-to-Open Rate = (unique clicks / unique opens) × 100
- All calculations must match SendGrid's canonical definitions

**UI/UX Requirements:**
- Match SendGrid dashboard visual patterns (see screenshots)
- Color scheme: Use SendGrid brand colors for consistency
- Metrics cards: Display value, trend indicator, comparison period
- Tables: Sortable, filterable, exportable (CSV/Excel)
- Charts: Interactive tooltips, time range selectors, responsive

**Performance Targets:**
- Dashboard load: <2s for 10,000 emails
- Filter/search: <500ms response
- Export: <5s for 30-day window
- Chart render: <1s for any time range

**Security Requirements:**
- Email addresses MUST be masked (e.g., `j***@example.com`) unless explicitly authorized
- All API endpoints MUST require authentication
- Environment variables for all secrets (never hardcoded)

## Commands
npm test; npm run lint

## Code Style
TypeScript 5.x / Node.js 18+ (backend), TypeScript 5.x / React 18+ (frontend): Follow standard conventions

## Recent Changes
- main: Added TypeScript 5.x with React 19.1.0, Next.js 15.5.4 (App Router)
- 001-sendgrid-deliverability-engagement: Added TypeScript 5.x / Node.js 18+ (backend), TypeScript 5.x / React 18+ (frontend) + Next.js 14+, React 18+, Tailwind CSS, shadcn/ui components, Recharts/Chart.js, ExcelJS (parser), Vercel (hosting)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
