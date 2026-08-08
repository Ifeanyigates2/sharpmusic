"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const primary = [
  { href: "/browse", label: "Browse" },
  { href: "/charts", label: "Charts" },
] as const;

const watchLinks = [
  { href: "/videos", label: "Music videos" },
  { href: "/lifestyle", label: "Lifestyle" },
] as const;

const libraryLinks = [
  { href: "/favorites", label: "Favorites" },
  { href: "/playlists", label: "Playlists" },
  { href: "/history", label: "History" },
] as const;

const moreLinks = [
  { href: "/request", label: "Request" },
  { href: "/news", label: "News" },
] as const;

function linkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupActive(pathname: string, hrefs: readonly { href: string }[]) {
  return hrefs.some((l) => linkActive(pathname, l.href));
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const watchRef = useRef<HTMLDivElement>(null);
  const libraryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setWatchOpen(false);
    setLibraryOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (watchRef.current && !watchRef.current.contains(t)) setWatchOpen(false);
      if (libraryRef.current && !libraryRef.current.contains(t)) {
        setLibraryOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

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

        <nav className="hidden items-center gap-6 lg:flex">
          {primary.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm tracking-wide transition ${
                linkActive(pathname, link.href)
                  ? "text-[color:var(--signal)]"
                  : "text-[color:var(--mist)] hover:text-[color:var(--foam)]"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <NavDropdown
            label="Watch"
            open={watchOpen}
            setOpen={setWatchOpen}
            active={groupActive(pathname, watchLinks)}
            links={watchLinks}
            pathname={pathname}
            containerRef={watchRef}
          />
          <NavDropdown
            label="Library"
            open={libraryOpen}
            setOpen={setLibraryOpen}
            active={groupActive(pathname, libraryLinks)}
            links={libraryLinks}
            pathname={pathname}
            containerRef={libraryRef}
          />

          {moreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm tracking-wide transition ${
                linkActive(pathname, link.href)
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
          className="text-[color:var(--foam)] lg:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[color:var(--ink)] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {primary.map((link) => (
              <MobileLink key={link.href} href={link.href} label={link.label} />
            ))}
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--mist)]">
              Watch
            </p>
            {watchLinks.map((link) => (
              <MobileLink key={link.href} href={link.href} label={link.label} />
            ))}
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--mist)]">
              Library
            </p>
            {libraryLinks.map((link) => (
              <MobileLink key={link.href} href={link.href} label={link.label} />
            ))}
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--mist)]">
              More
            </p>
            {moreLinks.map((link) => (
              <MobileLink key={link.href} href={link.href} label={link.label} />
            ))}
            <Link
              href="/browse"
              className="mt-3 rounded-sm bg-[color:var(--signal)] px-4 py-2.5 text-center text-sm font-semibold text-[color:var(--ink)]"
            >
              Download music
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function MobileLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="py-2 text-[color:var(--foam)]">
      {label}
    </Link>
  );
}

function NavDropdown({
  label,
  open,
  setOpen,
  active,
  links,
  pathname,
  containerRef,
}: {
  label: string;
  open: boolean;
  setOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  active: boolean;
  links: readonly { href: string; label: string }[];
  pathname: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 text-sm tracking-wide transition ${
          active
            ? "text-[color:var(--signal)]"
            : "text-[color:var(--mist)] hover:text-[color:var(--foam)]"
        }`}
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          size={14}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[10.5rem] overflow-hidden rounded-md border border-white/10 bg-[color:var(--ink)] shadow-xl">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2.5 text-sm transition hover:bg-white/[0.06] ${
                linkActive(pathname, link.href)
                  ? "text-[color:var(--signal)]"
                  : "text-[color:var(--foam)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
