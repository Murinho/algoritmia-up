'use client';

import { Mail, MapPin, Phone } from 'lucide-react';
import { FaInstagram, FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

export default function Contact() {
  return (
    <section
      id="contact"
      className="relative py-20 bg-gradient-to-tr from-[#0D0D0D] via-[#2c1e28] to-[#B5133D]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
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
              <a
                href="#"
                className="p-2 rounded-lg bg-white/10 hover:bg-[#C5133D] hover:text-white transition"
              >
                <FaGithub className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-white/10 hover:bg-[#C5133D] hover:text-white transition"
              >
                <FaLinkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-white/10 hover:bg-[#C5133D] hover:text-white transition"
              >
                <FaTwitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE – ANIMATED "CODE" */}
        <div className="relative flex items-center justify-center rounded-xl">
          <div className="code-window-large">
            {/* LINE 1 */}
            <div className="code-line-large">
              <span className="code-bar code-pink w-32" style={{ animationDelay: "0s" }} />
              <span className="code-bar code-pink w-48" style={{ animationDelay: "0.2s" }} />
            </div>

            {/* LINE 2 */}
            <div className="code-line-large">
              <span className="code-bar code-green w-40" style={{ animationDelay: "0.4s" }} />
              <span className="code-bar code-yellow w-56" style={{ animationDelay: "0.6s" }} />
            </div>

            {/* LINE 3 */}
            <div className="code-line-large">
              <span className="code-bar code-yellow w-52" style={{ animationDelay: "0.8s" }} />
            </div>

            {/* LINE 4 */}
            <div className="code-line-large">
              <span className="code-bar code-white w-64" style={{ animationDelay: "1.0s" }} />
              <span className="code-bar code-white code-dot w-4" style={{ animationDelay: "1.2s" }} />
            </div>

            {/* LINE 5 */}
            <div className="code-line-large">
              <span className="code-bar code-pink w-48" style={{ animationDelay: "1.4s" }} />
              <span className="code-bar code-yellow w-32" style={{ animationDelay: "1.6s" }} />
            </div>

            {/* LINE 6 */}
            <div className="code-line-large">
              <span className="code-bar code-green w-56" style={{ animationDelay: "1.8s" }} />
            </div>
            {/* LINE 7 — NEW */}
            <div className="code-line-large">
              <span className="code-bar code-pink w-60" style={{ animationDelay: "2.0s" }} />
              <span className="code-bar code-yellow w-40" style={{ animationDelay: "2.2s" }} />
            </div>

            {/* LINE 8 — NEW */}
            <div className="code-line-large">
              <span className="code-bar code-green w-44" style={{ animationDelay: "2.4s" }} />
            </div>

            {/* LINE 9 — NEW */}
            <div className="code-line-large">
              <span className="code-bar code-white w-52" style={{ animationDelay: "2.6s" }} />
              <span className="code-bar code-white w-16" style={{ animationDelay: "2.8s" }} />
            </div>
          </div>
        </div>

        {/* Scoped styles for the animation */}
        <style jsx>{`
          .code-window-large {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between; /* evenly distributes all 9 lines */
            background: radial-gradient(circle at top left, #2c1e28 0, #1f1d1dff 55%);
            padding: 2.5rem;
            border-radius: 1.25rem;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.55);
          }

          .code-line-large {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-grow: 1;          /* Makes all lines equal height */
          }

          .code-bar {
            height: 1rem;
            border-radius: 999px;
            transform-origin: left;
            animation: codeType 5s ease-in-out infinite;
            opacity: 0;
          }

          .code-dot {
            width: 0.9rem;
            height: 0.9rem;
          }

          .code-pink   { background: #ff2b7a; }
          .code-green  { background: #7ee35c; }
          .code-yellow { background: #f7dd72; }
          .code-white  { background: #fefdf6; }

          @keyframes codeType {
            0%   { transform: scaleX(0); opacity: 0; }
            20%  { transform: scaleX(1); opacity: 1; }
            70%  { transform: scaleX(1); opacity: 1; }
            100% { transform: scaleX(1); opacity: 0; }
          }
        `}</style>
      </div>
    </section>
  );
}
