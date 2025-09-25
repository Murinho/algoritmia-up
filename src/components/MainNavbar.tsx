'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

const NAV_ITEMS = [
  { name: "Inicio", href: "/" },
  { name: "Acerca", href: "/acerca" },
  { name: "Eventos", href: "/eventos" },
  { name: "Testimonios", href: "/testimonios" },
  { name: "Historia", href: "/historia" },
  { name: "Recursos", href: "/recursos" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Contacto", href: "/contacto" },
];

export default function MainNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className="sticky top-0 z-50 bg-[rgb(197,19,61)] text-white shadow h-16 [--nav-h:64px]" // 64px = h-16
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-3 text-white">
                <Image
                    src="/algoritmia-logo-red-white.png"   // or .svg / .webp
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
            {NAV_ITEMS.map(({ name, href }) => (
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
          <ul className="md:hidden pb-3 pt-2">
            {NAV_ITEMS.map(({ name, href }) => (
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
