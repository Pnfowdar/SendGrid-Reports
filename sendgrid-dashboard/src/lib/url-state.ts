import type { DashboardFilters, EventType } from "@/types";
import { format } from "date-fns";

export const URL_CONSTRAINTS = {
  MAX_LENGTH: 2000,
  WARNING_LENGTH: 1800,
  SAFE_LENGTH: 1500,
} as const;

export function encodeFiltersToURL(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams();
  
  if (filters.categories.length > 0) {
    params.set('c', filters.categories.join(','));
  }
  
  if (filters.eventTypes.length > 0) {
    params.set('t', filters.eventTypes.join(','));
  }
  
  if (filters.emails.length > 0) {
    params.set('e', filters.emails.join(','));
  }
  
  if (filters.dateRange[0]) {
    params.set('sd', format(filters.dateRange[0], 'yyyy-MM-dd'));
  }
  
  if (filters.dateRange[1]) {
    params.set('ed', format(filters.dateRange[1], 'yyyy-MM-dd'));
  }
  
  return params;
}

export function decodeFiltersFromURL(params: URLSearchParams): Partial<DashboardFilters> {
  const filters: Partial<DashboardFilters> = {
    categories: [],
    emails: [],
    eventTypes: [],
    dateRange: [null, null],
  };
  
  const categories = params.get('c');
  if (categories) {
    filters.categories = categories.split(',').filter(Boolean);
  }
  
  const eventTypes = params.get('t');
  if (eventTypes) {
    filters.eventTypes = eventTypes.split(',').filter(Boolean) as EventType[];
  }
  
  const emails = params.get('e');
  if (emails) {
    filters.emails = emails.split(',').filter(Boolean);
  }
  
  const startDate = params.get('sd');
  if (startDate) {
    filters.dateRange![0] = new Date(startDate);
  }
  
  const endDate = params.get('ed');
  if (endDate) {
    filters.dateRange![1] = new Date(endDate);
  }
  
  return filters;
}

export function checkURLLength(params: URLSearchParams): {
  isValid: boolean;
  length: number;
  warning?: string;
} {
  const url = params.toString();
  const length = url.length;
  
  if (length > URL_CONSTRAINTS.MAX_LENGTH) {
    return {
      isValid: false,
      length,
      warning: 'URL too long. Some filters may not persist. Consider reducing selections.',
    };
  }
  
  if (length > URL_CONSTRAINTS.WARNING_LENGTH) {
    return {
      isValid: true,
      length,
      warning: 'URL approaching maximum length. Consider reducing selections.',
    };
  }
  
  return { isValid: true, length };
}
