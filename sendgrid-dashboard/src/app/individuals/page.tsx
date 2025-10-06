"use client";

import { useState, useMemo } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { Sidebar } from "@/components/navigation/Sidebar";
import { EngagementTable } from "@/components/analytics/EngagementTable";
import { IndividualFiltersComponent, type IndividualFilters } from "@/components/analytics/AnalyticsFilters";
import { useEngagement } from "@/hooks/useEngagement";
import { formatNumber, formatPercent } from "@/lib/format";
import { exportEngagementCsv } from "@/lib/export";
import { TrendingUp, MousePointerClick, Mail, Target, Download, AlertCircle } from "lucide-react";

export default function IndividualsPage() {
  const { data: allContacts, isLoading, summary, generatedAt } = useEngagement(200);
  const [filters, setFilters] = useState<IndividualFilters>({
    tier: 'all',
    minScore: undefined,
    minOpenRate: undefined,
    minClickRate: undefined,
  });

  // Apply filters
  const filteredContacts = useMemo(() => {
    return allContacts.filter((contact) => {
      if (filters.tier && filters.tier !== 'all' && contact.tier !== filters.tier) return false;
      if (filters.minScore && contact.engagement_score < filters.minScore) return false;
      if (filters.minOpenRate && contact.open_rate < filters.minOpenRate) return false;
      if (filters.minClickRate && contact.click_rate < filters.minClickRate) return false;
      return true;
    });
  }, [allContacts, filters]);

  // Segment contacts by engagement type
  const topOpeners = [...filteredContacts]
    .sort((a, b) => b.open_rate - a.open_rate)
    .slice(0, 100);

  const topClickers = [...filteredContacts]
    .sort((a, b) => b.click_rate - a.click_rate)
    .filter(c => c.clicks > 0)
    .slice(0, 100);

  const hotLeads = filteredContacts.filter(c => c.tier === 'hot');
  const warmLeads = filteredContacts.filter(c => c.tier === 'warm');
  const coldLeads = filteredContacts.filter(c => c.opens === 0 && c.clicks === 0);

  // Calculate summary stats
  const avgOpenRate = allContacts.length > 0
    ? allContacts.reduce((sum, c) => sum + c.open_rate, 0) / allContacts.length
    : 0;

  const avgClickRate = allContacts.length > 0
    ? allContacts.reduce((sum, c) => sum + c.click_rate, 0) / allContacts.length
    : 0;

  const totalEngaged = allContacts.filter(c => c.opens > 0 || c.clicks > 0).length;

  const handleResetFilters = () => {
    setFilters({
      tier: 'all',
      minScore: undefined,
      minOpenRate: undefined,
      minClickRate: undefined,
    });
  };

  const exportTopOpeners = () => {
    exportEngagementCsv(topOpeners, `top-openers-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportTopClickers = () => {
    exportEngagementCsv(topClickers, `top-clickers-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportColdLeads = () => {
    exportEngagementCsv(coldLeads, `cold-leads-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const sections = [
    { id: "filters", label: "Filters", icon: "filters" },
    { id: "summary", label: "Summary", icon: "summary" },
    { id: "top-openers", label: "Top Openers", icon: "top-openers" },
    { id: "top-clickers", label: "Top Clickers", icon: "top-clickers" },
    { id: "cold-leads", label: "Cold Leads", icon: "cold-leads" },
    { id: "all-contacts", label: "Top Contacts", icon: "all-contacts" },
  ];

  return (
    <>
      <Sidebar sections={sections} />
      <ScrollToTop />
      <DashboardShell
        eventsCount={summary?.total_contacts ?? allContacts.length}
        lastUpdated={generatedAt ?? (allContacts.length ? allContacts[0]?.last_activity : undefined)}
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Individual Contact Analytics</h1>
            <p className="mt-2 text-muted-foreground">
              Deep dive into individual email engagement patterns, identify top performers, and segment by behavior
            </p>
          </div>

          {/* Filters */}
          <div id="filters">
            <IndividualFiltersComponent
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
            />
          </div>

          {/* Summary Cards */}
          <div id="summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Mail className="h-5 w-5" />
              <span className="text-sm font-medium">Total Contacts</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {formatNumber(allContacts.length)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatNumber(totalEngaged)} engaged
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">Avg Open Rate</span>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatPercent(avgOpenRate)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              across all contacts
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MousePointerClick className="h-5 w-5" />
              <span className="text-sm font-medium">Avg Click Rate</span>
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatPercent(avgClickRate)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              across all contacts
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="h-5 w-5" />
              <span className="text-sm font-medium">Hot Leads</span>
            </div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {formatNumber(hotLeads.length)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatNumber(warmLeads.length)} warm
            </div>
          </div>
        </div>

        {/* Top Openers Section */}
        <section id="top-openers" className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-foreground">Top 100 by Open Rate</h2>
              <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Highest engagement
              </span>
            </div>
            <button
              onClick={exportTopOpeners}
              disabled={topOpeners.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Contacts with the highest percentage of emails opened - prime candidates for personalized outreach
          </p>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading data...</div>
          ) : topOpeners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No data available</div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto overflow-x-auto border border-border/30 rounded-lg">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-16" />
                  <col className="w-[24%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[8%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                  <tr className="border-b border-border/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pt-2 px-2 text-left">Rank</th>
                    <th className="pb-2 pt-2 px-2 text-left">Email</th>
                    <th className="pb-2 pt-2 px-2 text-left">Domain</th>
                    <th className="pb-2 pt-2 px-2 text-right">Sent</th>
                    <th className="pb-2 pt-2 px-2 text-right">Opens</th>
                    <th className="pb-2 pt-2 px-2 text-right">Open Rate</th>
                    <th className="pb-2 pt-2 px-2 text-right">Clicks</th>
                    <th className="pb-2 pt-2 px-2 text-right">Click Rate</th>
                    <th className="pb-2 pt-2 px-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {topOpeners.map((contact, idx) => (
                    <tr
                      key={contact.email}
                      className="border-b border-border/30 last:border-0 text-sm hover:bg-muted/20"
                    >
                      <td className="py-2.5 px-2 font-semibold text-muted-foreground whitespace-nowrap">#{idx + 1}</td>
                      <td className="py-2.5 px-2 font-mono text-xs truncate" title={contact.email}>{contact.email}</td>
                      <td className="py-2.5 px-2 text-muted-foreground truncate" title={contact.domain}>{contact.domain}</td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatNumber(contact.total_sent)}</td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatNumber(contact.opens)}</td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">
                        <span className="font-semibold text-green-700 dark:text-green-400">
                          {formatPercent(contact.open_rate)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatNumber(contact.clicks)}</td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">
                        <span className="font-semibold text-blue-700 dark:text-blue-400">
                          {formatPercent(contact.click_rate)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold whitespace-nowrap">{Math.round(contact.engagement_score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Top Clickers Section */}
        <section id="top-clickers" className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-foreground">Top 100 by Click Rate</h2>
              <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                High intent
              </span>
            </div>
            <button
              onClick={exportTopClickers}
              disabled={topClickers.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Contacts who not only open but actively click - showing strong purchase intent and interest
          </p>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading data...</div>
          ) : topClickers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No clickers found</div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto overflow-x-auto border border-border/30 rounded-lg">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-16" />
                  <col className="w-[24%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[8%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                  <tr className="border-b border-border/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pt-2 px-2 text-left">Rank</th>
                    <th className="pb-2 pt-2 px-2 text-left">Email</th>
                    <th className="pb-2 pt-2 px-2 text-left">Domain</th>
                    <th className="pb-2 pt-2 px-2 text-right">Sent</th>
                    <th className="pb-2 pt-2 px-2 text-right">Clicks</th>
                    <th className="pb-2 pt-2 px-2 text-right">Click Rate</th>
                    <th className="pb-2 pt-2 px-2 text-right">Opens</th>
                    <th className="pb-2 pt-2 px-2 text-right">Open Rate</th>
                    <th className="pb-2 pt-2 px-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {topClickers.map((contact, idx) => (
                    <tr
                      key={contact.email}
                      className="border-b border-border/30 last:border-0 text-sm hover:bg-muted/20"
                    >
                      <td className="py-2.5 px-2 font-semibold text-muted-foreground whitespace-nowrap">#{idx + 1}</td>
                      <td className="py-2.5 px-2 font-mono text-xs truncate" title={contact.email}>{contact.email}</td>
                      <td className="py-2.5 px-2 text-muted-foreground truncate" title={contact.domain}>{contact.domain}</td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatNumber(contact.total_sent)}</td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatNumber(contact.clicks)}</td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">
                        <span className="font-semibold text-blue-700 dark:text-blue-400">
                          {formatPercent(contact.click_rate)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">{formatNumber(contact.opens)}</td>
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">
                        <span className="font-semibold text-green-700 dark:text-green-400">
                          {formatPercent(contact.open_rate)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold whitespace-nowrap">{Math.round(contact.engagement_score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Cold Leads Section - Zero Engagement */}
        <section id="cold-leads" className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-foreground">Cold Leads (Zero Engagement)</h2>
              <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                {coldLeads.length} contacts
              </span>
            </div>
            <button
              onClick={exportColdLeads}
              disabled={coldLeads.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Contacts who received emails but never opened or clicked - candidates for list cleaning or re-engagement campaigns
          </p>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading data...</div>
          ) : coldLeads.length === 0 ? (
            <div className="text-center py-8 text-green-600">No cold leads - excellent engagement!</div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto overflow-x-auto border border-border/30 rounded-lg">
              <table className="w-full">
                <thead className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                  <tr className="border-b border-border/50 text-left text-sm text-muted-foreground">
                    <th className="pb-3 pt-3 px-3 font-medium">Email</th>
                    <th className="pb-3 pt-3 px-3 font-medium">Domain</th>
                    <th className="pb-3 pt-3 px-3 font-medium text-right">Total Sent</th>
                    <th className="pb-3 pt-3 px-3 font-medium text-right">Bounces</th>
                    <th className="pb-3 pt-3 px-3 font-medium text-right">Bounce Rate</th>
                    <th className="pb-3 pt-3 px-3 font-medium">Last Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {coldLeads.slice(0, 100).map((contact) => (
                    <tr
                      key={contact.email}
                      className="border-b border-border/30 last:border-0 text-sm hover:bg-muted/30"
                    >
                      <td className="py-3 px-3 font-mono text-xs">{contact.email}</td>
                      <td className="py-3 px-3 text-muted-foreground">{contact.domain}</td>
                      <td className="py-3 px-3 text-right">{formatNumber(contact.total_sent)}</td>
                      <td className="py-3 px-3 text-right">{formatNumber(contact.bounces)}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={contact.bounce_rate > 20 ? "font-semibold text-red-600" : ""}>
                          {formatPercent(contact.bounce_rate)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-xs">
                        {contact.last_activity.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* All Contacts Table */}
        <div id="all-contacts">
          <EngagementTable 
            contacts={filteredContacts}
            isLoading={isLoading}
          />
        </div>
      </div>
    </DashboardShell>
    </>
  );
}
