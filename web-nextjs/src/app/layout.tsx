import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ParticleBackground from "@/components/ParticleBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Confimax | Catálogo y Venta de Productos",
  description: "Plataforma directa de venta. Explora nuestro inventario actualizado.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Inter:wght@400&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-transparent text-slate-900 dark:text-white font-body-md antialiased min-h-screen flex flex-col selection:bg-slate-900 dark:bg-white selection:text-white dark:text-slate-900 relative`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <ParticleBackground />
              <Navbar />
              <main className="pt-20 min-h-screen relative z-10 bg-transparent">
                <PageTransition>
                  {children}
                </PageTransition>
              </main>
              <Footer className="relative z-10" />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}