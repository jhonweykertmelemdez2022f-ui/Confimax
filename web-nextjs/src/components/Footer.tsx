import Link from "next/link";
import { Package, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-white">Confimax</span>
            </Link>
            <p className="text-slate-400 text-sm mb-4">
              Plataforma integral para la gestión y venta de productos. Calidad y eficiencia en cada entrega.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navegación</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-slate-400 hover:text-cyan-400 transition-colors">Inicio</Link></li>
              <li><Link href="/catalogo" className="text-slate-400 hover:text-cyan-400 transition-colors">Catálogo</Link></li>
              <li><Link href="/nosotros" className="text-slate-400 hover:text-cyan-400 transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="/contacto" className="text-slate-400 hover:text-cyan-400 transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-semibold mb-4">Cuenta</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="text-slate-400 hover:text-cyan-400 transition-colors">Iniciar Sesión</Link></li>
              <li><Link href="/registro" className="text-slate-400 hover:text-cyan-400 transition-colors">Crear Cuenta</Link></li>
              <li><Link href="/catalogo" className="text-slate-400 hover:text-cyan-400 transition-colors">Mis Pedidos</Link></li>
              <li><Link href="/catalogo" className="text-slate-400 hover:text-cyan-400 transition-colors">Carrito</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin className="w-4 h-4 mt-0.5 text-cyan-400 flex-shrink-0" />
                <span>Av. Principal 123, Ciudad Empresarial</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>+58 212 123 4567</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>ventas@confimax.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© 2024 Confimax. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-300 transition-colors">Términos</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-slate-300 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}