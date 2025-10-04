# Feature Specification: SendGrid Deliverability & Engagement Analytics Dashboard

**Feature Branch**: `001-sendgrid-deliverability-engagement`  
**Created**: 2025-10-03  
**Status**: Draft  
**Input**: User description: "Develop a web dashboard that presents all email deliverability and engagement analytics sourced from SendGrid event data"

---

## Purpose

Enable business owners, marketing managers, analysts, and compliance officers to monitor, analyze, and report on email deliverability and engagement performance through an interactive dashboard that replicates and enhances SendGrid's native reporting capabilities.

**Design References:**
- Screenshots: `SendGrid Example Screenshots/` directory
- Data source: `SendGrid Stats.xlsx`
- Event types: [SendGrid Event Documentation](https://docs.sendgrid.com/for-developers/tracking-events/event)

---

## User Scenarios & Testing

### Primary User Stories

1. **Business Owner**: "I want to search for all email activity by recipient email, message subject, and date range so I can investigate specific delivery issues or customer inquiries."

2. **Marketing Analyst**: "I need to view daily, weekly, monthly, and campaign-based aggregates (counts, rates, trends) for all email events so I can measure campaign effectiveness and identify improvement opportunities."

3. **Marketing Manager**: "I want to track deliverability improvements over time, identify problem campaigns or categories, and drill down on high-performing and low-performing segments to optimize our email strategy."

4. **Compliance Officer**: "I need to log and search all unsubscribes, spam reports, bounces, and drops in a filterable report so I can maintain compliance with email regulations and respond to audits."

### Acceptance Scenarios

1. **Activity Search by Recipient**
   - **Given** the dashboard is loaded with email event data
   - **When** I enter a recipient email address in the search field and apply the filter
   - **Then** I see only events related to that specific recipient, showing status (delivered, bounced, opened, clicked, etc.), timestamps, subject lines, and engagement metrics

2. **Date Range Filtering**
   - **Given** I am viewing the statistics overview
   - **When** I select a date range (e.g., "Last 7 days", "Last 30 days", or custom range)
   - **Then** all charts, tables, and metrics cards update to show only data within that period

3. **Campaign Performance Comparison**
   - **Given** I am viewing the Top Categories table
   - **When** I sort by "Unique Opens" descending
   - **Then** campaigns are ranked by engagement, showing delivered counts, open rates, click rates, unsubscribes, and spam reports per campaign

4. **Deliverability Funnel Analysis**
   - **Given** I am viewing the email funnel visualization
   - **When** I observe the funnel stages (sent → delivered → opened → clicked)
   - **Then** I see both absolute counts and conversion percentages at each stage, identifying drop-off points

5. **Export Filtered Data**
   - **Given** I have applied filters (date range, category, recipient)
   - **When** I click the export button and select CSV format
   - **Then** the system downloads a file containing only the filtered data matching my current view

6. **Daily Summary Report**
   - **Given** I am viewing the Figures table
   - **When** I select a specific date
   - **Then** I see summary counts for requests, delivered, opens, unique opens, clicks, unique clicks, unsubscribes, bounces, spam reports, blocks, and drops for that day

### Edge Cases

- **No data for selected period**: Dashboard displays "No data available for selected date range" message and disables export
- **Invalid email search**: System shows validation message "Please enter a valid email address format"
- **Large dataset (>10,000 emails)**: Dashboard displays warning "Large dataset - loading may take up to 5 seconds" and implements pagination or virtual scrolling
- **Missing event data fields**: Events with incomplete data display "[Not Available]" for missing fields but remain searchable by available fields
- **Category not specified**: Events without category metadata are grouped under "Uncategorized" in Top Categories table
- **Concurrent data updates**: If data is refreshed while user is viewing, system displays notification "Data updated - refresh to see latest" without disrupting current view
- **Export timeout**: For very large export requests, system provides status message "Export in progress - you will receive a download link when ready"

---

## Requirements

### Functional Requirements

- **Data Ingestion & Processing**
- **FR-001**: System MUST ingest email event data via manual Excel file upload through the dashboard UI (MVP scope)
- **FR-002**: System MUST support all SendGrid event types: processed, delivered, open, click, bounce, deferred, dropped, unsubscribe, spam report, blocks, and bounce/spam drops
- **FR-003**: System MUST parse and validate event timestamps in ISO 8601 or localized formats (e.g., "03/10/2025, 3:19:19"), treating all uploads as Brisbane, Australia time (AEST, UTC+10)
- **FR-004**: System MUST preserve all original event metadata including SMTP ID, event ID, email account ID, and category tags
- **FR-004A**: On each Excel upload, the system MUST append new events and de-duplicate existing records using `sg_event_id` as the canonical unique identifier
- **FR-004B**: Stored timestamps MUST remain in Brisbane (AEST, UTC+10) and all charts, tables, exports, and KPI cards MUST display times in that timezone for consistency

**Activity Feed**
- **FR-005**: System MUST display a searchable, filterable table of all email events
- **FR-006**: Activity feed MUST show: recipient email, event status, timestamp of last event, subject/message identifier, open count, and click count per email
- **FR-007**: Users MUST be able to filter activity by event type, recipient email (exact match or partial), date range, and category/campaign
- **FR-008**: Users MUST be able to sort activity by any column (timestamp, email, status, opens, clicks)
- **FR-009**: Search results MUST update in real-time as filters are applied

**Figures Summary Table**
- **FR-010**: System MUST display a summary table aggregated by date showing daily counts for: requests, delivered, opens, unique opens, clicks, unique clicks, unsubscribes, bounces, spam reports, blocks, bounce drops, and spam report drops
- **FR-011**: Users MUST be able to view figures by day, week, or month granularity
- **FR-012**: Figures table MUST be sortable by date or any metric column

**Deliverability Metrics Panel**
- **FR-013**: System MUST display high-level KPI cards showing: total processed, delivered percentage, bounced & blocked percentage, and unique opens percentage
- **FR-014**: Each metric card MUST show the current value and trend indicator (up/down/unchanged) compared to previous period
- **FR-015**: Metric calculations MUST follow SendGrid's canonical formulas:
  - Delivered % = (delivered / (delivered + bounced + blocked)) × 100
  - Bounced & Blocked % = ((bounced + blocked) / (delivered + bounced + blocked)) × 100
  - Unique Opens % = (unique opens / delivered) × 100

**Statistics Overview (Time-Series Charts)**
- **FR-016**: System MUST display interactive time-series visualizations for: requests, delivered, opens, unique opens, clicks, unique clicks, bounces, unsubscribes, spam reports, blocks, and drops
- **FR-017**: Charts MUST support time range selectors (last 7 days, 30 days, 90 days, custom range)
- **FR-018**: Charts MUST display tooltips showing exact values and timestamps on hover
- **FR-019**: Users MUST be able to toggle individual metrics on/off in the chart legend
- **FR-020**: Chart data MUST update dynamically when date range or filters change

**Email Funnel Visualization**
- **FR-021**: System MUST display a funnel chart with stages: sent → delivered → unique opened → unique clicked
- **FR-022**: Each funnel stage MUST show absolute count and conversion percentage from previous stage
- **FR-023**: Funnel MUST be filterable by date range and category/campaign

**Top Categories Table**
- **FR-024**: System MUST display a category rollup table showing aggregated metrics per campaign/category
- **FR-025**: Category table MUST show: category name, delivered count, unique opens, unique clicks, unsubscribes, and spam reports
- **FR-026**: Users MUST be able to sort categories by any metric column
- **FR-027**: Categories MUST be extracted from the "Category" field in event data (array format, e.g., ["emailer_campaign_..."])
- **FR-028**: Events without category metadata MUST be grouped as "Uncategorized"

**Export & Reporting**
- **FR-029**: Users MUST be able to export filtered activity feed data to CSV format
- **FR-030**: Users MUST be able to export figures summary to CSV format
- **FR-031**: Export files MUST include all visible columns and respect active filters
- **FR-032**: Export file names MUST include timestamp and filter context (e.g., "activity_2025-10-01_to_2025-10-03.csv")

**Data Refresh**
- **FR-033**: System MUST support manual data refresh via a "Refresh" button
- **FR-034**: System MUST display last data update timestamp on the dashboard
- **FR-035**: During data refresh, system MUST show loading indicator and disable interactive controls

### Key Entities


- **Daily Aggregate**: Summary statistics for a specific date including counts of all event types (requests, delivered, opens, unique opens, clicks, unique clicks, bounces, unsubscribes, spam reports, blocks, drops)

- **Category Aggregate**: Summary statistics grouped by campaign/category including delivered count, engagement metrics (unique opens, clicks), and negative signals (unsubscribes, spam reports)

- **Funnel Stage**: Represents a conversion step in the email lifecycle (sent → delivered → opened → clicked) with absolute count and conversion rate

- **NFR-001**: System MUST mask email addresses in UI unless explicitly authorized (e.g., display as `j***@example.com`)
- **NFR-002**: All data access MUST require Basic authentication (email + password) using a single shared credential stored in environment variables, with an upgrade path to per-user SSO in future releases
- **NFR-003**: Data transformations and aggregations MUST be auditable and logged
- **NFR-004**: All data transmission MUST use HTTPS/TLS encryption
- **NFR-005**: API keys and secrets MUST be stored as environment variables, never in source code

**Accessibility** *(Constitution Principle II)*
{{ ... }}
- **NFR-007**: UI MUST be fully keyboard-navigable (tab order, focus indicators, keyboard shortcuts)
- **NFR-008**: Text contrast ratios MUST meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- **NFR-009**: MUST be responsive on desktop (≥1024px), tablet (≥768px), and mobile (≥375px) viewports

**Performance** *(Constitution Principle VI)*
- **NFR-010**: Dashboard MUST load initial data (<5,000 emails) in <2 seconds
- **NFR-011**: Search/filter operations MUST respond in <500ms
- **NFR-012**: Chart rendering MUST complete in <1 second for any time range
- **NFR-013**: Export generation MUST complete in <5 seconds for 30-day data window
- **NFR-014**: For datasets exceeding 10,000 emails, system MUST implement pagination or virtual scrolling to maintain performance

**Testing** *(Constitution Principle V)*
- **NFR-015**: Feature MUST have ≥75% test coverage for data processing and aggregation logic
- **NFR-016**: All metrics calculations (deliverability %, open rate, click rate, funnel conversions) MUST be verified against SendGrid's canonical definitions
- **NFR-017**: All user interactions (search, filter, sort, export) MUST be covered by end-to-end tests

**Observability**
- **NFR-018**: No observability metrics are required for the MVP beyond basic application logs generated by the hosting platform

**Modularity & Extensibility** *(Constitution Principle IV)*
- **NFR-019**: System MUST support future integration with additional data sources (database, real-time webhooks) without major refactoring
- **NFR-020**: Dashboard components MUST be reusable for future custom report modules
- **NFR-021**: All dependencies MUST be pinned to specific versions and managed via automated build pipeline

---

## Data Structure Reference

**Source Data: SendGrid Stats.xlsx**

| Column           | Type   | Description                                                      |
|------------------|--------|------------------------------------------------------------------|
| Email            | string | Recipient email address                                          |
| Event            | string | SendGrid event type (delivered, open, click, bounce, etc.)       |
| Timestamp        | string | DateTime in local format (e.g., "03/10/2025, 3:19:19")           |
| SMTP-ID          | string | Unique SendGrid SMTP message identifier                          |
| Category         | string | Campaign/touch array (e.g., ["emailer_campaign..."])             |
| Email Account ID | string | Internal account/campaign identifier                             |
| sg_event_id      | string | SendGrid event identifier                                        |

**Event Types:** processed, delivered, open, click, bounce, deferred, dropped, unsubscribe, spamreport, block

---

## Design Reference Screenshots

The following screenshots define the expected user interface patterns and feature layout (stored in `SendGrid Example Screenshots/`):

1. **SendGrid - Figures.png**: Daily summary table format and columns
2. **SendGrid - Activity Page.png**: Activity feed search, filter, and event history layout
3. **SendGrid - Statistics Overview Page.png**: Time-series chart types, legends, and metrics display
4. **SendGrid - Deliverability Metrics.png**: KPI card layout and metric presentation
5. **SendGrid - Top Categories.png**: Category rollup table structure and sorting
6. **SendGrid - Email Funnel.png**: Funnel visualization stages and conversion display

---

## Assumptions & Dependencies

**Assumptions:**
- Historical data is available in Excel format (`SendGrid Stats.xlsx`) with consistent schema and will be uploaded manually by authorized users
- All authenticated users share the same Basic authentication credential (no role differentiation in MVP)
- SendGrid event types and data structure follow the documented API specification
- Dashboard users have basic familiarity with email marketing metrics (open rate, click rate, deliverability)
- All uploaded timestamps are assumed to be captured in Brisbane, Australia local time (AEST, UTC+10)

**Dependencies:**
{{ ... }}
- Data ingestion pipeline (manual upload or automated sync) - implementation method TBD
- Hosting infrastructure with HTTPS/TLS support

**Out of Scope (Future Enhancements):**
- Real-time live streaming of events (initial version supports periodic refresh)
- Email content preview or template management
- A/B testing analysis or campaign scheduling
- Predictive analytics or machine learning models
- Multi-tenant user management with role-based permissions (unless clarified in NFR-002)

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted (activity feed, metrics panel, charts, funnel, categories, export)
- [x] Ambiguities marked (authentication method)
- [x] User scenarios defined
- [x] Requirements generated (35 functional, 20 non-functional)
- [x] Entities identified (Email Event, Daily Aggregate, Category Aggregate, Funnel Stage)
- [x] Review checklist passed

---
