import { Suspense } from "react";
import { AppNav } from "@/components/app-nav";
import { DiscoverFilters } from "@/components/discover-filters";
import { MediaCard } from "@/components/media-card";
import { MediaCardTrackButton } from "@/components/media-card-track-button";
import { discoverMedia, tmdbImage } from "@/lib/tmdb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TmdbMediaType } from "@/lib/tmdb";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Discover | whataretheywatching",
  description: "Discover movies and TV series with advanced filtering"
};

function buildPaginationUrl(
  mediaType: TmdbMediaType,
  filters: Record<string, any>,
  page: number
): string {
  const params = new URLSearchParams();
  params.set("type", mediaType);
  if (filters.year) params.set("year", filters.year);
  if (filters.language) params.set("language", filters.language);
  if (filters.genres) params.set("genres", filters.genres);
  if (filters.sort_by) params.set("sort_by", filters.sort_by);
  if (page > 1) params.set("page", String(page));
  return `?${params.toString()}`;
}

type DiscoverPageProps = {
  searchParams: {
    type?: string;
    page?: string;
    year?: string;
    language?: string;
    genres?: string;
    sort_by?: string;
  };
};

function getGenreNames(genreIds: number[], mediaType: "movie" | "tv") {
  const genreMap: Record<string, Record<number, string>> = {
    movie: {
      28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
      99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
      27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
      10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
    },
    tv: {
      10759: "Action & Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
      99: "Documentary", 18: "Drama", 10751: "Family", 10762: "Kids", 9648: "Mystery",
      10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap",
      10767: "Talk", 10768: "War & Politics", 37: "Western"
    }
  };

  return genreIds
    .map(id => genreMap[mediaType]?.[id] || "")
    .filter(Boolean);
}

async function DiscoverGrid({ mediaType, filters }: { mediaType: TmdbMediaType; filters: Record<string, any> }) {
  try {
    const session = await getServerSession(authOptions);
    let data;

    try {
      data = await discoverMedia(mediaType, {
        page: filters.page ? parseInt(filters.page) : 1,
        year: filters.year ? parseInt(filters.year) : undefined,
        language: filters.language,
        sort_by: filters.sort_by,
        with_genres: filters.genres
      });
    } catch (err) {
      console.error("TMDB Discover Error:", err);
      // Fallback structural mock data array for resilient rendering
      let mockResults = [
        {
          id: 414906,
          title: "The Batman (Fallback)",
          name: "The Batman (Fallback)",
          poster_path: null,
          media_type: mediaType,
          release_date: "2022-03-01",
          first_air_date: "2022-03-01",
          vote_average: 7.7,
          genre_ids: [28, 80]
        },
        {
          id: 204625,
          title: "Fallout (Fallback)",
          name: "Fallout (Fallback)",
          poster_path: null,
          media_type: mediaType,
          release_date: "2024-04-10",
          first_air_date: "2024-04-10",
          vote_average: 8.3,
          genre_ids: [10765, 10759]
        },
        {
          id: 6415,
          title: "Community (Fallback)",
          name: "Community (Fallback)",
          poster_path: null,
          media_type: mediaType,
          release_date: "2009-09-17",
          first_air_date: "2009-09-17",
          vote_average: 7.9,
          genre_ids: [35]
        },
        {
          id: 1100782,
          title: "Smile 2 (Fallback)",
          name: "Smile 2 (Fallback)",
          poster_path: null,
          media_type: mediaType,
          release_date: "2024-10-16",
          first_air_date: "2024-10-16",
          vote_average: 6.9,
          genre_ids: [27, 9648]
        },
        {
          id: 238,
          title: "The Godfather (Fallback)",
          name: "The Godfather (Fallback)",
          poster_path: null,
          media_type: mediaType,
          release_date: "1972-03-14",
          first_air_date: "1972-03-14",
          vote_average: 8.7,
          genre_ids: [18, 80]
        }
      ];

      if (filters.sort_by === "vote_average.desc") {
        mockResults.sort((a, b) => b.vote_average - a.vote_average);
      } else if (filters.sort_by === "vote_average.asc") {
        mockResults.sort((a, b) => a.vote_average - b.vote_average);
      } else if (filters.sort_by === "release_date.desc" || filters.sort_by === "primary_release_date.desc" || filters.sort_by === "first_air_date.desc") {
        mockResults.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
      } else if (filters.sort_by === "release_date.asc" || filters.sort_by === "primary_release_date.asc" || filters.sort_by === "first_air_date.asc") {
        mockResults.sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
      } else if (filters.sort_by === "popularity.asc") {
        // Just reverse array roughly mapping to ascending
        mockResults.reverse();
      } else if (filters.sort_by === "vote_count.desc" || filters.sort_by === "revenue.desc") {
        mockResults.sort((a, b) => b.vote_average - a.vote_average);
      }

      data = {
        page: 1,
        total_pages: 1,
        total_results: mockResults.length,
        results: mockResults
      };
    }

    if (!data.results || data.results.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-96 text-center">
          <p className="text-white/50 text-lg">No results found for your filters.</p>
          <p className="text-white/30 text-sm mt-2">Try adjusting your search criteria.</p>
        </div>
      );
    }

    // Get user's tracking status for these items if logged in
    let userTracking: Record<number, string> = {};
    if (session?.user?.id) {
      const userMediaList = await prisma.mediaList.findMany({
        where: {
          userId: session.user.id,
          tmdbId: {
            in: data.results.map(item => item.id)
          }
        },
        select: {
          tmdbId: true,
          status: true
        }
      });
      
      userTracking = userMediaList.reduce((acc, item) => {
        acc[item.tmdbId] = item.status;
        return acc;
      }, {} as Record<number, string>);
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.results.map((item) => {
            const title = item.title || item.name || "Unknown";
            const placeholderFallback = `https://placehold.co/342x513/18181b/ffffff?text=${encodeURIComponent(title.split(' ').join('\n'))}`;
            const posterUrl = tmdbImage(item.poster_path, "w342") || placeholderFallback;
            const genres = getGenreNames(item.genre_ids || [], mediaType).slice(0, 2);
            const year = (item.title ? item.release_date : item.first_air_date)?.split("-")[0] || "N/A";
            const rating = item.vote_average?.toFixed(1) || "N/A";
            const kind = mediaType === "movie" ? "Movie" : "Series";
            const userStatus = userTracking[item.id] as any;

            return (
              <div key={item.id} className="group min-w-[158px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/25 transition duration-300 hover:-translate-y-1 hover:border-flame/40 hover:bg-white/[0.07] sm:min-w-0">
                <div className="relative aspect-[2/3] overflow-hidden bg-panel">
                  <Link href={`/media/${mediaType}/${item.id}`} className="block h-full w-full">
                    <img
                      src={posterUrl}
                      alt={`${title} poster`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/45 to-transparent p-2.5">
                    <MediaCardTrackButton
                      tmdbId={item.id}
                      mediaType={mediaType}
                      title={title}
                      posterPath={item.poster_path}
                      initialStatus={userStatus || null}
                    />
                  </div>
                </div>
                <Link href={`/media/${mediaType}/${item.id}`} className="block">
                  <div className="space-y-2 p-3">
                    <div>
                      <h3 className="line-clamp-1 text-sm font-bold text-white">{title}</h3>
                      <p className="mt-1 text-xs text-white/55">
                        {kind} • {year}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="line-clamp-1 text-xs text-white/50">{genres.join(", ")}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-2 py-1 text-xs font-bold text-gold">
                        <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        {rating}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Pagination Info */}
        <div className="flex flex-col gap-4 mt-8">
          <div className="text-center text-white/50 text-sm">
            Page {data.page} of {data.total_pages} • {data.total_results} total results
          </div>
          
          {/* Pagination Buttons */}
          <div className="flex justify-center gap-4">
            {data.page > 1 && (
              <Link
                href={buildPaginationUrl(mediaType, filters, data.page - 1)}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition font-semibold text-sm"
              >
                ← Previous
              </Link>
            )}
            
            {data.page < data.total_pages && (
              <Link
                href={buildPaginationUrl(mediaType, filters, data.page + 1)}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition font-semibold text-sm"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching discover results:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <p className="text-white/50 text-lg">Failed to load results.</p>
        <p className="text-white/30 text-sm mt-2">Please try again later.</p>
      </div>
    );
  }
}

export default function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const mediaType = (searchParams.type as TmdbMediaType) || "movie";
  
  const filters = {
    page: searchParams.page,
    year: searchParams.year,
    language: searchParams.language,
    genres: searchParams.genres,
    sort_by: searchParams.sort_by || "popularity.desc"
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <AppNav />

      <div className="flex flex-col lg:flex-row">
        <DiscoverFilters mediaType={mediaType} />

        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-4xl font-black tracking-tight">
                {mediaType === "movie" ? "Discover Movies" : "Discover Series"}
              </h1>
              <p className="mt-2 text-white/50">
                Explore {mediaType === "movie" ? "movies" : "TV shows"} with advanced filtering
              </p>
            </div>

            <Suspense fallback={<DiscoverSkeleton />}>
              <DiscoverGrid mediaType={mediaType} filters={filters} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}

function DiscoverSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse border border-white/10"
        />
      ))}
    </div>
  );
}
