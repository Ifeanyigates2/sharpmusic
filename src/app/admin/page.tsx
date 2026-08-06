import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/tracks");
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-28 md:px-6">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[color:var(--foam)]">
          Admin sign in
        </h1>
        <p className="mt-3 text-sm text-[color:var(--mist)]">
          Only admins can upload music to sharpmusic.com. Accounts are stored in
          MongoDB.
        </p>
      </div>

      {!isAdminConfigured() ? (
        <p className="rounded-sm border border-[color:var(--ember)]/40 bg-[color:var(--ember)]/10 px-4 py-3 text-sm text-[color:var(--foam)]">
          Set <code className="text-[color:var(--signal)]">MONGODB_URI</code> and{" "}
          <code className="text-[color:var(--signal)]">SESSION_SECRET</code> in{" "}
          <code>.env.local</code>, then run{" "}
          <code className="text-[color:var(--signal)]">npm run seed:admin</code>.
        </p>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <Suspense fallback={<div className="h-24 animate-pulse rounded bg-white/5" />}>
            <AdminLoginForm />
          </Suspense>
        </div>
      )}
    </div>
  );
}
