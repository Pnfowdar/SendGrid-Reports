"use client";

import { useState, useEffect } from "react";
import type { SmartInsight } from "@/types";
import { AlertTriangle, TrendingUp, TrendingDown, Lightbulb, AlertCircle, Download, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

export function InsightsPanel() {
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/analytics/insights');
        if (!res.ok) throw new Error('Failed to fetch insights');
        const data = await res.json();
        setInsights(data.insights || []);
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchInsights();
  }, []);

  const getIcon = (type: SmartInsight['type']) => {
    switch (type) {
      case 'bounce':
      case 'risk':
        return AlertTriangle;
      case 'engagement':
        return TrendingUp;
      case 'trend':
        return TrendingDown;
      case 'opportunity':
        return Lightbulb;
      default:
        return AlertCircle;
    }
  };

  const getSeverityColor = (severity: SmartInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900/30 dark:bg-yellow-900/10 dark:text-yellow-400';
      case 'info':
        return 'border-green-200 bg-green-50 text-green-900 dark:border-green-900/30 dark:bg-green-900/10 dark:text-green-400';
    }
  };

  const getBadgeColor = (severity: SmartInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'info':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
        <div className="text-center text-muted-foreground">Loading insights...</div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lightbulb className="h-5 w-5" />
          <span>No insights available at this time</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Smart Insights</h3>
          <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {insights.length} insights
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1 hover:bg-muted/50 transition"
          aria-label={isCollapsed ? "Expand insights" : "Collapse insights"}
        >
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight) => {
            const Icon = getIcon(insight.type);
            return (
              <div
                key={insight.id}
                className={`rounded-lg border p-4 ${getSeverityColor(insight.severity)}`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getBadgeColor(insight.severity)}`}>
                    {insight.severity}
                  </span>
                </div>
                
                <h4 className="mb-1 font-semibold">{insight.title}</h4>
                <p className="mb-3 text-sm opacity-90">{insight.description}</p>
                
                {insight.metric !== undefined && insight.metric_label && (
                  <div className="mb-3 text-2xl font-bold">
                    {insight.metric}
                    <span className="ml-1 text-sm font-normal opacity-70">{insight.metric_label}</span>
                  </div>
                )}

                {insight.action && (
                  <button
                    onClick={() => {
                      if (insight.action?.type === 'navigate' && insight.action.href) {
                        window.location.href = insight.action.href;
                      } else if (insight.action?.type === 'export') {
                        // Export functionality would be handled here
                        console.log('Export:', insight.action.exportType);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-sm font-medium underline hover:no-underline"
                  >
                    {insight.action.label}
                    {insight.action.type === 'navigate' ? (
                      <ExternalLink className="h-3 w-3" />
                    ) : insight.action.type === 'export' ? (
                      <Download className="h-3 w-3" />
                    ) : null}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
