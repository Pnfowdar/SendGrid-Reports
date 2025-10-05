# SendGrid Dashboard API Documentation

## Overview

The SendGrid Dashboard provides REST APIs for lead generation analytics, engagement scoring, and domain-level insights.

All APIs return JSON responses and support caching via `Cache-Control` headers.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

---

## Analytics APIs

### GET /api/analytics/engagement

Retrieve top engaged contacts ranked by engagement score.

**Engagement Score Formula:**
```
score = (opens × 2) + (clicks × 5) + recency_bonus
where recency_bonus = max(0, 10 - days_since_last_activity)
```

**Query Parameters:**
- `limit` (number, optional) - Max contacts to return (default: 50, max: 200)
- `minScore` (number, optional) - Minimum engagement score threshold (default: 0)
- `tier` (string, optional) - Filter by tier: "hot", "warm", or "cold"

**Tier Classification:**
- **Hot**: engagement_score >= 50
- **Warm**: 20 <= engagement_score < 50
- **Cold**: engagement_score < 20

**Response:**
```json
{
  "contacts": [
    {
      "email": "john@acme.com",
      "domain": "acme.com",
      "total_sent": 50,
      "opens": 35,
      "clicks": 15,
      "bounces": 0,
      "open_rate": 70.0,
      "click_rate": 30.0,
      "bounce_rate": 0.0,
      "last_activity": "2024-06-15T10:30:00Z",
      "days_since_last_activity": 2,
      "engagement_score": 145,
      "tier": "hot"
    }
  ],
  "summary": {
    "total_contacts": 1234,
    "avg_engagement_score": 28.5,
    "high_value_count": 45,
    "warm_count": 234,
    "cold_count": 955
  },
  "generated_at": "2024-06-15T10:30:00Z"
}
```

**Example:**
```bash
curl "http://localhost:3000/api/analytics/engagement?limit=20&minScore=30"
```

**Cache:** 5 minutes

**Use Cases:**
- Identify top leads for sales outreach
- Export hot leads for CRM import
- Prioritize re-engagement campaigns

---

### GET /api/analytics/domains

Retrieve company-level engagement metrics grouped by email domain.

**Query Parameters:**
- `trend` (string, optional) - Comma-separated filter: "hot,warm,cold,problematic"
- `minContacts` (number, optional) - Minimum unique contacts per domain (default: 3)
- `limit` (number, optional) - Max domains to return (default: 100, max: 500)

**Trend Classification:**
- **Hot**: avg_open_rate > 30%
- **Warm**: 15% < avg_open_rate <= 30%
- **Cold**: avg_open_rate <= 15%
- **Problematic**: bounce_rate > 5%

**Response:**
```json
{
  "domains": [
    {
      "domain": "acme.com",
      "unique_contacts": 12,
      "top_contacts": ["john@acme.com", "sarah@acme.com", "mike@acme.com"],
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
    }
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

**Example:**
```bash
curl "http://localhost:3000/api/analytics/domains?trend=hot,warm&minContacts=5"
```

**Cache:** 5 minutes

**Use Cases:**
- B2B lead qualification
- Company-level engagement tracking
- Identify at-risk domains for list cleaning

---

### GET /api/analytics/insights

Generate smart insights with automated recommendations.

**Query Parameters:**
- `severity` (string, optional) - Comma-separated filter: "info,warning,critical"
- `types` (string, optional) - Comma-separated filter: "engagement,bounce,trend,opportunity,risk"

**Insight Types:**
1. **Bounce Warnings** - Emails with 3+ bounces (critical/warning)
2. **Hot Leads** - High-engagement domains (info)
3. **Trend Analysis** - Performance changes >10% (warning)
4. **Opportunity Domains** - Warm leads for re-engagement (info)
5. **Risk Domains** - High bounce rates (warning)

**Response:**
```json
{
  "insights": [
    {
      "id": "bounce-warning-001",
      "type": "bounce",
      "severity": "critical",
      "title": "12 emails have bounced 5+ times",
      "description": "These contacts are damaging your sender reputation and should be suppressed immediately.",
      "metric": 12,
      "metric_label": "critical bounces",
      "action": {
        "label": "View Bounce List",
        "type": "navigate",
        "href": "/dashboard?t=bounce",
        "exportType": "bounce-list"
      },
      "generated_at": "2024-06-15T10:30:00Z",
      "data_period": {
        "start": "2023-06-15T00:00:00Z",
        "end": "2024-06-15T23:59:59Z"
      }
    }
  ],
  "generated_at": "2024-06-15T10:30:00Z",
  "rules_evaluated": [
    "bounce-warning",
    "hot-leads",
    "trend-analysis",
    "opportunity-domains",
    "risk-domains"
  ]
}
```

**Example:**
```bash
curl "http://localhost:3000/api/analytics/insights?severity=critical,warning"
```

**Cache:** 5 minutes

**Use Cases:**
- Automated email health monitoring
- Proactive list maintenance alerts
- Lead opportunity identification

---

## Error Responses

All APIs return standard error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error

---

## Rate Limiting

No rate limiting is currently enforced, but APIs use 5-minute cache headers to reduce database load.

**Best Practices:**
- Cache responses on the client side
- Use query parameters to filter results
- Batch API calls where possible

---

## CSV Export Formats

### Hot Leads Export
```csv
Email,Domain,Total Sent,Opens,Clicks,Open Rate,Click Rate,Engagement Score,Tier,Last Activity
john@acme.com,acme.com,50,35,15,70.0,30.0,145,hot,2024-06-15
```

### Domain Summary Export
```csv
Domain,Unique Contacts,Total Sent,Open Rate,Click Rate,Bounce Rate,Trend,Last Activity
acme.com,12,450,40.0,14.4,1.1,hot,2024-06-15
```

### Suppression List Export
```csv
Email,Domain,Bounce Count,Severity,Action Required,First Bounce,Last Bounce
test@bounce.com,bounce.com,7,critical,suppress,2024-01-15,2024-06-10
```

---

## Database Schema

The APIs query the `SendGrid_Log_Data` table in Supabase:

**Computed Columns:**
- `email_domain` - Extracted from email via `SUBSTRING("Email" FROM '@(.*)$')`

**Indexes:**
- `idx_sendgrid_email_domain` - Fast domain grouping
- `idx_sendgrid_email` - Fast email lookups
- `idx_sendgrid_event` - Fast event type filtering

---

## Example Workflows

### Workflow 1: Identify and Export Hot Leads

```bash
# 1. Get top engaged contacts
curl "http://localhost:3000/api/analytics/engagement?limit=50&minScore=50" > hot-leads.json

# 2. Filter hot domains
curl "http://localhost:3000/api/analytics/domains?trend=hot" > hot-domains.json

# 3. Export via UI or process JSON for CRM import
```

### Workflow 2: Bounce List Maintenance

```bash
# 1. Get insights to identify bounces
curl "http://localhost:3000/api/analytics/insights?types=bounce" > bounce-insights.json

# 2. Export suppression list via UI
# 3. Upload to SendGrid suppression list
```

### Workflow 3: Weekly Lead Review

```bash
# 1. Get all insights
curl "http://localhost:3000/api/analytics/insights" > weekly-insights.json

# 2. Get top 20 leads
curl "http://localhost:3000/api/analytics/engagement?limit=20" > top-leads.json

# 3. Review opportunity domains
curl "http://localhost:3000/api/analytics/domains?trend=warm" > opportunities.json
```

---

## Support

For issues or questions:
1. Check the main dashboard README
2. Review API response error messages
3. Inspect Network tab in browser DevTools
4. Verify Supabase connection and credentials

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-05
