// components/MissionBadge.tsx
import { ReactNode } from "react";

type Props = {
  title: string;
  desc: string;
  icon?: ReactNode;
  className?: string;
};

export default function MissionBadge({ title, desc, icon, className }: Props) {
  const base =
    "relative overflow-hidden rounded-2xl p-5 " +
    "bg-white/5 backdrop-blur-md shadow-xl ring-1 ring-white/10 " +
    "text-zinc-200";
  const classes = className ? `${base} ${className}` : base;

  return (
    <div className={classes}>
      <div
        aria-hidden
      />

      <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#C5133D]/15">
        <span className="text-[#C5133D]">{icon ?? "🎯"}</span>
      </div>

      <div className="font-semibold text-gray-800">{title}</div>
      <p className="mt-1 text-sm leading-6 text-gray-600">{desc}</p>
    </div>
  );
}
