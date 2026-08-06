"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={logout}
      className="inline-flex items-center gap-2 rounded-sm border border-white/15 px-3 py-2 text-xs font-semibold text-[color:var(--mist)] transition hover:border-[color:var(--signal)] hover:text-[color:var(--signal)] disabled:opacity-60"
    >
      <LogOut size={14} />
      Sign out
    </button>
  );
}
