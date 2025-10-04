import type { EmailEvent } from "@/types";
import { startOfDay, startOfWeek, startOfMonth, differenceInDays } from "date-fns";

export type TimeGranularity = "daily" | "weekly" | "monthly";

export interface SequenceMetrics {
  sequenceNumber: number;
  totalSent: number;
  uniqueRecipients: number;
  openRate: number;
  clickRate: number;
  recipients: string[];
}

export interface SequenceTrend {
  date: Date;
  sequences: Map<number, number>;
}

export interface SequenceAnalytics {
  metrics: SequenceMetrics[];
  trends: SequenceTrend[];
  totalEmails: number;
  uniqueRecipients: number;
  averageSequenceDepth: number;
}

export interface ComparisonData {
  current: SequenceAnalytics;
  previous: SequenceAnalytics;
}

/**
 * Analyzes email events to determine sequence position for each recipient
 */
export function analyzeEmailSequences(
  events: EmailEvent[],
  dateRange: [Date | null, Date | null],
  granularity: TimeGranularity = "weekly"
): SequenceAnalytics {
  const [startDate, endDate] = dateRange;
  
  // Filter processed events within date range
  const processedEvents = events.filter((event) => {
    if (event.event !== "processed") return false;
    if (startDate && event.timestamp < startDate) return false;
    if (endDate && event.timestamp > endDate) return false;
    return true;
  });

  // Group by recipient and sort chronologically
  const recipientEmails = new Map<string, EmailEvent[]>();
  
  processedEvents.forEach((event) => {
    const existing = recipientEmails.get(event.email) || [];
    existing.push(event);
    recipientEmails.set(event.email, existing);
  });

  // Sort each recipient's emails by timestamp
  recipientEmails.forEach((emails) => {
    emails.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  });

  // Assign sequence numbers
  const sequenceData = new Map<number, Set<string>>();
  const sequenceEngagement = new Map<number, { opens: Set<string>; clicks: Set<string> }>();
  
  recipientEmails.forEach((emails, recipient) => {
    emails.forEach((email, index) => {
      const seqNum = index + 1;
      
      if (!sequenceData.has(seqNum)) {
        sequenceData.set(seqNum, new Set());
      }
      sequenceData.get(seqNum)!.add(recipient);

      if (!sequenceEngagement.has(seqNum)) {
        sequenceEngagement.set(seqNum, { opens: new Set(), clicks: new Set() });
      }

      // Track engagement for this sequence
      const hasOpened = events.some(
        (e) => e.email === recipient && e.event === "open" && e.timestamp >= email.timestamp
      );
      const hasClicked = events.some(
        (e) => e.email === recipient && e.event === "click" && e.timestamp >= email.timestamp
      );

      if (hasOpened) {
        sequenceEngagement.get(seqNum)!.opens.add(recipient);
      }
      if (hasClicked) {
        sequenceEngagement.get(seqNum)!.clicks.add(recipient);
      }
    });
  });

  // Build metrics
  const metrics: SequenceMetrics[] = [];
  const maxSequence = Math.max(...Array.from(sequenceData.keys()));

  for (let seq = 1; seq <= maxSequence; seq++) {
    const recipients = sequenceData.get(seq) || new Set();
    const engagement = sequenceEngagement.get(seq) || { opens: new Set(), clicks: new Set() };
    
    metrics.push({
      sequenceNumber: seq,
      totalSent: recipients.size,
      uniqueRecipients: recipients.size,
      openRate: recipients.size > 0 ? (engagement.opens.size / recipients.size) * 100 : 0,
      clickRate: recipients.size > 0 ? (engagement.clicks.size / recipients.size) * 100 : 0,
      recipients: Array.from(recipients),
    });
  }

  // Calculate trends
  const trends = calculateTrends(recipientEmails, granularity, dateRange);

  // Summary stats
  const totalEmails = processedEvents.length;
  const uniqueRecipients = recipientEmails.size;
  const totalSequenceDepth = Array.from(recipientEmails.values()).reduce(
    (sum, emails) => sum + emails.length,
    0
  );
  const averageSequenceDepth = uniqueRecipients > 0 ? totalSequenceDepth / uniqueRecipients : 0;

  return {
    metrics,
    trends,
    totalEmails,
    uniqueRecipients,
    averageSequenceDepth,
  };
}

function calculateTrends(
  recipientEmails: Map<string, EmailEvent[]>,
  granularity: TimeGranularity,
  dateRange: [Date | null, Date | null]
): SequenceTrend[] {
  const [startDate, endDate] = dateRange;
  if (!startDate || !endDate) return [];

  const trends: SequenceTrend[] = [];
  const bucketFn =
    granularity === "daily"
      ? startOfDay
      : granularity === "weekly"
      ? (d: Date) => startOfWeek(d, { weekStartsOn: 1 })
      : startOfMonth;

  const buckets = new Map<string, Map<number, number>>();

  recipientEmails.forEach((emails) => {
    emails.forEach((email, index) => {
      const bucketDate = bucketFn(email.timestamp);
      const bucketKey = bucketDate.toISOString();
      const seqNum = index + 1;

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, new Map());
      }

      const bucket = buckets.get(bucketKey)!;
      bucket.set(seqNum, (bucket.get(seqNum) || 0) + 1);
    });
  });

  Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([dateStr, sequences]) => {
      trends.push({
        date: new Date(dateStr),
        sequences,
      });
    });

  return trends;
}

export function calculateComparison(
  events: EmailEvent[],
  currentRange: [Date | null, Date | null],
  granularity: TimeGranularity
): ComparisonData | null {
  const [currentStart, currentEnd] = currentRange;
  if (!currentStart || !currentEnd) return null;

  const rangeDays = differenceInDays(currentEnd, currentStart);
  const previousStart = new Date(currentStart.getTime() - rangeDays * 24 * 60 * 60 * 1000);
  const previousEnd = new Date(currentStart.getTime() - 1);

  const current = analyzeEmailSequences(events, [currentStart, currentEnd], granularity);
  const previous = analyzeEmailSequences(events, [previousStart, previousEnd], granularity);

  return { current, previous };
}
