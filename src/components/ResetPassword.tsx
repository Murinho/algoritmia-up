"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/api";

function extractDetail(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null && "detail" in data) {
    const v = (data as Record<string, unknown>).detail;
    if (typeof v === "string") return v;
  }
  return undefined;
}

// Same password rule you’re enforcing in the backend:
// at least 8 chars, 1 lowercase, 1 uppercase, 1 digit, 1 symbol.
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const hasToken = Boolean(token);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrors({});

    const nextErrors: Record<string, string> = {};

    if (!hasToken) {
      nextErrors.form =
        "El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.";
    }

    if (!strongPasswordRegex.test(newPassword)) {
      nextErrors.newPassword =
        "Debe tener al menos 8 caracteres, con mayúsculas, minúsculas, dígitos y un símbolo.";
    }

    if (confirmNewPassword !== newPassword) {
      nextErrors.confirmNewPassword = "Las contraseñas no coinciden.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data: unknown = (await res.json().catch(() => null)) as unknown;
        setErrors({
          form:
            extractDetail(data) ||
            "No se pudo restablecer la contraseña. Intenta de nuevo.",
        });
        return;
      }

      setSuccessMsg("¡Contraseña restablecida con éxito! Redirigiendo al login…");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "No se pudo restablecer la contraseña.";
      setErrors({ form: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || !hasToken;

  return (
    <section
      aria-labelledby="reset-password-title"
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

      <div className="mx-auto w-full max-w-md px-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400" />

          <header className="mb-6 text-center">
            <h2
              id="reset-password-title"
              className="text-2xl font-semibold tracking-tight text-white"
            >
              Restablecer contraseña
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Elige una nueva contraseña para tu cuenta.
            </p>
          </header>

          {!hasToken && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">
              El enlace de recuperación no es válido o ha expirado. Solicita un
              nuevo correo de recuperación.
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">
              {successMsg}
            </div>
          )}

          {errors.form && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">
              {errors.form}
            </div>
          )}

          <form onSubmit={onSubmit} className="grid gap-5">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="new-password" className="text-white">
                  Nueva contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-xs text-white/70 underline-offset-2 hover:underline disabled:opacity-60"
                  aria-pressed={showPwd}
                  disabled={disabled}
                >
                  {showPwd ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <input
                id="new-password"
                name="new-password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••••"
                className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60 disabled:opacity-60"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={disabled}
              />
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-300">{errors.newPassword}</p>
              )}
              <p className="mt-1 text-[11px] text-white/60">
                Debe tener al menos 8 caracteres, incluyendo mayúsculas,
                minúsculas, números y símbolos.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="confirm-new-password" className="text-white">
                  Confirmar nueva contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd((v) => !v)}
                  className="text-xs text-white/70 underline-offset-2 hover:underline disabled:opacity-60"
                  aria-pressed={showConfirmPwd}
                  disabled={disabled}
                >
                  {showConfirmPwd ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <input
                id="confirm-new-password"
                name="confirm-new-password"
                type={showConfirmPwd ? "text" : "password"}
                placeholder="••••••••••"
                className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60 disabled:opacity-60"
                autoComplete="new-password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={disabled}
              />
              {errors.confirmNewPassword && (
                <p className="mt-1 text-xs text-red-300">
                  {errors.confirmNewPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={disabled}
              className="ml-auto mt-1 inline-flex items-center justify-center rounded-2xl bg-[#C5133D] px-4 py-2 font-medium text-white transition hover:bg-[#a01032] disabled:opacity-60"
            >
              {submitting ? "Guardando…" : "Guardar nueva contraseña"}
            </button>

            <p className="text-center text-sm text-white/70">
              ¿Recordaste tu contraseña?{" "}
              <a
                href="/login"
                className="text-white underline underline-offset-2"
              >
                Volver a iniciar sesión
              </a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
