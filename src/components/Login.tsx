"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

type ApiErrorPayload = {
  detail?: string;
  // allow other fields without using `any`
  [key: string]: unknown;
};

function extractDetail(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null && "detail" in data) {
    const v = (data as Record<string, unknown>).detail;
    if (typeof v === "string") return v;
  }
  return undefined;
}

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");           // controlled
  const [password, setPassword] = useState("");     // controlled
  const [remember, setRemember] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // NEW: auth state for /auth/me
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  // Load remembered email + check active session
  useEffect(() => {
    try {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem("algoup_email")
          : null;
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {
      /* ignore storage errors */
    }

    // Check if there's an active session (blocks the form)
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          setAlreadyLoggedIn(true);
          setSuccessMsg("Ya iniciaste sesión en este navegador.");
          // Optional: brief toast then redirect
          setTimeout(() => router.replace("/perfil"), 1200);
        }
      } catch {
        // ignore network errors here
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, [router]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrors({});

    const nextErrors: Record<string, string> = {};

    if (!emailRegex.test(email)) {
      nextErrors.email = "Ingresa un email válido";
    } else if (!email.toLowerCase().endsWith("@up.edu.mx")) {
      nextErrors.email = "El correo debe terminar en @up.edu.mx";
    }
    if (password.length < 8) {
      nextErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    try {
      setSubmitting(true);

      // Remember me (store only email)
      try {
        if (remember) localStorage.setItem("algoup_email", email);
        else localStorage.removeItem("algoup_email");
      } catch {
        /* ignore */
      }

      // Real API call (sets httpOnly cookie)
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          create_session: true,
          ttl_minutes: 60 * 24,
        }),
      });

      if (res.status === 409) {
        const data: unknown = (await res.json().catch(() => null)) as unknown;
        setErrors({
          form:
            extractDetail(data) ||
            "Ya existe una sesión activa. Cierra sesión o usa incógnito.",
        });
        return;
      }

      if (res.status === 401) {
        setErrors({
          form: "Credenciales inválidas. Revisa tu correo y contraseña.",
        });
        return;
      }

      if (!res.ok) {
        const data: unknown = (await res.json().catch(() => null)) as unknown;
        setErrors({ form: extractDetail(data) || "No se pudo iniciar sesión." });
        return;
      }

      setSuccessMsg("¡Sesión iniciada!");
      setTimeout(() => {
        router.push("/perfil");
      }, 800);
    } catch (err: unknown) {
      // `fetch` throws TypeError on network failures; it won't include `status`.
      const message =
        err instanceof Error ? err.message : "No se pudo iniciar sesión.";
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || checkingAuth || alreadyLoggedIn;

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
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]" />

      <div className="mx-auto w-full max-w-md px-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400" />

          <header className="mb-6 text-center">
            <h2 id="login-title" className="text-2xl font-semibold tracking-tight text-white">Inicia sesión</h2>
            <p className="mt-1 text-sm text-white/70">Usa tu correo institucional para entrar.</p>
          </header>

          {checkingAuth && (
            <div className="mb-4 rounded-lg border border-white/20 bg-white/10 p-3 text-white/80">
              Verificando sesión…
            </div>
          )}
          {successMsg && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">{successMsg}</div>
          )}
          {errors.form && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">{errors.form}</div>
          )}
          {alreadyLoggedIn && !checkingAuth && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
              Ya estás autenticado en este navegador. Redirigiendo…
            </div>
          )}

          <form onSubmit={onSubmit} className="grid gap-5">
            <div>
              <label htmlFor="email" className="text-white">Email (@up.edu.mx)</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nombre.apellido@up.edu.mx"
                className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60 disabled:opacity-60"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={disabled}
              />
              {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-white">Contraseña</label>
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
                id="password"
                name="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••••"
                className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60 disabled:opacity-60"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={disabled}
              />
              {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password}</p>}

              <div className="mt-2 flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-white/10"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={disabled}
                  />
                  Recuérdame
                </label>
                <a href="/olvide-contrasena" className="text-sm text-white/80 underline-offset-2 hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={disabled}
              className="ml-auto mt-1 inline-flex items-center justify-center rounded-2xl bg-[#C5133D] px-4 py-2 font-medium text-white transition hover:bg-[#a01032] disabled:opacity-60"
            >
              {submitting ? "Entrando…" : "Iniciar sesión"}
            </button>

            <p className="text-center text-sm text-white/70">
              ¿No tienes cuenta?{" "}
              <a href="/signup" className="text-white underline underline-offset-2">Crear cuenta</a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
