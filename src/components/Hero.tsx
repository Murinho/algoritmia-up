'use client';

import Image from 'next/image';
import HeroStats from '@/components/HeroStats';
import Link from 'next/link';

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="
        relative
        min-h-[100dvh]
        pt-[env(safe-area-inset-top)]
        pb-[env(safe-area-inset-bottom)]
        flex items-center
      "
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
      />

      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* LEFT */}
          <div className="relative max-w-2xl">
            {/* Soft red glow behind text to balance right logo */}
            <div
              aria-hidden="true"
              className="absolute -left-8 -top-10 -z-10 h-40 w-40 rounded-full bg-[#C5133D]/25 blur-3xl sm:h-48 sm:w-48"
            />

            {/* Title with subtle gradient + tracking */}
            <h1
              id="hero-title"
              className="
                text-5xl sm:text-7xl font-extrabold leading-[1.2]
                bg-gradient-to-r from-white via-white to-white
                bg-clip-text text-transparent tracking-tight
              "
            >
              Algoritmia UP
            </h1>

            {/* Subtitle with tiny brand underline */}
            <div className="mt-3 inline-flex items-center gap-3">
              <span className="h-[3px] w-14 rounded-full bg-[#C5133D]" />
              <p className="text-lg font-medium text-gray-300">
                Universidad Panamericana campus Bonaterra
              </p>
              <span className="h-[3px] w-14 rounded-full bg-[#C5133D]" />
            </div>

            {/* Snappier description with emphasized keywords + monospace touch */}
            <p className="mt-6 text-lg text-gray-300/90 leading-relaxed">
              La comunidad de <strong className="text-white">programadores</strong> más feroz de la UP.{' '}
              Aprende, colabora y conquista el mundo del{' '}
              <span className="font-mono font-semibold text-white">código</span>{' '}
              con la fuerza de una pantera.
            </p>

            {/* CTAs: primary = brand red, secondary = outline */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#join"
                aria-label="Únete ahora"
                className="
                  inline-flex items-center justify-center rounded-xl px-6 py-3
                  text-sm font-semibold text-white shadow-lg
                  bg-[#C5133D]
                  transition-transform duration-200 hover:scale-[1.05]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5133D]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black
                  hover:bg-[#da1f4a] active:translate-y-px
                "
              >
                Únete ahora
              </Link>

              <Link
                href="#events"
                aria-label="Ver eventos"
                className="
                  inline-flex items-center justify-center rounded-xl px-6 py-3
                  text-sm font-semibold text-white
                  border border-white/60
                  transition-colors transition-transform duration-200 hover:bg-white/10 hover:scale-[1.05]
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black
                "
              >
                Ver eventos
              </Link>
            </div>
          </div>

          {/* RIGHT: Logo */}
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

        {/* Stats */}
        <div className="mt-10 lg:mt-14 items-center">
          <HeroStats />
        </div>
      </div>
    </section>
  );
}
