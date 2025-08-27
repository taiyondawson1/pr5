import React, { useEffect, useRef } from "react";

type Star = { x: number; y: number; z: number; r: number; s: number };

interface GalaxyWidgetProps {
  density?: number;
  speed?: number;
  className?: string;
}

const GalaxyWidget: React.FC<GalaxyWidgetProps> = ({ density = 0.0018, speed = 0.015, className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);
    const numStars = Math.max(80, Math.floor(width * height * density));

    const initStars = () => {
      starsRef.current = Array.from({ length: numStars }).map(() => ({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        r: Math.random() * 1.2 + 0.2,
        s: Math.random() * 0.6 + 0.4,
      }));
    };

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      initStars();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);

      // Create a subtle galaxy spiral effect
      const time = Date.now() * 0.001;
      const spiralIntensity = 0.3;

      for (const star of starsRef.current) {
        star.z -= speed * (star.s + 0.5) * width * 0.02;
        if (star.z <= 1) {
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = width;
        }
        
        const k = 128 / star.z;
        let px = star.x * k;
        let py = star.y * k;
        const pr = star.r * k;

        // Add spiral effect
        const distance = Math.sqrt(px * px + py * py);
        const angle = Math.atan2(py, px) + (distance * spiralIntensity * 0.01);
        const spiralRadius = distance * (1 + Math.sin(angle * 3 + time) * 0.1);
        px = Math.cos(angle) * spiralRadius;
        py = Math.sin(angle) * spiralRadius;

        if (px < -width || px > width || py < -height || py > height) continue;

        // Create a more neutral galaxy effect with blues and whites
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, pr * 4);
        
        // Use different colors based on star distance for galaxy effect
        const distanceFromCenter = Math.sqrt(px * px + py * py);
        const normalizedDistance = Math.min(distanceFromCenter / (width * 0.5), 1);
        
        if (normalizedDistance < 0.3) {
          // Center of galaxy - bright white/blue
          gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          gradient.addColorStop(0.5, "rgba(173, 216, 230, 0.3)");
        } else if (normalizedDistance < 0.7) {
          // Middle region - blue-white
          gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
          gradient.addColorStop(0.5, "rgba(135, 206, 235, 0.2)");
        } else {
          // Outer region - subtle blue
          gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
          gradient.addColorStop(0.5, "rgba(100, 149, 237, 0.15)");
        }
        
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.5, pr), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animationRef.current = requestAnimationFrame(draw);
    };

    initStars();
    animationRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [density, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={
        className ??
        "pointer-events-none fixed inset-0 -z-10 h-full w-full [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]"
      }
    />
  );
};

export default GalaxyWidget;
