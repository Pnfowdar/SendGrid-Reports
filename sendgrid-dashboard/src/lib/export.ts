import type { EngagementContact } from "@/types";

export function createCsvRow(columns: (string | number | null | undefined)[]): string {
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

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const contents = rows.map(createCsvRow).join("\n");
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

export function exportEngagementCsv(contacts: EngagementContact[], filename: string) {
  downloadCsv(filename, [
    [
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
    ],
    ...contacts.map((contact) => [
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
    ]),
  ]);
}
