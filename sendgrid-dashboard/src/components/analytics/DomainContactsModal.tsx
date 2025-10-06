"use client";

import { useState, useEffect } from "react";
import { X, Download, Mail } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/format";
import type { EngagementContact } from "@/types";

interface DomainContactsModalProps {
  domain: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DomainContactsModal({ domain, isOpen, onClose }: DomainContactsModalProps) {
  const [contacts, setContacts] = useState<EngagementContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && domain) {
      fetchDomainContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, domain]);

  const fetchDomainContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/engagement?limit=200`);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      const data = await res.json();
      
      // Filter contacts for this domain
      const domainContacts = data.contacts.filter(
        (c: EngagementContact) => c.domain === domain
      );
      setContacts(domainContacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const exportContacts = () => {
    const headers = ['Email', 'Opens', 'Clicks', 'Open Rate', 'Click Rate', 'Engagement Score', 'Tier'];
    const rows = contacts.map(c => [
      c.email,
      c.opens,
      c.clicks,
      c.open_rate.toFixed(1),
      c.click_rate.toFixed(1),
      Math.round(c.engagement_score),
      c.tier
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${domain}-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900/95 rounded-xl border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">{domain}</h2>
              <p className="text-sm text-muted-foreground">
                {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportContacts}
              disabled={contacts.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading contacts...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">Error: {error}</div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No contacts found for this domain</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                  <tr className="border-b border-border/50 text-left text-sm text-muted-foreground">
                    <th className="pb-3 pt-3 px-3 font-medium">Email</th>
                    <th className="pb-3 pt-3 px-3 font-medium text-right">Opens</th>
                    <th className="pb-3 pt-3 px-3 font-medium text-right">Clicks</th>
                    <th className="pb-3 pt-3 px-3 font-medium text-right">Open Rate</th>
                    <th className="pb-3 pt-3 px-3 font-medium text-right">Click Rate</th>
                    <th className="pb-3 pt-3 px-3 font-medium text-right">Score</th>
                    <th className="pb-3 pt-3 px-3 font-medium">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr
                      key={contact.email}
                      className="border-b border-border/30 last:border-0 text-sm hover:bg-muted/30"
                    >
                      <td className="py-3 px-3 font-mono text-xs">{contact.email}</td>
                      <td className="py-3 px-3 text-right">{formatNumber(contact.opens)}</td>
                      <td className="py-3 px-3 text-right">{formatNumber(contact.clicks)}</td>
                      <td className="py-3 px-3 text-right">{formatPercent(contact.open_rate)}</td>
                      <td className="py-3 px-3 text-right">{formatPercent(contact.click_rate)}</td>
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
      </div>
    </div>
  );
}
