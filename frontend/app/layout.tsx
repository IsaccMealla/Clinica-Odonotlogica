import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { AuthGuard } from "@/components/auth_guard"; // <-- Importamos nuestro guardián de seguridad
import VigilanteSesion from "@/components/VigilanteSesion"; // <-- 🌟 Importamos nuestro vigilante de token

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clínica Dental Pro",
  description: "Sistema de gestión odontológica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* 🌟 El Vigilante corriendo silenciosamente de fondo 🌟 */}
          <VigilanteSesion />

          {/* 1. El Guardián revisa si el usuario tiene permiso de entrar */}
          <AuthGuard>
            {/* 2. Si pasa, el LayoutWrapper decide si dibuja la Sidebar o no */}
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}