import { useCallback, useEffect, useState } from "react";
import type { EmailEvent } from "@/types";
import { 
  saveDataCache, 
  loadDataCache, 
  isCacheStale,
  clear30DayContext 
} from "@/lib/data-cache";

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
  const [cacheChecked, setCacheChecked] = useState(false);

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
        
        // Save to cache
        saveDataCache({
          events,
          loadedAt: loadedAt.toISOString(),
          lastUniqueId: data.lastUniqueId,
        });
        
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
      // ALWAYS fetch new data on manual refresh (incremental)
      const response = await fetch(`/api/events?after=${lastUniqueId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to refresh events");
      }

      const data = await response.json();
      // Ensure timestamps are Date objects
      const newEvents = (data.events as EmailEvent[]).map(e => ({
        ...e,
        timestamp: new Date(e.timestamp),
      }));
      const loadedAt = new Date();

      if (newEvents.length > 0) {
        setLastUniqueId(data.lastUniqueId);
        
        // Update cache with appended events
        const cache = loadDataCache();
        if (cache) {
          // Merge new events by unique_id (both arrays now have Date objects)
          const existingIds = new Set(cache.events.map(e => e.unique_id));
          const toAdd = newEvents.filter(e => !existingIds.has(e.unique_id));
          const merged = [...cache.events, ...toAdd].sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );
          
          saveDataCache({
            events: merged,
            loadedAt: loadedAt.toISOString(),
            lastUniqueId: data.lastUniqueId,
          });
        }
        
        // Clear context cache on refresh (recalculate with new data)
        clear30DayContext();
        
        onDataAppended(newEvents, loadedAt);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      console.error("Refresh data error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [lastUniqueId, loadData, onDataAppended]);

  // Auto-load on mount (check cache first)
  useEffect(() => {
    if (cacheChecked) return;
    
    setCacheChecked(true);
    
    // Try to load from cache
    const cache = loadDataCache();
    
    if (cache && !isCacheStale(cache.loadedAt, 12)) {
      // Cache is valid, use it
      setLastUniqueId(cache.lastUniqueId);
      onDataLoaded(cache.events, new Date(cache.loadedAt));
    } else {
      // Cache missing or stale, fetch fresh data
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheChecked]);

  return {
    isLoading,
    isRefreshing,
    error,
    loadData,
    refreshData,
    lastUniqueId,
  };
}
