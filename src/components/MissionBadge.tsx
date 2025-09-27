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
      {/* top gradient accent */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-x-0 top-0 h-[2.5px] rounded-t-2xl
          bg-[linear-gradient(90deg,#C5133D_0%,#d946ef_35%,#f59e0b_100%)]
          opacity-90
        "
      />

      <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#C5133D]/15">
        <span className="text-[#C5133D]">{icon ?? "🎯"}</span>
      </div>

      <div className="font-semibold text-gray-800">{title}</div>
      <p className="mt-1 text-sm leading-6 text-gray-600">{desc}</p>
    </div>
  );
}
