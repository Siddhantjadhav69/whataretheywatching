"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Star, Clock, Calendar, Film, ArrowLeft, Loader2 } from "lucide-react";
import { MediaDetailActions } from "@/components/media-detail-actions";
import { ReviewSection } from "@/components/review-section";

type TmdbData = {
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  vote_average?: number;
  genres?: { id: number; name: string }[];
  credits?: { cast: { id: number; name: string; character: string; profile_path: string | null }[] };
};

type ReviewData = {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  user: { id: string; username: string; avatarUrl: string | null };
};

export default function MediaDetailPage({ params }: { params: { type: string; id: string } }) {
  const { type, id } = params;
  const [data, setData] = useState<TmdbData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [tracking, setTracking] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const tmdbId = parseInt(id, 10);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch TMDB data via our proxy
        const tmdbRes = await fetch(`/api/tmdb/${type}/${id}`);
        if (tmdbRes.ok) {
          setData(await tmdbRes.json());
        } else {
          setError(true);
        }

        // Fetch reviews
        const reviewRes = await fetch(`/api/reviews?tmdbId=${id}&friendsOnly=true`);
        if (reviewRes.ok) {
          const revData = await reviewRes.json();
          setReviews(revData.reviews || []);
        }

        // Fetch session
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          setCurrentUserId(session?.user?.id);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type, id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-ink text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-flame mx-auto" />
          <p className="text-zinc-400 text-sm">Loading details...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-ink text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-6xl">🎬</div>
          <h1 className="text-2xl font-black">Couldn&apos;t load this title</h1>
          <p className="text-zinc-400">The movie database is temporarily unreachable.</p>
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={() => window.location.reload()} className="rounded-lg bg-flame px-6 py-2.5 text-sm font-bold text-white hover:bg-[#ff674d] transition">
              Try Again
            </button>
            <Link href="/discover" className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition">
              Back to Discover
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const title = data.title || data.name || "Unknown";
  const releaseDate = data.release_date || data.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const runtime = data.runtime || (data.episode_run_time?.[0]) || null;
  const genres = data.genres?.map(g => g.name) || [];
  const cast = data.credits?.cast?.slice(0, 8) || [];
  const backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null;
  const poster = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null;
  const voteAverage = data.vote_average ? data.vote_average.toFixed(1) : null;

  return (
    <main className="min-h-screen bg-ink text-white">
      {/* Hero Backdrop */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        {backdrop ? (
          <Image src={backdrop} alt="" fill className="object-cover" priority />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-zinc-800 to-ink" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 to-transparent" />

        {/* Back button */}
        <Link href="/discover" className="absolute top-6 left-6 z-20 flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white hover:bg-black/70 transition">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      {/* Content */}
      <div className="relative -mt-48 mx-auto max-w-6xl px-4 pb-20">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="shrink-0 w-[220px] self-start">
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl border-2 border-zinc-800 shadow-2xl">
              {poster ? (
                <Image src={poster} alt={title} fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-zinc-900 grid place-items-center text-zinc-600 font-bold text-sm text-center p-4">{title}</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="inline-flex rounded-full bg-flame/20 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-flame">
                  {type === "tv" ? "TV Series" : "Movie"}
                </span>
                {voteAverage && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400" /> {voteAverage}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                {year && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {year}</span>}
                {runtime && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {runtime} min</span>}
                {genres.length > 0 && <span className="flex items-center gap-1"><Film className="h-3.5 w-3.5" /> {genres.join(", ")}</span>}
              </div>
            </div>

            {/* Action Buttons */}
            <MediaDetailActions
              tmdbId={tmdbId}
              mediaType={type}
              title={title}
              posterPath={data.poster_path || null}
              initialTracking={tracking}
            />

            {/* Overview */}
            {data.overview && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-2">Overview</h2>
                <p className="text-sm leading-7 text-zinc-300">{data.overview}</p>
              </div>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-3">Top Cast</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                  {cast.map((person) => (
                    <div key={person.id} className="shrink-0 text-center w-16">
                      <div className="relative h-16 w-16 rounded-full overflow-hidden bg-zinc-800 mx-auto">
                        {person.profile_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                            alt={person.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full grid place-items-center text-xs text-zinc-500 font-bold">
                            {person.name.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 text-[11px] font-bold text-zinc-300 truncate">{person.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <ReviewSection
            tmdbId={tmdbId}
            mediaType={type}
            title={title}
            reviews={reviews}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </main>
  );
}
