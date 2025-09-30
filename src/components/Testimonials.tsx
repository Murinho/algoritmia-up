'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type Testimonial = {
  id: string;
  name: string;
  headline: string;
  role?: string;
  quote: string;
  avatarUrl: string;
  tags?: string[];
  links?: { linkedin?: string; github?: string; web?: string };
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: 'ana',
    name: 'Ana García',
    headline: 'Alumni 2024 – Full Stack',
    role: 'Presidenta 2023',
    quote:
      'Algoritmia UP me dio una red increíble y la confianza para liderar proyectos reales. Aprendí más organizando workshops que en cualquier otra actividad.',
    avatarUrl: 'https://i.pravatar.cc/160?img=64',
    tags: ['Full Stack', 'Comunidades', 'Mentoría'],
    links: { linkedin: 'https://linkedin.com', github: 'https://github.com' },
  },
  {
    id: 'carlos',
    name: 'Carlos Mendoza',
    headline: 'Alumni 2023 – Data Science & AI',
    role: 'Vicepresidente 2022',
    quote:
      'Participar en el club me abrió puertas en machine learning y me enseñó a trabajar con equipos multidisciplinarios, entregando valor con datos.',
    avatarUrl: 'https://i.pravatar.cc/160?img=12',
    tags: ['Data Science', 'ML', 'Liderazgo'],
    links: { linkedin: 'https://linkedin.com' },
  },
  {
    id: 'maria',
    name: 'María Rodríguez',
    headline: 'Miembro destacada — Mobile Dev',
    role: 'Coordinadora Técnica',
    quote:
      'Organizar eventos técnicos fue retador y gratificante. Ver a la comunidad crecer y compartir conocimiento no tiene precio.',
    avatarUrl: 'https://i.pravatar.cc/160?img=47',
    tags: ['Mobile', 'Workshops', 'Organización'],
  },
  {
    id: 'diego',
    name: 'Diego Ruiz',
    headline: 'Alumni 2022 – DevOps & Cloud',
    role: 'Coordinador de Eventos',
    quote:
      'Gracias a Algoritmia UP me especialicé en cloud y aprendí a gestionar la logística de conferencias con cientos de asistentes.',
    avatarUrl: 'https://i.pravatar.cc/160?img=5',
    tags: ['DevOps', 'Cloud', 'Logística'],
    links: { web: 'https://example.com' },
  },
];

const ChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
    <path
      fillRule="evenodd"
      d="M12.78 15.22a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 1 1 1.06 1.06L8.81 10l3.97 3.97a.75.75 0 0 1 0 1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const ChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
    <path
      fillRule="evenodd"
      d="M7.22 4.78a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.19 10 7.22 6.03a.75.75 0 0 1 0-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const QuoteIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M7.17 6C5.42 6 4 7.42 4 9.17V14h5V9.17C9 7.42 7.58 6 5.83 6h1.34zM18.17 6C16.42 6 15 7.42 15 9.17V14h5V9.17C20 7.42 18.58 6 16.83 6h1.34z" />
  </svg>
);

const cls = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <article
      className={cls(
        'relative flex h-full flex-col overflow-hidden rounded-2xl',
        'border border-white/10 bg-white/5 backdrop-blur-sm',
        'transition hover:border-white/20 hover:bg-white/[0.07] dark:border-white/10'
      )}
    >
      {/* Thin top gradient line */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px] rounded-t-3xl bg-[linear-gradient(90deg,#C5133D_0%,#d946ef_35%,#f59e0b_100%)] opacity-90"
      />

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/10">
            <Image
              src={t.avatarUrl}
              alt={t.name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-white">{t.name}</h3>
            <p className="truncate text-[13px] font-medium text-rose-400">{t.headline}</p>
            {t.role && <p className="truncate text-xs text-zinc-400">{t.role}</p>}
          </div>

          <span className="grid h-8 w-8 shrink-0 place-content-center rounded-md bg-white/10 text-white/90">
            <QuoteIcon className="h-5 w-5" />
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-100">“{t.quote}”</p>

        {!!t.tags?.length && (
          <div className="mt-3 flex flex-wrap gap-2">
            {t.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {(t.links?.linkedin || t.links?.github || t.links?.web) && (
          <div className="mt-4 flex items-center gap-3 text-zinc-400">
            {t.links.linkedin && (
              <a
                href={t.links.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label={`LinkedIn de ${t.name}`}
                className="transition hover:text-zinc-200"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V24h-4V8zm7.5 0h3.8v2.2h.05c.53-1 1.82-2.2 3.75-2.2C20.2 8 22 10 22 13.6V24h-4v-9c0-2.14-.76-3.6-2.66-3.6-1.45 0-2.31.98-2.69 1.93-.14.34-.18.81-.18 1.29V24h-4V8z" />
                </svg>
              </a>
            )}
            {t.links.github && (
              <a
                href={t.links.github}
                target="_blank"
                rel="noreferrer"
                aria-label={`GitHub de ${t.name}`}
                className="transition hover:text-zinc-200"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.48 2 2 6.58 2 12.26c0 4.51 2.87 8.33 6.84 9.68.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.46-1.2-1.13-1.52-1.13-1.52-.92-.64.07-.63.07-.63 1.01.07 1.54 1.06 1.54 1.06.9 1.58 2.36 1.12 2.94.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.15-4.56-5.11 0-1.13.39-2.06 1.03-2.79-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.07A9.19 9.19 0 0 1 12 7.47c.85 0 1.71.12 2.51.36 1.9-1.34 2.74-1.07 2.74-1.07.55 1.41.2 2.45.1 2.71.64.73 1.03 1.66 1.03 2.79 0 3.97-2.34 4.85-4.57 5.11.36.33.68.96.68 1.94 0 1.4-.01 2.53-.01 2.87 0 .26.18.58.69.48A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            )}
            {t.links.web && (
              <a
                href={t.links.web}
                target="_blank"
                rel="noreferrer"
                aria-label={`Web de ${t.name}`}
                className="transition hover:text-zinc-200"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.93 9h-3.17a15.2 15.2 0 0 0-1.06-4.39A8.02 8.02 0 0 1 19.93 11zM12 4c.83 0 2.46 2.3 3.1 6H8.9C9.54 6.3 11.17 4 12 4zM6.3 6.61A15.2 15.2 0 0 0 5.24 11H2.07a8.02 8.02 0 0 1 4.23-4.39zM2.07 13h3.17c.2 1.59.62 3.06 1.06 4.39A8.02 8.02 0 0 1 2.07 13zm6.83 0h6.2c-.64 3.7-2.27 6-3.1 6s-2.46-2.3-3.1-6zM18.76 13h3.17a8.02 8.02 0 0 1-4.23 4.39c.44-1.33.86-2.8 1.06-4.39z" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ArrowButtons({
  onPrev,
  onNext,
  className,
}: {
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}) {
  return (
    <div className={cls('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={onPrev}
        aria-label="Anterior"
        className="rounded-full border border-zinc-700 bg-zinc-900 p-2 text-zinc-200 shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Siguiente"
        className="rounded-full border border-zinc-700 bg-zinc-900 p-2 text-zinc-200 shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

export default function Testimonials({
  items = TESTIMONIALS,
}: {
  items?: Testimonial[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const firstOffset = itemRefs.current[0]?.offsetLeft ?? 0;
      let closest = 0;
      let min = Infinity;
      itemRefs.current.forEach((node, i) => {
        if (!node) return;
        const left = node.offsetLeft - firstOffset;
        const diff = Math.abs(el.scrollLeft - left);
        if (diff < min) {
          min = diff;
          closest = i;
        }
      });
      setIndex(closest);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [items.length]);

  const scrollToIndex = (i: number) => {
    const el = containerRef.current;
    const node = itemRefs.current[i];
    if (!el || !node) return;
    const firstOffset = itemRefs.current[0]?.offsetLeft ?? 0;
    el.scrollTo({ left: node.offsetLeft - firstOffset, behavior: 'smooth' });
  };

  const prev = () => scrollToIndex(Math.max(0, index - 1));
  const next = () => scrollToIndex(Math.min(items.length - 1, index + 1));

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden py-16 sm:py-20"
    >
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="testimonials-heading"
          className="text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
        >
          Testimonios <span className="text-[#C5133D]">Destacados</span>
        </h2>
        <p className="mx-auto mt-4 mb-4 max-w-3xl text-center text-xl text-gray-100">
          Únete a nuestros eventos y desarrolla tus habilidades junto a la
          comunidad de programadores más activa de la Universidad Panamericana.
        </p>

        {/* Desktop arrows (right-aligned) */}
        <ArrowButtons onPrev={prev} onNext={next} className="mb-4 hidden justify-end md:flex" />

        {/* Carousel */}
        <div
          ref={containerRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Carrusel de testimonios"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
          }}
          className={cls(
            'relative flex snap-x snap-mandatory overflow-x-auto scroll-smooth',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          )}
        >
          <ul role="list" className="flex w-full gap-6 pr-6">
            {items.map((t, i) => (
              <li
                key={t.id}
                ref={(el) => (itemRefs.current[i] = el)}
                className={cls('w-[85%] shrink-0 snap-start sm:w-[70%] md:w-[46%] lg:w-[32%]')}
              >
                <TestimonialCard t={t} />
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile arrows (centered) */}
        <ArrowButtons onPrev={prev} onNext={next} className="mt-6 justify-center md:hidden" />

        {/* Dots */}
        <div className="mt-4 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir al slide ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={cls(
                'h-2.5 rounded-full transition',
                i === index ? 'w-6 bg-[#C5133D]' : 'w-2.5 bg-zinc-700'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
