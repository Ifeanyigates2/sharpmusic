import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { UploadForm } from "@/components/UploadForm";
import { isAdminAuthenticated } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Upload",
  description: "Admin-only music upload for sharpmusic.com.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    title?: string;
    artist?: string;
    genre?: string;
    notes?: string;
    requestId?: string;
  }>;
};

export default async function UploadPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = (() => {
    const q = new URLSearchParams();
    if (params.title) q.set("title", params.title);
    if (params.artist) q.set("artist", params.artist);
    if (params.genre) q.set("genre", params.genre);
    if (params.notes) q.set("notes", params.notes);
    if (params.requestId) q.set("requestId", params.requestId);
    const qs = q.toString();
    return qs ? `/upload?${qs}` : "/upload";
  })();

  if (!(await isAdminAuthenticated())) {
    redirect(`/admin?next=${encodeURIComponent(nextPath)}`);
  }

  const defaults = {
    title: params.title?.trim() || "",
    artist: params.artist?.trim() || "",
    genre: params.genre?.trim() || "",
    notes: params.notes?.trim() || "",
    requestId: params.requestId?.trim() || "",
  };
  const fromRequest = Boolean(
    defaults.requestId || defaults.title || defaults.artist,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:px-6">
      <AdminNav current="upload" />
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
          Upload music
        </h1>
        <p className="mt-3 text-[color:var(--mist)]">
          {fromRequest
            ? "Prefilling from a listener recommendation — add the audio file and publish. We’ll email them if they left an address."
            : "Admin only. Audio and covers go to Cloudinary; details are saved in MongoDB."}
        </p>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 md:p-8">
        <UploadForm defaults={defaults} />
      </div>
    </div>
  );
}
