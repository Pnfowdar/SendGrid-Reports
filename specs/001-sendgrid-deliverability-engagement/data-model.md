# Data Model: SendGrid Dashboard (MVP - Simplified)

**Feature**: SendGrid Deliverability & Engagement Analytics Dashboard  
**Date**: 2025-10-03  
**Phase**: 1 - Data Model Design (In-Memory TypeScript Types)

---

## Architecture Note

**No Database**: All data stored in React state (useState). Types defined below are for TypeScript only, not database schema.

---

## Core TypeScript Types

### 1. EmailEvent

**Description**: Single row from SendGrid Stats.xlsx

**TypeScript Interface**:
```typescript
interface EmailEvent {
  sg_event_id: string;           // Unique ID for deduplication
  smtp_id: string;                // SendGrid SMTP ID
  email: string;                  // Recipient email
  event: EventType;               // Event type (enum below)
  timestamp: Date;                // Parsed to AEST timezone
  category: string[];             // Campaign tags (parsed from JSON array)
  email_account_id?: string;      // Optional account ID
}

type EventType = 
  | 'processed'
  | 'delivered'
  | 'open'
  | 'click'
  | 'bounce'
  | 'deferred'
  | 'dropped'
  | 'unsubscribe'
  | 'spamreport'
  | 'block';
```

**Validation**:
- Parse Excel columns: Email, Event, Timestamp, SMTP-ID, Category, Email Account ID, sg_event_id
- Convert timestamp strings to Date objects in AEST timezone
- Parse category JSON array string
- Deduplicate by `sg_event_id` (skip duplicates on upload)

---

### 2. DailyAggregate (Computed)

**Description**: Computed from EmailEvent[] for Figures Table

**TypeScript Interface**:
```typescript
interface DailyAggregate {
  date: string;              // YYYY-MM-DD format
  requests: number;          // Count of 'processed' events
  delivered: number;         // Count of 'delivered' events
  opens: number;             // Total 'open' events
  unique_opens: number;      // Distinct emails with ≥1 'open'
  clicks: number;            // Total 'click' events  
  unique_clicks: number;     // Distinct emails with ≥1 'click'
  unsubscribes: number;      // Count of 'unsubscribe' events
  bounces: number;           // Count of 'bounce' events
  spam_reports: number;      // Count of 'spamreport' events
  blocks: number;            // Count of 'block' events
  bounce_drops: number;      // 'dropped' events (bounce reason)
  spam_drops: number;        // 'dropped' events (spam reason)
}
```

**Computation** (from EmailEvent[]):
```typescript
function computeDailyAggregates(events: EmailEvent[]): DailyAggregate[] {
  // Group by date, count by event type
  // Compute unique opens/clicks by distinct email addresses
}
```

---

### 3. CategoryAggregate (Computed)

**TypeScript Interface**:
```typescript
interface CategoryAggregate {
  category: string;          // Category name or "Uncategorized"
  delivered: number;
  unique_opens: number;
  unique_clicks: number;
  unsubscribes: number;
  spam_reports: number;
  open_rate: number;        // (unique_opens / delivered) × 100
  click_rate: number;       // (unique_clicks / delivered) × 100
}
```

---

### 4. Metrics (Computed)

**KPI Cards**:
```typescript
interface KPIMetrics {
  processed: number;
  delivered_pct: number;     // (delivered / (delivered + bounced + blocked)) × 100
  bounced_blocked_pct: number;
  unique_opens_pct: number;  // (unique_opens / delivered) × 100
}
```

**Funnel**:
```typescript
interface FunnelStage {
  stage: 'sent' | 'delivered' | 'unique_opened' | 'unique_clicked';
  count: number;
  conversion_rate: number;  // % from previous stage
}
```

---

## Application State

**Main App State**:
```typescript
interface DashboardState {
  events: EmailEvent[];           // Parsed from Excel
  filters: {
    dateRange: [Date, Date];
    category?: string;
    email?: string;
    eventType?: EventType;
  };
}
```

**Derived State** (computed via useMemo):
- `filteredEvents` - Apply filters to events[]
- `dailyAggregates` - Compute from filteredEvents
- `categoryAggregates` - Compute from filteredEvents  
- `kpiMetrics` - Compute from filteredEvents
- `funnelStages` - Compute from filteredEvents

---

## MVP Simplifications

**Removed from original plan**:
- ❌ Database schema (PostgreSQL)
- ❌ API endpoints
- ❌ Authentication/authorization
- ❌ Email masking
- ❌ Server-side processing

**What we're building**:
- ✅ TypeScript interfaces only
- ✅ In-memory data (React state)
- ✅ Client-side computations
- ✅ Simple and fast
