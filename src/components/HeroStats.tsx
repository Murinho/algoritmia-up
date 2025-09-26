// components/HeroStats.tsx
import Image from "next/image";

export default function HeroStats() {
  const stats = [
    {
      icon: "👥",
      label: "Miembros",
      value: "+100",
      sublabel: "Activos en la comunidad",
    },
    {
      icon: "💼",
      label: "Big-tech interns",
      value: "+20",
      sublabel: "Google, Netflix, Meta, etc.",
    },
    {
      icon: "🏆",
      label: "Regionales ICPC",
      value: "+15",
      sublabel: "Clasificaciones recientes",
    },
    {
      icon: "🌍",
      label: "Finales Mundiales ICPC",
      value: "6",
      sublabel: "Clasificaciones recientes",
    },
  ];

  const logos = [
    { alt: "Google", src: "/logos/google.png", width: 65, height: 20 },
    { alt: "Meta", src: "/logos/meta_symbol.png", width: 84, height: 32 },
    { alt: "Netflix", src: "/logos/netflix.png", width: 88, height: 24 },
    { alt: "Microsoft", src: "/logos/microsoft.png", width: 88, height: 32 },
    { alt: "Oracle", src: "/logos/oracle.png", width: 96, height: 28 },
    { alt: "Uber", src: "/logos/uber.png", width: 96, height: 32 },
  ];

  function CompanyLogo({ src, alt }: { src: string; alt: string }) {
    return (
      <div
        className="relative h-8 md:h-20 w-[120px] md:w-[140px]
                  opacity-70 grayscale transition duration-200
                  hover:opacity-100 hover:grayscale-0
                  focus-within:opacity-100 focus-within:grayscale-0"
        title={alt}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="(min-width: 768px) 140px, 120px"
          priority
        />
      </div>  
    );
  }
  
  return (
    <section 
    aria-labelledby="stats"
    className="w-full">
      {/* Stats Row */}
      <div className="w-full">
        <div
          id="stats-alumni"
          className="sr-only"
        >
          Estadísticas y empresas de egresados
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-transform hover:-translate-y-0.5"
            >
              {/* subtle top gradient accent */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400 opacity-70" />
              <div className="flex items-center gap-4">
                <div className="text-3xl" aria-hidden>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm/5 text-white/70">{s.label}</div>
                  <div className="mt-0.5 text-3xl font-semibold tracking-tight text-white">
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs text-white/60">{s.sublabel}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alumni Logos */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-white/80">
              Nuestros alumni trabajan en
            </h3>
            <div className="hidden text-xs text-white/50 sm:block">
              *Logos con fines ilustrativos
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6">
            {logos.map((l) => (
              <CompanyLogo key={l.alt} src={l.src} alt={l.alt} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
