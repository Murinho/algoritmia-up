"use client";

import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    // In the future: connect API to send reset email
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0D0D0D] via-[#2c1e28] to-[#C5133D] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-lg shadow-xl p-8 border border-white/20">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Olvidé mi contraseña
        </h1>
        <p className="text-center text-gray-300 mb-6">
          Ingresa tu correo electrónico y te enviaremos un link para reiniciar tu contraseña.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-200 mb-1"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@up.edu.mx"
                className="w-full rounded-lg border border-gray-600 bg-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-[#C5133D] focus:outline-none focus:ring-1 focus:ring-[#C5133D]"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#C5133D] px-4 py-2 font-semibold text-white shadow-md hover:bg-[#a40f33] transition"
            >
              Enviar
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-green-300 font-medium mb-4">
              ✅ Un link de reinicio de contraseña ha sido enviado a:
            </p>
            <p className="text-white font-semibold">{email}</p>
          </div>
        )}
      </div>
    </section>
  );
}
