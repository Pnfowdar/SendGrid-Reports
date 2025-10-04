# Quickstart Guide: SendGrid Dashboard

**Feature**: SendGrid Deliverability & Engagement Analytics Dashboard  
**Date**: 2025-10-03  
**Phase**: 1 - Quickstart Testing Scenarios

---

## Overview

This quickstart validates the 6 primary acceptance scenarios from the specification. Each scenario corresponds to user stories and tests the dashboard's core functionality end-to-end.

---

## Prerequisites

1. **Authentication**:
   - Shared Basic auth credential stored in environment variable
   - `.env.local` file contains `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD`

2. **Test Data**:
   - Sample Excel file: `SendGrid Stats.xlsx` (from repository root)
   - Contains ~1,000 email events with varied event types, dates, categories

3. **Environment**:
   - Dashboard running locally or deployed to Vercel
   - Database initialized with schema from `data-model.md`
   - All API endpoints responding (contracts/ directory)

---

## Scenario 1: Activity Search by Recipient

**User Story**: As a business owner, I want to search for all email activity by recipient so I can investigate delivery issues.

**Acceptance Criteria** (from spec):
- **Given** the dashboard is loaded with email event data
- **When** I enter a recipient email address in the search field
- **Then** I see only events related to that recipient with status, timestamps, subject, engagement metrics

**Test Steps**:

1. **Navigate** to `http://localhost:3000/login`
2. **Login** with Basic auth credentials
3. **Upload** `SendGrid Stats.xlsx` via Upload button
   - **Expected**: Success message "Successfully processed X events (Y new, Z duplicates skipped)"
   - **Expected**: Upload completes in <5 seconds (NFR-013)
4. **Navigate** to Activity Feed page
5. **Enter** recipient email in search box: `test@example.com`
6. **Verify**:
   - Only events for `test@example.com` are displayed
   - Table shows columns: Email (masked as `t***@example.com`), Event, Timestamp, Subject, Opens, Clicks
   - Filter updates in <500ms (NFR-011)
   - Emails are masked per NFR-001

**Pass Criteria**:
- ✅ Search returns correct filtered results
- ✅ Response time <500ms
- ✅ Email masking applied correctly

---

## Scenario 2: Date Range Filtering

**User Story**: As a marketing analyst, I need to view metrics for specific time periods.

**Acceptance Criteria** (from spec):
- **Given** I am viewing the statistics overview
- **When** I select a date range (e.g., "Last 7 days")
- **Then** all charts, tables, and metrics cards update to show only data within that period

**Test Steps**:

1. **Navigate** to Dashboard home (after login)
2. **Observe** default view shows all data
3. **Click** date range selector, choose "Last 7 days"
4. **Verify**:
   - KPI cards update (Processed, Delivered %, Bounced %, Unique Opens %)
   - Figures table shows only last 7 days of data
   - Statistics charts (time-series) show last 7 days
   - Funnel updates to reflect 7-day period
   - Categories table recalculates for 7-day window
5. **Click** date range selector, choose "Custom Range"
6. **Enter** start date: `2025-10-01`, end date: `2025-10-03`
7. **Verify**:
   - All components update to show Oct 1-3 data only
   - Chart render completes in <1s (NFR-012)

**Pass Criteria**:
- ✅ All dashboard components respond to date filter
- ✅ Chart rendering <1s
- ✅ Data consistency across all views

---

## Scenario 3: Campaign Performance Comparison

**User Story**: As a marketing manager, I want to compare campaign performance by engagement metrics.

**Acceptance Criteria** (from spec):
- **Given** I am viewing the Top Categories table
- **When** I sort by "Unique Opens" descending
- **Then** campaigns are ranked by engagement with delivered counts, open rates, click rates, unsubscribes, spam reports

**Test Steps**:

1. **Navigate** to Dashboard → Top Categories section
2. **Observe** default sort (by delivered descending)
3. **Click** "Unique Opens" column header to sort descending
4. **Verify**:
   - Table reorders with highest unique opens at top
   - Each row shows: Category, Delivered, Unique Opens, Unique Clicks, Unsubscribes, Spam Reports
   - Open Rate and Click Rate percentages calculated correctly per FR-015
   - "Uncategorized" appears for events without category (FR-028)
5. **Click** "Click Rate" column to sort
6. **Verify**: Table reorders by click rate descending

**Pass Criteria**:
- ✅ Sorting works on all columns (FR-026)
- ✅ Metrics calculated per SendGrid formulas (NFR-016)
- ✅ "Uncategorized" category present

---

## Scenario 4: Deliverability Funnel Analysis

**User Story**: As a marketing manager, I want to see email funnel drop-offs.

**Acceptance Criteria** (from spec):
- **Given** I am viewing the email funnel visualization
- **When** I observe the funnel stages (sent → delivered → opened → clicked)
- **Then** I see absolute counts and conversion percentages at each stage

**Test Steps**:

1. **Navigate** to Dashboard → Funnel section
2. **Observe** funnel chart with 4 stages
3. **Verify** stages displayed:
   - **Sent**: X emails (100%)
   - **Delivered**: Y emails (Y/X × 100%)
   - **Unique Opened**: Z emails (Z/Y × 100%)
   - **Unique Clicked**: W emails (W/Z × 100%)
4. **Hover** over each stage
5. **Verify**: Tooltip shows exact count and percentage (FR-018, FR-022)
6. **Apply** category filter (e.g., "emailer_campaign_123")
7. **Verify**: Funnel updates to show only that category's funnel (FR-023)

**Pass Criteria**:
- ✅ Funnel displays all 4 stages
- ✅ Conversion rates calculated correctly
- ✅ Category filter works on funnel

---

## Scenario 5: Export Filtered Data

**User Story**: As a compliance officer, I need to export filtered data for audits.

**Acceptance Criteria** (from spec):
- **Given** I have applied filters (date range, category, recipient)
- **When** I click the export button and select CSV format
- **Then** the system downloads a file containing only the filtered data

**Test Steps**:

1. **Navigate** to Activity Feed
2. **Apply** filters:
   - Date range: Oct 1-3, 2025
   - Event type: `bounce`
   - Category: `emailer_campaign_123`
3. **Click** "Export to CSV" button
4. **Verify**:
   - Download starts immediately
   - Filename format: `activity_2025-10-01_to_2025-10-03.csv` (FR-032)
   - Export completes in <5s for 30-day window (NFR-013)
5. **Open** CSV file
6. **Verify**:
   - Contains only filtered rows (bounce events, Oct 1-3, specified category)
   - All visible columns included (FR-031)
   - Headers match table columns
   - Timestamps in AEST format (FR-004B)

**Pass Criteria**:
- ✅ Export respects active filters
- ✅ Filename includes timestamp and context
- ✅ Export performance <5s

---

## Scenario 6: Daily Summary Report

**User Story**: As an analyst, I need daily aggregated stats.

**Acceptance Criteria** (from spec):
- **Given** I am viewing the Figures table
- **When** I select a specific date
- **Then** I see summary counts for all metrics for that day

**Test Steps**:

1. **Navigate** to Dashboard → Figures Table
2. **Observe** table with columns: Date, Requests, Delivered, Opens, Unique Opens, Clicks, Unique Clicks, Unsubscribes, Bounces, Spam Reports, Blocks, Bounce Drops, Spam Drops (FR-010)
3. **Click** row for date `2025-10-03`
4. **Verify**:
   - All metrics display for that specific date
   - Counts match database aggregates
   - Sorting works on date column (FR-012)
5. **Change** granularity selector to "Week"
6. **Verify**: Table shows weekly rollups instead of daily
7. **Change** granularity to "Month"
8. **Verify**: Table shows monthly rollups (FR-011)

**Pass Criteria**:
- ✅ All 12 metrics displayed per FR-010
- ✅ Granularity toggle works (day/week/month)
- ✅ Sorting functional

---

## Edge Case Validations

### Edge Case 1: No Data for Selected Period
1. **Apply** date range with no events (e.g., future date)
2. **Verify**: Message "No data available for selected date range" displayed
3. **Verify**: Export button disabled

### Edge Case 2: Invalid Email Search
1. **Enter** invalid email format: `not-an-email`
2. **Verify**: Validation message "Please enter a valid email address format"

### Edge Case 3: Large Dataset (>10,000 emails)
1. **Upload** large dataset (or simulate via test data)
2. **Verify**: Warning message "Large dataset - loading may take up to 5 seconds"
3. **Verify**: Pagination or virtual scrolling implemented (NFR-014)

### Edge Case 4: Concurrent Data Updates
1. **While viewing** dashboard, upload new Excel file
2. **Verify**: Notification "Data updated - refresh to see latest" appears
3. **Verify**: Current view not disrupted

---

## Performance Validation

Run all scenarios and validate against constitutional performance targets:

| Metric | Target | Test Result | Pass/Fail |
|--------|--------|-------------|-----------|
| Dashboard load (5k emails) | <2s | ___ s | ___ |
| Search/filter response | <500ms | ___ ms | ___ |
| Chart rendering | <1s | ___ ms | ___ |
| Export (30-day window) | <5s | ___ s | ___ |

---

## Accessibility Validation (WCAG 2.1 AA)

1. **Keyboard Navigation**:
   - Tab through all interactive elements
   - Verify focus indicators visible (NFR-007)
   - Verify all functions accessible via keyboard

2. **Screen Reader**:
   - Enable screen reader (NVDA/JAWS/VoiceOver)
   - Verify all charts have ARIA labels
   - Verify table headers announced correctly

3. **Contrast Ratios**:
   - Run browser DevTools accessibility audit
   - Verify all text meets 4.5:1 ratio (NFR-008)

---

## Authentication Validation

1. **Attempt** to access `/dashboard` without login
2. **Verify**: Redirect to `/login` page
3. **Enter** invalid credentials
4. **Verify**: Error message, no access granted
5. **Enter** correct credentials (from `.env.local`)
6. **Verify**: Access granted, cookie session created

---

## Completion Criteria

All quickstart scenarios must pass before proceeding to Phase 3 (task execution).

**Sign-off**:
- [ ] All 6 acceptance scenarios validated
- [ ] All edge cases tested
- [ ] Performance targets met
- [ ] Accessibility checks passed
- [ ] Authentication working correctly

---

**Next Steps**: After quickstart validation, proceed to `/tasks` command to generate detailed implementation tasks.
