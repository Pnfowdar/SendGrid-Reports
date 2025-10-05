"use client";

import { useMemo } from "react";
import { detectBounces } from "@/lib/bounce-detection";
import type { EmailEvent } from "@/types";
import { AlertTriangle, AlertCircle, Download } from "lucide-react";
import { formatDate } from "@/lib/format";

interface BounceWarningsProps {
  events: EmailEvent[];
}

export function BounceWarnings({ events }: BounceWarningsProps) {
  const warnings = useMemo(() => detectBounces(events), [events]);
  
  const critical = warnings.filter(w => w.severity === 'critical');
  const warning = warnings.filter(w => w.severity === 'warning');

  const exportSuppressionList = () => {
    const headers = ['Email', 'Domain', 'Bounce Count', 'Severity', 'Action Required', 'First Bounce', 'Last Bounce'];
    const rows = warnings.map(w => [
      w.email,
      w.domain,
      w.bounce_count,
      w.severity,
      w.action_required,
      formatDate(w.first_bounce),
      formatDate(w.last_bounce)
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bounce-suppression-list-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (warnings.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-900/30 dark:bg-green-900/10 dark:text-green-400">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">No bounce warnings - your list is healthy!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Bounce Warnings</h3>
            <p className="text-sm text-muted-foreground">
              {warnings.length} emails with 3+ bounces detected
            </p>
          </div>
          <button
            onClick={exportSuppressionList}
            className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            <Download className="h-4 w-4" />
            Export Suppression List
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/10">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">Critical</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-red-900 dark:text-red-400">
              {critical.length}
            </div>
            <div className="text-sm text-red-700/70 dark:text-red-400/70">
              5+ bounces - suppress immediately
            </div>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/30 dark:bg-yellow-900/10">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Warning</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-yellow-900 dark:text-yellow-400">
              {warning.length}
            </div>
            <div className="text-sm text-yellow-700/70 dark:text-yellow-400/70">
              3-4 bounces - monitor closely
            </div>
          </div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
        <h4 className="mb-4 text-sm font-medium text-muted-foreground">
          Problem Contacts ({warnings.length})
        </h4>
        <div className="space-y-2">
          {warnings.slice(0, 10).map((w) => (
            <div
              key={w.email}
              className={`flex items-center justify-between rounded-lg border p-3 ${
                w.severity === 'critical'
                  ? 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10'
                  : 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/30 dark:bg-yellow-900/10'
              }`}
            >
              <div className="flex-1">
                <div className="font-mono text-sm font-medium">{w.email}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {w.domain} • {w.bounce_count} bounces • Last: {formatDate(w.last_bounce)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                    w.severity === 'critical'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {w.severity === 'critical' ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {w.severity}
                </span>
              </div>
            </div>
          ))}
          {warnings.length > 10 && (
            <div className="text-center text-sm text-muted-foreground pt-2">
              + {warnings.length - 10} more in export
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
