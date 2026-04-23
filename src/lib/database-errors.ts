import { Prisma } from "@prisma/client";

export function isDatabaseConnectionError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Error && error.message.includes("Can't reach database server"))
    || (error instanceof Error && error.message.includes("Authentication failed against database server"))
  );
}
