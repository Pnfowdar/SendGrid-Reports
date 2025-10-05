# Tasks: Lead Generation Analytics & Insights

**Feature**: Lead Generation Analytics  
**Plan**: [plan-lead-gen.md](./plan-lead-gen.md)  
**Date**: 2025-10-05

---

## Task Execution Guide

**Dependency Order**: Setup → Types → Libraries → APIs → Components → Pages → Tests  
**Parallelization**: Tasks marked [P] can run in parallel within their group  
**Autonomous Execution**: All tasks use Supabase MCP, MultiEdit, and run_command tools

---

## Phase 1: Setup & Dependencies (Sequential)

### T001: Update Package Dependencies
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\package.json`  
**Action**: Remove Luxon, add date-fns-tz  
**Dependencies**: None

```bash
# Remove Luxon
npm uninstall luxon @types/luxon

# Add date-fns-tz
npm install date-fns-tz@2.0.1

# Verify
npm list date-fns date-fns-tz
```

**Verification**: 
- package.json no longer contains "luxon"
- date-fns-tz added to dependencies
- npm install runs without errors

---

### T002: Apply Supabase Database Migration
**Action**: Add email_domain computed column via Supabase MCP  
**Dependencies**: T001  
**Tool**: `mcp4_apply_migration`

```typescript
// Use Supabase MCP to apply migration
await mcp4_apply_migration({
  project_id: "<get from env SUPABASE_PROJECT_ID>",
  name: "add_email_domain_and_indexes",
  query: `
    -- Add computed column for email domain
    ALTER TABLE sendgrid_events 
    ADD COLUMN IF NOT EXISTS email_domain TEXT 
    GENERATED ALWAYS AS (
      SUBSTRING("Email" FROM '@(.*)$')
    ) STORED;
    
    -- Create performance indexes
    CREATE INDEX IF NOT EXISTS idx_sendgrid_events_email_domain 
    ON sendgrid_events(email_domain);
    
    CREATE INDEX IF NOT EXISTS idx_sendgrid_events_email 
    ON sendgrid_events("Email");
    
    CREATE INDEX IF NOT EXISTS idx_sendgrid_events_event 
    ON sendgrid_events("Event");
    
    -- Verify indexes created
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'sendgrid_events';
  `
});
```

**Verification**:
- Query Supabase table editor → email_domain column exists
- Run `SELECT email_domain FROM sendgrid_events LIMIT 5` → returns domains
- Indexes visible in Supabase dashboard

---

### T003: Create New Directory Structure
**Action**: Create directories for new components  
**Dependencies**: None  
**Tool**: `run_command`

```bash
cd d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src

# Create analytics components directory
mkdir -p components\analytics

# Create companies route
mkdir -p app\companies

# Create analytics API routes
mkdir -p app\api\analytics\engagement
mkdir -p app\api\analytics\domains
mkdir -p app\api\analytics\insights

# Create new types files directory (if needed)
# mkdir -p types

# Verify
dir components\analytics
dir app\companies
dir app\api\analytics
```

**Verification**: All directories created successfully

---

## Phase 2: Date Library Migration (Parallel after T001)

### T004: [P] Migrate lib/aggregations.ts to date-fns
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\lib\aggregations.ts`  
**Dependencies**: T001  
**Tool**: MultiEdit

**Changes**:
1. Replace `import { DateTime } from "luxon"` with `import { formatInTimeZone } from "date-fns-tz"`
2. Replace `DateTime.fromJSDate(date, { zone: TIMEZONE }).toISODate()` with `formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd")`
3. Update `dateKey()` function
4. Test timezone handling

**Verification**:
- No Luxon imports
- `npm run build` succeeds
- Dates format correctly (YYYY-MM-DD)

---

### T005: [P] Migrate lib/filters.ts to date-fns
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\lib\filters.ts`  
**Dependencies**: T001  
**Tool**: MultiEdit

**Changes**:
1. Replace Luxon DateTime with date-fns
2. Update date comparison logic
3. Update timezone handling

**Verification**: Filter logic works correctly with date-fns

---

### T006: [P] Migrate lib/format.ts to date-fns
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\lib\format.ts`  
**Dependencies**: T001  
**Tool**: MultiEdit

**Changes**:
1. Replace Luxon with date-fns `format` function
2. Update all date formatting functions
3. Maintain Australia/Brisbane timezone

**Verification**: All date formats match previous output

---

### T007: [P] Migrate lib/excel-parser.ts to date-fns
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\lib\excel-parser.ts`  
**Dependencies**: T001  
**Tool**: MultiEdit

**Changes**:
1. Replace Luxon DateTime parsing
2. Update Excel date conversion
3. Test with sample Excel file

**Verification**: Excel parsing works, dates correct

---

### T008: [P] Migrate app/page.tsx to date-fns
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\app\page.tsx`  
**Dependencies**: T001  
**Tool**: MultiEdit

**Changes**:
1. Remove `import { DateTime } from "luxon"` (line 6)
2. Update any DateTime usages (if present)

**Verification**: Dashboard page loads without errors

---

## Phase 3: Type Definitions (Sequential - shared file)

### T009: Add New Analytics Types
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\types\index.ts`  
**Dependencies**: T004-T008  
**Tool**: Edit

**Add**:
```typescript
// Engagement Analytics
export interface EngagementContact {
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
  days_since_last_activity: number;
  engagement_score: number;
  tier: 'hot' | 'warm' | 'cold';
}

// Domain Analytics
export interface DomainMetrics {
  domain: string;
  unique_contacts: number;
  top_contacts: string[];
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  total_bounces: number;
  avg_open_rate: number;
  avg_click_rate: number;
  bounce_rate: number;
  trend: 'hot' | 'warm' | 'cold' | 'problematic';
  first_contact: Date;
  last_activity: Date;
}

// Bounce Warnings
export interface BounceWarning {
  email: string;
  domain: string;
  bounce_count: number;
  bounce_types: EventType[];
  first_bounce: Date;
  last_bounce: Date;
  days_bouncing: number;
  severity: 'warning' | 'critical';
  action_required: 'monitor' | 'suppress';
}

// Smart Insights
export type InsightType = 'engagement' | 'bounce' | 'trend' | 'opportunity' | 'risk';
export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface SmartInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  metric?: number;
  metric_label?: string;
  action?: {
    label: string;
    type: 'navigate' | 'export' | 'filter';
    href?: string;
    exportType?: 'hot-leads' | 'bounce-list' | 'domain-contacts' | 'opportunity-leads';
    filters?: Partial<DashboardFilters>;
  };
  generated_at: Date;
  data_period: {
    start: Date;
    end: Date;
  };
}
```

**Verification**: TypeScript compilation succeeds

---

### T010: Update DashboardFilters for Multi-Select
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\types\index.ts`  
**Dependencies**: T009  
**Tool**: Edit

**Change**:
```typescript
// BEFORE
export interface DashboardFilters {
  dateRange: [Date | null, Date | null];
  category?: string;
  email?: string;
  eventType?: EventType | "all";
}

// AFTER
export interface DashboardFilters {
  dateRange: [Date | null, Date | null];
  categories: string[];
  emails: string[];
  eventTypes: EventType[];
}
```

**Verification**: No TypeScript errors, filters type updated

---

## Phase 4: Utility Libraries (Parallel after T009-T010)

### T011: [P] Create lib/insights.ts
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\lib\insights.ts`  
**Dependencies**: T009-T010  
**Tool**: write_to_file

See `contracts/analytics-insights.md` for insight rule implementations.

**Functions**:
- `evaluateBounceWarnings()`
- `evaluateHotLeads()`
- `evaluateTrendDecline()`
- `evaluateOpportunityDomains()`
- `evaluateRiskDomains()`
- `generateInsights()` - main entry point

**Verification**: All insight rules compile and return correct types

---

### T012: [P] Create lib/bounce-detection.ts
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\lib\bounce-detection.ts`  
**Dependencies**: T009-T010  
**Tool**: write_to_file

```typescript
import type { EmailEvent, BounceWarning, EventType } from "@/types";

export const BOUNCE_THRESHOLDS = {
  WARNING: 3,
  CRITICAL: 5,
} as const;

export function detectBounces(events: EmailEvent[]): BounceWarning[] {
  const bouncesByEmail = new Map<string, EmailEvent[]>();
  
  // Group bounce events by email
  events.forEach(e => {
    if (['bounce', 'dropped', 'block'].includes(e.event)) {
      const existing = bouncesByEmail.get(e.email) || [];
      bouncesByEmail.set(e.email, [...existing, e]);
    }
  });
  
  // Generate warnings
  const warnings: BounceWarning[] = [];
  
  bouncesByEmail.forEach((bounceEvents, email) => {
    if (bounceEvents.length < BOUNCE_THRESHOLDS.WARNING) return;
    
    const domain = email.split('@')[1] || '';
    const sortedEvents = bounceEvents.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    warnings.push({
      email,
      domain,
      bounce_count: bounceEvents.length,
      bounce_types: [...new Set(bounceEvents.map(e => e.event))],
      first_bounce: sortedEvents[0].timestamp,
      last_bounce: sortedEvents[sortedEvents.length - 1].timestamp,
      days_bouncing: Math.floor(
        (sortedEvents[sortedEvents.length - 1].timestamp.getTime() - 
         sortedEvents[0].timestamp.getTime()) / (1000 * 60 * 60 * 24)
      ),
      severity: bounceEvents.length >= BOUNCE_THRESHOLDS.CRITICAL 
        ? 'critical' 
        : 'warning',
      action_required: bounceEvents.length >= BOUNCE_THRESHOLDS.CRITICAL 
        ? 'suppress' 
        : 'monitor',
    });
  });
  
  return warnings.sort((a, b) => b.bounce_count - a.bounce_count);
}
```

**Verification**: Bounce detection logic works correctly

---

### T013: [P] Create lib/url-state.ts
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\lib\url-state.ts`  
**Dependencies**: T009-T010  
**Tool**: write_to_file

```typescript
import type { DashboardFilters, EventType } from "@/types";
import { format, parseISO } from "date-fns";

export const URL_CONSTRAINTS = {
  MAX_LENGTH: 2000,
  WARNING_LENGTH: 1800,
  SAFE_LENGTH: 1500,
} as const;

export function encodeFiltersToURL(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.categories.length > 0) {
    params.set('c', filters.categories.join(','));
  }
  
  if (filters.eventTypes.length > 0) {
    params.set('t', filters.eventTypes.join(','));
  }
  
  if (filters.emails.length > 0) {
    params.set('e', filters.emails.join(','));
  }
  
  if (filters.dateRange[0]) {
    params.set('sd', format(filters.dateRange[0], 'yyyy-MM-dd'));
  }
  
  if (filters.dateRange[1]) {
    params.set('ed', format(filters.dateRange[1], 'yyyy-MM-dd'));
  }
  
  return params;
}

export function decodeFiltersFromURL(params: URLSearchParams): Partial<DashboardFilters> {
  const filters: Partial<DashboardFilters> = {
    categories: [],
    emails: [],
    eventTypes: [],
    dateRange: [null, null],
  };
  
  const categories = params.get('c');
  if (categories) {
    filters.categories = categories.split(',').filter(Boolean);
  }
  
  const eventTypes = params.get('t');
  if (eventTypes) {
    filters.eventTypes = eventTypes.split(',').filter(Boolean) as EventType[];
  }
  
  const emails = params.get('e');
  if (emails) {
    filters.emails = emails.split(',').filter(Boolean);
  }
  
  const startDate = params.get('sd');
  if (startDate) {
    filters.dateRange![0] = parseISO(startDate);
  }
  
  const endDate = params.get('ed');
  if (endDate) {
    filters.dateRange![1] = parseISO(endDate);
  }
  
  return filters;
}

export function checkURLLength(params: URLSearchParams): {
  isValid: boolean;
  length: number;
  warning?: string;
} {
  const url = params.toString();
  const length = url.length;
  
  if (length > URL_CONSTRAINTS.MAX_LENGTH) {
    return {
      isValid: false,
      length,
      warning: 'URL too long. Some filters may not persist. Consider reducing selections.',
    };
  }
  
  if (length > URL_CONSTRAINTS.WARNING_LENGTH) {
    return {
      isValid: true,
      length,
      warning: 'URL approaching maximum length. Consider reducing selections.',
    };
  }
  
  return { isValid: true, length };
}
```

**Verification**: URL encoding/decoding works correctly

---

## Phase 5: API Endpoints (Parallel after T009-T013)

### T014: [P] Enhance app/api/events/route.ts (Add POST)
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\app\api\events\route.ts`  
**Dependencies**: T009-T013  
**Tool**: Edit

Add POST handler for filtered events. See `contracts/events-api.md` for implementation.

**Verification**: POST /api/events returns filtered results

---

### T015: [P] Create app/api/analytics/engagement/route.ts
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\app\api\analytics\engagement\route.ts`  
**Dependencies**: T002, T009-T013  
**Tool**: write_to_file

See `contracts/analytics-engagement.md` for SQL query and implementation.

**Verification**: GET /api/analytics/engagement returns engagement scores

---

### T016: [P] Create app/api/analytics/domains/route.ts
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\app\api\analytics\domains\route.ts`  
**Dependencies**: T002, T009-T013  
**Tool**: write_to_file

See `contracts/analytics-domains.md` for SQL query and implementation.

**Verification**: GET /api/analytics/domains returns domain metrics

---

### T017: [P] Create app/api/analytics/insights/route.ts
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\app\api\analytics\insights\route.ts`  
**Dependencies**: T011, T015, T016  
**Tool**: write_to_file

```typescript
import { NextResponse } from "next/server";
import { generateInsights } from "@/lib/insights";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Fetch recent events for insights
    const { data: events, error } = await supabase
      .from('sendgrid_events')
      .select('*')
      .gte('Timestamp', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('Timestamp', { ascending: false });
    
    if (error) throw error;
    
    // Generate insights
    const insights = await generateInsights(events || []);
    
    return NextResponse.json({
      insights,
      generated_at: new Date().toISOString(),
      rules_evaluated: [
        'bounce-warning',
        'hot-leads',
        'trend-analysis',
        'opportunity-domains',
        'risk-domains',
      ],
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
```

**Verification**: GET /api/analytics/insights returns smart insights

---

## Phase 6: React Hooks (Parallel after T014-T017)

### T018: [P] Create hooks/useEngagement.ts
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\hooks\useEngagement.ts`  
**Dependencies**: T009, T015  
**Tool**: write_to_file

```typescript
import { useState, useEffect } from 'react';
import type { EngagementContact } from '@/types';

export function useEngagement(limit: number = 50) {
  const [data, setData] = useState<EngagementContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchEngagement() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/analytics/engagement?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch engagement data');
        const json = await res.json();
        setData(json.contacts || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEngagement();
  }, [limit]);
  
  return { data, isLoading, error };
}
```

**Verification**: Hook fetches and returns engagement data

---

### T019: [P] Create hooks/useDomainMetrics.ts
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\hooks\useDomainMetrics.ts`  
**Dependencies**: T009, T016  
**Tool**: write_to_file

```typescript
import { useState, useEffect } from 'react';
import type { DomainMetrics } from '@/types';

export function useDomainMetrics(trend?: string, minContacts: number = 3) {
  const [data, setData] = useState<DomainMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchDomains() {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (trend) params.set('trend', trend);
        params.set('minContacts', minContacts.toString());
        
        const res = await fetch(`/api/analytics/domains?${params}`);
        if (!res.ok) throw new Error('Failed to fetch domain metrics');
        const json = await res.json();
        setData(json.domains || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDomains();
  }, [trend, minContacts]);
  
  return { data, isLoading, error };
}
```

**Verification**: Hook fetches and returns domain metrics

---

### T020: Update hooks/useDashboardState.ts for Multi-Select
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\hooks\useDashboardState.ts`  
**Dependencies**: T010  
**Tool**: Edit

**Changes**:
1. Update initial state filters to arrays
2. Update reducer to handle array filters
3. Add migration logic for old localStorage format

**Verification**: State management handles multi-select correctly

---

## Phase 7: Analytics Components (Parallel after T018-T020)

### T021: [P] Create components/analytics/EngagementTable.tsx
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\components\analytics\EngagementTable.tsx`  
**Dependencies**: T009, T018  
**Tool**: write_to_file

**Component**: Table displaying top engagement contacts with:
- Columns: Email, Domain, Opens, Clicks, Engagement Score, Tier
- Color-coded tier badges (hot=green, warm=yellow, cold=gray)
- Sortable columns
- Virtual scrolling for performance

**Verification**: Table displays engagement data correctly

---

### T022: [P] Create components/analytics/DomainInsights.tsx
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\components\analytics\DomainInsights.tsx`  
**Dependencies**: T009, T019  
**Tool**: write_to_file

**Component**: Domain analytics display with:
- Three sections: Hot Leads, Opportunity Domains, At-Risk Domains
- Domain cards with metrics
- Export buttons for each section
- Drill-down to contact list

**Verification**: Component displays domain metrics correctly

---

### T023: [P] Create components/analytics/BounceWarnings.tsx
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\components\analytics/BounceWarnings.tsx`  
**Dependencies**: T009, T012  
**Tool**: write_to_file

**Component**: Bounce warning badges and list with:
- Red/yellow badges next to problematic emails
- Bounce count tooltip
- Export suppression list button

**Verification**: Bounce warnings display correctly

---

### T024: [P] Create components/analytics/InsightsPanel.tsx
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\components\analytics\InsightsPanel.tsx`  
**Dependencies**: T009, T017  
**Tool**: write_to_file

**Component**: Smart insights panel with:
- 3-5 insight cards
- Color-coded severity badges
- Actionable buttons (navigate/export/filter)
- Collapsible panel
- Loading skeleton

**Verification**: Insights panel displays and actions work

---

### T025: Update components/filters/FilterBar.tsx for Multi-Select
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\components\filters\FilterBar.tsx`  
**Dependencies**: T010, T020  
**Tool**: Edit

**Changes**:
1. Replace single-select dropdown with multi-select checkboxes
2. Add chip/tag display for selected items
3. Add "Select All" / "Clear All" buttons
4. Integrate URL state sync

**Verification**: Multi-select filters work, URL updates

---

### T026: Update components/export/ExportButton.tsx
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\components\export\ExportButton.tsx`  
**Dependencies**: T009  
**Tool**: Edit

**Add Export Types**:
- Hot Leads CSV
- Bounce List CSV
- Domain Contacts CSV

**Verification**: New export types generate correct CSVs

---

## Phase 8: Pages & Routes (Sequential after T021-T026)

### T027: Create app/companies/page.tsx
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\app\companies\page.tsx`  
**Dependencies**: T022  
**Tool**: write_to_file

**Page**: B2B analytics dashboard with DomainInsights component.

**Verification**: /companies route loads and displays domain analytics

---

### T028: Update app/layout.tsx (Add Navigation Link)
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\app\layout.tsx`  
**Dependencies**: T027  
**Tool**: Edit

**Add**: "Companies" navigation link in header/sidebar.

**Verification**: Navigation link appears and routes correctly

---

### T029: Update app/page.tsx (Integrate New Components)
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\app\page.tsx`  
**Dependencies**: T023, T024, T025  
**Tool**: Edit

**Changes**:
1. Add InsightsPanel below header
2. Integrate BounceWarnings into ActivityFeed
3. Update FilterBar usage for multi-select
4. Add URL state sync

**Verification**: Dashboard integrates all new components

---

## Phase 9: Filter Logic & Export Enhancements (Sequential after T029)

### T030: Update lib/filters.ts for Multi-Select OR Logic
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\lib\filters.ts`  
**Dependencies**: T010, T029  
**Tool**: Edit

**Changes**:
1. Update `filterEvents()` to handle array filters
2. Implement OR logic: `(cat1 OR cat2) AND (event1 OR event2)`
3. Test with multiple selections

**Verification**: Filter logic works correctly with multi-select

---

### T031: Update lib/export.ts (Add New Export Functions)
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\src\lib\export.ts`  
**Dependencies**: T009, T026  
**Tool**: Edit

**Add Functions**:
- `exportEngagementCsv(contacts: EngagementContact[])`
- `exportBounceCsv(warnings: BounceWarning[])`
- `exportDomainContactsCsv(domain: string, contacts: EngagementContact[])`

**Verification**: Export functions generate correct CSV files

---

## Phase 10: Testing & Documentation (Parallel after T030-T031)

### T032: [P] Create tests/e2e/analytics.spec.ts
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\tests\e2e\analytics.spec.ts`  
**Dependencies**: T027, T029  
**Tool**: write_to_file

**Test Scenarios**:
1. Engagement table loads and displays data
2. Domain analytics sections render correctly
3. Bounce warnings appear for problematic emails
4. Insights panel displays and actions work
5. CSV exports download correctly

**Verification**: All E2E tests pass

---

### T033: [P] Update tests/e2e/dashboard.spec.ts
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\tests\e2e\dashboard.spec.ts`  
**Dependencies**: T025, T029  
**Tool**: Edit

**Add Tests**:
1. Multi-select filters work
2. URL sharing persists state
3. Selected items display as chips
4. Clear All resets filters

**Verification**: Updated tests pass

---

### T034: Update README.md
**File**: `d:\Projects\SendGrid-Reporting\README.md`  
**Dependencies**: All previous tasks  
**Tool**: Edit

**Add Sections**:
- Lead Generation Analytics features
- Companies dashboard usage
- API endpoints documentation
- CSV export types

**Verification**: Documentation clear and complete

---

### T035: Create API Documentation
**File**: `d:\Projects\SendGrid-Reporting\sendgrid-dashboard\API.md` (new file)  
**Dependencies**: T014-T017  
**Tool**: write_to_file

**Content**: Document all analytics API endpoints with examples from contracts.

**Verification**: API docs comprehensive

---

## Execution Summary

**Total Tasks**: 35  
**Estimated Time**: 6-8 hours (autonomous execution)  
**Critical Path**: T001 → T002 → T004-T008 → T009-T010 → T014-T017 → T027 → T029

**Parallel Execution Groups**:
- Group 1 (after T001): T004, T005, T006, T007, T008 (date migration)
- Group 2 (after T009-T010): T011, T012, T013 (utilities)
- Group 3 (after T013): T014, T015, T016, T017 (APIs)
- Group 4 (after T017): T018, T019 (hooks)
- Group 5 (after T020): T021, T022, T023, T024 (components)
- Group 6 (final): T032, T033 (tests)

**Success Criteria**:
- ✅ All tasks complete without errors
- ✅ Bundle size reduced by 40KB+
- ✅ All E2E tests pass
- ✅ API response times <500ms
- ✅ No TypeScript errors
- ✅ Supabase migration applied successfully

---
**Ready for Autonomous Execution** | **Use Supabase MCP, MultiEdit, and run_command**
