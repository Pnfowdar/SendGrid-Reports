import { useState, useEffect } from 'react';
import type { EngagementContact, EngagementSummary } from '@/types';

export function useEngagement(limit: number = 50) {
  const [data, setData] = useState<EngagementContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  
  useEffect(() => {
    async function fetchEngagement() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/analytics/engagement?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch engagement data');
        const json = await res.json();
        setData(json.contacts || []);
        if (json.summary) {
          setSummary(json.summary as EngagementSummary);
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
    
    fetchEngagement();
  }, [limit]);
  
  return { data, isLoading, error, summary, generatedAt };
}
