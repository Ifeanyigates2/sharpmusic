import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { isAdminAuthenticated } from "@/lib/admin";
import { getAnalyticsSummary } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin?next=/admin/analytics");
  }

  const summary = await getAnalyticsSummary();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 md:px-6">
      <AdminNav current="analytics" />
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
          Analytics
        </h1>
        <p className="mt-3 text-[color:var(--mist)]">
          Unique visitors and page views for today, this week, this month, and
          this year.
        </p>
      </div>
      <AnalyticsDashboard
        periods={summary.periods}
        last30Days={summary.last30Days}
      />
    </div>
  );
}
