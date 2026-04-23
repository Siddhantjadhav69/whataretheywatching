import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { FollowButton } from "@/components/follow-button";
import { ProfileTabs } from "@/components/profile-tabs";
import type { ProfileMediaItem, ProfileMediaStatus } from "@/components/profile-media-card";
import { prisma } from "@/lib/prisma";
import { isDatabaseConnectionError } from "@/lib/database-errors";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const statuses: ProfileMediaStatus[] = ["WATCHING", "COMPLETED", "PENDING", "PLAN_TO_WATCH", "DROPPED"];

type PublicProfilePageProps = {
  params: {
    username: string;
  };
};

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  if (session?.user?.username && session.user.username === params.username) {
    redirect("/profile");
  }

  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { username: params.username },
      include: {
        mediaLists: {
          orderBy: {
            id: "desc"
          }
        },

        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      throw new Error("Database is not reachable. Please try again later.");
    }
    throw error;
  }

  if (!user) {
    notFound();
  }

  const mediaItems: ProfileMediaItem[] = user.mediaLists.map((item) => ({
    id: item.id,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType === "tv" ? "tv" : "movie",
    title: item.title,
    posterPath: item.posterPath,
    status: item.status,
    isFavorite: (item as any).isFavorite ?? false,
    rating: (item as any).rating ?? null
  }));

  const groupedByStatus = statuses.reduce<Record<ProfileMediaStatus, ProfileMediaItem[]>>((groups, status) => {
    groups[status] = mediaItems.filter((item) => item.status === status);
    return groups;
  }, {} as Record<ProfileMediaStatus, ProfileMediaItem[]>);

  const totalTracked = mediaItems.length;
  const totalCompleted = groupedByStatus.COMPLETED.length;
  const totalWatching = groupedByStatus.WATCHING.length;
  const totalPlanned = groupedByStatus.PLAN_TO_WATCH.length;
  const followerCount = user._count.followers;
  const followingCount = user._count.following;
  let isFollowing = false;
  if (currentUserId && currentUserId !== user.id) {
    const connection = await prisma.connection.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id
        }
      }
    });
    isFollowing = !!connection;
  }

  const stats = [
    { label: "Total Tracked", value: totalTracked },
    { label: "Completed", value: totalCompleted },
    { label: "Watching", value: totalWatching },
    { label: "Plan to Watch", value: totalPlanned }
  ];

  const socialStats = [
    { label: "Followers", value: followerCount },
    { label: "Following", value: followingCount }
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <AppNav />

      <section className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/25">
          <div className="border-b border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-800/50 to-transparent p-6 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-zinc-800 bg-zinc-800 text-2xl font-black text-zinc-100 shadow-lg">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    user.username.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Public Profile</p>
                  <h1 className="mt-2 text-3xl font-black tracking-normal text-zinc-100 sm:text-5xl">
                    @{user.username}
                  </h1>
                  {user.bio && (
                    <p className="mt-2 text-sm font-semibold text-zinc-400 max-w-2xl">{user.bio}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* Social Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {socialStats.map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                      <p className="text-2xl font-black text-zinc-100">{stat.value}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Follow Button */}
                {currentUserId && currentUserId !== user.id && (
                  <FollowButton
                    targetUserId={user.id}
                    initialIsFollowing={isFollowing}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                  <p className="text-2xl font-black text-zinc-100">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Media Lists */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 p-6">
            <h2 className="text-xl font-black text-zinc-100">Media Library</h2>
            <p className="mt-1 text-sm text-zinc-400">@{user.username}&apos;s tracked media</p>
          </div>
          
          <ProfileTabs items={mediaItems} initialTab="WATCHING" isReadOnly={true} hideAiPicks={true} hideActivity={true} />
        </div>
      </section>
    </main>
  );
}