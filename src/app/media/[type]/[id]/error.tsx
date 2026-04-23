"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { AppNav } from "@/components/app-nav";

type MediaDetailsErrorProps = {
  error: Error;
  reset: () => void;
};

export default function MediaDetailsError({ error, reset }: MediaDetailsErrorProps) {
  return (
    <main className="min-h-screen bg-ink pb-24 text-white lg:pb-0">
      <AppNav />
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center px-4 py-16 text-center">
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-8 shadow-2xl shadow-black/30">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-flame/15 text-flame">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-3xl font-black">Could not load this title</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">{error.message}</p>
          <button
            onClick={reset}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-ink transition hover:bg-white/90"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </section>
    </main>
  );
}
