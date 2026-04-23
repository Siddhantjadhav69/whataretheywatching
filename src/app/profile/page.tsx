import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProfileTabs } from "@/components/profile-tabs";
import type { ProfileMediaItem, ProfileMediaStatus } from "@/components/profile-media-card";
import { ProfileHeaderClient } from "./profile-header-client";

export const dynamic = 'force-dynamic';

const statuses: ProfileMediaStatus[] = ["WATCHING", "COMPLETED", "PENDING", "PLAN_TO_WATCH", "DROPPED"];

export default async function ProfilePage({ searchParams }: { searchParams?: { tab?: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex h-screen items-center justify-center">
          <div className="text-zinc-400">Please sign in to view your profile</div>
        </div>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      mediaLists: {
        orderBy: { id: "desc" }
      },
      followers: {
        include: { follower: true }
      },
      following: {
        include: { following: true }
      }
    }
  });

  if (!user) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex h-screen items-center justify-center">
          <div className="text-zinc-400">User not found</div>
        </div>
      </main>
    );
  }

  const mediaItems: ProfileMediaItem[] = user.mediaLists.map((item) => ({
    id: item.id,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType === "tv" ? "tv" : "movie",
    title: item.title,
    posterPath: item.posterPath,
    status: item.status
  }));

  const groupedByStatus = statuses.reduce<Record<ProfileMediaStatus, ProfileMediaItem[]>>((groups, status) => {
    groups[status] = mediaItems.filter((item) => item.status === status);
    return groups;
  }, {} as Record<ProfileMediaStatus, ProfileMediaItem[]>);

  const totalTracked = mediaItems.length;
  const totalCompleted = groupedByStatus.COMPLETED.length;
  const totalWatching = groupedByStatus.WATCHING.length;
  const totalPlanned = groupedByStatus.PLAN_TO_WATCH.length;

  const mappedFollowers = user.followers.map(c => ({
    id: c.follower.id,
    username: c.follower.username,
    avatarUrl: c.follower.avatarUrl,
    email: c.follower.email
  }));

  const mappedFollowing = user.following.map(c => ({
    id: c.following.id,
    username: c.following.username,
    avatarUrl: c.following.avatarUrl,
    email: c.following.email
  }));

  const stats = [
    { label: "Following", value: mappedFollowing.length, clickable: true },
    { label: "Followers", value: mappedFollowers.length, clickable: true },
    { label: "Total Tracked", value: totalTracked },
    { label: "Completed", value: totalCompleted },
    { label: "Watching", value: totalWatching },
    { label: "Plan to Watch", value: totalPlanned }
  ];

  return (
    <main className="min-h-screen bg-zinc-950 pb-24 text-white lg:pb-0">
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-transparent px-4 py-2 text-sm font-bold text-zinc-400 transition hover:bg-zinc-800/50 hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
        <ProfileHeaderClient
          username={user.username}
          email={user.email}
          initialAvatarUrl={user.avatarUrl}
          initialBio={user.bio}
          stats={stats}
          mappedFollowers={mappedFollowers}
          mappedFollowing={mappedFollowing}
        />
        <ProfileTabs items={mediaItems} initialTab={searchParams?.tab} />
      </div>
    </main>
  );
}