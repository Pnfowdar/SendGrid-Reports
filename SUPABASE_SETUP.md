# Supabase Setup Guide

## Database Schema

### Table: `sendgrid_events`

```sql
CREATE TABLE sendgrid_events (
  "Unique ID" SERIAL PRIMARY KEY,
  "Email" TEXT NOT NULL,
  "Event" TEXT NOT NULL,
  "Timestamp" TIMESTAMPTZ NOT NULL,
  "Category" TEXT, -- JSON array stored as text
  "sg_event_id" INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_sendgrid_events_timestamp ON sendgrid_events("Timestamp");
CREATE INDEX idx_sendgrid_events_unique_id ON sendgrid_events("Unique ID");
CREATE INDEX idx_sendgrid_events_email ON sendgrid_events("Email");
CREATE INDEX idx_sendgrid_events_event ON sendgrid_events("Event");
```

### Column Mapping

| Supabase Column | Type | Dashboard Field | Notes |
|-----------------|------|-----------------|-------|
| `Unique ID` | `SERIAL` | `unique_id: number` | Auto-incrementing primary key |
| `Email` | `TEXT` | `email: string` | Recipient email address |
| `Event` | `TEXT` | `event: EventType` | Event type (processed, delivered, open, click, etc.) |
| `Timestamp` | `TIMESTAMPTZ` | `timestamp: Date` | ISO 8601 timestamp with timezone |
| `Category` | `TEXT` | `category: string[]` | JSON array stored as text (parsed in app) |
| `sg_event_id` | `INTEGER` | `sg_event_id: number` | SendGrid event ID |

## CSV Import

### Sample CSV Format
```csv
Unique ID,Email,Event,Timestamp,Category,sg_event_id
1,test@example.com,processed,2025-09-23T16:50:34.000+10:00,"[""campaign_123"",""touch_456""]",1
2,test@example.com,delivered,2025-09-23T16:50:35.000+10:00,"[""campaign_123"",""touch_456""]",2
```

### Import to Supabase

1. **Via Supabase Dashboard**:
   - Go to Table Editor → `sendgrid_events`
   - Click "Insert" → "Import data from CSV"
   - Upload `SendGrid_Log_Data.csv`
   - Map columns exactly as shown above

2. **Via SQL (after creating table)**:
   ```sql
   COPY sendgrid_events("Unique ID", "Email", "Event", "Timestamp", "Category", "sg_event_id")
   FROM '/path/to/SendGrid_Log_Data.csv'
   DELIMITER ','
   CSV HEADER;
   ```

## API Integration

### Environment Variables

Add to `.env.local` and Vercel:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key
```

### Data Loading Flow

1. **Initial Load** (on dashboard mount):
   ```
   GET /api/events
   → Fetches last 365 days: WHERE Timestamp >= NOW() - INTERVAL '365 days'
   → Returns all events sorted by Unique ID ASC
   ```

2. **Incremental Refresh** (manual button click):
   ```
   GET /api/events?after=<lastUniqueId>
   → Fetches only new records: WHERE "Unique ID" > :lastUniqueId
   → Returns new events only
   → Dashboard merges and deduplicates
   ```

### Query Performance

- **Initial load**: ~1-2 seconds for 100K events/year
- **Refresh**: ~100-500ms for incremental updates
- **Indexes ensure**:
  - Fast timestamp range queries
  - Efficient unique_id incremental fetches
  - Quick email/event type filtering (future feature)

## Security Considerations

1. **Service Role Key**: Only used server-side in `/api/events`, never exposed to client
2. **Row Level Security (RLS)**: Optional - can enable if multi-tenant
3. **API Authentication**: `/api/events` protected by middleware (requires login)

## Maintenance

### Archiving Old Data

```sql
-- Archive events older than 2 years
DELETE FROM sendgrid_events
WHERE "Timestamp" < NOW() - INTERVAL '2 years';
```

### Monitoring Table Size

```sql
SELECT
  pg_size_pretty(pg_total_relation_size('sendgrid_events')) AS total_size,
  COUNT(*) AS row_count
FROM sendgrid_events;
```

## Troubleshooting

### Issue: Initial load is slow
**Solution**: Ensure indexes exist on `Timestamp` and `Unique ID`

### Issue: Duplicate events after refresh
**Solution**: Dashboard deduplicates by `unique_id` automatically

### Issue: Category field shows as string instead of array
**Solution**: Ensure CSV has proper JSON array format: `["value1","value2"]`

### Issue: Timestamp parsing errors
**Solution**: Verify all timestamps are ISO 8601 with timezone: `2025-09-23T16:50:34.000+10:00`

## Next Steps

1. Create `sendgrid_events` table in Supabase
2. Import CSV data via Table Editor or SQL
3. Verify indexes are created
4. Test queries manually in Supabase SQL editor
5. Deploy dashboard and verify data loads correctly

---

**Last Updated**: 2025-01-05
**Status**: ✅ Ready for Production
