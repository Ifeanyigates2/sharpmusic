import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start px-4 pb-24 pt-32 md:px-6">
      <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--signal)]">
        404
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[color:var(--foam)]">
        Page not found
      </h1>
      <p className="mt-3 text-[color:var(--mist)]">
        That link doesn’t match anything in the catalog.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/browse"
          className="rounded-sm bg-[color:var(--signal)] px-4 py-2.5 text-sm font-semibold text-[color:var(--ink)]"
        >
          Browse music
        </Link>
        <Link
          href="/charts"
          className="rounded-sm border border-white/15 px-4 py-2.5 text-sm font-semibold text-[color:var(--foam)]"
        >
          Charts
        </Link>
      </div>
    </div>
  );
}
