"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const animatePageTransition = async () => {
      if (!containerRef.current) return;

      setIsAnimating(true);

      // Animación de entrada
      const elements = containerRef.current.children;
      
      await gsap.fromTo(elements, 
        { 
          opacity: 0, 
          y: 40,
          scale: 0.95
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.8, 
          stagger: 0.1, 
          ease: "power3.out",
          clearProps: "all"
        }
      );

      setIsAnimating(false);
    };

    animatePageTransition();
  }, [pathname]);

  return (
    <div 
      ref={containerRef} 
      className={isAnimating ? "pointer-events-none" : ""}
    >
      {children}
    </div>
  );
}
