import { createClient } from "@supabase/supabase-js";

export interface SupabaseEmailEvent {
  "Unique ID": number;
  Email: string;
  Event: string;
  Timestamp: string; // ISO 8601 timestamptz
  Category: string; // JSON array string
  sg_event_id: string | number;
}

// Server-side Supabase client for API routes
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE in .env.local"
    );
  }

  // IMPORTANT: Do NOT add generic type parameters to createClient()
  // Let Supabase infer types naturally to avoid authentication conflicts
  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'supabase-js-node',
        },
      },
    }
  );
}

// Transform Supabase row to EmailEvent
export function transformSupabaseEvent(row: SupabaseEmailEvent): {
  unique_id: number;
  sg_event_id: string;
  email: string;
  event: string;
  timestamp: Date;
  category: string[];
} {
  return {
    unique_id: row["Unique ID"],
    sg_event_id: String(row.sg_event_id),
    email: row.Email,
    event: row.Event,
    timestamp: new Date(row.Timestamp),
    category: JSON.parse(row.Category || "[]"),
  };
}
