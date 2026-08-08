"use client";

import Image from "next/image";
import Link from "next/link";
import { Film } from "lucide-react";
import type { LifestyleVideo } from "@/lib/lifestyle-types";

export function LifestyleVideoCard({ video }: { video: LifestyleVideo }) {
  return (
    <Link
      href={`/lifestyle/${video.id}`}
      className="group block overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] transition hover:border-[color:var(--signal)]/40"
    >
      <div className="relative aspect-video w-full bg-black/40">
        {video.coverImageUrl ? (
          <Image
            src={video.coverImageUrl}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width:640px) 100vw, 400px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent">
            <Film className="text-[color:var(--mist)]" size={28} />
          </div>
        )}
        <span className="absolute bottom-2 left-2 rounded-sm bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--foam)]">
          Lifestyle
        </span>
      </div>
      <div className="p-3 sm:p-4">
        <h2 className="truncate font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-[color:var(--foam)] group-hover:text-[color:var(--signal)] sm:text-base">
          {video.title}
        </h2>
        {video.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-[color:var(--mist)] sm:text-sm">
            {video.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
