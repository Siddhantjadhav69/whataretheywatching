import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const take = limit > 0 && limit <= 50 ? limit : 5;

    const currentUserId = session.user.id;

    // Track updates from users that the current user follows.
    const recentTrackActivity = await prisma.mediaList.findMany({
      where: {
        user: {
          followers: {
            some: {
              followerId: currentUserId
            }
          }
        }
      },
      orderBy: {
        // MediaList currently has no createdAt field, so id is used as a proxy ordering.
        id: "desc"
      },
      take,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });

    // New follower events (people who followed the current user).
    const recentFollowerEvents = await prisma.connection.findMany({
      where: {
        followingId: currentUserId
      },
      orderBy: {
        createdAt: "desc"
      },
      take,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });

    const followBackSet = new Set(
      (
        await prisma.connection.findMany({
          where: {
            followerId: currentUserId,
            followingId: {
              in: recentFollowerEvents.map((event) => event.follower.id)
            }
          },
          select: {
            followingId: true
          }
        })
      ).map((connection) => connection.followingId)
    );

    const notifications = [
      ...recentFollowerEvents.map((event) => ({
        id: `follow-${event.id}`,
        type: "NEW_FOLLOWER" as const,
        createdAt: event.createdAt,
        user: {
          id: event.follower.id,
          username: event.follower.username,
          avatarUrl: event.follower.avatarUrl
        },
        isFollowingBack: followBackSet.has(event.follower.id)
      })),
      ...recentTrackActivity.map((item) => ({
        id: `track-${item.id}`,
        type: "TRACK_UPDATE" as const,
        createdAt: null,
        user: {
          id: item.user.id,
          username: item.user.username,
          avatarUrl: item.user.avatarUrl
        },
        title: item.title,
        status: item.status,
        mediaType: item.mediaType,
        tmdbId: item.tmdbId
      }))
    ].slice(0, take);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Notifications error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
