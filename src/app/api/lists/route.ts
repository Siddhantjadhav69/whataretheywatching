import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lists = await prisma.customList.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } }
    });

    return NextResponse.json({ lists });
  } catch (error) {
    console.error("Lists GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, isPublic } = await request.json();
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "List name is required" }, { status: 400 });
    }

    const list = await prisma.customList.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        isPublic: isPublic || false
      }
    });

    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    console.error("Lists POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId } = await request.json();
    if (!listId) {
      return NextResponse.json({ error: "List ID required" }, { status: 400 });
    }

    await prisma.customList.deleteMany({
      where: { id: listId, userId: session.user.id }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lists DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
