// app/components/Events.tsx
import Image from "next/image";
import { Calendar, MapPin, Clock, Users, ArrowRight } from "lucide-react";

type EventItem = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image: string;
  status: "Próximo" | "Disponible" | "Abierto";
  participants: string;
  href?: string;
};

const EVENTS: EventItem[] = [
    {
    id: 1,
    title: "Copa Algoritmia",
    date: "5 Abril, 2024",
    time: "2:00 PM – 5:00 PM",
    location: "Aula Byte C001",
    description:
      "Demuestra tus habilidades resolviendo problemas algorítmicos complejos.",
    image:
      "https://images.unsplash.com/photo-1565687981296-535f09db714e?q=80&w=1170&auto=format&fit=crop",
    status: "Abierto",
    participants: "Registro abierto",
    href: "#",
  },
  {
    id: 2,
    title: "Workshop: Segment Trees",
    date: "22 Marzo, 2024",
    time: "4:00 PM – 7:00 PM",
    location: "Laboratorio de Sistemas",
    description:
      "Aprende los usos y aplicaciones de Segment Trees and programación competitiva.",
    image:
      "https://images.unsplash.com/photo-1750020113706-b2238de0f18f?q=80&w=1332&auto=format&fit=crop",
    status: "Disponible",
    participants: "45/50 lugares",
    href: "#",
  },
  {
    id: 3,
    title: "Hackathon UP 2025",
    date: "15–17 Marzo, 2024",
    time: "9:00 AM – 6:00 PM",
    location: "Centro de Innovación UP",
    description:
      "48 horas de programación intensiva donde desarrollarás soluciones innovadoras.",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1169&auto=format&fit=crop",
    status: "Próximo",
    participants: "120+ registrados",
    href: "#",
  },
];

function statusClasses(s: EventItem["status"]) {
  if (s === "Próximo") return "bg-red-100 text-red-800";
  if (s === "Disponible") return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-800";
}

function CardContainer(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className = "", ...rest } = props;
  return (
    <div
      className={`overflow-hidden rounded-2xl border-2 border-gray-200 bg-white transition-all duration-300 hover:border-[#C5133D]/40 hover:shadow-xl ${className}`}
      {...rest}
    />
  );
}

function EventCard({ e }: { e: EventItem }) {
  return (
    <CardContainer className="group">
      {/* Image / badge / overlay */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={e.image}
          alt={e.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(
              e.status
            )}`}
          >
            {e.status}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-1 text-sm text-white">
          <Users className="h-4 w-4" />
          <span>{e.participants}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="mb-2 text-xl font-semibold text-black transition-colors group-hover:text-[#C5133D]">
          {e.title}
        </h3>

        <p className="mb-4 text-sm leading-relaxed text-gray-600">
          {e.description}
        </p>

        <div className="mb-5 space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{e.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{e.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{e.location}</span>
          </div>
        </div>

        <a
          href={e.href ?? "#"}
          className="group/button inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C5133D] focus:outline-none focus:ring-2 focus:ring-[#C5133D]/40"
        >
          Registrarse
          <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
        </a>
      </div>
    </CardContainer>
  );
}

export default function EventsSection() {
  return (
    <section id="events" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2
            id="about-title"
            className="text-3xl font-extrabold tracking-tight text-gray-800 sm:text-4xl"
          >
            Eventos y <span className="text-[#C5133D]">Actividades</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-xl text-gray-600">
            Únete a nuestros eventos y desarrolla tus habilidades junto a la
            comunidad de programadores más activa de la Universidad Panamericana.
          </p>
        </div>

        {/* Grid */}
        <div className="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {EVENTS.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-r from-black via-[#7a0f25] to-black p-8 text-white">
            <h3 className="text-2xl font-bold">¿Tienes una idea para un evento?</h3>
            <p className="mt-2 text-gray-300">
              Queremos escucharte. Propón workshops, charlas o competencias que te
              gustaría ver en el club.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-xl bg-[#C5133D] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/40"
              >
                Proponer Evento
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-xl border border-yellow-400 px-5 py-2.5 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400 hover:text-black focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              >
                Ver Calendario Completo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
