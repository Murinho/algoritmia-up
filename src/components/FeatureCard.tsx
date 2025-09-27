import { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
};

export default function FeatureCard({ icon, title, children, className }: Props) {
  const base =
    "relative rounded-2xl shadow-xl ring-1 " +
    "bg-white/5 backdrop-blur-sm ring-white/10 hover:shadow-2xl " +
    "text-black overflow-hidden"; // overflow to clip the gradient bar corners
  const classes = className ? `${base} ${className}` : base;

  return (
    <article className={classes}>
      {/* Top gradient accent */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-x-0 top-0 h-[2.5px] rounded-t-2xl
          bg-[linear-gradient(90deg,#C5133D_0%,#d946ef_35%,#f59e0b_100%)]
          opacity-90
        "
      />
      <div className="px-6 py-6">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#C5133D]/15">
          <span className="text-[#C5133D]">{icon}</span>
        </div>

        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-gray-600">{children}</p>
      </div>
    </article>
  );
}
