import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { isDatabaseConnectionError } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const UpdateProfileSchema = z.object({
  avatarUrl: z.string().url("Invalid avatar URL").optional(),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional()
}).refine((data) => data.avatarUrl !== undefined || data.bio !== undefined, {
  message: "At least one field must be provided"
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = UpdateProfileSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update payload", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.avatarUrl !== undefined) {
      updateData.avatarUrl = parsed.data.avatarUrl;
    }
    if (parsed.data.bio !== undefined) {
      updateData.bio = parsed.data.bio;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true
      }
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        {
          error: "Database is not reachable. Start PostgreSQL on 127.0.0.1:5433 and run the Prisma schema push."
        },
        { status: 503 }
      );
    }

    throw error;
  }
}
