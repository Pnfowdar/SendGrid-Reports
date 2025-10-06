# Date/Time Handling Audit - SendGrid Dashboard

## Summary
Comprehensive review of date and time handling across the codebase to ensure consistency, correctness, and timezone awareness.

## ✅ Properly Handled

### 1. **Timezone Consistency**
- **TIMEZONE constant**: `Australia/Brisbane` consistently defined in:
  - `lib/format.ts`
  - `lib/aggregations.ts`
  - `lib/excel-parser.ts`
  - `components/stats-charts/StatsCharts.tsx`
  - `components/figures-table/FiguresTable.tsx`

- **Formatting Functions**: Use `formatInTimeZone` from `date-fns-tz` to ensure timezone-aware formatting
  - `formatDate()` - Returns: "dd LLL yyyy"
  - `formatDateTime()` - Returns: "dd LLL yyyy • h:mm a"

### 2. **Data Pipeline**
- **API Response** (`lib/supabase.ts`):
  ```typescript
  timestamp: new Date(row.Timestamp)
  ```
  Converts database timestamp strings to Date objects immediately

- **Cache Rehydration** (`lib/data-cache.ts`):
  ```typescript
  data.events = data.events.map(e => ({
    ...e,
    timestamp: new Date(e.timestamp),
  }));
  ```
  Properly converts cached string timestamps back to Date objects

- **Event Normalization** (`hooks/useDashboardState.ts`):
  ```typescript
  timestamp: event.timestamp instanceof Date
    ? event.timestamp
    : new Date(event.timestamp)
  ```
  Defensive check ensures timestamps are always Date objects

### 3. **Date Aggregations**
- **Daily Aggregations** (`lib/aggregations.ts`):
  - Uses `formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd")` for consistent bucketing
  - Returns ISO date strings (YYYY-MM-DD) as `date` field

- **Weekly/Monthly Rollups** (`lib/aggregations.ts`):
  - ✅ **FIXED**: Now stores ISO date strings (YYYY-MM-DD) instead of human-readable labels
  - Uses `startOfWeek`/`startOfMonth` with timezone-aware formatting
  - Consistent sortKey generation for proper ordering

### 4. **Date Range Filtering**
- **Default Range** (`hooks/useDashboardState.ts`):
  ```typescript
  const today = endOfDay(new Date());
  const sevenDaysAgo = startOfDay(subDays(today, 6));
  ```
  Creates 7-day range with proper day boundaries

- **URL State** (`lib/url-state.ts`):
  ```typescript
  filters.dateRange![0] = new Date(startDate);
  filters.dateRange![1] = new Date(endDate);
  ```
  Reconstructs Date objects from URL parameters

### 5. **Context Window** (`lib/context-window.ts`):
- Properly calculates 30-day lookback using `subDays`
- Uses `isWithinInterval` for accurate date range filtering

## ✅ Newly Fixed Issues

### 1. **Weekly/Monthly Aggregation Date Bug** - RESOLVED
**Problem**: Weekly and monthly aggregations were storing human-readable labels as the `date` field, causing `Invalid time value` errors when passed to `new Date()`

**Solution**: Modified `rollupAggregates()` to store ISO date strings (YYYY-MM-DD) instead:
```typescript
// Before (WRONG):
const label = `${formatInTimeZone(start, TIMEZONE, "dd LLL yyyy")} – ${formatInTimeZone(end, TIMEZONE, "dd LLL yyyy")}`;
aggregate: createEmptyAggregate(label)

// After (CORRECT):
const sortKey = formatInTimeZone(start, TIMEZONE, "yyyy-MM-dd");
aggregate: createEmptyAggregate(sortKey)
```

**Display Formatting**: Added `formatDateLabel()` in `FiguresTable` to properly display human-readable labels:
- **Daily**: "01 Jan 2025"
- **Weekly**: "01 Jan – 07 Jan 2025"
- **Monthly**: "January 2025"

### 2. **Timeseries Weekend Filtering** - NEW FEATURE
Added `rollupTimeseries()` function with:
- Granularity support (daily/weekly/monthly)
- Weekend filtering using `date.getDay()` check (0 = Sunday, 6 = Saturday)
- Proper timezone-aware aggregation

### 3. **Chart Date Formatting** - ENHANCED
`StatsCharts` component now includes:
- `formatXAxisLabel()` - Short labels for chart axis
- `formatTooltipLabel()` - Detailed labels for tooltips
- Both properly handle daily/weekly/monthly granularities

## 📋 Date Type Conventions

### Storage & Transfer
- **Database**: String timestamps (ISO 8601)
- **API Responses**: String timestamps → immediately converted to `Date`
- **Cache**: Strings (serialized) → rehydrated to `Date` on load
- **Aggregations**: ISO date strings (YYYY-MM-DD)

### Runtime
- **Component Props**: `Date` objects preferred, `Date | string` with conversion
- **State Management**: `Date` objects for `dateRange` filters
- **Computations**: `Date` objects using `date-fns` functions

### Display
- **Tables**: Use `formatDate()` or `formatDateTime()`
- **Charts**: Use timezone-aware formatters with granularity awareness
- **Exports**: ISO strings or formatted strings as appropriate

## 🔍 Best Practices Applied

1. **Defensive Parsing**: Always check `isNaN(date.getTime())` before using parsed dates
2. **Timezone Awareness**: Use `formatInTimeZone` instead of `format` for consistency
3. **Type Safety**: Use `Date | string` union types with conversion helpers
4. **Consistent Format**: Store dates as ISO YYYY-MM-DD for aggregations
5. **Display Separation**: Keep storage format separate from display format

## 🎯 Recommendations

### ✅ Current Implementation is Solid
The codebase demonstrates good date handling practices:
- Consistent timezone usage
- Proper Date object lifecycle (parse → compute → format)
- Defensive programming with NaN checks
- Clear separation of concerns

### 💡 Optional Enhancements (Future)
1. **Centralize Date Utilities**: Consider creating a `lib/date-utils.ts` with all date helpers
2. **Type Guards**: Add runtime type guards for Date validation
3. **User Timezone**: Consider allowing users to set their preferred timezone (currently hardcoded to Brisbane)
4. **Date Range Validation**: Add min/max date constraints to prevent invalid ranges

## ✨ Recent Enhancements

1. ✅ Fixed weekly/monthly aggregation date parsing bug
2. ✅ Added granularity support to Statistics Overview (Daily/Weekly/Monthly)
3. ✅ Added weekend filtering toggle
4. ✅ Added trendlines to charts
5. ✅ Improved date label formatting for all granularities
6. ✅ Enhanced tooltip formatting with context-aware labels

## 🔒 No Breaking Changes
All changes are backward compatible and maintain existing API contracts.
