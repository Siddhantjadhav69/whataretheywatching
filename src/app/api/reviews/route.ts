import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdbId = parseInt(searchParams.get("tmdbId") || "", 10);
    const friendsOnly = searchParams.get("friendsOnly") === "true";

    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "Invalid tmdbId" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    let whereClause: any = { tmdbId };

    if (friendsOnly && session?.user?.id) {
      const following = await prisma.connection.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true }
      });
      const friendIds = following.map(f => f.followingId);
      if (session.user.id) friendIds.push(session.user.id);
      whereClause.userId = { in: friendIds };
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Reviews GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tmdbId, mediaType, title, content, rating } = await request.json();
    const id = parseInt(tmdbId, 10);

    if (isNaN(id) || !content || !rating || rating < 1 || rating > 10) {
      return NextResponse.json({ error: "Invalid review data" }, { status: 400 });
    }

    const review = await prisma.review.upsert({
      where: { userId_tmdbId: { userId: session.user.id, tmdbId: id } },
      update: { content, rating, title: title || "Unknown" },
      create: {
        userId: session.user.id,
        tmdbId: id,
        mediaType: mediaType || "movie",
        title: title || "Unknown",
        content,
        rating
      }
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Reviews POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
