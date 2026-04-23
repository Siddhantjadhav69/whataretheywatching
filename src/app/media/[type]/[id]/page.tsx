import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, Clock, Play, Star } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { CastCarousel } from "@/components/cast-carousel";
import { TrackButton } from "@/components/track-button";
import { Badge } from "@/components/ui/badge";
import { getBestTrailer, getTmdbMediaDetails, tmdbImage, type TmdbMediaType } from "@/lib/tmdb";

type MediaDetailsPageProps = {
  params: {
    type: string;
    id: string;
  };
};

function isMediaType(type: string): type is TmdbMediaType {
  return type === "movie" || type === "tv";
}

function getTitle(media: Awaited<ReturnType<typeof getTmdbMediaDetails>>) {
  return media.title ?? media.name ?? "Untitled";
}

function getYear(media: Awaited<ReturnType<typeof getTmdbMediaDetails>>) {
  const date = media.release_date ?? media.first_air_date;
  return date ? new Date(date).getFullYear() : "TBA";
}

function getRuntime(media: Awaited<ReturnType<typeof getTmdbMediaDetails>>, type: TmdbMediaType) {
  if (type === "movie") {
    return media.runtime ? `${media.runtime} min` : "Runtime TBA";
  }

  const episodeRuntime = media.episode_run_time?.[0];
  const seasons = media.number_of_seasons ? `${media.number_of_seasons} season${media.number_of_seasons > 1 ? "s" : ""}` : null;

  if (episodeRuntime && seasons) {
    return `${episodeRuntime} min episodes / ${seasons}`;
  }

  return episodeRuntime ? `${episodeRuntime} min episodes` : seasons ?? "Runtime TBA";
}

export default async function MediaDetailsPage({ params }: MediaDetailsPageProps) {
  const id = Number(params.id);

  if (!isMediaType(params.type) || Number.isNaN(id)) {
    notFound();
  }

  const media = await getTmdbMediaDetails(params.type, id);
  const title = getTitle(media);
  const year = getYear(media);
  const runtime = getRuntime(media, params.type);
  const poster = tmdbImage(media.poster_path, "w500");
  const backdrop = tmdbImage(media.backdrop_path, "original");
  const trailer = getBestTrailer(media.videos.results);

  return (
    <main className="min-h-screen bg-ink pb-24 lg:pb-0">
      <AppNav />

      <section className="relative min-h-[680px] overflow-hidden">
        {backdrop ? (
          <Image
            src={backdrop}
            alt={`${title} backdrop`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-panel" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-ink/70 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/10" />

        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-end gap-8 px-4 pb-12 pt-24 sm:px-6 md:grid-cols-[240px_minmax(0,1fr)] md:items-center md:pb-16 lg:px-8">
          <div className="relative mx-auto aspect-[2/3] w-48 overflow-hidden rounded-lg border border-white/10 bg-panel shadow-2xl shadow-black/50 md:mx-0 md:w-full">
            {poster ? (
              <Image
                src={poster}
                alt={`${title} poster`}
                fill
                priority
                sizes="(max-width: 768px) 192px, 240px"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm font-bold text-white/35">No Poster</div>
            )}
          </div>

          <div className="max-w-3xl space-y-6 text-center md:text-left">
            <div className="flex flex-wrap justify-center gap-2 md:justify-start">
              <Badge className="border-flame/30 bg-flame/15 text-flame">{params.type === "movie" ? "Movie" : "Series"}</Badge>
              {media.genres.slice(0, 3).map((genre) => (
                <Badge key={genre.id}>{genre.name}</Badge>
              ))}
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-black leading-[0.95] tracking-normal text-white sm:text-6xl lg:text-8xl">{title}</h1>
              <div className="flex flex-wrap justify-center gap-3 text-sm font-bold text-white/75 md:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 backdrop-blur">
                  <Calendar className="h-4 w-4 text-flame" />
                  {year}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 backdrop-blur">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  {media.vote_average.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 backdrop-blur">
                  <Clock className="h-4 w-4 text-mint" />
                  {runtime}
                </span>
              </div>
              <p className="mx-auto max-w-2xl text-base leading-7 text-white/[0.68] md:mx-0">{media.overview}</p>
            </div>
            <div className="flex justify-center md:justify-start">
              <TrackButton
                tmdbId={media.id}
                mediaType={params.type}
                title={title}
                posterPath={media.poster_path}
                initialStatus={null}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {trailer ? (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-flame text-white">
                <Play className="h-5 w-5 fill-current" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame">Trailer</p>
                <h2 className="text-2xl font-black text-white">{trailer.name}</h2>
              </div>
            </div>
            <div className="aspect-video overflow-hidden rounded-lg border border-white/10 bg-panel shadow-2xl shadow-black/40">
              <iframe
                title={`${title} trailer`}
                src={`https://www.youtube.com/embed/${trailer.key}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame">Cast</p>
            <h2 className="mt-1 text-2xl font-black text-white">Top billed</h2>
          </div>
          <CastCarousel cast={media.credits.cast} />
        </section>
      </section>
    </main>
  );
}
