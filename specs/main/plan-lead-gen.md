# Implementation Plan: Lead Generation Analytics & Insights

**Branch**: `main` | **Date**: 2025-10-05 | **Spec**: [spec.md](./spec.md)
**Input**: User requirements for lead generation analytics with autonomous execution

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → Spec exists at specs/main/spec.md
2. Fill Technical Context
   → TypeScript/React/Next.js 15 with Supabase backend
   → Project Type: Web (single Next.js application)
3. Constitution Check
   → No constitution defined - using industry best practices
4. Execute Phase 0 → research.md
   → Document selected implementation options
5. Execute Phase 1 → data-model.md, contracts/, quickstart.md
   → Define new data structures and API contracts
6. Re-evaluate Constitution Check
   → Verify simplicity and maintainability
7. Plan Phase 2 → Task generation approach
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at Phase 2 description. Implementation is autonomous via tools.

## Summary

**Objective**: Transform SendGrid Dashboard from basic reporting to lead generation powerhouse with actionable analytics.

**Selected Implementation Approach**:
- **1.1 Date Migration**: Option A - Complete Luxon→date-fns migration (removes 50KB)
- **1.2 Database Schema**: Option A - Add `email_domain` computed column via Supabase MCP
- **2.1 High-Engagement Contacts**: Option A - Server-side aggregation API with downloadable CSV
- **2.2 Bounce Detection**: Option B - Client-side bounce warnings (simpler, no backend)
- **2.3 Domain Analytics**: Option C - Dedicated `/companies` route with Hot Leads, At-Risk, Opportunity sections
- **2.4 Multi-Select Filters**: Option A - Client-side multi-select with URL encoding
- **2.5 Insights Dashboard**: Option A - Rule-based smart insights with actionable recommendations
- **3.1 & 3.2**: Export enhancements and URL sharing for collaboration

**Key Features**:
1. Auto-identify top 50 leads by engagement score in <2 seconds
2. Flag problematic emails (3+ bounces) before reputation damage
3. Company-level engagement trends (B2B lead qualification)
4. One-click CSV exports for CRM import
5. URL sharing for team collaboration

**Bundle Impact**: +15KB new features, -50KB Luxon removal = **Net -35KB**

## Technical Context

**Language/Version**: TypeScript 5.x with React 19.1.0, Next.js 15.5.4 (App Router)

**Primary Dependencies**: 
- **UI**: Tailwind CSS 4, Radix UI primitives, Lucide icons
- **Data**: ExcelJS 4.4.0, date-fns 3.6.0 (replacing Luxon 3.7.2)
- **Backend**: @supabase/supabase-js 2.58.0, @supabase/ssr 0.5.2
- **Performance**: @tanstack/react-virtual 3.13.12
- **Validation**: zod 3.23.8

**Storage**: Supabase Postgres with `sendgrid_events` table

**Testing**: Playwright E2E tests in `tests/e2e/`

**Target Platform**: Modern browsers (Chrome 120+, Firefox 120+, Safari 17+, Edge 120+)

**Project Type**: Web (single Next.js application with Supabase backend)

**Performance Goals**: 
- Server-side queries <500ms for 100k+ events
- Client-side filtering <200ms for 10k events
- Page load <1.5s with prefetched data
- Analytics dashboard <2s to actionable insights

**Constraints**: 
- Bundle size <1MB (currently ~800KB, target ~750KB after Luxon removal)
- Supabase free tier: 500MB database, 2GB bandwidth/month
- No additional backend services (serverless only)
- Autonomous execution (minimal user intervention)

**Scale/Scope**: 
- Support 100k+ email events in database
- 10k events loaded in client for real-time filtering
- 8 new components + 4 API endpoints
- 12 existing files to modify

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (No constitution file defined - using industry best practices)

**Applied Principles**:
1. **Simplicity First**: Server-side where it scales, client-side where it's simpler
2. **Test Coverage**: E2E tests for all new user-facing features
3. **Incremental Enhancement**: Build on existing Supabase foundation
4. **Tool Utilization**: Leverage Supabase MCP for autonomous database changes
5. **Performance**: Pre-aggregate on server, cache on client
6. **Maintainability**: Clear separation of concerns (API routes, components, lib utilities)

**Justified Decisions**:
- **Client-side bounce detection** (2.2B): Simpler than server-side triggers, sufficient for current scale
- **Dedicated Companies route** (2.3C): B2B analytics deserve focused UX, not buried in tabs
- **Multi-select client-side** (2.4A): Existing data already loaded, avoids API complexity

## Project Structure

### Documentation (this feature)
```
specs/main/
├── plan-lead-gen.md     # This file
├── research-lead-gen.md # Phase 0 output
├── data-model-lead-gen.md # Phase 1 output
├── contracts/           # API contracts (Phase 1)
│   ├── engagement-api.md
│   ├── analytics-api.md
│   └── filter-api.md
├── quickstart-lead-gen.md # Test scenarios (Phase 1)
└── tasks-lead-gen.md    # Task list (/tasks command output)
```

### Source Code (repository root)
```
sendgrid-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── events/route.ts           # [MODIFY] Add POST with filters
│   │   │   └── analytics/
│   │   │       ├── engagement/route.ts    # [NEW] Top contacts API
│   │   │       ├── domains/route.ts       # [NEW] Company metrics API
│   │   │       └── insights/route.ts      # [NEW] Smart insights API
│   │   ├── companies/
│   │   │   └── page.tsx                   # [NEW] B2B analytics dashboard
│   │   ├── page.tsx                       # [MODIFY] Remove Luxon, add multi-select, bounce warnings
│   │   └── layout.tsx                     # [MODIFY] Add companies nav link
│   ├── components/
│   │   ├── analytics/                     # [NEW] Analytics components
│   │   │   ├── EngagementTable.tsx        # [NEW] Top contacts list
│   │   │   ├── DomainInsights.tsx         # [NEW] Company metrics
│   │   │   ├── BounceWarnings.tsx         # [NEW] Problem email alerts
│   │   │   └── InsightsPanel.tsx          # [NEW] Smart recommendations
│   │   ├── filters/
│   │   │   └── FilterBar.tsx              # [MODIFY] Multi-select dropdowns
│   │   ├── export/
│   │   │   └── ExportButton.tsx           # [MODIFY] Add new export types
│   │   └── layout/
│   │       └── DashboardShell.tsx         # [MODIFY] Add nav for /companies
│   ├── hooks/
│   │   ├── useDashboardState.ts           # [MODIFY] Multi-select filter state
│   │   ├── useEngagement.ts               # [NEW] Fetch engagement data
│   │   └── useDomainMetrics.ts            # [NEW] Fetch domain analytics
│   ├── lib/
│   │   ├── aggregations.ts                # [MODIFY] Remove Luxon, add engagement scoring
│   │   ├── filters.ts                     # [MODIFY] Multi-select OR logic
│   │   ├── format.ts                      # [MODIFY] Remove Luxon
│   │   ├── excel-parser.ts                # [MODIFY] Remove Luxon
│   │   ├── export.ts                      # [MODIFY] Add engagement/bounce exports
│   │   ├── insights.ts                    # [NEW] Smart insight rules
│   │   ├── bounce-detection.ts            # [NEW] Bounce pattern analysis
│   │   └── url-state.ts                   # [NEW] URL serialization
│   └── types/
│       └── index.ts                       # [MODIFY] Add new types
├── package.json                           # [MODIFY] Remove Luxon, add date-fns-tz
└── tests/
    └── e2e/
        ├── analytics.spec.ts              # [NEW] Analytics feature tests
        └── dashboard.spec.ts              # [MODIFY] Update for multi-select
```

**Structure Decision**: Single Next.js application with Supabase backend. All analytics built on existing foundation. New features co-located with existing components.

## Phase 0: Outline & Research

**Research Topics**:

### 1. Date Library Migration Strategy
**Question**: What's the minimal risk approach to replace Luxon with date-fns?

**Research Approach**:
- Audit all Luxon usages: `grep -r "luxon" src/`
- Map Luxon API to date-fns equivalents
- Test timezone handling (Australia/Brisbane)

**Expected Decision**: Direct replacement with `date-fns` + `date-fns-tz` for timezone support

### 2. Supabase Schema Enhancement
**Question**: How to add `email_domain` computed column using Supabase MCP?

**Research Approach**:
- Review Supabase MCP `apply_migration` function
- Test regex extraction in Postgres: `SUBSTRING(email FROM '@(.*)$')`
- Verify index performance impact

**Expected Decision**: Generated column with GIN index for fast lookups

### 3. Engagement Scoring Algorithm
**Question**: How to rank contacts for lead prioritization?

**Research Approach**:
- Review email marketing best practices
- Weight formula: opens vs clicks vs recency
- Benchmark against 10k+ events

**Expected Decision**: `engagement_score = (opens * 2) + (clicks * 5) + (1 / days_since_last_activity)`

### 4. Bounce Pattern Detection
**Question**: What constitutes a "problematic" email for bounce warnings?

**Research Approach**:
- Review SendGrid bounce documentation
- Industry standards (3 hard bounces = suppress)
- Balance between false positives and reputation protection

**Expected Decision**: Warn at 3+ bounces (any type), critical at 5+ bounces

### 5. Multi-Select Filter State Management
**Question**: How to encode multiple selections in URL without exceeding 2000 chars?

**Research Approach**:
- Test comma-separated encoding: `?c=Welcome,Marketing,Transactional`
- URL encoding overhead calculation
- Fallback for edge cases (20+ categories selected)

**Expected Decision**: Comma-separated with URL encoding, truncate+warn if >1800 chars

### 6. Domain-Level Aggregation Performance
**Question**: Can we aggregate 100k events by domain in <500ms server-side?

**Research Approach**:
- Benchmark Supabase query with GROUP BY email_domain
- Test with indexes on domain + event columns
- Compare server-side vs client-side performance

**Expected Decision**: Server-side with indexes, cache results for 5 minutes

**Output**: `research-lead-gen.md` documenting all decisions and rationales

## Phase 1: Design & Contracts

### 1. Data Model Updates → `data-model-lead-gen.md`

**New Types**:
```typescript
// Engagement scoring
interface EngagementContact {
  email: string;
  domain: string;
  total_sent: number;
  opens: number;
  clicks: number;
  bounces: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  last_activity: Date;
  engagement_score: number;
}

// Domain analytics
interface DomainMetrics {
  domain: string;
  unique_contacts: number;
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  total_bounces: number;
  avg_open_rate: number;
  avg_click_rate: number;
  bounce_rate: number;
  trend: 'hot' | 'warm' | 'cold' | 'problematic';
  top_contacts: string[]; // Top 3 emails from domain
}

// Bounce warnings
interface BounceWarning {
  email: string;
  domain: string;
  bounce_count: number;
  bounce_types: string[];
  first_bounce: Date;
  last_bounce: Date;
  severity: 'warning' | 'critical';
}

// Smart insights
interface SmartInsight {
  id: string;
  type: 'engagement' | 'bounce' | 'trend' | 'opportunity';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metric?: number;
  action?: {
    label: string;
    href: string;
    export?: 'hot-leads' | 'bounce-list' | 'domain-contacts';
  };
}

// Multi-select filters (updated)
interface DashboardFilters {
  dateRange: [Date | null, Date | null];
  categories: string[];        // Changed from string
  emails: string[];             // Changed from string (support multiple)
  eventTypes: EventType[];      // Changed from EventType
}
```

### 2. API Contracts → `contracts/`

**Contract 1: Enhanced Events API** (`/api/events`)
```typescript
// POST /api/events
Request {
  filters: {
    categories?: string[];
    eventTypes?: EventType[];
    dateRange?: [string, string];
    emailPattern?: string; // e.g., "*@acme.com"
  };
  limit?: number;
  offset?: number;
}

Response {
  events: EmailEvent[];
  total: number;
  filtered: number;
}
```

**Contract 2: Engagement API** (`/api/analytics/engagement`)
```typescript
// GET /api/analytics/engagement?limit=50&minScore=10
Response {
  contacts: EngagementContact[];
  summary: {
    total_contacts: number;
    avg_engagement_score: number;
    high_value_count: number; // score > 50
  };
}
```

**Contract 3: Domains API** (`/api/analytics/domains`)
```typescript
// GET /api/analytics/domains?trend=hot,warm
Response {
  domains: DomainMetrics[];
  summary: {
    total_domains: number;
    hot_leads: number;
    at_risk: number;
  };
}
```

**Contract 4: Insights API** (`/api/analytics/insights`)
```typescript
// GET /api/analytics/insights
Response {
  insights: SmartInsight[];
  generated_at: string;
}
```

### 3. Quickstart Scenarios → `quickstart-lead-gen.md`

**Scenario 1: Identify Hot Leads**
1. Navigate to dashboard
2. Click "Companies" tab
3. Verify "Hot Leads" section shows domains with >30% open rate
4. Click "Export Hot Leads"
5. Verify CSV downloads with all contacts from hot domains

**Scenario 2: Bounce Warning Detection**
1. Load dashboard with test data (includes 5+ bounces to test@bounce.com)
2. Verify red badge appears next to problematic email in activity feed
3. Scroll to Insights Panel
4. Verify warning: "12 emails have bounced 3+ times. [View List]"
5. Click "[View List]" → filters to bounce events

**Scenario 3: Multi-Select Filtering**
1. Open Category filter
2. Select "Welcome" and "Marketing"
3. Open Event Type filter
4. Select "open" and "click"
5. Verify activity feed shows only matching events
6. Copy URL
7. Open in new tab → verify same filters applied

**Scenario 4: Domain Analytics**
1. Navigate to /companies
2. Verify three sections: Hot Leads, Opportunity Domains, At-Risk Domains
3. Click on a hot lead domain (e.g., acme.com)
4. Verify drills down to contact list from that domain
5. Export domain contacts to CSV

**Scenario 5: Smart Insights**
1. Load dashboard with varied data
2. Scroll to Insights Panel
3. Verify 3-5 insights displayed
4. Check for color coding: green (good), yellow (warning), red (critical)
5. Click insight action link → verify navigates to filtered view

### 4. Update Agent Context

**Execute**:
```bash
.specify/scripts/powershell/update-agent-context.ps1 -AgentType windsurf
```

**Add to WINDSURF.md**:
- Lead generation analytics patterns
- Supabase computed columns
- date-fns timezone handling
- Multi-select filter state management
- Engagement scoring algorithms
- CSV export strategies

**Output**: `WINDSURF.md` updated in repository root

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

### Setup Tasks (Sequential)
- T001: Update package.json (remove Luxon, add date-fns-tz)
- T002: Apply Supabase migration (email_domain column + indexes) via MCP
- T003: Create new directories (components/analytics, app/companies)

### Migration Tasks (Can be parallel after setup)
- T004: [P] Migrate lib/aggregations.ts to date-fns
- T005: [P] Migrate lib/filters.ts to date-fns
- T006: [P] Migrate lib/format.ts to date-fns
- T007: [P] Migrate lib/excel-parser.ts to date-fns
- T008: [P] Migrate app/page.tsx to date-fns

### Type Definitions (Sequential - shared file)
- T009: Update types/index.ts (add EngagementContact, DomainMetrics, BounceWarning, SmartInsight)
- T010: Update types/index.ts (modify DashboardFilters for multi-select)

### Utility Libraries (Can be parallel)
- T011: [P] Create lib/insights.ts (smart insight rules)
- T012: [P] Create lib/bounce-detection.ts (bounce pattern analysis)
- T013: [P] Create lib/url-state.ts (URL serialization)

### API Endpoints (Can be parallel after types)
- T014: [P] Modify app/api/events/route.ts (add POST with filters)
- T015: [P] Create app/api/analytics/engagement/route.ts
- T016: [P] Create app/api/analytics/domains/route.ts
- T017: [P] Create app/api/analytics/insights/route.ts

### Hooks (Can be parallel after API contracts)
- T018: [P] Create hooks/useEngagement.ts
- T019: [P] Create hooks/useDomainMetrics.ts
- T020: Modify hooks/useDashboardState.ts (multi-select state)

### Core Components (Some parallelizable)
- T021: [P] Create components/analytics/EngagementTable.tsx
- T022: [P] Create components/analytics/DomainInsights.tsx
- T023: [P] Create components/analytics/BounceWarnings.tsx
- T024: [P] Create components/analytics/InsightsPanel.tsx
- T025: Modify components/filters/FilterBar.tsx (multi-select dropdowns)
- T026: Modify components/export/ExportButton.tsx (new export types)

### Pages & Routes (Sequential - depend on components)
- T027: Create app/companies/page.tsx (B2B analytics dashboard)
- T028: Modify app/layout.tsx (add companies nav link)
- T029: Modify app/page.tsx (integrate InsightsPanel, BounceWarnings, multi-select)

### Filter Logic (Sequential - depends on state updates)
- T030: Update lib/filters.ts (multi-select OR logic)
- T031: Update lib/export.ts (add engagement/bounce CSV exports)

### Testing (Parallel after implementation)
- T032: [P] Create tests/e2e/analytics.spec.ts
- T033: [P] Update tests/e2e/dashboard.spec.ts (multi-select scenarios)

### Documentation & Polish
- T034: Update README.md (document new features)
- T035: Create API documentation (endpoint usage examples)

**Ordering Strategy**:
1. Setup first (T001-T003)
2. Date migration next (T004-T008) - unblocks everything
3. Types before implementation (T009-T010)
4. Backend before frontend (APIs → hooks → components)
5. Integration last (pages that compose components)
6. Tests and docs final

**Parallelization**:
- Mark [P] for independent files
- Date migration files can all run parallel
- API endpoints independent
- Most components independent

**Estimated Output**: 35 numbered, dependency-ordered tasks in tasks-lead-gen.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks-lead-gen.md)  
**Phase 4**: Autonomous implementation using:
- Supabase MCP for database changes
- Edit/MultiEdit for code changes
- run_command for npm installs
- Playwright for E2E test verification

**Phase 5**: Validation
- Run all E2E tests
- Execute quickstart scenarios
- Performance validation (query times, bundle size)

## Complexity Tracking
*No complexity violations - leveraging existing architecture*

**Status**: No violations. All changes extend existing patterns.

**Rationale for Architectural Decisions**:
1. **Client-side bounce detection**: Trade-off for simplicity. Server-side would require Supabase Edge Functions or cron jobs, adding complexity for minimal benefit at current scale.
2. **Dedicated /companies route**: Justified by distinct user journey (B2B lead qualification vs. general analytics). Clear separation improves UX and maintainability.
3. **Multi-select client-side**: Data already loaded for real-time filtering. Server-side would add latency without benefit.

## Progress Tracking

**Phase Status**:
- [✅] Phase 0: Research complete (/plan command)
- [✅] Phase 1: Design complete (/plan command)
- [✅] Phase 2: Task planning approach described (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command) - READY
- [ ] Phase 4: Implementation complete (autonomous execution)
- [ ] Phase 5: Validation passed

**Gate Status**:
- [✅] Initial Constitution Check: PASS (no constitution defined)
- [✅] Post-Design Constitution Check: PASS (simplicity maintained)
- [✅] All NEEDS CLARIFICATION resolved: Complete
- [✅] Complexity deviations documented: N/A (no deviations)

**Deliverables**:
- [✅] research-lead-gen.md (6 research topics documented)
- [✅] data-model-lead-gen.md (new types + updated types defined)
- [✅] contracts/ directory (4 API contracts created)
- [✅] quickstart-lead-gen.md (10 test scenarios documented)
- [ ] WINDSURF.md updated (pending)
- [ ] tasks-lead-gen.md (ready for /tasks command)

---
*Optimized for autonomous execution using Supabase MCP, file editing tools, and terminal access*
