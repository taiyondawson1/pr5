import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, BarChart, Bot, FileText, BookOpen, Key, LogOut, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/expert-advisors", label: "Expert Advisors", icon: Bot },
  { to: "/accounts", label: "Accounts", icon: BarChart },
  { to: "/setfiles", label: "Setfiles", icon: FileText },
  { to: "/community-setfiles", label: "Community Setfiles", icon: FileText },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/discord", label: "Private Group", icon: MessageCircle },
  { to: "/license-key", label: "License Key", icon: Key },
];

export default function GalaxySidebar() {
  const location = useLocation();
  const { toast } = useToast();

  const logout = async () => {
    await supabase.auth.signOut();
    sessionStorage.clear();
    toast({ title: "Logged out" });
    window.location.href = "/login";
  };

  const getTextStyle = (label: string) => {
    // Allow wrapping for longer labels
    if (label === "Expert Advisors" || label === "Community Setfiles") {
      return "leading-tight w-full text-center whitespace-normal break-words";
    }
    // Keep single line for shorter labels
    return "leading-tight w-full text-center whitespace-nowrap overflow-hidden text-ellipsis";
  };

  return (
    <aside className="hidden md:flex w-[80px] xl:w-[120px] shrink-0 flex-col border-r border-border/50 bg-[hsl(var(--background))]/80 backdrop-blur-md h-screen fixed top-0 left-0 z-50">
      <div className="h-16 flex items-center justify-center px-2">
        <div className="flex flex-col items-center gap-1">
          <img src="/platinumai-logo.svg" alt="PlatinumAi" className="h-8 w-8 object-contain" />
          <span className="text-[10px] tracking-wider text-muted-foreground">PlatinumAi</span>
        </div>
      </div>
      <nav className="px-2 py-4 flex flex-col gap-2">
        {links.map((l) => {
          const Icon = l.icon;
          const active = location.pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={
                `relative group flex flex-col items-center gap-1 rounded-md px-2 py-4 text-[10px] uppercase tracking-wider text-center transition-colors ` +
                (active
                  ? "text-foreground bg-galaxy-blue-600/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5")
              }
            >
              <Icon className={"h-5 w-5 " + (active ? "text-galaxy-blue-400" : "text-foreground/70")} />
              <span className={getTextStyle(l.label)}>{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-2">
        <button
          onClick={logout}
          className="w-full rounded-md px-2 py-3 text-[10px] uppercase tracking-wider text-red-400/90 hover:bg-red-400/10 flex flex-col items-center gap-1"
        >
          <LogOut className="h-5 w-5" />
          <span className="leading-tight w-full text-center whitespace-nowrap overflow-hidden text-ellipsis">Logout</span>
        </button>
      </div>
    </aside>
  );
}


