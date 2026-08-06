import type { DailyPoint, PeriodStats } from "@/lib/analytics";

export function AnalyticsDashboard({
  periods,
  last30Days,
}: {
  periods: PeriodStats[];
  last30Days: DailyPoint[];
}) {
  const maxViews = Math.max(1, ...last30Days.map((d) => d.pageViews));

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {periods.map((period) => (
          <div
            key={period.key}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--mist)]">
              {period.label}
            </p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold text-[color:var(--foam)]">
              {period.visitors.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-[color:var(--mist)]">unique visitors</p>
            <p className="mt-4 text-sm text-[color:var(--signal)]">
              {period.pageViews.toLocaleString()} page views
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--foam)]">
            Last 30 days
          </h2>
          <p className="mt-1 text-sm text-[color:var(--mist)]">
            Daily page views (bars) with unique visitors labeled.
          </p>
        </div>

        <div className="flex h-48 items-end gap-1 overflow-x-auto pb-2">
          {last30Days.map((day) => {
            const height = Math.max(4, Math.round((day.pageViews / maxViews) * 100));
            return (
              <div
                key={day.date}
                className="group flex min-w-[10px] flex-1 flex-col items-center justify-end"
                title={`${day.date}: ${day.visitors} visitors, ${day.pageViews} views`}
              >
                <span className="mb-1 hidden text-[9px] text-[color:var(--mist)] group-hover:block">
                  {day.visitors}
                </span>
                <div
                  className="w-full rounded-sm bg-[color:var(--signal)]/80 transition group-hover:bg-[color:var(--signal)]"
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-[color:var(--mist)]">
          <span>{last30Days[0]?.date}</span>
          <span>{last30Days[last30Days.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
}
