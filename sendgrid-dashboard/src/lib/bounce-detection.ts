import type { EmailEvent, BounceWarning } from "@/types";

export const BOUNCE_THRESHOLDS = {
  WARNING: 3,
  CRITICAL: 5,
} as const;

export function detectBounces(events: EmailEvent[]): BounceWarning[] {
  const bouncesByEmail = new Map<string, EmailEvent[]>();
  
  // Group bounce events by email
  events.forEach(e => {
    if (['bounce', 'dropped', 'block'].includes(e.event)) {
      const existing = bouncesByEmail.get(e.email) || [];
      bouncesByEmail.set(e.email, [...existing, e]);
    }
  });
  
  // Generate warnings
  const warnings: BounceWarning[] = [];
  
  bouncesByEmail.forEach((bounceEvents, email) => {
    if (bounceEvents.length < BOUNCE_THRESHOLDS.WARNING) return;
    
    const domain = email.split('@')[1] || '';
    const sortedEvents = bounceEvents.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    warnings.push({
      email,
      domain,
      bounce_count: bounceEvents.length,
      bounce_types: [...new Set(bounceEvents.map(e => e.event))],
      first_bounce: sortedEvents[0].timestamp,
      last_bounce: sortedEvents[sortedEvents.length - 1].timestamp,
      days_bouncing: Math.floor(
        (sortedEvents[sortedEvents.length - 1].timestamp.getTime() - 
         sortedEvents[0].timestamp.getTime()) / (1000 * 60 * 60 * 24)
      ),
      severity: bounceEvents.length >= BOUNCE_THRESHOLDS.CRITICAL 
        ? 'critical' 
        : 'warning',
      action_required: bounceEvents.length >= BOUNCE_THRESHOLDS.CRITICAL 
        ? 'suppress' 
        : 'monitor',
    });
  });
  
  return warnings.sort((a, b) => b.bounce_count - a.bounce_count);
}
