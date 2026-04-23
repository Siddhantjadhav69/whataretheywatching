"use client";

import { useState } from "react";
import { Bookmark, Heart, ChevronDown, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

type TrackingData = {
  status: string;
  isFavorite: boolean;
  rating: number | null;
};

type MediaDetailActionsProps = {
  tmdbId: number;
  mediaType: string;
  title: string;
  posterPath: string | null;
  initialTracking: TrackingData | null;
};

const statuses = [
  { value: "WATCHING", label: "Watching" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { value: "DROPPED", label: "Dropped" },
];

export function MediaDetailActions({ tmdbId, mediaType, title, posterPath, initialTracking }: MediaDetailActionsProps) {
  const [tracking, setTracking] = useState<TrackingData | null>(initialTracking);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  async function handleTrack(status: string) {
    setIsLoading(true);
    setShowDropdown(false);
    try {
      if (tracking) {
        const res = await fetch("/api/track", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tmdbId, status })
        });
        if (res.ok) {
          setTracking(prev => prev ? { ...prev, status } : { status, isFavorite: false, rating: null });
          toast.success(`Updated to ${status.replace(/_/g, " ").toLowerCase()}`);
        }
      } else {
        const res = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tmdbId, mediaType, title, posterPath, status })
        });
        if (res.ok) {
          setTracking({ status, isFavorite: false, rating: null });
          toast.success(`Added to ${status.replace(/_/g, " ").toLowerCase()}`);
        }
      }
    } catch {
      toast.error("Failed to update tracking.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFavorite() {
    if (!tracking) {
      toast.error("Track this title first before adding to favorites.");
      return;
    }
    try {
      const res = await fetch("/api/track/favorite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId })
      });
      if (res.ok) {
        const data = await res.json();
        setTracking(prev => prev ? { ...prev, isFavorite: data.isFavorite } : null);
        toast.success(data.isFavorite ? "Added to favorites!" : "Removed from favorites.");
      }
    } catch {
      toast.error("Failed to toggle favorite.");
    }
  }

  async function handleRemove() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/track", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId })
      });
      if (res.ok) {
        setTracking(null);
        toast.success("Removed from your list.");
      }
    } catch {
      toast.error("Failed to remove.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Track / Status Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition ${
            tracking
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
              : "bg-flame text-white hover:bg-[#ff674d]"
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : tracking ? (
            <Check className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
          {tracking ? tracking.status.replace(/_/g, " ") : "Add to List"}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 z-50 mt-2 w-48 rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-xl">
            {statuses.map(s => (
              <button
                key={s.value}
                onClick={() => handleTrack(s.value)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left transition hover:bg-zinc-800 ${
                  tracking?.status === s.value ? "text-emerald-400 font-bold" : "text-zinc-300"
                }`}
              >
                {tracking?.status === s.value && <Check className="h-3.5 w-3.5" />}
                {s.label}
              </button>
            ))}
            {tracking && (
              <>
                <div className="my-1 border-t border-zinc-800" />
                <button
                  onClick={handleRemove}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 transition"
                >
                  Remove from list
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Favorite Button */}
      <button
        onClick={handleFavorite}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition ${
          tracking?.isFavorite
            ? "border-pink-500/30 bg-pink-500/15 text-pink-400 hover:bg-pink-500/25"
            : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        }`}
      >
        <Heart className={`h-4 w-4 ${tracking?.isFavorite ? "fill-pink-400" : ""}`} />
        {tracking?.isFavorite ? "Favorited" : "Favorite"}
      </button>
    </div>
  );
}
