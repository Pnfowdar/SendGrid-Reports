"use client";

import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from "lucide-react";
import type { EmailEvent } from "@/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/utils/cn";
import { useVirtualizer } from "@tanstack/react-virtual";

interface ActivityFeedProps {
  events: EmailEvent[];
  isLoading?: boolean;
  onRequestExport?: () => void;
}

type ColumnKey = "timestamp" | "email" | "event" | "smtp_id" | "category" | "activity";

interface TableRowData {
  key: string;
  timestamp: string;
  timestampValue: number;
  email: string;
  event: string;
  smtp_id: string;
  category: string;
  activity: string;
  searchText: string;
}

interface Column {
  key: ColumnKey;
  label: string;
  sortable?: boolean;
  widthPx?: number;
  minWidthPx?: number;
  cellClassName?: string;
  render?: (row: TableRowData) => ReactNode;
}

const COLUMNS: Column[] = [
  { key: "timestamp", label: "Timestamp", sortable: true, widthPx: 160, cellClassName: "text-xs" },
  {
    key: "email",
    label: "Recipient",
    sortable: true,
    widthPx: 200,
    cellClassName: "text-card-foreground break-words whitespace-normal leading-snug",
  },
  { key: "event", label: "Event", sortable: true, widthPx: 120, cellClassName: "capitalize" },
  {
    key: "smtp_id",
    label: "SMTP ID",
    widthPx: 200,
    render: (row) => row.smtp_id || "—",
    cellClassName: "truncate text-xs text-muted-foreground",
  },
  {
    key: "category",
    label: "Categories",
    widthPx: 280,
    minWidthPx: 240,
    cellClassName: "text-xs text-muted-foreground break-words",
  },
  {
    key: "activity",
    label: "Activity",
    widthPx: 120,
    cellClassName: "text-xs text-muted-foreground",
  },
];

function getColumnStyle(column: Column) {
  const style: CSSProperties = {};
  if (column.widthPx) {
    style.width = `${column.widthPx}px`;
  }
  if (column.minWidthPx) {
    style.minWidth = `${column.minWidthPx}px`;
  }
  return style;
}

function renderColGroup() {
  return (
    <colgroup>
      {COLUMNS.map((column) => (
        <col key={column.key} style={getColumnStyle(column)} />
      ))}
    </colgroup>
  );
}

export function ActivityFeed({ events, isLoading, onRequestExport }: ActivityFeedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortState, setSortState] = useState<{ key: ColumnKey; direction: "asc" | "desc" }>({
    key: "timestamp",
    direction: "desc",
  });

  const baseRows = useMemo(() => {
    return events.map<TableRowData>((event) => ({
      key: event.sg_event_id,
      timestamp: formatDateTime(event.timestamp),
      timestampValue: event.timestamp.getTime(),
      email: event.email,
      event: event.event,
      smtp_id: event.smtp_id,
      category: event.category.length ? event.category.join(" · ") : "Uncategorized",
      activity: humanizeActivity(event.event),
      searchText: [
        formatDateTime(event.timestamp).toLowerCase(),
        event.email.toLowerCase(),
        event.event.toLowerCase(),
        (event.smtp_id ?? "").toLowerCase(),
        (event.category.length ? event.category.join(" ") : "uncategorized").toLowerCase(),
        humanizeActivity(event.event).toLowerCase(),
      ].join(" "),
    }));
  }, [events]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return baseRows;
    return baseRows.filter((row) => row.searchText.includes(query));
  }, [baseRows, searchQuery]);

  const sortedRows = useMemo(() => {
    const { key, direction } = sortState;
    const multiplier = direction === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      if (key === "timestamp") {
        return (a.timestampValue - b.timestampValue) * multiplier;
      }
      const valueA = (a[key] ?? "").toString().toLowerCase();
      const valueB = (b[key] ?? "").toString().toLowerCase();
      if (valueA < valueB) return -1 * multiplier;
      if (valueA > valueB) return 1 * multiplier;
      return 0;
    });
  }, [filteredRows, sortState]);

  const handleSort = (column: Column) => {
    if (!column.sortable) return;
    setSortState((prev) => {
      if (prev.key === column.key) {
        return {
          key: column.key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key: column.key,
        direction: column.key === "timestamp" ? "desc" : "asc",
      };
    });
  };

  const scrollParentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: sortedRows.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 48,
    overscan: 12,
  });

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl border border-border/70 bg-card/85 p-4 sm:p-6 shadow-floating-card">
      <header
        className="flex flex-col gap-3 border-b border-border/60 pb-4 md:flex-row md:items-center md:justify-between"
        aria-live="polite"
      >
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-2 text-base font-semibold text-card-foreground">
            <Search className="h-4 w-4" aria-hidden />
            Activity Feed
          </span>
          <span className="text-xs text-muted-foreground/80">
            Track the latest SendGrid events with real-time filtering for recipients, categories, and time ranges.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary" role="status">
            {sortedRows.length.toLocaleString()} events
          </span>
          {onRequestExport && (
            <button
              onClick={onRequestExport}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-xs font-medium text-card-foreground transition hover:border-primary/60 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label="Export filtered activity as CSV"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              Export CSV
            </button>
          )}
          <label className="relative flex w-full max-w-xs items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-full border border-border/60 bg-background/60 py-1.5 pl-9 pr-3 text-xs text-card-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Search activity"
              aria-label="Search activity feed"
              data-testid="activity-feed-search"
            />
          </label>
        </div>
      </header>

      <div
        ref={scrollParentRef}
        className="relative mt-4 max-h-[520px] overflow-auto rounded-2xl border border-border/40 bg-background/40"
        aria-rowcount={sortedRows.length}
      >
        <table className="min-w-full table-fixed border-collapse text-sm text-card-foreground" data-testid="activity-feed-table">
          {renderColGroup()}
          <caption className="sr-only">
            Filtered SendGrid events including timestamps, recipients, event types, SMTP identifiers, categories, and activity summary.
          </caption>
          <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
            <tr>
              {COLUMNS.map((column) => {
                const activeSort = sortState.key === column.key;
                const sortIcon = !column.sortable
                  ? null
                  : !activeSort
                  ? <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" aria-hidden />
                  : sortState.direction === "asc"
                  ? <ArrowUp className="h-3 w-3 text-primary" aria-hidden />
                  : <ArrowDown className="h-3 w-3 text-primary" aria-hidden />;

                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "border-b border-border/50 px-4 py-3 text-left text-xs font-semibold text-muted-foreground/80"
                    )}
                    style={getColumnStyle(column)}
                    aria-sort={
                      column.sortable
                        ? activeSort
                          ? sortState.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                        : undefined
                    }
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column)}
                        className="flex items-center gap-1 text-left transition hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        aria-pressed={activeSort}
                        aria-label={`Sort by ${column.label}`}
                      >
                        <span>{column.label}</span>
                        {sortIcon}
                      </button>
                    ) : (
                      <span>{column.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-muted-foreground">
                  Loading events...
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-muted-foreground">
                  No events match the current filters.
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={COLUMNS.length} className="p-0">
                  <div
                    style={{
                      position: "relative",
                      height: rowVirtualizer.getTotalSize(),
                      width: "100%",
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const row = sortedRows[virtualRow.index];
                      return (
                        <table
                          key={row.key}
                          role="presentation"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          className="table-fixed"
                        >
                          {renderColGroup()}
                          <tbody>
                            <tr
                              className="border-b border-border/20 bg-card/40 transition hover:bg-primary/10"
                              data-testid="activity-feed-row"
                            >
                              {COLUMNS.map((column) => (
                                <td
                                  key={column.key}
                                  className={cn(
                                    "px-4 py-3 text-left align-top",
                                    column.cellClassName ?? "text-xs text-muted-foreground"
                                  )}
                                  style={getColumnStyle(column)}
                                  scope={column.key === "timestamp" ? "row" : undefined}
                                >
                                  {column.render ? column.render(row) : row[column.key]}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      );
                    })}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function humanizeActivity(event: EmailEvent["event"]): string {
  switch (event) {
    case "processed":
      return "Enqueued";
    case "delivered":
      return "Delivered";
    case "open":
      return "Opened";
    case "click":
      return "Clicked";
    case "bounce":
      return "Bounced";
    case "spamreport":
      return "Marked as spam";
    case "unsubscribe":
      return "Unsubscribed";
    case "dropped":
      return "Dropped";
    case "block":
      return "Blocked";
    case "deferred":
      return "Deferred";
    default:
      return event;
  }
}
