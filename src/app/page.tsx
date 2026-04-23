import Image from "next/image";
import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { MediaCard, type MediaCardItem } from "@/components/media-card";
import { TrackButton } from "@/components/track-button";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { fetchTrending, tmdbImage } from "@/lib/tmdb";

const featured = {
  title: "Dune: Part Two",
  backdrop: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
  poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
  meta: "Movie / 2024 / Sci-Fi Adventure / 8.2",
  synopsis:
    "Paul Atreides unites with Chani and the Fremen while seeking revenge against those who destroyed his family."
};

const fallbackTrending = [
  { id: 9243, title: "Shogun", media_type: "tv", first_air_date: "2024", vote_average: 8.7, poster_path: "/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg" },
  { id: 414906, title: "The Batman", media_type: "movie", release_date: "2022", vote_average: 7.7, poster_path: "/74xTEgt7R36Fpooo50r9T25onhq.jpg" },
  { id: 204625, title: "Fallout", media_type: "tv", first_air_date: "2024", vote_average: 8.3, poster_path: "/AnsSKR9LuK0T9bAOcPVA3PUvyWj.jpg" },
  { id: 875865, title: "Godzilla Minus One", media_type: "movie", release_date: "2023", vote_average: 7.6, poster_path: "/hkxxMIGaiCTmrEArK7J56JTKUlB.jpg" },
  { id: 209085, title: "The Bear", media_type: "tv", first_air_date: "2022", vote_average: 8.2, poster_path: "/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg" }
];

const stats = [
  { label: "Completed", value: "128" },
  { label: "Watching", value: "14" },
  { label: "Plan", value: "62" }
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  let userStats = null;
  let heroStatus: any = null;
  let initials = "US";
  let usernameDisplay = "User";
  let listHealthMetrics: Array<{ label: string; value: string }> = [];

  let lists: any[] = [];

  if (session?.user?.id) {
    usernameDisplay = session.user.username || "User";
    initials = usernameDisplay.slice(0, 2).toUpperCase();

    lists = await prisma.mediaList.findMany({
      where: { userId: session.user.id },
      select: { tmdbId: true, status: true }
    });

    const completed = lists.filter(m => m.status === "COMPLETED").length;
    const watching = lists.filter(m => m.status === "WATCHING").length;
    const planToWatch = lists.filter(m => m.status === "PLAN_TO_WATCH").length;
    const dropped = lists.filter(m => m.status === "DROPPED").length;
    const completionRate = lists.length > 0 ? Math.round((completed / lists.length) * 100) : 0;
    const activeTracking = lists.length > 0 ? Math.round((watching / lists.length) * 100) : 0;
    const backlogLoad = lists.length > 0 ? Math.round((planToWatch / lists.length) * 100) : 0;
    const dropRate = lists.length > 0 ? Math.round((dropped / lists.length) * 100) : 0;

    userStats = [
      { label: "Completed", value: completed.toString() },
      { label: "Watching", value: watching.toString() },
      { label: "Plan", value: planToWatch.toString() }
    ];

    listHealthMetrics = [
      { label: "Completion Rate", value: `${completionRate}%` },
      { label: "Active Tracking", value: `${activeTracking}%` },
      { label: "Backlog Load", value: `${backlogLoad}%` },
      { label: "Drop Rate", value: `${dropRate}%` }
    ];

    const heroMedia = lists.find(m => m.tmdbId === 693134);
    if (heroMedia) {
      heroStatus = heroMedia.status;
    }
  }

  let trendingResults: any[] = [];
  try {
    const trendingResp = await fetchTrending("all", "week");
    trendingResults = trendingResp.results.slice(0, 5);
  } catch (error) {
    console.error("Recoverable Error: TMDB Fetch failed (ECONNRESET/Network). Falling back to mock data.", error);
    trendingResults = fallbackTrending;
  }

  const media: MediaCardItem[] = trendingResults.map(item => {
    let itemStatus = null;
    if (lists.length > 0) {
      const found = lists.find(m => m.tmdbId === item.id);
      if (found) itemStatus = found.status;
    }

    return {
      id: String(item.id),
      title: item.title || item.name || "Unknown",
      kind: item.media_type === "tv" ? "Series" : "Movie",
      year: (item.release_date || item.first_air_date || "").substring(0, 4),
      rating: item.vote_average ? item.vote_average.toFixed(1) : "NR",
      poster: tmdbImage(item.poster_path) || "", 
      status: itemStatus as any,
      genres: []
    };
  });

  return (
    <main className="min-h-screen pb-24 lg:pb-0">
      <AppNav />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-8">
        <div className="space-y-6">
          <section className="relative min-h-[520px] overflow-hidden rounded-lg border border-white/10 bg-panel shadow-2xl shadow-black/40 sm:min-h-[560px] lg:min-h-[620px]">
            <Image
              src={featured.backdrop}
              alt={`${featured.title} backdrop`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 860px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/65 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/45 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_160px] lg:p-8">
              <div className="max-w-2xl space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                  <TrendingUp className="h-4 w-4 text-flame" />
                  Trending now
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-[11ch] text-5xl font-black leading-[0.92] tracking-normal text-white sm:text-7xl lg:text-8xl">
                    {featured.title}
                  </h1>
                  <p className="text-sm font-semibold text-white/70 sm:text-base">{featured.meta}</p>
                  <p className="max-w-xl text-sm leading-6 text-white/65 sm:text-base">{featured.synopsis}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <TrackButton 
                    tmdbId={693134}
                    mediaType="movie"
                    title={featured.title}
                    posterPath={featured.poster}
                    initialStatus={heroStatus}
                  />
                </div>
              </div>

              <div className="hidden self-end overflow-hidden rounded-lg border border-white/10 bg-white/10 p-2 backdrop-blur md:block">
                <div className="relative aspect-[2/3] overflow-hidden rounded-md">
                  <Image
                    src={featured.poster}
                    alt={`${featured.title} poster`}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-flame">Discovery</p>
                <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">Trending in your orbit</h2>
              </div>
              <a href="/discover" className="hidden items-center gap-2 text-sm font-bold text-white/65 transition hover:text-white sm:inline-flex">
                View all
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="hide-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 xl:grid-cols-5">
              {media.map((item, index) => (
                <div key={item.id} className="snap-start">
                  <MediaCard item={item} priority={index < 2} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {session && userStats && (
          <aside className="space-y-6">
            <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white/50">@{usernameDisplay}</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Profile Stats</h2>
                </div>
                {(session?.user as any)?.avatarUrl ? (
                  <div className="h-12 w-12 overflow-hidden rounded-full border border-white/10">
                    <img src={(session?.user as any).avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-ink">
                    <span className="text-sm font-black">{initials}</span>
                  </div>
                )}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {userStats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-white/10 bg-black/25 p-3">
                    <p className="text-xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-[11px] font-semibold text-white/45">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-flame/25 bg-flame/10 p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-flame text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame">AI Queue</p>
                  <h2 className="text-xl font-black text-white">Recommendation Engine</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/65">
                Based on your recent sci-fi epics and prestige dramas, your next queue is ready for sharper, mood-aware picks.
              </p>
              <button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-black text-ink transition hover:bg-white/90">
                Generate Picks
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
              <h2 className="text-xl font-black text-white">List Health</h2>
              <div className="mt-5 space-y-4">
                {listHealthMetrics.length ? listHealthMetrics.map(({ label, value }) => (
                  <div key={label}>
                    <div className="mb-2 flex justify-between text-sm font-bold">
                      <span className="text-white/70">{label}</span>
                      <span className="text-white">{value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-flame" style={{ width: value }} />
                    </div>
                  </div>
                )) : (
                  <div className="rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-white/60">
                    Add titles to your list to see health metrics.
                  </div>
                )}
              </div>
            </section>
          </aside>
        )}
      </section>
    </main>
  );
}
