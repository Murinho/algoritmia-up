"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ---- Mock: replace with real user data from your API/auth ----
const mockUser = {
  fullName: "Adrián Muro",
  preferredName: "Adrián",
  email: "adrian.muro@up.edu.mx",
  codeforces: "adrianmuro",
  program: "Ingeniería en IA",
  // birthdate -> split in UI
  birthDay: "12",
  birthMonth: "08",
  birthYear: "2002",
  // entry_year / entry_month
  uniMonth: "08",
  uniYear: "2021",
  // grad_year / grad_month
  gradMonth: "05",
  gradYear: "2026",
  // country (DB) <-> countryCode (UI)
  countryCode: "mx", // ISO 3166-1 alpha-2 lowercase (for flagcdn)
  avatarUrl: "", // profile_image_url in DB

  // Non-editable in DB; may be shown read-only later if you want
  role: "user",
  createdAt: "",
};

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

// Example programs; replace with your real catalog
const PROGRAMS = [
  "Ingeniería en IA",
  "Ingeniería en Computación",
  "Matemáticas",
  "Otra",
];

const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: "mx", name: "México" },
  { code: "us", name: "Estados Unidos" },
  { code: "ca", name: "Canadá" },
  { code: "br", name: "Brasil" },
  { code: "ar", name: "Argentina" },
  { code: "es", name: "España" },
  { code: "fr", name: "Francia" },
  { code: "de", name: "Alemania" },
  { code: "it", name: "Italia" },
  { code: "gb", name: "Reino Unido" },
  // agrega los que necesites…
];

function yearsRange(from = 1980, to = new Date().getFullYear() + 8) {
  const arr: string[] = [];
  for (let y = to; y >= from; y--) arr.push(String(y));
  return arr;
}

export default function ProfilePage() {
  const [form, setForm] = useState({ ...mockUser });
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // NEW: auth guard state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const router = useRouter();

  // Good default: use env base URL if set; otherwise fall back to relative calls
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";

  // Avatar handling
  const [avatarPreview, setAvatarPreview] = useState<string>(
    mockUser.avatarUrl || ""
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const DAYS = useMemo(
    () => Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")),
    []
  );
  const BIRTH_YEARS = useMemo(
    () => yearsRange(1980, new Date().getFullYear() - 10),
    []
  );
  const UNI_YEARS = useMemo(
    () => yearsRange(2005, new Date().getFullYear() + 1),
    []
  );
  const GRAD_YEARS = useMemo(
    () => yearsRange(2008, new Date().getFullYear() + 8),
    []
  );

  // Helper to parse YYYY-MM-DD into (day, month, year)
  const parseDateParts = (iso: string | null | undefined) => {
    if (!iso) return null;
    const parts = iso.split("-");
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    return {
      year: year,
      month: month.padStart(2, "0"),
      day: day.padStart(2, "0"),
    };
  };

  // NEW: Block page if no active session, hydrate if authenticated
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          // not authenticated -> show small notice and redirect
          if (!cancelled) {
            setAuthError("No hay sesión activa. Redirigiendo al login…");
            setTimeout(() => router.replace("/login"), 900);
          }
          return;
        }
        // Optional: hydrate from backend user
        const data = await res.json();
        const u = data?.user;
        if (!cancelled && u) {
          const birth = parseDateParts(u.birthdate);
          setForm((prev) => ({
            ...prev,
            fullName: u.full_name ?? prev.fullName,
            preferredName: u.preferred_name ?? prev.preferredName,
            email: u.email ?? prev.email,
            codeforces: u.codeforces_handle ?? prev.codeforces,
            program: u.degree_program ?? prev.program,
            // birthdate
            birthDay: birth?.day ?? prev.birthDay,
            birthMonth: birth?.month ?? prev.birthMonth,
            birthYear: birth?.year ?? prev.birthYear,
            // entry_year / entry_month
            uniYear:
              (u.entry_year ? String(u.entry_year) : undefined) ?? prev.uniYear,
            uniMonth:
              (u.entry_month
                ? String(u.entry_month).padStart(2, "0")
                : undefined) ?? prev.uniMonth,
            // grad_year / grad_month
            gradYear:
              (u.grad_year ? String(u.grad_year) : undefined) ?? prev.gradYear,
            gradMonth:
              (u.grad_month
                ? String(u.grad_month).padStart(2, "0")
                : undefined) ?? prev.gradMonth,
            // country
            countryCode:
              // You can store ISO codes in DB or map from names as needed
              u.country
                ? u.country.length === 2
                  ? u.country.toLowerCase()
                  : prev.countryCode
                : prev.countryCode,
            // profile_image_url
            avatarUrl: u.profile_image_url ?? prev.avatarUrl,
            // non-editable but maybe useful later
            role: u.role ?? prev.role,
            createdAt: u.created_at ?? prev.createdAt,
          }));
          if (u.profile_image_url) {
            setAvatarPreview(u.profile_image_url);
          }
        }
      } catch {
        if (!cancelled) {
          setAuthError("No hay sesión activa. Redirigiendo al login…");
          setTimeout(() => router.replace("/login"), 900);
        }
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API_BASE, router]);

  const onPickAvatar = () => fileInputRef.current?.click();
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setAvatarPreview(url);
    // TODO: keep file in state if you want to upload it later
  };

  const handleChange = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO:
      // Map the UI fields back to your API payload:
      // full_name, preferred_name, email, codeforces_handle,
      // birthdate (YYYY-MM-DD from birthYear/birthMonth/birthDay),
      // degree_program, entry_year, entry_month,
      // grad_year, grad_month, country, profile_image_url
      //
      // Example (pseudo):
      /*
      const payload = {
        full_name: form.fullName,
        preferred_name: form.preferredName,
        email: form.email,
        codeforces_handle: form.codeforces,
        birthdate: `${form.birthYear}-${form.birthMonth}-${form.birthDay}`,
        degree_program: form.program,
        entry_year: Number(form.uniYear),
        entry_month: Number(form.uniMonth),
        grad_year: Number(form.gradYear),
        grad_month: Number(form.gradMonth),
        country: mapCountryCodeToName(form.countryCode), // or store code directly
        profile_image_url: form.avatarUrl,
      };
      await fetch(`${API_BASE}/users/me`, { method: "PATCH", ... });
      */
      await new Promise((r) => setTimeout(r, 800)); // demo
      alert("Perfil actualizado ✅");
    } catch (e) {
      alert("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include", // ⬅️ important: send cookies
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        console.warn("Logout responded non-2xx:", await res.text());
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("algoup_email");
      }
      router.replace("/login");
    } catch (err) {
      console.error("Logout error:", err);
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  // Early guard UI
  if (checkingAuth) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]">
        <div className="rounded-xl border border-white/15 bg-white/10 px-6 py-4 text-white/90 backdrop-blur">
          Verificando sesión…
        </div>
      </div>
    );
  }
  if (authError) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-amber-200 backdrop-blur">
          {authError}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100svh] w-full">
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D]"
      />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        {/* Top bar with Logout */}
        <div className="mb-3 flex justify-end">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10 disabled:opacity-60"
            title="Cerrar sesión"
          >
            {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>

        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Tu perfil
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Visualiza y edita tu información personal de Algoritmia UP.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur">
          {/* thin gradient bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#C5133D] via-fuchsia-500 to-amber-400" />

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-5">
            {/* Left: avatar card */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-white/20">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Foto de perfil"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/5 text-4xl">
                        👤
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Foto de perfil</p>
                    <p className="text-xs text-white/60">
                      Sube una imagen cuadrada (recomendado 512×512).
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={onPickAvatar}
                        className="rounded-xl bg-[#C5133D] px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none"
                      >
                        Cambiar foto
                      </button>
                      {avatarPreview && (
                        <button
                          onClick={() => setAvatarPreview("")}
                          className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                  </div>
                </div>

                {/* Country quick view */}
                <div className="mt-6 flex items-center gap-3">
                  <CountryFlag code={form.countryCode} />
                  <span className="text-sm text-white/80">
                    País de origen:{" "}
                    <strong>
                      {COUNTRIES.find((c) => c.code === form.countryCode)?.name ??
                        "—"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre completo"
                  value={form.fullName}
                  onChange={(v) => handleChange("fullName", v)}
                  placeholder="Tu nombre completo"
                />
                <Field
                  label="Nombre preferido"
                  value={form.preferredName}
                  onChange={(v) => handleChange("preferredName", v)}
                  placeholder="Cómo quieres que te llamemos"
                />

                <Field
                  label="Email institucional"
                  value={form.email}
                  onChange={(v) => handleChange("email", v)}
                  placeholder="nombre.apellido@up.edu.mx"
                />

                <Field
                  label="Codeforces handle"
                  value={form.codeforces}
                  onChange={(v) => handleChange("codeforces", v)}
                  placeholder="e.g. adrianmuro"
                />

                <SelectField
                  label="Programa"
                  value={form.program}
                  onChange={(v) => handleChange("program", v)}
                  options={PROGRAMS.map((p) => ({ value: p, label: p }))}
                  placeholder="Selecciona tu programa"
                />

                {/* Fecha de nacimiento */}
                <div className="sm:col-span-2">
                  <Label>Fecha de nacimiento</Label>
                  <div className="mt-1 grid grid-cols-3 gap-3">
                    <SelectField
                      label=""
                      hideLabel
                      value={form.birthDay}
                      onChange={(v) => handleChange("birthDay", v)}
                      options={DAYS.map((d) => ({
                        value: d,
                        label: String(Number(d)),
                      }))}
                      placeholder="Día"
                    />
                    <SelectField
                      label=""
                      hideLabel
                      value={form.birthMonth}
                      onChange={(v) => handleChange("birthMonth", v)}
                      options={MONTHS}
                      placeholder="Mes"
                    />
                    <SelectField
                      label=""
                      hideLabel
                      value={form.birthYear}
                      onChange={(v) => handleChange("birthYear", v)}
                      options={BIRTH_YEARS.map((y) => ({ value: y, label: y }))}
                      placeholder="Año"
                    />
                  </div>
                </div>

                {/* Ingreso a la universidad -> entry_year / entry_month */}
                <div className="sm:col-span-2">
                  <Label>Ingreso a la universidad</Label>
                  <div className="mt-1 grid grid-cols-2 gap-3">
                    <SelectField
                      label=""
                      hideLabel
                      value={form.uniMonth}
                      onChange={(v) => handleChange("uniMonth", v)}
                      options={MONTHS}
                      placeholder="Mes"
                    />
                    <SelectField
                      label=""
                      hideLabel
                      value={form.uniYear}
                      onChange={(v) => handleChange("uniYear", v)}
                      options={UNI_YEARS.map((y) => ({ value: y, label: y }))}
                      placeholder="Año"
                    />
                  </div>
                </div>

                {/* Graduación esperada -> grad_year / grad_month */}
                <div className="sm:col-span-2">
                  <Label>Graduación esperada</Label>
                  <div className="mt-1 grid grid-cols-2 gap-3">
                    <SelectField
                      label=""
                      hideLabel
                      value={form.gradMonth}
                      onChange={(v) => handleChange("gradMonth", v)}
                      options={MONTHS}
                      placeholder="Mes"
                    />
                    <SelectField
                      label=""
                      hideLabel
                      value={form.gradYear}
                      onChange={(v) => handleChange("gradYear", v)}
                      options={GRAD_YEARS.map((y) => ({ value: y, label: y }))}
                      placeholder="Año"
                    />
                  </div>
                </div>

                {/* País de origen -> country */}
                <div className="sm:col-span-2">
                  <Label>País de origen</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <CountryFlag code={form.countryCode} />
                    <SelectField
                      label=""
                      hideLabel
                      value={form.countryCode}
                      onChange={(v) => handleChange("countryCode", v)}
                      options={COUNTRIES.map((c) => ({
                        value: c.code,
                        label: c.name,
                      }))}
                      placeholder="Selecciona tu país"
                    />
                  </div>
                </div>

                {/* Password typically handled elsewhere; omit here for security */}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-xl border border-white/20 px-5 py-2.5 text-sm text-white/90 hover:bg-white/10"
                >
                  Descartar cambios
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-[#C5133D] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Optional: tips / footer */}
        <p className="mx-auto mt-6 max-w-5xl text-center text-xs text-white/60">
          Para cambiar tu contraseña u otros ajustes avanzados, ve a{" "}
          <span className="text-white">Ajustes de cuenta</span>.
        </p>
      </section>
    </div>
  );
}

/* ————— Small UI atoms ————— */

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm text-white/80">{children}</label>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none ring-0 focus:border-white/30 ${
          readOnly ? "opacity-70" : ""
        }`}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  hideLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  hideLabel?: boolean;
}) {
  return (
    <div>
      {!hideLabel && <Label>{label}</Label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full appearance-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
      >
        <option value="" disabled>
          {placeholder ?? "Selecciona"}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#141414]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CountryFlag({ code }: { code: string }) {
  // FlagCDN (SVG). Example: https://flagcdn.com/mx.svg
  return (
    <img
      src={
        code
          ? `https://flagcdn.com/${code}.svg`
          : `https://flagcdn.com/placeholder.svg`
      }
      alt="Bandera"
      width={28}
      height={20}
      className="h-5 w-7 rounded shadow-sm ring-1 ring-white/10"
    />
  );
}
