# Supabase Setup Guide

## Table

The dashboard queries the `SendGrid_Log_Data` table. Keep the column names aligned with the app transform in `sendgrid-dashboard/src/lib/supabase.ts`.

```sql
CREATE TABLE "SendGrid_Log_Data" (
  "Unique ID" BIGINT PRIMARY KEY,
  "Email" TEXT NOT NULL,
  "Event" TEXT NOT NULL,
  "Timestamp" TIMESTAMPTZ NOT NULL,
  "Category" TEXT,
  "sg_event_id" TEXT NOT NULL,
  "email_domain" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_sendgrid_log_data_timestamp"
  ON "SendGrid_Log_Data" ("Timestamp");

CREATE INDEX IF NOT EXISTS "idx_sendgrid_log_data_unique_id"
  ON "SendGrid_Log_Data" ("Unique ID");
```

## Environment

Set these in `sendgrid-dashboard/.env.local` and in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key
```

`SUPABASE_SERVICE_ROLE` is used only in server routes. Do not expose it to client code.

## Import

Import SendGrid event exports from a secure local source or Supabase import workflow. The repo no longer tracks private sample datasets.

Required columns:

| Column | Notes |
| --- | --- |
| `Unique ID` | Monotonic id used for incremental refresh |
| `Email` | Recipient email |
| `Event` | SendGrid event type |
| `Timestamp` | ISO timestamp |
| `Category` | JSON array string, or empty |
| `sg_event_id` | SendGrid event id |
| `email_domain` | Domain used by company analytics |
