"use client";

import Image from "next/image";
import Link from "next/link";
import { ProfileMediaItem, ProfileMediaStatus } from "./profile-media-card";

function posterUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w342${path}` : null;
}

const statusLabels: Record<ProfileMediaStatus, string> = {
  WATCHING: "Watching",
  COMPLETED: "Completed",
  PENDING: "Pending",
  PLAN_TO_WATCH: "Plan to Watch",
  DROPPED: "Dropped"
};

interface ReadOnlyProfileMediaCardProps {
  item: ProfileMediaItem;
}

export function ReadOnlyProfileMediaCard({ item }: ReadOnlyProfileMediaCardProps) {
  const poster = posterUrl(item.posterPath);
  const statusLabel = statusLabels[item.status];

  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-zinc-700">
      <Link href={`/media/${item.mediaType}/${item.tmdbId}`} className="relative block aspect-[2/3] bg-zinc-800">
        {poster ? (
          <Image src={poster} alt={`${item.title} poster`} fill sizes="(max-width: 768px) 50vw, 220px" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center p-4 text-center text-sm font-black text-zinc-500">{item.title}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/55 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
      </Link>

      <div className="relative -mt-24 flex min-h-24 flex-col justify-end gap-3 p-3 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="inline-flex items-center justify-center rounded-full bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 shadow-lg">
          {statusLabel}
        </div>
      </div>

      <div className="space-y-1 p-3">
        <h3 className="line-clamp-1 text-sm font-black text-zinc-100">{item.title}</h3>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{item.mediaType}</p>
      </div>
    </article>
  );
}