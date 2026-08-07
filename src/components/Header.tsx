"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/news", label: "News" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition ${
        scrolled || open
          ? "border-b border-white/10 bg-[color:var(--ink)]/90 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <BrandLogo size="md" priority />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm tracking-wide transition ${
                pathname.startsWith(link.href)
                  ? "text-[color:var(--signal)]"
                  : "text-[color:var(--mist)] hover:text-[color:var(--foam)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/browse"
            className="rounded-sm bg-[color:var(--signal)] px-4 py-2 text-sm font-semibold text-[color:var(--ink)] transition hover:brightness-110"
          >
            Download music
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden text-[color:var(--foam)]"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[color:var(--ink)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2 text-[color:var(--foam)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
