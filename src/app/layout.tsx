import type { Metadata } from "next";
import "./globals.css";
import MainNavbar from "@/components/MainNavbar";
import Hero from "@/components/Hero"
import About from "@/components/About";

export const metadata: Metadata = {
  title: "Algoritmia UP",
  description: "Coding club of Universidad Panamericana",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-white antialiased">
        <MainNavbar />
        <Hero />
        <About />
      </body>
    </html>
  );
}
