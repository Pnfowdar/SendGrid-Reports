# Data Model: Dashboard Production Readiness & UX Enhancements

## Core Types (Existing - No Changes)

### EmailEvent
```typescript
export interface EmailEvent {
  sg_event_id: string;
  smtp_id: string;
  email: string;
  event: EventType;
  timestamp: Date;
  category: string[];
  email_account_id?: string;
}

export type EventType =
  | "processed"
  | "delivered"
  | "open"
  | "click"
  | "bounce"
  | "deferred"
  | "dropped"
  | "unsubscribe"
  | "spamreport"
  | "block";
```

### DashboardFilters (Modified for Multi-Select)
```typescript
export interface DashboardFilters {
  dateRange: [Date | null, Date | null];
  category?: string | string[];          // [CHANGED] Now supports multi-select
  email?: string;
  eventType?: EventType | EventType[] | "all";  // [CHANGED] Now supports multi-select
}
```

---

## New Types: Data Persistence

### StorageSchema
```typescript
/**
 * localStorage data structure with versioning for schema evolution
 */
export interface StorageSchema {
  version: 1;                         // Schema version for migrations
  data: StoredEvents;                 // Uploaded event data
  uploadedAt: Date;                   // ISO timestamp of upload
  filters?: DashboardFilters;         // Last applied filters (session restore)
}

export type StoredEvents = Array<EmailEvent & { uploadedAt: Date }>;

/**
 * Storage key constant
 */
export const STORAGE_KEY = 'sendgrid-dashboard-v1';
```

### StorageQuota
```typescript
/**
 * localStorage quota management
 */
export interface StorageQuota {
  usage: number;           // Bytes used
  quota: number;           // Total quota (browser-dependent)
  percentage: number;      // Usage percentage (0-100)
  isNearLimit: boolean;    // True if >80% used
  isExceeded: boolean;     // True if write failed due to quota
}

export interface StorageManager {
  save(data: StorageSchema): Promise<StorageQuota>;
  load(): Promise<StorageSchema | null>;
  clear(): Promise<void>;
  getQuota(): Promise<StorageQuota>;
}
```

---

## New Types: URL State Management

### URLParams
```typescript
/**
 * Query parameter schema for URL sharing
 * Short keys minimize URL length
 */
export interface URLParams {
  e?: string;              // email filter
  c?: string;              // categories (comma-separated)
  t?: string;              // event types (comma-separated)
  sd?: string;             // start date (YYYY-MM-DD)
  ed?: string;             // end date (YYYY-MM-DD)
  g?: 'daily' | 'weekly' | 'monthly';  // granularity
}

/**
 * URL state serialization/deserialization
 */
export interface URLStateManager {
  encode(filters: DashboardFilters, granularity?: string): URLSearchParams;
  decode(params: URLSearchParams): Partial<DashboardFilters> & { granularity?: string };
  isTooLong(params: URLSearchParams): boolean;  // Check if >2000 chars
}
```

---

## New Types: Error Boundaries

### ErrorContext
```typescript
/**
 * Error boundary state and logging context
 */
export interface ErrorContext {
  componentName: string;   // Name of failed component
  error: Error;            // Caught error object
  errorInfo: React.ErrorInfo;  // React error info
  timestamp: Date;         // When error occurred
  userAction?: string;     // What user was doing (if known)
}

export interface ErrorBoundaryProps {
  name: string;            // Identifier for this boundary
  fallback?: React.ComponentType<ErrorFallbackProps>;  // Custom error UI
  onError?: (context: ErrorContext) => void;  // Error callback
  children: React.ReactNode;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;  // Retry/reset function
  componentName: string;
}
```

---

## New Types: Loading States

### LoadingState
```typescript
/**
 * Loading state for async operations and skeleton loaders
 */
export type LoadingState = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'error';

export interface AsyncState<T> {
  status: LoadingState;
  data: T | null;
  error: Error | null;
}

/**
 * Component-specific loading states
 */
export interface DashboardLoadingStates {
  upload: LoadingState;
  metrics: LoadingState;
  figures: LoadingState;
  charts: LoadingState;
  activity: LoadingState;
  categories: LoadingState;
}
```

---

## New Types: Insights Dashboard

### InsightRule
```typescript
/**
 * Rule definition for automated insights
 */
export interface InsightRule {
  id: string;
  name: string;
  description: string;
  evaluate: (events: EmailEvent[]) => InsightResult | null;
  severity: InsightSeverity;
}

export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface InsightResult {
  ruleId: string;
  title: string;
  message: string;
  severity: InsightSeverity;
  value?: number;             // Optional numeric value (e.g., bounce rate %)
  threshold?: number;         // Optional threshold that was exceeded
  recommendation?: string;    // Optional action item
  affectedCount?: number;     // Optional count of affected events/users
}

/**
 * Collection of insights for display
 */
export interface InsightsPanelData {
  insights: InsightResult[];
  generatedAt: Date;
  eventCount: number;         // Number of events analyzed
}
```

### Built-in Insight Rules
```typescript
/**
 * Pre-configured insight rules
 */
export const INSIGHT_RULES: InsightRule[] = [
  {
    id: 'bounce-rate',
    name: 'Bounce Rate Check',
    description: 'Warns if bounce rate exceeds 5%',
    severity: 'critical',
    evaluate: (events) => {
      const total = events.filter(e => e.event === 'processed').length;
      const bounces = events.filter(e => e.event === 'bounce').length;
      const rate = (bounces / total) * 100;
      if (rate > 5) {
        return {
          ruleId: 'bounce-rate',
          title: 'High Bounce Rate',
          message: `Bounce rate (${rate.toFixed(1)}%) exceeds healthy threshold (5%)`,
          severity: 'critical',
          value: rate,
          threshold: 5,
          affectedCount: bounces,
          recommendation: 'Review email list quality and remove invalid addresses',
        };
      }
      return null;
    },
  },
  // ... more rules defined in src/lib/insights.ts
];
```

---

## New Types: Keyboard Navigation

### KeyboardShortcut
```typescript
/**
 * Keyboard shortcut definitions
 */
export interface KeyboardShortcut {
  key: string;
  modifier?: 'ctrl' | 'alt' | 'shift' | 'meta';
  description: string;
  action: () => void;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: '/',
    description: 'Focus search input',
    action: () => document.querySelector<HTMLInputElement>('[data-search-input]')?.focus(),
  },
  {
    key: 'Escape',
    description: 'Clear all filters',
    action: () => {
      // Dispatch RESET action
    },
  },
  {
    key: '?',
    description: 'Show keyboard shortcuts help',
    action: () => {
      // Open help modal
    },
  },
];
```

---

## New Types: Multi-Select Filters

### MultiSelectFilter
```typescript
/**
 * Multi-select filter state (for categories and event types)
 */
export interface MultiSelectFilter<T> {
  selected: T[];           // Currently selected values
  available: T[];          // All available options
  onChange: (selected: T[]) => void;
  selectAll: () => void;
  clearAll: () => void;
  isAllSelected: boolean;
  isNoneSelected: boolean;
}

/**
 * Filter chip for display
 */
export interface FilterChip {
  id: string;
  label: string;
  type: 'category' | 'eventType' | 'email' | 'date';
  onRemove: () => void;
}
```

---

## Type Updates: Existing Files

### DashboardState (Modified)
```typescript
export interface DashboardState {
  events: EmailEvent[];
  filters: DashboardFilters;      // [CHANGED] Now supports multi-select
  lastUpdated?: Date;
  loadingStates?: DashboardLoadingStates;  // [NEW] Loading tracking
}

export type DashboardAction =
  | { type: "UPLOAD_DATA"; payload: { events: EmailEvent[]; uploadedAt: Date } }
  | { type: "SET_FILTERS"; payload: Partial<DashboardFilters> }
  | { type: "RESET" }
  | { type: "SET_LOADING"; payload: { component: keyof DashboardLoadingStates; state: LoadingState } }  // [NEW]
  | { type: "RESTORE_SESSION"; payload: StorageSchema };  // [NEW]
```

---

## Validation Schema (zod)

### Environment Variables
```typescript
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DASHBOARD_USERNAME: z.string().optional(),
  DASHBOARD_PASSWORD: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Validate at build time
export const env = envSchema.parse(process.env);
```

### Runtime Validations
```typescript
export const storageSchemaValidator = z.object({
  version: z.literal(1),
  data: z.array(z.any()),  // EmailEvent array
  uploadedAt: z.coerce.date(),
  filters: z.any().optional(),
});

export const urlParamsValidator = z.object({
  e: z.string().email().optional(),
  c: z.string().optional(),
  t: z.string().optional(),
  sd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  g: z.enum(['daily', 'weekly', 'monthly']).optional(),
});
```

---

## Type Exports

### src/types/index.ts (Complete Export List)
```typescript
// Existing types (no changes)
export * from './core';  // EmailEvent, EventType, DailyAggregate, etc.

// New persistence types
export * from './storage';  // StorageSchema, StorageQuota, StorageManager

// New URL state types
export * from './url-state';  // URLParams, URLStateManager

// New error boundary types
export * from './error';  // ErrorContext, ErrorBoundaryProps, ErrorFallbackProps

// New loading state types
export * from './loading';  // LoadingState, AsyncState, DashboardLoadingStates

// New insights types
export * from './insights';  // InsightRule, InsightResult, InsightsPanelData

// New keyboard navigation types
export * from './keyboard';  // KeyboardShortcut

// New multi-select filter types
export * from './filters';  // MultiSelectFilter, FilterChip

// Validation schemas
export * from './validation';  // envSchema, storageSchemaValidator, etc.
```

---

## Database Schema (N/A)

This is a client-side application with no database. All data is ephemeral (uploaded via Excel) or persisted in localStorage.

---

## State Transitions

### Data Persistence Flow
```
Initial Load → Check localStorage → Found? → Restore Session → Ready
                                  → Not Found? → Await Upload → Ready

User Uploads → Parse Excel → Validate → Merge Events → Save to localStorage → Update UI

Page Refresh → Load from localStorage → Validate Version → Restore → Ready
                                      → Invalid? → Clear → Await Upload
```

### Filter State Flow
```
User Changes Filter → Debounce 300ms → Update State → Recompute Aggregations
                                                    → Encode to URL (debounce 500ms)
                                                    → Save to localStorage

URL Shared → Load Page → Decode URL Params → Apply Filters → Recompute → Display
```

### Error State Flow
```
Component Crashes → Error Boundary Catches → Log Error → Display Fallback UI

User Clicks "Try Again" → Reset Error State → Re-render Component → Success? → Normal UI
                                                                  → Fail Again? → Show Permanent Error
```

---

## Relationships

### localStorage ↔ DashboardState
- localStorage is the **source of truth** on page load
- DashboardState is synced to localStorage on every update (debounced)
- Version mismatch triggers clear + re-upload flow

### URL Params ↔ DashboardState
- URL params **override** localStorage on initial load
- DashboardState changes **write to** URL (debounced)
- URL params are **transient** (not persisted to localStorage directly)

### Insights ↔ FilteredEvents
- Insights are **computed on-demand** when filters change
- No persistent state (always derived from current filtered events)
- Collapsible panel state persisted to localStorage separately

---

## Performance Considerations

### Data Size Limits
- **localStorage**: 10MB soft limit (browser-dependent)
- **URL params**: 2000 char safe limit
- **Events per session**: 10k-50k target (profiled performance)

### Memoization Strategy
```
Filtered Events → useMemo (key: events + filters)
  ↓
Aggregations → useAggregations hook (single-pass)
  ↓
All Metrics (dailyAggregates, figures, KPIs, funnel, timeseries, categories)
  ↓
Components consume pre-computed metrics (no redundant calculations)
```

### Debounce Timings
- **Text input filters**: 300ms (reduces re-renders)
- **URL updates**: 500ms (prevents excessive history entries)
- **localStorage saves**: 1000ms (batches writes)

---

## Migration Path

### Phase 1: Critical Infrastructure
1. Add new types to `src/types/index.ts`
2. Create `src/lib/storage.ts` and `src/lib/url-state.ts`
3. Update `DashboardState` and `DashboardFilters`
4. Create error boundary components

### Phase 2: Library Updates
1. Remove Luxon from `src/lib/format.ts`
2. Remove Luxon from `src/lib/filters.ts`
3. Remove Luxon from `src/lib/aggregations.ts`
4. Remove Luxon from `src/lib/excel-parser.ts`

### Phase 3: Component Integration
1. Wrap layout with root error boundary
2. Add component-level error boundaries
3. Integrate localStorage in `page.tsx`
4. Integrate URL state in `useDashboardState.ts`

### Phase 4: Features
1. Implement multi-select filters in `FilterBar.tsx`
2. Create `InsightsPanel.tsx`
3. Add keyboard navigation handlers

### Phase 5: Testing & Validation
1. Update E2E tests for new features
2. Add new E2E scenarios (persistence, URL sharing, etc.)
3. Performance profiling and optimization
4. Documentation updates

---

## Validation Rules

### StorageSchema Validation
- `version` must be `1` (future migrations will increment)
- `data` must be valid `StoredEvents` array
- `uploadedAt` must be valid ISO date string
- Total size must not exceed 10MB

### URLParams Validation
- `e` must be valid email format (if present)
- `sd` and `ed` must be YYYY-MM-DD format
- `c` and `t` must be comma-separated valid values
- `g` must be one of: daily, weekly, monthly

### Filter Validation
- Multi-select arrays must not be empty (if present)
- Date range must have start <= end
- Email filter must be valid substring (not full regex)

---

## Summary

This data model extends the existing dashboard with:
1. **Persistence layer** (localStorage with versioning)
2. **URL state management** (shareable links)
3. **Error handling** (boundary types and logging)
4. **Loading states** (skeleton loaders)
5. **Insights** (rule-based analysis)
6. **Multi-select** (advanced filtering)
7. **Keyboard navigation** (shortcuts)
8. **Type safety** (zod validation, strict TypeScript)

All types maintain backward compatibility with existing code while enabling new features.
