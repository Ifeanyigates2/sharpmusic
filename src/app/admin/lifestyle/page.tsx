import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { LifestyleAdminList } from "@/components/LifestyleAdminList";
import { LifestyleUploadForm } from "@/components/LifestyleUploadForm";
import { isAdminAuthenticated } from "@/lib/admin";
import { listLifestyleVideos } from "@/lib/lifestyle-store";

export const metadata: Metadata = {
  title: "Lifestyle videos",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLifestylePage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin?next=/admin/lifestyle");
  }

  const videos = await listLifestyleVideos();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <AdminNav current="lifestyle" />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[color:var(--foam)]">
        Lifestyle videos
      </h1>
      <p className="mt-2 text-sm text-[color:var(--mist)]">
        Behind-the-scenes, culture, and lifestyle clips — separate from track
        music videos.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <LifestyleUploadForm />
        <div>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--foam)]">
            Published ({videos.length})
          </h2>
          <LifestyleAdminList videos={videos} />
        </div>
      </div>
    </div>
  );
}
