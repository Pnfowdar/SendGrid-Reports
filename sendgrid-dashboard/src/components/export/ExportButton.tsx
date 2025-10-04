"use client";

import { useCallback, useState } from "react";
import { Download } from "lucide-react";

interface ExportButtonProps {
  onExport: () => Promise<void> | void;
  label?: string;
}

export function ExportButton({ onExport, label = "Export CSV" }: ExportButtonProps) {
  const [isLoading, setLoading] = useState(false);
  const handleClick = useCallback(async () => {
    try {
      setLoading(true);
      await onExport();
    } finally {
      setLoading(false);
    }
  }, [onExport]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Download className="h-3.5 w-3.5" aria-hidden />
      {isLoading ? "Preparing..." : label}
    </button>
  );
}
