import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  transformSupabaseEvent,
  type SupabaseEmailEvent,
} from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const afterId = searchParams.get("after");

    const supabase = createServerSupabaseClient();
    
    // Determine date filter for initial load
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const allData: SupabaseEmailEvent[] = [];
    let lastFetchedId = afterId ? parseInt(afterId, 10) : 0;
    const BATCH_SIZE = 1000;
    let hasMore = true;

    if (afterId && isNaN(lastFetchedId)) {
      return NextResponse.json(
        { error: "Invalid 'after' parameter" },
        { status: 400 }
      );
    }

    console.log(`[API] Starting fetch - afterId: ${afterId || 'none'}, date filter: ${afterId ? 'none' : oneYearAgo.toISOString()}`);

    // Fetch all records in batches
    while (hasMore) {
      let query = supabase
        .from("SendGrid_Log_Data")
        .select("*")
        .order("Unique ID", { ascending: true })
        .limit(BATCH_SIZE);

      if (afterId) {
        // Incremental refresh: fetch only records after the given unique_id
        query = query.gt("Unique ID", lastFetchedId);
      } else {
        // Initial load: fetch last 365 days
        query = query.gte("Timestamp", oneYearAgo.toISOString());
        if (lastFetchedId > 0) {
          query = query.gt("Unique ID", lastFetchedId);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error("Supabase query error:", error);
        console.error("Full error object:", JSON.stringify(error, null, 2));
        const message = error.message ?? "Unknown Supabase error";
        return NextResponse.json(
          {
            error: `Failed to fetch events from database: ${message}`,
            code: error.code ?? null,
            details: error.details ?? null,
            hint: error.hint ?? null,
          },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      allData.push(...data);
      lastFetchedId = data[data.length - 1]["Unique ID"];
      
      console.log(`[API] Fetched batch: ${data.length} records (total so far: ${allData.length}, last ID: ${lastFetchedId})`);

      // If we got fewer records than the batch size, we've reached the end
      if (data.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    console.log(`[API] Successfully fetched ${allData.length} total events from Supabase`);

    if (allData.length === 0) {
      return NextResponse.json({ events: [], count: 0 });
    }

    const events = allData.map(transformSupabaseEvent);

    return NextResponse.json({
      events,
      count: events.length,
      lastUniqueId: events[events.length - 1]?.unique_id,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
