'use client';

import { Mail, MapPin, Phone } from 'lucide-react';
import { FaInstagram, FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

export default function Contact() {
  return (
    <section 
      id="contact"
      className="relative py-20 bg-gradient-to-tr from-[#0D0D0D] via-[#2c1e28] to-[#B5133D]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 ">
        {/* LEFT SIDE */}
        <div>
          <h2 className="text-3xl font-bold text-white">
            Conecta con <span className="text-[#C5133D]">nosotros</span>
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            ¿Listo para unirte a la familia de programadores más feroz de la UP?
            Contáctanos y comienza tu aventura en el mundo del código.
          </p>

          <ul role="list" className="mt-10 space-y-6">
            <li className="flex gap-x-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#C5133D] to-[#2c1e28] text-white">
                <Mail className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-semibold text-white">Email</h3>
                <p className="text-gray-300">algoritmiaup@gmail.com</p>
              </div>
            </li>
            <li className="flex gap-x-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#C5133D] to-[#2c1e28] text-white">
                <MapPin className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-semibold text-white">Ubicación</h3>
                <p className="text-gray-300">
                  Facultad de Ingeniería, Universidad Panamericana campus Bonaterra
                </p>
              </div>
            </li>
            <li className="flex gap-x-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#C5133D] to-[#2c1e28] text-white">
                <Phone className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-semibold text-white">Horarios de Reunión</h3>
                <p className="text-gray-300">Martes y Jueves, 4:00 PM – 6:00 PM</p>
              </div>
            </li>
          </ul>

          {/* Social Links */}
          <div className="mt-10">
            <h3 className="text-white font-semibold mb-4">Síguenos</h3>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/iia.upags/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 hover:bg-[#C5133D] hover:text-white transition"
              >
                <FaInstagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-[#C5133D] hover:text-white transition">
                <FaGithub className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-[#C5133D] hover:text-white transition">
                <FaLinkedin className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-[#C5133D] hover:text-white transition">
                <FaTwitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE RECTANGLE (BLANK) */}
        <div className="rounded-xl border border-[#C5133D]/40 bg-gradient-to-br from-[#0D0D0D] via-[#0D0D0D] to-[#0D0D0D] p-10">
          {/* Empty box as requested */}
        </div>
      </div>
    </section>
  );
}
