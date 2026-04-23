import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConnectionError } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";

const SignupSchema = z.object({
  email: z.string().email().transform((email) => email.trim().toLowerCase()),
  username: z.string().min(3, "Username must be at least 3 characters.").max(30, "Username must be at most 30 characters.").regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export async function POST(request: Request) {
  const parsed = SignupSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        username: parsed.data.username,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        username: true
      }
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes("username")) {
        return NextResponse.json({ error: "This username is already taken." }, { status: 409 });
      }
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

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
