"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LOGO / DESCRIPCIÓN */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">
              Algoritmia <span className="text-[#C5133D]">UP</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Comunidad de programación competitiva de la Universidad Panamericana.  
              Aprendemos, competimos y crecemos juntos.
            </p>
          </div>

          {/* MENÚ */}
          <div>
            <h4 className="text-white font-medium mb-3"> <strong> Navegación </strong></h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 hover:text-white transition"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/eventos"
                  className="text-gray-400 hover:text-white transition"
                >
                  Eventos
                </Link>
              </li>
              <li>
                <Link
                  href="/recursos"
                  className="text-gray-400 hover:text-white transition"
                >
                  Recursos
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-gray-400 hover:text-white transition"
                >
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* LEGAL */}
          <div>
            <h4 className="text-white font-medium mb-3"> <strong> Legal </strong></h4>
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
