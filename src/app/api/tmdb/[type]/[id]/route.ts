import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TMDB_BASE = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY || "";

export async function GET(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  const { type, id } = params;
  if (!["movie", "tv"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const url = `${TMDB_BASE}/${type}/${id}?api_key=${TMDB_KEY}&append_to_response=credits`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const data = await res.json();
      return NextResponse.json(data);
    } catch (error: any) {
      console.error(`TMDB proxy attempt ${attempt + 1}:`, error?.cause?.code || "unknown");
      if (attempt < 2) await new Promise(r => setTimeout(r, 500));
    }
  }

  return NextResponse.json({ error: "TMDB unreachable" }, { status: 503 });
}
