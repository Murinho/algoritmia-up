import type { Metadata, Viewport } from "next";
import "./globals.css";
import MainNavbar from "@/components/MainNavbar";

export const metadata: Metadata = {
  title: "Algoritmia UP",
  description: "Coding club of Universidad Panamericana",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-white antialiased">
        <MainNavbar />
        {/* Give space under the sticky navbar (h-16) */}
        <main>{children}</main>
      </body>
    </html>
  );
}
