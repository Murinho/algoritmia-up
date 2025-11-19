"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/api";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = email.trim().toLowerCase();

    if (!emailRegex.test(trimmed)) {
      setErrorMsg("Ingresa un email válido.");
      return;
    }
    if (!trimmed.endsWith("@up.edu.mx")) {
      setErrorMsg("El correo debe terminar en @up.edu.mx.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${API_BASE}/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      // Backend always responds 200 with generic message if user exists or not.
      if (!res.ok) {
        setErrorMsg(
          "No se pudo procesar la solicitud. Intenta nuevamente más tarde."
        );
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { message?: string }
        | null;

      setSubmitted(true);
      setSuccessMsg(
        data?.message ??
          "Si existe una cuenta asociada a este correo, hemos enviado un enlace para restablecer la contraseña."
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "No se pudo procesar la solicitud. Intenta nuevamente.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-lg shadow-xl p-8 border border-white/20 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400" />

        <h1 className="text-2xl font-semibold text-white text-center mb-2">
          Olvidé mi contraseña
        </h1>
        <p className="text-center text-white/70 mb-6 text-sm">
          Ingresa tu correo institucional y, si existe una cuenta asociada, te
          enviaremos un enlace para restablecer tu contraseña.
        </p>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && submitted && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200 text-sm">
            {successMsg}
          </div>
        )}

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Correo electrónico (@up.edu.mx)
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre.apellido@up.edu.mx"
                className="w-full rounded-lg border border-gray-600 bg-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-[#C5133D] focus:outline-none focus:ring-1 focus:ring-[#C5133D]"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#C5133D] px-4 py-2 font-semibold text-white shadow-md hover:bg-[#a40f33] transition disabled:opacity-60"
            >
              {submitting ? "Enviando…" : "Enviar enlace de reinicio"}
            </button>
          </form>
        ) : (
          <div className="text-center mt-4">
            <p className="text-sm text-white/80 mb-2">
              Si el correo <span className="font-semibold">{email}</span> está
              registrado, recibirás un enlace para restablecer tu contraseña en
              los próximos minutos.
            </p>
            <p className="text-xs text-white/60">
              Revisa también tu carpeta de spam o correo no deseado.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-white/70">
          ¿Recordaste tu contraseña?{" "}
          <a
            href="/login"
            className="text-white underline underline-offset-2"
          >
            Volver a iniciar sesión
          </a>
        </p>
      </div>
    </section>
  );
}
