# API Contract: Smart Insights

**Endpoint**: `/api/analytics/insights`
**Method**: GET
**Purpose**: Automated insights with actionable recommendations

## GET /api/analytics/insights

### Request

```typescript
GET /api/analytics/insights?severity=warning,critical&types=bounce,engagement

Query Parameters:
- severity: string (optional) - Comma-separated: "info", "warning", "critical"
- types: string (optional) - Comma-separated: "engagement", "bounce", "trend", "opportunity", "risk"
```

### Response (Success)

```typescript
200 OK
Content-Type: application/json
Cache-Control: public, max-age=300

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
    },
    {
      "id": "engagement-hot-001",
      "type": "engagement",
      "severity": "info",
      "title": "23 contacts from acme.com are highly engaged",
      "description": "This domain shows 45% open rate with consistent engagement. Consider prioritizing these leads.",
      "metric": 45.0,
      "metric_label": "avg open rate",
      "action": {
        "label": "Export Hot Leads",
        "type": "export",
        "exportType": "hot-leads",
        "filters": {
          "emails": ["*@acme.com"]
        }
      },
      "generated_at": "2024-06-15T10:30:00Z",
      "data_period": {
        "start": "2024-05-15T00:00:00Z",
        "end": "2024-06-15T23:59:59Z"
      }
    },
    {
      "id": "trend-decline-001",
      "type": "trend",
      "severity": "warning",
      "title": "Welcome email open rate declined 15%",
      "description": "Open rate dropped from 28% to 23% over the past 30 days. Review subject lines and send times.",
      "metric": -15.0,
      "metric_label": "% change",
      "action": {
        "label": "View Welcome Emails",
        "type": "filter",
        "filters": {
          "categories": ["Welcome"],
          "eventTypes": ["open"]
        }
      },
      "generated_at": "2024-06-15T10:30:00Z",
      "data_period": {
        "start": "2024-05-15T00:00:00Z",
        "end": "2024-06-15T23:59:59Z"
      }
    },
    {
      "id": "opportunity-warm-001",
      "type": "opportunity",
      "severity": "info",
      "title": "5 domains with moderate engagement",
      "description": "These companies show 15-25% open rates. Consider targeted re-engagement campaigns.",
      "metric": 5,
      "metric_label": "opportunity domains",
      "action": {
        "label": "See Opportunity Domains",
        "type": "navigate",
        "href": "/companies?trend=warm"
      },
      "generated_at": "2024-06-15T10:30:00Z",
      "data_period": {
        "start": "2024-03-15T00:00:00Z",
        "end": "2024-06-15T23:59:59Z"
      }
    },
    {
      "id": "risk-domain-001",
      "type": "risk",
      "severity": "warning",
      "title": "techcorp.com showing 8% bounce rate",
      "description": "This domain's bounce rate is above the 5% threshold. Verify email addresses before next campaign.",
      "metric": 8.0,
      "metric_label": "bounce rate %",
      "action": {
        "label": "View Domain Details",
        "type": "navigate",
        "href": "/companies?domain=techcorp.com"
      },
      "generated_at": "2024-06-15T10:30:00Z",
      "data_period": {
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-06-15T23:59:59Z"
      }
    }
  ],
  "generated_at": "2024-06-15T10:30:00Z",
  "rules_evaluated": [
    "bounce-warning",
    "engagement-hot-leads",
    "trend-analysis",
    "opportunity-domains",
    "risk-domains"
  ]
}
```

### Response (Error)

```typescript
400 Bad Request
{
  "error": "Invalid parameter",
  "message": "Invalid severity value: 'medium'",
  "details": {
    "valid_values": ["info", "warning", "critical"]
  }
}
```

## Insight Rules

### Rule 1: Bounce Warnings (Critical/Warning)

**Trigger**: Contacts with 3+ bounce events
**Severity**: 
- Critical: 5+ bounces
- Warning: 3-4 bounces

```typescript
function evaluateBounceWarnings(events: EmailEvent[]): SmartInsight | null {
  const bouncesByEmail = new Map<string, number>();
  
  events.forEach(e => {
    if (['bounce', 'dropped', 'block'].includes(e.event)) {
      bouncesByEmail.set(e.email, (bouncesByEmail.get(e.email) || 0) + 1);
    }
  });
  
  const critical = Array.from(bouncesByEmail.values()).filter(c => c >= 5).length;
  const warning = Array.from(bouncesByEmail.values()).filter(c => c >= 3 && c < 5).length;
  
  if (critical === 0 && warning === 0) return null;
  
  const total = critical + warning;
  return {
    id: `bounce-warning-${Date.now()}`,
    type: 'bounce',
    severity: critical > 0 ? 'critical' : 'warning',
    title: `${total} emails have bounced ${critical > 0 ? '5+' : '3+'} times`,
    description: critical > 0 
      ? 'These contacts are damaging your sender reputation and should be suppressed immediately.'
      : 'Monitor these contacts closely. Consider suppression if bounces continue.',
    metric: total,
    metric_label: critical > 0 ? 'critical bounces' : 'warning bounces',
    action: {
      label: 'View Bounce List',
      type: 'navigate',
      href: '/dashboard?t=bounce',
      exportType: 'bounce-list'
    },
    generated_at: new Date(),
    data_period: { /* ... */ }
  };
}
```

### Rule 2: Hot Lead Identification (Info)

**Trigger**: Domains with >30% avg open rate and 3+ contacts
**Severity**: Info (green - good news)

```typescript
function evaluateHotLeads(domainMetrics: DomainMetrics[]): SmartInsight[] {
  const hotDomains = domainMetrics.filter(d => d.trend === 'hot' && d.unique_contacts >= 3);
  
  if (hotDomains.length === 0) return [];
  
  return hotDomains.slice(0, 3).map(domain => ({
    id: `engagement-hot-${domain.domain}`,
    type: 'engagement',
    severity: 'info',
    title: `${domain.unique_contacts} contacts from ${domain.domain} are highly engaged`,
    description: `This domain shows ${domain.avg_open_rate.toFixed(1)}% open rate with consistent engagement. Consider prioritizing these leads.`,
    metric: domain.avg_open_rate,
    metric_label: 'avg open rate',
    action: {
      label: 'Export Hot Leads',
      type: 'export',
      exportType: 'hot-leads',
      filters: { emails: [`*@${domain.domain}`] }
    },
    generated_at: new Date(),
    data_period: { /* ... */ }
  }));
}
```

### Rule 3: Trend Analysis (Warning)

**Trigger**: Category performance declined >10% in past 30 days
**Severity**: Warning

```typescript
function evaluateTrendDecline(events: EmailEvent[]): SmartInsight[] {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  
  const recent = events.filter(e => e.timestamp >= thirtyDaysAgo);
  const previous = events.filter(e => e.timestamp >= sixtyDaysAgo && e.timestamp < thirtyDaysAgo);
  
  const recentRate = calculateOpenRate(recent);
  const previousRate = calculateOpenRate(previous);
  const change = ((recentRate - previousRate) / previousRate) * 100;
  
  if (change >= -10) return []; // No significant decline
  
  return [{
    id: `trend-decline-${Date.now()}`,
    type: 'trend',
    severity: 'warning',
    title: `Open rate declined ${Math.abs(change).toFixed(0)}%`,
    description: `Open rate dropped from ${previousRate.toFixed(0)}% to ${recentRate.toFixed(0)}% over the past 30 days. Review subject lines and send times.`,
    metric: change,
    metric_label: '% change',
    action: { /* ... */ },
    generated_at: new Date(),
    data_period: { /* ... */ }
  }];
}
```

### Rule 4: Opportunity Domains (Info)

**Trigger**: Domains with 15-30% avg open rate (warm leads)
**Severity**: Info

```typescript
function evaluateOpportunityDomains(domainMetrics: DomainMetrics[]): SmartInsight | null {
  const warmDomains = domainMetrics.filter(d => d.trend === 'warm' && d.unique_contacts >= 3);
  
  if (warmDomains.length === 0) return null;
  
  return {
    id: `opportunity-warm-${Date.now()}`,
    type: 'opportunity',
    severity: 'info',
    title: `${warmDomains.length} domains with moderate engagement`,
    description: 'These companies show 15-25% open rates. Consider targeted re-engagement campaigns.',
    metric: warmDomains.length,
    metric_label: 'opportunity domains',
    action: {
      label: 'See Opportunity Domains',
      type: 'navigate',
      href: '/companies?trend=warm'
    },
    generated_at: new Date(),
    data_period: { /* ... */ }
  };
}
```

### Rule 5: Risk Domains (Warning)

**Trigger**: Domains with >5% bounce rate
**Severity**: Warning

```typescript
function evaluateRiskDomains(domainMetrics: DomainMetrics[]): SmartInsight[] {
  const riskyDomains = domainMetrics.filter(d => d.trend === 'problematic');
  
  return riskyDomains.slice(0, 3).map(domain => ({
    id: `risk-domain-${domain.domain}`,
    type: 'risk',
    severity: 'warning',
    title: `${domain.domain} showing ${domain.bounce_rate.toFixed(1)}% bounce rate`,
    description: `This domain's bounce rate is above the 5% threshold. Verify email addresses before next campaign.`,
    metric: domain.bounce_rate,
    metric_label: 'bounce rate %',
    action: {
      label: 'View Domain Details',
      type: 'navigate',
      href: `/companies?domain=${domain.domain}`
    },
    generated_at: new Date(),
    data_period: { /* ... */ }
  }));
}
```

## Implementation Notes

### Insight Priority

When multiple insights exist, display in order:
1. Critical severity (red)
2. Warning severity (yellow)
3. Info severity (green)

Within same severity, order by:
1. Risk/Bounce (most urgent)
2. Trend (needs attention)
3. Engagement/Opportunity (optimization)

### Caching

- Cache for 5 minutes
- Invalidate on new data load
- Cache key includes date range

### UI Integration

Display in collapsible `InsightsPanel`:
- Max 5 insights shown
- Color-coded badges (red/yellow/green)
- One-click actions (navigate/export/filter)
- "See All Insights" expands to full list

### Performance

- Evaluate all rules in parallel
- Total computation time <200ms for 10k events
- Consider memoization for repeated calculations
