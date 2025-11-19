"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

type Props = {
  images: { src: string; alt: string }[];
};

export default function ImageCarousel({ images }: Props) {
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const go = (dir: -1 | 1) =>
    setIdx((i) => (i + dir + images.length) % images.length);

  const start = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => go(1), 5000);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stop();
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-black/5 shadow-2xl ring-1 ring-black/5"
      onMouseEnter={start}
      onMouseLeave={stop}
    >
      {/* Image stack with crossfade */}
      <div className="relative aspect-[3/2] w-full">
        {images.map((img, i) => (
          <Image
            key={img.src}
            src={img.src}
            alt={img.alt}
            width={1200}
            height={800}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
              i === idx ? "opacity-100" : "opacity-0"
            }`}
            priority={i === 0}
          />
        ))}
      </div>

      {/* Prev */}
      <button
        aria-label="Anterior"
        onClick={() => go(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-xl bg-zinc-900/80 p-2 text-white backdrop-blur transition hover:bg-zinc-900"
      >
        ‹
      </button>

      {/* Next */}
      <button
        aria-label="Siguiente"
        onClick={() => go(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl bg-[#C5133D] p-2 text-white shadow-lg transition hover:brightness-110"
      >
        ›
      </button>
    </div>
  );
}
