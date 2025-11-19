"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

type AuthState = "unknown" | "authenticated" | "unauthenticated";

export default function Footer() {
  const [authState, setAuthState] = useState<AuthState>("unknown");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!cancelled) {
          if (res.ok) {
            setAuthState("authenticated");
          } else {
            setAuthState("unauthenticated");
          }
        }
      } catch {
        if (!cancelled) {
          setAuthState("unauthenticated");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isAuthenticated = authState === "authenticated";

  // Footer para usuarios no autenticados
  const publicLinks = [
    { href: "/", label: "Inicio" },
    { href: "/#historia", label: "Historia" },
    { href: "/eventos", label: "Eventos" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/login", label: "Login" },
    { href: "/signup", label: "Sign in" },
  ];

  // Footer para usuarios autenticados
  const privateLinks = [
    { href: "/", label: "Inicio" },
    { href: "/#historia", label: "Historia" },
    { href: "/eventos", label: "Eventos" },
    { href: "/recursos", label: "Recursos" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/perfil", label: "Perfil" },
  ];

  const linksToShow = isAuthenticated ? privateLinks : publicLinks;

  return (
    <footer className="border-t border-white/10 bg-black/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LOGO / DESCRIPCIÓN */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-white">
              Algoritmia <span className="text-[#C5133D]">UP</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Comunidad de programación competitiva de la Universidad Panamericana campus Bonaterra.
            </p> 
            <p className="text-gray-400 text-sm leading-relaxed">
              Aprendemos, competimos y crecemos juntos.
            </p>
          </div>

          {/* MENÚ DINÁMICO */}
          <div>
            <h4 className="text-white font-medium mb-3"> <strong>Navegación</strong> </h4>
            <ul className="space-y-2">
              {linksToShow.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SECCIÓN LEGAL — SIEMPRE VISIBLE */}
          <div>
            <h4 className="text-white font-medium mb-3"> <strong>Legal</strong> </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacidad"
                  className="text-gray-400 hover:text-white transition"
                >
                  Aviso de Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-white/10 mt-10 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Algoritmia UP. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
