import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-100 dark:bg-surface border-t border-slate-900 dark:border-white">
      <div className="w-full px-margin-page py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white dark:bg-white border border-slate-900 dark:border-white flex items-center justify-center">
                <span className="text-slate-900 dark:text-background font-black text-sm">C</span>
              </div>
              <span className="text-xl font-headline-lg text-slate-900 dark:text-white uppercase tracking-tighter">CONFIMAX</span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 font-body-md">
              Plataforma de precisión para la gestión y distribución de productos. Calidad calibrada en cada entrega.
            </p>
            <div className="font-data-label text-data-label text-slate-500 dark:text-slate-500 text-xs">
            </div>
          </div>

          {/* Links */}
          <div className="border-l border-slate-900/20 dark:border-white/20 pl-8">
            <h3 className="text-slate-900 dark:text-white font-headline-lg-mobile uppercase mb-4">NAVEGACIÓN</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-slate-600 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors font-data-label text-data-label uppercase block py-1">Inicio</Link></li>
              <li><Link href="/catalogo" className="text-slate-600 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors font-data-label text-data-label uppercase block py-1">Catálogo</Link></li>
              <li><Link href="/nosotros" className="text-slate-600 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors font-data-label text-data-label uppercase block py-1">Sobre Nosotros</Link></li>
              <li><Link href="/contacto" className="text-slate-600 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors font-data-label text-data-label uppercase block py-1">Contacto</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div className="border-l border-slate-900/20 dark:border-white/20 pl-8">
            <h3 className="text-slate-900 dark:text-white font-headline-lg-mobile uppercase mb-4">CUENTA</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="text-slate-600 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors font-data-label text-data-label uppercase block py-1">Iniciar Sesión</Link></li>
              <li><Link href="/registro" className="text-slate-600 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors font-data-label text-data-label uppercase block py-1">Crear Cuenta</Link></li>
              <li><Link href="/catalogo" className="text-slate-600 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors font-data-label text-data-label uppercase block py-1">Mis Pedidos</Link></li>
              <li><Link href="/catalogo" className="text-slate-600 dark:text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors font-data-label text-data-label uppercase block py-1">Carrito</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="border-l border-slate-900/20 dark:border-white/20 pl-8">
            <h3 className="text-slate-900 dark:text-white font-headline-lg-mobile uppercase mb-4">CONTACTO</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                <MapPin className="w-4 h-4 mt-0.5 text-data-blue flex-shrink-0" />
                <span className="font-body-md">Av. Principal 123, Ciudad Empresarial</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <Phone className="w-4 h-4 text-data-blue flex-shrink-0" />
                <span className="font-body-md font-data-value">+58 212 123 4567</span>
              </li>
              <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <Mail className="w-4 h-4 text-data-blue flex-shrink-0" />
                <span className="font-body-md font-data-value">ventas@confimax.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-slate-900/20 dark:border-white/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="font-data-label text-data-label text-slate-500 dark:text-slate-500">
            © 2026 CONFIMAX // TODOS LOS DERECHOS RESERVADOS
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-slate-500 dark:text-slate-500 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors font-data-label text-data-label uppercase">Términos</Link>
            <Link href="#" className="text-slate-500 dark:text-slate-500 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors font-data-label text-data-label uppercase">Privacidad</Link>
            <Link href="#" className="text-slate-500 dark:text-slate-500 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-background transition-colors font-data-label text-data-label uppercase">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}