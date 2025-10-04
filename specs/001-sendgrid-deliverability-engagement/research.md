# Technical Research: SendGrid Dashboard (MVP - Simplified)

**Feature**: SendGrid Deliverability & Engagement Analytics Dashboard  
**Date**: 2025-10-03  
**Phase**: 0 - Technology Selection & Architecture Research

---

## Research Summary

**MVP Approach**: Single Next.js application with client-side Excel processing. No backend server, no database - just parse Excel file and render dashboard matching SendGrid screenshots. Deploy to Vercel for zero-config hosting.

All technical decisions optimized for rapid MVP development while maintaining SendGrid UI fidelity.

---

## Decision 1: Application Framework

**Decision**: Next.js 14+ (App Router) - Single application, no separate backend

**Rationale**:
- **All-in-One**: Next.js provides both UI and server capabilities in one framework
- **Vercel Native**: Zero-config deployment to Vercel
- **Client-Side Processing**: Can parse Excel files directly in browser using ExcelJS
- **React State**: Simple useState/useReducer for managing parsed data (no database needed)
- **Fast Development**: Single codebase, no backend coordination needed

**Alternatives Considered**:
- **Vite + React SPA**: Would work but Next.js gives us Vercel optimization for free
- **Pure React**: Next.js adds routing and deployment benefits with minimal overhead

**Supporting Evidence**:
- Next.js App Router perfect for dashboard-style apps
- Client-side Excel parsing with ExcelJS works in browser
- No need for backend when data fits in browser memory (~1MB for 10k events)

---

## Decision 2: UI Component Library & Styling

**Decision**: Tailwind CSS + shadcn/ui

**Rationale**:
- **Tailwind CSS**: Utility-first styling enables rapid UI development matching SendGrid screenshots, responsive design built-in
- **shadcn/ui**: Accessible React components (WCAG 2.1 AA compliant) that can be customized to match SendGrid's visual language
- **Radix UI Primitives**: Underlying accessible primitives ensure keyboard navigation (NFR-007)
- **Zero Runtime CSS**: Tailwind's JIT compiler produces minimal CSS bundle for performance

**Alternatives Considered**:
- **Material-UI**: Heavy bundle size, would impact <1s chart render target
- **Chakra UI**: Good accessibility but more opinionated styling, harder to match SendGrid's exact design
- **Ant Design**: Enterprise-ready but Asian design language doesn't match SendGrid's aesthetic

**Supporting Evidence**:
- Constitution requires WCAG 2.1 AA: shadcn/ui components meet this by default
- Performance targets demand lightweight CSS: Tailwind JIT delivers <50KB CSS
- SendGrid screenshots show clean, modern UI that Tailwind excels at replicating

---

## Decision 3: Charting Library

**Decision**: Recharts

**Rationale**:
- **React-Native**: Declarative API that works directly with React state (no complex data binding)
- **Lightweight**: Smaller bundle than alternatives, faster load times
- **All Chart Types**: Line, area, funnel - everything in SendGrid screenshots
- **Responsive**: Auto-resizes for mobile/tablet/desktop

**Alternatives Considered**:
- **Chart.js**: Imperative API, harder to sync with React state
- **Nivo**: Beautiful but heavier bundle

**Supporting Evidence**:
- Used by Vercel, Stripe dashboards
- Works with client-side data (no backend needed)

---

## Decision 4: Excel Parsing

**Decision**: ExcelJS (client-side in browser)

**Rationale**:
- **Browser Compatible**: Works in browser without Node.js backend
- **Format Support**: Handles `.xlsx` SendGrid Stats files
- **Streaming**: Can process 10k+ rows efficiently in browser
- **TypeScript**: Full type definitions included

**Alternatives Considered**:
- **XLSX.js (SheetJS)**: Commercial license restrictions
- **Server-side parsing**: Unnecessary complexity for MVP

**Supporting Evidence**:
- ExcelJS can parse 10k rows in <2s in modern browsers
- No backend needed - parse directly on upload

---

## Decision 5: Data Storage

**Decision**: React useState/useReducer (in-memory only for MVP)

**Rationale**:
- **Simplest Solution**: No database, no backend, no persistence needed
- **Fast Development**: Just load Excel → parse → store in component state
- **Sufficient for MVP**: User uploads file each session, data resets on refresh
- **Easy to Upgrade**: Can add localStorage or Vercel KV later if needed

**Alternatives Considered**:
- **PostgreSQL**: Major overkill for simple Excel file viewing
- **localStorage**: Adds complexity, 5-10MB limit might be hit
- **Vercel KV**: Not needed for MVP, can add later

**Supporting Evidence**:
- 10k email events = ~1MB of data (fits easily in browser memory)
- User uploads fresh Excel file anyway, no need to persist between sessions

---

## Decision 6: Testing

**Decision**: Playwright (E2E only) - Skip unit tests for MVP

**Rationale**:
- **E2E Tests Validate Business Value**: Test actual user scenarios from screenshots
- **Faster MVP**: Skip unit test boilerplate, focus on working dashboard
- **Can Add Later**: Once MVP works, add unit tests for edge cases

**Alternatives Considered**:
- **Full test suite (Vitest + Playwright)**: Too slow for MVP iteration
- **No tests**: Too risky, E2E tests catch visual/functional regressions

**Supporting Evidence**:
- Playwright can screenshot-test against SendGrid reference images
- E2E tests cover 80% of value with 20% of test code

---

## Decision 7: Authentication (Optional for MVP)

**Decision**: Skip auth for MVP / Add simple password later if needed

**Rationale**:
- **MVP Focus**: Get dashboard working first
- **Easy Addition**: Can add NextAuth.js later if needed
- **Alternative**: Deploy as private Vercel preview URL (built-in security)

**Supporting Evidence**:
- Auth adds 2-3 tasks minimum
- Can deploy to password-protected Vercel preview for internal use

---

## Decision 8: Time Zone Handling

**Decision**: Luxon for AEST timezone

**Rationale**:
- **Spec Requirement**: All timestamps must be Brisbane (AEST, UTC+10)
- **Lightweight**: Smaller than Moment.js
- **Browser + Server**: Works everywhere

**Supporting Evidence**:
- Luxon's `setZone('Australia/Brisbane')` handles DST correctly
- Required for accurate daily/weekly aggregations

---

## Simplified Architecture

```
Single Next.js App
├── Upload Excel file (client-side)
├── Parse with ExcelJS (browser)
├── Store in React state (useState)
├── Render dashboard components
│   ├── Activity Feed (table)
│   ├── Figures Table (daily stats)
│   ├── KPI Cards (metrics)
│   ├── Charts (Recharts)
│   ├── Funnel (Recharts)
│   └── Categories Table
└── Export to CSV (client-side)
```

**No backend. No database. No API layer.**

---

## Implementation Priority (MVP)

1. **Setup**: Create Next.js app, install dependencies
2. **Excel Upload**: File input → Parse with ExcelJS → Store in state
3. **Core Components**: Build dashboard components matching screenshots
4. **Deploy**: Push to GitHub → Deploy to Vercel (one click)

---

## What We Removed (Can Add Later)

- ❌ PostgreSQL database
- ❌ Separate backend server
- ❌ API layer (OpenAPI contracts)
- ❌ NextAuth.js authentication
- ❌ SWR data fetching
- ❌ Contract tests
- ❌ Unit tests (keep E2E only)
- ❌ Complex middleware
- ❌ Email masking (not needed if no multi-user)

---

## MVP Scope

**What we're building:**
- ✅ Single Next.js app
- ✅ Upload Excel file
- ✅ Dashboard matching SendGrid screenshots
- ✅ Export to CSV
- ✅ Deploy to Vercel

**Estimated Tasks**: ~20 instead of 92  
**Estimated Time**: 1-2 weeks instead of 8-12 weeks
