import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, BarChart, Bot, FileText, BookOpen, Key, LogOut, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: BarChart },
  { to: "/expert-advisors", label: "EAs", icon: Bot },
  { to: "/setfiles", label: "Setfiles", icon: FileText },
  { to: "/discord", label: "Group", icon: MessageCircle },
  { to: "/license-key", label: "License", icon: Key },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { toast } = useToast();

  const logout = async () => {
    await supabase.auth.signOut();
    sessionStorage.clear();
    toast({ title: "Logged out" });
    window.location.href = "/login";
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--background))]/95 backdrop-blur-md border-t border-border/50">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {links.map((link) => {
          const Icon = link.icon;
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1 ${
                active
                  ? "text-galaxy-blue-400 bg-galaxy-blue-600/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] uppercase tracking-wider truncate w-full text-center">
                {link.label}
              </span>
            </Link>
          );
        })}
        
        {/* Logout button */}
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors text-red-400/90 hover:bg-red-400/10 min-w-0 flex-1"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="text-[10px] uppercase tracking-wider truncate w-full text-center">
            Logout
          </span>
        </button>
      </div>
    </nav>
  );
}

