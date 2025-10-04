import { useReducer } from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import type {
  DashboardAction,
  DashboardFilters,
  DashboardState,
  EmailEvent,
} from "@/types";

function createInitialFilters(): DashboardFilters {
  const today = endOfDay(new Date());
  const sevenDaysAgo = startOfDay(subDays(today, 6));

  return {
    dateRange: [sevenDaysAgo, today],
    eventType: "all",
  };
}

const initialState: DashboardState = {
  events: [],
  filters: createInitialFilters(),
  lastUpdated: undefined,
};

function parseFilters(
  filters: DashboardFilters,
  partial: Partial<DashboardFilters>
): DashboardFilters {
  const dateRange = partial.dateRange ?? filters.dateRange;
  const category = Object.prototype.hasOwnProperty.call(partial, "category")
    ? partial.category
    : filters.category;
  const email = Object.prototype.hasOwnProperty.call(partial, "email")
    ? partial.email ?? undefined
    : filters.email;
  const eventType = Object.prototype.hasOwnProperty.call(partial, "eventType")
    ? partial.eventType ?? "all"
    : filters.eventType ?? "all";

  return {
    dateRange: [dateRange[0], dateRange[1]],
    category,
    email,
    eventType,
  } satisfies DashboardFilters;
}

function normalizeEvents(events: EmailEvent[]): EmailEvent[] {
  return events.map((event) => ({
    ...event,
    timestamp:
      event.timestamp instanceof Date
        ? event.timestamp
        : new Date(event.timestamp),
  }));
}

function reducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "UPLOAD_DATA": {
      const { events, uploadedAt } = action.payload;
      const nextEvents = normalizeEvents(events);

      return {
        ...state,
        events: nextEvents,
        lastUpdated: uploadedAt,
      } satisfies DashboardState;
    }

    case "SET_FILTERS": {
      const nextFilters = parseFilters(state.filters, action.payload);

      return {
        ...state,
        filters: nextFilters,
      } satisfies DashboardState;
    }

    case "RESET":
      return {
        ...state,
        filters: createInitialFilters(),
      } satisfies DashboardState;

    default:
      return state;
  }
}

export function useDashboardState(initialEvents: EmailEvent[] = []) {
  const seededState: DashboardState = {
    ...initialState,
    events: normalizeEvents(initialEvents),
    filters: createInitialFilters(),
  } satisfies DashboardState;

  return useReducer(reducer, seededState);
}
