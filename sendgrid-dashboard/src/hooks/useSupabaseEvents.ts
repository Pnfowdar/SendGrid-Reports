import { useCallback, useEffect, useState } from "react";
import type { EmailEvent } from "@/types";

interface UseSupabaseEventsResult {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  lastUniqueId: number | null;
}

export function useSupabaseEvents(
  onDataLoaded: (events: EmailEvent[], loadedAt: Date) => void,
  onDataAppended: (events: EmailEvent[], loadedAt: Date) => void
): UseSupabaseEventsResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUniqueId, setLastUniqueId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/events");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load events");
      }

      const data = await response.json();
      const events = data.events as EmailEvent[];
      const loadedAt = new Date();

      if (events.length > 0) {
        setLastUniqueId(data.lastUniqueId);
        onDataLoaded(events, loadedAt);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      console.error("Load data error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded]);

  const refreshData = useCallback(async () => {
    if (!lastUniqueId) {
      // No data loaded yet, do initial load instead
      return loadData();
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/events?after=${lastUniqueId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to refresh events");
      }

      const data = await response.json();
      const events = data.events as EmailEvent[];
      const loadedAt = new Date();

      if (events.length > 0) {
        setLastUniqueId(data.lastUniqueId);
        onDataAppended(events, loadedAt);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      console.error("Refresh data error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [lastUniqueId, loadData, onDataAppended]);

  // Auto-load on mount
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isLoading,
    isRefreshing,
    error,
    loadData,
    refreshData,
    lastUniqueId,
  };
}
