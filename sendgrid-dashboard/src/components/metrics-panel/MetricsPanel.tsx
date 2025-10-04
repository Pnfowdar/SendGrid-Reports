"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KPIMetrics } from "@/types";
import { formatNumber, formatPercent, formatTrend } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricsPanelProps {
  metrics: KPIMetrics;
  comparison?: {
    delivered_delta: number;
    bounced_blocked_delta: number;
    unique_opens_delta: number;
  };
  isLoading?: boolean;
}

const KPI_ENTRIES: Array<{
  key: keyof KPIMetrics;
  label: string;
  description: string;
  formatter: (value: number) => string;
  deltaKey?: keyof NonNullable<MetricsPanelProps["comparison"]>;
}> = [
  {
    key: "processed",
    label: "Emails Processed",
    description: "Total processed events ingested",
    formatter: (value) => formatNumber(value),
  },
  {
    key: "delivered_pct",
    label: "Delivered Rate",
    description: "Delivered / (Delivered + Bounced + Blocked)",
    formatter: (value) => formatPercent(value),
    deltaKey: "delivered_delta",
  },
  {
    key: "bounced_blocked_pct",
    label: "Bounced & Blocked",
    description: "(Bounced + Blocked) / Total",
    formatter: (value) => formatPercent(value),
    deltaKey: "bounced_blocked_delta",
  },
  {
    key: "unique_opens_pct",
    label: "Unique Opens",
    description: "Unique recipients who opened",
    formatter: (value) => formatPercent(value),
    deltaKey: "unique_opens_delta",
  },
];

export function MetricsPanel({ metrics, comparison, isLoading }: MetricsPanelProps) {
  return (
    <section
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
      aria-labelledby="metrics-panel-heading"
      aria-live="polite"
    >
      <h2 id="metrics-panel-heading" className="sr-only">
        Key performance indicators
      </h2>
      {KPI_ENTRIES.map(({ key, label, description, formatter, deltaKey }) => {
        const value = metrics[key];
        const delta = deltaKey && comparison ? comparison[deltaKey] : undefined;
        return (
          <Card key={key} padding="lg" className="relative overflow-hidden">
            <CardHeader>
              <CardTitle>{label}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-6 flex flex-col gap-3">
              <div className="text-3xl font-semibold text-card-foreground">
                {isLoading ? (
                  <span className="animate-pulse text-muted-foreground">•••</span>
                ) : (
                  formatter(value)
                )}
              </div>
              {delta !== undefined && !Number.isNaN(delta) && (
                <div className="inline-flex items-center gap-2 text-sm" role="status">
                  <TrendIcon delta={delta} />
                  <span className="font-medium text-muted-foreground">
                    {formatTrend(delta)} vs previous period
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

function TrendIcon({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-400">
        <TrendingUp className="h-3.5 w-3.5" aria-hidden />
        {formatTrend(delta)}
      </span>
    );
  }

  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-rose-400">
        <TrendingDown className="h-3.5 w-3.5" aria-hidden />
        {formatTrend(delta)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-1 text-slate-300">
      <Minus className="h-3.5 w-3.5" aria-hidden />
      {formatTrend(delta)}
    </span>
  );
}
