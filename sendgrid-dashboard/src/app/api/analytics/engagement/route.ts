import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE!;

interface SupabaseEvent {
  'Unique ID': number;
  Email: string;
  Event: string;
  Timestamp: string;
  Category: string | null;
  sg_event_id: number;
  email_domain: string | null;
}

interface ContactData {
  email: string;
  domain: string;
  total_sent: number;
  opens: number;
  clicks: number;
  bounces: number;
  last_activity: Date;
  open_rate?: number;
  click_rate?: number;
  bounce_rate?: number;
  days_since_last_activity?: number;
  engagement_score?: number;
  tier?: 'hot' | 'warm' | 'cold';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const minScore = parseFloat(searchParams.get('minScore') || '0');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Query for engagement metrics
    const { data: events, error } = await supabase
      .from('SendGrid_Log_Data')
      .select('*')
      .gte('Timestamp', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
    
    if (error) throw error;
    
    // Calculate engagement metrics per contact
    const contactMap = new Map<string, ContactData>();
    
    events?.forEach((event: SupabaseEvent) => {
      const email = event.Email;
      if (!contactMap.has(email)) {
        contactMap.set(email, {
          email,
          domain: event.email_domain || email.split('@')[1] || '',
          total_sent: 0,
          opens: 0,
          clicks: 0,
          bounces: 0,
          last_activity: new Date(event.Timestamp),
        });
      }
      
      const contact = contactMap.get(email)!;
      contact.total_sent++;
      
      if (event.Event === 'open') contact.opens++;
      if (event.Event === 'click') contact.clicks++;
      if (['bounce', 'dropped', 'block'].includes(event.Event)) contact.bounces++;
      
      const eventDate = new Date(event.Timestamp);
      if (eventDate > contact.last_activity) {
        contact.last_activity = eventDate;
      }
    });
    
    // Calculate rates and engagement scores
    const contacts = Array.from(contactMap.values())
      .map((contact: ContactData) => {
        const open_rate = contact.total_sent > 0 ? (contact.opens / contact.total_sent) * 100 : 0;
        const click_rate = contact.total_sent > 0 ? (contact.clicks / contact.total_sent) * 100 : 0;
        const bounce_rate = contact.total_sent > 0 ? (contact.bounces / contact.total_sent) * 100 : 0;
        
        const days_since_last_activity = Math.floor(
          (Date.now() - contact.last_activity.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const recency_bonus = Math.max(0, 10 - days_since_last_activity);
        const engagement_score = (contact.opens * 2) + (contact.clicks * 5) + recency_bonus;
        
        const tier = engagement_score >= 50 ? 'hot' : engagement_score >= 20 ? 'warm' : 'cold';
        
        return {
          ...contact,
          open_rate,
          click_rate,
          bounce_rate,
          days_since_last_activity,
          engagement_score,
          tier,
        };
      })
      .filter((c) => {
        // Always require minimum sends
        if (c.total_sent < 5) return false;
        // If minScore is 0, include all (even cold)
        if (minScore === 0) return true;
        // Otherwise filter by score
        return c.engagement_score! >= minScore;
      })
      .sort((a, b) => b.engagement_score! - a.engagement_score!)
      .slice(0, limit);
    
    const summary = {
      total_contacts: contactMap.size,
      avg_engagement_score: contacts.reduce((sum, c) => sum + (c.engagement_score || 0), 0) / contacts.length || 0,
      high_value_count: contacts.filter((c) => (c.engagement_score || 0) >= 50).length,
      warm_count: contacts.filter((c) => (c.engagement_score || 0) >= 20 && (c.engagement_score || 0) < 50).length,
      cold_count: contacts.filter((c) => (c.engagement_score || 0) < 20).length,
    };
    
    return NextResponse.json({
      contacts,
      summary,
      generated_at: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Engagement API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement data' },
      { status: 500 }
    );
  }
}
