import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tmdbId } = await request.json();
    const id = parseInt(tmdbId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid tmdbId" }, { status: 400 });
    }

    const existing = await prisma.mediaList.findUnique({
      where: { userId_tmdbId: { userId: session.user.id, tmdbId: id } }
    });

    if (!existing) {
      return NextResponse.json({ error: "Media not found in your list" }, { status: 404 });
    }

    const updated = await prisma.mediaList.update({
      where: { userId_tmdbId: { userId: session.user.id, tmdbId: id } },
      data: { isFavorite: !existing.isFavorite }
    });

    return NextResponse.json({ isFavorite: updated.isFavorite });
  } catch (error) {
    console.error("Favorite toggle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
