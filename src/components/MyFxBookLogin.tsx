import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { MyFxBookAccountsResponse, MyFxBookAccount, MyFxBookWatchedAccountsResponse, MyFxBookWatchedAccount } from "@/types/myfxbook";

interface MyFxBookResponse {
  error: boolean;
  message: string;
  session?: string;
}

const MyFxBookLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accounts, setAccounts] = useState<MyFxBookAccount[]>([]);
  const [watchedAccounts, setWatchedAccounts] = useState<MyFxBookWatchedAccount[]>([]);
  const [showMaxAttemptsDialog, setShowMaxAttemptsDialog] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();

  // Function to check if session is valid
  const checkSessionValidity = async () => {
    const session = localStorage.getItem("myfxbook_session");
    if (!session) return;

    try {
      console.log("Checking session validity...");
      const response = await fetch(
        `https://www.myfxbook.com/api/get-my-accounts.json?session=${encodeURIComponent(session)}`
      );

      if (!response.ok) {
        throw new Error("Session invalid");
      }

      const data: MyFxBookAccountsResponse = await response.json();
      
      if (!data.error) {
        console.log("Session valid, logging in...");
        setIsLoggedIn(true);
        setAccounts(data.accounts);
        fetchWatchedAccounts();
        setIsPolling(false); // Stop polling once logged in
        setShowMaxAttemptsDialog(false); // Close the dialog
        toast({
          title: "Success",
          description: "Successfully logged in to MyFxBook",
        });
      }
    } catch (error) {
      console.error("Error checking session:", error);
    }
  };

  // Start polling when max attempts reached
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (isPolling) {
      console.log("Starting polling...");
      pollInterval = setInterval(checkSessionValidity, 5000); // Check every 5 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isPolling]);

  const fetchAccounts = async () => {
    const session = localStorage.getItem("myfxbook_session");
    if (!session) return;

    try {
      const response = await fetch(
        `https://www.myfxbook.com/api/get-my-accounts.json?session=${encodeURIComponent(session)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const data: MyFxBookAccountsResponse = await response.json();

      if (!data.error) {
        setAccounts(data.accounts);
      } else {
        throw new Error(data.message || "Failed to fetch accounts");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch accounts",
      });
    }
  };

  const fetchWatchedAccounts = async () => {
    const session = localStorage.getItem("myfxbook_session");
    if (!session) return;

    try {
      const response = await fetch(
        `https://www.myfxbook.com/api/get-watched-accounts.json?session=${encodeURIComponent(session)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch watched accounts");
      }

      const data: MyFxBookWatchedAccountsResponse = await response.json();

      if (!data.error) {
        setWatchedAccounts(data.accounts);
      } else {
        throw new Error(data.message || "Failed to fetch watched accounts");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch watched accounts",
      });
    }
  };

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      const session = localStorage.getItem("myfxbook_session");
      if (!session) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const response = await fetch(
          `https://www.myfxbook.com/api/get-my-accounts.json?session=${encodeURIComponent(session)}`
        );

        if (!response.ok) {
          throw new Error("Session expired");
        }

        const data: MyFxBookAccountsResponse = await response.json();
        
        if (!data.error) {
          setIsLoggedIn(true);
          setAccounts(data.accounts);
          fetchWatchedAccounts();
        } else {
          localStorage.removeItem("myfxbook_session");
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        localStorage.removeItem("myfxbook_session");
        setIsLoggedIn(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Fix: Remove the colon from the URL
      const response = await fetch(
        `https://www.myfxbook.com/api/login.json?email=${encodeURIComponent(
          email
        )}&password=${encodeURIComponent(password)}`
      );

      if (!response.ok) {
        throw new Error("Failed to login");
      }

      const data: MyFxBookResponse = await response.json();

      if (!data.error && data.session) {
        localStorage.setItem("myfxbook_session", data.session);
        setIsLoggedIn(true);
        toast({
          title: "Success",
          description: "Successfully logged in to MyFxBook",
        });
        fetchAccounts();
        fetchWatchedAccounts();
      } else {
        if (data.message.toLowerCase().includes("max login attempts reached")) {
          setShowMaxAttemptsDialog(true);
          setIsPolling(true);
          console.log("Max attempts reached, starting polling...");
        } else {
          throw new Error(data.message || "Failed to login");
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const session = localStorage.getItem("myfxbook_session");
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://www.myfxbook.com/api/logout.json?session=${encodeURIComponent(session)}`
      );

      if (!response.ok) {
        throw new Error("Failed to logout");
      }

      const data: MyFxBookResponse = await response.json();

      if (!data.error) {
        localStorage.removeItem("myfxbook_session");
        setIsLoggedIn(false);
        setAccounts([]);
        setWatchedAccounts([]);
        toast({
          title: "Success",
          description: data.message || "Successfully logged out",
        });
      } else {
        throw new Error(data.message || "Failed to logout");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to logout",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountClick = (account: MyFxBookAccount) => {
    navigate(`/dashboard?accountId=${encodeURIComponent(account.id)}`, { 
      state: { 
        selectedAccount: {
          id: account.id,
          name: account.name,
          balance: account.balance,
          equity: account.equity,
          profit: account.profit,
          gain: account.gain,
          demo: account.demo,
          currency: account.currency
        }
      }
    });
  };

  if (isLoggedIn) {
    return (
      <div className="space-y-6">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>MyFxBook Accounts</CardTitle>
            <Button 
              onClick={handleLogout} 
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? "Logging out..." : "Logout"}
            </Button>
          </CardHeader>
          <CardContent>
            {accounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Equity</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Gain</TableHead>
                    <TableHead>Demo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow 
                      key={account.id}
                      onClick={() => handleAccountClick(account)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.balance.toFixed(2)} {account.currency}</TableCell>
                      <TableCell>{account.equity.toFixed(2)} {account.currency}</TableCell>
                      <TableCell>{account.profit.toFixed(2)} {account.currency}</TableCell>
                      <TableCell>{account.gain.toFixed(2)}%</TableCell>
                      <TableCell>{account.demo ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No trading accounts connected</p>
            )}
          </CardContent>
        </Card>

        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Watched Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {watchedAccounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Gain</TableHead>
                    <TableHead>Drawdown</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Demo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watchedAccounts.map((account, index) => (
                    <TableRow key={index}>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.gain.toFixed(2)}%</TableCell>
                      <TableCell>{account.drawdown.toFixed(2)}%</TableCell>
                      <TableCell>{account.change.toFixed(2)}%</TableCell>
                      <TableCell>{account.demo ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No watched accounts</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>MyFxBook Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showMaxAttemptsDialog} onOpenChange={setShowMaxAttemptsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Maximum Login Attempts Reached</AlertDialogTitle>
            <AlertDialogDescription>
              You have reached the maximum number of login attempts. Please try logging in directly through the MyFxBook website.
              We'll automatically detect when you've logged in successfully.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Button
                onClick={() => {
                  window.open('https://www.myfxbook.com/login', '_blank');
                }}
              >
                Go to MyFxBook
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyFxBookLogin;