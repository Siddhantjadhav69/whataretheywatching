import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    {
      error: "Deprecated endpoint. Use /api/track instead."
    },
    { status: 410 }
  );
}
