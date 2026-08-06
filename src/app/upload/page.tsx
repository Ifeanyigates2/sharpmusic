import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { UploadForm } from "@/components/UploadForm";
import { isAdminAuthenticated } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Upload",
  description: "Admin-only music upload for sharpmusic.com.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin?next=/upload");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 md:px-6">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[color:var(--foam)]">
            Upload music
          </h1>
          <p className="mt-3 text-[color:var(--mist)]">
            Admin only. Audio is stored on Cloudinary; track details are saved in
            MongoDB.
          </p>
        </div>
        <AdminLogoutButton />
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 md:p-8">
        <UploadForm />
      </div>
    </div>
  );
}
