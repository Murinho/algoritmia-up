"use client";

// Lightweight version: no shadcn/ui, no zod — just React + Tailwind + native inputs
// Keeps the same Algoritmia UP visual style and validations in plain TS/JS.

import { useMemo, useState } from "react";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
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

// Regex rules
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/; // 8–20, 1 uppercase, 1 digit, 1 symbol
const cfRegex = /^[A-Za-z0-9_\-]{3,24}$/; // simple CF handle check

function isValidDate(yyyy: number, mm: number, dd: number) {
  const dt = new Date(yyyy, mm - 1, dd);
  return dt.getFullYear() === yyyy && dt.getMonth() === mm - 1 && dt.getDate() === dd;
}

export default function SignUp() {
  const currentYear = new Date().getFullYear();
  const birthYears = useMemo(() => Array.from({ length: 60 }, (_, i) => String(currentYear - i - 15)), [currentYear]);
  const uniYears = useMemo(() => Array.from({ length: 20 }, (_, i) => String(currentYear - 5 + i)), [currentYear]);
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const fullname = String(fd.get("fullname") || "").trim();
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

    const nextErrors: Record<string, string> = {};

    // Fullname
    if (fullname.length < 3) nextErrors.fullname = "Please enter your full name";

    // Email suffix
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email";
    } else if (!email.toLowerCase().endsWith("@up.edu.mx")) {
      nextErrors.email = "Email must end with @up.edu.mx";
    }

    // Codeforces handle
    if (!cfRegex.test(codeforces)) {
      nextErrors.codeforces = "3–24 chars, letters/numbers/_/-";
    }

    // Birthdate
    if (!isValidDate(birthYear, birthMonth, birthDay)) {
      nextErrors.birthdate = "Invalid birthdate";
    }

    // Degree
    if (!degree) nextErrors.degree = "Choose a program";

    // Entry & Graduation order
    if (!entryMonth || !entryYear) nextErrors.entry = "Select month and year";
    if (!gradMonth || !gradYear) nextErrors.grad = "Select month and year";
    const entryDate = new Date(entryYear, entryMonth - 1, 1);
    const gradDate = new Date(gradYear, gradMonth - 1, 1);
    if (gradDate <= entryDate) nextErrors.grad = "Graduation must be after entry";

    // Password
    if (!passwordRegex.test(password)) {
      nextErrors.password = "8–20 chars, 1 uppercase, 1 symbol, 1 digit";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Shape final payload
    const payload = {
      fullname,
      email,
      codeforces,
      degree,
      birthdate: `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`,
      entryDate: `${entryYear}-${String(entryMonth).padStart(2, "0")}-01`,
      expectedGraduation: `${gradYear}-${String(gradMonth).padStart(2, "0")}-01`,
      password, // hash this on the server
    };

    try {
      setSubmitting(true);
      // TODO: replace with real API call
      console.log("SignUp payload", payload);
      setSuccessMsg("¡Registro válido! (Conecta el submit a tu API)");
      form.reset();
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <section
    aria-labelledby="signup-title"
    className="
        relative
        min-h-[100dvh]
        pt-[env(safe-area-inset-top)]
        pb-[env(safe-area-inset-bottom)]
        flex items-center
      "
    >
    <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]" />
      <div className="mx-auto max-w-3xl px-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400" />

        <header className="mb-6 text-center">
          <h2 id="signup-title" className="text-2xl font-semibold tracking-tight text-white">Únete a Algoritmia UP</h2>
          <p className="mt-1 text-sm text-white/70">Completa tu registro con tu correo institucional.</p>
        </header>

        {successMsg && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-200">{successMsg}</div>
        )}

        <form onSubmit={onSubmit} className="grid gap-6">
          {/* Name & Email */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="fullname" className="text-white">Nombre completo</label>
              <input id="fullname" name="fullname" required minLength={3} placeholder="Tu nombre" className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60" />
              {errors.fullname && <p className="mt-1 text-xs text-red-300">{errors.fullname}</p>}
            </div>
            <div>
              <label htmlFor="email" className="text-white">Email (@up.edu.mx)</label>
              <input id="email" name="email" type="email" required placeholder="nombre.apellido@up.edu.mx" className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60" />
              {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email}</p>}
            </div>
          </div>

          {/* Codeforces & Degree */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="codeforces" className="text-white">Codeforces handle</label>
              <input id="codeforces" name="codeforces" required placeholder="e.g. adrianmuro" className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60" />
              {errors.codeforces && <p className="mt-1 text-xs text-red-300">{errors.codeforces}</p>}
            </div>
            <div>
              <label htmlFor="degree" className="text-white">Programa</label>
              <select id="degree" name="degree" defaultValue="" className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60">
                <option value="" disabled>Selecciona tu programa</option>
                {DEGREE_PROGRAMS.map((p) => (
                  <option key={p} value={p} className="bg-[#1a1a1a]">{p}</option>
                ))}
              </select>
              {errors.degree && <p className="mt-1 text-xs text-red-300">{errors.degree}</p>}
            </div>
          </div>

          {/* Birthdate */}
          <div>
            <label className="text-white">Fecha de nacimiento (día / mes / año)</label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <select name="birthDay" defaultValue="" className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60">
                <option value="" disabled>Día</option>
                {days.map((d) => (
                  <option key={d} value={d} className="bg-[#1a1a1a]">{d}</option>
                ))}
              </select>
              <select name="birthMonth" defaultValue="" className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60">
                <option value="" disabled>Mes</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-[#1a1a1a]">{m.label}</option>
                ))}
              </select>
              <select name="birthYear" defaultValue="" className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60">
                <option value="" disabled>Año</option>
                {birthYears.map((y) => (
                  <option key={y} value={y} className="bg-[#1a1a1a]">{y}</option>
                ))}
              </select>
            </div>
            {errors.birthdate && <p className="mt-1 text-xs text-red-300">{errors.birthdate}</p>}
          </div>

          {/* Entry & Graduation */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-white">Ingreso a la universidad (mes / año)</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <select name="entryMonth" defaultValue="" className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60">
                  <option value="" disabled>Mes</option>
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value} className="bg-[#1a1a1a]">{m.label}</option>
                  ))}
                </select>
                <select name="entryYear" defaultValue="" className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60">
                  <option value="" disabled>Año</option>
                  {uniYears.map((y) => (
                    <option key={y} value={y} className="bg-[#1a1a1a]">{y}</option>
                  ))}
                </select>
              </div>
              {errors.entry && <p className="mt-1 text-xs text-red-300">{errors.entry}</p>}
            </div>
            <div>
              <label className="text-white">Graduación esperada (mes / año)</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <select name="gradMonth" defaultValue="" className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60">
                  <option value="" disabled>Mes</option>
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value} className="bg-[#1a1a1a]">{m.label}</option>
                  ))}
                </select>
                <select name="gradYear" defaultValue="" className="w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60">
                  <option value="" disabled>Año</option>
                  {uniYears.map((y) => (
                    <option key={y} value={y} className="bg-[#1a1a1a]">{y}</option>
                  ))}
                </select>
              </div>
              {errors.grad && <p className="mt-1 text-xs text-red-300">{errors.grad}</p>}
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="text-white">Contraseña</label>
            <input id="password" name="password" type="password" required placeholder="••••••••" className="mt-2 w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#C5133D]/60" />
            <p className="mt-1 text-[11px] text-white/70">8–20 caracteres, incluye al menos 1 mayúscula, 1 símbolo y 1 dígito.</p>
            {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password}</p>}
          </div>

          <button type="submit" disabled={submitting} className="ml-auto mt-2 inline-flex items-center justify-center rounded-2xl bg-[#C5133D] px-4 py-2 font-medium text-white transition hover:bg-[#a01032] disabled:opacity-60">
            {submitting ? "Enviando…" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </section>
  );
}
