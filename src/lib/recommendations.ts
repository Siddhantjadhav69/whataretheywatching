import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTmdbKeywords, getTmdbMediaTasteDetails, type TmdbMediaType } from "@/lib/tmdb";

export const RECOMMENDATION_SYSTEM_PROMPT = `You are an expert film and television curator for whataretheywatching.

Your job is to recommend movies and TV series that feel personally matched to the user's taste profile.

Strict rules:
1. Use only the supplied context about titles, genres, keywords, and viewing statuses.
2. Recommend fresh adjacent titles, not the exact same titles already listed by the user.
3. Mix obvious matches with one or two tasteful discoveries when the context supports it.
4. Return exactly 6 recommendations.
5. Respond with strict JSON only. Do not include markdown, prose, code fences, comments, or trailing commas.
6. The JSON must be an array of objects with this exact shape:
[
  {
    "title": "String",
    "mediaType": "movie|tv",
    "matchReason": "String explaining why based on user context",
    "tmdbSearchQuery": "String"
  }
]
7. "mediaType" must be exactly "movie" or "tv".
8. "matchReason" must cite concrete taste signals from the user context, such as genres, keywords, tones, or specific titles.
9. "tmdbSearchQuery" must be concise and searchable in TMDB.`;

const RecommendationSchema = z.object({
  title: z.string().min(1),
  mediaType: z.enum(["movie", "tv"]),
  matchReason: z.string().min(1),
  tmdbSearchQuery: z.string().min(1)
});

const RecommendationsSchema = z.array(RecommendationSchema).min(1).max(8);

export type AiRecommendation = z.infer<typeof RecommendationSchema>;

type TasteItem = {
  title: string;
  mediaType: TmdbMediaType;
  status: "COMPLETED" | "WATCHING";
  genres: string[];
  keywords: string[];
  overview: string;
};

function toTmdbMediaType(mediaType: string): TmdbMediaType {
  return mediaType === "tv" ? "tv" : "movie";
}

function countSignals(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function topSignals(counts: Record<string, number>, limit: number) {
  return Object.entries(counts)
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
    .slice(0, limit)
    .map(([name, count]) => `${name} (${count})`);
}

function cosineSimilarity(left: number[], right: number[]) {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

async function buildTasteItems(userId: string): Promise<TasteItem[]> {
  const listItems = await prisma.mediaList.findMany({
    where: {
      userId,
      status: {
        in: ["COMPLETED", "WATCHING"]
      }
    },
    orderBy: {
      id: "desc"
    },
    take: 30
  });

  const enrichedItems = await Promise.all(
    listItems.map(async (item) => {
      const mediaType = toTmdbMediaType(item.mediaType);
      const details = await getTmdbMediaTasteDetails(mediaType, item.tmdbId);

      return {
        title: item.title,
        mediaType,
        status: item.status as "COMPLETED" | "WATCHING",
        genres: details.genres.map((genre) => genre.name),
        keywords: getTmdbKeywords(details).map((keyword) => keyword.name),
        overview: details.overview ?? ""
      };
    })
  );

  return enrichedItems;
}

function buildProfileText(items: TasteItem[]) {
  const genres = topSignals(countSignals(items.flatMap((item) => item.genres)), 16);
  const keywords = topSignals(countSignals(items.flatMap((item) => item.keywords)), 30);
  const completed = items.filter((item) => item.status === "COMPLETED").map((item) => item.title);
  const watching = items.filter((item) => item.status === "WATCHING").map((item) => item.title);

  return [
    `Completed titles: ${completed.join(", ") || "none"}`,
    `Currently watching: ${watching.join(", ") || "none"}`,
    `Dominant genres: ${genres.join(", ") || "none"}`,
    `Recurring TMDB keywords: ${keywords.join(", ") || "none"}`,
    "Title-level context:",
    ...items.map(
      (item) =>
        `- ${item.title} [${item.mediaType}, ${item.status}] genres=${item.genres.join(", ") || "none"} keywords=${
          item.keywords.slice(0, 12).join(", ") || "none"
        } overview=${item.overview}`
    )
  ].join("\n");
}

function buildRetrievalChunks(items: TasteItem[]) {
  const genreSummary = topSignals(countSignals(items.flatMap((item) => item.genres)), 20).join(", ");
  const keywordSummary = topSignals(countSignals(items.flatMap((item) => item.keywords)), 36).join(", ");

  return [
    `Genre taste profile: ${genreSummary}`,
    `Keyword taste profile: ${keywordSummary}`,
    ...items.map(
      (item) =>
        `${item.title}: ${item.status}. ${item.mediaType}. Genres: ${item.genres.join(", ")}. Keywords: ${item.keywords
          .slice(0, 18)
          .join(", ")}. Overview: ${item.overview}`
    )
  ].filter(Boolean);
}

function parseJsonRecommendations(content: unknown) {
  const text = typeof content === "string" ? content : JSON.stringify(content);
  const parsed = JSON.parse(text) as unknown;
  return RecommendationsSchema.parse(parsed);
}

export async function generatePersonalizedRecommendations(userId: string) {
  const items = await buildTasteItems(userId);

  if (!items.length) {
    return [];
  }

  const profileText = buildProfileText(items);
  const chunks = buildRetrievalChunks(items);
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small"
  });

  const [profileEmbedding, chunkEmbeddings] = await Promise.all([
    embeddings.embedQuery(profileText),
    embeddings.embedDocuments(chunks)
  ]);

  const retrievedContext = chunkEmbeddings
    .map((embedding, index) => ({
      text: chunks[index],
      score: cosineSimilarity(profileEmbedding, embedding)
    }))
    .sort((first, second) => second.score - first.score)
    .slice(0, 10)
    .map((chunk) => chunk.text)
    .join("\n");

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", RECOMMENDATION_SYSTEM_PROMPT],
    [
      "human",
      `User Taste Profile:\n{profileText}\n\nRetrieved Taste Context:\n{retrievedContext}\n\nReturn the JSON recommendation array now.`
    ]
  ]);

  const model = new ChatOpenAI({
    model: process.env.AI_RECOMMENDATION_MODEL ?? "gpt-4o-mini",
    temperature: 0.35
  });

  const message = await prompt.pipe(model).invoke({
    profileText,
    retrievedContext
  });

  return parseJsonRecommendations(message.content);
}
