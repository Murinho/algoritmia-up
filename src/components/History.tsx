"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Users, Trophy } from "lucide-react";

// ---------- Types ----------
type TeamMember = { name: string; role?: string };

type WorldFinal = {
    id: string;
    year: number;
    location: string; // City, Country
    hostCountryFlagUrl: string; // public/flags/{country}.svg
    teamName: string;
    teamMembers: TeamMember[];
    coach: string;
    competition: string;
    photos: { src: string; alt?: string }[];
};

// ---------- Sample Data (replace with real assets) ----------
const WF_DATA: WorldFinal[] = [
  {
    id: "baku-2025",
    year: 2025,
    location: "Bakú, Azerbaiyán",
    hostCountryFlagUrl: "/flags/azerbaijan.png",
    teamName: "UPgraded",
    teamMembers: [
      { name: "Adrián Muro", },
      { name: "Andrés Lomelí" },
      { name: "Erwin López" },
    ],
    coach: "Ricardo Espinosa",
    competition: "ICPC World Finals",
    photos: [
      { src: "/historia/wf2025/1.jpg", alt: "Team photo" },
      { src: "/historia/wf2025/2.jpg", alt: "Rehearsal contest" },
      { src: "/historia/wf2025/3.jpg", alt: "Rehearsal contest" },
    ],
  },
  {
    id: "bahia-2025",
    year: 2025,
    location: "Salvador de Bahía, Brasil",
    hostCountryFlagUrl: "/flags/brazil.png",
    teamName: "UPgraded",
    teamMembers: [
      { name: "Adrián Muro", },
      { name: "Andrés Lomelí" },
      { name: "Erwin López" },
    ],
    coach: "Ricardo Espinosa",
    competition: "ICPC Programadores de America",
    photos: [
      { src: "/historia/pda2025/1.jpg", alt: "Team photo" },
      { src: "/historia/pda2025/2.jpg", alt: "Contest" },
      { src: "/historia/pda2025/3.jpg", alt: "Awards ceremony" },
      { src: "/historia/pda2025/4.jpg", alt: "Awards ceremony" },
    ],
  },
  {
    id: "guadalajara-2024",
    year: 2024,
    location: "Guadalajara, México",
    hostCountryFlagUrl: "/flags/mexico.png",
    teamName: "Arkanian Phoenix",
    teamMembers: [
      { name: "María Pachur", },
      { name: "Ariel de la Cruz" },
      { name: "Constanza Corvera" },
    ],
    coach: "Ricardo Espinosa",
    competition: "ICPC Programadores de América",
    photos: [
      { src: "/historia/pda2024/1.jpg", alt: "Team photo" },
      { src: "/historia/pda2024/2.jpg", alt: "Contest" },
    ],
  },
  {
    id: "luxor-2023",
    year: 2023,
    location: "Luxor, Egipto",
    hostCountryFlagUrl: "/flags/egypt.png",
    teamName: "UPsolving",
    teamMembers: [
      { name: "Héctor Ricárdez", },
      { name: "Víctor Jaramillo" },
      { name: "Fernanda Mancilla" },
    ],
    coach: "Ricardo Espinosa",
    competition: "ICPC World Finals",
    photos: [
      { src: "/historia/wf2023/1.jpg", alt: "Team photo" },
    ],
  },
  {
    id: "dhaka-2021",
    year: 2021,
    location: "Dhaka, Banlgadesh",
    hostCountryFlagUrl: "/flags/bangladesh.png",
    teamName: "UPsolving",
    teamMembers: [
      { name: "Gustavo Meza", },
      { name: "Héctor Ricardez" },
      { name: "Juan Marquina" },
    ],
    coach: "Ricardo Espinosa",
    competition: "ICPC World Finals",
    photos: [
      { src: "/historia/wf2021/1.jpg", alt: "Team photo" },
      { src: "/historia/wf2021/2.jpg", alt: "Contest" },
      { src: "/historia/wf2021/3.jpg", alt: "Team with cup" },
      { src: "/historia/wf2021/4.jpg", alt: "Second Thread and Errichto group photo" },
      { src: "/historia/wf2021/5.jpg", alt: "Group photo at entrance" },
      { src: "/historia/wf2021/6.jpg", alt: "Bike photo" },
    ],
  },
  {
    id: "moscow-2020",
    year: 2020,
    location: "Moscú, Rusia",
    hostCountryFlagUrl: "/flags/russia.png",
    teamName: "UPsolving",
    teamMembers: [
      { name: "Gustavo Meza", },
      { name: "Efrén González" },
      { name: "Manuel Rodríguez" },
    ],
    coach: "Ricardo Espinosa",
    competition: "ICPC World Finals",
    photos: [
      { src: "/historia/wf2020/1.jpg", alt: "Team photo" },
      { src: "/historia/wf2020/2.jpg", alt: "Contest" },
    ],
  },
  {
    id: "ekaterimburg-2014",
    year: 2014,
    location: "Ekaterimburgo, Rusia",
    hostCountryFlagUrl: "/flags/russia.png",
    teamName: "Los Chidory",
    teamMembers: [
      { name: "Fernando Arreola", },
      { name: "Eric Valdivia" },
      { name: "Francisco Gutiérrez" },
    ],
    coach: "Óscar Dávalos",
    competition: "ICPC World Finals",
    photos: [
      { src: "/historia/wf2014/1.jpg", alt: "Team photo" },
      { src: "/historia/wf2014/2.jpg", alt: "Team photo" }, 
      { src: "/historia/wf2014/3.jpg", alt: "Contest" },
      { src: "/historia/wf2014/4.jpg", alt: "Contest" },
    ],
  },
  {
    id: "st'petersburg-2013",
    year: 2013,
    location: "San Petersburgo, Rusia",
    hostCountryFlagUrl: "/flags/russia.png",
    teamName: "AEI",
    teamMembers: [
      { name: "Fernando Arreola", },
      { name: "Eric Valdivia" },
      { name: "Andrea Santillana" },
    ],
    coach: "Óscar Dávalos",
    competition: "ICPC World Finals",
    photos: [
      { src: "/historia/wf2013/1.jpg", alt: "Team photo" },
      { src: "/historia/wf2013/2.jpg", alt: "Contest" }, 
    ],
  },
];

// ---------- Carousel (no external deps) ----------
function Carousel({
  images,
  ariaLabel,
}: {
  images: { src: string; alt?: string }[];
  ariaLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const clamp = useCallback(
    (n: number) => (n < 0 ? images.length - 1 : n >= images.length ? 0 : n),
    [images.length]
  );

  const onPrev = useCallback(() => setIndex((i) => clamp(i - 1)), [clamp]);
  const onNext = useCallback(() => setIndex((i) => clamp(i + 1)), [clamp]);

  // Basic swipe support
  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) {
      dx > 0 ? onPrev() : onNext();
    }
    startX.current = null;
  };

  const trackStyle = useMemo(
    () => ({ transform: `translateX(-${index * 100}%)` }),
    [index]
  );

  return (
    <div className="relative w-full select-none" aria-label={ariaLabel}>
      {/* Frame */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Track */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={trackStyle as React.CSSProperties}
        >
          {images.map((img, i) => (
            <div key={i} className="relative min-w-full aspect-[16/9]">
              <Image
                src={img.src}
                alt={img.alt ?? "World Finals photo"}
                fill
                className="object-cover"
                sizes="100vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={onPrev}
        aria-label="Previous photo"
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 backdrop-blur hover:bg-black/60"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={onNext}
        aria-label="Next photo"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/40 p-2 backdrop-blur hover:bg-black/60"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              index === i ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- World Finals Section ----------
function WorldFinalSection({ wf, flip = false }: { wf: WorldFinal; flip?: boolean }) {
  return (
    <section
      id={wf.id}
      className="relative w-full py-16 sm:py-20 lg:py-24"
      aria-labelledby={`${wf.id}-title`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Accent bar */}
        <div className="mb-8 h-1 w-24 rounded-full bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400" />

        <div
          className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 ${
            flip ? "lg:[&>div:first-child]:order-2" : ""
          }`}
        >
          {/* Left: Carousel */}
          <div>
            <Carousel images={wf.photos} ariaLabel={`${wf.year} photos`} />
          </div>

          {/* Right: Details Card */}
          <div className="relative">
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              {/* top subtle gradient line */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id={`${wf.id}-title`} className="text-2xl font-semibold text-white">
                    {wf.year} · {wf.location}
                  </h2>
                  <p id={`${wf.id}-title`} className="mt-1 inline-flex items-center gap-2 text-sm text-white/80">
                    <Trophy className="h-4 w-4" aria-hidden />
                    <span>{wf.competition}</span>
                  </p>
                </div>

                {/* Flag only */}
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-24 overflow-hidden rounded-sm ring-1 ring-white/20">
                    <Image src={wf.hostCountryFlagUrl} alt="Host flag" fill className="object-cover" />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2 text-white/90">
                  <Users className="h-5 w-5" aria-hidden />
                  <span className="text-base font-medium">{wf.teamName}</span>
                </div>
                <ul className="mt-3 grid grid-cols-1 gap-1 text-sm text-white/80 sm:grid-cols-2">
                  {wf.teamMembers.map((m, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/60" />
                      <span>{m.name}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 font-medium text-white">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/60" />
                    <span>Coach: {wf.coach}</span>
                  </li>
                </ul>

                <div className="mt-6 inline-flex items-center gap-2 text-white/75">
                  <MapPin className="h-4 w-4" aria-hidden />
                  <span>{wf.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- History (All Sections) ----------
export default function History() {
  return (
    <div className="relative w-full">
      {/* Global background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
      />

      {/* Intro Section */}
      <section className="relative w-full py-10 sm:py-12 lg:py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl font-bold text-white">
            Nuestra Historia
          </h1>

          <p className="mt-6 text-lg text-white/80 leading-relaxed">
            La historia de <strong className="text-white"> Algoritmia UP</strong> se escribe con cada equipo 
            que ha llevado nuestro nombre a <strong className="text-white">competencias internacionales</strong>. 
            Esta sección celebra a quienes, con <strong className="text-white">dedicación, disciplina y pasión 
            por el pensamiento algorítmico</strong>, han logrado dejar una <strong className="text-white">huella </strong> 
            y representar a la <strong className="text-white">Universidad Panamericana</strong> en los 
            <strong className="text-white"> escenarios más prestigiosos del mundo</strong>.
          </p>
        </div>
      </section>

      {WF_DATA.map((wf, idx) => (
        <WorldFinalSection key={wf.id} wf={wf} flip={idx % 2 === 1} />
      ))}
    </div>
  );
}
