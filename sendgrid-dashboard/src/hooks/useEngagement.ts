import { useState, useEffect } from 'react';
import type { EngagementContact } from '@/types';

export function useEngagement(limit: number = 50) {
  const [data, setData] = useState<EngagementContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchEngagement() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/analytics/engagement?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch engagement data');
        const json = await res.json();
        setData(json.contacts || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEngagement();
  }, [limit]);
  
  return { data, isLoading, error };
}
