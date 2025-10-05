# API Contract: Domain Analytics

**Endpoint**: `/api/analytics/domains`
**Method**: GET
**Purpose**: Company-level engagement metrics for B2B lead qualification

## GET /api/analytics/domains

### Request

```typescript
GET /api/analytics/domains?trend=hot,warm&minContacts=3&limit=100

Query Parameters:
- trend: string (optional) - Comma-separated: "hot", "warm", "cold", "problematic"
- minContacts: number (default: 3) - Min unique contacts per domain
- limit: number (default: 100, max: 500) - Max domains to return
```

### Response (Success)

```typescript
200 OK
Content-Type: application/json
Cache-Control: public, max-age=300

{
  "domains": [
    {
      "domain": "acme.com",
      "unique_contacts": 12,
      "top_contacts": [
        "john@acme.com",
        "sarah@acme.com",
        "mike@acme.com"
      ],
      "total_sent": 450,
      "total_opens": 180,
      "total_clicks": 65,
      "total_bounces": 5,
      "avg_open_rate": 40.0,
      "avg_click_rate": 14.4,
      "bounce_rate": 1.1,
      "trend": "hot",
      "first_contact": "2024-01-15T08:00:00Z",
      "last_activity": "2024-06-15T10:30:00Z"
    },
    // ... more domains (sorted by avg_open_rate DESC)
  ],
  "summary": {
    "total_domains": 234,
    "hot_leads": 23,
    "warm_leads": 89,
    "at_risk": 12,
    "total_contacts_covered": 1456
  },
  "generated_at": "2024-06-15T10:30:00Z"
}
```

### Response (Error)

```typescript
400 Bad Request
{
  "error": "Invalid parameter",
  "message": "Invalid trend value: 'lukewarm'",
  "details": {
    "valid_values": ["hot", "warm", "cold", "problematic"]
  }
}
```

### Trend Classification Logic

```typescript
// Trend thresholds
const THRESHOLDS = {
  HOT: 30,           // avg_open_rate > 30%
  WARM: 15,          // 15% < avg_open_rate <= 30%
  PROBLEMATIC: 5,    // bounce_rate > 5%
};

function classifyDomain(metrics: DomainMetrics): Trend {
  if (metrics.bounce_rate > 5) return 'problematic';
  if (metrics.avg_open_rate > 30) return 'hot';
  if (metrics.avg_open_rate > 15) return 'warm';
  return 'cold';
}
```

### SQL Implementation

```sql
WITH domain_aggregates AS (
  SELECT 
    email_domain,
    COUNT(DISTINCT "Email") as unique_contacts,
    COUNT(*) as total_sent,
    SUM(CASE WHEN "Event" = 'open' THEN 1 ELSE 0 END) as total_opens,
    SUM(CASE WHEN "Event" = 'click' THEN 1 ELSE 0 END) as total_clicks,
    SUM(CASE WHEN "Event" IN ('bounce', 'dropped', 'block') THEN 1 ELSE 0 END) as total_bounces,
    MIN("Timestamp") as first_contact,
    MAX("Timestamp") as last_activity,
    ARRAY_AGG(DISTINCT "Email" ORDER BY COUNT(*) DESC) as all_contacts
  FROM sendgrid_events
  WHERE "Timestamp" >= NOW() - INTERVAL '365 days'
    AND email_domain IS NOT NULL
  GROUP BY email_domain
  HAVING COUNT(DISTINCT "Email") >= :minContacts
),
domain_metrics AS (
  SELECT 
    email_domain as domain,
    unique_contacts,
    all_contacts[1:3] as top_contacts,  -- Top 3 most active
    total_sent,
    total_opens,
    total_clicks,
    total_bounces,
    CAST(total_opens AS FLOAT) / NULLIF(unique_contacts, 0) as avg_open_rate,
    CAST(total_clicks AS FLOAT) / NULLIF(unique_contacts, 0) as avg_click_rate,
    CAST(total_bounces AS FLOAT) / NULLIF(total_sent, 0) * 100 as bounce_rate,
    first_contact,
    last_activity
  FROM domain_aggregates
)
SELECT 
  *,
  CASE 
    WHEN bounce_rate > 5 THEN 'problematic'
    WHEN avg_open_rate > 30 THEN 'hot'
    WHEN avg_open_rate > 15 THEN 'warm'
    ELSE 'cold'
  END as trend
FROM domain_metrics
ORDER BY avg_open_rate DESC
LIMIT :limit;
```

### Top Contacts Algorithm

For each domain, return the 3 emails with highest total event count (most active).

```sql
-- Subquery for top contacts
WITH contact_activity AS (
  SELECT 
    email_domain,
    "Email",
    COUNT(*) as activity_count,
    ROW_NUMBER() OVER (PARTITION BY email_domain ORDER BY COUNT(*) DESC) as rank
  FROM sendgrid_events
  GROUP BY email_domain, "Email"
)
SELECT email_domain, ARRAY_AGG("Email") as top_contacts
FROM contact_activity
WHERE rank <= 3
GROUP BY email_domain;
```

### Caching Strategy

- Cache for 5 minutes (300 seconds)
- Cache key: `domains:${trend}:${minContacts}:${limit}`
- Invalidate on new data refresh

### Export Formats

**Hot Leads Export** (all contacts from hot domains):
```csv
Domain,Email,Opens,Clicks,Engagement Score,Last Activity
acme.com,john@acme.com,35,15,145,2024-06-15
acme.com,sarah@acme.com,28,10,108,2024-06-14
```

**Domain Summary Export**:
```csv
Domain,Unique Contacts,Total Sent,Open Rate,Click Rate,Bounce Rate,Trend,Last Activity
acme.com,12,450,40.0,14.4,1.1,hot,2024-06-15
techcorp.com,8,320,35.2,12.1,2.3,hot,2024-06-14
```

### UI Integration

**Hot Leads Section**: Filter `trend=hot`, show domains with >30% avg_open_rate
**Opportunity Domains**: Filter `trend=warm`, show domains with 15-30% avg_open_rate
**At-Risk Domains**: Filter `trend=problematic`, show domains with >5% bounce rate

Each section includes "Export Contacts" button for CSV download.
