"use client";

import { useRouter } from "next/navigation";
import { AdminAudioMixer } from "@/components/AdminAudioMixer";
import { AdminEditForm } from "@/components/AdminEditForm";
import type { Track } from "@/lib/types";

export function AdminTrackEditor({ track }: { track: Track }) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <AdminAudioMixer track={track} onSaved={() => router.refresh()} />
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 md:p-8">
        <h2 className="mb-5 font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--foam)]">
          Track details
        </h2>
        <AdminEditForm track={track} />
      </div>
    </div>
  );
}
