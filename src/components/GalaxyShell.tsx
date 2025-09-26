import React from "react";
import GalaxySidebar from "@/components/GalaxySidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Link } from "react-router-dom";

interface GalaxyShellProps {
  children: React.ReactNode;
}

export default function GalaxyShell({ children }: GalaxyShellProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground relative z-0">
      {/* Purple background overlay - extends to all edges */}
      <div 
        className="absolute z-0 inset-0"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Animated purple overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 animate-pulse opacity-40"></div>
      </div>
      
      {/* Top nav removed as requested */}
      <div className="flex relative z-10">
        <GalaxySidebar />
        <main className="flex-1 min-w-0 relative md:ml-[80px] xl:ml-[120px] pb-16 md:pb-0">
          {children}
        </main>
      </div>
      
      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}


