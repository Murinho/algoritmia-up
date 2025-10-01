"use client";

import { useEffect, useState } from "react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);

  // preload remembered email
  useEffect(() => {
    const saved = localStorage.getItem("algoup_email");
    if (saved) {
      const el = document.getElementById("email") as HTMLInputElement | null;
      if (el) el.value = saved;
      setRemember(true);
    }
  }, []);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    const nextErrors: Record<string, string> = {};

    // Email validation
    if (!emailRegex.test(email)) {
      nextErrors.email = "Ingresa un email válido";
    } else if (!email.toLowerCase().endsWith("@up.edu.mx")) {
      nextErrors.email = "El correo debe terminar en @up.edu.mx";
    }

    // For login, just require something plausible (no strict complexity here)
    if (password.length < 8) {
      nextErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSubmitting(true);

      // Remember me (store only email)
      if (remember) {
        localStorage.setItem("algoup_email", email);
      } else {
        localStorage.removeItem("algoup_email");
      }

      // TODO: replace with your real API endpoint
      // Example:
      // const res = await fetch("/api/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password }),
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data?.message || "Credenciales inválidas");

      console.log("Login payload", { email, password });
      setSuccessMsg("¡Inicio de sesión válido! (Conecta este submit a tu API)");
      // form.reset(); // optional
    } catch (err: any) {
      setErrors({ form: err?.message || "No se pudo iniciar sesión" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="login-title"
      className="
        relative
        min-h-[100dvh]
        pt-[env(safe-area-inset-top)]
        pb-[env(safe-area-inset-bottom)]
        flex items-center
      "
    >
      {/* Background gradient (same style as SignUp) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
      />

      <div className="mx-auto w-full max-w-md px-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          {/* Top accent bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400" />

          <header className="mb-6 text-center">
            <h2 id="login-title" className="text-2xl font-semibold tracking-tight text-white">
              Inicia sesión
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Usa tu correo institucional para entrar.
            </p>
          </header>

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
            {/* Email */}
            <div>
              <label htmlFor="email" className="text-white">
                Email (@up.edu.mx)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nombre.apellido@up.edu.mx"
                className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                required
                autoComplete="email"
                inputMode="email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-300">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-white">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-xs text-white/70 underline-offset-2 hover:underline"
                  aria-pressed={showPwd}
                >
                  {showPwd ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <input
                id="password"
                name="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                required
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-300">{errors.password}</p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-white/10"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Recuérdame
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm text-white/80 underline-offset-2 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="ml-auto mt-1 inline-flex items-center justify-center rounded-2xl bg-[#C5133D] px-4 py-2 font-medium text-white transition hover:bg-[#a01032] disabled:opacity-60"
            >
              {submitting ? "Entrando…" : "Iniciar sesión"}
            </button>

            <p className="text-center text-sm text-white/70">
              ¿No tienes cuenta?{" "}
              <a
                href="/signup"
                className="text-white underline underline-offset-2"
              >
                Crear cuenta
              </a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
