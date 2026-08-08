import { connectMongo, isMongoConfigured } from "@/lib/mongodb";
import { isEmailConfigured } from "@/lib/email";
import { isGeminiConfigured } from "@/lib/gemini-radio";
import { getWeeklyCharts } from "@/lib/charts";
import { profileHasSocials, ensureArtistProfiles } from "@/lib/news-store";
import { listSongRequests } from "@/lib/requests-store";
import { getAllTracks } from "@/lib/store";
import { SongRequestModel } from "@/models/SongRequest";

export type AdminOverview = {
  trackCount: number;
  pendingRequests: number;
  reviewingRequests: number;
  weeklyDownloads: number;
  artistsWithSocials: number;
  emailConfigured: boolean;
  geminiConfigured: boolean;
  mongoConfigured: boolean;
  recentPending: Array<{
    id: string;
    title: string;
    artist: string;
    createdAt: string;
  }>;
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const mongoConfigured = isMongoConfigured();
  const [tracks, requests, charts, artists] = await Promise.all([
    getAllTracks(),
    listSongRequests(50),
    getWeeklyCharts(5),
    ensureArtistProfiles(),
  ]);

  const pending = requests.filter((r) => r.status === "pending");
  const reviewing = requests.filter((r) => r.status === "reviewing");
  const weeklyDownloads =
    charts.source === "week"
      ? charts.entries.reduce((sum, e) => sum + e.downloads, 0)
      : 0;

  // Prefer live pending count from Mongo when available
  let pendingCount = pending.length;
  if (mongoConfigured) {
    try {
      await connectMongo();
      pendingCount = await SongRequestModel.countDocuments({ status: "pending" });
    } catch {
      // keep list-based count
    }
  }

  return {
    trackCount: tracks.length,
    pendingRequests: pendingCount,
    reviewingRequests: reviewing.length,
    weeklyDownloads,
    artistsWithSocials: artists.filter(profileHasSocials).length,
    emailConfigured: isEmailConfigured(),
    geminiConfigured: isGeminiConfigured(),
    mongoConfigured,
    recentPending: pending.slice(0, 5).map((r) => ({
      id: r.id,
      title: r.title,
      artist: r.artist,
      createdAt: r.createdAt,
    })),
  };
}
