import Link from "next/link";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

const links = [
  { href: "/admin/tracks", id: "tracks", label: "Manage tracks" },
  { href: "/upload", id: "upload", label: "Upload" },
  { href: "/admin/analytics", id: "analytics", label: "Analytics" },
] as const;

export function AdminNav({
  current,
}: {
  current: "tracks" | "upload" | "edit" | "analytics";
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {links.map((link) => {
          const active =
            current === link.id ||
            (current === "edit" && link.id === "tracks");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-sm px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-[color:var(--signal)] text-[color:var(--ink)]"
                  : "border border-white/15 text-[color:var(--mist)] hover:text-[color:var(--foam)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <AdminLogoutButton />
    </div>
  );
}
