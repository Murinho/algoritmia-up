import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ReiniciarContrasenaPage() {
  return (
    <Suspense
      fallback={
        <section
          className="
            relative
            min-h-[100dvh]
            pt-[env(safe-area-inset-top)]
            pb-[env(safe-area-inset-bottom)]
            flex items-center
          "
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
          />
          <div className="mx-auto w-full max-w-md px-6 text-center text-white/80">
            Cargando formulario de restablecimiento…
          </div>
        </section>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
