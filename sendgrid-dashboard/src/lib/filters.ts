import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { DashboardFilters, EmailEvent } from "@/types";

const TIMEZONE = "Australia/Brisbane";

function normalizeEmail(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function isWithinRange(date: Date, [start, end]: DashboardFilters["dateRange"]): boolean {
  const zoned = toZonedTime(date, TIMEZONE);

  if (start) {
    const startDay = startOfDay(toZonedTime(start, TIMEZONE));
    if (zoned < startDay) {
      return false;
    }
  }

  if (end) {
    const endDay = endOfDay(toZonedTime(end, TIMEZONE));
    if (zoned > endDay) {
      return false;
    }
  }

  return true;
}

export function filterEvents(
  events: EmailEvent[],
  filters: DashboardFilters
): EmailEvent[] {
  const { dateRange, eventTypes, emails, categories } = filters;

  return events.filter((event) => {
    // Date range filter
    if (!isWithinRange(event.timestamp, dateRange)) {
      return false;
    }

    // Event type filter (OR logic)
    if (eventTypes.length > 0 && !eventTypes.includes(event.event)) {
      return false;
    }

    // Email filter (OR logic - match any search term)
    if (emails.length > 0) {
      const normalizedEventEmail = normalizeEmail(event.email);
      const matchesAnyEmail = emails.some((emailSearch) => 
        normalizedEventEmail.includes(normalizeEmail(emailSearch))
      );
      if (!matchesAnyEmail) {
        return false;
      }
    }

    // Category filter (OR logic)
    if (categories.length > 0) {
      const eventCategories = event.category.length ? event.category : ["Uncategorized"];
      const normalizedFilterCategories = categories.map(c => c.toLowerCase().trim());
      
      const matchesAnyCategory = eventCategories.some((eventCat) =>
        normalizedFilterCategories.includes(eventCat.toLowerCase().trim())
      );

      if (!matchesAnyCategory) {
        return false;
      }
    }

    return true;
  });
}

export function getAvailableCategories(events: EmailEvent[]): string[] {
  const set = new Set<string>();
  for (const event of events) {
    if (!event.category.length) {
      set.add("Uncategorized");
      continue;
    }
    for (const value of event.category) {
      const normalized = value.trim();
      if (normalized) {
        set.add(normalized);
      }
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function findEmailDomains(events: EmailEvent[]): string[] {
  const domains = new Set<string>();
  for (const event of events) {
    const [, domain] = event.email.split("@");
    if (domain) {
      domains.add(domain.toLowerCase());
    }
  }
  return Array.from(domains).sort((a, b) => a.localeCompare(b));
}
