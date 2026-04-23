"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProfileMediaCard, type ProfileMediaItem, type ProfileMediaStatus } from "@/components/profile-media-card";
import { ReadOnlyProfileMediaCard } from "@/components/read-only-profile-media-card";
import { cn } from "@/lib/utils";

type ProfileTab = "all" | "WATCHING" | "COMPLETED" | "PLAN_TO_WATCH" | "DROPPED" | "picks" | "activity";

type AiPick = {
  title: string;
  mediaType: "movie" | "tv";
  matchReason: string;
  tmdbSearchQuery: string;
  posterPath?: string | null;
};

type ProfileTabsProps = {
  items: ProfileMediaItem[];
  initialTab?: string;
  isReadOnly?: boolean;
  hideAiPicks?: boolean;
};

const tabs: Array<{ value: ProfileTab; label: string }> = [
  { value: "all", label: "All" },
  { value: "WATCHING", label: "Watching" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { value: "DROPPED", label: "Dropped" },
  { value: "picks", label: "AI Picks" },
  { value: "activity", label: "Friend Activity" }
];

function getAvailableTabs(hideAiPicks: boolean) {
  return tabs.filter(tab => !hideAiPicks || tab.value !== "picks");
}

function normalizeTab(tab?: string): ProfileTab {
  if (tab === "lists") {
    return "all";
  }

  if (tab === "picks") {
    return "picks";
  }

  if (tab === "activity") {
    return "activity";
  }

  return tabs.some((item) => item.value === tab) ? (tab as ProfileTab) : "all";
}

function aiPosterUrl(path?: string | null) {
  return path ? `https://image.tmdb.org/t/p/w342${path}` : null;
}

export function ProfileTabs({ items, initialTab, isReadOnly = false, hideAiPicks = false }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(normalizeTab(initialTab));
  const [mediaItems, setMediaItems] = useState(items);
  const [aiPicks, setAiPicks] = useState<AiPick[]>([]);
  const [isLoadingPicks, setIsLoadingPicks] = useState(false);
  const [picksError, setPicksError] = useState<string | null>(null);

  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  const visibleItems = useMemo(() => {
    if (activeTab === "all") {
      return mediaItems;
    }

    if (activeTab === "picks" || activeTab === "activity") {
      return [];
    }

    return mediaItems.filter((item) => item.status === activeTab);
  }, [activeTab, mediaItems]);

  async function loadAiPicks() {
    setIsLoadingPicks(true);
    setPicksError(null);

    try {
      const response = await fetch("/api/recommendations", {
        headers: {
          Accept: "application/json"
        }
      });
      const payload = (await response.json()) as { recommendations?: AiPick[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to generate AI picks.");
      }

      setAiPicks(payload.recommendations ?? []);
    } catch (error) {
      setPicksError(error instanceof Error ? error.message : "Unable to generate AI picks.");
    } finally {
      setIsLoadingPicks(false);
    }
  }

  async function loadActivity() {
    setIsLoadingActivity(true);
    try {
      const response = await fetch("/api/notifications?limit=30");
      const data = await response.json();
      setActivityFeed(data.notifications || []);
    } catch {
      // Ignore
    } finally {
      setIsLoadingActivity(false);
    }
  }

  useEffect(() => {
    if (activeTab === "picks" && !aiPicks.length && !isLoadingPicks) {
      void loadAiPicks();
    }
    if (activeTab === "activity" && !activityFeed.length && !isLoadingActivity) {
      void loadActivity();
    }
  }, [activeTab, aiPicks.length, isLoadingPicks, activityFeed.length, isLoadingActivity]);

  function updateUrl(nextTab: ProfileTab) {
    const query = nextTab === "picks" ? "?tab=picks" : nextTab === "all" ? "?tab=lists" : `?tab=${nextTab}`;
    window.history.replaceState(null, "", `/profile${query}`);
  }

  function handleTabChange(nextTab: ProfileTab) {
    setActiveTab(nextTab);
    updateUrl(nextTab);
  }

  function handleStatusChange(id: string, status: ProfileMediaStatus) {
    setMediaItems((currentItems) => currentItems.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function handleRemove(id: string) {
    setMediaItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  function handleRestore(restoredItem: ProfileMediaItem) {
    setMediaItems((currentItems) => {
      const exists = currentItems.some((item) => item.id === restoredItem.id);

      if (exists) {
        return currentItems.map((item) => (item.id === restoredItem.id ? restoredItem : item));
      }

      return [restoredItem, ...currentItems];
    });
  }

  return (
    <section className="space-y-6">
      <div className="hide-scrollbar flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.045] p-1">
        {getAvailableTabs(hideAiPicks).map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                "relative h-10 shrink-0 rounded-md px-4 text-sm font-black transition",
                isActive ? "text-ink" : "text-white/55 hover:bg-white/10 hover:text-white"
              )}
            >
              {isActive ? <motion.span layoutId="profile-tab" className="absolute inset-0 rounded-md bg-white" /> : null}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "picks" ? (
            <section className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame">AI Curator</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Personalized Picks</h2>
                </div>
                <button
                  onClick={loadAiPicks}
                  disabled={isLoadingPicks}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-flame/30 bg-flame/15 px-4 text-sm font-black text-flame transition hover:bg-flame/20 disabled:cursor-wait disabled:opacity-70"
                >
                  {isLoadingPicks ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate
                </button>
              </div>

              {picksError ? (
                <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-4 text-sm font-semibold text-red-200">
                  {picksError}
                </div>
              ) : null}

              {isLoadingPicks ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="aspect-[2/3] animate-pulse rounded-lg border border-white/10 bg-white/[0.045]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {aiPicks.map((pick) => {
                    const poster = aiPosterUrl(pick.posterPath);

                    return (
                      <article
                        key={`${pick.mediaType}-${pick.title}`}
                        className="overflow-hidden rounded-lg border border-flame/30 bg-flame/[0.08] shadow-2xl shadow-flame/10"
                      >
                        <div className="relative aspect-[2/3] bg-panel">
                          {poster ? (
                            <Image src={poster} alt={`${pick.title} poster`} fill sizes="220px" className="object-cover" />
                          ) : (
                            <div className="grid h-full place-items-center p-4 text-center text-sm font-black text-white/40">
                              {pick.title}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        </div>
                        <div className="space-y-3 p-3">
                          <span className="inline-flex rounded-full bg-flame/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-flame">
                            {pick.mediaType}
                          </span>
                          <h3 className="line-clamp-2 text-sm font-black text-white">{pick.title}</h3>
                          <p className="line-clamp-4 text-xs leading-5 text-white/60">{pick.matchReason}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : activeTab === "activity" ? (
            <section className="space-y-4">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-flame">Timeline</p>
                <h2 className="mt-1 text-2xl font-black text-white">Friend Activity</h2>
              </div>
              
              {isLoadingActivity ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-white/20" />
                </div>
              ) : activityFeed.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.045] p-8 text-center">
                  <p className="text-lg font-black text-white">No activity yet.</p>
                  <p className="mt-2 text-sm text-white/50">Follow more users to see what they are tracking.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityFeed.map((notif: any) => (
                    <div key={notif.id} className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-black/50">
                        {notif.user.avatarUrl ? (
                          <img src={notif.user.avatarUrl} alt={notif.user.username} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-sm font-bold text-white/50">
                            {notif.user.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white/80">
                          <span className="font-bold text-white">@{notif.user.username}</span> added{" "}
                          <span className="font-semibold text-zinc-300">{notif.title}</span> to their list.
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-white/50">
                          <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                            {notif.mediaType}
                          </span>
                          <span>•</span>
                          <span>Status: {notif.status.replace(/_/g, " ")}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : visibleItems.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              {visibleItems.map((item) => (
                isReadOnly ? (
                  <ReadOnlyProfileMediaCard key={item.id} item={item} />
                ) : (
                  <ProfileMediaCard
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    onRemove={handleRemove}
                    onRestore={handleRestore}
                  />
                )
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-8 text-center">
              <p className="text-lg font-black text-white">No titles here yet.</p>
              <p className="mt-2 text-sm text-white/50">Track something from a media details page and it will show up here.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
