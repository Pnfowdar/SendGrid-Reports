import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { BarChart3, Building2, Users } from "lucide-react";

interface DashboardShellProps {
  children: ReactNode;
  eventsCount: number;
  lastUpdated?: Date;
}

export function DashboardShell({ children, eventsCount, lastUpdated }: DashboardShellProps) {
  const pathname = usePathname();
  
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-950/90 px-3 sm:px-4 md:px-10 pb-16 pt-6 sm:pt-10 text-slate-100">
      <header className="mx-auto w-full max-w-6xl space-y-6">
        {/* Navigation */}
        <nav className="flex gap-2">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              pathname === '/'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/individuals"
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              pathname === '/individuals'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Individuals
          </Link>
          <Link
            href="/companies"
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              pathname === '/companies'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Companies
          </Link>
        </nav>

        <div className="flex flex-col gap-4 rounded-2xl sm:rounded-3xl border border-border/50 bg-card/70 p-4 sm:p-6 md:p-8 shadow-floating-card backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-card-foreground md:text-3xl">
                SendGrid Deliverability & Engagement Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground md:max-w-2xl">
                Upload SendGrid Excel exports to explore deliverability, engagement, and category performance.
                Filter by recipient, event type, and date range, then export insights for reporting.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2 text-xs text-muted-foreground md:items-end">
              <div className="flex flex-col items-end gap-1">
                <span
                  className="rounded-full bg-primary/15 px-3 py-1 font-semibold text-primary"
                  data-testid="event-count"
                >
                  {eventsCount.toLocaleString()} events loaded
                </span>
                <span data-testid="last-updated">
                  Last updated: {lastUpdated ? formatDateTime(lastUpdated) : "Awaiting upload"}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 flex w-full max-w-6xl flex-1 flex-col gap-8">{children}</main>
    </div>
  );
}
