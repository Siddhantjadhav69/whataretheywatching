"use client";

import { Check, ChevronDown, ListPlus, Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type TrackStatus = "WATCHING" | "COMPLETED" | "PENDING" | "PLAN_TO_WATCH" | "DROPPED";

type TrackButtonProps = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  initialStatus?: TrackStatus | null;
  className?: string;
};

const statusOptions: Array<{ value: TrackStatus; label: string }> = [
  { value: "WATCHING", label: "Watching" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "Pending" },
  { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { value: "DROPPED", label: "Dropped" }
];



export function TrackButton({ tmdbId, mediaType, title, posterPath = null, initialStatus = null, className }: TrackButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<TrackStatus | null>(initialStatus);
  const [isPending, setIsPending] = useState(false);

  const activeLabel = useMemo(() => {
    return statusOptions.find((option) => option.value === status)?.label ?? "Add to List";
  }, [status]);

  async function handleUpdateStatus(nextStatus: TrackStatus) {
    setIsPending(true);

    try {
      const response = await fetch("/api/track", {
        method: status ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId,
          mediaType,
          title,
          posterPath,
          status: nextStatus
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const errorMessage = payload?.error || "Unknown server error";
        console.error("TRACKING ERROR:", errorMessage);
        alert(errorMessage);
        return;
      }

      setStatus(nextStatus);
      router.refresh();
      toast.success(`Moved to ${statusOptions.find((option) => option.value === nextStatus)?.label ?? "your list"}.`);
    } catch (requestError: any) {
      console.error("REQUEST ERROR:", requestError);
      alert(requestError.message || "Network error");
    } finally {
      setIsPending(false);
    }
  }

  async function removeFromList() {
    setIsPending(true);

    try {
      const response = await fetch("/api/track", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const errorMessage = payload?.error || "Unknown server error";
        console.error("DELETE ERROR:", errorMessage);
        alert(errorMessage);
        return;
      }

      setStatus(null);
      router.refresh();
      toast.success("Removed from your list.");
    } catch (requestError: any) {
      console.error("REQUEST ERROR:", requestError);
      alert(requestError.message || "Unable to remove this title.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-sm font-black text-white shadow-lg shadow-black/20 transition",
              status ? "bg-flame hover:bg-[#ff674d]" : "bg-white/10 hover:bg-white/15",
              isPending && "cursor-wait opacity-75"
            )}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
            {activeLabel}
            <ChevronDown className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Track Status</DropdownMenuLabel>
          {statusOptions.map((option) => (
            <DropdownMenuItem key={option.value} onSelect={() => handleUpdateStatus(option.value)}>
              <span className="flex h-4 w-4 items-center justify-center">
                {status === option.value ? <Check className="h-4 w-4 text-mint" /> : null}
              </span>
              {option.label}
            </DropdownMenuItem>
          ))}
          {status ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-300 focus:text-red-200" onSelect={removeFromList}>
                <Trash2 className="h-4 w-4" />
                Remove from List
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
