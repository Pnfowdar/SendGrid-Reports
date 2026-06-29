import type { DataCache } from "@/types";

const CACHE_KEY = "sendgrid_data_cache";
const CACHE_VERSION = "v2";

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
}
