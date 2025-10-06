"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import type { ChangeEvent } from "react";
import { X, RefreshCw } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { FilterBar, DateRangePicker } from "@/components/filters/FilterBar";
import type { EventType } from "@/types";
import { MetricsPanel } from "@/components/metrics-panel/MetricsPanel";
import { InsightsPanel } from "@/components/analytics/InsightsPanel";
import { BounceWarnings } from "@/components/analytics/BounceWarnings";
import { ActivityFeed } from "@/components/activity-feed/ActivityFeed";
import { FiguresTable } from "@/components/figures-table/FiguresTable";
import { StatsCharts } from "@/components/stats-charts/StatsCharts";
import { FunnelChart } from "@/components/funnel/FunnelChart";
import { CategoriesTable } from "@/components/categories/CategoriesTable";
import { EmailSequenceCard } from "@/components/sequence/EmailSequenceCard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { Sidebar } from "@/components/navigation/Sidebar";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useSupabaseEvents } from "@/hooks/useSupabaseEvents";
import {
  computeDailyAggregates,
  computeCategoryAggregates,
  computeFunnelStages,
  computeKpiMetrics,
  computeTimeseries,
  rollupAggregates,
  rollupTimeseries,
  type AggregateGranularity,
} from "@/lib/aggregations";
import { filterEvents, getAvailableCategories } from "@/lib/filters";
import type { CategoryMetricKey, EmailEvent } from "@/types";

export default function Home() {
  const [state, dispatch] = useDashboardState();
  const [granularity, setGranularity] = useState<AggregateGranularity>("daily");
  const [chartGranularity, setChartGranularity] = useState<AggregateGranularity>("daily");
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [sortKey, setSortKey] = useState<CategoryMetricKey>("unique_opens");
  const [showStickyFilters, setShowStickyFilters] = useState(false);
  const filterSectionRef = useRef<HTMLDivElement>(null);

  const handleDataLoaded = useCallback(
    (events: EmailEvent[], loadedAt: Date) => {
      dispatch({ type: "LOAD_DATA", payload: { events, loadedAt } });
    },
    [dispatch]
  );

  const handleDataAppended = useCallback(
    (events: EmailEvent[], loadedAt: Date) => {
      dispatch({ type: "APPEND_DATA", payload: { events, loadedAt } });
    },
    [dispatch]
  );

  const { isLoading, isRefreshing, error, refreshData } = useSupabaseEvents(
    handleDataLoaded,
    handleDataAppended
  );

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
    const value = event.target.value;
    dispatch({
      type: "SET_FILTERS",
      payload: { eventTypes: value === "all" ? [] : [value as EventType] },
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
  const rawTimeseries = useMemo(() => computeTimeseries(filteredEvents), [filteredEvents]);
  const timeseries = useMemo(
    () => rollupTimeseries(rawTimeseries, chartGranularity, excludeWeekends),
    [rawTimeseries, chartGranularity, excludeWeekends]
  );
  const categoryAggregates = useMemo(() => {
    const aggregates = computeCategoryAggregates(filteredEvents);
    return aggregates.sort((a, b) => b[sortKey] - a[sortKey]);
  }, [filteredEvents, sortKey]);

  const handleFiltersReset = () => {
    dispatch({ type: "RESET" });
    setGranularity("daily");
  };

  const sections = [
    { id: "filters", label: "Filters & Controls", icon: "filters" },
    { id: "insights", label: "Insights", icon: "insights" },
    { id: "bounce-warnings", label: "Bounce Warnings", icon: "bounce-warnings" },
    { id: "metrics", label: "Metrics", icon: "metrics" },
    { id: "charts", label: "Charts", icon: "charts" },
    { id: "figures", label: "Figures", icon: "figures" },
    { id: "funnel", label: "Funnel", icon: "funnel" },
    { id: "sequences", label: "Email Sequences", icon: "sequences" },
    { id: "activity", label: "Activity Feed", icon: "activity" },
    { id: "categories", label: "Categories", icon: "categories" },
  ];

  return (
    <>
      <Sidebar sections={sections} />
      <ScrollToTop />
      <DashboardShell
        eventsCount={state.events.length}
        lastUpdated={state.lastUpdated}
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
      >
        <div className="grid gap-4 sm:gap-6 md:gap-8 w-full overflow-hidden">
        {isLoading && (
          <section className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card/60 p-8 shadow-floating-card text-center">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading events from database...</p>
            </div>
          </section>
        )}

        {error && (
          <section className="rounded-2xl sm:rounded-3xl border border-destructive/60 bg-destructive/10 p-4 sm:p-6 shadow-floating-card">
            <h2 className="text-base sm:text-lg font-semibold text-destructive">Error Loading Data</h2>
            <p className="mt-1 text-xs sm:text-sm text-destructive/80">{error}</p>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-60"
            >
              <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Retry
            </button>
          </section>
        )}

        <div ref={filterSectionRef} id="filters">
          <section className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card/60 p-4 sm:p-6 shadow-floating-card">
            <div className="flex flex-col gap-3 sm:gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Filters & Controls</h2>
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

        {/* Insights Panel */}
        {state.events.length > 0 && (
          <div id="insights">
            <InsightsPanel />
          </div>
        )}

        {/* Bounce Warnings */}
        {state.events.length > 0 && (
          <div id="bounce-warnings">
            <BounceWarnings events={filteredEvents} />
          </div>
        )}

        {/* Compact Sticky Filter Bar */}
        {showStickyFilters && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-md border-b border-border/60 shadow-lg">
            <div className="mx-auto max-w-6xl px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <input
                      type="text"
                      value={state.filters.emails[0] ?? ""}
                      onChange={(e) => dispatch({ type: "SET_FILTERS", payload: { emails: e.target.value ? [e.target.value] : [] } })}
                      placeholder="Recipient email..."
                      disabled={!state.events.length}
                      className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 pr-10 text-sm text-foreground shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    {state.filters.emails.length > 0 && (
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "SET_FILTERS", payload: { emails: [] } })}
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
                    value={state.filters.eventTypes[0] ?? "all"}
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
          <div id="metrics">
            <MetricsPanel metrics={metrics} />
          </div>
          <div id="charts">
            <StatsCharts 
              data={timeseries} 
              granularity={chartGranularity}
              onGranularityChange={setChartGranularity}
              excludeWeekends={excludeWeekends}
              onToggleWeekends={() => setExcludeWeekends(!excludeWeekends)}
            />
          </div>
          <div id="figures">
            <FiguresTable
              aggregates={figures}
              granularity={granularity}
              onGranularityChange={setGranularity}
            />
          </div>
          <div id="funnel">
            <FunnelChart data={funnelStages} />
          </div>
          <div id="sequences">
            <EmailSequenceCard events={filteredEvents} dateRange={state.filters.dateRange} />
          </div>
          <div id="activity">
            <ActivityFeed events={filteredEvents} />
          </div>
          <div id="categories">
            <CategoriesTable
              categories={categoryAggregates}
              onSortChange={(key) => setSortKey(key as CategoryMetricKey)}
              activeSortKey={sortKey}
            />
          </div>
        </section>
      </div>
    </DashboardShell>
    </>
  );
}

function createFilename(prefix: string): string {
  const now = formatInTimeZone(new Date(), "Australia/Brisbane", "yyyyMMdd-HHmmss");
  return `${prefix}-${now}.csv`;
}
