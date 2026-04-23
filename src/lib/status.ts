import { CheckCircle2, CircleDotDashed, Eye, ListPlus, XCircle } from "lucide-react";

export const trackingStatuses = [
  {
    value: "WATCHING",
    label: "Watching",
    tone: "bg-mint/15 text-mint ring-mint/30",
    icon: Eye
  },
  {
    value: "COMPLETED",
    label: "Completed",
    tone: "bg-gold/15 text-gold ring-gold/30",
    icon: CheckCircle2
  },
  {
    value: "PLAN_TO_WATCH",
    label: "Plan to Watch",
    tone: "bg-flame/15 text-flame ring-flame/30",
    icon: ListPlus
  },
  {
    value: "PENDING",
    label: "Pending",
    tone: "bg-white/10 text-white ring-white/20",
    icon: CircleDotDashed
  },
  {
    value: "DROPPED",
    label: "Dropped",
    tone: "bg-red-400/15 text-red-300 ring-red-400/30",
    icon: XCircle
  }
] as const;

export type TrackingStatusValue = (typeof trackingStatuses)[number]["value"];

export function getStatusMeta(value: TrackingStatusValue) {
  return trackingStatuses.find((status) => status.value === value) ?? trackingStatuses[0];
}
