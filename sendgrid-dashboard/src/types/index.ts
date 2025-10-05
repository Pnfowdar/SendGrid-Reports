export type EventType =
  | "processed"
  | "delivered"
  | "open"
  | "click"
  | "bounce"
  | "deferred"
  | "dropped"
  | "unsubscribe"
  | "spamreport"
  | "block";

export interface EmailEvent {
  unique_id: number;
  sg_event_id: string;
  email: string;
  event: EventType;
  timestamp: Date;
  category: string[];
  // Legacy fields (removed from new schema)
  smtp_id?: string;
  email_account_id?: string;
}

export interface DailyAggregate {
  date: string; // YYYY-MM-DD
  requests: number;
  delivered: number;
  opens: number;
  unique_opens: number;
  clicks: number;
  unique_clicks: number;
  unsubscribes: number;
  bounces: number;
  spam_reports: number;
  blocks: number;
  bounce_drops: number;
  spam_drops: number;
}

export interface CategoryAggregate {
  category: string;
  delivered: number;
  unique_opens: number;
  unique_clicks: number;
  unsubscribes: number;
  spam_reports: number;
  open_rate: number;
  click_rate: number;
}

export type CategoryMetricKey = Exclude<keyof CategoryAggregate, "category">;

export interface KPIMetrics {
  processed: number;
  delivered_pct: number;
  bounced_blocked_pct: number;
  unique_opens_pct: number;
}

export interface FunnelStage {
  stage: "sent" | "delivered" | "unique_opened" | "unique_clicked";
  count: number;
  conversion_rate: number;
}

export interface DashboardFilters {
  dateRange: [Date | null, Date | null];
  categories: string[];          // CHANGED: was string | undefined
  emails: string[];              // CHANGED: was string | undefined, now array
  eventTypes: EventType[];       // CHANGED: was EventType | "all" | undefined
}

export interface DashboardState {
  events: EmailEvent[];
  filters: DashboardFilters;
  lastUpdated?: Date;
}

export type DashboardAction =
  | { type: "UPLOAD_DATA"; payload: { events: EmailEvent[]; uploadedAt: Date } }
  | { type: "LOAD_DATA"; payload: { events: EmailEvent[]; loadedAt: Date } }
  | { type: "APPEND_DATA"; payload: { events: EmailEvent[]; loadedAt: Date } }
  | { type: "SET_FILTERS"; payload: Partial<DashboardFilters> }
  | { type: "RESET" };

// ===== NEW ANALYTICS TYPES (T009) =====

// Engagement Analytics
export interface EngagementContact {
  email: string;
  domain: string;
  total_sent: number;
  opens: number;
  clicks: number;
  bounces: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  last_activity: Date;
  days_since_last_activity: number;
  engagement_score: number;
  tier: 'hot' | 'warm' | 'cold';
}

// Domain Analytics
export interface DomainMetrics {
  domain: string;
  unique_contacts: number;
  top_contacts: string[];
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  total_bounces: number;
  avg_open_rate: number;
  avg_click_rate: number;
  bounce_rate: number;
  engagement_score?: number;  // Average engagement score across all contacts in domain
  trend: 'hot' | 'warm' | 'cold' | 'problematic';
  first_contact: Date;
  last_activity: Date;
}

// Bounce Warnings
export interface BounceWarning {
  email: string;
  domain: string;
  bounce_count: number;
  bounce_types: EventType[];
  first_bounce: Date;
  last_bounce: Date;
  days_bouncing: number;
  severity: 'warning' | 'critical';
  action_required: 'monitor' | 'suppress';
}

// Smart Insights
export type InsightType = 'engagement' | 'bounce' | 'trend' | 'opportunity' | 'risk';
export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface SmartInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  metric?: number;
  metric_label?: string;
  action?: {
    label: string;
    type: 'navigate' | 'export' | 'filter';
    href?: string;
    exportType?: 'hot-leads' | 'bounce-list' | 'domain-contacts' | 'opportunity-leads';
    filters?: Partial<DashboardFilters>;
  };
  generated_at: Date;
  data_period: {
    start: Date;
    end: Date;
  };
}
