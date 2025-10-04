"use client";

import { useMemo, useState } from "react";
import { BarChart3, TrendingUp, Users, Mail, Calendar, ChevronDown } from "lucide-react";
import type { SequenceTrend } from "@/lib/sequence-analytics";
import type { EmailEvent } from "@/types";
import {
  analyzeEmailSequences,
  calculateComparison,
  type TimeGranularity,
  type SequenceMetrics,
} from "@/lib/sequence-analytics";
import { cn } from "@/utils/cn";
import { format } from "date-fns";

interface EmailSequenceCardProps {
  events: EmailEvent[];
  dateRange: [Date | null, Date | null];
  isLoading?: boolean;
}

const GRANULARITY_OPTIONS: { value: TimeGranularity; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function EmailSequenceCard({ events, dateRange, isLoading }: EmailSequenceCardProps) {
  const [granularity, setGranularity] = useState<TimeGranularity>("weekly");
  const [showComparison, setShowComparison] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<SequenceMetrics | null>(null);

  const analytics = useMemo(() => {
    if (isLoading || !dateRange[0] || !dateRange[1]) return null;
    return analyzeEmailSequences(events, dateRange, granularity);
  }, [events, dateRange, granularity, isLoading]);

  const comparison = useMemo(() => {
    if (!showComparison || isLoading || !dateRange[0] || !dateRange[1]) return null;
    return calculateComparison(events, dateRange, granularity);
  }, [events, dateRange, granularity, showComparison, isLoading]);

  const trendSeries = useMemo(() => {
    if (!analytics) return [];
    return analytics.trends;
  }, [analytics]);

  const maxCount = useMemo(() => {
    if (!analytics) return 0;
    return Math.max(...analytics.metrics.map((m) => m.totalSent));
  }, [analytics]);

  if (isLoading) {
    return (
      <section
        className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-floating-card"
        aria-labelledby="sequence-heading"
      >
        <header className="flex items-center gap-2 border-b border-border/60 pb-4">
          <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
          <h2 id="sequence-heading" className="text-base font-semibold text-card-foreground">
            Email Sequence Analytics
          </h2>
        </header>
        <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
          Analyzing email sequences...
        </div>
      </section>
    );
  }

  if (!analytics || analytics.metrics.length === 0) {
    return (
      <section
        className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-floating-card"
        aria-labelledby="sequence-heading"
      >
        <header className="flex items-center gap-2 border-b border-border/60 pb-4">
          <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
          <h2 id="sequence-heading" className="text-base font-semibold text-card-foreground">
            Email Sequence Analytics
          </h2>
        </header>
        <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
          No sequence data available for the selected period
        </div>
      </section>
    );
  }

  const currentMetrics = comparison?.current.metrics || analytics.metrics;
  const previousMetrics = comparison?.previous.metrics || [];

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <section
      className="rounded-2xl sm:rounded-3xl border border-border/70 bg-card/85 p-4 sm:p-6 shadow-floating-card"
      aria-labelledby="sequence-heading"
    >
      <header className="flex flex-col gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
            <h2 id="sequence-heading" className="text-base font-semibold text-card-foreground">
              Email Sequence Analytics
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as TimeGranularity)}
                className="appearance-none rounded-lg border border-border/60 bg-card/80 py-2 pl-3 pr-9 text-xs text-foreground shadow-inner transition hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 [&>option]:bg-card [&>option]:text-foreground"
              >
                {GRANULARITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/40",
                showComparison
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              Compare Periods
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/80">
          Track how many emails each recipient receives in their journey. Sequence position is determined by the order of
          "processed" events per recipient.
        </p>
      </header>

      {/* Summary Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Mail className="h-4 w-4" />}
          label="Total Emails"
          value={analytics.totalEmails.toLocaleString()}
          change={
            comparison
              ? getPercentageChange(analytics.totalEmails, comparison.previous.totalEmails)
              : undefined
          }
        />
        <SummaryCard
          icon={<Users className="h-4 w-4" />}
          label="Unique Recipients"
          value={analytics.uniqueRecipients.toLocaleString()}
          change={
            comparison
              ? getPercentageChange(analytics.uniqueRecipients, comparison.previous.uniqueRecipients)
              : undefined
          }
        />
        <SummaryCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg Sequence Depth"
          value={analytics.averageSequenceDepth.toFixed(1)}
          change={
            comparison
              ? getPercentageChange(analytics.averageSequenceDepth, comparison.previous.averageSequenceDepth)
              : undefined
          }
        />
        <SummaryCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Max Sequence"
          value={analytics.metrics.length.toString()}
          change={
            comparison
              ? getPercentageChange(analytics.metrics.length, comparison.previous.metrics.length)
              : undefined
          }
        />
      </div>


      {/* Charts Side by Side */}
      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h3 className="mb-3 sm:mb-4 text-sm font-medium text-card-foreground">Sequence Distribution</h3>
          <div className="rounded-lg sm:rounded-xl border border-border/50 bg-background/20 p-3 sm:p-4">
            <SequenceBarChart
              data={currentMetrics}
              previous={previousMetrics}
              maxCount={maxCount}
              onSelect={setSelectedSequence}
            />
          </div>
        </div>
        {!!trendSeries.length && (
          <div className="lg:col-span-2">
            <h3 className="mb-3 sm:mb-4 text-sm font-medium text-card-foreground">Sequence Trend</h3>
            <div className="rounded-lg sm:rounded-xl border border-border/50 bg-background/20 p-3 sm:p-4">
              <SequenceTrendChart trends={trendSeries} granularity={granularity} />
            </div>
          </div>
        )}
      </div>

      {/* Detailed Table */}
      <div className="mt-6 sm:mt-8">
        <h3 className="mb-4 text-sm font-medium text-card-foreground">Detailed Breakdown</h3>
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/20">
              <tr>
                <th className="border-b border-border/50 px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Sequence
                </th>
                <th className="border-b border-border/50 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Total Sent
                </th>
                <th className="border-b border-border/50 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Recipients
                </th>
                <th className="border-b border-border/50 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Open Rate
                </th>
                <th className="border-b border-border/50 px-4 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Click Rate
                </th>
                <th className="border-b border-border/50 px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentMetrics.map((metric, index) => (
                <tr
                  key={metric.sequenceNumber}
                  className={cn(
                    "transition hover:bg-muted/10",
                    index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                  )}
                >
                  <td className="border-b border-border/30 px-4 py-3 text-left font-medium text-card-foreground">
                    Sequence #{metric.sequenceNumber}
                  </td>
                  <td className="border-b border-border/30 px-4 py-3 text-right text-card-foreground">
                    {metric.totalSent.toLocaleString()}
                  </td>
                  <td className="border-b border-border/30 px-4 py-3 text-right text-muted-foreground">
                    {metric.uniqueRecipients.toLocaleString()}
                  </td>
                  <td className="border-b border-border/30 px-4 py-3 text-right text-primary">
                    {metric.openRate.toFixed(1)}%
                  </td>
                  <td className="border-b border-border/30 px-4 py-3 text-right text-primary">
                    {metric.clickRate.toFixed(1)}%
                  </td>
                  <td className="border-b border-border/30 px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedSequence(metric)}
                      className="rounded-md border border-primary/60 bg-primary/10 px-2 py-1 text-xs text-primary transition hover:bg-primary/20"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Selected Sequence Details */}
      {selectedSequence && (
        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-card-foreground">
              Sequence {selectedSequence.sequenceNumber} Details
            </h4>
            <button
              onClick={() => setSelectedSequence(null)}
              className="text-xs text-muted-foreground hover:text-card-foreground"
            >
              Close
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-background/40 p-3">
              <div className="text-xs text-muted-foreground">Recipients</div>
              <div className="mt-1 text-lg font-semibold text-card-foreground">
                {selectedSequence.uniqueRecipients}
              </div>
            </div>
            <div className="rounded-lg bg-background/40 p-3">
              <div className="text-xs text-muted-foreground">Total Sent</div>
              <div className="mt-1 text-lg font-semibold text-card-foreground">
                {selectedSequence.totalSent}
              </div>
            </div>
            <div className="rounded-lg bg-background/40 p-3">
              <div className="text-xs text-muted-foreground">Open Rate</div>
              <div className="mt-1 text-lg font-semibold text-primary">
                {selectedSequence.openRate.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg bg-background/40 p-3">
              <div className="text-xs text-muted-foreground">Click Rate</div>
              <div className="mt-1 text-lg font-semibold text-primary">
                {selectedSequence.clickRate.toFixed(1)}%
              </div>
            </div>
          </div>
          {selectedSequence.recipients.length > 0 && (
            <div className="mt-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Recipients ({selectedSequence.recipients.length})
              </div>
              <div className="max-h-32 overflow-y-auto rounded-lg bg-background/40 p-2">
                <div className="space-y-1">
                  {selectedSequence.recipients.slice(0, 20).map((email) => (
                    <div key={email} className="text-xs text-card-foreground">
                      {email}
                    </div>
                  ))}
                  {selectedSequence.recipients.length > 20 && (
                    <div className="text-xs italic text-muted-foreground">
                      ...and {selectedSequence.recipients.length - 20} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

interface SequenceBarChartProps {
  data: SequenceMetrics[];
  previous: SequenceMetrics[];
  maxCount: number;
  onSelect: (metric: SequenceMetrics) => void;
}

function SequenceBarChart({ data, previous, maxCount, onSelect }: SequenceBarChartProps) {
  const chartHeight = 240;
  const barWidth = 36;
  const barGap = 24;
  const chartPadding = 32;
  const totalWidth = chartPadding * 2 + data.length * barWidth + Math.max(0, data.length - 1) * barGap;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${totalWidth} ${chartHeight + 60}`}
        className="w-full h-auto max-h-[320px]"
        role="img"
        aria-label="Bar chart showing email counts per sequence number"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="sequence-bar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* Axes */}
        <line
          x1={chartPadding}
          y1={chartHeight}
          x2={totalWidth - chartPadding / 2}
          y2={chartHeight}
          stroke="rgba(148,163,184,0.3)"
          strokeWidth={1}
        />

        {data.map((metric, index) => {
          const x = chartPadding + index * (barWidth + barGap);
          const barHeight = maxCount > 0 ? (metric.totalSent / maxCount) * (chartHeight - 24) : 0;
          const previousMetric = previous.find((m) => m.sequenceNumber === metric.sequenceNumber);
          const previousHeight = previousMetric && maxCount > 0 ? (previousMetric.totalSent / maxCount) * (chartHeight - 24) : 0;

          return (
            <g key={metric.sequenceNumber} transform={`translate(${x}, 0)`}>
              {previousMetric && previousHeight > 0 && (
                <rect
                  x={-4}
                  y={chartHeight - previousHeight}
                  width={barWidth + 8}
                  height={previousHeight}
                  fill="none"
                  stroke="rgba(148,163,184,0.35)"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  rx={8}
                  ry={8}
                />
              )}
              <rect
                x={0}
                y={chartHeight - barHeight}
                width={barWidth}
                height={barHeight}
                fill="url(#sequence-bar)"
                rx={10}
                ry={10}
                className="cursor-pointer transition-all duration-300 hover:opacity-90"
                onClick={() => onSelect(metric)}
              />
              <text
                x={barWidth / 2}
                y={chartHeight - barHeight - 8}
                textAnchor="middle"
                fontSize={11}
                fill="#e2e8f0"
                fontWeight={600}
              >
                {metric.totalSent.toLocaleString()}
              </text>
              <text
                x={barWidth / 2}
                y={chartHeight + 18}
                textAnchor="middle"
                fontSize={12}
                fill="#94a3b8"
              >
                #{metric.sequenceNumber}
              </text>
              <text
                x={barWidth / 2}
                y={chartHeight + 34}
                textAnchor="middle"
                fontSize={11}
                fill="#38bdf8"
                fontWeight={600}
              >
                {metric.openRate.toFixed(1)}% open
              </text>
              <text
                x={barWidth / 2}
                y={chartHeight + 48}
                textAnchor="middle"
                fontSize={11}
                fill="#f472b6"
                fontWeight={600}
              >
                {metric.clickRate.toFixed(1)}% click
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface SequenceTrendChartProps {
  trends: SequenceTrend[];
  granularity: TimeGranularity;
}

function SequenceTrendChart({ trends, granularity }: SequenceTrendChartProps) {
  const sequenceNumbers = Array.from(
    new Set(trends.flatMap((trend) => Array.from(trend.sequences.keys())))
  ).sort((a, b) => a - b);

  const chartHeight = 200;
  const chartWidth = Math.max(600, trends.length * 120);
  const padding = 40;
  const maxValue = Math.max(
    1,
    ...trends.flatMap((trend) => Array.from(trend.sequences.values()))
  );

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight + padding * 2}`}
        className="w-full h-auto max-h-[320px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Axes */}
        <line
          x1={padding}
          y1={chartHeight + padding}
          x2={chartWidth + padding}
          y2={chartHeight + padding}
          stroke="rgba(148,163,184,0.35)"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={chartHeight + padding}
          stroke="rgba(148,163,184,0.35)"
        />

        {sequenceNumbers.map((seq, seqIndex) => {
          const colorPalette = ["#3b82f6", "#10b981", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4"];
          const color = colorPalette[seqIndex % colorPalette.length];

          return (
            <g key={seq}>
              <path
                d={trends
                  .map((trend, index) => {
                    const value = trend.sequences.get(seq) ?? 0;
                    const x = padding + (index / Math.max(1, trends.length - 1)) * chartWidth;
                    const y = padding + chartHeight - (value / maxValue) * chartHeight;
                    return `${index === 0 ? "M" : "L"}${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              {trends.map((trend, index) => {
                const value = trend.sequences.get(seq) ?? 0;
                const x = padding + (index / Math.max(1, trends.length - 1)) * chartWidth;
                const y = padding + chartHeight - (value / maxValue) * chartHeight;
                return (
                  <g key={`${seq}-${index}`}>
                    <circle cx={x} cy={y} r={4} fill={color} />
                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      fontSize={10}
                      fill="rgba(226,232,240,0.9)"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {trends.map((trend, index) => {
          const x = padding + (index / Math.max(1, trends.length - 1)) * chartWidth;
          return (
            <text
              key={trend.date.toISOString()}
              x={x}
              y={chartHeight + padding + 18}
              textAnchor="middle"
              fontSize={11}
              fill="#94a3b8"
            >
              {format(trend.date, granularity === "daily" ? "dd MMM" : granularity === "weekly" ? "dd MMM" : "MMM yyyy")}
            </text>
          );
        })}

        <g transform={`translate(${padding}, ${padding - 16})`}>
          {sequenceNumbers.map((seq, index) => {
            const colorPalette = ["#3b82f6", "#10b981", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4"];
            const color = colorPalette[index % colorPalette.length];
            return (
              <g key={`legend-${seq}`} transform={`translate(${index * 110}, 0)`}>
                <rect width={12} height={12} rx={3} fill={color} />
                <text x={18} y={10} fontSize={11} fill="#94a3b8">
                  Sequence {seq}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
}

function SummaryCard({ icon, label, value, change }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-2xl font-semibold text-card-foreground">{value}</div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-muted-foreground"
            )}
          >
            <TrendingUp
              className={cn("h-3 w-3", change < 0 && "rotate-180")}
              aria-hidden
            />
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}
