
"use client";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export function Spotlight({
  className = "",
  fill = "white",
}: SpotlightProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!divRef.current) return;
      const div = divRef.current;
      const rect = div.getBoundingClientRect();
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setPosition({ x, y });
      setOpacity(1);
    };
    
    const handleMouseLeave = () => {
      setOpacity(0);
    };

    const element = divRef.current;
    if (element) {
      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);
    }
    
    return () => {
      if (element) {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [isVisible]);

  return (
    <div
      ref={divRef}
      className={cn(
        "pointer-events-none absolute inset-0 z-20 transition duration-300",
        className
      )}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          maskImage: `radial-gradient(circle at ${position.x}px ${position.y}px, black, transparent 80%)`,
          WebkitMaskImage: `radial-gradient(circle at ${position.x}px ${position.y}px, black, transparent 80%)`,
          opacity: opacity,
        }}
      >
        <div
          className="absolute inset-0 z-10"
          style={{
            background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${fill}, transparent 60%)`,
            opacity: 0.8,
          }}
        />
      </div>
    </div>
  );
}
