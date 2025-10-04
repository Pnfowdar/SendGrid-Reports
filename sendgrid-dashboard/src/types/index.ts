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
  sg_event_id: string;
  smtp_id: string;
  email: string;
  event: EventType;
  timestamp: Date;
  category: string[];
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
  category?: string;
  email?: string;
  eventType?: EventType | "all";
}

export interface DashboardState {
  events: EmailEvent[];
  filters: DashboardFilters;
  lastUpdated?: Date;
}

export type DashboardAction =
  | { type: "UPLOAD_DATA"; payload: { events: EmailEvent[]; uploadedAt: Date } }
  | { type: "SET_FILTERS"; payload: Partial<DashboardFilters> }
  | { type: "RESET" };
