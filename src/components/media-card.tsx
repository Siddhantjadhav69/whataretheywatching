import Image from "next/image";
import { Star } from "lucide-react";
import { MediaCardTrackButton } from "@/components/media-card-track-button";
import type { TrackingStatusValue } from "@/lib/status";

export type MediaCardItem = {
  id: string;
  title: string;
  kind: "Movie" | "Series";
  year: string;
  rating: string;
  poster: string;
  status: TrackingStatusValue | null;
  genres: string[];
};

type MediaCardProps = {
  item: MediaCardItem;
  priority?: boolean;
};

export function MediaCard({ item, priority = false }: MediaCardProps) {
  return (
    <article className="group min-w-[158px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/25 transition duration-300 hover:-translate-y-1 hover:border-flame/40 hover:bg-white/[0.07] sm:min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden bg-panel">
        <Image
          src={item.poster}
          alt={`${item.title} poster`}
          fill
          priority={priority}
          sizes="(max-width: 640px) 42vw, (max-width: 1024px) 22vw, 180px"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/45 to-transparent p-2.5">
          <MediaCardTrackButton 
            tmdbId={parseInt(item.id)} 
            mediaType={item.kind === "Movie" ? "movie" : "tv"}
            title={item.title}
            posterPath={item.poster}
            initialStatus={item.status}
          />
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div>
          <h3 className="line-clamp-1 text-sm font-bold text-white">{item.title}</h3>
          <p className="mt-1 text-xs text-white/55">
            {item.kind} • {item.year}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="line-clamp-1 text-xs text-white/50">{item.genres.join(", ")}</span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-2 py-1 text-xs font-bold text-gold">
            <Star className="h-3 w-3 fill-current" />
            {item.rating}
          </span>
        </div>
      </div>
    </article>
  );
}
