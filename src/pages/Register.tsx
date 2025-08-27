
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, UserPlus, Sparkles, Diamond } from "lucide-react";
import { useStaffKeyValidation } from "@/hooks/use-staff-key-validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Squares } from "@/components/ui/squares-background";

const STAFF_KEY_PATTERNS = {
  CEO: /^CEO\d{3}$/,    // CEO followed by 3 digits
  ADMIN: /^AD\d{4}$/,   // AD followed by 4 digits
  ENROLLER: /^EN\d{4}$/ // EN followed by 4 digits
};

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [staffKey, setStaffKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const { staffKeyInfo, isLoading: isValidating } = useStaffKeyValidation(staffKey);

  const validateStaffKeyFormat = (key: string): boolean => {
    return (
      STAFF_KEY_PATTERNS.CEO.test(key) ||
      STAFF_KEY_PATTERNS.ADMIN.test(key) ||
      STAFF_KEY_PATTERNS.ENROLLER.test(key)
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match",
      });
      return;
    }

    if (!staffKey.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Enrollment key is required",
      });
      return;
    }

    const isStaffKeyFormat = validateStaffKeyFormat(staffKey);
    
    if (isStaffKeyFormat && !staffKeyInfo.isValid) {
      toast({
        variant: "destructive",
        title: "Invalid Enrollment Key",
        description: "The enrollment key provided is invalid or inactive",
      });
      return;
    }
    
    setIsLoading(true);
    let debugData: any = {
      email,
      staffKey,
      isStaffKeyFormat,
      staffKeyInfo: JSON.parse(JSON.stringify(staffKeyInfo))
    };

    try {
      try {
        console.log("Fixing database triggers before registration...");
        const { error: fixError } = await supabase.functions.invoke('fix-handle-new-user');
        if (fixError) {
          console.warn("Non-blocking warning - Error fixing triggers:", fixError);
        }
      } catch (fixErr) {
        console.warn("Non-blocking warning - Failed to call fix function:", fixErr);
      }

      const isStaffRegistration = isStaffKeyFormat && 
                               (staffKeyInfo.role === 'ceo' || 
                                staffKeyInfo.role === 'admin' || 
                                staffKeyInfo.role === 'enroller');
      
      debugData.isStaffRegistration = isStaffRegistration;
      
      if (!isStaffRegistration && isStaffKeyFormat && !staffKeyInfo.canBeUsedForEnrollment) {
        toast({
          variant: "destructive",
          title: "Invalid Enrollment Key",
          description: "This enrollment key cannot be used for customer enrollment",
        });
        setDebugInfo(debugData);
        setIsLoading(false);
        return;
      }

      console.log("Registration type:", isStaffRegistration ? "Staff" : "Customer");
      console.log("Registration data:", {
        email,
        staffKey,
        isStaffKeyFormat,
        role: isStaffRegistration ? staffKeyInfo.role : 'customer',
        enroller: !isStaffRegistration ? staffKey : null,
        staff_key: isStaffRegistration ? staffKey : null
      });

      const userData = {
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            role: isStaffRegistration ? staffKeyInfo.role : 'customer',
            enroller: !isStaffRegistration ? staffKey : null,
            enrolled_by: !isStaffRegistration ? staffKey : null,
            staff_key: isStaffRegistration ? staffKey : null
          }
        }
      };
      
      debugData.userData = userData;

      const { data, error } = await supabase.auth.signUp(userData);
      
      debugData.signupResponse = { data, error };

      if (error) {
        console.error("Registration error details:", error);
        
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          toast({
            variant: "destructive",
            title: "Too Many Attempts",
            description: "Please wait a few minutes before trying to register again.",
          });
        } else if (error.message.includes('timeout') || error.status === 504) {
          toast({
            variant: "destructive",
            title: "Server Timeout",
            description: "The server is taking too long to respond. Please try again.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message,
          });
        }
        setDebugInfo(debugData);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        console.log("User created successfully:", data.user);
        
        try {
          console.log("Ensuring customer records are properly created...");
          const { error: repairError } = await supabase.functions.invoke('repair-customer-records');
          if (repairError) {
            console.warn("Non-blocking warning - Error repairing customer records:", repairError);
          }
        } catch (repairErr) {
          console.warn("Non-blocking warning - Failed to repair customer records:", repairErr);
        }
        
        if (!isStaffRegistration) {
          try {
            const { data: licenseData, error: licenseError } = await supabase
              .from('license_keys')
              .select('*')
              .eq('user_id', data.user.id)
              .maybeSingle();
              
            if (licenseError || !licenseData) {
              console.log("No license key found, attempting to create one...");
              
              const { error: createLicenseError } = await supabase
                .from('license_keys')
                .insert({
                  user_id: data.user.id,
                  license_key: 'PENDING-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                  account_numbers: [],
                  status: 'active',
                  subscription_type: 'standard',
                  name: email.split('@')[0],
                  email: email,
                  phone: '',
                  product_code: 'EA-001',
                  enrolled_by: staffKey,
                  enroller: staffKey,
                  staff_key: null
                });
                
              if (createLicenseError) {
                console.error("Error creating license key record:", createLicenseError);
              }
            }
            
            const { data: customerAccountData, error: customerAccountError } = await supabase
              .from('customer_accounts')
              .select('*')
              .eq('user_id', data.user.id)
              .maybeSingle();
              
            if (customerAccountError || !customerAccountData) {
              console.log("No customer_accounts record found, attempting to create one...");
              
              const { error: createCustomerAccountError } = await supabase
                .from('customer_accounts')
                .insert({
                  user_id: data.user.id,
                  name: email.split('@')[0],
                  email: email,
                  phone: '',
                  status: 'active',
                  enrolled_by: staffKey,
                  enroller: staffKey,
                  license_key: licenseData ? licenseData.license_key : 'PENDING-' + Math.random().toString(36).substring(2, 7).toUpperCase()
                });
                
              if (createCustomerAccountError) {
                console.error("Error creating customer_accounts record:", createCustomerAccountError);
              }
            }
            
            const customerData = {
              id: data.user.id,
              name: email.split('@')[0],
              email: email,
              phone: '',
              status: 'Active',
              sales_rep_id: '00000000-0000-0000-0000-000000000000',
              staff_key: null,
              enroller: staffKey,
              revenue: '$0'
            };
            
            const { data: existingCustomer } = await supabase
              .from('customers')
              .select('id')
              .eq('id', data.user.id)
              .maybeSingle();
              
            if (existingCustomer) {
              const { error: updateCustomerError } = await supabase
                .from('customers')
                .update(customerData)
                .eq('id', data.user.id);
                
              if (updateCustomerError) {
                console.error("Error updating customer record:", updateCustomerError);
              }
            } else {
              const { error: createCustomerError } = await supabase
                .from('customers')
                .insert(customerData);
                
              if (createCustomerError) {
                console.error("Error creating customer record:", createCustomerError);
              }
            }
            
            const { error: updateProfileError } = await supabase
              .from('profiles')
              .update({
                enrolled_by: staffKey,
                enroller: staffKey
              })
              .eq('id', data.user.id);
              
            if (updateProfileError) {
              console.error("Error updating profile with enrollment info:", updateProfileError);
              
              try {
                console.log("Attempting to fix enrollment data with edge function");
                const { error: fixEnrollmentError } = await supabase.functions.invoke('fix-enrollment-data', {
                  body: { userEmail: email, enrollmentKey: staffKey }
                });
                
                if (fixEnrollmentError) {
                  console.warn("Non-blocking warning - Error fixing enrollment data:", fixEnrollmentError);
                } else {
                  console.log("Successfully fixed enrollment data with edge function");
                }
              } catch (enrollmentError) {
                console.warn("Non-blocking warning - Failed to fix enrollment data:", enrollmentError);
              }
            }
            
          } catch (err) {
            console.error("Error ensuring customer record creation:", err);
          }
        }
        
        toast({
          title: "Success",
          description: "Please check your email to confirm your account",
        });

        navigate("/login");
      } else {
        console.error("User data not returned after signup");
        toast({
          variant: "destructive",
          title: "Registration Error",
          description: "Unknown error during registration. Please try again.",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      debugData.finalError = error;
      setDebugInfo(debugData);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register",
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
        
        {/* Register Card */}
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
            {/* Header with back button */}
            <div className="flex items-center justify-between mb-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/login")}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="text-center flex-1">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                <p className="text-white/70 text-sm">Join PlatinumAi trading platform</p>
              </div>
              <div className="w-8 h-8" /> {/* Spacer for centering */}
            </div>
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
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
                  disabled={isLoading}
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enrollment Key"
                  value={staffKey}
                  onChange={(e) => setStaffKey(e.target.value)}
                  required
                  disabled={isLoading}
                  className={`w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm focus:border-purple-500/50 focus:ring-purple-500/20 transition-all duration-300 ${
                    staffKey && !isValidating ? 
                      (staffKeyInfo.isValid ? 'border-green-500/50' : 'border-red-500/50') : 
                      ''
                  }`}
                />
                <p className="text-xs text-white/60">
                  {staffKeyInfo.role === 'ceo' || staffKeyInfo.role === 'admin' || staffKeyInfo.role === 'enroller' 
                    ? "Enter your enrollment key (CEO###, AD####, or EN####)" 
                    : "Enter the enrollment key of the person who enrolled you"}
                </p>
                
                {staffKey && !isValidating && !staffKeyInfo.isValid && (
                  <Alert variant="destructive" className="mt-2 py-2 bg-red-500/10 border-red-500/20 text-red-300">
                    <AlertDescription>
                      This enrollment key is invalid or inactive
                    </AlertDescription>
                  </Alert>
                )}
                
                {staffKey && !isValidating && staffKeyInfo.isValid && !staffKeyInfo.canBeUsedForEnrollment && (
                  <Alert className="mt-2 py-2 bg-amber-500/10 border-amber-500/20 text-amber-300">
                    <AlertDescription>
                      This enrollment key cannot be used for enrollment
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25" 
                  disabled={isLoading || isValidating || (staffKey && !staffKeyInfo.canBeUsedForEnrollment)}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Create Account
                    </div>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                  onClick={() => navigate("/login")}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
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
                Detailed information about the registration process
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

export default Register;
