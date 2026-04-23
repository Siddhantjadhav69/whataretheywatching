const TMDB_BASE_URL = process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL ?? "https://image.tmdb.org/t/p";

type TmdbFetchOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  revalidate?: number;
};

export type TmdbMediaType = "movie" | "tv";

export type TmdbGenre = {
  id: number;
  name: string;
};

export type TmdbCastMember = {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order?: number;
};

export type TmdbVideo = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
};

export type TmdbMediaDetails = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres: TmdbGenre[];
  credits: {
    cast: TmdbCastMember[];
  };
  videos: {
    results: TmdbVideo[];
  };
};

export type TmdbKeyword = {
  id: number;
  name: string;
};

export type TmdbMediaTasteDetails = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  genres: TmdbGenre[];
  keywords?: {
    keywords?: TmdbKeyword[];
    results?: TmdbKeyword[];
  };
};

export type TmdbSearchResult = {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type?: TmdbMediaType;
  genre_ids?: number[];
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

export type TmdbSearchResponse = {
  results: TmdbSearchResult[];
};

export type TmdbListResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export async function tmdbFetch<T>(path: string, options: TmdbFetchOptions = {}): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY is required to fetch media data.");
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", apiKey);

  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  let lastError: Error | null = null;
  const maxRetries = 4;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "whataretheywatching/1.0"
        },
        next: { revalidate: options.revalidate ?? 60 * 30 }
      });

      if (!response.ok) {
        throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const backoffMs = Math.min(500 * Math.pow(1.5, attempt), 3000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error("Failed to fetch from TMDB API");
}

export const tmdbEndpoints = {
  trending: (mediaType: "all" | "movie" | "tv" = "all", window: "day" | "week" = "week") =>
    `/trending/${mediaType}/${window}`,
  topRated: (mediaType: "movie" | "tv") => `/${mediaType}/top_rated`,
  search: (mediaType: "movie" | "tv" | "multi") => `/search/${mediaType}`,
  details: (mediaType: "movie" | "tv", tmdbId: number) => `/${mediaType}/${tmdbId}`,
  discover: (mediaType: "movie" | "tv") => `/discover/${mediaType}`
};

export async function getTmdbMediaDetails(type: TmdbMediaType, id: number) {
  return tmdbFetch<TmdbMediaDetails>(tmdbEndpoints.details(type, id), {
    query: {
      append_to_response: "credits,videos"
    },
    revalidate: 60 * 60
  });
}

export async function fetchTrending(type: "all" | TmdbMediaType = "all", window: "day" | "week" = "week") {
  return tmdbFetch<TmdbListResponse<TmdbSearchResult>>(tmdbEndpoints.trending(type, window), {
    revalidate: 60 * 15
  });
}

export async function fetchMediaDetails(id: number, type: TmdbMediaType) {
  return getTmdbMediaDetails(type, id);
}

export async function getTmdbMediaTasteDetails(type: TmdbMediaType, id: number) {
  return tmdbFetch<TmdbMediaTasteDetails>(tmdbEndpoints.details(type, id), {
    query: {
      append_to_response: "keywords"
    },
    revalidate: 60 * 60 * 12
  });
}

export function getTmdbKeywords(media: TmdbMediaTasteDetails) {
  return media.keywords?.keywords ?? media.keywords?.results ?? [];
}

export async function searchTmdbMedia(query: string, mediaType: TmdbMediaType) {
  return tmdbFetch<TmdbSearchResponse>(tmdbEndpoints.search(mediaType), {
    query: {
      query
    },
    revalidate: 60 * 60 * 12
  });
}

export async function discoverMedia(mediaType: TmdbMediaType, filters: {
  page?: number;
  year?: number;
  language?: string;
  sort_by?: string;
  with_genres?: string;
}) {
  return tmdbFetch<TmdbListResponse<TmdbSearchResult>>(tmdbEndpoints.discover(mediaType), {
    query: {
      page: filters.page ?? 1,
      ...(filters.year && { year: filters.year }),
      ...(filters.language && { with_original_language: filters.language }),
      ...(filters.sort_by && { sort_by: filters.sort_by }),
      ...(filters.sort_by && filters.sort_by.includes("vote_average") && { "vote_count.gte": 300 }),
      ...(filters.with_genres && { with_genres: filters.with_genres })
    },
    revalidate: 60 * 15
  });
}

export function tmdbImage(path: string | null | undefined, size = "w500") {
  if (!path) {
    return null;
  }

  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export function getBestTrailer(videos: TmdbVideo[]) {
  return (
    videos.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official) ??
    videos.find((video) => video.site === "YouTube" && video.type === "Trailer") ??
    videos.find((video) => video.site === "YouTube")
  );
}
