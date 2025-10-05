import { formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "Australia/Brisbane";

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatTrend(value: number): string {
  return value === 0 ? "0%" : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return formatInTimeZone(date, TIMEZONE, "dd LLL yyyy");
}

export function formatDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return formatInTimeZone(date, TIMEZONE, "dd LLL yyyy • h:mm a");
}
