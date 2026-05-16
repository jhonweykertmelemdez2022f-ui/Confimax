"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  originalX: number;
  originalY: number;
}

interface DistortionPoint {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const distortionRef = useRef<DistortionPoint[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Crear puntos de distorsión para el fondo
      distortionRef.current = [];
      const gridSize = 50;
      for (let x = 0; x < canvas.width + gridSize; x += gridSize) {
        for (let y = 0; y < canvas.height + gridSize; y += gridSize) {
          distortionRef.current.push({
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: 0
          });
        }
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Crear partículas
    const particles: Particle[] = [];
    const particleCount = 100;

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particles.push({
        x,
        y,
        originalX: x,
        originalY: y,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
      });
    }

    const mouse = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouseRef.current = { x: mouse.x, y: mouse.y };
    };

    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const isDark = document.documentElement.classList.contains("dark");
      
      // Dibujar fondo distorsionado
      const points = distortionRef.current;
      
      // Actualizar posiciones de puntos basadas en el mouse
      points.forEach(point => {
        const dx = mouse.x - point.baseX;
        const dy = mouse.y - point.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 250;
        
        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          const pushX = Math.cos(angle) * force * 30;
          const pushY = Math.sin(angle) * force * 30;
          
          point.vx += (pushX - point.vx) * 0.1;
          point.vy += (pushY - point.vy) * 0.1;
        }
        
        // Volver a posición original
        point.vx += (point.baseX - point.x) * 0.05;
        point.vy += (point.baseY - point.y) * 0.05;
        
        // Aplicar velocidad con damping
        point.x += point.vx;
        point.y += point.vy;
        point.vx *= 0.9;
        point.vy *= 0.9;
      });
      
      // Dibujar gradiente distorsionado
      const gradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, 400
      );
      
      if (isDark) {
        gradient.addColorStop(0, "rgba(0, 102, 255, 0.15)");
        gradient.addColorStop(0.5, "rgba(0, 102, 255, 0.05)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        gradient.addColorStop(0, "rgba(0, 102, 255, 0.1)");
        gradient.addColorStop(0.5, "rgba(0, 102, 255, 0.03)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar líneas de distorsión
      ctx.strokeStyle = isDark ? "rgba(0, 102, 255, 0.08)" : "rgba(0, 102, 255, 0.05)";
      ctx.lineWidth = 1;
      
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const nearbyPoints = points.filter(p => {
          const dx = p.x - point.x;
          const dy = p.y - point.y;
          return Math.sqrt(dx * dx + dy * dy) < 80;
        });
        
        nearbyPoints.forEach(nearPoint => {
          if (nearPoint !== point) {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(nearPoint.x, nearPoint.y);
            ctx.stroke();
          }
        });
      }

      const primaryColor = isDark ? "rgba(0, 102, 255, 0.4)" : "rgba(0, 102, 255, 0.3)";
      const lineColor = isDark ? "rgba(0, 102, 255, 0.15)" : "rgba(0, 102, 255, 0.1)";

      particles.forEach((particle) => {
        // Movimiento suave hacia el mouse
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 200;

        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          particle.x += (dx / distance) * force * 3;
          particle.y += (dy / distance) * force * 3;
        } else {
          // Volver a posición original suavemente
          particle.x += (particle.originalX - particle.x) * 0.02;
          particle.y += (particle.originalY - particle.y) * 0.02;
        }

        // Movimiento natural
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Rebote en bordes
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        // Dibujar partícula
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = primaryColor;
        ctx.fill();
      });

      // Dibujar líneas entre partículas cercanas
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ opacity: 1, zIndex: 0 }}
    />
  );
}