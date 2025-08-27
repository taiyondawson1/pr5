
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar-new";
import { 
  LayoutDashboard, 
  BarChart, 
  Bot, 
  FileText, 
  BookOpen, 
  LogOut, 
  Key,
  Diamond,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function ModernSidebar() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      console.log("Logging out user...");
      await supabase.auth.signOut();
      sessionStorage.clear();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: "Please try again",
      });
    }
  };
  
  const links = [
    {
      label: "Home",
      href: "/",
      icon: (
        <Home className="text-silver h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <LayoutDashboard className="text-silver h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Expert Advisors",
      href: "/expert-advisors",
      icon: (
        <Bot className="text-silver h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Setfiles",
      href: "/setfiles",
      icon: (
        <FileText className="text-silver h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Accounts",
      href: "/accounts",
      icon: (
        <BarChart className="text-silver h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Courses",
      href: "/courses",
      icon: (
        <BookOpen className="text-silver h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Community Setfiles",
      href: "/community-setfiles",
      icon: (
        <FileText className="text-silver h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "License Key",
      href: "/license-key",
      icon: (
        <Key className="text-silver h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const [open, setOpen] = useState(false);
  
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="flex flex-col h-full justify-between">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo />
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
        <div className="mt-auto pt-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 py-2 text-accent-red hover:text-red-400 group/sidebar"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <motion.span
              animate={{
                display: open ? "inline-block" : "none",
                opacity: open ? 1 : 0,
              }}
              className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block"
            >
              Logout
            </motion.span>
          </button>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  const { open } = useSidebar();
  
  return (
    <div className="font-normal flex space-x-2 items-center text-sm text-softWhite py-1 relative z-20">
      <div className="h-6 w-6 flex-shrink-0 flex items-center justify-center transform rotate-45 bg-silver/80">
        <Diamond className="h-4 w-4 text-darkBase transform -rotate-45" />
      </div>
      {open && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-medium text-softWhite whitespace-pre"
        >
          PlatinumAi
        </motion.span>
      )}
    </div>
  );
};
