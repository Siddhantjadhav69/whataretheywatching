import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    // Fetch recent MediaList items from users we follow
    const recentActivity = await prisma.mediaList.findMany({
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
        // We lack a createdAt field on MediaList in the prisma schema, wait, let me check the schema briefly.
        id: "desc" // using id descending as proxy for recent insertion
      },
      take,
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json({ notifications: recentActivity });
  } catch (error) {
    console.error("Notifications error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
