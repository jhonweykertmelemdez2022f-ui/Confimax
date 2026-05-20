import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ParticleBackground from "@/components/ParticleBackground";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ParticleBackground />
      <Navbar />
      <main className="pt-20 min-h-[calc(100vh-5rem)] relative z-10 bg-transparent flex flex-col">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer className="relative z-10" />
    </>
  );
}
