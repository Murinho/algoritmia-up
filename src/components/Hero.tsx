'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="
        relative
        min-h-[calc(100svh-var(--nav-h))]
        pt-[calc(env(safe-area-inset-top)+var(--nav-h))]
        flex items-center
        overflow-hidden
      "
    >
        {/* Background */}
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#0b0f19] via-[#2c1e28] to-[#6b1d1b]"
        />

      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* LEFT: 1–8 */}
          <div className="max-w-2xl">
            {/* 1. Big title */}
            <h1
              id="hero-title"
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl"
            >
              Algoritmia UP
            </h1>

            {/* 2. Subtitle */}
            <p className="mt-3 text-lg font-medium text-gray-600 dark:text-gray-300">
              Universidad Panamericana campus Bonaterra
            </p>

            {/* 3. Description */}
            <p className="mt-6 text-base text-gray-700 dark:text-gray-200 sm:text-lg">
              Únete a la comunidad de programadores más feroz de la Universidad Panamericana.
              Aprende, colabora y conquista el mundo del código con la fuerza de una pantera.
            </p>

            {/* 4–5. CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#join"
                className="inline-flex items-center justify-center rounded-lg bg-[rgb(200,165,104)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 hover:bg-indigo-500 active:translate-y-px"
                aria-label="Unete ahora"
              >
                Unete ahora
              </Link>

              <Link
                href="#events"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
                aria-label="Ver eventos"
              >
                Ver eventos
              </Link>
            </div>

            {/* 6–8. Stats */}
            <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-zinc-800">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Miembros</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  +100
                </dd>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-zinc-800">
                <dt className="text-sm text-gray-500 dark:text-gray-400">Big‑Tech interns</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  +20
                </dd>
              </div>

              <div className="rounded-xl border border-gray-200 p-4 dark:border-zinc-800">
                <dt className="text-sm text-gray-500 dark:text-gray-400">
                  Años de experiencia en ICPC
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  +10
                </dd>
              </div>
            </dl>
          </div>

          {/* RIGHT: 9. Logo */}
          <div className="relative w-full">
            <div className="mx-auto max-w-xs sm:max-w-sm md:max-w-md lg:ml-auto">
              <Image
                src="/algoritmia-logo-red-white.png" // Place the file in /public
                alt="Logotipo de Algoritmia UP"
                width={640}
                height={640}
                priority
                className="h-auto w-full object-contain drop-shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
