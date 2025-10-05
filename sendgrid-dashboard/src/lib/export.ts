import type { CategoryAggregate, DailyAggregate, EmailEvent, EngagementContact, DomainMetrics, BounceWarning } from "@/types";

function createCsvRow(columns: (string | number | null | undefined)[]): string {
  return columns
    .map((value) => {
      if (value === null || value === undefined) {
        return "";
      }
      const text = String(value);
      if (text.includes(",") || text.includes("\n") || text.includes("\"")) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    })
    .join(",");
}

function downloadFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportActivityCsv(events: EmailEvent[], filename: string) {
  const header = createCsvRow([
    "timestamp",
    "email",
    "event",
    "smtp_id",
    "categories",
    "email_account_id",
    "sg_event_id",
  ]);

  const rows = events.map((event) =>
    createCsvRow([
      event.timestamp.toISOString(),
      event.email,
      event.event,
      event.smtp_id,
      event.category.join("|") || "Uncategorized",
      event.email_account_id ?? "",
      event.sg_event_id,
    ])
  );

  downloadFile(filename, [header, ...rows].join("\n"));
}

export function exportFiguresCsv(aggregates: DailyAggregate[], filename: string) {
  const header = createCsvRow([
    "date",
    "requests",
    "delivered",
    "opens",
    "unique_opens",
    "clicks",
    "unique_clicks",
    "unsubscribes",
    "bounces",
    "spam_reports",
    "blocks",
    "bounce_drops",
    "spam_drops",
  ]);

  const rows = aggregates.map((aggregate) =>
    createCsvRow([
      aggregate.date,
      aggregate.requests,
      aggregate.delivered,
      aggregate.opens,
      aggregate.unique_opens,
      aggregate.clicks,
      aggregate.unique_clicks,
      aggregate.unsubscribes,
      aggregate.bounces,
      aggregate.spam_reports,
      aggregate.blocks,
      aggregate.bounce_drops,
      aggregate.spam_drops,
    ])
  );

  downloadFile(filename, [header, ...rows].join("\n"));
}

export function exportCategoriesCsv(categories: CategoryAggregate[], filename: string) {
  const header = createCsvRow([
    "category",
    "delivered",
    "unique_opens",
    "unique_clicks",
    "unsubscribes",
    "spam_reports",
    "open_rate",
    "click_rate",
  ]);

  const rows = categories.map((category) =>
    createCsvRow([
      category.category,
      category.delivered,
      category.unique_opens,
      category.unique_clicks,
      category.unsubscribes,
      category.spam_reports,
      category.open_rate.toFixed(2),
      category.click_rate.toFixed(2),
    ])
  );

  downloadFile(filename, [header, ...rows].join("\n"));
}

export function exportEngagementCsv(contacts: EngagementContact[], filename: string) {
  const header = createCsvRow([
    "email",
    "domain",
    "total_sent",
    "opens",
    "clicks",
    "bounces",
    "open_rate",
    "click_rate",
    "bounce_rate",
    "engagement_score",
    "tier",
    "last_activity",
    "days_since_last_activity",
  ]);

  const rows = contacts.map((contact) =>
    createCsvRow([
      contact.email,
      contact.domain,
      contact.total_sent,
      contact.opens,
      contact.clicks,
      contact.bounces,
      contact.open_rate.toFixed(1),
      contact.click_rate.toFixed(1),
      contact.bounce_rate.toFixed(1),
      Math.round(contact.engagement_score),
      contact.tier,
      contact.last_activity.toISOString(),
      contact.days_since_last_activity,
    ])
  );

  downloadFile(filename, [header, ...rows].join("\n"));
}

export function exportBounceCsv(warnings: BounceWarning[], filename: string) {
  const header = createCsvRow([
    "email",
    "domain",
    "bounce_count",
    "severity",
    "action_required",
    "first_bounce",
    "last_bounce",
  ]);

  const rows = warnings.map((warning) =>
    createCsvRow([
      warning.email,
      warning.domain,
      warning.bounce_count,
      warning.severity,
      warning.action_required,
      warning.first_bounce.toISOString(),
      warning.last_bounce.toISOString(),
    ])
  );

  downloadFile(filename, [header, ...rows].join("\n"));
}

export function exportDomainCsv(domains: DomainMetrics[], filename: string) {
  const header = createCsvRow([
    "domain",
    "unique_contacts",
    "top_contacts",
    "total_sent",
    "total_opens",
    "total_clicks",
    "total_bounces",
    "avg_open_rate",
    "avg_click_rate",
    "bounce_rate",
    "engagement_score",
    "trend",
    "first_contact",
    "last_activity",
  ]);

  const rows = domains.map((domain) =>
    createCsvRow([
      domain.domain,
      domain.unique_contacts,
      domain.top_contacts.join("; "),
      domain.total_sent,
      domain.total_opens,
      domain.total_clicks,
      domain.total_bounces,
      domain.avg_open_rate.toFixed(1),
      domain.avg_click_rate.toFixed(1),
      domain.bounce_rate.toFixed(1),
      domain.engagement_score ? Math.round(domain.engagement_score) : "",
      domain.trend,
      domain.first_contact.toISOString(),
      domain.last_activity.toISOString(),
    ])
  );

  downloadFile(filename, [header, ...rows].join("\n"));
}
