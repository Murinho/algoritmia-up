// app/verificar-correo/VerifyEmailClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";

type Status = "idle" | "verifying" | "success" | "error";

type ApiBody = {
  detail?: string;
  message?: string;
};

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>(
    "Procesando enlace de verificación…"
  );

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Falta el token de verificación en el enlace.");
      return;
    }

    setStatus("verifying");
    setMessage("Verificando tu correo…");

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            signal: controller.signal,
          }
        );

        let body: unknown = null;
        try {
          body = await res.json();
        } catch {
          // ignore JSON parse errors; we'll fallback to generic messages
        }

        const typedBody = (body ?? {}) as ApiBody;

        if (!res.ok) {
          const detail =
            typedBody.detail ||
            typedBody.message ||
            "El enlace de verificación no es válido o ha expirado.";
          setStatus("error");
          setMessage(detail);
          return;
        }

        const apiMessage: string =
          typedBody.message ||
          "Correo verificado correctamente. Ya puedes iniciar sesión.";
        setStatus("success");
        setMessage(apiMessage);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setStatus("error");
        setMessage(
          "Ocurrió un error al comunicar con el servidor. Intenta de nuevo."
        );
      }
    })();

    return () => controller.abort();
  }, [searchParams]);

  const isLoading = status === "idle" || status === "verifying";

  const borderColor =
    status === "success"
      ? "border-emerald-500/40"
      : status === "error"
      ? "border-red-500/40"
      : "border-white/15";

  const bgTint =
    status === "success"
      ? "bg-emerald-500/10"
      : status === "error"
      ? "bg-red-500/10"
      : "bg-white/10";

  const title =
    status === "success"
      ? "Correo verificado ✅"
      : status === "error"
      ? "No se pudo verificar tu correo"
      : "Verificando correo…";

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
      />

      <div
        className={`mx-4 max-w-lg rounded-2xl border ${borderColor} ${bgTint} p-6 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.35)] relative`}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400" />

        <header className="mb-4 text-center">
          <h1 className="text-xl font-semibold text-white">{title}</h1>
        </header>

        <p className="mb-6 text-sm text-white/80 text-center">{message}</p>

        <div className="flex flex-col items-center gap-3">
          {isLoading ? (
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-transparent" />
          ) : (
            <>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="inline-flex items-center justify-center rounded-2xl bg-[#C5133D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#a01032]"
              >
                Ir a iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-xs text-white/70 underline-offset-2 hover:underline"
              >
                Volver al inicio
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
