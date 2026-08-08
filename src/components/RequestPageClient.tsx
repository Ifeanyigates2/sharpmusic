"use client";

import { useState } from "react";
import { CatalogSearch } from "@/components/CatalogSearch";
import { SongRequestForm } from "@/components/SongRequestForm";

export function RequestPageClient() {
  const [draftTitle, setDraftTitle] = useState("");
  const [formKey, setFormKey] = useState(0);

  function useAsRecommendation(title: string) {
    setDraftTitle(title);
    setFormKey((k) => k + 1);
    document.getElementById("recommend")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="space-y-12">
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5 md:p-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--foam)]">
          Search the catalog
        </h2>
        <p className="mt-2 text-sm text-[color:var(--mist)]">
          Check whether we already have the track before recommending a new one.
        </p>
        <div className="mt-5">
          <CatalogSearch onRecommend={useAsRecommendation} />
        </div>
      </section>

      <section
        id="recommend"
        className="rounded-lg border border-white/10 bg-white/[0.03] p-5 md:p-8"
      >
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[color:var(--foam)]">
          Recommend a song
        </h2>
        <p className="mt-2 text-sm text-[color:var(--mist)]">
          Tell us what you want added. We review every request and keep the
          catalog curated.
        </p>
        <div className="mt-5">
          <SongRequestForm key={formKey} initialTitle={draftTitle} />
        </div>
      </section>
    </div>
  );
}
