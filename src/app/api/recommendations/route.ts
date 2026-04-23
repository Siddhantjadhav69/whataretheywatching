import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePersonalizedRecommendations } from "@/lib/recommendations";
import { searchTmdbMedia } from "@/lib/tmdb";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email }
  });
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recommendations = await generatePersonalizedRecommendations(user.id);
  const enrichedRecommendations = await Promise.all(
    recommendations.map(async (recommendation) => {
      const searchResults = await searchTmdbMedia(recommendation.tmdbSearchQuery, recommendation.mediaType);
      const bestMatch = searchResults.results[0];

      return {
        ...recommendation,
        tmdbId: bestMatch?.id ?? null,
        posterPath: bestMatch?.poster_path ?? null
      };
    })
  );

  return NextResponse.json({ recommendations: enrichedRecommendations });
}
