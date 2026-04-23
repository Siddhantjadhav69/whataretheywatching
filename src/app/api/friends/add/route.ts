import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDatabaseConnectionError } from "@/lib/database-errors";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { targetUserId } = await request.json();

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Invalid target user ID" }, { status: 400 });
    }

    // Prevent self-following
    if (session.user.id === targetUserId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Check if already following
    const existingConnection = await prisma.connection.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId
        }
      }
    });

    if (existingConnection) {
      return NextResponse.json({ error: "Already following this user" }, { status: 409 });
    }

    // Create the connection
    const connection = await prisma.connection.create({
      data: {
        followerId: session.user.id,
        followingId: targetUserId
      }
    });

    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        {
          error: "Database is not reachable. Please try again later."
        },
        { status: 503 }
      );
    }

    throw error;
  }
}