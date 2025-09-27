// components/ImageCarousel.tsx
"use client";
import Image from "next/image";
import { useState } from "react";

type Props = {
  images: { src: string; alt: string }[];
};

export default function ImageCarousel({ images }: Props) {
  const [idx, setIdx] = useState(0);
  const go = (dir: -1 | 1) =>
    setIdx((i) => (i + dir + images.length) % images.length);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-black/5 shadow-2xl ring-1 ring-black/5">
      <Image
        src={images[idx].src}
        alt={images[idx].alt}
        width={1200}
        height={800}
        className="h-full w-full object-cover"
        priority
      />
      <button
        aria-label="Anterior"
        onClick={() => go(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-xl bg-zinc-900/80 p-2 text-white backdrop-blur transition hover:bg-zinc-900"
      >
        ‹
      </button>
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
