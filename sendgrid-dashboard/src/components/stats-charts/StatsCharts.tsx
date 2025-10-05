"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { formatDate } from "@/lib/format";

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
}

export function StatsCharts({ data, isLoading }: StatsChartsProps) {
  const [activeMetrics, setActiveMetrics] = useState(() => new Set(METRIC_OPTIONS.map((m) => m.key)));

  const chartData = useMemo(() => data, [data]);

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

  return (
    <section
      className="space-y-3 rounded-2xl sm:rounded-3xl border border-border/60 bg-card/70 p-4 sm:p-6 shadow-floating-card"
      aria-labelledby="stats-charts-heading"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="stats-charts-heading" className="text-sm font-semibold text-card-foreground">
            Statistics Overview
          </h2>
          <p className="text-xs text-muted-foreground">
            Toggle metrics to focus on trends across the selected date range.
          </p>
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
            <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 16, bottom: 8 }}>
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
                tickFormatter={(value: string) => formatDate(value)}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.9)",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.35)",
                }}
                labelFormatter={(label: string) =>
                  DateTime.fromISO(label).toFormat("dd LLL yyyy")
                }
                labelStyle={{ color: "#e2e8f0" }}
                itemStyle={{ color: "#e2e8f0" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 16 }}
                formatter={(value) => {
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
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
