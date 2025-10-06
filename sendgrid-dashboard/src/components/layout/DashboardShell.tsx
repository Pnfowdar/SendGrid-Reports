import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { BarChart3, Building2, Users, RefreshCw } from "lucide-react";

interface DashboardShellProps {
  children: ReactNode;
  eventsCount: number;
  lastUpdated?: Date;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DashboardShell({ 
  children, 
  eventsCount, 
  lastUpdated,
  onRefresh,
  isRefreshing = false 
}: DashboardShellProps) {
  const pathname = usePathname();
  const showTitle = pathname === '/';
  
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-950/90 px-3 sm:px-4 md:px-10 pb-16 pt-6 sm:pt-10 text-slate-100 xl:ml-64 transition-all duration-300">
      <header className="mx-auto w-full max-w-6xl space-y-6">
        {/* Navigation + Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
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

          {/* Header Controls (right side) */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
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
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-sm font-semibold text-card-foreground transition hover:bg-card/80 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Refresh data"
              >
                <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                {isRefreshing ? "Refreshing..." : "Refresh Data"}
              </button>
            )}
            <LogoutButton />
          </div>
        </div>

        {/* Title box (only on main dashboard) */}
        {showTitle && (
          <div className="flex flex-col gap-4 rounded-2xl sm:rounded-3xl border border-border/50 bg-card/70 p-4 sm:p-6 md:p-8 shadow-floating-card backdrop-blur">
            <div>
              <h1 className="text-2xl font-semibold text-card-foreground md:text-3xl">
                SendGrid Deliverability & Engagement Dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground md:max-w-2xl">
                Upload SendGrid Excel exports to explore deliverability, engagement, and category performance.
                Filter by recipient, event type, and date range, then export insights for reporting.
              </p>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto mt-8 flex w-full max-w-6xl flex-1 flex-col gap-8">{children}</main>
    </div>
  );
}
