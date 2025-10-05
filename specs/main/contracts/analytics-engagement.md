# API Contract: Engagement Analytics

**Endpoint**: `/api/analytics/engagement`
**Method**: GET
**Purpose**: Fetch top contacts by engagement score for lead prioritization

## GET /api/analytics/engagement

### Request

```typescript
GET /api/analytics/engagement?limit=50&minScore=20&tier=hot,warm

Query Parameters:
- limit: number (default: 50, max: 200) - Max contacts to return
- minScore: number (optional) - Filter by engagement_score >= value
- tier: string (optional) - Comma-separated: "hot", "warm", "cold"
```

### Response (Success)

```typescript
200 OK
Content-Type: application/json
Cache-Control: public, max-age=300

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
    },
    // ... more contacts (sorted by engagement_score DESC)
  ],
  "summary": {
    "total_contacts": 1234,
    "avg_engagement_score": 28.5,
    "high_value_count": 45,        // score >= 50
    "warm_count": 234,              // 20 <= score < 50
    "cold_count": 955               // score < 20
  },
  "generated_at": "2024-06-15T10:30:00Z"
}
```

### Response (Error)

```typescript
400 Bad Request
{
  "error": "Invalid parameter",
  "message": "Invalid tier value: 'medium'",
  "details": {
    "valid_values": ["hot", "warm", "cold"]
  }
}

500 Internal Server Error
{
  "error": "Database error",
  "message": "Failed to calculate engagement metrics"
}
```

### Calculation Logic

```typescript
// Engagement score formula
engagement_score = (opens * 2) + (clicks * 5) + recency_bonus

where recency_bonus = max(0, 10 - days_since_last_activity)

// Tier classification
- hot: engagement_score >= 50
- warm: 20 <= engagement_score < 50
- cold: engagement_score < 20
```

### SQL Implementation

```sql
WITH contact_aggregates AS (
  SELECT 
    "Email" as email,
    email_domain as domain,
    COUNT(*) as total_sent,
    SUM(CASE WHEN "Event" = 'open' THEN 1 ELSE 0 END) as opens,
    SUM(CASE WHEN "Event" = 'click' THEN 1 ELSE 0 END) as clicks,
    SUM(CASE WHEN "Event" IN ('bounce', 'dropped', 'block') THEN 1 ELSE 0 END) as bounces,
    MAX("Timestamp") as last_activity
  FROM sendgrid_events
  WHERE "Timestamp" >= NOW() - INTERVAL '365 days'
  GROUP BY "Email", email_domain
)
SELECT 
  *,
  CAST(opens AS FLOAT) / NULLIF(total_sent, 0) * 100 as open_rate,
  CAST(clicks AS FLOAT) / NULLIF(total_sent, 0) * 100 as click_rate,
  CAST(bounces AS FLOAT) / NULLIF(total_sent, 0) * 100 as bounce_rate,
  EXTRACT(DAY FROM NOW() - last_activity) as days_since_last_activity,
  (opens * 2) + (clicks * 5) + GREATEST(0, 10 - EXTRACT(DAY FROM NOW() - last_activity)) as engagement_score,
  CASE 
    WHEN engagement_score >= 50 THEN 'hot'
    WHEN engagement_score >= 20 THEN 'warm'
    ELSE 'cold'
  END as tier
FROM contact_aggregates
WHERE total_sent >= 5  -- Filter out contacts with minimal activity
ORDER BY engagement_score DESC
LIMIT :limit;
```

### Caching Strategy

- Cache for 5 minutes (300 seconds)
- Cache key includes query parameters
- Invalidate on new data refresh

### Export Format

CSV export includes all fields plus recommended action:

```csv
Email,Domain,Total Sent,Opens,Clicks,Open Rate,Click Rate,Engagement Score,Tier,Last Activity,Action
john@acme.com,acme.com,50,35,15,70.0,30.0,145,hot,2024-06-15,Prioritize outreach
```
