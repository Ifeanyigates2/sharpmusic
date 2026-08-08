import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { isAdminAuthenticated } from "@/lib/admin";
import { getAdminOverview } from "@/lib/admin-overview";

export const metadata: Metadata = {
  title: "Admin home",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin?next=/admin/dashboard");
  }

  const overview = await getAdminOverview();

  const cards = [
    {
      label: "Pending requests",
      value: String(overview.pendingRequests),
      href: "/admin/requests",
      hint: `${overview.reviewingRequests} reviewing`,
    },
    {
      label: "Catalog tracks",
      value: String(overview.trackCount),
      href: "/admin/tracks",
      hint: "Manage uploads",
    },
    {
      label: "Downloads this week",
      value: String(overview.weeklyDownloads),
      href: "/charts",
      hint: "Public charts",
    },
    {
      label: "Artists with socials",
      value: String(overview.artistsWithSocials),
      href: "/admin/artists",
      hint: "News sync",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <AdminNav current="home" />
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[color:var(--foam)]">
        Admin home
      </h1>
      <p className="mt-2 text-sm text-[color:var(--mist)]">
        Snapshot of requests, catalog health, and integrations.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:border-[color:var(--signal)]/40"
          >
            <p className="text-xs uppercase tracking-wider text-[color:var(--mist)]">
              {card.label}
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[color:var(--foam)]">
              {card.value}
            </p>
            <p className="mt-2 text-xs text-[color:var(--signal)]">{card.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--foam)]">
            Integrations
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <StatusRow
              label="MongoDB"
              ok={overview.mongoConfigured}
              detail={overview.mongoConfigured ? "Connected" : "Not configured"}
            />
            <StatusRow
              label="Gemini next-track"
              ok={overview.geminiConfigured}
              detail={
                overview.geminiConfigured
                  ? "API key present"
                  : "Missing GEMINI_API_KEY"
              }
            />
            <StatusRow
              label="Request emails (Resend)"
              ok={overview.emailConfigured}
              detail={
                overview.emailConfigured
                  ? "Ready to notify listeners"
                  : "Set RESEND_API_KEY + EMAIL_FROM"
              }
            />
          </ul>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--foam)]">
              Pending requests
            </h2>
            <Link
              href="/admin/requests"
              className="text-xs font-semibold text-[color:var(--signal)] hover:underline"
            >
              View all →
            </Link>
          </div>
          {overview.recentPending.length === 0 ? (
            <p className="mt-4 text-sm text-[color:var(--mist)]">
              No pending recommendations.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {overview.recentPending.map((req) => (
                <li key={req.id} className="py-3">
                  <p className="font-semibold text-[color:var(--foam)]">
                    {req.title}
                  </p>
                  <p className="text-sm text-[color:var(--mist)]">{req.artist}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/upload"
              className="rounded-sm bg-[color:var(--signal)] px-3 py-2 text-xs font-semibold text-[color:var(--ink)]"
            >
              Upload track
            </Link>
            <Link
              href="/admin/analytics"
              className="rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold text-[color:var(--mist)] hover:text-[color:var(--foam)]"
            >
              Analytics
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <li className="flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold text-[color:var(--foam)]">{label}</p>
        <p className="text-[color:var(--mist)]">{detail}</p>
      </div>
      <span
        className={`shrink-0 rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
          ok
            ? "bg-[color:var(--signal)]/15 text-[color:var(--signal)]"
            : "bg-[color:var(--ember)]/15 text-[color:var(--ember)]"
        }`}
      >
        {ok ? "OK" : "Check"}
      </span>
    </li>
  );
}
