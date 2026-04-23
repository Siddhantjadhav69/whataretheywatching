import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await prisma.customList.findFirst({
      where: { id: params.id, userId: session.user.id }
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const { tmdbId, mediaType, title, posterPath } = await request.json();
    const id = parseInt(tmdbId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid tmdbId" }, { status: 400 });
    }

    const item = await prisma.customListItem.upsert({
      where: { listId_tmdbId: { listId: params.id, tmdbId: id } },
      update: {},
      create: {
        listId: params.id,
        tmdbId: id,
        mediaType: mediaType || "movie",
        title: title || "Unknown",
        posterPath: posterPath || null
      }
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("List items POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tmdbId } = await request.json();
    const id = parseInt(tmdbId, 10);

    await prisma.customListItem.deleteMany({
      where: {
        listId: params.id,
        tmdbId: id,
        list: { userId: session.user.id }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("List items DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
