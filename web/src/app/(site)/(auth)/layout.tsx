import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-transparent px-4 py-4 md:py-6 relative overflow-hidden">
      {/* Crosshairs */}
      <div className="crosshair-tl" />
      <div className="crosshair-tr" />
      <div className="crosshair-bl" />
      <div className="crosshair-br" />

      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="flex items-center gap-2 border border-transparent px-2 py-1 text-slate-500 dark:text-slate-400 hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:hover:border-white dark:hover:bg-white dark:hover:text-background focus-visible:outline-none focus-visible:border-data-blue transition-colors text-sm font-data-label font-data-label uppercase">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
      </div>

      <div className="w-full max-w-2xl animate-fade-in-up">
        {children}
      </div>
    </div>
  );
}
