import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F7F4EF",
};

export const metadata: Metadata = {
  title: "SprintRead — Entrena tu lectura rápida",
  description:
    "Duplica tu velocidad de lectura con técnicas respaldadas por neurociencia: RSVP, Schulte, chunking y más. Progresa con datos reales.",
  keywords: ["lectura rápida", "speed reading", "RSVP", "neuroentrenamiento", "Schulte"],
  authors: [{ name: "SprintRead" }],
  openGraph: {
    title: "SprintRead — Lectura rápida con bases científicas",
    description: "Entrena tu velocidad lectora y comprensión con ejercicios diseñados por expertos en neurociencia cognitiva.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
