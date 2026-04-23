"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ProfileMediaStatus = "WATCHING" | "COMPLETED" | "PENDING" | "PLAN_TO_WATCH" | "DROPPED";

export type ProfileMediaItem = {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  status: ProfileMediaStatus;
};

type ProfileMediaCardProps = {
  item: ProfileMediaItem;
  onStatusChange: (id: string, status: ProfileMediaStatus) => void;
  onRemove: (id: string) => void;
  onRestore: (item: ProfileMediaItem) => void;
};

const statusOptions: Array<{ value: ProfileMediaStatus; label: string }> = [
  { value: "WATCHING", label: "Watching" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { value: "DROPPED", label: "Dropped" }
];

function posterUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w342${path}` : null;
}

async function trackRequest(method: "PATCH" | "DELETE", body: Record<string, unknown>) {
  const response = await fetch("/api/track", {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Unable to update this title.");
  }
}

export function ProfileMediaCard({ item, onStatusChange, onRemove, onRestore }: ProfileMediaCardProps) {
  const [isPending, setIsPending] = useState(false);
  const poster = posterUrl(item.posterPath);
  const activeLabel = statusOptions.find((option) => option.value === item.status)?.label ?? "Change Status";

  async function handleStatusChange(nextStatus: ProfileMediaStatus) {
    const previousItem = item;

    onStatusChange(item.id, nextStatus);
    setIsPending(true);

    try {
      await trackRequest("PATCH", {
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        status: nextStatus
      });
      toast.success(`${item.title} moved to ${statusOptions.find((option) => option.value === nextStatus)?.label}.`);
    } catch (error) {
      onRestore(previousItem);
      toast.error(error instanceof Error ? error.message : "Unable to update this title.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleRemove() {
    const previousItem = item;

    onRemove(item.id);
    setIsPending(true);

    try {
      await trackRequest("DELETE", {
        tmdbId: item.tmdbId
      });
      toast.success(`${item.title} removed from your list.`);
    } catch (error) {
      onRestore(previousItem);
      toast.error(error instanceof Error ? error.message : "Unable to remove this title.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <article className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-flame/40">
      <Link href={`/media/${item.mediaType}/${item.tmdbId}`} className="relative block aspect-[2/3] bg-panel">
        {poster ? (
          <Image src={poster} alt={`${item.title} poster`} fill sizes="(max-width: 768px) 50vw, 220px" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center p-4 text-center text-sm font-black text-white/35">{item.title}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
      </Link>

      <div className="relative -mt-24 flex min-h-24 flex-col justify-end gap-3 p-3 opacity-0 transition duration-300 group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={isPending}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-3 text-xs font-black text-ink shadow-lg transition hover:bg-white/90",
                isPending && "cursor-wait opacity-75"
              )}
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {activeLabel}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
            {statusOptions.map((option) => (
              <DropdownMenuItem key={option.value} onSelect={() => handleStatusChange(option.value)}>
                <span className="flex h-4 w-4 items-center justify-center">
                  {item.status === option.value ? <Check className="h-4 w-4 text-mint" /> : null}
                </span>
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-red-300/20 bg-red-400/15 px-3 text-xs font-black text-red-200 transition hover:bg-red-400/25 disabled:cursor-wait disabled:opacity-75"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>

      <div className="space-y-1 p-3">
        <h3 className="line-clamp-1 text-sm font-black text-white">{item.title}</h3>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">{item.mediaType}</p>
      </div>
    </article>
  );
}
