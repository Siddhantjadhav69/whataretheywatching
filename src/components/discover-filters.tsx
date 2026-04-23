"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, TrendingUp, Trophy, Star } from "lucide-react";
import { useState, useCallback } from "react";

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);
const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "it", name: "Italian" },
  { code: "zh", name: "Chinese" }
];

const GENRES = {
  movie: [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 10770, name: "TV Movie" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" }
  ],
  tv: [
    { id: 10759, name: "Action & Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 10762, name: "Kids" },
    { id: 9648, name: "Mystery" },
    { id: 10763, name: "News" },
    { id: 10764, name: "Reality" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 10766, name: "Soap" },
    { id: 10767, name: "Talk" },
    { id: 10768, name: "War & Politics" },
    { id: 37, name: "Western" }
  ]
};

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularity (High to Low)" },
  { value: "popularity.asc", label: "Popularity (Low to High)" },
  { value: "vote_average.desc", label: "Rating (High to Low)" },
  { value: "vote_average.asc", label: "Rating (Low to High)" },
  { value: "release_date.desc", label: "Newest" },
  { value: "release_date.asc", label: "Oldest" }
];

const QUICK_LINKS: Array<{ label: string; params: Record<string, string> }> = [
  { label: "Trending Today", params: { sort_by: "popularity.desc" } },
  { label: "Top Rated", params: { sort_by: "vote_average.desc" } },
  { label: "Highest Rated", params: { sort_by: "vote_average.desc" } }
];

type DiscoverFiltersProps = {
  mediaType: "movie" | "tv";
};

export function DiscoverFilters({ mediaType }: DiscoverFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const currentYear = searchParams.get("year");
  const currentLanguage = searchParams.get("language");
  const currentGenres = searchParams.get("genres");
  const currentSort = searchParams.get("sort_by") || "popularity.desc";
  const genres = GENRES[mediaType];

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams);
      
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      
      params.set("type", mediaType);
      router.push(`?${params.toString()}`);
    },
    [searchParams, mediaType, router]
  );

  const toggleGenre = useCallback(
    (genreId: number) => {
      const current = currentGenres ? currentGenres.split(",").map(Number) : [];
      const updated = current.includes(genreId) 
        ? current.filter(id => id !== genreId)
        : [...current, genreId];
      
      updateFilter("genres", updated.length > 0 ? updated.join(",") : null);
    },
    [currentGenres, updateFilter]
  );

  const selectedGenres = currentGenres ? currentGenres.split(",").map(Number) : [];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-20 right-4 z-40 p-3 rounded-full bg-flame text-white shadow-lg hover:bg-[#ff674d] transition"
        aria-label="Toggle filters"
      >
        <Filter className="h-5 w-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-0 z-30 lg:z-0 lg:w-64 bg-zinc-950 border-r border-white/10 p-6 space-y-6 overflow-y-auto transition-all ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Close Button (Mobile) */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-white/50 hover:text-white"
        >
          ✕
        </button>

        <div>
          <h2 className="text-lg font-black text-white mb-4">Discover</h2>
          
          {/* Media Type Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("type", "movie");
                params.delete("genres");
                router.push(`?${params.toString()}`);
                setIsOpen(false);
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                mediaType === "movie"
                  ? "bg-flame text-white"
                  : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("type", "tv");
                params.delete("genres");
                router.push(`?${params.toString()}`);
                setIsOpen(false);
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                mediaType === "tv"
                  ? "bg-flame text-white"
                  : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              TV Shows
            </button>
          </div>

          {/* Quick Links */}
          <div className="space-y-2 mb-6">
            {QUICK_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("type", mediaType);
                  Object.entries(link.params).forEach(([key, value]) => {
                    params.set(key, String(value));
                  });
                  router.push(`?${params.toString()}`);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                {link.label === "Trending Today" && <TrendingUp className="h-4 w-4" />}
                {link.label === "Top Rated" && <Trophy className="h-4 w-4" />}
                {link.label === "Highest Rated" && <Star className="h-4 w-4" />}
                {link.label}
              </button>
            ))}
          </div>

          <div className="h-px bg-white/10" />
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
            Sort By
          </label>
          <select
            value={currentSort}
            onChange={(e) => updateFilter("sort_by", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-white hover:border-white/20 focus:border-flame/50 focus:outline-none transition"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-zinc-900 text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
            Year
          </label>
          <select
            value={currentYear || ""}
            onChange={(e) => updateFilter("year", e.target.value || null)}
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-white hover:border-white/20 focus:border-flame/50 focus:outline-none transition"
          >
            <option value="" className="bg-zinc-900 text-white">All Years</option>
            {YEARS.map((year) => (
              <option key={year} value={year} className="bg-zinc-900 text-white">
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Language Filter */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
            Language
          </label>
          <select
            value={currentLanguage || ""}
            onChange={(e) => updateFilter("language", e.target.value || null)}
            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-white hover:border-white/20 focus:border-flame/50 focus:outline-none transition"
          >
            <option value="" className="bg-zinc-900 text-white">All Languages</option>
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-zinc-900 text-white">
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Genre Filter */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
            Genres
          </label>
          <div className="space-y-2">
            {genres.map((genre) => (
              <label
                key={genre.id}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre.id)}
                  onChange={() => toggleGenre(genre.id)}
                  className="w-4 h-4 rounded border border-white/20 bg-white/5 checked:bg-flame checked:border-flame cursor-pointer accent-flame"
                />
                <span className="text-sm text-white/70 group-hover:text-white transition">
                  {genre.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => {
            router.push(`?type=${mediaType}`);
            setIsOpen(false);
          }}
          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          Reset Filters
        </button>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-20 lg:hidden bg-black/50"
        />
      )}
    </>
  );
}
