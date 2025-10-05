import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE!;

interface SupabaseEvent {
  Email: string;
  Event: string;
  Timestamp: string;
  email_domain: string | null;
}

interface DomainData {
  domain: string;
  contacts: Set<string>;
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  total_bounces: number;
  first_contact: Date;
  last_activity: Date;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trend = searchParams.get('trend')?.split(',');
    const minContacts = parseInt(searchParams.get('minContacts') || '3');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: events, error } = await supabase
      .from('SendGrid_Log_Data')
      .select('*')
      .gte('Timestamp', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
    
    if (error) throw error;
    
    // Aggregate by domain
    const domainMap = new Map<string, DomainData>();
    
    events?.forEach((event: SupabaseEvent) => {
      const domain = event.email_domain;
      if (!domain) return;
      
      if (!domainMap.has(domain)) {
        domainMap.set(domain, {
          domain,
          contacts: new Set(),
          total_sent: 0,
          total_opens: 0,
          total_clicks: 0,
          total_bounces: 0,
          first_contact: new Date(event.Timestamp),
          last_activity: new Date(event.Timestamp),
        });
      }
      
      const domainData = domainMap.get(domain)!;
      domainData.contacts.add(event.Email);
      domainData.total_sent++;
      
      if (event.Event === 'open') domainData.total_opens++;
      if (event.Event === 'click') domainData.total_clicks++;
      if (['bounce', 'dropped', 'block'].includes(event.Event)) domainData.total_bounces++;
      
      const eventDate = new Date(event.Timestamp);
      if (eventDate < domainData.first_contact) domainData.first_contact = eventDate;
      if (eventDate > domainData.last_activity) domainData.last_activity = eventDate;
    });
    
    // Calculate metrics and classify
    let domains = Array.from(domainMap.values())
      .map((d) => {
        const unique_contacts = d.contacts.size;
        const avg_open_rate = unique_contacts > 0 ? (d.total_opens / unique_contacts) * 100 : 0;
        const avg_click_rate = unique_contacts > 0 ? (d.total_clicks / unique_contacts) * 100 : 0;
        const bounce_rate = d.total_sent > 0 ? (d.total_bounces / d.total_sent) * 100 : 0;
        
        // Calculate domain engagement score: average across contacts
        // Opens * 2 + Clicks * 5, then average per contact
        const engagement_score = unique_contacts > 0 
          ? ((d.total_opens * 2) + (d.total_clicks * 5)) / unique_contacts 
          : 0;
        
        // Classify by engagement score (same as individuals: 50+, 20-49, <20)
        let trendValue: 'hot' | 'warm' | 'cold' | 'problematic';
        if (bounce_rate > 5) trendValue = 'problematic';
        else if (engagement_score >= 50) trendValue = 'hot';    // Hot: score >= 50
        else if (engagement_score >= 20) trendValue = 'warm';   // Warm: score 20-49
        else trendValue = 'cold';                               // Cold: score < 20
        
        return {
          domain: d.domain,
          unique_contacts,
          top_contacts: Array.from(d.contacts).slice(0, 3),
          total_sent: d.total_sent,
          total_opens: d.total_opens,
          total_clicks: d.total_clicks,
          total_bounces: d.total_bounces,
          avg_open_rate,
          avg_click_rate,
          bounce_rate,
          engagement_score,
          trend: trendValue,
          first_contact: d.first_contact,
          last_activity: d.last_activity,
        };
      })
      .filter((d) => d.unique_contacts >= minContacts);
    
    // Filter by trend if specified
    if (trend && trend.length > 0) {
      domains = domains.filter((d) => trend.includes(d.trend));
    }
    
    domains = domains
      .sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0))  // Sort by engagement score
      .slice(0, limit);
    
    const summary = {
      total_domains: domainMap.size,
      hot_leads: domains.filter((d) => d.trend === 'hot').length,
      warm_leads: domains.filter((d) => d.trend === 'warm').length,
      at_risk: domains.filter((d) => d.trend === 'problematic').length,
      total_contacts_covered: domains.reduce((sum, d) => sum + d.unique_contacts, 0),
    };
    
    return NextResponse.json({
      domains,
      summary,
      generated_at: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('Domains API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain metrics' },
      { status: 500 }
    );
  }
}
