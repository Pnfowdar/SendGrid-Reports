import { DateTime } from "luxon";
import type { DashboardFilters, EmailEvent } from "@/types";

const TIMEZONE = "Australia/Brisbane";

function normalizeEmail(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

function isWithinRange(date: Date, [start, end]: DashboardFilters["dateRange"]): boolean {
  const zoned = DateTime.fromJSDate(date, { zone: TIMEZONE });

  if (start) {
    const startDay = DateTime.fromJSDate(start, { zone: TIMEZONE }).startOf("day");
    if (zoned < startDay) {
      return false;
    }
  }

  if (end) {
    const endDay = DateTime.fromJSDate(end, { zone: TIMEZONE }).endOf("day");
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
  const { dateRange, eventType, email, category } = filters;
  const normalizedEmail = normalizeEmail(email);
  const normalizedCategory = category?.toLowerCase().trim();

  return events.filter((event) => {
    if (!isWithinRange(event.timestamp, dateRange)) {
      return false;
    }

    if (eventType && eventType !== "all" && event.event !== eventType) {
      return false;
    }

    if (normalizedEmail && !normalizeEmail(event.email).includes(normalizedEmail)) {
      return false;
    }

    if (normalizedCategory) {
      const categories = event.category.length ? event.category : ["Uncategorized"];
      const matchesCategory = categories.some(
        (value) => value.toLowerCase().trim() === normalizedCategory
      );

      if (!matchesCategory) {
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
