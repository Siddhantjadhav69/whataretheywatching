import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId || targetUserId === session.user.id) {
      return new NextResponse("Invalid target", { status: 400 });
    }

    // Check if the connection already exists
    const existingConnection = await prisma.connection.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId
        }
      }
    });

    if (existingConnection) {
      // Unfollow
      await prisma.connection.delete({
        where: { id: existingConnection.id }
      });
      return NextResponse.json({ isFollowing: false });
    } else {
      // Follow
      await prisma.connection.create({
        data: {
          followerId: session.user.id,
          followingId: targetUserId
        }
      });
      return NextResponse.json({ isFollowing: true });
    }
  } catch (error) {
    console.error("Follow error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
