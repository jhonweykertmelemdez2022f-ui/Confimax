import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-background px-4 py-12 relative overflow-hidden grid-bg">
      {/* Crosshairs */}
      <div className="crosshair-tl" />
      <div className="crosshair-tr" />
      <div className="crosshair-bl" />
      <div className="crosshair-br" />

      <div className="absolute top-6 left-6 z-10">
        <Link href="/" className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-data-label font-data-label uppercase">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        {children}
      </div>
    </div>
  );
}