import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Churupo Tracker — Gestión de Gastos Personales",
  description:
    "Controla tus finanzas personales en VES y USD. Sistema bi-monetario con bot de Telegram.",
  keywords: ["finanzas", "gastos", "presupuesto", "VES", "USD", "Venezuela"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-theme="dark">
      <body className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
