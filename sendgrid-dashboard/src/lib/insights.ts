import type { EmailEvent, SmartInsight } from "@/types";

export async function generateInsights(events: EmailEvent[]): Promise<SmartInsight[]> {
  const insights: SmartInsight[] = [];
  
  // Rule 1: Bounce Warnings
  const bounceInsight = evaluateBounceWarnings(events);
  if (bounceInsight) insights.push(bounceInsight);
  
  return insights.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function evaluateBounceWarnings(events: EmailEvent[]): SmartInsight | null {
  const bouncesByEmail = new Map<string, number>();
  
  events.forEach(e => {
    if (['bounce', 'dropped', 'block'].includes(e.event)) {
      bouncesByEmail.set(e.email, (bouncesByEmail.get(e.email) || 0) + 1);
    }
  });
  
  const critical = Array.from(bouncesByEmail.values()).filter(c => c >= 5).length;
  const warning = Array.from(bouncesByEmail.values()).filter(c => c >= 3 && c < 5).length;
  
  if (critical === 0 && warning === 0) return null;
  
  const total = critical + warning;
  const now = new Date();
  
  return {
    id: `bounce-warning-${Date.now()}`,
    type: 'bounce',
    severity: critical > 0 ? 'critical' : 'warning',
    title: `${total} emails have bounced ${critical > 0 ? '5+' : '3+'} times`,
    description: critical > 0 
      ? 'These contacts are damaging your sender reputation and should be suppressed immediately.'
      : 'Monitor these contacts closely. Consider suppression if bounces continue.',
    metric: total,
    metric_label: critical > 0 ? 'critical bounces' : 'warning bounces',
    action: {
      label: 'View Bounce List',
      type: 'navigate',
      href: '/dashboard?t=bounce',
      exportType: 'bounce-list'
    },
    generated_at: now,
    data_period: {
      start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      end: now
    }
  };
}
