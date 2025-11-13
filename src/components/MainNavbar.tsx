'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

const NAV_ITEMS_LOGGED_OUT = [
  { name: "Inicio", href: "/" },
  { name: "Historia", href: "/historia" },
  { name: "Eventos", href: "/eventos" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Login", href: "/login" },
  { name: "Sign Up", href: "/signup" },
];

const NAV_ITEMS_LOGGED_IN = [
  { name: "Inicio", href: "/" },
  { name: "Historia", href: "/historia" },
  { name: "Eventos", href: "/eventos" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Perfil", href: "/perfil" },
];

export default function MainNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 🔐 Auth state
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ✅ Re-check session whenever the route changes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          credentials: "include",
        });
        if (!cancelled) {
          setIsAuthed(res.ok);
        }
      } catch {
        if (!cancelled) {
          setIsAuthed(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [API_BASE, pathname]); // 👈 key change: include `pathname` here

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // If we don't yet know, treat as logged out (shows login/signup until we know)
  const navItems = isAuthed ? NAV_ITEMS_LOGGED_IN : NAV_ITEMS_LOGGED_OUT;

  return (
    <header className="sticky top-0 z-50 bg-[rgb(197,19,61)] text-white shadow h-16 [--nav-h:64px]">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 text-white">
            <Image
              src="/algoritmia-logo-red-white.png"
              alt="Algoritmia UP"
              width={32}
              height={32}
              priority
              className="h-8 w-8 rounded-md object-contain"
            />
            <span className="text-lg sm:text-xl font-extrabold tracking-tight">
              Algoritmia UP
            </span>
          </Link>

          {/* Desktop menu */}
          <ul className="hidden gap-1 md:flex">
            {navItems.map(({ name, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive(href)
                      ? "bg-white/15"
                      : "hover:bg-white/10 focus-visible:bg-white/20",
                    "outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  ].join(" ")}
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 outline-none focus-visible:ring-2 focus-visible:ring-white/60 hover:bg-white/10"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              {open ? (
                <path
                  d="M6 18L18 6M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <ul className="md:hidden pb-3 pt-2 bg-[rgb(197,19,61)] text-white shadow-lg rounded-b-lg">
            {navItems.map(({ name, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    "block rounded-lg px-3 py-2 text-base font-medium transition",
                    isActive(href)
                      ? "bg-white/15"
                      : "hover:bg-white/10 focus-visible:bg-white/20",
                    "outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  ].join(" ")}
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  );
}
