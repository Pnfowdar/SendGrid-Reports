"use client";

import { useMemo } from "react";
import { Tag, TrendingUp } from "lucide-react";
import type { CategoryAggregate, CategoryMetricKey } from "@/types";
import { formatNumber, formatPercent } from "@/lib/format";

interface CategoriesTableProps {
  categories: CategoryAggregate[];
  isLoading?: boolean;
  onSortChange?: (key: keyof CategoryAggregate) => void;
  activeSortKey?: CategoryMetricKey;
}

const HEADERS: Array<{ key: keyof CategoryAggregate; label: string; isRate?: boolean }> = [
  { key: "category", label: "Category" },
  { key: "delivered", label: "Delivered" },
  { key: "unique_opens", label: "Unique Opens" },
  { key: "unique_clicks", label: "Unique Clicks" },
  { key: "unsubscribes", label: "Unsubscribes" },
  { key: "spam_reports", label: "Spam Reports" },
  { key: "open_rate", label: "Open Rate", isRate: true },
  { key: "click_rate", label: "Click Rate", isRate: true },
];

export function CategoriesTable({ categories, isLoading, onSortChange, activeSortKey }: CategoriesTableProps) {
  const rows = useMemo(() => categories, [categories]);

  return (
    <section
      className="rounded-2xl sm:rounded-3xl border border-border/50 bg-card/70 shadow-floating-card"
      aria-labelledby="categories-table-heading"
    >
      <header className="flex flex-col gap-2 border-b border-border/40 px-3 sm:px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
          <Tag className="h-4 w-4" aria-hidden />
          Top Categories
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
            {categories.length} tracked
          </span>
        </div>
        <p className="hidden text-xs text-muted-foreground md:block">
          Sort to highlight high-performing or problematic campaigns.
        </p>
      </header>
      <div className="relative max-h-[360px] overflow-auto">
        <table className="w-full border-collapse text-sm text-card-foreground">
          <caption className="sr-only">
            Category performance including delivered counts, engagement metrics, and rates. Sorted by {activeSortKey ?? "unique opens"} in descending order.
          </caption>
          <thead className="sticky top-0 bg-background/90 backdrop-blur">
            <tr>
              {HEADERS.map(({ key, label }) => {
                const isActive = activeSortKey && key !== "category" && activeSortKey === key;
                return (
                <th
                  key={key}
                  scope="col"
                  aria-sort={isActive ? "descending" : undefined}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  <button
                    type="button"
                    onClick={() => onSortChange?.(key)}
                    className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-left transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    aria-pressed={isActive}
                    aria-label={`Sort by ${label}`}
                  >
                    {label}
                    <TrendingUp className="h-3 w-3 opacity-40" aria-hidden />
                  </button>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={HEADERS.length} className="px-4 py-12 text-center text-muted-foreground">
                  Loading category performance...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="px-4 py-12 text-center text-muted-foreground">
                  No category level data in the current filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.category} className="border-b border-border/20 last:border-0">
                  {HEADERS.map(({ key, isRate }) => (
                    <td key={key} className="px-4 py-3 text-sm">
                      {key === "category"
                        ? row.category
                        : isRate
                        ? formatPercent(row[key] as number)
                        : formatNumber(row[key] as number)}
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
