import { connectMongo, isMongoConfigured } from "@/lib/mongodb";
import { DownloadEventModel } from "@/models/DownloadEvent";
import { TrackModel } from "@/models/Track";
import { getAllTracks } from "@/lib/store";
import type { Track } from "@/lib/types";

export type ChartEntry = {
  rank: number;
  track: Track;
  downloads: number;
};

function weekStartUtc(now = new Date()) {
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const day = today.getUTCDay(); // 0 Sun
  const diff = (day + 6) % 7; // Monday start
  return new Date(today.getTime() - diff * 24 * 60 * 60 * 1000);
}

/** Record a download for charts + bump Mongo download counters when possible. */
export async function recordTrackDownload(trackId: string): Promise<void> {
  if (!isMongoConfigured()) return;
  try {
    await connectMongo();
    await Promise.all([
      DownloadEventModel.create({ trackId, createdAt: new Date() }),
      TrackModel.updateOne({ id: trackId }, { $inc: { downloads: 1 } }),
    ]);
  } catch {
    // Charts are best-effort — never block the download response
  }
}

export async function getWeeklyCharts(limit = 20): Promise<{
  entries: ChartEntry[];
  source: "week" | "all-time";
  since: string;
}> {
  const catalog = await getAllTracks();
  const byId = new Map(catalog.map((t) => [t.id, t]));
  const since = weekStartUtc();

  if (isMongoConfigured()) {
    try {
      await connectMongo();
      const rows = await DownloadEventModel.aggregate<{
        _id: string;
        downloads: number;
      }>([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$trackId", downloads: { $sum: 1 } } },
        { $sort: { downloads: -1 } },
        { $limit: limit },
      ]);

      const entries = rows
        .map((row, i) => {
          const track = byId.get(row._id);
          if (!track) return null;
          return {
            rank: i + 1,
            track,
            downloads: row.downloads,
          } satisfies ChartEntry;
        })
        .filter((e): e is ChartEntry => Boolean(e));

      if (entries.length > 0) {
        return {
          entries,
          source: "week",
          since: since.toISOString(),
        };
      }
    } catch {
      // fall through to all-time
    }
  }

  const entries = [...catalog]
    .sort((a, b) => b.downloads - a.downloads || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map((track, i) => ({
      rank: i + 1,
      track,
      downloads: track.downloads,
    }));

  return {
    entries,
    source: "all-time",
    since: since.toISOString(),
  };
}

/** Related tracks by artist / genre / region similarity. */
export function getRelatedTracks(
  track: Track,
  catalog: Track[],
  limit = 6,
): Track[] {
  return catalog
    .filter((t) => t.id !== track.id)
    .map((t) => {
      let score = 0;
      if (t.artist === track.artist) score += 6;
      if (t.genre === track.genre) score += 3;
      if (t.region === track.region) score += 2;
      if (t.country === track.country) score += 1;
      score += Math.min(t.downloads / 5000, 2);
      return { t, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || b.t.downloads - a.t.downloads)
    .slice(0, limit)
    .map((row) => row.t);
}
