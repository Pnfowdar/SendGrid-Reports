"use client";

import { useState, useMemo } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { Sidebar } from "@/components/navigation/Sidebar";
import { CompanyFiltersComponent, type CompanyFilters } from "@/components/analytics/AnalyticsFilters";
import { DomainContactsModal } from "@/components/analytics/DomainContactsModal";
import { useDomainMetrics } from "@/hooks/useDomainMetrics";
// import { exportDomainCsv } from "@/lib/export"; // Not used - using custom export with contacts
import { formatPercent, formatNumber } from "@/lib/format";
import { TrendingUp, AlertTriangle, Download, Building2, AlertCircle } from "lucide-react";

export default function CompaniesPage() {
  const { data: allDomains, isLoading, summary, generatedAt } = useDomainMetrics(undefined, 1);
  const [filters, setFilters] = useState<CompanyFilters>({
    trend: 'all',
    minContacts: undefined,
    minEngagementScore: undefined,
  });

  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDomainClick = (domain: string) => {
    setSelectedDomain(domain);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDomain(null);
  };

  // Apply filters
  const filteredDomains = useMemo(() => {
    return allDomains.filter((domain) => {
      if (filters.trend && filters.trend !== 'all' && domain.trend !== filters.trend) return false;
      if (filters.minContacts && domain.unique_contacts < filters.minContacts) return false;
      if (filters.minEngagementScore && domain.engagement_score && domain.engagement_score < filters.minEngagementScore) return false;
      return true;
    });
  }, [allDomains, filters]);

  const hotLeads = filteredDomains.filter(d => d.trend === 'hot');
  const warmLeads = filteredDomains.filter(d => d.trend === 'warm');
  const coldDomains = filteredDomains.filter(d => d.trend === 'cold' && d.total_clicks === 0);
  const atRisk = filteredDomains.filter(d => d.trend === 'problematic');

  const handleResetFilters = () => {
    setFilters({
      trend: 'all',
      minContacts: undefined,
      minEngagementScore: undefined,
    });
  };

  const exportWithContacts = async (domains: typeof hotLeads, filename: string) => {
    // Fetch all contacts
    const res = await fetch('/api/analytics/engagement?limit=1000');
    const data = await res.json();
    const allContacts = data.contacts || [];

    // Create enhanced CSV with all contacts per domain
    const headers = ['Domain', 'Unique Contacts', 'Total Sent', 'Avg Open Rate', 'Avg Click Rate', 'Bounce Rate', 'Engagement Score', 'Trend', 'All Contact Emails'];
    const rows = domains.map(domain => {
      const domainContacts = allContacts
        .filter((c: { domain: string; email: string }) => c.domain === domain.domain)
        .map((c: { domain: string; email: string }) => c.email)
        .join('; ');
      
      return [
        domain.domain,
        domain.unique_contacts,
        domain.total_sent,
        domain.avg_open_rate.toFixed(1) + '%',
        domain.avg_click_rate.toFixed(1) + '%',
        domain.bounce_rate.toFixed(1) + '%',
        domain.engagement_score ? Math.round(domain.engagement_score) : '',
        domain.trend,
        domainContacts
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportHotLeads = () => {
    exportWithContacts(hotLeads, `hot-leads-with-contacts-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportWarmLeads = () => {
    exportWithContacts(warmLeads, `opportunity-domains-with-contacts-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportAtRisk = () => {
    exportWithContacts(atRisk, `at-risk-domains-with-contacts-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportColdDomains = () => {
    exportWithContacts(coldDomains, `cold-domains-with-contacts-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const sections = [
    { id: "filters", label: "Filters", icon: "filters" },
    { id: "summary", label: "Summary", icon: "summary" },
    { id: "hot-leads", label: "Hot Leads", icon: "hot-leads" },
    { id: "warm-leads", label: "Warm Leads", icon: "warm-leads" },
    { id: "at-risk", label: "At-Risk Domains", icon: "at-risk" },
  ];

  return (
    <>
      <Sidebar sections={sections} />
      <ScrollToTop />
      <DashboardShell
        eventsCount={summary?.total_domains ?? allDomains.length}
        lastUpdated={generatedAt ?? (allDomains.length ? allDomains[0]?.last_activity : undefined)}
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Company Analytics</h1>
            <p className="mt-2 text-muted-foreground">
              B2B lead generation insights based on domain-level engagement metrics
            </p>
          </div>

          {/* Filters */}
          <div id="filters">
            <CompanyFiltersComponent
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
            />
          </div>

          {/* Summary Cards */}
          <div id="summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium">Total Domains</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {formatNumber(filteredDomains.length)}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Hot Leads</span>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatNumber(hotLeads.length)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Score ≥50
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium">Warm Leads</span>
            </div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {formatNumber(warmLeads.length)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Score 20-49
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium">At Risk</span>
            </div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {formatNumber(atRisk.length)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              &gt;5% bounce rate
            </div>
          </div>
        </div>

        {/* Domain Insights Sections */}
        <div className="space-y-6">
          {/* Hot Leads */}
          <section id="hot-leads" className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-foreground">Hot Leads</h2>
                <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {hotLeads.length} domains
                </span>
              </div>
              <button
                onClick={exportHotLeads}
                disabled={hotLeads.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Domains with engagement score ≥50 - strong purchase intent
            </p>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : hotLeads.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No hot leads found. Try adjusting filters.</div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pr-2">
                {hotLeads.slice(0, 100).map((domain) => (
                  <div
                    key={domain.domain}
                    onClick={() => handleDomainClick(domain.domain)}
                    className="rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-900/30 dark:bg-green-900/10 cursor-pointer transition hover:shadow-lg hover:scale-[1.02]"
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

          {/* Warm Leads */}
          <section id="warm-leads" className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
                <h2 className="text-xl font-semibold text-foreground">Opportunity Domains</h2>
                <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {warmLeads.length} domains
                </span>
              </div>
              <button
                onClick={exportWarmLeads}
                disabled={warmLeads.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Domains with engagement score 20-49 - moderate intent, nurture potential
            </p>
            {warmLeads.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No opportunity domains found</div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pr-2">
                {warmLeads.slice(0, 100).map((domain) => (
                  <div
                    key={domain.domain}
                    onClick={() => handleDomainClick(domain.domain)}
                    className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4 dark:border-yellow-900/30 dark:bg-yellow-900/10 cursor-pointer transition hover:shadow-lg hover:scale-[1.02]"
                  >
                    <div className="font-semibold text-yellow-900 dark:text-yellow-400">{domain.domain}</div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contacts:</span>
                        <span className="font-medium">{domain.unique_contacts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Open Rate:</span>
                        <span className="font-medium">{formatPercent(domain.avg_open_rate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Click Rate:</span>
                        <span className="font-medium">{formatPercent(domain.avg_click_rate)}</span>
                      </div>
                      {domain.engagement_score && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Engagement:</span>
                          <span className="font-semibold text-yellow-700 dark:text-yellow-400">
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

          {/* Cold Domains Section */}
          <section className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-foreground">Cold Domains (Zero Clicks)</h2>
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                  {coldDomains.length} domains
                </span>
              </div>
              <button
                onClick={exportColdDomains}
                disabled={coldDomains.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Domains with zero click-through - no purchase intent detected, consider list cleaning
            </p>
            {coldDomains.length === 0 ? (
              <div className="text-center py-4 text-green-600">All domains show some engagement!</div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pr-2">
                {coldDomains.slice(0, 100).map((domain) => (
                  <div
                    key={domain.domain}
                    onClick={() => handleDomainClick(domain.domain)}
                    className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/10 cursor-pointer transition hover:shadow-lg hover:scale-[1.02]"
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-400">{domain.domain}</div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contacts:</span>
                        <span className="font-medium">{domain.unique_contacts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Open Rate:</span>
                        <span className="font-medium">{formatPercent(domain.avg_open_rate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clicks:</span>
                        <span className="font-medium text-gray-600">0</span>
                      </div>
                      {domain.engagement_score && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Engagement:</span>
                          <span className="font-semibold text-gray-700 dark:text-gray-400">
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

          {/* At-Risk Domains */}
          <section id="at-risk" className="rounded-xl border border-border/50 bg-card/60 p-6 shadow-floating-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h2 className="text-xl font-semibold text-foreground">At-Risk Domains</h2>
                <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  {atRisk.length} domains
                </span>
              </div>
              <button
                onClick={exportAtRisk}
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
              <div className="max-h-[500px] overflow-y-auto grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pr-2">
                {atRisk.slice(0, 100).map((domain) => (
                  <div
                    key={domain.domain}
                    onClick={() => handleDomainClick(domain.domain)}
                    className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900/30 dark:bg-red-900/10 cursor-pointer transition hover:shadow-lg hover:scale-[1.02]"
                  >
                    <div className="font-semibold text-red-900 dark:text-red-400">{domain.domain}</div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contacts:</span>
                        <span className="font-medium">{domain.unique_contacts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bounce Rate:</span>
                        <span className="font-semibold text-red-700 dark:text-red-400">
                          {formatPercent(domain.bounce_rate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Open Rate:</span>
                        <span className="font-medium">{formatPercent(domain.avg_open_rate)}</span>
                      </div>
                      {domain.engagement_score && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Engagement:</span>
                          <span className="font-semibold text-red-700 dark:text-red-400">
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
        </div>
      </div>

      {isModalOpen && (
        <DomainContactsModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          domain={selectedDomain || ''} 
        />
      )}
    </DashboardShell>
    </>
  );
}
