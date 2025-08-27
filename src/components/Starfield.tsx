import React, { useEffect, useRef } from "react";

type Star = { x: number; y: number; z: number; r: number; s: number };

interface StarfieldProps {
  density?: number;
  speed?: number;
  className?: string;
}

const Starfield: React.FC<StarfieldProps> = ({ density = 0.0018, speed = 0.015, className }) => {
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

      for (const star of starsRef.current) {
        star.z -= speed * (star.s + 0.5) * width * 0.02;
        if (star.z <= 1) {
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = width;
        }
        const k = 128 / star.z;
        const px = star.x * k;
        const py = star.y * k;
        const pr = star.r * k;

        if (px < -width || px > width || py < -height || py > height) continue;

        const gradient = ctx.createRadialGradient(px, py, 0, px, py, pr * 4);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)"); // white stars
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)"); // subtle white glow
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

export default Starfield;








