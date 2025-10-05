# Research: Dashboard Production Readiness & UX Enhancements

## 1. localStorage Best Practices

### Decision
Use localStorage with quota management, versioning, and graceful degradation.

### Rationale
- **Quota Management**: Proactive warnings prevent sudden failures
- **Data Versioning**: Schema changes won't break existing stored data
- **Graceful Degradation**: Safari private mode and quota exceeded handled
- **Performance**: localStorage is synchronous but fast for <10MB

### Implementation Pattern
```typescript
interface StorageSchema {
  version: 1;
  data: StoredEvents;
  uploadedAt: Date;
  filters?: DashboardFilters; // For session restoration
}

// Check quota: navigator.storage.estimate() for supported browsers
// Fallback: try-catch on setItem with quota exceeded handling
```

### Alternatives Considered
- **IndexedDB**: More complex API, async overhead for simple key-value storage
- **sessionStorage**: Lost on tab close, not suitable for persistent data
- **Backend storage**: Out of scope for pure client-side MVP

### References
- MDN localStorage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- Storage quota: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate

---

## 2. Date Library Migration (Luxon → date-fns)

### Decision
Complete migration to date-fns, remove Luxon entirely.

### Rationale
- **Bundle Size**: Luxon ~60KB, date-fns ~11KB tree-shakeable (saves ~50KB)
- **API Similarity**: Both use functional APIs, migration straightforward
- **Timezone Handling**: date-fns with `date-fns-tz` handles IANA zones
- **Already Used**: date-fns already in `useDashboardState.ts`, reduce duplication

### API Mapping
| Luxon | date-fns | Notes |
|-------|----------|-------|
| `DateTime.fromJSDate(date, {zone})` | `formatInTimeZone(date, tz, format)` | Requires date-fns-tz |
| `DateTime.fromISO(str, {zone})` | `parseISO(str)` + `utcToZonedTime` | Two-step process |
| `dt.toFormat('dd LLL yyyy')` | `format(date, 'dd MMM yyyy')` | Slightly different tokens |
| `dt.toISODate()` | `format(date, 'yyyy-MM-dd')` | Manual formatting |
| `startOfDay(dt)` | `startOfDay(date)` | Direct equivalent |

### Migration Strategy
1. Install `date-fns-tz` for timezone support
2. Replace Luxon in `format.ts` first (isolated, well-tested)
3. Then `filters.ts`, `aggregations.ts`, `excel-parser.ts`
4. Remove Luxon from package.json last
5. Run full E2E suite after each file migration

### Alternatives Considered
- **Keep both**: Unacceptable bundle bloat, confusing for developers
- **Migrate to Day.js**: Smaller than Luxon but heavier than date-fns
- **Native Date API**: Insufficient for timezone-aware formatting

### Breaking Changes
- None for end users (dates still display identically)
- Potential for subtle timezone bugs → extensive testing required

### References
- date-fns docs: https://date-fns.org/docs/
- date-fns-tz: https://github.com/marnusw/date-fns-tz
- Bundle size comparison: https://bundlephobia.com/

---

## 3. Error Boundary Patterns

### Decision
Implement two-tier error boundary strategy: root-level + component-level.

### Rationale
- **Isolation**: Component boundaries prevent cascading failures
- **Granularity**: Different error UIs for different contexts (upload vs charts)
- **Logging**: Centralized error tracking at root level
- **UX**: Partial degradation better than blank page

### Error Boundary Hierarchy
```
<RootErrorBoundary>        // layout.tsx - catches all unhandled errors
  <DashboardShell>
    <ErrorBoundary name="upload">
      <UploadDropzone />   // Can crash independently
    </ErrorBoundary>
    <ErrorBoundary name="filters">
      <FilterBar />        // Can crash independently
    </ErrorBoundary>
    <ErrorBoundary name="metrics">
      <MetricsPanel />     // Can crash independently
    </ErrorBoundary>
    // ... etc
  </DashboardShell>
</RootErrorBoundary>
```

### Component Error Boundary Template
```typescript
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error(`[${this.props.name}]`, error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

### Alternatives Considered
- **Single root boundary**: Too coarse-grained, entire app breaks
- **react-error-boundary library**: Adds dependency for simple use case
- **No boundaries**: Unacceptable - one crash breaks everything

### React 19 Considerations
- `getDerivedStateFromError` still supported
- `componentDidCatch` for logging remains best practice
- Future: Error boundary hooks (not stable yet)

### References
- React Error Boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- React 19 changes: https://react.dev/blog/2024/12/05/react-19

---

## 4. URL State Management

### Decision
Use Next.js `useRouter` + `URLSearchParams` for bidirectional state sync.

### Rationale
- **Native API**: No additional libraries required
- **Browser History**: Back/forward navigation works automatically
- **Shareable Links**: Copy URL = share exact view
- **Next.js Integration**: `useRouter` provides push/replace methods

### URL Schema
```
Short codes to minimize URL length:
?e=test@example.com         // email filter
&c=Welcome,Marketing        // comma-separated categories
&t=open,click               // comma-separated event types
&sd=2024-01-01              // start date (ISO)
&ed=2024-01-31              // end date (ISO)
&g=weekly                   // granularity
```

### Implementation Pattern
```typescript
// Encode filters to URL
const encodeFilters = (filters: DashboardFilters): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters.email) params.set('e', filters.email);
  if (filters.category) params.set('c', filters.category);
  // ... etc
  return params;
};

// Decode URL to filters
const decodeFilters = (searchParams: URLSearchParams): Partial<DashboardFilters> => {
  return {
    email: searchParams.get('e') || undefined,
    category: searchParams.get('c') || undefined,
    // ... etc
  };
};

// Sync on filter change (debounced)
useEffect(() => {
  const timeout = setTimeout(() => {
    const params = encodeFilters(filters);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, 500); // Debounce 500ms to avoid excessive history entries
  return () => clearTimeout(timeout);
}, [filters]);

// Restore on page load
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const urlFilters = decodeFilters(params);
  if (Object.keys(urlFilters).length > 0) {
    dispatch({ type: 'SET_FILTERS', payload: urlFilters });
  }
}, []);
```

### URL Length Limits
- **Browser limits**: ~2000 chars (IE), ~64KB (modern browsers)
- **Practical limit**: Keep under 2000 chars for compatibility
- **Overflow handling**: Show warning "Filters too complex for URL sharing"

### Alternatives Considered
- **Hash fragments**: Not indexed by servers, breaks analytics
- **Base64 JSON**: More compact but not human-readable
- **Short URLs (backend)**: Requires backend, out of scope

### References
- Next.js router: https://nextjs.org/docs/app/api-reference/functions/use-router
- URLSearchParams: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams

---

## 5. File Upload Security

### Decision
Multi-layer validation: MIME type + file signature + size limit + content sanitization.

### Rationale
- **Defense in Depth**: Multiple checks prevent bypass attacks
- **MIME Type**: First line of defense, easily spoofed
- **File Signature**: ZIP magic bytes (`50 4B 03 04`) for .xlsx files
- **Size Limit**: Prevent DoS via large files
- **Content Sanitization**: XSS prevention in parsed strings

### Implementation Pattern
```typescript
// 1. MIME type check
if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
  throw new Error('Invalid file type');
}

// 2. Size check
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
if (file.size > MAX_SIZE) {
  throw new Error('File too large (max 10MB)');
}

// 3. File signature check
const buffer = await file.slice(0, 4).arrayBuffer();
const signature = new Uint8Array(buffer);
if (signature[0] !== 0x50 || signature[1] !== 0x4B || signature[2] !== 0x03 || signature[3] !== 0x04) {
  throw new Error('Invalid file format (not a valid ZIP)');
}

// 4. Content sanitization (in excel-parser.ts)
const sanitize = (str: string) => str.replace(/[<>]/g, '');
const email = sanitize(cell.text);
```

### Content Security Policy
Add to `next.config.ts`:
```typescript
headers: async () => [{
  source: '/:path*',
  headers: [
    {
      key: 'Content-Security-Policy',
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires eval
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
      ].join('; '),
    },
  ],
}]
```

### Alternatives Considered
- **Extension-only check**: Easily bypassed (rename .exe to .xlsx)
- **Server-side validation**: Out of scope, client-side only
- **Antivirus scanning**: Requires third-party service, excessive for Excel files

### References
- File signatures: https://en.wikipedia.org/wiki/List_of_file_signatures
- CSP: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- OWASP File Upload: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html

---

## 6. Performance Optimization

### Decision
Consolidate aggregation computation into single-pass hook with selective memoization.

### Rationale
- **Single Pass**: Iterate events once, compute all metrics simultaneously
- **Reduced Re-renders**: Memoize at hook level, not per-aggregation
- **Web Workers**: Spike for 10k+ events, defer if complexity high
- **Profiling First**: Use React DevTools to identify actual bottlenecks

### Current Inefficiency
```typescript
// BEFORE: Multiple passes over same data
const dailyAggregates = useMemo(() => computeDailyAggregates(filteredEvents), [filteredEvents]);
const figures = useMemo(() => rollupAggregates(dailyAggregates, granularity), [dailyAggregates]);
const metrics = useMemo(() => computeKpiMetrics(filteredEvents), [filteredEvents]);
const funnel = useMemo(() => computeFunnelStages(filteredEvents), [filteredEvents]);
const timeseries = useMemo(() => computeTimeseries(filteredEvents), [filteredEvents]);
const categories = useMemo(() => computeCategoryAggregates(filteredEvents), [filteredEvents]);
// Result: 5+ iterations over filteredEvents
```

### Optimized Approach
```typescript
// AFTER: Single pass hook
const useAggregations = (events: EmailEvent[], granularity: string) => {
  return useMemo(() => {
    const dailyAggregates = new Map();
    const categoryAggregates = new Map();
    const uniqueEmails = new Set();
    let totalDelivered = 0;
    // ... etc
    
    // Single iteration
    for (const event of events) {
      // Update all aggregations simultaneously
      updateDailyAggregates(dailyAggregates, event);
      updateCategoryAggregates(categoryAggregates, event);
      if (event.event === 'delivered') totalDelivered++;
      // ... etc
    }
    
    // Return all computed metrics
    return {
      dailyAggregates: Array.from(dailyAggregates.values()),
      figures: rollupAggregates(Array.from(dailyAggregates.values()), granularity),
      metrics: computeKpiMetrics(totalDelivered, uniqueEmails.size, ...),
      funnel: computeFunnelStages(...),
      timeseries: computeTimeseries(...),
      categories: Array.from(categoryAggregates.values()),
    };
  }, [events, granularity]);
};
```

### Web Workers (Deferred)
- **Pros**: True parallelism, unblocks main thread
- **Cons**: Serialization overhead, complexity, debugging difficulty
- **Decision**: Spike if profiling shows >500ms for 10k events

### Profiling Strategy
1. Use React DevTools Profiler to record filter change
2. Identify components with >100ms render time
3. Check flamegraph for hot paths
4. Optimize identified bottlenecks first
5. Re-measure to confirm improvement

### Alternatives Considered
- **useMemo everywhere**: Current approach, causes dependency tracking overhead
- **No memoization**: Would cause re-compute on every render
- **Virtualized tables only**: Already implemented, not sufficient

### References
- React Profiler: https://react.dev/reference/react/Profiler
- Web Workers: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API

---

## Summary

All research decisions prioritize:
1. **Simplicity**: Client-side only, minimal dependencies
2. **Performance**: Bundle size reduction, single-pass algorithms
3. **Security**: Multiple validation layers, CSP headers
4. **UX**: Graceful degradation, loading states, error recovery
5. **Maintainability**: TypeScript strict mode, comprehensive testing

Next step: Generate data-model.md with concrete type definitions based on these patterns.
