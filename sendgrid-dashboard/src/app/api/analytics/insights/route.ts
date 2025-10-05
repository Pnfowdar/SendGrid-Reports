import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateInsights } from "@/lib/insights";
import type { EmailEvent, EventType } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE!;

interface SupabaseEvent {
  'Unique ID': number;
  sg_event_id: number;
  Email: string;
  Event: string;
  Timestamp: string;
  Category: string | null;
}

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch recent events for insights
    const { data: rawEvents, error } = await supabase
      .from('SendGrid_Log_Data')
      .select('*')
      .gte('Timestamp', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('Timestamp', { ascending: false });
    
    if (error) throw error;
    
    // Transform to EmailEvent format
    const events: EmailEvent[] = (rawEvents || []).map((e: SupabaseEvent) => ({
      unique_id: e['Unique ID'],
      sg_event_id: String(e.sg_event_id || ''),
      email: e.Email,
      event: e.Event as EventType,
      timestamp: new Date(e.Timestamp),
      category: e.Category ? JSON.parse(e.Category) : [],
    }));
    
    // Generate insights
    const insights = await generateInsights(events);
    
    return NextResponse.json({
      insights,
      generated_at: new Date().toISOString(),
      rules_evaluated: [
        'bounce-warning',
        'hot-leads',
        'trend-analysis',
        'opportunity-domains',
        'risk-domains',
      ],
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
