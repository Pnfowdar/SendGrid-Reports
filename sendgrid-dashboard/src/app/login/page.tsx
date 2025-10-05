import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import heroImage from "@/../public/window.svg";

export const metadata: Metadata = {
  title: "Sign in • SendGrid Dashboard",
  description: "Secure access to the SendGrid deliverability dashboard",
};

// Force dynamic rendering since LoginForm uses useSearchParams
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-12 px-4 py-12 md:flex-row md:items-center">
        <div className="flex-1 space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Secure access
          </span>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            SendGrid Deliverability & Engagement Dashboard
          </h1>
          <p className="max-w-xl text-sm text-slate-300/80 md:text-base">
            Upload SendGrid event exports, monitor deliverability trends, drill into recipient journeys, and export
            actionable insights. Sign in with your organization credentials to continue.
          </p>
          <div className="relative mt-8 hidden w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800/80 shadow-[0_25px_80px_-30px_rgba(15,23,42,0.75)] md:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/70 via-slate-900/40 to-transparent" />
            <Image
              src={heroImage}
              alt="Data visualization"
              priority
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>

        <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-[0_25px_80px_-30px_rgba(15,23,42,0.75)] backdrop-blur">
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold text-slate-100">Welcome back</h2>
            <p className="text-sm text-slate-400">Enter your credentials to access the dashboard.</p>
          </div>
          <Suspense fallback={<div className="text-center text-sm text-slate-400">Loading...</div>}>
            <LoginForm />
          </Suspense>
          <p className="text-center text-[11px] text-slate-500">
            Having trouble signing in? Contact the dashboard administrator.
          </p>
          <p className="text-center text-[10px] text-slate-500">
            Supabase connection configured via environment variables. Review the deployment checklist in the README for
            details.
          </p>
          <div className="text-center text-xs text-slate-500">
            <span className="font-medium text-slate-300">Need help?</span> {" "}
            <Link href="mailto:support@example.com" className="text-primary hover:underline">
              Email support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
