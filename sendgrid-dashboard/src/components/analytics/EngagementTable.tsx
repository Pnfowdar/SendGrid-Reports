"use client";

import type { EngagementContact } from "@/types";
import { formatNumber, formatPercent } from "@/lib/format";
import { Download } from "lucide-react";

interface EngagementTableProps {
  contacts: EngagementContact[];
  isLoading?: boolean;
  error?: string | null;
}

export function EngagementTable({ contacts, isLoading = false, error = null }: EngagementTableProps) {
  const exportCsv = () => {
    const headers = [
      'Email',
      'Domain',
      'Total Sent',
      'Opens',
      'Clicks',
      'Open Rate',
      'Click Rate',
      'Engagement Score',
      'Tier',
      'Last Activity'
    ];
    
    const rows = contacts.map(c => [
      c.email,
      c.domain,
      c.total_sent,
      c.opens,
      c.clicks,
      c.open_rate.toFixed(1),
      c.click_rate.toFixed(1),
      c.engagement_score,
      c.tier,
      c.last_activity.toISOString()
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hot-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Error loading engagement data: {error}
      </div>
    );
  }

  // Limit to top 100 for display
  const displayContacts = contacts.slice(0, 100);

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">Top Engaged Contacts</h2>
          <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Top 100
          </span>
        </div>
        <button
          onClick={exportCsv}
          disabled={isLoading || contacts.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          Export Hot Leads
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading engagement data...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No engagement data available</div>
      ) : (
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto border border-border/30 rounded-lg">
          <table className="w-full">
            <thead className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
              <tr className="border-b border-border/50 text-left text-sm text-muted-foreground">
                <th className="pb-3 pt-3 px-3 font-medium">Email</th>
                <th className="pb-3 pt-3 px-3 font-medium">Domain</th>
                <th className="pb-3 pt-3 px-3 font-medium text-right">Opens</th>
                <th className="pb-3 pt-3 px-3 font-medium text-right">Clicks</th>
                <th className="pb-3 pt-3 px-3 font-medium text-right">Open Rate</th>
                <th className="pb-3 pt-3 px-3 font-medium text-right">Score</th>
                <th className="pb-3 pt-3 px-3 font-medium">Tier</th>
              </tr>
            </thead>
            <tbody>
              {displayContacts.map((contact) => (
                <tr
                  key={contact.email}
                  className="border-b border-border/30 last:border-0 text-sm hover:bg-muted/30"
                >
                  <td className="py-3 px-3 font-mono text-xs">{contact.email}</td>
                  <td className="py-3 px-3 text-muted-foreground">{contact.domain}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(contact.opens)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(contact.clicks)}</td>
                  <td className="py-3 px-3 text-right">{formatPercent(contact.open_rate)}</td>
                  <td className="py-3 px-3 text-right font-semibold">{Math.round(contact.engagement_score)}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        contact.tier === 'hot'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : contact.tier === 'warm'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {contact.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
