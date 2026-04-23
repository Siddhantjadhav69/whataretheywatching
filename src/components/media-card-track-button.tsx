"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Eye, CheckCircle2, ListPlus, CircleDotDashed, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const trackingStatuses = [
  {
    value: "WATCHING",
    label: "Watching",
    tone: "bg-mint/15 text-mint ring-mint/30",
    icon: Eye,
  },
  {
    value: "COMPLETED",
    label: "Completed",
    tone: "bg-gold/15 text-gold ring-gold/30",
    icon: CheckCircle2,
  },
  {
    value: "PLAN_TO_WATCH",
    label: "Plan to Watch",
    tone: "bg-flame/15 text-flame ring-flame/30",
    icon: ListPlus,
  },
  {
    value: "PENDING",
    label: "Pending",
    tone: "bg-white/10 text-white ring-white/20",
    icon: CircleDotDashed,
  },
  {
    value: "DROPPED",
    label: "Dropped",
    tone: "bg-red-400/15 text-red-300 ring-red-400/30",
    icon: XCircle,
  },
] as const;

export type TrackingStatusValue = (typeof trackingStatuses)[number]["value"];

interface MediaCardTrackButtonProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  initialStatus?: TrackingStatusValue | null;
  className?: string;
}

export function MediaCardTrackButton({
  tmdbId,
  mediaType,
  title,
  posterPath,
  initialStatus = null,
  className,
}: MediaCardTrackButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<TrackingStatusValue | null>(initialStatus);
  const [isPending, setIsPending] = useState(false);

  const isTracked = status !== null;
  const currentStatus = isTracked
    ? trackingStatuses.find((s) => s.value === status) || trackingStatuses[0]
    : null;

  async function handleStatusChange(newStatus: TrackingStatusValue) {
    setIsPending(true);

    try {
      const response = await fetch("/api/track", {
        method: !isTracked ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId,
          mediaType,
          title,
          posterPath,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const errorMessage = payload?.error || "Unknown server error";
        console.error("TRACKING ERROR:", errorMessage);
        alert(errorMessage);
        return;
      }

      setStatus(newStatus);
      router.refresh();
      toast.success(
        !isTracked
          ? `${title} added to your list`
          : `${title} status updated to ${newStatus}`
      );
    } catch (error: any) {
      console.error("REQUEST ERROR:", error);
      alert(error.message || "Failed to update tracking status");
    } finally {
      setIsPending(false);
    }
  }

  if (!isTracked || !currentStatus) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={isPending}
            className={cn(
              "inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/75",
              isPending && "cursor-not-allowed opacity-50",
              className
            )}
          >
            {isPending ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Add to List</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-zinc-950 border-zinc-800 text-zinc-100 min-w-[180px]"
          align="start"
        >
          {trackingStatuses.map((status) => {
            const Icon = status.icon;
            return (
              <DropdownMenuItem
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                className="text-zinc-100 hover:bg-zinc-800 hover:text-white cursor-pointer flex items-center gap-2 px-3 py-2"
              >
                <Icon className="h-4 w-4" />
                <span>{status.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isPending}
          className={cn(
            "inline-flex h-9 w-full items-center justify-between gap-2 rounded-full border px-3 text-xs font-semibold backdrop-blur transition",
            currentStatus?.tone,
            "border-white/10",
            isPending && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <div className="flex items-center gap-1.5">
            {isPending ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <currentStatus.icon className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{currentStatus?.label}</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="bg-zinc-950 border-zinc-800 text-zinc-100 min-w-[180px]"
        align="start"
      >
        {trackingStatuses.map((status) => {
          const Icon = status.icon;
          const isActive = status.value === currentStatus?.value;
          
          return (
            <DropdownMenuItem
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              className={cn(
                "text-zinc-100 hover:bg-zinc-800 hover:text-white cursor-pointer flex items-center gap-2 px-3 py-2",
                isActive && "bg-zinc-800 text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{status.label}</span>
              {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-current" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}