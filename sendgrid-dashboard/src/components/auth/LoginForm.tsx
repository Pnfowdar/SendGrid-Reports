"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const destination = redirectTo ?? searchParams.get("redirect") ?? "/";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = typeof data.error === "string" ? data.error : "Failed to sign in";
        throw new Error(message);
      }

      router.replace(destination);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-muted-foreground">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          disabled={isSubmitting}
          className="w-full rounded-lg border border-border/60 bg-card/60 px-4 py-2 text-sm text-card-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={isSubmitting}
          className="w-full rounded-lg border border-border/60 bg-card/60 px-4 py-2 text-sm text-card-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="flex items-center justify-between">
        <label htmlFor="remember" className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border border-border/60 bg-card/60 text-primary focus:ring-primary"
          />
          Remember this device
        </label>
        <span className="inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground/80">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          Secure access
        </span>
      </div>

      {error ? <p className="text-sm font-medium text-destructive" role="alert">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Signing in...
          </>
        ) : (
          <>Sign in</>
        )}
      </button>
    </form>
  );
}
