// components/MissionPanel.tsx
import { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  children: ReactNode; // put your MissionBadges inside
  className?: string;
};

export default function MissionPanel({ title, description, children, className }: Props) {
  const base =
    "relative overflow-hidden rounded-3xl px-6 py-6 shadow-xl " +
    "bg-white/5 backdrop-blur-md ring-1 ring-white/10";
  const classes = className ? `${base} ${className}` : base;

  return (
    <article className={classes}>
      {/* Top gradient accent */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-x-0 top-0 h-[2.5px] rounded-t-3xl
          bg-[linear-gradient(90deg,#C5133D_0%,#d946ef_35%,#f59e0b_100%)]
          opacity-90
        "
      />
      <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-gray-600">{description}</p>

      <div className="mt-5">
        {children}
      </div>
    </article>
  );
}
