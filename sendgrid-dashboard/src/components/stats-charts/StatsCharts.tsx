"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import { startOfWeek, endOfWeek } from "date-fns";
import { formatDate } from "@/lib/format";
import { formatInTimeZone } from "date-fns-tz";
import { Eye, EyeOff } from "lucide-react";

const TIMEZONE = "Australia/Brisbane";

interface TimeseriesPoint {
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

const METRIC_OPTIONS: Array<{
  key: keyof TimeseriesPoint;
  label: string;
  color: string;
}> = [
  { key: "delivered", label: "Delivered", color: "#3b82f6" },
  { key: "unique_opens", label: "Unique Opens", color: "#10b981" },
  { key: "unique_clicks", label: "Unique Clicks", color: "#a855f7" },
  { key: "bounces", label: "Bounces", color: "#ef4444" },
  { key: "spam_reports", label: "Spam Reports", color: "#f59e0b" },
];

interface StatsChartsProps {
  data: TimeseriesPoint[];
  isLoading?: boolean;
  granularity?: "daily" | "weekly" | "monthly";
  onGranularityChange?: (value: "daily" | "weekly" | "monthly") => void;
  excludeWeekends?: boolean;
  onToggleWeekends?: () => void;
}

export function StatsCharts({ 
  data, 
  isLoading, 
  granularity = "daily",
  onGranularityChange,
  excludeWeekends = false,
  onToggleWeekends
}: StatsChartsProps) {
  const [activeMetrics, setActiveMetrics] = useState(() => new Set(METRIC_OPTIONS.map((m) => m.key)));
  const [showTrendlines, setShowTrendlines] = useState(true);

  const chartData = useMemo(() => data, [data]);

  // Calculate trendline using linear regression
  const calculateTrendline = (dataPoints: number[]): number[] => {
    const n = dataPoints.length;
    if (n === 0) return [];
    
    const xSum = (n * (n - 1)) / 2;
    const ySum = dataPoints.reduce((sum, val) => sum + val, 0);
    const xySum = dataPoints.reduce((sum, val, i) => sum + i * val, 0);
    const xxSum = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;
    
    return dataPoints.map((_, i) => slope * i + intercept);
  };

  type TrendlineSeries = Record<string, number[]>;

  const trendlineData = useMemo<TrendlineSeries>(() => {
    if (!showTrendlines) return {};
    
    const trends: TrendlineSeries = {};
    METRIC_OPTIONS.forEach(({ key }) => {
      if (activeMetrics.has(key)) {
        const values = chartData.map(d => d[key] as number);
        trends[`${key}_trend`] = calculateTrendline(values);
      }
    });
    return trends;
  }, [chartData, activeMetrics, showTrendlines]);

  const enrichedChartData = useMemo(() => {
    return chartData.map((point, index) => {
      const trendValues: Partial<Record<string, number>> = {};
      Object.entries(trendlineData).forEach(([key, values]) => {
        trendValues[key] = values[index] ?? 0;
      });
      return { ...point, ...trendValues } as TimeseriesPoint & Partial<Record<string, number>>;
    });
  }, [chartData, trendlineData]);

  const toggleMetric = (key: keyof TimeseriesPoint) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const formatXAxisLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    if (granularity === "weekly") {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      return formatInTimeZone(start, TIMEZONE, "dd LLL");
    }
    if (granularity === "monthly") {
      return formatInTimeZone(date, TIMEZONE, "LLL yy");
    }
    return formatInTimeZone(date, TIMEZONE, "dd LLL");
  };

  const formatTooltipLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    if (granularity === "weekly") {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      return `${formatInTimeZone(start, TIMEZONE, "dd LLL")} – ${formatInTimeZone(end, TIMEZONE, "dd LLL yyyy")}`;
    }
    if (granularity === "monthly") {
      return formatInTimeZone(date, TIMEZONE, "LLLL yyyy");
    }
    return formatDate(dateStr);
  };

  return (
    <section
      className="space-y-3 rounded-2xl sm:rounded-3xl border border-border/60 bg-card/70 p-4 sm:p-6 shadow-floating-card"
      aria-labelledby="stats-charts-heading"
    >
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="stats-charts-heading" className="text-sm font-semibold text-card-foreground">
              Statistics Overview
            </h2>
            <p className="text-xs text-muted-foreground">
              Toggle metrics to focus on trends across the selected date range.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onGranularityChange && (
              <div className="inline-flex rounded-lg border border-border/60 bg-background/40 p-1 text-xs font-medium text-muted-foreground">
                {(["daily", "weekly", "monthly"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onGranularityChange(value)}
                    className={`rounded-md px-3 py-1 transition capitalize ${
                      granularity === value
                        ? "bg-primary/15 text-primary shadow-sm"
                        : "hover:bg-border/40"
                    }`}
                    aria-pressed={granularity === value}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}
            {onToggleWeekends && granularity === "daily" && (
              <button
                type="button"
                onClick={onToggleWeekends}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  excludeWeekends
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
                }`}
                title={excludeWeekends ? "Show weekends" : "Hide weekends"}
              >
                {excludeWeekends ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                Weekends
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowTrendlines(!showTrendlines)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                showTrendlines
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
              }`}
              title={showTrendlines ? "Hide trendlines" : "Show trendlines"}
            >
              Trendlines
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {METRIC_OPTIONS.map(({ key, label, color }) => {
            const isActive = activeMetrics.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleMetric(key)}
                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  isActive
                    ? "border-transparent bg-primary/15 text-primary shadow-sm"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
                }`}
                aria-pressed={isActive}
                aria-label={`${isActive ? "Hide" : "Show"} ${label} metric`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="h-[320px] w-full" role="img" aria-label="Time series chart of email metrics">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Rendering charts...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={enrichedChartData} margin={{ left: 12, right: 12, top: 16, bottom: 8 }}>
              <defs>
                {METRIC_OPTIONS.map(({ key, color }) => (
                  <linearGradient id={`color-${key}`} key={key} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={formatXAxisLabel}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.9)",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.35)",
                }}
                labelFormatter={formatTooltipLabel}
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#e2e8f0" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 16 }}
                formatter={(value) => {
                  if (value.endsWith('_trend')) return null;
                  const entry = METRIC_OPTIONS.find((option) => option.key === value);
                  return entry?.label ?? value;
                }}
              />
              {METRIC_OPTIONS.filter((option) => activeMetrics.has(option.key)).map(({ key, color }) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={color}
                  fillOpacity={1}
                  fill={`url(#color-${key})`}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
              {showTrendlines && METRIC_OPTIONS.filter((option) => activeMetrics.has(option.key)).map(({ key, color }) => (
                <Line
                  key={`${key}_trend`}
                  type="monotone"
                  dataKey={`${key}_trend`}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  opacity={0.7}
                  name={`${key}_trend`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
