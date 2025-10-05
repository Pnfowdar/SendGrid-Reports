"use client";

import { useDomainMetrics } from "@/hooks/useDomainMetrics";
import { formatPercent } from "@/lib/format";
import { TrendingUp, AlertTriangle, Download } from "lucide-react";

export function DomainInsights() {
  const { data: hotLeads } = useDomainMetrics('hot', 3);
  const { data: warmLeads } = useDomainMetrics('warm', 3);
  const { data: atRisk } = useDomainMetrics('problematic', 2);

  const exportDomainContacts = (domains: typeof hotLeads, filename: string) => {
    const headers = [
      'Domain',
      'Unique Contacts',
      'Total Sent',
      'Avg Open Rate',
      'Avg Click Rate',
      'Bounce Rate',
      'Trend'
    ];
    
    const rows = domains.map(d => [
      d.domain,
      d.unique_contacts,
      d.total_sent,
      d.avg_open_rate.toFixed(1),
      d.avg_click_rate.toFixed(1),
      d.bounce_rate.toFixed(1),
      d.trend
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Hot Leads Section */}
      <section className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-foreground">Hot Leads</h2>
            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
              {hotLeads.length} domains
            </span>
          </div>
          <button
            onClick={() => exportDomainContacts(hotLeads, `hot-leads-${new Date().toISOString().split('T')[0]}.csv`)}
            disabled={hotLeads.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Domains with &gt;30% avg open rate and 3+ contacts
        </p>
        {hotLeads.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No hot leads found</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hotLeads.map((domain) => (
              <div
                key={domain.domain}
                className="rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-900/30 dark:bg-green-900/10"
              >
                <div className="font-semibold text-green-900 dark:text-green-400">{domain.domain}</div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contacts:</span>
                    <span className="font-medium">{domain.unique_contacts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Open Rate:</span>
                    <span className="font-medium text-green-700 dark:text-green-400">
                      {formatPercent(domain.avg_open_rate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Click Rate:</span>
                    <span className="font-medium">{formatPercent(domain.avg_click_rate)}</span>
                  </div>
                  {domain.engagement_score && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Engagement:</span>
                      <span className="font-semibold text-green-700 dark:text-green-400">
                        {Math.round(domain.engagement_score)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Opportunity Domains Section */}
      <section className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-semibold text-foreground">Opportunity Domains</h2>
            <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              {warmLeads.length} domains
            </span>
          </div>
          <button
            onClick={() => exportDomainContacts(warmLeads, `opportunity-leads-${new Date().toISOString().split('T')[0]}.csv`)}
            disabled={warmLeads.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Domains with 15-30% avg open rate - re-engagement potential
        </p>
        {warmLeads.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No opportunity domains found</div>
        ) : (
          <div className="space-y-2">
            {warmLeads.slice(0, 5).map((domain) => (
              <div
                key={domain.domain}
                className="flex items-center justify-between rounded-lg border border-border/30 bg-background/40 p-3"
              >
                <div>
                  <div className="font-medium">{domain.domain}</div>
                  <div className="text-sm text-muted-foreground">
                    {domain.unique_contacts} contacts • {formatPercent(domain.avg_open_rate)} open rate
                    {domain.engagement_score && (
                      <span> • Score: {Math.round(domain.engagement_score)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* At-Risk Domains Section */}
      <section className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-xl font-semibold text-foreground">At-Risk Domains</h2>
            <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
              {atRisk.length} domains
            </span>
          </div>
          <button
            onClick={() => exportDomainContacts(atRisk, `at-risk-domains-${new Date().toISOString().split('T')[0]}.csv`)}
            disabled={atRisk.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Domains with &gt;5% bounce rate - list cleaning recommended
        </p>
        {atRisk.length === 0 ? (
          <div className="text-center py-4 text-green-600">No at-risk domains found - great!</div>
        ) : (
          <div className="space-y-2">
            {atRisk.map((domain) => (
              <div
                key={domain.domain}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900/30 dark:bg-red-900/10"
              >
                <div>
                  <div className="font-medium text-red-900 dark:text-red-400">{domain.domain}</div>
                  <div className="text-sm text-muted-foreground">
                    {domain.unique_contacts} contacts
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-red-700 dark:text-red-400">
                    {formatPercent(domain.bounce_rate)} bounce rate
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
