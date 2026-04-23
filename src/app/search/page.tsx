import { searchTmdbMedia, tmdbImage } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MediaCard, MediaCardItem } from "@/components/media-card";
import { UserSearchInput } from "@/components/user-search-input";
import { UserSearchCard } from "@/components/user-search-card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; tab?: string };
}) {
  const q = searchParams.q || "";
  const tab = searchParams.tab || "media";

  let mediaResults: MediaCardItem[] = [];
  let userResults: Array<{ id: string; username: string; avatarUrl: string | null; bio: string | null }> = [];
  
  const session = await getServerSession(authOptions);

  if (q) {
    if (tab === "media") {
      let userListMap: Record<number, string> = {};
      if (session?.user?.id) {
        const lists = await prisma.mediaList.findMany({
          where: { userId: session.user.id },
          select: { tmdbId: true, status: true }
        });
        lists.forEach(item => {
          userListMap[item.tmdbId] = item.status;
        });
      }

      try {
        const res = await searchTmdbMedia(q, "multi" as any);
        mediaResults = res.results
          .filter(r => r.media_type === "movie" || r.media_type === "tv")
          .map(item => ({
            id: String(item.id),
            title: item.title || item.name || "Unknown",
            kind: item.media_type === "movie" ? "Movie" : "Series",
            year: (item.release_date || item.first_air_date || "").substring(0, 4),
            rating: item.vote_average ? item.vote_average.toFixed(1) : "NR",
            poster: tmdbImage(item.poster_path) || "", 
            status: (userListMap[item.id] as any) || null,
            genres: [],
          }));
      } catch (err) {
        console.error("TMDB Search Error:", err);
          
          mediaResults = [
            {
              id: "414906",
              title: "The Batman (Fallback)",
              kind: "Movie",
              year: "2022",
              rating: "7.7",
              poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
              status: (userListMap[414906] as any) || null,
              genres: []
            },
            {
              id: "204625",
              title: "Fallout (Fallback)",
              kind: "Series",
              year: "2024",
              rating: "8.3",
              poster: "https://image.tmdb.org/t/p/w500/AnsSKR9LuK0T9bAOcPVA3PUvyWj.jpg",
              status: (userListMap[204625] as any) || null,
              genres: []
            }
          ];
        }
      } else {
      const whereClause: any = q 
        ? { username: { contains: q, mode: "insensitive" } }
        : {};
        
      if (session?.user?.id) {
        whereClause.id = { not: session.user.id };
      }

      userResults = await prisma.user.findMany({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
        }
      });
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 pb-24 text-white lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-transparent px-4 py-2 text-sm font-bold text-zinc-400 transition hover:bg-zinc-800/50 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
        <h1 className="mb-8 text-3xl font-black text-zinc-100">Search Results for &quot;{q}&quot;</h1>
        
        <div className="mb-8 flex gap-4 border-b border-zinc-800">
          <Link
            href={`/search?q=${encodeURIComponent(q)}&tab=media`}
            className={`pb-4 px-4 text-sm font-bold transition ${tab === "media" ? "border-b-2 border-flame text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Media
          </Link>
          <Link
            href={`/search?q=${encodeURIComponent(q)}&tab=users`}
            className={`pb-4 px-4 text-sm font-bold transition ${tab === "users" ? "border-b-2 border-flame text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Users
          </Link>
        </div>

        {tab === "media" && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mb-8">
            {mediaResults.length > 0 ? (
              mediaResults.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))
            ) : (
              <p className="col-span-full py-12 text-center text-zinc-500">
                {q ? "No media found." : "Enter a search term to find movies and shows."}
              </p>
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-6 mb-8">
            <UserSearchInput initialQuery={q} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {userResults.length > 0 ? (
                userResults.map((user) => (
                  <UserSearchCard key={user.id} user={user} />
                ))
              ) : (
                <p className="col-span-full py-12 text-center text-zinc-500">
                  {q ? "No users found." : "Enter a search term above to find users."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
