"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";

type Theme = "dark" | "light";

type ThemeTransitionOrigin = {
  x: number;
  y: number;
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (origin?: ThemeTransitionOrigin) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(systemPrefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  const runFallbackTransition = (nextTheme: Theme, origin?: ThemeTransitionOrigin) => {
    const overlay = document.createElement("span");
    const x = origin?.x ?? window.innerWidth - 180;
    const y = origin?.y ?? 80;

    overlay.className = "theme-switch-overlay";
    overlay.style.setProperty("--theme-x", `${x}px`);
    overlay.style.setProperty("--theme-y", `${y}px`);
    overlay.style.setProperty("--theme-color", nextTheme === "dark" ? "#141414" : "#ffffff");
    document.body.appendChild(overlay);
    overlay.addEventListener("animationend", () => overlay.remove(), { once: true });
  };

  const toggleTheme = (origin?: ThemeTransitionOrigin) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const documentWithViewTransition = document as Document & {
      startViewTransition?: (callback: () => void) => { ready: Promise<void> };
    };

    if (!prefersReducedMotion && documentWithViewTransition.startViewTransition) {
      const x = origin?.x ?? window.innerWidth - 180;
      const y = origin?.y ?? 80;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = documentWithViewTransition.startViewTransition(() => {
        flushSync(() => setTheme(nextTheme));
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 760,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          } as KeyframeAnimationOptions
        );
      });

      return;
    }

    if (!prefersReducedMotion) {
      runFallbackTransition(nextTheme, origin);
    }
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
