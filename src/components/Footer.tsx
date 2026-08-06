import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[color:var(--deep)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 md:flex-row md:items-end md:justify-between md:px-6">
        <div>
          <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[0.08em] text-[color:var(--foam)]">
            sharpmusic
          </p>
          <p className="mt-2 max-w-sm text-sm text-[color:var(--mist)]">
            Music from around the world — stream, buy, and download tracks from
            the sharpmusic catalog.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-[color:var(--mist)]">
          <Link href="/browse" className="hover:text-[color:var(--signal)]">
            Browse
          </Link>
        </div>
      </div>
    </footer>
  );
}
