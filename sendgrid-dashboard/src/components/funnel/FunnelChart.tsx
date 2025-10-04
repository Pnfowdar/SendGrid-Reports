"use client";

import { useState } from "react";
import type { FunnelStage } from "@/types";
import { cn } from "@/utils/cn";

interface FunnelChartProps {
  data: FunnelStage[];
  isLoading?: boolean;
}

const COLORS = ["#38bdf8", "#22d3ee", "#a78bfa", "#f472b6"];
const STAGE_LABELS: Record<string, string> = {
  sent: "Sent",
  delivered: "Delivered",
  unique_opened: "Unique Opened",
  unique_clicked: "Unique Clicked",
};

export function FunnelChart({ data, isLoading }: FunnelChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading || data.length === 0) {
    return (
      <section
        className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-floating-card"
        aria-labelledby="funnel-chart-heading"
      >
        <header className="flex flex-col gap-2 border-b border-border/60 pb-4">
          <h2 id="funnel-chart-heading" className="text-base font-semibold text-card-foreground">
            Deliverability Funnel
          </h2>
          <p className="text-xs text-muted-foreground/80">
            Track email journey from send through delivery, opens, and clicks. Each stage shows volume and conversion rate.
          </p>
        </header>
        <div className="flex h-[380px] items-center justify-center text-sm text-muted-foreground">
          {isLoading ? "Preparing funnel metrics..." : "No data available"}
        </div>
      </section>
    );
  }

  const maxCount = Math.max(...data.map((s) => s.count), 1);
  const minRatio = 0.15;

  const segments = data.map((stage, index) => {
    const ratio = Math.max(stage.count / maxCount, minRatio);
    return {
      ...stage,
      label: STAGE_LABELS[stage.stage] || stage.stage.replace("_", " "),
      color: COLORS[index % COLORS.length],
      widthRatio: ratio,
    };
  });

  const viewBoxWidth = 800;
  const viewBoxHeight = 400;
  const funnelWidth = 280;
  const funnelStartX = 180;
  const segmentSpacing = 4;
  const totalSegmentHeight = viewBoxHeight - 60;
  const segmentHeight = (totalSegmentHeight - segmentSpacing * (segments.length - 1)) / segments.length;

  return (
    <section
      className="rounded-2xl sm:rounded-3xl border border-border/70 bg-card/85 p-4 sm:p-6 shadow-floating-card"
      aria-labelledby="funnel-chart-heading"
    >
      <header className="flex flex-col gap-2 border-b border-border/60 pb-4">
        <h2 id="funnel-chart-heading" className="text-base font-semibold text-card-foreground">
          Deliverability Funnel
        </h2>
        <p className="text-xs text-muted-foreground/80">
          Track email journey from send through delivery, opens, and clicks. Each stage shows volume and conversion rate.
        </p>
      </header>
      <div className="mx-auto mt-6 w-full max-w-4xl" role="img" aria-label="Funnel visualization">
        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="h-auto w-full">
          <defs>
            {segments.map((segment, index) => (
              <linearGradient key={segment.stage} id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={segment.color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={segment.color} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>

          {segments.map((segment, index) => {
            const y = 30 + index * (segmentHeight + segmentSpacing);
            const topWidth = funnelWidth * segment.widthRatio;
            const bottomWidth =
              index < segments.length - 1
                ? funnelWidth * segments[index + 1].widthRatio
                : topWidth * 0.7;

            const topLeft = funnelStartX + (funnelWidth - topWidth) / 2;
            const topRight = topLeft + topWidth;
            const bottomLeft = funnelStartX + (funnelWidth - bottomWidth) / 2;
            const bottomRight = bottomLeft + bottomWidth;

            const points = `${topLeft},${y} ${topRight},${y} ${bottomRight},${y + segmentHeight} ${bottomLeft},${y + segmentHeight}`;

            const isHovered = hoveredIndex === index;
            const centerY = y + segmentHeight / 2;
            const labelX = funnelStartX + funnelWidth + 32;

            return (
              <g key={segment.stage}>
                <polygon
                  points={points}
                  fill={`url(#gradient-${index})`}
                  stroke="#0f172a"
                  strokeWidth={2}
                  className={cn(
                    "transition-all duration-300",
                    isHovered && "opacity-100",
                    !isHovered && hoveredIndex !== null && "opacity-60"
                  )}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: "pointer" }}
                />

                <text
                  x={labelX}
                  y={centerY - 12}
                  fill="#e2e8f0"
                  fontSize={14}
                  fontWeight={600}
                  className="pointer-events-none"
                >
                  {segment.label}
                </text>
                <text
                  x={labelX}
                  y={centerY + 6}
                  fill="#94a3b8"
                  fontSize={12}
                  fontWeight={400}
                  className="pointer-events-none"
                >
                  {segment.count.toLocaleString()} emails
                </text>
                <text
                  x={labelX}
                  y={centerY + 22}
                  fill={segment.color}
                  fontSize={13}
                  fontWeight={600}
                  className="pointer-events-none"
                >
                  {segment.conversion_rate.toFixed(1)}% conversion
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
