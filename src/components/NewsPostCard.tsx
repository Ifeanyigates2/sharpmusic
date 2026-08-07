import Image from "next/image";
import {
  socialProfileUrl,
} from "@/lib/social-sync";
import type { NewsPost, SocialPlatform } from "@/lib/news-types";

const LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  threads: "Threads",
  twitter: "X",
};

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function NewsPostCard({ post }: { post: NewsPost }) {
  return (
    <article className="border-t border-white/10 pt-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--mist)]">
        <span className="font-semibold uppercase tracking-wider text-[color:var(--signal)]">
          {LABELS[post.platform]}
        </span>
        <span className="font-[family-name:var(--font-display)] text-sm font-semibold text-[color:var(--foam)]">
          {post.artistName}
        </span>
        {post.authorHandle ? (
          <a
            href={socialProfileUrl(post.platform, post.authorHandle)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[color:var(--signal)]"
          >
            @{post.authorHandle.replace(/^@/, "")}
          </a>
        ) : null}
        <span>{formatWhen(post.postedAt)}</span>
      </div>

      {post.text ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--foam)]/90">
          {post.text.length > 420 ? `${post.text.slice(0, 420)}…` : post.text}
        </p>
      ) : null}

      {post.mediaUrl ? (
        <div className="relative mt-4 aspect-[16/10] max-h-72 w-full overflow-hidden rounded-sm bg-white/[0.03]">
          <Image
            src={post.mediaUrl}
            alt=""
            fill
            sizes="(max-width:768px) 100vw, 640px"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : null}

      <a
        href={post.permalink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm font-semibold text-[color:var(--signal)] hover:underline"
      >
        View on {LABELS[post.platform]} →
      </a>
    </article>
  );
}
