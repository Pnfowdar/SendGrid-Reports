# Quickstart: Lead Generation Analytics Testing

**Date**: 2025-10-05  
**Plan**: [plan-lead-gen.md](./plan-lead-gen.md)  
**Purpose**: Manual test scenarios for validating all new features

---

## Prerequisites

1. **Supabase Database**:
   - `sendgrid_events` table exists
   - `email_domain` computed column added
   - Indexes created on `email_domain`, `Email`, `Event`
   - Test data loaded (minimum 1000 events with varied patterns)

2. **Environment Variables** (`.env.local`):
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE=your-service-role-key
   ```

3. **Development Server**:
   ```bash
   cd sendgrid-dashboard
   npm install
   npm run dev
   ```

---

## Scenario 1: Date Migration Verification

**Objective**: Verify Luxon removal and date-fns consistency

### Steps

1. Open browser console (F12)
2. Navigate to `http://localhost:3000`
3. Check Network tab → verify no Luxon-related imports
4. Verify timezone handling:
   - Look at event timestamps in Activity Feed
   - Confirm displayed in Australia/Brisbane timezone
   - Check date format: "Jun 15, 2024" (not ISO strings)

### Expected Results

✅ No Luxon imports in bundle  
✅ All dates display in Australia/Brisbane timezone  
✅ Date formats consistent across components  
✅ No console errors related to date parsing

### Rollback Procedure

```bash
git revert <date-migration-commit>
npm install  # Reinstall Luxon
npm run dev
```

---

## Scenario 2: Multi-Select Filters

**Objective**: Test multi-select category and event type filtering

### Steps

1. Navigate to dashboard
2. **Category Filter**:
   - Click "Category" dropdown
   - Verify checkboxes displayed for all categories
   - Select "Welcome" and "Marketing"
   - Verify both appear as chips/tags below dropdown
   - Click "X" on "Welcome" chip → verify removed

3. **Event Type Filter**:
   - Click "Event Type" dropdown
   - Select "open", "click", "bounce"
   - Verify 3 event types selected

4. **Filter Logic**:
   - Check Activity Feed shows only events matching:
     `(category = Marketing) AND (event IN ['open', 'click', 'bounce'])`
   - Verify event count badge updates

5. **Clear All**:
   - Click "Clear All" button
   - Verify all filters reset

### Expected Results

✅ Multi-select dropdowns work smoothly  
✅ Selected items display as removable chips  
✅ Filter logic applies correctly (OR within category, AND between filters)  
✅ Activity Feed updates in real-time  
✅ Event count reflects filtered results

### Edge Cases

- Select all categories → verify doesn't crash
- Select 20+ items → verify UI handles gracefully
- Clear individual vs "Clear All" → both work

---

## Scenario 3: URL Sharing & State Persistence

**Objective**: Test URL-based filter sharing

### Steps

1. Apply filters:
   - Categories: "Welcome", "Marketing"
   - Event Types: "open", "click"
   - Date Range: Last 30 days
   - Email: "test@example.com"

2. **URL Updates**:
   - Check browser URL bar
   - Verify query params appear: `?c=Welcome,Marketing&t=open,click&e=test@example.com&sd=...&ed=...`

3. **Copy Link**:
   - Click "Copy Link" button in header
   - Verify toast notification: "Link copied to clipboard"

4. **Open in New Tab**:
   - Paste URL in new tab
   - Verify filters pre-applied
   - Verify Activity Feed shows same data

5. **Browser Back/Forward**:
   - Change filters
   - Click browser back button
   - Verify previous filter state restored

### Expected Results

✅ URL updates within 500ms of filter change  
✅ Query params correctly encoded  
✅ Shared URL loads with correct filters  
✅ Browser navigation works  
✅ URL length <2000 characters (or truncation warning shown)

### Edge Cases

- Select 20+ categories → verify URL doesn't exceed 2000 chars
- Special characters in email → verify URL encoding correct
- Refresh page → verify filters persist from URL

---

## Scenario 4: High-Engagement Contacts

**Objective**: Test engagement analytics API and UI

### Steps

1. Navigate to `/api/analytics/engagement?limit=20` in browser
2. **Verify API Response**:
   - JSON structure matches contract
   - `contacts` array populated
   - Each contact has `engagement_score` calculated
   - Sorted by `engagement_score` DESC

3. **UI Integration**:
   - Navigate to dashboard
   - Scroll to "Top Contacts" section (or click "Analytics" tab)
   - Verify table shows:
     - Email, Domain, Opens, Clicks, Engagement Score, Tier
     - Sorted by engagement score (highest first)
     - Color-coded tiers: green (hot), yellow (warm), gray (cold)

4. **Export**:
   - Click "Export Hot Leads" button
   - Verify CSV downloads
   - Open CSV → verify columns: Email, Domain, Opens, Clicks, Open Rate, Engagement Score, Tier

### Expected Results

✅ API returns data in <500ms  
✅ Engagement scores calculated correctly: `(opens * 2) + (clicks * 5) + recency_bonus`  
✅ Tiers classified correctly: hot (≥50), warm (20-49), cold (<20)  
✅ Table sorts correctly  
✅ CSV export includes all fields

### Test Data Requirements

Create test events with:
- **Hot contact**: 10 clicks + 10 opens (recent) → score ≥ 100
- **Warm contact**: 5 clicks + 10 opens → score ≈ 45
- **Cold contact**: 2 clicks + 5 opens (30 days ago) → score ≈ 20

---

## Scenario 5: Bounce Warnings

**Objective**: Test bounce detection and warnings

### Steps

1. **Setup Test Data**:
   - Ensure test database has contacts with 3+, 5+, and 10+ bounce events
   - Example: `test-bounce@example.com` with 7 bounce events

2. **Dashboard Display**:
   - Navigate to dashboard
   - Scroll through Activity Feed
   - **Verify Badges**:
     - Yellow badge next to emails with 3-4 bounces
     - Red badge next to emails with 5+ bounces
   - Hover over badge → tooltip shows bounce count

3. **Insights Panel**:
   - Scroll to "Insights" section at top
   - Verify insight card:
     - Title: "12 emails have bounced 5+ times"
     - Severity: Critical (red)
     - Action button: "View Bounce List"
   - Click action button
   - Verify filters to `eventType=bounce`

4. **Export Suppression List**:
   - Click "Export Bounce List" button
   - Verify CSV downloads with columns: Email, Domain, Bounce Count, Severity
   - Only includes emails with 3+ bounces

### Expected Results

✅ Bounce detection accurate (counts bounce, dropped, block events)  
✅ Severity classification correct (warning: 3-4, critical: 5+)  
✅ Visual badges display in Activity Feed  
✅ Insight card appears in top insights  
✅ Export generates correct suppression list

### Edge Cases

- Email with only 1-2 bounces → no badge shown
- Mix of bounce types (hard, soft, block) → all counted
- Recent vs old bounces → all counted (no time decay)

---

## Scenario 6: Domain Analytics (B2B Lead Qualification)

**Objective**: Test `/companies` route and domain-level metrics

### Steps

1. **Navigate to Companies Page**:
   - Click "Companies" in navigation
   - Verify route: `http://localhost:3000/companies`

2. **Hot Leads Section**:
   - Verify section title: "Hot Leads" with green badge
   - Verify shows domains with >30% avg_open_rate
   - Check table columns:
     - Domain, Contacts, Open Rate, Click Rate, Bounce Rate, Last Activity
   - Click on domain (e.g., "acme.com")
   - Verify drills down to contact list for that domain

3. **Opportunity Domains Section**:
   - Scroll to "Opportunity Domains" (yellow badge)
   - Verify shows domains with 15-30% avg_open_rate
   - Verify different domains than Hot Leads section

4. **At-Risk Domains Section**:
   - Scroll to "At-Risk Domains" (red badge)
   - Verify shows domains with >5% bounce rate
   - Verify warning message displayed

5. **Export Domain Contacts**:
   - In Hot Leads section, click "Export Hot Leads"
   - Verify CSV downloads with all contacts from hot domains
   - Columns: Domain, Email, Opens, Clicks, Engagement Score, Last Activity

### Expected Results

✅ `/companies` route loads without errors  
✅ Three sections display with correct color coding  
✅ Domain classification accurate (hot/warm/problematic)  
✅ Drill-down to contacts works  
✅ Export includes all contacts from selected domains

### Test Data Requirements

Domains needed:
- **Hot domain**: acme.com with 5+ contacts, 35% open rate
- **Warm domain**: techcorp.com with 3+ contacts, 20% open rate
- **Problematic domain**: bouncy.com with 3+ contacts, 8% bounce rate

---

## Scenario 7: Smart Insights Panel

**Objective**: Test automated insights generation

### Steps

1. Navigate to dashboard
2. **Verify Insights Panel**:
   - Located below header, above metrics cards
   - Shows 3-5 insight cards
   - Each card has:
     - Severity badge (green/yellow/red)
     - Title
     - Description
     - Metric value (if applicable)
     - Action button

3. **Test Insight Actions**:
   - **Bounce Warning** (critical):
     - Click "View Bounce List"
     - Verify filters dashboard to bounce events
   - **Hot Leads** (info):
     - Click "Export Hot Leads"
     - Verify CSV downloads
   - **Trend Decline** (warning):
     - Click "View Category"
     - Verify filters to that category

4. **Collapse/Expand**:
   - Click collapse icon (if present)
   - Verify panel collapses
   - Click expand → verify expands
   - Verify state persists on page refresh (localStorage)

5. **Filter Impact**:
   - Apply date range filter (last 7 days)
   - Verify insights recalculate
   - Check if different insights appear based on filtered data

### Expected Results

✅ 3-5 insights displayed (prioritized by severity)  
✅ Color coding correct (critical=red, warning=yellow, info=green)  
✅ All action buttons functional  
✅ Insights update when filters change  
✅ Collapse state persists

### Insight Rules to Verify

1. **Bounce Warning**: Appears when 3+ emails have 3+ bounces
2. **Hot Leads**: Appears when domain has >30% open rate with 3+ contacts
3. **Trend Decline**: Appears when open rate declined >10% in 30 days
4. **Opportunity Domains**: Appears when 3+ domains have 15-30% open rate
5. **Risk Domains**: Appears when domain has >5% bounce rate

---

## Scenario 8: API Performance Testing

**Objective**: Verify API response times meet SLA

### Steps

1. **Engagement API**:
   ```bash
   curl -w "@curl-format.txt" http://localhost:3000/api/analytics/engagement?limit=50
   ```
   - Verify response time <500ms

2. **Domains API**:
   ```bash
   curl -w "@curl-format.txt" http://localhost:3000/api/analytics/domains?limit=100
   ```
   - Verify response time <500ms

3. **Insights API**:
   ```bash
   curl -w "@curl-format.txt" http://localhost:3000/api/analytics/insights
   ```
   - Verify response time <200ms (rule evaluation)

4. **Filtered Events API**:
   ```bash
   curl -X POST http://localhost:3000/api/events \
     -H "Content-Type: application/json" \
     -d '{"filters":{"categories":["Welcome"],"eventTypes":["open"]},"limit":1000}'
   ```
   - Verify response time <300ms

5. **Load Test** (optional):
   ```bash
   # Install: npm install -g autocannon
   autocannon -c 10 -d 30 http://localhost:3000/api/analytics/engagement
   ```
   - Verify handles 10 concurrent requests
   - No errors, consistent response times

### Expected Results

✅ All APIs respond within SLA  
✅ Cache headers present (Cache-Control: max-age=300)  
✅ No 500 errors  
✅ Concurrent requests handled gracefully

### Performance Targets

- Engagement API: <500ms
- Domains API: <500ms  
- Insights API: <200ms
- Filtered Events: <300ms for 1000 events

---

## Scenario 9: E2E Test Suite

**Objective**: Run automated Playwright tests

### Steps

1. **Run E2E Tests**:
   ```bash
   npm run test:e2e
   ```

2. **Verify Test Coverage**:
   - ✅ Multi-select filters work
   - ✅ URL sharing preserves state
   - ✅ Engagement table displays
   - ✅ Domain analytics loads
   - ✅ Insights panel appears
   - ✅ Bounce warnings show
   - ✅ CSV exports download
   - ✅ Date migration (no Luxon errors)

3. **Review Test Results**:
   - Check `test-results/` directory for screenshots
   - Verify all tests passed
   - No flaky tests (run 3 times to confirm)

### Expected Results

✅ All E2E tests pass  
✅ No console errors in headless browser  
✅ Screenshots captured for failures  
✅ Test execution <5 minutes

---

## Scenario 10: Bundle Size Verification

**Objective**: Confirm Luxon removal reduced bundle size

### Steps

1. **Build Production Bundle**:
   ```bash
   npm run build
   ```

2. **Check Bundle Analysis**:
   ```bash
   npx next build
   ```
   - Look for build output showing route sizes
   - Verify main route bundle <800KB

3. **Compare Before/After**:
   - **Before**: ~850KB (with Luxon)
   - **After**: ~750KB (date-fns only)
   - **Savings**: ~50KB (Luxon + @types/luxon)

4. **Verify No Luxon in Bundle**:
   ```bash
   grep -r "luxon" .next/static/chunks/
   ```
   - Should return no results

### Expected Results

✅ Bundle size reduced by 40-60KB  
✅ No Luxon references in `.next/` directory  
✅ All routes build successfully  
✅ Build completes without errors

---

## Rollback Procedures

### If Date Migration Fails

```bash
git revert <date-migration-commit>
npm install  # Reinstall Luxon
npm run dev
```

### If Supabase Migration Fails

```bash
# Connect to Supabase SQL editor
DROP INDEX IF EXISTS idx_sendgrid_events_email_domain;
DROP INDEX IF EXISTS idx_sendgrid_events_email;
DROP INDEX IF EXISTS idx_sendgrid_events_event;
ALTER TABLE sendgrid_events DROP COLUMN IF EXISTS email_domain;
```

### If API Changes Break

```bash
git revert <api-changes-commit>
npm run build
vercel --prod
```

---

## Success Criteria

Feature is production-ready when:

1. ✅ All 10 quickstart scenarios pass
2. ✅ E2E test suite passes (all tests green)
3. ✅ API response times meet SLA (<500ms)
4. ✅ Bundle size reduced by 40KB+
5. ✅ No console errors in production build
6. ✅ CSV exports generate correctly
7. ✅ URL sharing works across browsers
8. ✅ Supabase queries use indexes (verify with EXPLAIN)
9. ✅ Zero data loss (events persist after refresh)
10. ✅ Insights display within 1 second of page load

---

**Testing Complete** | **Ready for Production Deployment**
