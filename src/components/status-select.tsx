"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getStatusMeta, trackingStatuses, type TrackingStatusValue } from "@/lib/status";

type StatusSelectProps = {
  value: TrackingStatusValue;
  label?: string;
};

export function StatusSelect({ value, label = "Update tracking status" }: StatusSelectProps) {
  const [selected, setSelected] = useState<TrackingStatusValue>(value);
  const active = getStatusMeta(selected);
  const Icon = active.icon;

  return (
    <label className="group relative block">
      <span className="sr-only">{label}</span>
      <span
        className={`pointer-events-none absolute inset-y-1 left-1.5 z-10 flex items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold ring-1 ${active.tone}`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{active.label}</span>
      </span>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-white/70" />
      <select
        value={selected}
        className="h-9 w-full appearance-none rounded-full border border-white/10 bg-black/55 pl-10 pr-8 text-xs font-semibold text-transparent outline-none ring-0 backdrop-blur transition focus:border-flame/70 focus:bg-black/75"
        onChange={(event) => {
          setSelected(event.target.value as TrackingStatusValue);
        }}
      >
        {trackingStatuses.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </label>
  );
}
