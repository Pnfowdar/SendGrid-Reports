"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/auth", { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Failed to log out. Please try again.");
        }
        router.replace("/login");
      } catch (logoutError) {
        setError(logoutError instanceof Error ? logoutError.message : "Unexpected error");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-card/80 hover:text-card-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden />
        {isPending ? "Signing out..." : "Sign out"}
      </button>
      {error && <span className="text-[11px] font-medium text-destructive">{error}</span>}
    </div>
  );
}
