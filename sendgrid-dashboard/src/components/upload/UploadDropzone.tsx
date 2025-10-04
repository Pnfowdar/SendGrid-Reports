"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import type { EmailEvent } from "@/types";
import { parseSendGridExcel } from "@/lib/excel-parser";
import { cn } from "@/utils/cn";

interface UploadDropzoneProps {
  onUpload: (events: EmailEvent[]) => void;
  disabled?: boolean;
}

export function UploadDropzone({ onUpload, disabled }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];

      if (!file.name.toLowerCase().endsWith(".xlsx")) {
        setError("Only .xlsx Excel files are supported");
        return;
      }

      setError(null);
      setLoading(true);
      try {
        const events = await parseSendGridExcel(file);
        if (!events.length) {
          setError("No SendGrid events found in the uploaded file");
          return;
        }
        onUpload(events);
      } catch (uploadError) {
        console.error(uploadError);
        setError("Failed to parse Excel file. Please ensure it matches the SendGrid schema.");
      } finally {
        setLoading(false);
      }
    },
    [onUpload]
  );

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      if (disabled) return;
      setDragging(false);
      await handleFiles(event.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!disabled) setDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      await handleFiles(event.target.files);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [handleFiles]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLLabelElement>) => {
      if (disabled || isLoading) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled, isLoading]
  );

  return (
    <div className="space-y-3" aria-live="polite">
      <label
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-describedby="upload-instructions"
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/60 p-8 text-center transition-all",
          isDragging && "border-primary bg-primary/10",
          (disabled || isLoading) && "cursor-not-allowed opacity-70",
          !disabled && !isLoading && "cursor-pointer hover:bg-card/80"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        ) : (
          <UploadCloud className="h-8 w-8 text-primary" aria-hidden />
        )}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-card-foreground" id="upload-instructions">
            {isLoading ? "Processing Excel file..." : "Drop your SendGrid Excel export or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground">
            Accepted format: .xlsx • Columns: Email, Event, Timestamp, SMTP-ID, Category, Email Account ID, sg_event_id
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          data-testid="excel-upload-input"
          className="hidden"
          onChange={onFileChange}
          disabled={disabled || isLoading}
          aria-hidden
        />
      </label>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
