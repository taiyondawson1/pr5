
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { ModernSidebar } from "@/components/ModernSidebar";
import Dashboard from "@/pages/Dashboard";
import GalaxyShell from "@/components/GalaxyShell";
import ExpertAdvisorsPage from "@/pages/ExpertAdvisors";
import SetfilesPage from "@/pages/Setfiles";
import TradingPage from "@/pages/Trading";
import CoursesPage from "@/pages/Courses";
import AccountsPage from "@/pages/Accounts";
import CommunitySetfiles from "@/pages/CommunitySetfiles";
import MyFxBookLoginPage from "@/pages/MyFxBookLoginPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Home from "@/pages/Home";
import LicenseKey from "@/pages/LicenseKey";
import EnrollmentFixer from "@/pages/EnrollmentFixer";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

function PrivateRoute({
  children
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();
        console.log("Auth check - Session:", session);
        if (session) {
          setIsAuthenticated(true);
          if (['/login', '/register', '/'].includes(location.pathname)) {
            navigate('/dashboard');
          }
        } else {
          console.log("No session found - redirecting to login");
          setIsAuthenticated(false);
          sessionStorage.clear();
          if (!['/login', '/register', '/'].includes(location.pathname)) {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
        sessionStorage.clear();
        if (!['/login', '/register', '/'].includes(location.pathname)) {
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed - Event:", event, "Session:", session);
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        sessionStorage.clear();
        if (!['/login', '/register', '/'].includes(location.pathname)) {
          navigate('/login');
        }
      }
      setIsLoading(false);
    });
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Tab became visible - checking auth status");
        checkAuth();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate, location]);
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="glass-card px-8 py-6 rounded-2xl">
          <div className="animate-pulse text-white text-lg">Loading...</div>
        </div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function MainContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isSetfilesPage = location.pathname === "/setfiles";
  const isTradeHubPage = false;
  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";
  const hideHeader = isHomePage || isSetfilesPage || isLoginPage || isRegisterPage;

  return (
    <div className="flex min-h-screen relative">
      <div className="flex-1 relative">
        <main className="w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={<PrivateRoute><GalaxyShell><Dashboard /></GalaxyShell></PrivateRoute>}
            />
            <Route
              path="/trading"
              element={<PrivateRoute><GalaxyShell><TradingPage /></GalaxyShell></PrivateRoute>}
            />
            <Route
              path="/expert-advisors"
              element={<PrivateRoute><GalaxyShell><ExpertAdvisorsPage /></GalaxyShell></PrivateRoute>}
            />
            <Route
              path="/setfiles"
              element={<PrivateRoute><GalaxyShell><SetfilesPage /></GalaxyShell></PrivateRoute>}
            />
            <Route
              path="/courses"
              element={<PrivateRoute><GalaxyShell><CoursesPage /></GalaxyShell></PrivateRoute>}
            />
            <Route
              path="/accounts"
              element={<PrivateRoute><GalaxyShell><AccountsPage /></GalaxyShell></PrivateRoute>}
            />
            <Route
              path="/community-setfiles"
              element={<PrivateRoute><GalaxyShell><CommunitySetfiles /></GalaxyShell></PrivateRoute>}
            />
            <Route
              path="/connect-myfxbook"
              element={<PrivateRoute><GalaxyShell><MyFxBookLoginPage /></GalaxyShell></PrivateRoute>}
            />
            <Route
              path="/license-key"
              element={<PrivateRoute><GalaxyShell><LicenseKey /></GalaxyShell></PrivateRoute>}
            />
            <Route
              path="/fix-enrollment"
              element={<PrivateRoute><GalaxyShell><EnrollmentFixer /></GalaxyShell></PrivateRoute>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MainContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>;
}

export default App;
