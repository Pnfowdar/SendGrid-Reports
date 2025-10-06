import { useState, useEffect } from 'react';
import type { DomainMetrics, DomainSummary } from '@/types';

export function useDomainMetrics(trend?: string, minContacts: number = 3) {
  const [data, setData] = useState<DomainMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DomainSummary | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  
  useEffect(() => {
    async function fetchDomains() {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (trend) params.set('trend', trend);
        params.set('minContacts', minContacts.toString());
        
        const res = await fetch(`/api/analytics/domains?${params}`);
        if (!res.ok) throw new Error('Failed to fetch domain metrics');
        const json = await res.json();
        setData(json.domains || []);
        if (json.summary) {
          setSummary(json.summary as DomainSummary);
        }
        if (json.generated_at) {
          setGeneratedAt(new Date(json.generated_at));
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDomains();
  }, [trend, minContacts]);
  
  return { data, isLoading, error, summary, generatedAt };
}
