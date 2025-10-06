import type { DataCache, CachedContextMetrics } from "@/types";

const CACHE_KEY = "sendgrid_data_cache";
const CONTEXT_CACHE_KEY = "sendgrid_context_cache";
const CACHE_VERSION = "v1";

/**
 * Save events data to sessionStorage
 */
export function saveDataCache(data: Omit<DataCache, "version">): void {
  try {
    const cache: DataCache = { ...data, version: CACHE_VERSION };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn("Failed to save data cache:", err);
  }
}

/**
 * Load events data from sessionStorage
 */
export function loadDataCache(): DataCache | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: DataCache = JSON.parse(cached);
    if (data.version !== CACHE_VERSION) {
      clearDataCache();
      return null;
    }
    
    // Rehydrate Date objects
    data.events = data.events.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp),
    }));
    
    return data;
  } catch (err) {
    console.warn("Failed to load data cache:", err);
    return null;
  }
}

/**
 * Check if cache is stale (older than maxAgeHours)
 */
export function isCacheStale(loadedAt: string, maxAgeHours: number = 12): boolean {
  const loaded = new Date(loadedAt);
  const now = new Date();
  const ageHours = (now.getTime() - loaded.getTime()) / (1000 * 60 * 60);
  return ageHours >= maxAgeHours;
}

/**
 * Clear data cache
 */
export function clearDataCache(): void {
  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem(CONTEXT_CACHE_KEY);
}

/**
 * Save calculated 30-day context metrics
 */
export function save30DayContext(
  dateRangeKey: string,
  metrics: CachedContextMetrics["metrics"]
): void {
  try {
    const cache: CachedContextMetrics = {
      version: CACHE_VERSION,
      dateRangeKey,
      metrics,
      calculatedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(CONTEXT_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn("Failed to save context cache:", err);
  }
}

/**
 * Load calculated 30-day context metrics
 */
export function load30DayContext(dateRangeKey: string): CachedContextMetrics["metrics"] | null {
  try {
    const cached = sessionStorage.getItem(CONTEXT_CACHE_KEY);
    if (!cached) return null;
    
    const data: CachedContextMetrics = JSON.parse(cached);
    
    // Check version and key match
    if (data.version !== CACHE_VERSION || data.dateRangeKey !== dateRangeKey) {
      return null;
    }
    
    return data.metrics;
  } catch (err) {
    console.warn("Failed to load context cache:", err);
    return null;
  }
}

/**
 * Clear context cache
 */
export function clear30DayContext(): void {
  sessionStorage.removeItem(CONTEXT_CACHE_KEY);
}
