# API Contract: Enhanced Events Endpoint

**Endpoint**: `/api/events`
**Method**: POST (new), GET (existing)
**Purpose**: Fetch events with advanced multi-select filtering

## POST /api/events

### Request

```typescript
POST /api/events
Content-Type: application/json

{
  "filters": {
    "categories": ["Welcome", "Marketing"],      // Optional: Array of category names
    "eventTypes": ["open", "click"],            // Optional: Array of event types
    "dateRange": ["2024-01-01", "2024-12-31"],  // Optional: [startDate, endDate] ISO format
    "emailPattern": "*@acme.com"                 // Optional: Wildcard email pattern
  },
  "limit": 1000,                                  // Optional: Max events to return (default: 10000)
  "offset": 0                                     // Optional: Pagination offset (default: 0)
}
```

### Response (Success)

```typescript
200 OK
Content-Type: application/json

{
  "events": [
    {
      "unique_id": 1,
      "sg_event_id": "abc123",
      "email": "user@acme.com",
      "event": "open",
      "timestamp": "2024-06-15T10:30:00Z",
      "category": ["Welcome", "Onboarding"]
    },
    // ... more events
  ],
  "total": 50000,          // Total events in database (within date range)
  "filtered": 1234,        // Events matching filters
  "hasMore": true          // More results available
}
```

### Response (Error)

```typescript
400 Bad Request
{
  "error": "Invalid request",
  "message": "Invalid date format in dateRange",
  "details": {
    "field": "filters.dateRange[0]",
    "expected": "ISO 8601 date string"
  }
}

500 Internal Server Error
{
  "error": "Database error",
  "message": "Failed to execute query"
}
```

### Validation Rules

1. **categories**: Must be array of non-empty strings
2. **eventTypes**: Must be valid EventType values
3. **dateRange**: Must be valid ISO 8601 dates, start <= end
4. **emailPattern**: Supports wildcards `*` and `?`
5. **limit**: 1-10000 (enforced server-side)
6. **offset**: >= 0

### Implementation Notes

- OR logic for arrays: `WHERE category IN (...) OR event IN (...)`
- Use prepared statements to prevent SQL injection
- Apply indexes on `category`, `event`, `timestamp` columns
- Return events sorted by timestamp DESC
- Include CORS headers for Next.js API routes

## GET /api/events (Existing - No Changes)

```typescript
GET /api/events?after=12345

Response:
{
  "events": EmailEvent[],
  "loadedAt": "2024-06-15T10:30:00Z"
}
```

### Backward Compatibility

Existing GET endpoint remains unchanged for incremental refresh.
