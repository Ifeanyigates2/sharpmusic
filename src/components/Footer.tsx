import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[color:var(--deep)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 md:flex-row md:items-end md:justify-between md:px-6">
        <div>
          <BrandLogo size="sm" />
          <p className="mt-3 max-w-sm text-sm text-[color:var(--mist)]">
            Music from around the world — stream, buy, and download tracks from
            the Sharp Music catalog.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-[color:var(--mist)]">
          <Link href="/browse" className="hover:text-[color:var(--signal)]">
            Browse
          </Link>
          <Link href="/charts" className="hover:text-[color:var(--signal)]">
            Charts
          </Link>
          <Link href="/favorites" className="hover:text-[color:var(--signal)]">
            Favorites
          </Link>
          <Link href="/request" className="hover:text-[color:var(--signal)]">
            Request
          </Link>
          <Link href="/news" className="hover:text-[color:var(--signal)]">
            News
          </Link>
        </div>
      </div>
    </footer>
  );
}
