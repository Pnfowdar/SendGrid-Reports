"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { X } from "lucide-react";
import { DateTime } from "luxon";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { FilterBar, DateRangePicker } from "@/components/filters/FilterBar";
import { MetricsPanel } from "@/components/metrics-panel/MetricsPanel";
import { ActivityFeed } from "@/components/activity-feed/ActivityFeed";
import { FiguresTable } from "@/components/figures-table/FiguresTable";
import { StatsCharts } from "@/components/stats-charts/StatsCharts";
import { FunnelChart } from "@/components/funnel/FunnelChart";
import { CategoriesTable } from "@/components/categories/CategoriesTable";
import { EmailSequenceCard } from "@/components/sequence/EmailSequenceCard";
import { ExportButton } from "@/components/export/ExportButton";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useDashboardState } from "@/hooks/useDashboardState";
import {
  computeDailyAggregates,
  computeCategoryAggregates,
  computeFunnelStages,
  computeKpiMetrics,
  computeTimeseries,
  rollupAggregates,
  type AggregateGranularity,
} from "@/lib/aggregations";
import { filterEvents, getAvailableCategories } from "@/lib/filters";
import {
  exportActivityCsv,
  exportCategoriesCsv,
  exportFiguresCsv,
} from "@/lib/export";
import type { CategoryMetricKey, EmailEvent, DashboardFilters } from "@/types";

type StoredEvents = Array<EmailEvent & { uploadedAt: Date }>;

export default function Home() {
  const [state, dispatch] = useDashboardState();
  const [granularity, setGranularity] = useState<AggregateGranularity>("daily");
  const [storedEvents, setStoredEvents] = useState<StoredEvents>([]);
  const [sortKey, setSortKey] = useState<CategoryMetricKey>("unique_opens");
  const [showStickyFilters, setShowStickyFilters] = useState(false);
  const filterSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (filterSectionRef.current) {
        const rect = filterSectionRef.current.getBoundingClientRect();
        setShowStickyFilters(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStickyEventTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: "SET_FILTERS",
      payload: { eventType: event.target.value as DashboardFilters["eventType"] },
    });
  };

  const filteredEvents = useMemo(() => filterEvents(state.events, state.filters), [state.events, state.filters]);
  const categories = useMemo(
    () => getAvailableCategories(state.events),
    [state.events]
  );

  const dailyAggregates = useMemo(() => computeDailyAggregates(filteredEvents), [filteredEvents]);
  const figures = useMemo(() => rollupAggregates(dailyAggregates, granularity), [dailyAggregates, granularity]);
  const metrics = useMemo(() => computeKpiMetrics(filteredEvents), [filteredEvents]);
  const funnelStages = useMemo(() => computeFunnelStages(filteredEvents), [filteredEvents]);
  const timeseries = useMemo(() => computeTimeseries(filteredEvents), [filteredEvents]);
  const categoryAggregates = useMemo(() => {
    const aggregates = computeCategoryAggregates(filteredEvents);
    return aggregates.sort((a, b) => b[sortKey] - a[sortKey]);
  }, [filteredEvents, sortKey]);

  const handleUpload = (events: EmailEvent[]) => {
    const uploadedAt = new Date();
    const merged = mergeEvents(storedEvents, events, uploadedAt);
    setStoredEvents(merged);
    dispatch({ type: "UPLOAD_DATA", payload: { events: merged, uploadedAt } });
  };

  const handleFiltersReset = () => {
    dispatch({ type: "RESET" });
    setGranularity("daily");
  };

  const exportActivity = async () => {
    exportActivityCsv(filteredEvents, createFilename("activity"));
  };

  const exportFigures = async () => {
    exportFiguresCsv(figures, createFilename(`figures_${granularity}`));
  };

  const exportCategories = async () => {
    exportCategoriesCsv(categoryAggregates, createFilename("categories"));
  };

  return (
    <DashboardShell
      eventsCount={state.events.length}
      lastUpdated={state.lastUpdated}
    >
      <div className="grid gap-4 sm:gap-6 md:gap-8 w-full overflow-hidden">
        <section className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card/60 p-4 sm:p-6 shadow-floating-card">
          <h2 className="text-base sm:text-lg font-semibold text-card-foreground">1. Upload Excel export</h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Choose the SendGrid Excel file (`SendGrid Stats.xlsx`) to load events into the dashboard. You can reupload to replace the current dataset.
          </p>
          <div className="mt-4">
            <UploadDropzone onUpload={handleUpload} disabled={false} />
          </div>
        </section>

        <div ref={filterSectionRef}>
          <section className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card/60 p-4 sm:p-6 shadow-floating-card">
            <div className="flex flex-col gap-3 sm:gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Filters & Controls</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Adjust filters to focus on specific recipients, event types, campaigns, or date ranges.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ExportButton onExport={exportActivity} label="Export activity" />
                <ExportButton onExport={exportFigures} label="Export figures" />
                <ExportButton onExport={exportCategories} label="Export categories" />
              </div>
            </div>
            <div className="mt-4">
              <FilterBar
                filters={state.filters}
                availableCategories={categories}
                onChange={(payload) => dispatch({ type: "SET_FILTERS", payload })}
                onReset={handleFiltersReset}
                isDisabled={!state.events.length}
              />
            </div>
          </section>
        </div>

        {/* Compact Sticky Filter Bar */}
        {showStickyFilters && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-md border-b border-border/60 shadow-lg">
            <div className="mx-auto max-w-6xl px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <input
                      type="text"
                      value={state.filters.email ?? ""}
                      onChange={(e) => dispatch({ type: "SET_FILTERS", payload: { email: e.target.value || undefined } })}
                      placeholder="Recipient email..."
                      disabled={!state.events.length}
                      className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 pr-10 text-sm text-foreground shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    {state.filters.email && (
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "SET_FILTERS", payload: { email: undefined } })}
                        aria-label="Clear recipient email filter"
                        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-muted-foreground transition hover:bg-primary/20 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    )}
                  </div>
                </div>
                <div className="min-w-[140px]">
                  <select
                    value={state.filters.eventType ?? "all"}
                    onChange={handleStickyEventTypeChange}
                    disabled={!state.events.length}
                    className="w-full rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-sm text-foreground shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 [&>option]:bg-card [&>option]:text-foreground"
                  >
                    <option value="all">All events</option>
                    <option value="delivered">Delivered</option>
                    <option value="open">Opens</option>
                    <option value="click">Clicks</option>
                    <option value="bounce">Bounces</option>
                    <option value="unsubscribe">Unsubscribes</option>
                    <option value="spam_report">Spam Reports</option>
                    <option value="dropped">Drops</option>
                    <option value="block">Blocks</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[220px]">
                  <DateRangePicker
                    value={state.filters.dateRange}
                    disabled={!state.events.length}
                    onChange={(value) => dispatch({ type: "SET_FILTERS", payload: { dateRange: value } })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="grid gap-6">
          <MetricsPanel metrics={metrics} />
          <StatsCharts data={timeseries} />
          <FiguresTable
            aggregates={figures}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />
          <FunnelChart data={funnelStages} />
          <EmailSequenceCard events={filteredEvents} dateRange={state.filters.dateRange} />
          <ActivityFeed events={filteredEvents} onRequestExport={exportActivity} />
          <CategoriesTable
            categories={categoryAggregates}
            onSortChange={(key) => setSortKey(key as CategoryMetricKey)}
            activeSortKey={sortKey}
          />
        </section>
      </div>
    </DashboardShell>
  );
}

function mergeEvents(current: StoredEvents, next: EmailEvent[], uploadedAt: Date): StoredEvents {
  const map = new Map<string, EmailEvent & { uploadedAt: Date }>();
  for (const existing of current) {
    map.set(existing.sg_event_id, existing);
  }
  for (const event of next) {
    map.set(event.sg_event_id, { ...event, uploadedAt });
  }
  return Array.from(map.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function createFilename(prefix: string): string {
  const now = DateTime.now().setZone("Australia/Brisbane").toFormat("yyyyLLdd-HHmmss");
  return `${prefix}-${now}.csv`;
}
