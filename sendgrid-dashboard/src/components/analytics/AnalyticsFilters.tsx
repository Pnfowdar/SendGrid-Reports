"use client";

import { Filter, RefreshCw } from "lucide-react";

export interface IndividualFilters {
  minScore?: number;
  tier?: 'hot' | 'warm' | 'cold' | 'all';
  minOpenRate?: number;
  minClickRate?: number;
}

export interface CompanyFilters {
  trend?: 'hot' | 'warm' | 'cold' | 'problematic' | 'all';
  minContacts?: number;
  minEngagementScore?: number;
}

interface IndividualFiltersProps {
  filters: IndividualFilters;
  onChange: (filters: IndividualFilters) => void;
  onReset: () => void;
}

interface CompanyFiltersProps {
  filters: CompanyFilters;
  onChange: (filters: CompanyFilters) => void;
  onReset: () => void;
}

export function IndividualFiltersComponent({ filters, onChange, onReset }: IndividualFiltersProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 shadow-floating-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted/50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tier Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="tier-filter" className="text-xs font-medium text-muted-foreground">
            Lead Tier
          </label>
          <select
            id="tier-filter"
            value={filters.tier || 'all'}
            onChange={(e) => onChange({ ...filters, tier: e.target.value as IndividualFilters['tier'] })}
            className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">All Tiers</option>
            <option value="hot">Hot (≥50 score)</option>
            <option value="warm">Warm (20-49)</option>
            <option value="cold">Cold (&lt;20)</option>
          </select>
        </div>

        {/* Min Engagement Score */}
        <div className="flex flex-col gap-1">
          <label htmlFor="min-score" className="text-xs font-medium text-muted-foreground">
            Min Engagement Score
          </label>
          <input
            id="min-score"
            type="number"
            min="0"
            value={filters.minScore || ''}
            onChange={(e) => onChange({ ...filters, minScore: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="e.g. 30"
            className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Min Open Rate */}
        <div className="flex flex-col gap-1">
          <label htmlFor="min-open-rate" className="text-xs font-medium text-muted-foreground">
            Min Open Rate (%)
          </label>
          <input
            id="min-open-rate"
            type="number"
            min="0"
            max="100"
            value={filters.minOpenRate || ''}
            onChange={(e) => onChange({ ...filters, minOpenRate: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="e.g. 25"
            className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Min Click Rate */}
        <div className="flex flex-col gap-1">
          <label htmlFor="min-click-rate" className="text-xs font-medium text-muted-foreground">
            Min Click Rate (%)
          </label>
          <input
            id="min-click-rate"
            type="number"
            min="0"
            max="100"
            value={filters.minClickRate || ''}
            onChange={(e) => onChange({ ...filters, minClickRate: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="e.g. 10"
            className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>
    </div>
  );
}

export function CompanyFiltersComponent({ filters, onChange, onReset }: CompanyFiltersProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 shadow-floating-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted/50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Trend Filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="trend-filter" className="text-xs font-medium text-muted-foreground">
            Domain Trend
          </label>
          <select
            id="trend-filter"
            value={filters.trend || 'all'}
            onChange={(e) => onChange({ ...filters, trend: e.target.value as CompanyFilters['trend'] })}
            className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">All Trends</option>
            <option value="hot">Hot (Score ≥50)</option>
            <option value="warm">Warm (Score 20-49)</option>
            <option value="cold">Cold (Score &lt;20)</option>
            <option value="problematic">Problematic (&gt;5% bounce)</option>
          </select>
        </div>

        {/* Min Contacts */}
        <div className="flex flex-col gap-1">
          <label htmlFor="min-contacts" className="text-xs font-medium text-muted-foreground">
            Min Contacts
          </label>
          <input
            id="min-contacts"
            type="number"
            min="1"
            value={filters.minContacts || ''}
            onChange={(e) => onChange({ ...filters, minContacts: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="e.g. 3"
            className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Min Engagement Score */}
        <div className="flex flex-col gap-1">
          <label htmlFor="min-engagement-score" className="text-xs font-medium text-muted-foreground">
            Min Engagement Score
          </label>
          <input
            id="min-engagement-score"
            type="number"
            min="0"
            value={filters.minEngagementScore || ''}
            onChange={(e) => onChange({ ...filters, minEngagementScore: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="e.g. 20"
            className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-foreground shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>
    </div>
  );
}
