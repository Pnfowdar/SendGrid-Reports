"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import type { DailyAggregate } from "@/types";
import { formatNumber } from "@/lib/format";

interface FiguresTableProps {
  aggregates: DailyAggregate[];
  granularity: "daily" | "weekly" | "monthly";
  onGranularityChange: (value: FiguresTableProps["granularity"]) => void;
  isLoading?: boolean;
}

const COLUMNS: Array<{ key: keyof DailyAggregate; label: string }> = [
  { key: "requests", label: "Requests" },
  { key: "delivered", label: "Delivered" },
  { key: "opens", label: "Opens" },
  { key: "unique_opens", label: "Unique Opens" },
  { key: "clicks", label: "Clicks" },
  { key: "unique_clicks", label: "Unique Clicks" },
  { key: "unsubscribes", label: "Unsubscribes" },
  { key: "bounces", label: "Bounces" },
  { key: "spam_reports", label: "Spam Reports" },
  { key: "blocks", label: "Blocks" },
  { key: "bounce_drops", label: "Bounce Drops" },
  { key: "spam_drops", label: "Spam Drops" },
];

export function FiguresTable({ aggregates, granularity, onGranularityChange, isLoading }: FiguresTableProps) {
  const rows = useMemo(() => {
    return aggregates.map((aggregate) => ({
      key: aggregate.date,
      ...aggregate,
    }));
  }, [aggregates]);

  return (
    <section
      className="rounded-2xl sm:rounded-3xl border border-border/50 bg-card/70 shadow-floating-card"
      aria-labelledby="figures-table-heading"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
          <BarChart3 className="h-4 w-4" aria-hidden />
          <span id="figures-table-heading">Figures Summary</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {aggregates.length} {granularity}
            {aggregates.length === 1 ? " interval" : " intervals"}
          </span>
        </div>
        <div className="inline-flex rounded-lg border border-border/60 bg-background/40 p-1 text-xs font-medium text-muted-foreground">
          {(
            [
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onGranularityChange(value)}
              className={`rounded-md px-3 py-1 transition ${
                granularity === value
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "hover:bg-border/40"
              }`}
              aria-pressed={granularity === value}
              aria-label={`View ${label.toLowerCase()} aggregates`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="relative max-h-[420px] overflow-auto">
        <table className="w-full border-collapse text-sm text-card-foreground">
          <caption className="sr-only">
            Aggregated SendGrid metrics displayed by {granularity} granularity including requests, deliveries, engagement, and negative signals.
          </caption>
          <thead className="sticky top-0 bg-background/90 backdrop-blur">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-12 text-center text-muted-foreground">
                  Aggregating metrics...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-12 text-center text-muted-foreground">
                  No data available for this period.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.key} className="border-b border-border/20 last:border-0">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{row.key}</td>
                  {COLUMNS.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-right font-medium">
                      {formatNumber(Number(row[column.key] ?? 0))}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
