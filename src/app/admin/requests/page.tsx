import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { AdminRequestList } from "@/components/AdminRequestList";
import { isAdminAuthenticated } from "@/lib/admin";
import { listSongRequests } from "@/lib/requests-store";

export const metadata: Metadata = {
  title: "Song requests",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin?next=/admin/requests");
  }

  const requests = await listSongRequests();
  const pending = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <AdminNav current="requests" />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[color:var(--foam)]">
        Song requests
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[color:var(--mist)]">
        Recommendations from listeners. {pending} pending
        {pending === 1 ? " request" : " requests"}.
      </p>
      <div className="mt-8">
        <AdminRequestList requests={requests} />
      </div>
    </div>
  );
}
