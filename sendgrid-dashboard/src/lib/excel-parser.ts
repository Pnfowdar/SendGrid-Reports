import { DateTime } from "luxon";
import type { EmailEvent, EventType } from "@/types";

const TIMEZONE = "Australia/Brisbane";
const ACCEPTED_HEADERS = new Map<string, keyof ExcelRow>([
  ["email", "email"],
  ["event", "event"],
  ["timestamp", "timestamp"],
  ["smtp-id", "smtpId"],
  ["smtp_id", "smtpId"],
  ["smtp id", "smtpId"],
  ["category", "category"],
  ["categories", "category"],
  ["email account id", "emailAccountId"],
  ["email_account_id", "emailAccountId"],
  ["sg_event_id", "sgEventId"],
  ["sg-event-id", "sgEventId"],
  ["sg event id", "sgEventId"],
]);

interface ExcelRow {
  email: string | null;
  event: string | null;
  timestamp: string | null;
  smtpId: string | null;
  category: string | null;
  emailAccountId: string | null;
  sgEventId: string | null;
}

const DATE_FORMATS = [
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd HH:mm:ss",
  "dd/MM/yyyy, h:mm:ss a",
  "dd/MM/yyyy, H:mm:ss",
  "MM/dd/yyyy HH:mm:ss",
  "MM/dd/yyyy, h:mm:ss a",
];

function parseDate(raw: string | null): Date | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  const isoCandidate = DateTime.fromISO(trimmed, { zone: TIMEZONE });

  if (isoCandidate.isValid) {
    return isoCandidate.toJSDate();
  }

  for (const format of DATE_FORMATS) {
    const parsed = DateTime.fromFormat(trimmed, format, {
      zone: TIMEZONE,
      setZone: true,
    });
    if (parsed.isValid) {
      return parsed.toJSDate();
    }
  }

  const jsDate = new Date(trimmed);
  if (!Number.isNaN(jsDate.valueOf())) {
    return DateTime.fromJSDate(jsDate, { zone: TIMEZONE }).toJSDate();
  }

  return null;
}

function coerceCategory(raw: string | null): string[] {
  if (!raw) return [];

  const trimmed = raw.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter((value) => typeof value === "string" && value.trim().length > 0);
    }
  } catch {
    // noop
  }

  return trimmed
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function coerceEventType(raw: string | null): EventType | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (
    [
      "processed",
      "delivered",
      "open",
      "click",
      "bounce",
      "deferred",
      "dropped",
      "unsubscribe",
      "spamreport",
      "block",
    ].includes(normalized)
  ) {
    return normalized as EventType;
  }
  return null;
}

type SupportedCell =
  | string
  | number
  | boolean
  | null
  | undefined
  | { text?: string }
  | { richText?: { text?: string | undefined }[] }
  | { hyperlink?: string; text?: string };

function extractCellValue(cellValue: SupportedCell): string | null {
  if (cellValue === null || cellValue === undefined) {
    return null;
  }

  if (typeof cellValue === "string" || typeof cellValue === "number" || typeof cellValue === "boolean") {
    return String(cellValue);
  }

  if (typeof cellValue === "object") {
    if ("text" in cellValue && typeof cellValue.text === "string") {
      return cellValue.text;
    }

    if ("richText" in cellValue && Array.isArray(cellValue.richText)) {
      return cellValue.richText.map((part) => part?.text ?? "").join("");
    }

    if ("hyperlink" in cellValue && typeof cellValue.text === "string") {
      return cellValue.text;
    }
  }

  return null;
}

async function readWorksheetRows(file: File): Promise<ExcelRow[]> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet("Data") ?? workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const headerMap = new Map<number, keyof ExcelRow>();
  let headerRowNumber: number | null = null;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (headerRowNumber !== null) {
      return;
    }

    const localMap = new Map<number, keyof ExcelRow>();
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const headerValue = String(cell.value ?? "").trim().toLowerCase();
      const mapped = ACCEPTED_HEADERS.get(headerValue);
      if (mapped) {
        localMap.set(colNumber, mapped);
      }
    });

    if (localMap.size > 0) {
      headerRowNumber = rowNumber;
      localMap.forEach((value, key) => headerMap.set(key, value));
    }
  });

  if (headerRowNumber === null || headerMap.size === 0) {
    return [];
  }

  const rows: ExcelRow[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowNumber!) return;

    const rowData: ExcelRow = {
      email: null,
      event: null,
      timestamp: null,
      smtpId: null,
      category: null,
      emailAccountId: null,
      sgEventId: null,
    };

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = headerMap.get(colNumber);
      if (!key) return;

      const value = extractCellValue(cell.value as SupportedCell);
      if (value !== null) {
        rowData[key] = value;
      }
    });

    rows.push(rowData);
  });

  return rows;
}

export async function parseSendGridExcel(file: File): Promise<EmailEvent[]> {
  const rows = await readWorksheetRows(file);
  const seen = new Set<string>();
  const events: EmailEvent[] = [];

  for (const row of rows) {
    const sgEventId = row.sgEventId?.trim();
    if (!sgEventId || seen.has(sgEventId)) {
      continue;
    }

    const email = row.email?.trim();
    const eventType = coerceEventType(row.event);
    const timestamp = parseDate(row.timestamp);

    if (!email || !eventType || !timestamp) {
      continue;
    }

    seen.add(sgEventId);

    const parsedUniqueId = Number(sgEventId);
    const uniqueId = Number.isNaN(parsedUniqueId) ? Date.now() + events.length : parsedUniqueId;

    events.push({
      unique_id: uniqueId,
      sg_event_id: sgEventId,
      email,
      event: eventType,
      timestamp,
      smtp_id: row.smtpId?.trim() ?? "",
      category: coerceCategory(row.category),
    });
  }

  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
