
import React from "react";

import { cn } from "@/lib/utils";
interface RainbowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function RainbowButton({
  children,
  className,
  ...props
}: RainbowButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 px-8 py-2 font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        
        // Base styles
        "overflow-hidden [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent]",
        
        // Rainbow animation
        "bg-[length:200%] animate-rainbow",
        
        // Gradient background
        "bg-[linear-gradient(var(--gradient-direction,90deg),hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]",
        
        // Glow effect
        "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(var(--gradient-direction,90deg),hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] before:bg-[length:200%] before:[filter:blur(calc(0.8*1rem))]",
        
        // Content positioning
        "after:absolute after:inset-[2px] after:rounded-[calc(0.5*1rem)] after:bg-black/80 after:backdrop-blur-sm",
        
        // Text positioning
        "[&>*]:relative [&>*]:z-10",
        
        className,
      )}
      {...props}
    >
      <span className="z-10 relative">{children}</span>
    </button>
  );
}
