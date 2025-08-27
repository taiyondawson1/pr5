
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { UserPlus, LogIn, Sparkles, Diamond } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    
    if (countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/dashboard');
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleResendConfirmation = async () => {
    if (countdown > 0 || !email) return;
    
    setResendLoading(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) {
        console.error("Resend confirmation error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } else {
        toast({
          title: "Email Sent",
          description: "Confirmation email has been resent. Please check your inbox.",
        });
        setCountdown(30);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend confirmation email",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    let debugData: any = {
      email
    };

    try {
      console.log("Attempting login with email:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Login response:", { data, error });
      debugData.signInResponse = { data, error };

      if (error) {
        console.error("Login error:", error);
        
        if (error.message.includes("Email not confirmed") || 
            error.message.toLowerCase().includes("email confirmation")) {
          setNeedsConfirmation(true);
        }
        
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        setIsLoading(false);
        setDebugInfo(debugData);
        return;
      }

      setNeedsConfirmation(false);

      if (data?.user) {
        try {
          let { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role, staff_key, enrolled_by, enroller')
            .eq('id', data.user.id)
            .maybeSingle();
          
          debugData.profileData = profileData;
          debugData.profileError = profileError;
          
          if (profileError || !profileData) {
            console.error("Profile fetch error or missing profile:", profileError);
            setDebugInfo(debugData);
            
            const { error: createProfileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                role: 'customer',
                staff_key: null,
                enrolled_by: null,
                enroller: null
              })
              .single();
            
            if (createProfileError) {
              console.error("Failed to create profile:", createProfileError);
            } else {
              profileData = { role: 'customer', staff_key: null, enrolled_by: null, enroller: null };
            }
          }

          toast({
            title: "Success",
            description: "Successfully logged in",
          });
          console.log("Login successful, redirecting to dashboard");
          navigate("/dashboard");
        } catch (error) {
          console.error("Error during login process:", error);
          debugData.processingError = error;
          setDebugInfo(debugData);
          
          toast({
            title: "Logged in",
            description: "You're logged in but there was an issue loading your profile data.",
          });
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      debugData.finalError = error;
      setDebugInfo(debugData);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/20 to-black" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl animate-pulse delay-500" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Diamond className="w-8 h-8 text-purple-400" />
              <Sparkles className="w-4 h-4 text-pink-400 absolute -top-1 -right-1" />
            </div>
            <h1 className="text-3xl font-bold text-white">PlatinumAi</h1>
          </div>
          <p className="text-purple-300 text-sm">Advanced Trading Platform</p>
        </div>
        
        {/* Login Card */}
        <div 
          className="relative overflow-hidden rounded-2xl p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-white/70 text-sm">Sign in to your PlatinumAi account</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-300"
                />
              </div>
              
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </div>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                  onClick={() => navigate("/register")}
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create New Account
                </Button>
                
                {needsConfirmation && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full bg-yellow-500/10 border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20 backdrop-blur-sm transition-all duration-300"
                    onClick={handleResendConfirmation}
                    disabled={countdown > 0 || resendLoading || !email}
                  >
                    {resendLoading 
                      ? "Sending..." 
                      : countdown > 0 
                        ? `Resend Confirmation (${countdown}s)` 
                        : "Resend Confirmation Email"}
                  </Button>
                )}
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="w-full mt-4 text-xs bg-black/20 border-white/10 text-white/60 hover:bg-black/30"
                  onClick={() => setShowDebugDialog(true)}
                >
                  Debug Info
                </Button>
              )}
            </form>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/50 text-xs">
            Secure trading platform powered by advanced AI analytics
          </p>
        </div>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-black/90 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Debug Information</DialogTitle>
              <DialogDescription className="text-white/70">
                Detailed information about the login process
              </DialogDescription>
            </DialogHeader>
            <pre className="p-4 bg-gray-900 rounded-md overflow-x-auto text-white text-xs">
              {debugInfo ? JSON.stringify(debugInfo, null, 2) : 'No debug info available'}
            </pre>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Login;
