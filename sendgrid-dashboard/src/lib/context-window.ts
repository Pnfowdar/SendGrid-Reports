import { subDays, isWithinInterval } from "date-fns";
import type { EmailEvent, ContextWindow } from "@/types";

/**
 * Get 30-day context window for accurate sequence and rate calculations
 * Context = 30 days PRIOR to filter start date + filtered period
 */
export function get30DayContextWindow(
  allEvents: EmailEvent[],
  dateRange: [Date | null, Date | null]
): EmailEvent[] {
  // Get 30 days before the filter start date
  const contextStart = dateRange[0] 
    ? subDays(dateRange[0], 30)
    : subDays(new Date(), 30);
  
  const contextEnd = dateRange[1] ?? new Date();
  
  return allEvents.filter(event => 
    isWithinInterval(event.timestamp, { start: contextStart, end: contextEnd })
  );
}

/**
 * Create context window object with metadata
 */
export function createContextWindow(
  events: EmailEvent[],
  dateRange: [Date | null, Date | null]
): ContextWindow {
  const startDate = dateRange[0] ? subDays(dateRange[0], 30) : subDays(new Date(), 30);
  const endDate = dateRange[1] ?? new Date();
  
  return {
    startDate,
    endDate,
    events: get30DayContextWindow(events, dateRange),
  };
}

/**
 * Apply context to sequence analysis
 * Returns both filtered events for display and context events for calculations
 */
export function applyContextToSequence(
  filteredEvents: EmailEvent[],
  contextEvents: EmailEvent[]
) {
  return {
    displayEvents: filteredEvents,
    sequenceContext: contextEvents,
  };
}

/**
 * Generate a cache key for context metrics based on date range
 */
export function getContextCacheKey(dateRange: [Date | null, Date | null]): string {
  const start = dateRange[0]?.toISOString() ?? 'null';
  const end = dateRange[1]?.toISOString() ?? 'null';
  return `context_${start}_${end}`;
}
