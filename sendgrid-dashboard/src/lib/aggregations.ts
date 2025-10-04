import { DateTime } from "luxon";
import type {
  CategoryAggregate,
  DailyAggregate,
  EmailEvent,
  FunnelStage,
  KPIMetrics,
} from "@/types";

const TIMEZONE = "Australia/Brisbane";

function dateKey(date: Date): string {
  return DateTime.fromJSDate(date, { zone: TIMEZONE }).toISODate() ?? "";
}

export function computeDailyAggregates(events: EmailEvent[]): DailyAggregate[] {
  const dayBuckets = new Map<string, DailyAggregate>();

  for (const event of events) {
    const bucketKey = dateKey(event.timestamp);
    if (!bucketKey) continue;

    if (!dayBuckets.has(bucketKey)) {
      dayBuckets.set(bucketKey, {
        date: bucketKey,
        requests: 0,
        delivered: 0,
        opens: 0,
        unique_opens: 0,
        clicks: 0,
        unique_clicks: 0,
        unsubscribes: 0,
        bounces: 0,
        spam_reports: 0,
        blocks: 0,
        bounce_drops: 0,
        spam_drops: 0,
      });
    }

    const record = dayBuckets.get(bucketKey)!;
    switch (event.event) {
      case "processed":
        record.requests += 1;
        break;
      case "delivered":
        record.delivered += 1;
        break;
      case "open":
        record.opens += 1;
        break;
      case "click":
        record.clicks += 1;
        break;
      case "unsubscribe":
        record.unsubscribes += 1;
        break;
      case "bounce":
        record.bounces += 1;
        break;
      case "spamreport":
        record.spam_reports += 1;
        break;
      case "block":
        record.blocks += 1;
        break;
      case "dropped":
        record.bounce_drops += 1;
        break;
      default:
        break;
    }
  }

  // Unique counts by date and email
  const openedEmailsByDay = new Map<string, Set<string>>();
  const clickedEmailsByDay = new Map<string, Set<string>>();

  for (const event of events) {
    const key = dateKey(event.timestamp);
    if (!key) continue;

    if (event.event === "open") {
      if (!openedEmailsByDay.has(key)) openedEmailsByDay.set(key, new Set());
      openedEmailsByDay.get(key)!.add(event.email.toLowerCase());
    }
    if (event.event === "click") {
      if (!clickedEmailsByDay.has(key)) clickedEmailsByDay.set(key, new Set());
      clickedEmailsByDay.get(key)!.add(event.email.toLowerCase());
    }
  }

  for (const [key, set] of openedEmailsByDay) {
    dayBuckets.get(key)!.unique_opens = set.size;
  }
  for (const [key, set] of clickedEmailsByDay) {
    dayBuckets.get(key)!.unique_clicks = set.size;
  }

  return Array.from(dayBuckets.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export type AggregateGranularity = "daily" | "weekly" | "monthly";

function createEmptyAggregate(label: string): DailyAggregate {
  return {
    date: label,
    requests: 0,
    delivered: 0,
    opens: 0,
    unique_opens: 0,
    clicks: 0,
    unique_clicks: 0,
    unsubscribes: 0,
    bounces: 0,
    spam_reports: 0,
    blocks: 0,
    bounce_drops: 0,
    spam_drops: 0,
  } satisfies DailyAggregate;
}

function accumulate(target: DailyAggregate, source: DailyAggregate) {
  target.requests += source.requests;
  target.delivered += source.delivered;
  target.opens += source.opens;
  target.unique_opens += source.unique_opens;
  target.clicks += source.clicks;
  target.unique_clicks += source.unique_clicks;
  target.unsubscribes += source.unsubscribes;
  target.bounces += source.bounces;
  target.spam_reports += source.spam_reports;
  target.blocks += source.blocks;
  target.bounce_drops += source.bounce_drops;
  target.spam_drops += source.spam_drops;
}

export function rollupAggregates(
  aggregates: DailyAggregate[],
  granularity: AggregateGranularity
): DailyAggregate[] {
  if (granularity === "daily") {
    return aggregates;
  }

  const groupMap = new Map<
    string,
    {
      aggregate: DailyAggregate;
      sortKey: string;
    }
  >();

  for (const entry of aggregates) {
    const dt = DateTime.fromISO(entry.date, { zone: TIMEZONE });
    if (!dt.isValid) continue;

    if (granularity === "weekly") {
      const start = dt.startOf("week");
      const end = start.plus({ days: 6 });
      const sortKey = start.toISODate() ?? entry.date;
      const label = `${start.toFormat("dd LLL yyyy")} – ${end.toFormat("dd LLL yyyy")}`;
      const group = groupMap.get(sortKey) ?? {
        aggregate: createEmptyAggregate(label),
        sortKey,
      };
      accumulate(group.aggregate, entry);
      groupMap.set(sortKey, group);
      continue;
    }

    const start = dt.startOf("month");
    const sortKey = start.toISODate() ?? entry.date;
    const label = start.toFormat("LLLL yyyy");
    const group = groupMap.get(sortKey) ?? {
      aggregate: createEmptyAggregate(label),
      sortKey,
    };
    accumulate(group.aggregate, entry);
    groupMap.set(sortKey, group);
  }

  return Array.from(groupMap.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((entry) => entry.aggregate);
}

export function computeCategoryAggregates(events: EmailEvent[]): CategoryAggregate[] {
  const categoryMap = new Map<string, CategoryAggregate>();
  const openEmails = new Map<string, Set<string>>();
  const clickEmails = new Map<string, Set<string>>();

  for (const event of events) {
    const categories = event.category.length ? event.category : ["Uncategorized"];
    for (const rawCategory of categories) {
      const category = rawCategory.trim() || "Uncategorized";

      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          delivered: 0,
          unique_opens: 0,
          unique_clicks: 0,
          unsubscribes: 0,
          spam_reports: 0,
          open_rate: 0,
          click_rate: 0,
        });
      }

      switch (event.event) {
        case "delivered":
          categoryMap.get(category)!.delivered += 1;
          break;
        case "open":
          if (!openEmails.has(category)) openEmails.set(category, new Set());
          openEmails.get(category)!.add(event.email.toLowerCase());
          break;
        case "click":
          if (!clickEmails.has(category)) clickEmails.set(category, new Set());
          clickEmails.get(category)!.add(event.email.toLowerCase());
          break;
        case "unsubscribe":
          categoryMap.get(category)!.unsubscribes += 1;
          break;
        case "spamreport":
          categoryMap.get(category)!.spam_reports += 1;
          break;
        default:
          break;
      }
    }
  }

  for (const [category, emails] of openEmails) {
    categoryMap.get(category)!.unique_opens = emails.size;
  }

  for (const [category, emails] of clickEmails) {
    categoryMap.get(category)!.unique_clicks = emails.size;
  }

  for (const aggregate of categoryMap.values()) {
    aggregate.open_rate = aggregate.delivered
      ? (aggregate.unique_opens / aggregate.delivered) * 100
      : 0;
    aggregate.click_rate = aggregate.delivered
      ? (aggregate.unique_clicks / aggregate.delivered) * 100
      : 0;
  }

  return Array.from(categoryMap.values()).sort(
    (a, b) => b.unique_opens - a.unique_opens
  );
}

export function computeKpiMetrics(events: EmailEvent[]): KPIMetrics {
  let processed = 0;
  let delivered = 0;
  let bounces = 0;
  let blocks = 0;
  const uniqueOpens = new Set<string>();

  for (const event of events) {
    switch (event.event) {
      case "processed":
        processed += 1;
        break;
      case "delivered":
        delivered += 1;
        break;
      case "bounce":
        bounces += 1;
        break;
      case "block":
        blocks += 1;
        break;
      case "open":
        uniqueOpens.add(event.email.toLowerCase());
        break;
      default:
        break;
    }
  }

  const denominator = delivered + bounces + blocks;
  const deliveredPct = denominator ? (delivered / denominator) * 100 : 0;
  const bouncedBlockedPct = denominator ? ((bounces + blocks) / denominator) * 100 : 0;
  const uniqueOpensPct = delivered ? (uniqueOpens.size / delivered) * 100 : 0;

  return {
    processed,
    delivered_pct: deliveredPct,
    bounced_blocked_pct: bouncedBlockedPct,
    unique_opens_pct: uniqueOpensPct,
  } satisfies KPIMetrics;
}

export function computeFunnelStages(events: EmailEvent[]): FunnelStage[] {
  const sent = new Set<string>();
  const delivered = new Set<string>();
  const opened = new Set<string>();
  const clicked = new Set<string>();

  for (const event of events) {
    const key = event.smtp_id || event.email;
    switch (event.event) {
      case "processed":
        sent.add(key);
        break;
      case "delivered":
        delivered.add(key);
        break;
      case "open":
        opened.add(event.email.toLowerCase());
        break;
      case "click":
        clicked.add(event.email.toLowerCase());
        break;
      default:
        break;
    }
  }

  const sentCount = sent.size || delivered.size || events.length;
  const deliveredCount = delivered.size;
  const uniqueOpenedCount = opened.size;
  const uniqueClickedCount = clicked.size;

  return [
    {
      stage: "sent",
      count: sentCount,
      conversion_rate: 100,
    },
    {
      stage: "delivered",
      count: deliveredCount,
      conversion_rate: sentCount ? (deliveredCount / sentCount) * 100 : 0,
    },
    {
      stage: "unique_opened",
      count: uniqueOpenedCount,
      conversion_rate: deliveredCount
        ? (uniqueOpenedCount / deliveredCount) * 100
        : 0,
    },
    {
      stage: "unique_clicked",
      count: uniqueClickedCount,
      conversion_rate: uniqueOpenedCount
        ? (uniqueClickedCount / uniqueOpenedCount) * 100
        : 0,
    },
  ];
}

export interface TimeseriesPoint {
  date: string;
  processed: number;
  delivered: number;
  opens: number;
  unique_opens: number;
  clicks: number;
  unique_clicks: number;
  bounces: number;
  unsubscribes: number;
  spam_reports: number;
  blocks: number;
  drops: number;
}

export function computeTimeseries(events: EmailEvent[]): TimeseriesPoint[] {
  const map = new Map<string, TimeseriesPoint>();
  const opensByDay = new Map<string, Set<string>>();
  const clicksByDay = new Map<string, Set<string>>();

  for (const event of events) {
    const key = dateKey(event.timestamp);
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, {
        date: key,
        processed: 0,
        delivered: 0,
        opens: 0,
        unique_opens: 0,
        clicks: 0,
        unique_clicks: 0,
        bounces: 0,
        unsubscribes: 0,
        spam_reports: 0,
        blocks: 0,
        drops: 0,
      });
    }

    const record = map.get(key)!;
    switch (event.event) {
      case "processed":
        record.processed += 1;
        break;
      case "delivered":
        record.delivered += 1;
        break;
      case "open":
        record.opens += 1;
        if (!opensByDay.has(key)) opensByDay.set(key, new Set());
        opensByDay.get(key)!.add(event.email.toLowerCase());
        break;
      case "click":
        record.clicks += 1;
        if (!clicksByDay.has(key)) clicksByDay.set(key, new Set());
        clicksByDay.get(key)!.add(event.email.toLowerCase());
        break;
      case "bounce":
        record.bounces += 1;
        break;
      case "unsubscribe":
        record.unsubscribes += 1;
        break;
      case "spamreport":
        record.spam_reports += 1;
        break;
      case "block":
        record.blocks += 1;
        break;
      case "dropped":
        record.drops += 1;
        break;
      default:
        break;
    }
  }

  for (const [key, emails] of opensByDay) {
    const record = map.get(key);
    if (record) {
      record.unique_opens = emails.size;
    }
  }

  for (const [key, emails] of clicksByDay) {
    const record = map.get(key);
    if (record) {
      record.unique_clicks = emails.size;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
