
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  LayoutDashboard, 
  BarChart, 
  Bot, 
  FileText, 
  BookOpen, 
  LogOut, 
  Key, 
  Diamond,
  Menu,
  X,
  Sparkles
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const menuItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Expert Advisors", path: "/expert-advisors", icon: Bot },
  { label: "Setfiles", path: "/setfiles", icon: FileText },
  { label: "Accounts", path: "/accounts", icon: BarChart },
  { label: "Courses", path: "/courses", icon: BookOpen },
  { label: "Community Setfiles", path: "/community-setfiles", icon: FileText },
  { label: "License Key", path: "/license-key", icon: Key },
];

const toolItems = [
  {
    label: "Economic Calendar",
    url: "https://tradingeconomics.com/calendar",
  },
  {
    label: "Currency Correlations",
    url: "https://www.myfxbook.com/forex-market/correlations",
  },
  {
    label: "TradingView",
    url: "https://www.tradingview.com",
  },
  {
    label: "Watch Live News",
    url: "https://www.youtube.com/live",
  },
  {
    label: "Read News",
    url: "https://www.forexfactory.com/news",
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile screen on component mount and window resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      }
    };

    // Initial check
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLogout = async () => {
    try {
      console.log("Logging out user...");
      await supabase.auth.signOut();
      sessionStorage.clear(); // Clear all session storage
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

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu trigger */}
      <div className="lg:hidden fixed top-5 left-5 z-[200]">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleSidebar} 
          className="bg-black/20 backdrop-blur-md border-purple-500/30 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 w-10 h-10 shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Sidebar with responsive behavior */}
      <div 
        className={cn(
          "fixed left-0 top-0 h-full z-[200]",
          "transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "w-[280px] sm:w-[250px]"
        )}
      >
        {/* Overlay to close sidebar on mobile when clicking outside */}
        {isMobile && isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      
        {/* Sidebar content */}
        <div className="h-full overflow-auto flex flex-col relative z-[200] bg-gradient-to-b from-black/40 via-purple-900/20 to-black/40 backdrop-blur-xl border-r border-purple-500/20 shadow-2xl">
          {/* Top gradient accent */}
          <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>
          
          {/* Logo section */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Diamond className="w-6 h-6 text-purple-400" />
                <Sparkles className="w-3 h-3 text-pink-400 absolute -top-1 -right-1" />
              </div>
              <div>
                <span className="text-white font-bold text-lg">PlatinumAi</span>
                <div className="text-purple-300 text-xs">Trading Platform</div>
              </div>
            </div>
          </div>
          
          {/* Divider */}
          <Separator className="mx-6 mb-6 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          
          {/* Navigation Menu */}
          <div className="px-3 space-y-1 mb-6">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 text-sm rounded-xl text-left group",
                    "hover:bg-purple-500/10 hover:border-purple-500/30 border border-transparent",
                    isActive 
                      ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-purple-500/50 shadow-lg shadow-purple-500/25" 
                      : "text-gray-300 hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive ? "text-purple-300" : "text-gray-400 group-hover:text-purple-300"
                  )} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tools Section */}
          <div className="px-3 mb-6">
            <h3 className="text-xs font-bold text-purple-300 mb-3 px-4 uppercase tracking-wider">External Tools</h3>
            <div className="space-y-1">
              {toolItems.map((tool) => (
                <a
                  key={tool.label}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-purple-500/10 transition-all duration-300 rounded-lg group"
                >
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full group-hover:bg-pink-400 transition-colors"></div>
                  <span className="font-medium">{tool.label}</span>
                </a>
              ))}
            </div>
          </div>
          
          {/* Logout at the bottom */}
          <div className="mt-auto p-3">
            <div className="border-t border-purple-500/20 pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 rounded-xl group border border-transparent hover:border-red-500/30"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
