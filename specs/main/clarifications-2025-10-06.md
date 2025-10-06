# Clarification Questions - 2025-10-06

**Context**: New requirements for 30-day rolling context window, cross-table metrics, header reorganization, scroll navigation, and data persistence.

---

## Q1: 30-Day Context Window Scope

**Question**: Should the 30-day rolling context window apply to ALL dashboard segments (metrics, charts, figures, categories) or ONLY to Email Sequences?

**Context**: You mentioned "every segment" should calculate based on the past 30 days even when filtering to "yesterday." However:
- **Metrics Panel** (Open Rate, Click Rate, Bounce Rate): Should these show rates based on 30-day context or just filtered dates?
- **Charts/Figures**: Should trend charts show data points from filtered dates but calculate rates using 30-day context?
- **Email Sequences**: Clearly needs 30-day context (you explicitly mentioned this example)

**Options**:
- **A)** All aggregations use 30-day context for rate calculations (may confuse users when filtering to "yesterday")
- **B)** Only Email Sequences use 30-day context; other segments show data for filtered date range only
- **C)** Split view: Display counts from filtered dates, but show rates/percentages based on 30-day context (with tooltip explanation)

**Preference**: ___________

---

## Q2: Cross-Table Metrics Mobile/Responsive Strategy

**Question**: When adding Clicks/Opens to rate tables, how should we handle smaller screens where additional columns may not fit?

**Current Tables**:
- **Top Openers**: Email, Domain, Opens, Open Rate → Adding: Clicks, Click Rate
- **Top Clickers**: Email, Domain, Clicks, Click Rate → Adding: Opens, Open Rate
- **Top Engaged**: Currently shows all metrics

**Options**:
- **A)** Hide less critical columns on mobile (e.g., hide "Domain" column on screens <768px)
- **B)** Horizontal scroll on mobile/tablet (preserve all columns, users scroll right)
- **C)** Collapsible detail rows (click row to expand and see additional metrics)
- **D)** Separate "Details" button per row that opens a modal with full metrics

**Preference**: ___________

---

## Q3: Refresh Data Button Behavior

**Question**: Should the "Refresh Data" button in the header bypass the 12-hour cache or respect it?

**Context**: You want data to persist until manual refresh OR 12-hour auto-refresh.

**Options**:
- **A)** "Refresh Data" always fetches fresh data from database (bypasses cache, resets 12-hour timer)
- **B)** "Refresh Data" only fetches if cache is stale (>12 hours), otherwise just re-renders with cached data
- **C)** Two buttons: "Refresh Data" (fetch new) and "Reload View" (re-render from cache)

**Preference**: ___________

---

## Q4: Hamburger Menu Positioning

**Question**: Where should the hamburger menu be positioned for optimal UX?

**Options**:
- **A)** Fixed top-left corner (as designed in tasks), separate from header
- **B)** Integrated into header navigation bar, next to Dashboard/Individuals/Companies tabs
- **C)** Mobile-only (hamburger on mobile, inline section links on desktop)
- **D)** Bottom-left corner (less common, but keeps top area cleaner)

**Preference**: ___________

---

## Q5: 30-Day Context Performance Fallback

**Question**: If 30-day context calculations degrade performance with large datasets (e.g., >20k events), what should the fallback strategy be?

**Scenario**: User has 50k events loaded. Filtering to "yesterday" returns 500 events, but 30-day context includes 15k events. Sequence calculation may take >500ms.

**Options**:
- **A)** No fallback - accept slower performance as known limitation for large datasets
- **B)** Show warning banner: "Large dataset detected. 30-day context may be slower. [Disable Context]"
- **C)** Automatic "lite mode": Disable 30-day context if dataset >15k events (show notification)
- **D)** Progressive calculation: Calculate context in Web Worker, show loading spinner for sequences

**Preference**: ___________

---

## Response Template

Please answer all 5 questions using this format:

```
Q1: [A/B/C] - [Optional: additional notes]
Q2: [A/B/C/D] - [Optional: additional notes]
Q3: [A/B/C] - [Optional: additional notes]
Q4: [A/B/C/D] - [Optional: additional notes]
Q5: [A/B/C/D] - [Optional: additional notes]
```

---

**Next Steps**: Once clarifications are received, I will proceed with implementation following the updated plan and tasks.
