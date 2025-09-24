import type { Metadata } from "next";
import "./globals.css";
import MainNavbar from "@/components/MainNavbar";
import Hero from "@/components/Hero"

export const metadata: Metadata = {
  title: "Algoritmia UP",
  description: "Coding club of Universidad Panamericana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-white antialiased">
        <MainNavbar />
        <Hero />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
