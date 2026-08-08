"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-start px-4 pb-24 pt-32 md:px-6">
      <p className="text-sm uppercase tracking-[0.18em] text-[color:var(--ember)]">
        Something went wrong
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[color:var(--foam)]">
        Couldn’t load this page
      </h1>
      <p className="mt-3 text-[color:var(--mist)]">
        Try again, or head back to browse while we sort it out.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-sm bg-[color:var(--signal)] px-4 py-2.5 text-sm font-semibold text-[color:var(--ink)]"
        >
          Try again
        </button>
        <Link
          href="/browse"
          className="rounded-sm border border-white/15 px-4 py-2.5 text-sm font-semibold text-[color:var(--foam)]"
        >
          Browse music
        </Link>
      </div>
    </div>
  );
}
