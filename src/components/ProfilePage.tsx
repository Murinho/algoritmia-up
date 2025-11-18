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
  { code: "af", name: "Afganistán" },
  { code: "al", name: "Albania" },
  { code: "de", name: "Alemania" },
  { code: "ad", name: "Andorra" },
  { code: "ao", name: "Angola" },
  { code: "ag", name: "Antigua y Barbuda" },
  { code: "sa", name: "Arabia Saudita" },
  { code: "dz", name: "Argelia" },
  { code: "ar", name: "Argentina" },
  { code: "am", name: "Armenia" },
  { code: "au", name: "Australia" },
  { code: "at", name: "Austria" },
  { code: "az", name: "Azerbaiyán" },
  { code: "bs", name: "Bahamas" },
  { code: "bh", name: "Baréin" },
  { code: "bd", name: "Bangladés" },
  { code: "bb", name: "Barbados" },
  { code: "be", name: "Bélgica" },
  { code: "bz", name: "Belice" },
  { code: "bj", name: "Benín" },
  { code: "by", name: "Bielorrusia" },
  { code: "bo", name: "Bolivia" },
  { code: "ba", name: "Bosnia y Herzegovina" },
  { code: "bw", name: "Botsuana" },
  { code: "br", name: "Brasil" },
  { code: "bn", name: "Brunéi" },
  { code: "bg", name: "Bulgaria" },
  { code: "bf", name: "Burkina Faso" },
  { code: "bi", name: "Burundi" },
  { code: "bt", name: "Bután" },
  { code: "cv", name: "Cabo Verde" },
  { code: "kh", name: "Camboya" },
  { code: "cm", name: "Camerún" },
  { code: "ca", name: "Canadá" },
  { code: "qa", name: "Catar" },
  { code: "td", name: "Chad" },
  { code: "cl", name: "Chile" },
  { code: "cn", name: "China" },
  { code: "cy", name: "Chipre" },
  { code: "va", name: "Ciudad del Vaticano" },
  { code: "co", name: "Colombia" },
  { code: "km", name: "Comoras" },
  { code: "cg", name: "Congo" },
  { code: "cd", name: "Congo (Rep. Dem.)" },
  { code: "kp", name: "Corea del Norte" },
  { code: "kr", name: "Corea del Sur" },
  { code: "ci", name: "Costa de Marfil" },
  { code: "cr", name: "Costa Rica" },
  { code: "hr", name: "Croacia" },
  { code: "cu", name: "Cuba" },
  { code: "dk", name: "Dinamarca" },
  { code: "dm", name: "Dominica" },
  { code: "ec", name: "Ecuador" },
  { code: "eg", name: "Egipto" },
  { code: "sv", name: "El Salvador" },
  { code: "ae", name: "Emiratos Árabes Unidos" },
  { code: "er", name: "Eritrea" },
  { code: "sk", name: "Eslovaquia" },
  { code: "si", name: "Eslovenia" },
  { code: "es", name: "España" },
  { code: "us", name: "Estados Unidos" },
  { code: "ee", name: "Estonia" },
  { code: "et", name: "Etiopía" },
  { code: "ph", name: "Filipinas" },
  { code: "fi", name: "Finlandia" },
  { code: "fj", name: "Fiyi" },
  { code: "fr", name: "Francia" },
  { code: "ga", name: "Gabón" },
  { code: "gm", name: "Gambia" },
  { code: "ge", name: "Georgia" },
  { code: "gh", name: "Ghana" },
  { code: "gd", name: "Granada" },
  { code: "gr", name: "Grecia" },
  { code: "gt", name: "Guatemala" },
  { code: "gn", name: "Guinea" },
  { code: "gw", name: "Guinea-Bisáu" },
  { code: "gq", name: "Guinea Ecuatorial" },
  { code: "gy", name: "Guyana" },
  { code: "ht", name: "Haití" },
  { code: "hn", name: "Honduras" },
  { code: "hu", name: "Hungría" },
  { code: "in", name: "India" },
  { code: "id", name: "Indonesia" },
  { code: "iq", name: "Irak" },
  { code: "ir", name: "Irán" },
  { code: "ie", name: "Irlanda" },
  { code: "is", name: "Islandia" },
  { code: "mh", name: "Islas Marshall" },
  { code: "sb", name: "Islas Salomón" },
  { code: "il", name: "Israel" },
  { code: "it", name: "Italia" },
  { code: "jm", name: "Jamaica" },
  { code: "jp", name: "Japón" },
  { code: "jo", name: "Jordania" },
  { code: "kz", name: "Kazajistán" },
  { code: "ke", name: "Kenia" },
  { code: "kg", name: "Kirguistán" },
  { code: "ki", name: "Kiribati" },
  { code: "kw", name: "Kuwait" },
  { code: "la", name: "Laos" },
  { code: "ls", name: "Lesoto" },
  { code: "lv", name: "Letonia" },
  { code: "lb", name: "Líbano" },
  { code: "lr", name: "Liberia" },
  { code: "ly", name: "Libia" },
  { code: "li", name: "Liechtenstein" },
  { code: "lt", name: "Lituania" },
  { code: "lu", name: "Luxemburgo" },
  { code: "mg", name: "Madagascar" },
  { code: "my", name: "Malasia" },
  { code: "mw", name: "Malaui" },
  { code: "mv", name: "Maldivas" },
  { code: "ml", name: "Malí" },
  { code: "mt", name: "Malta" },
  { code: "ma", name: "Marruecos" },
  { code: "mu", name: "Mauricio" },
  { code: "mr", name: "Mauritania" },
  { code: "mx", name: "México" },
  { code: "fm", name: "Micronesia" },
  { code: "md", name: "Moldavia" },
  { code: "mc", name: "Mónaco" },
  { code: "mn", name: "Mongolia" },
  { code: "me", name: "Montenegro" },
  { code: "mz", name: "Mozambique" },
  { code: "na", name: "Namibia" },
  { code: "nr", name: "Nauru" },
  { code: "np", name: "Nepal" },
  { code: "ni", name: "Nicaragua" },
  { code: "ne", name: "Níger" },
  { code: "ng", name: "Nigeria" },
  { code: "no", name: "Noruega" },
  { code: "nz", name: "Nueva Zelanda" },
  { code: "om", name: "Omán" },
  { code: "nl", name: "Países Bajos" },
  { code: "pk", name: "Pakistán" },
  { code: "pw", name: "Palaos" },
  { code: "pa", name: "Panamá" },
  { code: "pg", name: "Papúa Nueva Guinea" },
  { code: "py", name: "Paraguay" },
  { code: "pe", name: "Perú" },
  { code: "pl", name: "Polonia" },
  { code: "pt", name: "Portugal" },
  { code: "gb", name: "Reino Unido" },
  { code: "cf", name: "República Centroafricana" },
  { code: "cz", name: "República Checa" },
  { code: "mk", name: "República de Macedonia" },
  { code: "do", name: "República Dominicana" },
  { code: "rw", name: "Ruanda" },
  { code: "ro", name: "Rumania" },
  { code: "ru", name: "Rusia" },
  { code: "ws", name: "Samoa" },
  { code: "kn", name: "San Cristóbal y Nieves" },
  { code: "sm", name: "San Marino" },
  { code: "vc", name: "San Vicente y las Granadinas" },
  { code: "lc", name: "Santa Lucía" },
  { code: "st", name: "Santo Tomé y Príncipe" },
  { code: "sn", name: "Senegal" },
  { code: "rs", name: "Serbia" },
  { code: "sc", name: "Seychelles" },
  { code: "sl", name: "Sierra Leona" },
  { code: "sg", name: "Singapur" },
  { code: "sy", name: "Siria" },
  { code: "so", name: "Somalia" },
  { code: "lk", name: "Sri Lanka" },
  { code: "za", name: "Sudáfrica" },
  { code: "sd", name: "Sudán" },
  { code: "ss", name: "Sudán del Sur" },
  { code: "se", name: "Suecia" },
  { code: "ch", name: "Suiza" },
  { code: "sr", name: "Surinam" },
  { code: "th", name: "Tailandia" },
  { code: "tw", name: "Taiwán" },
  { code: "tz", name: "Tanzania" },
  { code: "tj", name: "Tayikistán" },
  { code: "tl", name: "Timor Oriental" },
  { code: "tg", name: "Togo" },
  { code: "to", name: "Tonga" },
  { code: "tt", name: "Trinidad y Tobago" },
  { code: "tn", name: "Túnez" },
  { code: "tm", name: "Turkmenistán" },
  { code: "tr", name: "Turquía" },
  { code: "tv", name: "Tuvalu" },
  { code: "ua", name: "Ucrania" },
  { code: "ug", name: "Uganda" },
  { code: "uy", name: "Uruguay" },
  { code: "uz", name: "Uzbekistán" },
  { code: "vu", name: "Vanuatu" },
  { code: "ve", name: "Venezuela" },
  { code: "vn", name: "Vietnam" },
  { code: "ye", name: "Yemen" },
  { code: "dj", name: "Yibuti" },
  { code: "zm", name: "Zambia" },
  { code: "zw", name: "Zimbabue" },
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

  // password editing state
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
  });

  // NEW: auth guard state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const router = useRouter();

  // Good default: use env base URL if set; otherwise fall back to relative calls
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";

  // Avatar handling
  const [avatarPreview, setAvatarPreview] = useState<string>("");

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
              u.country && u.country.length === 2
                ? u.country.toLowerCase()
                : prev.countryCode,
            // profile_image_url (raw path from DB)
            avatarUrl: u.profile_image_url ?? prev.avatarUrl,
            role: u.role ?? prev.role,
            createdAt: u.created_at ?? prev.createdAt,
          }));

          if (u.profile_image_url) {
            // full URL for the <img />
            setAvatarPreview(`${API_BASE}${u.profile_image_url}`);
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
  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Local preview (immediate feedback)
    const localUrl = URL.createObjectURL(f);
    setAvatarPreview(localUrl);

    try {
      const formData = new FormData();
      formData.append("file", f);

      const res = await fetch(`${API_BASE}/users/me/avatar`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Avatar upload error:", await res.text());
        alert("No se pudo subir la foto de perfil. Intenta de nuevo.");
        return;
      }

      const data: { profile_image_url: string } = await res.json();

      // Update form state with the DB path
      setForm((prev) => ({
        ...prev,
        avatarUrl: data.profile_image_url,
      }));

      // Use the persisted URL from the backend (overrides the blob preview)
      setAvatarPreview(`${API_BASE}${data.profile_image_url}`);
    } catch (err) {
      console.error("Avatar upload exception:", err);
      alert("Error inesperado al subir la foto de perfil.");
    }
  };


  const handleChange = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handlePasswordChange = (field: keyof typeof passwordForm, value: string) =>
    setPasswordForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);

    try {
      const wantsPasswordChange =
        passwordForm.current || passwordForm.next;

      if (wantsPasswordChange) {
        if (!passwordForm.current || !passwordForm.next) {
          alert("Para cambiar la contraseña, llena todos los campos de contraseña.");
          setSaving(false);
          return;
        }
        if (passwordForm.next.length < 8) {
          alert("La nueva contraseña debe tener al menos 8 caracteres.");
          setSaving(false);
          return;
        }

        const strongPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!strongPwd.test(passwordForm.next)) {
          alert(
            "La nueva contraseña debe incluir al menos una minúscula, una mayúscula, un dígito y un símbolo."
          );
          setSaving(false);
          return;
        }
      }

      const entryYear = Number(form.uniYear);
      const entryMonth = Number(form.uniMonth);
      const gradYear = Number(form.gradYear);
      const gradMonth = Number(form.gradMonth);

      if (
        gradYear < entryYear ||
        (gradYear === entryYear && gradMonth <= entryMonth)
      ) {
        alert(
          "La fecha de graduación debe ser posterior a la fecha de ingreso a la universidad."
        );
        setSaving(false);
        return;
      }

      // --- 1) Build payload for /users/me ---
      const birthdate = `${form.birthYear}-${form.birthMonth}-${form.birthDay}`;

      const profilePayload = {
        full_name: form.fullName.trim(),
        preferred_name: form.preferredName.trim(),
        codeforces_handle: form.codeforces.trim(),
        degree_program: form.program,
        birthdate,
        entry_year: Number(form.uniYear),
        entry_month: Number(form.uniMonth),
        grad_year: Number(form.gradYear),
        grad_month: Number(form.gradMonth),
        country: form.countryCode.toLowerCase(), // DB stores 2-letter code
        // profile_image_url is updated via /users/me/avatar, so we don't send it here
      };

      const resProfile = await fetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      if (!resProfile.ok) {
        let msg = "No se pudo actualizar el perfil. Intenta de nuevo.";
        try {
          const data = await resProfile.json();
          if (data && typeof data.detail === "string") {
            msg = data.detail;
          }
        } catch {
          // ignore JSON parse errors, keep default message
        }
        alert(msg);
        setSaving(false);
        return;
      }

      // --- 2) If user requested password change, call password endpoint ---
      if (wantsPasswordChange) {
        const resPwd = await fetch(`${API_BASE}/auth-identities/me/password`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: passwordForm.current,
            new_password: passwordForm.next,
          }),
        });

        if (!resPwd.ok) {
          const text = await resPwd.text();
          console.error("Password change error:", text);
          alert(
            "El perfil se actualizó, pero no se pudo cambiar la contraseña. Verifica tu contraseña actual."
          );
          setSaving(false);
          return;
        }

        // Password changed successfully -> clear password fields
        setPasswordForm({ current: "", next: ""});
      }

      alert("Perfil actualizado ✅");
    } catch (e) {
      console.error(e);
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
        credentials: "include",
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
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_BASE}/users/me/avatar`, {
                                method: "DELETE",
                                credentials: "include",
                              });
                              if (!res.ok) {
                                console.error("Avatar delete error:", await res.text());
                                alert("No se pudo quitar la foto de perfil.");
                                return;
                              }
                              setAvatarPreview("");
                              setForm((prev) => ({ ...prev, avatarUrl: "" }));
                            } catch (err) {
                              console.error("Avatar delete exception:", err);
                              alert("Error inesperado al quitar la foto de perfil.");
                            }
                          }}
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

                {/* Programa + País side by side */}
                <SelectField
                  label="Programa"
                  value={form.program}
                  onChange={(v) => handleChange("program", v)}
                  options={PROGRAMS.map((p) => ({ value: p, label: p }))}
                  placeholder="Selecciona tu programa"
                />

                <div>
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
              </div>

              {/* Security / password section */}
              <div className="mt-8 border-t border-white/10 pt-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  Seguridad
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  Cambia tu contraseña de Algoritmia UP. Por seguridad, nunca
                  mostramos tu contraseña real.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Current password input for verification */}
                  <div>
                    <Label>Introduce tu contraseña actual</Label>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) =>
                        handlePasswordChange("current", e.target.value)
                      }
                      placeholder="Contraseña actual"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none ring-0 focus:border-white/30"
                    />
                  </div>

                  <div>
                    <Label>Nueva contraseña</Label>
                    <input
                      type="password"
                      value={passwordForm.next}
                      onChange={(e) =>
                        handlePasswordChange("next", e.target.value)
                      }
                      placeholder="Mínimo 8 caracteres"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none ring-0 focus:border-white/30"
                    />
                  </div>
                </div>
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
          Para cambiar otros ajustes de cuenta avanzados, ve a{" "}
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
