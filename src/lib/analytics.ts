import { connectMongo, isMongoConfigured } from "@/lib/mongodb";
import { PageViewModel } from "@/models/PageView";

export type PeriodKey = "day" | "week" | "month" | "year";

export type PeriodStats = {
  key: PeriodKey;
  label: string;
  pageViews: number;
  visitors: number;
};

export type DailyPoint = {
  date: string;
  pageViews: number;
  visitors: number;
};

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function periodStart(key: PeriodKey, now = new Date()) {
  const today = startOfUtcDay(now);
  if (key === "day") return today;
  if (key === "week") {
    const day = today.getUTCDay(); // 0 Sun
    const diff = (day + 6) % 7; // Monday start
    return new Date(today.getTime() - diff * 24 * 60 * 60 * 1000);
  }
  if (key === "month") {
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  }
  return new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
}

async function countSince(since: Date): Promise<{ pageViews: number; visitors: number }> {
  const [pageViews, unique] = await Promise.all([
    PageViewModel.countDocuments({ createdAt: { $gte: since } }),
    PageViewModel.distinct("visitorId", { createdAt: { $gte: since } }),
  ]);
  return { pageViews, visitors: unique.length };
}

export async function recordPageView(visitorId: string, path: string) {
  if (!isMongoConfigured() || !visitorId) return;
  await connectMongo();
  const cleanPath = path.slice(0, 200) || "/";
  await PageViewModel.create({
    visitorId: visitorId.slice(0, 80),
    path: cleanPath,
    createdAt: new Date(),
  });
}

export async function getAnalyticsSummary(): Promise<{
  periods: PeriodStats[];
  last30Days: DailyPoint[];
}> {
  if (!isMongoConfigured()) {
    return {
      periods: [
        { key: "day", label: "Today", pageViews: 0, visitors: 0 },
        { key: "week", label: "This week", pageViews: 0, visitors: 0 },
        { key: "month", label: "This month", pageViews: 0, visitors: 0 },
        { key: "year", label: "This year", pageViews: 0, visitors: 0 },
      ],
      last30Days: [],
    };
  }

  await connectMongo();
  const now = new Date();

  const labels: Record<PeriodKey, string> = {
    day: "Today",
    week: "This week",
    month: "This month",
    year: "This year",
  };

  const periods: PeriodStats[] = [];
  for (const key of ["day", "week", "month", "year"] as PeriodKey[]) {
    const since = periodStart(key, now);
    const counts = await countSince(since);
    periods.push({ key, label: labels[key], ...counts });
  }

  const since30 = new Date(startOfUtcDay(now).getTime() - 29 * 24 * 60 * 60 * 1000);
  const grouped = await PageViewModel.aggregate<{
    _id: string;
    pageViews: number;
    visitors: string[];
  }>([
    { $match: { createdAt: { $gte: since30 } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        pageViews: { $sum: 1 },
        visitors: { $addToSet: "$visitorId" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byDate = new Map(
    grouped.map((row) => [
      row._id,
      { pageViews: row.pageViews, visitors: row.visitors.length },
    ]),
  );

  const last30Days: DailyPoint[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since30.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const point = byDate.get(key) || { pageViews: 0, visitors: 0 };
    last30Days.push({ date: key, ...point });
  }

  return { periods, last30Days };
}
