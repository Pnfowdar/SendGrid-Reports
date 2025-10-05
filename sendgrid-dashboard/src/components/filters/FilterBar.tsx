"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Calendar, Filter, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { DashboardFilters, EventType } from "@/types";
import { cn } from "@/utils/cn";

interface FilterBarProps {
  filters: DashboardFilters;
  availableCategories: string[];
  onChange: (update: Partial<DashboardFilters>) => void;
  onReset: () => void;
  isDisabled?: boolean;
}

const EVENT_TYPE_LABELS: Record<EventType | "all", string> = {
  all: "All events",
  processed: "Processed",
  delivered: "Delivered",
  open: "Opens",
  click: "Clicks",
  bounce: "Bounces",
  deferred: "Deferred",
  dropped: "Drops",
  unsubscribe: "Unsubscribes",
  spamreport: "Spam Reports",
  block: "Blocks",
};

export function FilterBar({
  filters,
  availableCategories,
  onChange,
  onReset,
  isDisabled,
}: FilterBarProps) {
  const [emailInput, setEmailInput] = useState(filters.emails[0] ?? "");
  
  const sortedCategories = useMemo(() => ["All categories", ...availableCategories], [
    availableCategories,
  ]);

  const handleEmailKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onChange({ emails: emailInput ? [emailInput] : [] });
    }
  };

  const handleEmailClear = () => {
    setEmailInput("");
    onChange({ emails: [] });
  };

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card/60 p-4 shadow-floating-card backdrop-blur"
      role="search"
      aria-describedby="filters-help-text"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex items-center justify-between gap-3" aria-live="polite">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" aria-hidden />
          <span id="filters-help-text">Filters</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onReset}
          disabled={isDisabled}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Reset
        </button>
      </div>

      <fieldset className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" disabled={isDisabled}>
        <legend className="sr-only">Filter email events</legend>
        <label className="flex flex-col gap-1" htmlFor="filter-email">
          <span className="text-xs font-medium text-muted-foreground">Recipient email (press Enter)</span>
          <div className="relative">
            <input
              id="filter-email"
              type="text"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              onKeyDown={handleEmailKeyDown}
              placeholder="e.g. alex@example.com"
              disabled={isDisabled}
              className="w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 pr-10 text-sm text-foreground shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {emailInput && (
              <button
                type="button"
                onClick={handleEmailClear}
                aria-label="Clear recipient email filter"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-muted-foreground transition hover:bg-primary/20 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>
        </label>

        <CategoryFilter
          value={filters.categories[0]}
          categories={sortedCategories}
          onChange={(value) => onChange({ categories: value ? [value] : [] })}
          disabled={isDisabled}
        />

        <label className="flex flex-col gap-1" htmlFor="filter-event-type">
          <span className="text-xs font-medium text-muted-foreground">Event type</span>
          <select
            id="filter-event-type"
            value={filters.eventTypes[0] ?? "all"}
            onChange={(event) =>
              onChange({ eventTypes: event.target.value === "all" ? [] : [event.target.value as EventType] })
            }
            disabled={isDisabled}
            className="rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-sm text-foreground shadow-inner transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 [&>option]:bg-card [&>option]:text-foreground"
          >
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Date range</span>
          <DateRangePicker
            value={filters.dateRange}
            disabled={isDisabled}
            onChange={(value) => onChange({ dateRange: value })}
          />
        </div>
      </fieldset>
    </form>
  );
}

interface DateRangePickerProps {
  value: [Date | null, Date | null];
  disabled?: boolean;
  onChange: (value: [Date | null, Date | null]) => void;
}

export function DateRangePicker({ value, disabled, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => value[0] ?? value[1] ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ left: 0, top: 0, width: 320 });
  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom;
      const calendarHeight = 420;
      const calendarWidth = Math.max(rect.width, 280);

      let top = rect.bottom + 8;
      if (spaceBelow < calendarHeight && rect.top > calendarHeight) {
        top = rect.top - calendarHeight - 8;
      }

      const left = Math.max(16, Math.min(rect.left, viewportWidth - calendarWidth - 16));

      setPanelPosition({
        left,
        top: Math.max(16, Math.min(top, viewportHeight - calendarHeight - 16)),
        width: calendarWidth,
      });
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      const next = value[0] ?? value[1] ?? new Date();
      setVisibleMonth(next);
    }
  }, [open, value]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);

  const startLabel = value[0] ? format(value[0], "dd MMM yyyy") : "Start date";
  const endLabel = value[1] ? format(value[1], "dd MMM yyyy") : "End date";

  const handleDayClick = (day: Date) => {
    if (disabled) return;
    const [start, end] = value;
    if (!start || (start && end)) {
      onChange([day, null]);
      return;
    }
    if (isBefore(day, start)) {
      onChange([day, start]);
    } else {
      onChange([start, day]);
      setOpen(false);
    }
  };

  const isSelected = (day: Date) => {
    const [start, end] = value;
    if (start && isSameDay(day, start)) return "start";
    if (end && isSameDay(day, end)) return "end";
    return null;
  };

  const inRange = (day: Date) => {
    const [start, end] = value;
    if (start && end) {
      return isWithinInterval(day, { start, end });
    }
    return false;
  };

  const weekDayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-left text-sm text-foreground shadow-inner transition hover:border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          disabled && "cursor-not-allowed opacity-60"
        )}
      >
        <span className="flex items-center gap-2 text-xs text-muted-foreground/80">
          <Calendar className="h-3.5 w-3.5" aria-hidden />
          {startLabel}
          <span className="text-muted-foreground/60">→</span>
          {endLabel}
        </span>
        <span className="rounded-md border border-border/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">
          Select
        </span>
      </button>
      {open && portalReady &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9980] bg-background/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              className="fixed z-[9990] rounded-xl border border-border/60 bg-[#0f172a] p-4 shadow-2xl"
              style={{
                left: `${panelPosition.left}px`,
                top: `${panelPosition.top}px`,
                width: `${panelPosition.width}px`,
                minWidth: "280px",
              }}
            >
          <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, -1))}
              className="rounded-md border border-border/60 p-1 transition hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="h-3 w-3" aria-hidden />
              <span className="sr-only">Previous month</span>
            </button>
            <span className="text-sm text-card-foreground">{format(visibleMonth, "MMMM yyyy")}</span>
            <button
              type="button"
              onClick={() => setVisibleMonth((current) => addMonths(current, 1))}
              className="rounded-md border border-border/60 p-1 transition hover:border-primary hover:text-primary"
            >
              <ChevronRight className="h-3 w-3" aria-hidden />
              <span className="sr-only">Next month</span>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[11px] font-medium text-muted-foreground/80">
            {weekDayLabels.map((label) => (
              <span key={label} className="text-center">
                {label}
              </span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1 text-sm">
            {days.map((day: Date) => {
              const selectedState = isSelected(day);
              const isBetween = inRange(day);
              const [start, end] = value;
              const isOutside = !isSameMonth(day, visibleMonth);
              const disabledDay = (start && !end && isBefore(day, start) && !isSameDay(day, start)) || false;
              const isStart = selectedState === "start";
              const isEnd = selectedState === "end";
              const isSingleSelection = isStart && !end;
              const isCurrentDay = isSameDay(day, today);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled || disabledDay}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
                    isOutside && "text-muted-foreground/40",
                    isBetween && "bg-primary/15 text-card-foreground",
                    (isStart || isEnd) && "bg-primary text-primary-foreground ring-2 ring-primary/70",
                    isSingleSelection && "ring-offset-2 ring-offset-[#0f172a]",
                    !selectedState && !isBetween && "hover:bg-primary/10",
                    disabledDay && "cursor-not-allowed opacity-40",
                    isCurrentDay && !isStart && !isEnd && "border border-primary/40"
                  )}
                  aria-pressed={Boolean(selectedState) || isBetween}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                if (disabled) return;
                onChange([today, today]);
                setVisibleMonth(today);
              }}
              className="rounded-md border border-border/60 px-2 py-1 transition hover:border-primary hover:text-primary"
            >
              Today
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onChange([null, null]);
                  setOpen(false);
                }}
                className="rounded-md border border-border/60 px-2 py-1 transition hover:border-primary hover:text-primary"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-primary/60 bg-primary/10 px-2 py-1 text-primary transition hover:bg-primary/20"
              >
                Done
              </button>
            </div>
          </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

interface CategoryFilterProps {
  value?: string;
  categories: string[];
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

function CategoryFilter({ value, categories, onChange, disabled }: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || containerRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    return categories.filter((cat) =>
      cat.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const displayValue = value || "All categories";

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <span className="text-xs font-medium text-muted-foreground">Category</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-left text-sm text-foreground shadow-inner transition hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{displayValue}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
        {open && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-border/60 bg-slate-900 p-2 shadow-floating-card">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="mb-2 w-full rounded-lg border border-border/60 bg-slate-800 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">No categories found</div>
              ) : (
                filteredCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      onChange(category === "All categories" ? undefined : category);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-primary/10 hover:text-primary"
                  >
                    {category}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
