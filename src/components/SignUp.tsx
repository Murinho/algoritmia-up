"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signupLocal } from "@/lib/auth";
import { HttpError } from "@/lib/api";

const MONTHS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const DEGREE_PROGRAMS = [
  "Ingeniería en Inteligencia Artificial",
  "Ingeniería en Tecnologías de la Información",
  "Ingeniería en Sistemas y Gráficas Computacionales",
  "Ingeniería Industrial",
  "Ingeniería Mecatrónica",
  "Ingeniería en Innovación y Diseño",
  "Matemáticas Aplicadas",
  "Licenciatura en Administración y Finanzas",
  "Otro",
];

const COUNTRY_OPTIONS = [
  { code: "mx", name: "México" },
  { code: "ar", name: "Argentina" },
  { code: "bo", name: "Bolivia" },
  { code: "br", name: "Brasil" },
  { code: "cl", name: "Chile" },
  { code: "co", name: "Colombia" },
  { code: "cr", name: "Costa Rica" },
  { code: "cu", name: "Cuba" },
  { code: "do", name: "República Dominicana" },
  { code: "ec", name: "Ecuador" },
  { code: "sv", name: "El Salvador" },
  { code: "gt", name: "Guatemala" },
  { code: "hn", name: "Honduras" },
  { code: "ni", name: "Nicaragua" },
  { code: "pa", name: "Panamá" },
  { code: "py", name: "Paraguay" },
  { code: "pe", name: "Perú" },
  { code: "uy", name: "Uruguay" },
  { code: "ve", name: "Venezuela" },
  { code: "us", name: "Estados Unidos" },
  { code: "ca", name: "Canadá" },
  { code: "es", name: "España" },
  { code: "fr", name: "Francia" },
  { code: "de", name: "Alemania" },
  { code: "gb", name: "Reino Unido" },
  { code: "it", name: "Italia" },
  { code: "pt", name: "Portugal" },
  { code: "jp", name: "Japón" },
  { code: "kr", name: "Corea del Sur" },
  { code: "cn", name: "China" },
  { code: "in", name: "India" },
  { code: "other", name: "Otro" },
];

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/;
const cfRegex = /^[A-Za-z0-9_\-]{3,24}$/;

function isValidDate(yyyy: number, mm: number, dd: number) {
  const dt = new Date(yyyy, mm - 1, dd);
  return dt.getFullYear() === yyyy && dt.getMonth() === mm - 1 && dt.getDate() === dd;
}

// Good default: use env base URL if set; otherwise fall back to relative calls
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";

export default function SignUp() {
  const currentYear = new Date().getFullYear();
  const birthYears = useMemo(
    () => Array.from({ length: 60 }, (_, i) => String(currentYear - i - 15)),
    [currentYear]
  );
  const uniYears = useMemo(
    () => Array.from({ length: 20 }, (_, i) => String(currentYear - 5 + i)),
    [currentYear]
  );
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

  const router = useRouter();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // NEW: auth guard state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // NEW: Check if there is already an active session; if so, block signup
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (cancelled) return;

        if (res.ok) {
          // User already logged in → do not show SignUp, redirect instead
          setAuthMessage("Ya tienes una sesión activa. Redirigiendo a tu perfil…");
          redirectTimer.current = setTimeout(() => {
            router.replace("/perfil");
          }, 900);
        } else {
          // Not authenticated → allow signup form
          setAuthMessage(null);
        }
      } catch {
        if (!cancelled) {
          // Treat network error as "not logged in" and allow signup
          setAuthMessage(null);
        }
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    })();

    return () => {
      cancelled = true;
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [router]);

  const disabled = submitting;

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSuccessMsg(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const fullname = String(fd.get("fullname") || "").trim();
    const preferredName = String(fd.get("preferredName") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const codeforces = String(fd.get("codeforces") || "").trim();

    const birthDay = Number(fd.get("birthDay"));
    const birthMonth = Number(fd.get("birthMonth"));
    const birthYear = Number(fd.get("birthYear"));

    const degree = String(fd.get("degree") || "");
    const entryMonth = Number(fd.get("entryMonth"));
    const entryYear = Number(fd.get("entryYear"));
    const gradMonth = Number(fd.get("gradMonth"));
    const gradYear = Number(fd.get("gradYear"));
    const password = String(fd.get("password") || "");
    const country = String(fd.get("country") || "");

    const nextErrors: Record<string, string> = {};

    if (fullname.length < 3) nextErrors.fullname = "Por favor, ingresa tu nombre completo";
    if (!preferredName) nextErrors.preferredName = "El nombre preferido es obligatorio";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Ingresa un correo válido";
    } else if (!email.toLowerCase().endsWith("@up.edu.mx")) {
      nextErrors.email = "Debe terminar con @up.edu.mx";
    }

    if (!cfRegex.test(codeforces)) nextErrors.codeforces = "3–24 caracteres, letras/números/_/-";
    if (!(birthYear && birthMonth && birthDay) || !isValidDate(birthYear, birthMonth, birthDay)) {
      nextErrors.birthdate = "Fecha inválida";
    }
    if (!degree) nextErrors.degree = "Selecciona un programa";
    if (!country) nextErrors.country = "Selecciona tu país de origen";

    if (!entryMonth || !entryYear) nextErrors.entry = "Selecciona mes y año";
    if (!gradMonth || !gradYear) nextErrors.grad = "Selecciona mes y año";
    const entryDate = new Date(entryYear, entryMonth - 1, 1);
    const gradDate = new Date(gradYear, gradMonth - 1, 1);
    if (entryMonth && entryYear && gradMonth && gradYear && gradDate <= entryDate) {
      nextErrors.grad = "Graduación debe ser posterior al ingreso";
    }

    if (!passwordRegex.test(password)) {
      nextErrors.password = "8–20 caracteres, 1 mayúscula, 1 símbolo, 1 dígito";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      full_name: fullname,
      preferred_name: preferredName,
      email,
      codeforces_handle: codeforces,
      birthdate: `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(
        birthDay
      ).padStart(2, "0")}`,
      degree_program: degree,
      entry_year: entryYear,
      entry_month: entryMonth,
      grad_year: gradYear,
      grad_month: gradMonth,
      country,
      profile_image_url: null,
      password,
    } as const;

    try {
      setSubmitting(true);
      await signupLocal(payload);

      setSuccessMsg("¡Cuenta creada! Redirigiendo a inicio de sesión…");

      form.reset();

      setErrors({});

      redirectTimer.current = setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Signup error object:", err);
      const fieldErrors: Record<string, string> = {};
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setSuccessMsg(null);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Early guard UI =====
  if (checkingAuth) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]">
        <div className="rounded-xl border border-white/15 bg-white/10 px-6 py-4 text-white/90 backdrop-blur">
          Verificando sesión…
        </div>
      </div>
    );
  }

  if (authMessage) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-emerald-200 backdrop-blur">
          {authMessage}
        </div>
      </div>
    );
  }

  // ===== Normal SignUp UI (only when NOT logged in) =====
  return (
    <section
      aria-labelledby="signup-title"
      className="relative min-h-[100dvh] flex items-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
      />
      <div className="mx-auto max-w-3xl px-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.25)] relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400" />

        <header className="mb-6 text-center">
          <h2 id="signup-title" className="text-2xl font-semibold tracking-tight text-white">
            Únete a Algoritmia UP
          </h2>
          <p className="mt-1 text-sm text-white/70">
            Completa tu registro con tu correo institucional.
          </p>
        </header>

        {successMsg && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">
            {successMsg}
          </div>
        )}
        {errors._ && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">
            {errors._}
          </div>
        )}

        <form onSubmit={onSubmit} className="grid gap-6">
          <fieldset disabled={disabled} className="contents">
            {/* Fullname, Preferred Name & Email */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="fullname" className="text-white">
                  Nombre completo
                </label>
                <input
                  id="fullname"
                  name="fullname"
                  required
                  minLength={3}
                  placeholder="Tu nombre completo"
                  className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                />
                {errors.fullname && (
                  <p className="mt-1 text-xs text-red-300">{errors.fullname}</p>
                )}
              </div>
              <div>
                <label htmlFor="email" className="text-white">
                  Email (@up.edu.mx)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="nombre.apellido@up.edu.mx"
                  className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-300">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Preferred Name & Degree */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="preferredName" className="text-white">
                  Nombre preferido
                </label>
                <input
                  id="preferredName"
                  name="preferredName"
                  required
                  placeholder="Como te gusta que te llamen"
                  className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                />
                {errors.preferredName && (
                  <p className="mt-1 text-xs text-red-300">{errors.preferredName}</p>
                )}
              </div>
              <div>
                <label htmlFor="degree" className="text-white">
                  Programa
                </label>
                <select
                  id="degree"
                  name="degree"
                  defaultValue=""
                  className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                >
                  <option value="" disabled>
                    Selecciona tu programa
                  </option>
                  {DEGREE_PROGRAMS.map((p) => (
                    <option key={p} value={p} className="bg-[#1a1a1a]">
                      {p}
                    </option>
                  ))}
                </select>
                {errors.degree && (
                  <p className="mt-1 text-xs text-red-300">{errors.degree}</p>
                )}
              </div>
            </div>

            {/* Birthdate */}
            <div>
              <label className="text-white">
                Fecha de nacimiento (día / mes / año)
              </label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <select
                  name="birthDay"
                  defaultValue=""
                  className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                >
                  <option value="" disabled>
                    Día
                  </option>
                  {days.map((d) => (
                    <option key={d} value={d} className="bg-[#1a1a1a]">
                      {d}
                    </option>
                  ))}
                </select>
                <select
                  name="birthMonth"
                  defaultValue=""
                  className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                >
                  <option value="" disabled>
                    Mes
                  </option>
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value} className="bg-[#1a1a1a]">
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  name="birthYear"
                  defaultValue=""
                  className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                >
                  <option value="" disabled>
                    Año
                  </option>
                  {birthYears.map((y) => (
                    <option key={y} value={y} className="bg-[#1a1a1a]">
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {errors.birthdate && (
                <p className="mt-1 text-xs text-red-300">{errors.birthdate}</p>
              )}
            </div>

            {/* Entry & Graduation */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-white">
                  Ingreso a la universidad (mes / año)
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <select
                    name="entryMonth"
                    defaultValue=""
                    className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                  >
                    <option value="" disabled>
                      Mes
                    </option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-[#1a1a1a]">
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    name="entryYear"
                    defaultValue=""
                    className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                  >
                    <option value="" disabled>
                      Año
                    </option>
                    {uniYears.map((y) => (
                      <option key={y} value={y} className="bg-[#1a1a1a]">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.entry && (
                  <p className="mt-1 text-xs text-red-300">{errors.entry}</p>
                )}
              </div>
              <div>
                <label className="text-white">
                  Graduación esperada (mes / año)
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <select
                    name="gradMonth"
                    defaultValue=""
                    className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                  >
                    <option value="" disabled>
                      Mes
                    </option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value} className="bg-[#1a1a1a]">
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    name="gradYear"
                    defaultValue=""
                    className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                  >
                    <option value="" disabled>
                      Año
                    </option>
                    {uniYears.map((y) => (
                      <option key={y} value={y} className="bg-[#1a1a1a]">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.grad && (
                  <p className="mt-1 text-xs text-red-300">{errors.grad}</p>
                )}
              </div>
            </div>

            {/* Country of origin and codeforces */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="codeforces" className="text-white">
                  Codeforces handle
                </label>
                <input
                  id="codeforces"
                  name="codeforces"
                  required
                  placeholder="e.g. adrianmuro"
                  className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                />
                {errors.codeforces && (
                  <p className="mt-1 text-xs text-red-300">{errors.codeforces}</p>
                )}
              </div>
              <div>
                <label htmlFor="country" className="text-white">
                  País de origen
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  defaultValue=""
                  className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                >
                  <option value="" disabled>
                    Selecciona tu país
                  </option>
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#1a1a1a]">
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="mt-1 text-xs text-red-300">{errors.country}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="password" className="text-white">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60"
                />
                <p className="mt-1 text-[11px] text-white/70">
                  8–20 caracteres, incluye al menos 1 mayúscula, 1 símbolo y 1
                  dígito.
                </p>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-300">{errors.password}</p>
                )}
              </div>
              <div className="hidden md:block" />
            </div>

            <button
              type="submit"
              disabled={disabled}
              className="ml-auto mt-2 inline-flex items-center justify-center rounded-2xl bg-[#C5133D] px-4 py-2 font-medium text-white transition hover:bg-[#a01032] disabled:opacity-60"
            >
              {submitting ? "Enviando…" : "Crear cuenta"}
            </button>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
