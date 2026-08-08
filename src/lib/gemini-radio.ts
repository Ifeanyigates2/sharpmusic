import { GoogleGenAI, Type } from "@google/genai";
import type { Track } from "@/lib/types";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function geminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";
}

export type NextTrackPick = {
  trackId: string;
  reason: string;
  source: "gemini" | "fallback";
};

function catalogLine(track: Track): string {
  return [
    `id=${track.id}`,
    `title="${track.title}"`,
    `artist="${track.artist}"`,
    `genre=${track.genre}`,
    `region=${track.region}`,
    `country=${track.country}`,
  ].join(" | ");
}

/** Simple non-AI fallback: prefer same genre, then same region, else first candidate. */
export function fallbackNextTrack(
  current: Track,
  candidates: Track[],
): NextTrackPick | null {
  if (candidates.length === 0) return null;

  const sameGenre = candidates.filter((t) => t.genre === current.genre);
  const sameRegion = candidates.filter((t) => t.region === current.region);
  const pick =
    sameGenre[0] ||
    sameRegion[0] ||
    candidates[Math.floor(Math.random() * candidates.length)];

  return {
    trackId: pick.id,
    reason: sameGenre[0]
      ? `Same genre (${current.genre})`
      : sameRegion[0]
        ? `Same region (${current.region})`
        : "Catalog shuffle",
    source: "fallback",
  };
}

/**
 * Ask Gemini which catalog track should play next.
 * Returns null only when there are no candidates.
 */
export async function pickNextTrackWithGemini(options: {
  current: Track;
  candidates: Track[];
  recentIds?: string[];
}): Promise<NextTrackPick | null> {
  const { current, candidates, recentIds = [] } = options;
  if (candidates.length === 0) return null;

  if (!isGeminiConfigured()) {
    return fallbackNextTrack(current, candidates);
  }

  if (candidates.length === 1) {
    return {
      trackId: candidates[0].id,
      reason: "Only one track left in the pool",
      source: "fallback",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!.trim() });
    const allowedIds = new Set(candidates.map((t) => t.id));

    const prompt = [
      "You are the DJ for Sharp Music, a global music download catalog.",
      "Pick the single best next song to play after the current track.",
      "Prefer complementary mood/genre/region flow, avoid abrupt jumps when possible,",
      "and do not repeat recently played tracks (already excluded from candidates).",
      "Respond ONLY with JSON matching the schema.",
      "",
      `Current track: ${catalogLine(current)}`,
      recentIds.length
        ? `Recently played ids (do not pick these): ${recentIds.join(", ")}`
        : "Recently played: none",
      "",
      "Candidate tracks (choose exactly one id from this list):",
      ...candidates.slice(0, 80).map((t, i) => `${i + 1}. ${catalogLine(t)}`),
    ].join("\n");

    const response = await ai.models.generateContent({
      model: geminiModel(),
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: Type.OBJECT,
          properties: {
            trackId: {
              type: Type.STRING,
              description: "Exact id of the chosen candidate track",
            },
            reason: {
              type: Type.STRING,
              description: "Short reason for the pick (max 12 words)",
            },
          },
          required: ["trackId", "reason"],
        },
      },
    });

    const raw = response.text?.trim() || "";
    const parsed = JSON.parse(raw) as { trackId?: string; reason?: string };
    const trackId = String(parsed.trackId || "").trim();
    const reason = String(parsed.reason || "Gemini pick").trim().slice(0, 120);

    if (!trackId || !allowedIds.has(trackId)) {
      return fallbackNextTrack(current, candidates);
    }

    return { trackId, reason: reason || "Gemini pick", source: "gemini" };
  } catch {
    return fallbackNextTrack(current, candidates);
  }
}
