import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("SESSION:", session);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Missing session ID" }, { status: 401 });
    }

    const body = await request.json();
    console.log("PAYLOAD:", body);

    const tmdbId = parseInt(body.tmdbId, 10);
    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "Invalid tmdbId" }, { status: 400 });
    }

    const item = await prisma.mediaList.create({
      data: {
        userId: session.user.id,
        tmdbId,
        mediaType: body.mediaType,
        title: body.title,
        posterPath: body.posterPath || null,
        status: body.status || "PLAN_TO_WATCH",
      }
    });

    revalidatePath("/profile", "page");
    revalidatePath("/", "layout");

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    console.error("PRISMA ERROR (POST):", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("SESSION:", session);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Missing session ID" }, { status: 401 });
    }

    const body = await request.json();
    console.log("PAYLOAD:", body);

    const tmdbId = parseInt(body.tmdbId, 10);
    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "Invalid tmdbId" }, { status: 400 });
    }

    const item = await prisma.mediaList.update({
      where: {
        userId_tmdbId: {
          userId: session.user.id,
          tmdbId,
        }
      },
      data: {
        status: body.status
      }
    });

    revalidatePath("/profile", "page");
    revalidatePath("/", "layout");

    return NextResponse.json({ item }, { status: 200 });
  } catch (error: any) {
    console.error("PRISMA ERROR (PATCH):", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("SESSION:", session);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized: Missing session ID" }, { status: 401 });
    }

    const body = await request.json();
    console.log("PAYLOAD:", body);
    
    const tmdbId = parseInt(body.tmdbId, 10);
    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "Invalid tmdbId" }, { status: 400 });
    }

    await prisma.mediaList.delete({
      where: {
        userId_tmdbId: {
          userId: session.user.id,
          tmdbId
        }
      }
    });

    revalidatePath("/profile", "page");
    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("PRISMA ERROR (DELETE):", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
