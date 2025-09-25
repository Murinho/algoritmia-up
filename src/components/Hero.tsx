'use client';

import Image from 'next/image';
import HeroStats from "@/components/HeroStats";
import Link from 'next/link';

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="
        relative
        min-h-[100dvh]       /* grow with dynamic viewport */
        pt-[env(safe-area-inset-top)]
        pb-[env(safe-area-inset-bottom)]
        flex items-center
        /* overflow-hidden  <-- REMOVE to avoid clipping */
      "
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
      />

      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* LEFT: 1–8 */}
          <div className="max-w-2xl">
            {/* 1. Big title */}
            <h1
              id="hero-title"
              className="text-4xl font-bold tracking-tight text-white sm:text-7xl"
            >
              Algoritmia UP
            </h1>

            {/* 2. Subtitle */}
            <p className="mt-3 text-lg font-medium text-gray-300">
              Universidad Panamericana campus Bonaterra
            </p>

            {/* 3. Description */}
            <p className="mt-6 text-base text-gray-200 sm:text-lg">
              Únete a la comunidad de programadores más feroz de la Universidad Panamericana.
              Aprende, colabora y conquista el mundo del código con la fuerza de una pantera.
            </p>

            {/* 4–5. CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#join"
                className="inline-flex items-center justify-center rounded-lg bg-[rgb(200,165,104)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 hover:bg-[rgb(210,165,104)] hover:scale-105 active:translate-y-px"
                aria-label="Únete ahora"
              >
                Únete ahora
              </Link>

              <Link
                href="#events"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:bg-gray-700 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                aria-label="Ver eventos"
              >
                Ver eventos
              </Link>
            </div>
          </div>

          {/* RIGHT: 9. Logo */}
          <div className="relative w-full">
            <div className="mx-auto max-w-[120px] sm:max-w-60 md:max-w-80 lg:max-w-100">
              <Image
                src="/algoritmia-logo-red-white.png"
                alt="Logotipo de Algoritmia UP"
                width={840}
                height={840}
                priority
                className="h-auto w-full object-contain drop-shadow-sm"
              />
            </div>
          </div>
        </div>
        <div className="mt-10 lg:mt-14">
          <HeroStats />
        </div>
      </div>
    </section>
  );
}
