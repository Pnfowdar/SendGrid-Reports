# Feature Specification: Dashboard Production Readiness & UX Enhancements

## Overview

Comprehensive improvements to make the SendGrid Dashboard production-ready by addressing critical technical debt, implementing data persistence, enhancing user experience with advanced filtering and URL sharing, and adding intelligent insights.

## Background

Following a thorough codebase review, several critical issues were identified that prevent production deployment:
- Data loss on page refresh (no persistence)
- Missing error boundaries causing full app crashes
- Date/time library inconsistency (Luxon + date-fns)
- Poor loading state feedback
- Missing CI/CD automation
- Incomplete keyboard navigation
- Type safety gaps
- File upload security vulnerabilities
- Performance inefficiencies
- Missing environment configuration

Additionally, three strategic improvements have been prioritized to enhance user experience:
1. **URL-based session sharing** for collaboration
2. **Multi-select filters** for advanced queries
3. **Insights dashboard** for automated metric analysis

## Goals

### Primary Goals
1. Achieve production-ready stability with error handling and data persistence
2. Improve developer experience with CI/CD automation and type safety
3. Enhance end-user experience with URL sharing and advanced filtering
4. Provide intelligent insights to reduce manual analysis effort

### Success Metrics
- Zero data loss on page refresh (100% persistence)
- Error boundary coverage for all major components
- Single date library (remove ~50KB bundle bloat)
- Loading states visible within 100ms of user action
- CI/CD pipeline runs on all PRs
- WCAG 2.1 AA keyboard navigation compliance
- 95%+ type safety coverage (no unsafe any/unknown)
- File upload security validation passes OWASP checks
- URL sharing works for all filter combinations
- Multi-select filters support 3+ simultaneous selections
- Insights section auto-generates on data load

## User Stories

### Critical Fixes

**Story 1: Data Persistence**
```
As a data analyst
I want my uploaded dataset to persist across page refreshes
So that I don't have to re-upload the Excel file every time I navigate away
```

**Acceptance Criteria:**
- Uploaded events saved to localStorage automatically
- Data restored on page load if available
- Maximum storage limit warning at 80% capacity (default: 10MB)
- "Clear Data" button removes all stored events
- Data versioning handles schema changes gracefully
- Loading indicator shows during restore

**Story 2: Error Recovery**
```
As a user
I want the dashboard to recover from component crashes
So that one error doesn't break the entire application
```

**Acceptance Criteria:**
- Root-level error boundary catches all uncaught errors
- Component-level boundaries around: upload, charts, tables, filters
- User-friendly error messages with "Try Again" button
- Errors logged to console with stack traces
- App remains functional even if one section fails

**Story 3: Consistent Date Handling**
```
As a developer
I want a single date/time library throughout the codebase
So that timezone bugs are eliminated and bundle size is reduced
```

**Acceptance Criteria:**
- All Luxon usages replaced with date-fns
- Timezone handling consistent (Australia/Brisbane)
- Bundle size reduced by ~50KB
- No date-fns + Luxon imports in same file
- All tests pass with new date library

**Story 4: Loading Feedback**
```
As a user
I want to see loading indicators during heavy operations
So that I know the app is working and not frozen
```

**Acceptance Criteria:**
- Skeleton loaders for MetricsPanel, FiguresTable, StatsCharts during computation
- Progress bar during Excel parsing (0-100%)
- Debounced filter inputs (300ms) to reduce re-renders
- Spinner on export button clicks
- Loading states never block UI interaction completely

**Story 5: Automated Testing**
```
As a developer
I want automated CI/CD checks on every PR
So that broken code never reaches production
```

**Acceptance Criteria:**
- `.github/workflows/ci.yml` runs lint + build + e2e on PRs
- Failed checks block merge
- Deploy workflow auto-deploys main branch to Vercel
- Test results visible in PR comments
- Branch protection rules enforced

**Story 6: Keyboard Navigation**
```
As a keyboard-only user
I want full keyboard access to all features
So that I can use the dashboard without a mouse
```

**Acceptance Criteria:**
- Arrow keys navigate DateRangePicker calendar
- Tab order logical throughout app
- All interactive elements have visible focus indicators
- Keyboard shortcuts: `/` focuses search, `Esc` clears filters, `?` shows help
- Sticky filters keyboard-accessible
- Screen reader tested with NVDA

**Story 7: Type Safety**
```
As a developer
I want TypeScript to catch type errors at compile time
So that runtime crashes are minimized
```

**Acceptance Criteria:**
- `strict: true` enabled in tsconfig.json
- `noUncheckedIndexedAccess: true` enabled
- No `any` types except explicitly documented exceptions
- `mergeEvents` uses proper type guards
- `tsc --noEmit` passes in CI
- All new code has explicit return types

**Story 8: Upload Security**
```
As a security-conscious user
I want file uploads validated thoroughly
So that malicious files cannot compromise the app
```

**Acceptance Criteria:**
- MIME type validation: must be Excel format
- File size limit: max 10MB, with user warning
- File signature/magic bytes check (not just extension)
- String sanitization on all parsed Excel data
- Content Security Policy headers in next.config.ts
- XSS attack vectors tested

**Story 9: Performance Optimization**
```
As a developer
I want aggregation computations optimized
So that filter changes feel instant even with 10k+ events
```

**Acceptance Criteria:**
- Single `useAggregations` hook replaces multiple memos
- All aggregations computed in one pass over data
- React DevTools Profiler shows <100ms render time
- Consider Web Workers for 10k+ events (spike/POC acceptable)
- No redundant re-computations on filter changes

**Story 10: Environment Configuration**
```
As a deployer
I want clear environment variable documentation
So that deployment configuration is straightforward
```

**Acceptance Criteria:**
- `.env.example` created with all documented variables
- Env vars validated with zod at build time
- README updated with correct env var usage
- Remove auth references if not implemented, or implement basic auth
- Vercel deployment guide includes env var setup

### Strategic Improvements

**Story 11: URL Session Sharing**
```
As a data analyst
I want to share my current dashboard view via URL
So that colleagues can see the exact same filtered data
```

**Acceptance Criteria:**
- Current filters encoded in URL query params
- Query params: `email`, `category`, `eventType`, `startDate`, `endDate`, `granularity`
- URL updates on filter changes (debounced 500ms)
- Browser back/forward navigation works
- URL length limited to 2000 chars with truncation warning
- "Copy Link" button in header copies current URL
- Shared URLs load with correct filter state

**Story 12: Multi-Select Filters**
```
As a power user
I want to select multiple categories and event types simultaneously
So that I can analyze complex cohorts without multiple exports
```

**Acceptance Criteria:**
- Category filter supports multi-select checkboxes
- Event type filter supports multi-select checkboxes
- Selected items shown as removable chips/tags
- "Select All" and "Clear All" buttons
- Filter logic: `(categoryA OR categoryB) AND (eventX OR eventY)`
- Filter count badge shows active filter count
- Works seamlessly with URL sharing

**Story 13: Insights Dashboard**
```
As a business user
I want automated insights on my email performance
So that I can quickly understand trends without manual analysis
```

**Acceptance Criteria:**
- New "Insights" card/section after MetricsPanel
- Pre-configured insights:
  * Bounce rate threshold warning (>5%)
  * Open rate trend vs. previous period (±20%)
  * Top performing category (by engagement)
  * Underperforming category (by bounce rate)
  * Delivery rate threshold (warn if <95%)
- Color-coded indicators: green (good), yellow (warning), red (critical)
- Insights auto-generate on data load
- Insights update when filters change
- Optional: Collapsible insights panel
- No external API calls (rule-based, not AI)

## Functional Requirements

### Critical Fixes Requirements

**FR-1: Data Persistence**
- Must save uploaded events to localStorage after successful parse
- Must restore events on app initialization
- Must implement storage quota management (warn at 80%, block at 100%)
- Must version stored data (v1 schema marker)
- Must handle malformed/corrupted localStorage gracefully

**FR-2: Error Boundaries**
- Must implement root error boundary in `layout.tsx`
- Must implement component boundaries for: UploadDropzone, FilterBar, MetricsPanel, FiguresTable, StatsCharts, ActivityFeed, FunnelChart, CategoriesTable, EmailSequenceCard
- Must log errors with timestamp, component name, error message, stack trace
- Must show user-friendly error UI with retry mechanism

**FR-3: Date Library Migration**
- Must replace all Luxon DateTime with date-fns
- Must maintain Australia/Brisbane timezone consistency
- Must update: `format.ts`, `filters.ts`, `aggregations.ts`, `excel-parser.ts`
- Must remove luxon and @types/luxon from package.json

**FR-4: Loading States**
- Must show skeleton loaders for: MetricsPanel, FiguresTable, StatsCharts
- Must show progress bar during Excel parsing
- Must debounce text filter inputs (300ms)
- Must show spinner on export button clicks
- Must propagate isLoading prop through component tree

**FR-5: CI/CD Pipeline**
- Must create `.github/workflows/ci.yml` with: lint, build, type-check steps
- Must create `.github/workflows/deploy.yml` for Vercel auto-deployment
- Must configure branch protection: require PR reviews, block merge on failed checks
- Must add status badges to README

**FR-6: Keyboard Navigation**
- Must add arrow key handlers to DateRangePicker
- Must ensure all buttons/inputs have visible :focus-visible styles
- Must implement keyboard shortcuts: `/` (search focus), `Esc` (clear filters), `?` (help modal)
- Must add skip-to-content link for screen readers

**FR-7: Type Safety**
- Must enable `strict: true` and `noUncheckedIndexedAccess: true` in tsconfig.json
- Must refactor `mergeEvents` to use type predicates
- Must simplify `parseFilters` logic
- Must add explicit return types to all exported functions

**FR-8: Upload Security**
- Must validate MIME type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Must enforce 10MB file size limit
- Must check file signature (ZIP header: `50 4B 03 04`)
- Must sanitize all string fields from Excel
- Must add CSP headers in next.config.ts

**FR-9: Performance**
- Must create `useAggregations` hook consolidating all aggregations
- Must compute all metrics in single data pass
- Must memoize only at hook level, not per-aggregation
- Must profile with React DevTools
- Should spike Web Workers for 10k+ events

**FR-10: Environment Config**
- Must create `.env.example` with documented variables
- Must validate env vars with zod or similar
- Must update README with deployment guide
- Should implement basic auth middleware if env vars exist

### Strategic Improvements Requirements

**FR-11: URL Sharing**
- Must encode filters in URL query params using URLSearchParams
- Must sync URL with filter state using Next.js router
- Must decode URL params on page load
- Must handle invalid/malformed URL params gracefully
- Must add "Copy Link" button to header
- Must show toast notification on link copy

**FR-12: Multi-Select Filters**
- Must convert category filter to multi-select dropdown
- Must convert event type filter to multi-select dropdown
- Must render selected items as removable chips
- Must implement "Select All" / "Clear All" actions
- Must update `filterEvents` logic for OR-based matching
- Must integrate with URL sharing (comma-separated values)

**FR-13: Insights Section**
- Must create `InsightsPanel` component
- Must implement rule-based insight calculations:
  * Bounce rate check: if >5%, show warning
  * Open rate trend: compare to previous period
  * Top category: highest engagement rate
  * Bottom category: highest bounce rate
  * Delivery health: if <95%, show alert
- Must color-code insights: green/yellow/red
- Must update insights when filters change
- Must be collapsible/expandable

## Non-Functional Requirements

**NFR-1: Performance**
- Filter changes must complete within 500ms for 10k events
- Excel parsing must show progress within 100ms
- Page load with restored data must complete within 1s
- Skeleton loaders must appear within 100ms of loading state

**NFR-2: Accessibility**
- Must meet WCAG 2.1 AA standards
- Must support keyboard-only navigation
- Must pass NVDA screen reader testing
- Must have 4.5:1 contrast ratios for all text

**NFR-3: Browser Compatibility**
- Must support Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
- Must gracefully degrade in older browsers
- Must use progressive enhancement

**NFR-4: Security**
- Must follow OWASP Top 10 best practices
- Must sanitize all user inputs
- Must implement CSP headers
- Must validate all file uploads

**NFR-5: Maintainability**
- Must maintain <10% code duplication
- Must document all public APIs with JSDoc
- Must keep component files under 500 lines
- Must follow existing code style (Prettier + ESLint)

**NFR-6: Testing**
- Must maintain 80%+ E2E coverage
- Must add E2E tests for new features
- Must ensure all CI checks pass before merge

## Technical Constraints

1. **Framework**: Must use Next.js 15 App Router (no Pages Router)
2. **Styling**: Must use Tailwind CSS 4 (no CSS Modules or styled-components)
3. **State**: Must use React hooks (no Redux/MobX unless approved)
4. **Date Library**: Must use date-fns only (no Luxon, Moment, Day.js)
5. **Storage**: Must use localStorage for persistence (no backend until phase 2)
6. **Deployment**: Must deploy to Vercel with Edge Runtime where possible
7. **Node Version**: Must support Node.js 20+
8. **Bundle Size**: Must keep bundle under 1MB (current ~800KB)

## Out of Scope

The following items are explicitly **not** included in this implementation:

1. Backend API integration (reserved for future Supabase migration)
2. Authentication/authorization system
3. Real-time collaboration features
4. AI/LLM-based insights (only rule-based)
5. Email/Slack notifications for insights
6. Comment/annotation system
7. Mobile app or PWA optimization
8. Data export to formats other than CSV
9. Custom theming/branding options
10. SendGrid API direct integration

## Dependencies

### New Dependencies to Add
```json
{
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0"
  }
}
```

### Dependencies to Remove
```json
{
  "dependencies": {
    "luxon": "^3.7.2"
  },
  "devDependencies": {
    "@types/luxon": "^3.7.1"
  }
}
```

### Dependencies to Evaluate (Future)
- Consider replacing Recharts with lighter alternative if bundle grows
- Consider adding Zustand for global state management
- Consider adding Sentry for production error tracking

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| localStorage quota exceeded with large datasets | High | Medium | Implement storage management, warn users, provide export/import |
| URL length limits break sharing (>2000 chars) | Medium | Low | Truncate URL, provide fallback JSON export option |
| Date migration introduces timezone bugs | High | Medium | Comprehensive testing, gradual rollout, maintain test fixtures |
| Performance degrades with 50k+ events | High | Low | Implement Web Workers, add dataset size warnings |
| CI/CD pipeline delays development | Low | Medium | Optimize pipeline, cache dependencies, parallelize jobs |
| Type safety changes break existing code | Medium | Low | Incremental migration, thorough testing, staged rollout |

## Success Criteria

The implementation is considered successful when:

1. ✅ All 10 critical issues resolved and verified
2. ✅ CI/CD pipeline operational with green builds
3. ✅ Data persistence works across 10 browser refresh cycles
4. ✅ Error boundaries catch and recover from simulated component crashes
5. ✅ Bundle size reduced by 40-60KB (Luxon removal)
6. ✅ Loading states visible in user testing
7. ✅ Keyboard navigation passes accessibility audit
8. ✅ Type safety: `tsc --noEmit` passes with strict mode
9. ✅ File upload security passes penetration testing
10. ✅ Performance: 10k events filter in <500ms
11. ✅ URL sharing tested with 20+ filter combinations
12. ✅ Multi-select filters support 5+ simultaneous selections
13. ✅ Insights generate correctly for 5 test datasets
14. ✅ All existing E2E tests pass
15. ✅ 3 new E2E tests added for new features

## Acceptance Testing Scenarios

### Scenario 1: Data Persistence Recovery
```gherkin
Given I have uploaded an Excel file with 1000 events
When I refresh the page
Then the event count should remain 1000
And all charts should display the same data
And filters should remain in their previous state
```

### Scenario 2: Error Boundary Protection
```gherkin
Given the dashboard is loaded
When a component throws an uncaught error (simulated)
Then an error message should appear
And other dashboard sections should remain functional
And I should be able to click "Try Again" to recover
```

### Scenario 3: URL Sharing
```gherkin
Given I have applied filters: email=test@example.com, category=Welcome, dateRange=2024-01-01 to 2024-01-31
When I click "Copy Link"
Then the URL should contain all filter parameters
When I share this URL with a colleague
Then they should see the exact same filtered view
```

### Scenario 4: Multi-Select Filtering
```gherkin
Given I have events with categories: Welcome, Marketing, Transactional
When I select "Welcome" and "Marketing" in the category filter
And I select "open" and "click" in the event type filter
Then the activity feed should show only events matching:
  (category = Welcome OR category = Marketing) AND (event = open OR event = click)
```

### Scenario 5: Insights Auto-Generation
```gherkin
Given I upload a dataset with a 6% bounce rate
When the insights panel loads
Then I should see a red warning: "Bounce rate (6%) exceeds threshold (5%)"
When I filter to only "Welcome" category with 2% bounce rate
Then the insight should update to green: "Bounce rate healthy (2%)"
```

## Clarifications

### Session 2025-01-05: Implementation Review
**Q1: Should data persistence use localStorage, IndexedDB, or sessionStorage?**
A: Use localStorage for simplicity in MVP. Consider IndexedDB in Phase 2 if datasets exceed 10MB regularly.

**Q2: What should the maximum localStorage quota be?**
A: Default 10MB limit. Warn users at 80% (8MB). Provide "Export to JSON" option for larger datasets.

**Q3: Should error boundaries automatically retry failed components?**
A: No auto-retry. Show "Try Again" button to give users control. Log errors for debugging.

**Q4: Which date format should be standardized for URL params?**
A: ISO 8601 (YYYY-MM-DD) for dates, ISO 8601 full datetime for timestamps. Matches existing date-fns usage.

**Q5: Should multi-select filters use checkboxes, dropdown, or combo box?**
A: Use dropdown with checkboxes for categories (familiar pattern). Use checkbox list for event types (only 10 options, visible at once).

**Q6: How should insights be prioritized when multiple warnings exist?**
A: Show all insights, order by severity: critical (red) → warnings (yellow) → info (green). Limit to top 5 insights to avoid clutter.

**Q7: Should URL params use short codes or full names?**
A: Use short codes to reduce URL length: `e=email`, `c=category`, `t=eventType`, `s=startDate`, `d=endDate`, `g=granularity`.

**Q8: What happens if URL params conflict with localStorage state?**
A: URL params take precedence. Clear URL params on user manual filter change.

**Q9: Should the insights panel be expanded or collapsed by default?**
A: Expanded by default. Persist collapse state in localStorage as user preference.

**Q10: How should we handle localStorage quota exceeded errors?**
A: Show modal dialog: "Storage limit reached. Export data or clear old sessions?" Provide "Export JSON" and "Clear Data" buttons.

## Implementation Notes

1. **Phased Rollout**: Implement critical fixes (P1-P5) first, then improvements (P6-P10), then strategic features (URL sharing, multi-select, insights).

2. **Testing Strategy**: Add E2E tests for each new feature. Update existing tests for modified behavior.

3. **Performance Monitoring**: Use React DevTools Profiler to validate performance improvements. Set up Vercel Analytics.

4. **Documentation**: Update README with all new features. Add inline JSDoc for complex functions.

5. **Breaking Changes**: Date library migration may require data re-import. Communicate to users via migration guide.

6. **Rollback Plan**: Tag releases. Keep old Luxon code in git history. Vercel deployment history for instant rollback.

7. **Future Considerations**: Architecture supports future Supabase backend. LocalStorage can be replaced with API calls later.
