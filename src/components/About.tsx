import MissionPanel from "@/components/MissionPanel";
import MissionBadge from "@/components/MissionBadge";
import FeatureCard from "@/components/FeatureCard";
import ImageCarousel from "@/components/ImageCarousel";

export default function About() {
  return (
    <section
      id="about"
      aria-labelledby="about"
      className="
        relative
        py-20 sm:py-24
      "
    >
    
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-tr from-white via-white to-white"
       />


      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <header className="mx-auto max-w-2xl text-center">
          <h2
            id="about-title"
            className="text-3xl font-extrabold tracking-tight text-gray-800 sm:text-4xl"
          >
            Sobre <span className="text-[#C5133D]">Algoritmia UP</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-xl text-gray-600">
            Somos más que un club de programación: una comunidad de estudiantes apasionados por la tecnología, unidos por el espíritu de la pantera negra de la Universidad Panamericana.
          </p>
        </header>

        {/* Hero grid */}
        <div className="mt-12 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:items-stretch">
          {/* Left: carousel */}
          <ImageCarousel
            images={[
              { src: "/about/icpc_world_finals.jpg", alt: "ICPC World Finals" },
              { src: "/about/contestants_and_balloons.jpg", alt: "Gran Premio De Mexico" },
              { src: "/about/contest_arena.jpg", alt: "Copa Algoritmia 2024" },
            ]}
          />

          {/* Right: Mission */}
          <MissionPanel
            title="Nuestra Misión"
            description="Formar una comunidad de programadores excepcionales capaces de resolver
            problemas complejos mediante algoritmos y estructuras de datos, aplicando el
            pensamiento lógico y creativo que caracteriza a la programación competitiva."
            >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <MissionBadge
                    title="ICPC"
                    desc="Preparación para competencias de talla internacional como el ICPC."
                    icon={<span className="text-base">🎯</span>}
                />
                <MissionBadge
                    title="Prep Interview"
                    desc="Entrenamiento para entrevistas de internships y roles full-time en Big-Tech."
                    icon={<span className="text-base">🧠</span>}
                />
            </div>
          </MissionPanel>
        </div>

        {/* Four pillars */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard title="Habilidades técnicas" icon={<span>⌘</span>}>
            Desarrollarás destrezas avanzadas en algoritmos, estructuras de datos,
            matemáticas y lógica computacional.
          </FeatureCard>

          <FeatureCard title="Trabajo en equipo" icon={<span>👥</span>}>
            Competencias fomentan comunicación y colaboración, trabajando bajo límites
            de tiempo y recursos.
          </FeatureCard>

          <FeatureCard title="Pensamiento crítico" icon={<span>💡</span>}>
            Aprenderás a analizar problemas complejos y resolverlos bajo presión;
            habilidades clave para tu futuro académico y profesional.
          </FeatureCard>

          <FeatureCard title="Impacto profesional" icon={<span>🏅</span>}>
            La experiencia es altamente valorada en la industria; muchas empresas
            líderes buscan perfiles con formación en programación competitiva.
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
