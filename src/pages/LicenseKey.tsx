import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, XCircle, Copy, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RealtimeChannel } from "@supabase/supabase-js";

const MAX_ACCOUNTS = 5;

const LicenseKey = () => {
  const { toast } = useToast();
  const [licenseKey, setLicenseKey] = useState<string>("");
  const [accountNumbers, setAccountNumbers] = useState<string[]>([]);
  const [newAccount, setNewAccount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [canAddAccounts, setCanAddAccounts] = useState<boolean>(true);
  const [canRemoveAccounts, setCanRemoveAccounts] = useState<boolean>(true);
  const [accountsLocked, setAccountsLocked] = useState<boolean>(false);
  const [maxAccounts, setMaxAccounts] = useState<number>(MAX_ACCOUNTS);
  const [licenseStatus, setLicenseStatus] = useState<string>('active');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const fetchLicenseData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          setError("You must be logged in to view your license key");
          setIsLoading(false);
          return;
        }
        
        console.log("Fetching license key for user:", user.id);
        
        const { data: licenseData, error: licenseError } = await supabase
          .from('license_keys')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (licenseError) {
          if (licenseError.code === 'PGRST116') {
            console.log("No license key found, generating a new one...");
            await createNewLicenseKey(user.id);
          } else {
            console.error("License fetch error:", licenseError);
            throw licenseError;
          }
        } else if (licenseData) {
          console.log("License key found:", licenseData);
          setLicenseKey(licenseData.license_key);
          setAccountNumbers(licenseData.account_numbers || []);
          
          setCanAddAccounts(licenseData.can_add_accounts !== false);
          setCanRemoveAccounts(licenseData.can_remove_accounts !== false);
          setAccountsLocked(licenseData.accounts_locked === true);
          setMaxAccounts(licenseData.max_accounts || MAX_ACCOUNTS);
          setLicenseStatus(licenseData.status || 'active');
          setExpiryDate(licenseData.expiry_date ? new Date(licenseData.expiry_date) : null);
        } else {
          console.log("No license data returned but no error either, generating a new key...");
          await createNewLicenseKey(user.id);
        }
      } catch (error) {
        console.error("Error fetching license data:", error);
        setError(error instanceof Error ? error.message : "Unknown error occurred");
        toast({
          title: "Error fetching license data",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLicenseData();
    const setupChannel = setupRealtimeListener();
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [toast]);
  
  const setupRealtimeListener = () => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      
      const newChannel = supabase
        .channel('license_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'license_keys',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('License updated:', payload);
            const newData = payload.new as any;
            
            setLicenseKey(newData.license_key);
            setAccountNumbers(newData.account_numbers || []);
            setCanAddAccounts(newData.can_add_accounts !== false);
            setCanRemoveAccounts(newData.can_remove_accounts !== false);
            setAccountsLocked(newData.accounts_locked === true);
            setMaxAccounts(newData.max_accounts || MAX_ACCOUNTS);
            setLicenseStatus(newData.status || 'active');
            setExpiryDate(newData.expiry_date ? new Date(newData.expiry_date) : null);
          }
        )
        .subscribe();
        
      setChannel(newChannel);
    });
  };
  
  const createNewLicenseKey = async (userId: string) => {
    const newKey = generateLicenseKey();
    console.log("Generated new license key:", newKey);
    
    const { data, error } = await supabase
      .from('license_keys')
      .insert([
        { 
          user_id: userId, 
          license_key: newKey,
          account_numbers: [],
          status: 'active',
          subscription_type: 'standard',
          name: 'User',
          email: 'user@example.com',
          phone: '',
          product_code: 'EA-001',
          e_key: 'default'
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error("Error inserting license key:", error);
      throw error;
    }
    
    if (data) {
      console.log("New license key created:", data);
      setLicenseKey(data.license_key);
      setAccountNumbers(data.account_numbers || []);
      toast({
        title: "License key generated",
        description: "A new license key has been generated for you",
      });
    }
  };
  
  const generateLicenseKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 4) result += "-";
    }
    return result;
  };
  
  const handleAddAccount = async () => {
    if (!newAccount.trim()) {
      toast({
        title: "Error",
        description: "Please enter an account number",
        variant: "destructive",
      });
      return;
    }
    
    if (licenseStatus !== 'active') {
      toast({
        title: "Error",
        description: "Your license is not active. Please contact support.",
        variant: "destructive",
      });
      return;
    }
    
    if (expiryDate && new Date() > expiryDate) {
      toast({
        title: "Error",
        description: "Your license has expired. Please renew your subscription.",
        variant: "destructive",
      });
      return;
    }
    
    if (!canAddAccounts) {
      toast({
        title: "Error",
        description: "You are not allowed to add account numbers. Please contact support.",
        variant: "destructive",
      });
      return;
    }
    
    if (accountsLocked) {
      toast({
        title: "Error",
        description: "Account management is locked. Please contact support.",
        variant: "destructive",
      });
      return;
    }
    
    if (accountNumbers.includes(newAccount.trim())) {
      toast({
        title: "Error",
        description: "Account number already exists",
        variant: "destructive",
      });
      return;
    }
    
    if (accountNumbers.length >= maxAccounts) {
      toast({
        title: "Error",
        description: `Maximum ${maxAccounts} account numbers allowed. Please remove one first or contact support.`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedAccounts = [...accountNumbers, newAccount.trim()];
      
      const { error } = await supabase
        .from('license_keys')
        .update({ account_numbers: updatedAccounts })
        .eq('license_key', licenseKey);
      
      if (error) throw error;
      
      setAccountNumbers(updatedAccounts);
      setNewAccount("");
      toast({
        title: "Success",
        description: "Account number added",
      });
    } catch (error) {
      console.error("Error adding account number:", error);
      toast({
        title: "Error adding account number",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  const handleRemoveAccount = async (accountNumber: string) => {
    if (licenseStatus !== 'active') {
      toast({
        title: "Error",
        description: "Your license is not active. Please contact support.",
        variant: "destructive",
      });
      return;
    }
    
    if (expiryDate && new Date() > expiryDate) {
      toast({
        title: "Error",
        description: "Your license has expired. Please renew your subscription.",
        variant: "destructive",
      });
      return;
    }
    
    if (!canRemoveAccounts) {
      toast({
        title: "Error",
        description: "You are not allowed to remove account numbers. Please contact support.",
        variant: "destructive",
      });
      return;
    }
    
    if (accountsLocked) {
      toast({
        title: "Error",
        description: "Account management is locked. Please contact support.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const updatedAccounts = accountNumbers.filter(acc => acc !== accountNumber);
      
      const { error } = await supabase
        .from('license_keys')
        .update({ account_numbers: updatedAccounts })
        .eq('license_key', licenseKey);
      
      if (error) throw error;
      
      setAccountNumbers(updatedAccounts);
      toast({
        title: "Success",
        description: "Account number removed",
      });
    } catch (error) {
      console.error("Error removing account number:", error);
      toast({
        title: "Error removing account number",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  const handleCopyKey = () => {
    navigator.clipboard.writeText(licenseKey);
    setIsCopied(true);
    toast({
      title: "Copied",
      description: "License key copied to clipboard",
    });
    
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  const formatExpiryDate = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <main className="flex-1 p-6 max-w-[1400px] mx-auto">
        <div className="flex justify-center items-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-softWhite" />
          <span className="ml-2 text-softWhite">Loading license data...</span>
        </div>
      </main>
    );
  }
  
  if (error) {
    return (
      <main className="flex-1 p-6 max-w-[1400px] mx-auto">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </main>
    );
  }
  
  const LicenseStatusWarning = () => {
    if (licenseStatus !== 'active') {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>License Not Active</AlertTitle>
          <AlertDescription>Your license is currently {licenseStatus}. Please contact support for assistance.</AlertDescription>
        </Alert>
      );
    }
    
    if (expiryDate && new Date() > expiryDate) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>License Expired</AlertTitle>
          <AlertDescription>Your license expired on {formatExpiryDate(expiryDate)}. Please renew your subscription.</AlertDescription>
        </Alert>
      );
    }
    
    if (accountsLocked) {
      return (
        <Alert variant="default" className="mb-6 border-amber-500">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Account Management Locked</AlertTitle>
          <AlertDescription>Your account management has been locked by an administrator. Please contact support.</AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };
  
  return (
    <main className="flex-1 p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-8">
        <section className="space-y-4">
          <h1 className="text-4xl font-bold text-softWhite">License Key Management</h1>
          <p className="text-mediumGray text-lg max-w-2xl">
            Manage your license key and authorized MT4 account numbers here.
            You can add up to {maxAccounts} MT4 accounts with your license.
          </p>
        </section>
        
        <LicenseStatusWarning />
        
        {expiryDate && licenseStatus === 'active' && new Date() <= expiryDate && (
          <Alert className="mb-6 border-blue-500 bg-darkBlue/30">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-500">License Information</AlertTitle>
            <AlertDescription>Your license is valid until: {formatExpiryDate(expiryDate)}</AlertDescription>
          </Alert>
        )}
        
        <Alert variant="default" className="mb-6 border-amber-500 bg-darkBlue/30">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Important MT4 Configuration</AlertTitle>
          <AlertDescription className="text-mediumGray">
            Make sure to add the validation URL to MT4's allowed URLs list:
            <br />
            Tools -&gt; Options -&gt; Expert Advisors -&gt; "Allow WebRequest for listed URL"
            <br />
            Add this URL: <span className="font-mono text-xs bg-black/30 px-1 py-0.5 rounded">https://qzbwxtegqsusmfwjauwh.supabase.co/functions/v1/validate-license</span>
          </AlertDescription>
        </Alert>
        
        <div 
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          <div className="relative z-10 space-y-4">
            <h2 className="text-xl font-semibold text-softWhite mb-4">Your License Key</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-darkGrey/50 p-4 border border-silver/20 font-mono text-lg text-softWhite rounded-lg">
                {licenseKey}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCopyKey}
                className="h-12 w-12"
              >
                {isCopied ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-sm text-mediumGray">
              Use this key to activate your Expert Advisor. Keep your license key secure.
            </p>
          </div>
        </div>
        
        <div 
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-xl font-semibold text-softWhite mb-4">MT4 Account Numbers</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Enter MT4 account number"
                  value={newAccount}
                  onChange={(e) => setNewAccount(e.target.value)}
                  className="flex-1 bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500"
                  disabled={!canAddAccounts || accountsLocked || accountNumbers.length >= maxAccounts}
                />
                <Button 
                  onClick={handleAddAccount}
                  disabled={!canAddAccounts || accountsLocked || accountNumbers.length >= maxAccounts}
                  className="min-w-[100px]"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              {!canAddAccounts && (
                <Alert variant="default" className="border-amber-500 bg-darkBlue/30">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-500">
                    Adding account numbers has been disabled for your license. Please contact support.
                  </AlertDescription>
                </Alert>
              )}
              
              {accountNumbers.length === 0 ? (
                <div className="text-center p-6 text-mediumGray bg-darkGrey/20 rounded-lg border border-silver/10">
                  No account numbers added yet. Add up to {maxAccounts} MT4 account numbers.
                </div>
              ) : (
                <div className="space-y-3">
                  {accountNumbers.map((account, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-darkGrey/30 border border-silver/20 rounded-lg hover:bg-darkGrey/40 transition-colors"
                    >
                      <span className="font-mono text-softWhite">{account}</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveAccount(account)}
                        disabled={!canRemoveAccounts || accountsLocked}
                        className="rounded-full hover:bg-red-500/20 hover:text-red-400"
                      >
                        <XCircle className="h-5 w-5 text-accent-red" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-right text-sm text-mediumGray">
                    {accountNumbers.length} of {maxAccounts} accounts used
                  </div>
                </div>
              )}
              
              {!canRemoveAccounts && accountNumbers.length > 0 && (
                <Alert variant="default" className="border-amber-500 bg-darkBlue/30">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-500">
                    Removing account numbers has been disabled for your license. Please contact support.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
        
        <div 
          className="relative overflow-hidden rounded-2xl p-6 mb-6"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          <div className="relative z-10 space-y-4">
            <h2 className="text-xl font-semibold text-softWhite mb-4">Instructions</h2>
            <ol className="list-decimal list-inside space-y-3 text-mediumGray">
              <li className="p-2 rounded-lg hover:bg-darkGrey/20 transition-colors">Copy your license key from above</li>
              <li className="p-2 rounded-lg hover:bg-darkGrey/20 transition-colors">Paste the key into your Expert Advisor's LicenseKey variable</li>
              <li className="p-2 rounded-lg hover:bg-darkGrey/20 transition-colors">Add your MT4 account numbers (up to {maxAccounts}) to authorize them</li>
              <li className="p-2 rounded-lg hover:bg-darkGrey/20 transition-colors">The EA will only work on authorized accounts</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LicenseKey;
