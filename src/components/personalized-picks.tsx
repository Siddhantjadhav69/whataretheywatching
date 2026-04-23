"use client";

import { Info, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type PersonalizedPick = {
  title: string;
  mediaType: "movie" | "tv";
  matchReason: string;
  tmdbSearchQuery: string;
};

type PersonalizedPicksResponse = {
  recommendations: PersonalizedPick[];
  error?: string;
};

type PersonalizedPicksProps = {
  className?: string;
};

export function PersonalizedPicks({ className }: PersonalizedPicksProps) {
  const [picks, setPicks] = useState<PersonalizedPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPicks() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recommendations", {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      });
      const payload = (await response.json()) as PersonalizedPicksResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to generate recommendations.");
      }

      setPicks(payload.recommendations);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to generate recommendations.");
      setPicks([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPicks();
  }, []);

  return (
    <section className={cn("space-y-5", className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame">AI Curator</p>
          <h2 className="mt-1 text-2xl font-black text-white">Personalized Picks</h2>
        </div>
        <button
          onClick={loadPicks}
          disabled={isLoading}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-sm font-semibold text-red-200">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-lg border border-white/10 bg-white/[0.045]" />
          ))}
        </div>
      ) : null}

      {!isLoading && !error && !picks.length ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5 text-sm leading-6 text-white/60">
          Add a few completed or currently watching titles to unlock taste-based recommendations.
        </div>
      ) : null}

      {!isLoading && picks.length ? (
        <TooltipProvider delayDuration={150}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {picks.map((pick) => (
              <article
                key={`${pick.mediaType}-${pick.title}`}
                className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/20 transition hover:border-flame/35 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex rounded-full bg-flame/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-flame">
                      {pick.mediaType}
                    </span>
                    <h3 className="mt-3 text-lg font-black leading-tight text-white">{pick.title}</h3>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:text-white">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">Why this matches</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{pick.matchReason}</TooltipContent>
                  </Tooltip>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/60">{pick.matchReason}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-bold text-white/55">
                  <Sparkles className="h-3.5 w-3.5 text-gold" />
                  {pick.tmdbSearchQuery}
                </div>
              </article>
            ))}
          </div>
        </TooltipProvider>
      ) : null}
    </section>
  );
}
