import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

type MtAccount = {
  id: string;
  login: string;
  broker: string;
  platform: "MT4" | "MT5";
  created_at: string;
};

export default function AccountsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<MtAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ platform: "MT4" as "MT4" | "MT5", login: "", password: "", broker: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const loadAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Use the active_mt_accounts view which excludes deleted accounts
      const { data, error } = await supabase
        .from("active_mt_accounts")
        .select("id,login,broker,platform,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      console.log('Available accounts:', data);
      
      setAccounts(data || []);
      console.log('State updated with accounts:', data?.length);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: inserted, error } = await supabase
        .from("mt_accounts")
        .insert({
          user_id: user.id,
          login: form.login,
          broker: form.broker,
          platform: form.platform,
        })
        .select("id").limit(1);
      if (error) {
        console.error("Supabase insert error:", error);
        toast({ title: "Failed to add account", description: error.message || "Unknown error", variant: "destructive" });
        return;
      }
      toast({ title: "Account added", description: `${form.platform} ${form.login}` });
      setForm({ platform: "MT4", login: "", password: "", broker: "" });
      setShowAddForm(false);
      
      // Update accounts list with the new account
      const { data } = await supabase
        .from("active_mt_accounts")
        .select("id,login,broker,platform,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setAccounts(data || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("Add account exception:", e);
      toast({ title: "Failed to add account", description: msg, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleDeleteAccount = async (accountId: string, accountLogin: string) => {
    console.log('Delete function called with:', { accountId, accountLogin });
    
    if (!confirm(`Are you sure you want to delete account ${accountLogin}? This will permanently remove all data for this account and prevent it from being recreated automatically.`)) {
      console.log('User cancelled deletion');
      return;
    }

    try {
      console.log('Attempting to delete account using complete deletion function...');
      
      // Use the new complete deletion function
      const { data, error } = await supabase.rpc('delete_mt_account_complete', {
        account_id: accountId
      });
      
      if (error) {
        console.error('Database delete error:', error);
        toast({ 
          title: "Error", 
          description: `Failed to delete account: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      if (!data) {
        console.error('Account not found or already deleted');
        toast({ 
          title: "Error", 
          description: "Account not found or already deleted.",
          variant: "destructive"
        });
        return;
      }

      console.log('Account deleted successfully using complete deletion function');

      // Immediately remove the account from the local state
      setAccounts(prevAccounts => {
        const updatedAccounts = prevAccounts.filter(acc => acc.id !== accountId);
        console.log('Local state updated, removed account:', accountLogin);
        return updatedAccounts;
      });

      toast({ 
        title: "Account deleted", 
        description: `Account ${accountLogin} has been permanently deleted. It cannot be recreated automatically.`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Delete account exception:', error);
      toast({ 
        title: "Error", 
        description: "Failed to delete account. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) return <main className="flex-1" />;

  const showEmpty = accounts.length === 0;
  console.log('Render state - accounts count:', accounts.length, 'showEmpty:', showEmpty, 'showAddForm:', showAddForm);

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8">
      <div className="grid gap-6">
        <section 
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Accounts</h1>
            <p className="text-white/70 mt-2">Connect your MT4/MT5 accounts. When none are linked, the login form appears.</p>
          </div>
        </section>

        {/* EA Download Section */}
        <section 
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          <div className="relative z-10 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white mb-2">Account Sync Expert Advisor</h2>
              <p className="text-white/70 text-sm">Download and install the sync EA to automatically sync your account data with PlatinumAi.</p>
            </div>
            
            <div className="mb-6">
              {/* MT4 EA */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 max-w-md">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">MT4 Sync EA</h3>
                    <p className="text-xs text-white/60">For MetaTrader 4</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-blue-400 text-xs font-bold">4</span>
                  </div>
                </div>
                <a 
                  href="https://qzbwxtegqsusmfwjauwh.supabase.co/storage/v1/object/public/expert-advisors/MT4%20sync%20EA.ex4" 
                  download="MT4 sync EA.ex4"
                  className="inline-flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download MT4 EA
                </a>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="font-semibold text-white mb-3">Installation Instructions</h3>
              <ol className="text-sm text-white/80 space-y-2">
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">1.</span>
                  <span>Download the MT4 Sync EA file</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">2.</span>
                  <span>Open MetaTrader 4 and go to <strong>File → Open Data Folder</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">3.</span>
                  <span>Navigate to <strong>MQL4/Experts</strong> folder</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">4.</span>
                  <span>Copy the downloaded EA file to this folder</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">5.</span>
                  <span>Restart MetaTrader 4 or refresh the Navigator panel</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">6.</span>
                  <span>Drag the EA from the Navigator to any chart</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">7.</span>
                  <span>Enable <strong>AutoTrading</strong> and <strong>Allow DLL imports</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">8.</span>
                  <span>The EA will automatically sync your account data with PlatinumAi</span>
                </li>
              </ol>
              
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-300">
                  <strong>Important:</strong> Make sure AutoTrading is enabled and the EA is running on at least one chart for continuous data synchronization.
                </p>
              </div>
            </div>

            {/* Web Request Configuration */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 mt-4">
              <h3 className="font-semibold text-white mb-3">Web Request Configuration</h3>
              <p className="text-sm text-white/80 mb-3">
                To enable the EA to send data to PlatinumAi, you need to add our server URL to MetaTrader's web request settings.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-3">
                <p className="text-sm text-blue-300 font-mono break-all">
                  <strong>Server URL:</strong><br />
                  https://qzbwxtegqsusmfwjauwh.supabase.co/
                </p>
              </div>
              <ol className="text-sm text-white/80 space-y-2">
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">1.</span>
                  <span>In MetaTrader 4, go to <strong>Tools → Options</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">2.</span>
                  <span>Click on the <strong>Expert Advisors</strong> tab</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">3.</span>
                  <span>Check <strong>"Allow WebRequest for listed URL"</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">4.</span>
                  <span>Click <strong>"Add"</strong> and paste the URL above</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-400 font-bold">5.</span>
                  <span>Click <strong>"OK"</strong> to save the settings</span>
                </li>
              </ol>
              
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-300">
                  <strong>Security Note:</strong> Only add trusted URLs to the web request list. This URL is secure and necessary for data synchronization.
                </p>
              </div>
            </div>
          </div>
        </section>

        {(showEmpty || showAddForm) && (
          <div 
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
            <div className="relative z-10 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">Link MT4/MT5 account</h2>
              </div>
              <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-4 items-end">
                <div>
                  <label className="text-xs text-white/70">Platform</label>
                  <select className="w-full bg-white/10 border border-white/20 text-white rounded px-2 py-2 text-sm backdrop-blur-sm" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as "MT4" | "MT5" })}>
                    <option value="MT4">MT4</option>
                    <option value="MT5">MT5</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/70">Login</label>
                  <Input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} required placeholder="Account number" className="bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm" />
                </div>
                <div>
                  <label className="text-xs text-white/70">Password</label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Investor password" className="bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm" />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-xs text-white/70">Broker/Server</label>
                  <Input value={form.broker} onChange={(e) => setForm({ ...form, broker: e.target.value })} required placeholder="Broker server name" className="bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm" />
                </div>
                <div className="sm:col-span-4 flex gap-2">
                  <Button type="submit" disabled={submitting} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm">{submitting ? "Linking..." : "Link Account"}</Button>
                  {!showEmpty && (
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="bg-white/5 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">Cancel</Button>
                  )}
                </div>
              </form>
              <p className="text-xs text-white/60 mt-2">Note: In production, never store trader passwords directly; use a secure bridge.</p>
            </div>
          </div>
        )}

        {!showEmpty && (
          <div 
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
            <div className="relative z-10 p-6">
              <div className="flex flex-row items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Linked accounts</h2>
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddForm(true)} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm">Add Account</Button>
                </div>
              </div>
              <ul className="grid gap-2">
                {accounts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-white/20 p-3 text-sm hover:bg-white/10 transition-colors backdrop-blur-sm"
                  >
                    <div>
                      <div className="font-medium text-white">{a.platform} • {a.login}</div>
                      <div className="text-white/70">{a.broker}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          console.log('View button clicked for account:', a.login);
                          navigate(`/dashboard?accountId=${encodeURIComponent(a.login)}`); 
                        }} 
                        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm"
                      >
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => { 
                          console.log('Delete button clicked for account:', a.login);
                          e.stopPropagation(); 
                          handleDeleteAccount(a.id, a.login); 
                        }} 
                        className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400 text-white/70 hover:text-red-400 transition-colors"
                        aria-label={`Delete account ${a.login}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


